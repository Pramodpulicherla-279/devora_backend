const nodemailer = require('nodemailer');
const dns = require('dns').promises;

// ── Transport selection ──────────────────────────────────────────────
// Production (Render) blocks outbound SMTP, so we send over Brevo's HTTPS
// API (port 443) when BREVO_API_KEY is set. Localhost has no key and falls
// back to Gmail SMTP, which works fine there.

// ── Brevo HTTP API ───────────────────────────────────────────────────
async function sendViaBrevo({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Dev.EL', email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Brevo API ${res.status}: ${detail}`);
  }
}

// ── Gmail SMTP (localhost fallback) ──────────────────────────────────
// Created once — reuses the SMTP connection pool. Host is pinned to IPv4
// because some networks resolve smtp.gmail.com to an unroutable IPv6.
let transporter = null;

async function buildTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  let host = 'smtp.gmail.com';
  try {
    const ipv4 = await dns.resolve4('smtp.gmail.com');
    if (ipv4 && ipv4.length) host = ipv4[0];
  } catch (_e) {
    // resolve4 failed — fall back to the hostname
  }

  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    pool: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { servername: 'smtp.gmail.com' }, // SNI + cert validation when host is an IP
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

async function sendViaSmtp({ to, subject, html }) {
  if (!transporter) transporter = await buildTransporter();
  await transporter.sendMail({
    from: `"Dev.EL" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo({ to, subject, html });
  }
  return sendViaSmtp({ to, subject, html });
};

module.exports = sendEmail;
