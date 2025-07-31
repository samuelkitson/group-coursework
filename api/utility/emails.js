const nodemailer = require("nodemailer");
const { BASE_URL, SMTP_SERVER, SMTP_PORT, SMTP_SECURE, SMTP_FROM_ADDRESS } = process.env;
const { InvalidParametersError, ConfigurationError, CustomError } = require("../errors/errors");
const ejs = require("ejs");
const path = require("path");

/**
 * In any function that needs to send emails, first check that email sending is
 * ready. Do this with an await call like: await emails.emailsReady;
 */

const homePageLink = `<a href='${BASE_URL}'>${BASE_URL}</a>`;

const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: SMTP_PORT,
  secure: SMTP_SECURE === "true",
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  rateLimit: 5,
});

const transporterReadyPromise = new Promise((resolve) => {
  transporter.verify(function(error, success) {
    if (error) {
      console.error(`Failed to connect to SMTP server on ${SMTP_SERVER}. Error: ${error}`);
      resolve(false);
    } else {
      console.log(`Connected to SMTP server on ${SMTP_SERVER}`);
      resolve(true);
    }
  });
});

const sendGenericEmail = async ({ recipientEmail, recipientName, replyToEmail, subject, headerText, bodyText, templateId, redHeader, }) => {
  const ready = await transporterReadyPromise;
  if (!ready) throw new CustomError("Email sending not configured", 500);
  if (!subject || !recipientEmail || !headerText || !bodyText)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const headerColour = redHeader ? "#B11717" : "#005C84";
  const rendered = await ejs.renderFile(
    path.join(__dirname, "..", "views", "emails", "genericEmail.ejs"),
    { recipientEmail, recipientName, headerText, bodyText, templateId: templateId ?? "0-00", headerColour, },
  );
  const mailOptions = {
    from: SMTP_FROM_ADDRESS,
    replyTo: replyToEmail,
    to: recipientEmail,
    subject,
    html: rendered,
  };
  transporter.sendMail(mailOptions);
};

/**
 * Email are sent based on the templates below, each of which has an identifier.
 * The format is X-YY, where X is the email category and YY is the specific
 * template. The email categories are based on their triggers and are:
 *   * 1: security event
 *   * 2: assignment configuration change
 *   * 3: team configuration change
 */

const newSupervisorPlaceholderEmail = ({ supervisorEmail, staffUserEmail, assignmentName, }) => {
  const templateId = "2-01";
  if (!supervisorEmail || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `You've been added as a supervisor on ${assignmentName}.<br />This group coursework is managed using a web-based system. Please go to ${homePageLink} to activate your account and get started.`;
  sendGenericEmail({ recipientEmail: supervisorEmail, replyToEmail: staffUserEmail, subject: "Activate your supervisor account", headerText: "Activate your supervisor account", bodyText, templateId, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

const newSupervisorExistingEmail = ({ supervisorEmail, supervisorName, staffUserEmail, assignmentName, }) => {
  const templateId = "2-02";
  if (!supervisorEmail || !supervisorName || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `You've been added as a supervisor on ${assignmentName}.<br />You already have an account on the group coursework management system. When they're ready, you'll be able to view your teams at ${homePageLink}.`;
  sendGenericEmail({ recipientEmail: supervisorEmail, recipientName: supervisorName, replyToEmail: staffUserEmail, subject: "You've been added as a supervisor", headerText: "You've been added as a supervisor", bodyText, templateId, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

module.exports = {
  emailTransporter: transporter,
  emailsReady: transporterReadyPromise,
  sendGenericEmail,
  newSupervisorPlaceholderEmail,
  newSupervisorExistingEmail,
};
