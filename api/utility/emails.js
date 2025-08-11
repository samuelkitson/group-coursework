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

const sendGenericEmail = async ({ recipientEmail, recipientName, replyToEmail, subject, headerText, bodyText, templateId, redHeader, bccMode=false, }) => {
  const ready = await transporterReadyPromise;
  if (!ready) throw new CustomError("Email sending not configured", 500);
  if (!subject || !recipientEmail || !headerText || !bodyText)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const headerColour = redHeader ? "#B11717" : "#005C84";
  const rendered = await ejs.renderFile(
    path.join(__dirname, "..", "views", "emails", "genericEmail.ejs"),
    { recipientName, headerText, bodyText, templateId: templateId ?? "0-00", headerColour, },
  );
  const mailOptions = {
    from: SMTP_FROM_ADDRESS,
    replyTo: replyToEmail,
    subject,
    html: rendered,
  };
  if (bccMode) {
    mailOptions.to = "Undisclosed Recipients";
    mailOptions.bcc = recipientEmail;
  } else {
    mailOptions.to = recipientEmail;
  }
  transporter.sendMail(mailOptions);
};

/**
 * Email are sent based on the templates below, each of which has an identifier.
 * The format is X-YY, where X is the email category and YY is the specific
 * template. The email categories are based on their triggers and are:
 *   * 1: security event
 *   * 2: assignment configuration change
 *   * 3: team allocation change
 *   * 4: automatic time-based reminders
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

const questionnaireAvailableEmail = ({ recipients, staffUserEmail, assignmentName, }) => {
  const templateId = "2-03";
  if (!recipients || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `It's time to complete the allocation questionnaire for ${assignmentName}. This only takes a few minutes to complete and helps us create fairer teams that are more likely to work well.<br/><br/>Please log in at ${homePageLink} to answer the questions within the next few days.`;
  sendGenericEmail({ recipientEmail: recipients, replyToEmail: staffUserEmail, subject: "Action needed: allocation questionnaire available", headerText: "Allocation questionnaire", bodyText, templateId, bccMode: true, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

const newLecturerExistingEmail = ({ newStaffEmail, newStaffName, staffUserEmail, assignmentName, }) => {
  const templateId = "2-04";
  if (!newStaffEmail || !newStaffName || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `You've been added as a lecturer on ${assignmentName}.<br />You already have an account, so you just need to log in at ${homePageLink}. From that page you'll be able to help configure the assignment, add students, view teams' progress and more.`;
  sendGenericEmail({ recipientEmail: newStaffEmail, recipientName: newStaffName, replyToEmail: staffUserEmail, subject: "You've been added as a lecturer", headerText: "You've been added as a lecturer", bodyText, templateId, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

const teamsReleasedStudentEmail = ({ recipients, staffUserEmail, assignmentName, }) => {
  const templateId = "3-01";
  if (!recipients || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `The teams for ${assignmentName} have been allocated and are now available to view at ${homePageLink}. Please meet with your team as soon as possible and report any issues with contacting them to the module team.`;
  sendGenericEmail({ recipientEmail: recipients, replyToEmail: staffUserEmail, subject: `Team allocations released for ${assignmentName}`, headerText: "Team allocations released", bodyText, templateId, bccMode: true, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

const teamsAllocatedToSupervisorsEmail = ({ recipients, staffUserEmail, assignmentName, }) => {
  const templateId = "3-02";
  if (!recipients || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `The teams for ${assignmentName} have been allocated and you can see who you're supervising at ${homePageLink}. Please meet with all of your teams as soon as possible and report any issues with contacting them to the module team.`;
  sendGenericEmail({ recipientEmail: recipients, replyToEmail: staffUserEmail, subject: `Team allocations released for ${assignmentName}`, headerText: "Team allocations released", bodyText, templateId, bccMode: true, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

/**
 * Recipients should be a list of emails.
 */
const checkInReminderEmails = ({ recipients, staffUserEmail, assignmentName, deadlineDate, }) => {
  const templateId = "4-01";
  if (!recipients || !staffUserEmail || !assignmentName)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const bodyText = `Please remember to complete this week's check-in for ${assignmentName}. It's important to complete these regularly to review the workload balance in your team and help staff decide marks fairly.<br />Please go to ${homePageLink} to complete the check-in before ${deadlineDate ?? "the deadline"}.`;
  sendGenericEmail({ recipientEmail: recipients, replyToEmail: staffUserEmail, subject: "Reminder: complete your weekly check-in", headerText: "Check-in to complete", bodyText, templateId, bccMode: true, })
    .catch(err => {console.error(`Failed to send email ${templateId}: ${err}`)});
};

module.exports = {
  emailTransporter: transporter,
  emailsReady: transporterReadyPromise,
  sendGenericEmail,
  newSupervisorPlaceholderEmail,
  newSupervisorExistingEmail,
  questionnaireAvailableEmail,
  newLecturerExistingEmail,
  checkInReminderEmails,
  teamsReleasedStudentEmail,
  teamsAllocatedToSupervisorsEmail,
};
