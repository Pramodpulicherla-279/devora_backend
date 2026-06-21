const nodemailer = require('nodemailer');

// Created once at startup — reuses the SMTP connection pool instead of
// handshaking on every forgot-password request.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASS.');
  }
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL — faster than STARTTLS negotiation on 587
    pool: true,   // keep connections alive between sends
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Fail fast instead of hanging if the host blocks/throttles outbound SMTP
    connectionTimeout: 10000, // 10s to establish TCP connection
    greetingTimeout: 10000,   // 10s to receive SMTP greeting
    socketTimeout: 15000,     // 15s of socket inactivity
  });
  return transporter;
}

const sendEmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"Dev.EL" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
