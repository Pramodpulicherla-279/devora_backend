const nodemailer = require('nodemailer');
const dns = require('dns').promises;

// Created once at startup — reuses the SMTP connection pool instead of
// handshaking on every forgot-password request.
let transporter = null;

// Build the transporter, pinning the SMTP host to an IPv4 address.
//
// Why: cloud hosts like Render have an IPv6 network interface but NO global
// IPv6 route. nodemailer resolves smtp.gmail.com to both A (IPv4) and AAAA
// (IPv6) records and picks one at RANDOM — when it picks the IPv6 address the
// connection fails with `ENETUNREACH`. Resolving to IPv4 ourselves and passing
// the literal IP (with `servername` for TLS SNI + cert validation) avoids it.
async function buildTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  let host = 'smtp.gmail.com';
  try {
    const ipv4 = await dns.resolve4('smtp.gmail.com');
    if (ipv4 && ipv4.length) host = ipv4[0];
  } catch (_e) {
    // DNS resolve4 failed — fall back to the hostname (nodemailer resolves it)
  }

  return nodemailer.createTransport({
    host,             // IPv4 literal (or hostname fallback)
    port: 465,
    secure: true,     // SSL
    pool: true,       // keep connections alive between sends
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Required when host is an IP literal: TLS SNI + certificate is validated
    // against smtp.gmail.com, not the bare IP.
    tls: { servername: 'smtp.gmail.com' },
    // Fail fast instead of hanging if the host blocks/throttles outbound SMTP
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) transporter = await buildTransporter();
  await transporter.sendMail({
    from: `"Dev.EL" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
