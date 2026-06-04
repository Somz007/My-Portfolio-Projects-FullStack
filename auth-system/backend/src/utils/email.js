// ─────────────────────────────────────────────────────────────
//  utils/email.js
//  Nodemailer email sender with automatic Ethereal test account.
//
//  HOW ETHEREAL WORKS IN DEVELOPMENT:
//  Ethereal is a free fake SMTP service — it accepts emails and
//  displays them at https://ethereal.email/messages. Nothing is
//  actually delivered to a real inbox. We auto-create a test
//  account on first use and log a preview URL after each send,
//  so you can click it and read the email (including the reset link).
//
//  TO USE A REAL EMAIL SERVICE:
//  Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env.
//  Works with Gmail (use an App Password), SendGrid, Mailgun, etc.
// ─────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

// Module-level transporter — created once, reused for all sends.
let _transporter = null;

/**
 * Lazily create the Nodemailer transporter.
 * In development (EMAIL_USER not set): auto-create an Ethereal test account.
 * In production: use the SMTP credentials from .env.
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER) {
    // Auto-create a free Ethereal test account.
    const testAccount = await nodemailer.createTestAccount();
    console.log('─── Ethereal test account created ───────────────────');
    console.log('  User:', testAccount.user);
    console.log('  Pass:', testAccount.pass);
    console.log('  Inbox: https://ethereal.email/messages');
    console.log('─────────────────────────────────────────────────────');
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return _transporter;
}

/**
 * Core send function. Logs the Ethereal preview URL in development
 * so you can see the email without a real inbox.
 */
async function sendEmail({ to, subject, html }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Auth System" <noreply@authsystem.dev>',
    to,
    subject,
    html,
  });

  // Ethereal returns a preview URL — log it so the developer can click it.
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\nEmail preview URL:', previewUrl, '\n');
  }

  // Attach the preview URL to the info object so controllers can
  // return it in the response during development (never in production).
  info._etherealPreview = previewUrl || null;
  return info;
}

/**
 * Send a password reset email.
 * @param {string} to   — recipient email address
 * @param {string} resetUrl — full URL with raw token, e.g.
 *   http://localhost:5174/reset-password?token=abc123&email=user@example.com
 */
async function sendPasswordResetEmail(to, resetUrl) {
  const expiryMin = process.env.RESET_TOKEN_EXPIRES_MIN || 10;
  return sendEmail({
    to,
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Reset your password</h2>
        <p style="color:#555;margin-bottom:24px;">
          You requested a password reset. Click the button below to choose a new password.
          This link expires in <strong>${expiryMin} minutes</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#7c6af7;color:#fff;padding:12px 24px;
                  border-radius:6px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">
          If you didn't request this, you can safely ignore this email.
          Your password won't change until you click the link above.
        </p>
        <p style="color:#aaa;font-size:11px;">
          Or copy this URL: <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}

/**
 * Send an email verification email.
 * @param {string} to
 * @param {string} verifyUrl — full URL with raw token
 */
async function sendVerificationEmail(to, verifyUrl) {
  return sendEmail({
    to,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:8px;">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px;">
          Thanks for signing up! Click below to verify your email address.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#7c6af7;color:#fff;padding:12px 24px;
                  border-radius:6px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
        <p style="color:#aaa;font-size:11px;margin-top:16px;">
          Or copy: <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
