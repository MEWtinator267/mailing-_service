const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

async function renderTemplate(templateName, data) {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);
  return ejs.renderFile(filePath, data);
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();

  const info = await transport.sendMail({
    from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
    to,
    subject,
    html,
  });

  logger.info('Email sent', { messageId: info.messageId, to, subject });
  return info;
}

async function sendWelcomeEmail({ email, first_name, last_name, registered_at }) {
  const firstName = first_name || 'there';
  const registeredAt = registered_at
    ? new Date(registered_at).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  const html = await renderTemplate('welcome', {
    appName: config.app.name,
    dashboardUrl: config.app.dashboardUrl,
    logoUrl: config.app.logoUrl,
    firstName,
    lastName: last_name || '',
    email,
    registeredAt,
  });

  const subject = `Welcome to ${config.app.name}! 🎉`;
  return sendEmail({ to: email, subject, html });
}

async function sendOffersEmail({ email, name, offers }) {
  const html = await renderTemplate('offers', {
    appName: config.app.name,
    logoUrl: config.app.logoUrl,
    name: name || 'there',
    offers,
  });

  const subject = `Exclusive Offers Just for You 🎁`;
  return sendEmail({ to: email, subject, html });
}

module.exports = { sendWelcomeEmail, sendOffersEmail };
