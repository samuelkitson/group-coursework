const nodemailer = require("nodemailer");
const { SMTP_SERVER, SMTP_PORT, SMTP_SECURE, } = process.env;

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

/**
 * In any function that needs to send emails, first check that email sending is
 * ready. Do this with an await call like: await emails.emailsReady;
 */
module.exports = {
  emailTransporter: transporter,
  emailsReady: transporterReadyPromise,
};
