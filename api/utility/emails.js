const nodemailer = require("nodemailer");
const { SMTP_SERVER, SMTP_PORT, SMTP_SECURE, SMTP_FROM_ADDRESS } = process.env;
const { InvalidParametersError } = require("../errors/errors");
const ejs = require("ejs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: SMTP_PORT,
  secure: SMTP_SECURE === "true",
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

const sendGenericEmail = async ({ recipientEmail, recipientName, replyToEmail, subject, headerText, bodyText, }) => {
  if (!subject || !recipientEmail || !headerText || !bodyText)
    throw new InvalidParametersError("Missing required parameters to send email.");
  const rendered = await ejs.renderFile(
    path.join(__dirname, "..", "views", "emails", "genericEmail.ejs"),
    { recipientEmail, recipientName, headerText, bodyText, },
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
 * In any function that needs to send emails, first check that email sending is
 * ready. Do this with an await call like: await emails.emailsReady;
 */
module.exports = {
  emailTransporter: transporter,
  emailsReady: transporterReadyPromise,
  sendGenericEmail: sendGenericEmail,
};
