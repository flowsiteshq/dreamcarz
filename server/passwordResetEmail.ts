import nodemailer from "nodemailer";

const DEFAULT_APP_URL = "https://dreamcarz.io";

type PasswordResetEmailInput = {
  to: string;
  token: string;
};

function env(name: string) {
  return process.env[name]?.trim() || null;
}

export function getPasswordResetEmailStatus() {
  const enabled = process.env.PASSWORD_RESET_EMAIL_ENABLED === "true";
  const smtpUser = env("PASSWORD_RESET_SMTP_USER");
  const smtpAppPassword = env("PASSWORD_RESET_SMTP_APP_PASSWORD");
  const from = env("PASSWORD_RESET_FROM_EMAIL") || smtpUser;
  return {
    enabled,
    ready: enabled && Boolean(smtpUser && smtpAppPassword && from),
    provider: enabled ? "gmail_smtp" as const : "none" as const,
  };
}

export async function sendPasswordResetEmail({ to, token }: PasswordResetEmailInput) {
  const smtpUser = env("PASSWORD_RESET_SMTP_USER");
  const smtpAppPassword = env("PASSWORD_RESET_SMTP_APP_PASSWORD");
  const from = env("PASSWORD_RESET_FROM_EMAIL") || smtpUser;
  const status = getPasswordResetEmailStatus();
  if (!status.ready || !smtpUser || !smtpAppPassword || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const appUrl = env("PASSWORD_RESET_APP_URL") || DEFAULT_APP_URL;
  const resetUrl = `${appUrl.replace(/\/$/, "")}/admin?reset=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpAppPassword },
  });
  await transporter.sendMail({
    from: `DreamCarz <${from}>`,
    to,
    subject: "Reset your DreamCarz Administrator password",
    text: [
      "A password reset was requested for your DreamCarz Administrator account.",
      "",
      `Use this secure link within 30 minutes: ${resetUrl}`,
      "",
      "If you did not request this, you can safely ignore this email.",
      "DreamCarz Security",
    ].join("\n"),
  });
  return { sent: true as const };
}
