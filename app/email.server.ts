import { Resend } from "resend";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  resend = resend || new Resend(process.env.RESEND_API_KEY);

  return resend;
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!domain) {
    return "[invalid-email]";
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

export function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || "tocito@pompych.com";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const client = getResend();
  const from = getEmailFrom();

  console.log("Email send requested", {
    subject,
    to: maskEmail(to),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(from),
  });

  if (!client || !from) {
    console.warn("Skipping email because RESEND_API_KEY or EMAIL_FROM is not set.");
    return false;
  }

  console.log("Calling Resend email API", { subject, to: maskEmail(to) });

  const response = await client.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (response.error) {
    console.error("Resend email API returned an error", {
      subject,
      to: maskEmail(to),
      message: response.error.message,
    });
    throw new Error(response.error.message);
  }

  console.log("Resend email sent", {
    subject,
    to: maskEmail(to),
    id: response.data?.id,
  });

  return true;
}

export async function sendWelcomeEmail({
  to,
  shopName,
  appUrl,
}: {
  to: string;
  shopName?: string | null;
  appUrl?: string;
}) {
  const safeShopName = shopName ? escapeHtml(shopName) : "there";
  const trimmedAppUrl = appUrl?.replace(/\/$/, "");
  const safeAppUrl = trimmedAppUrl ? escapeHtml(trimmedAppUrl) : "";
  const safeDocsUrl = trimmedAppUrl ? escapeHtml(`${trimmedAppUrl}/docs`) : "";
  const supportEmail = getSupportEmail();
  const safeSupportEmail = escapeHtml(supportEmail);
  const appLink = safeAppUrl
    ? `<p><a href="${safeAppUrl}">Explore Tocito</a></p>`
    : "";
  const docsLink = safeDocsUrl
    ? `<p><a href="${safeDocsUrl}">Read the documentation</a></p>`
    : "";

  return sendEmail({
    to,
    subject: "Hello from Tocito",
    html: `
      <p>Hi ${safeShopName},</p>
      <p>Thank you for choosing Tocito.</p>
      <p>We hope Tocito satisfies your needs and helps your customers navigate your articles more easily.</p>
      ${appLink}
      ${docsLink}
      <p>If you need help, reply to this email or contact ${safeSupportEmail}.</p>
      <p>Have a good day and happy customers.</p>
    `,
    text: [
      `Hi ${shopName || "there"},`,
      "",
      "Thank you for choosing Tocito.",
      "We hope Tocito satisfies your needs and helps your customers navigate your articles more easily.",
      trimmedAppUrl ? `Explore Tocito: ${trimmedAppUrl}` : "",
      trimmedAppUrl ? `Read the documentation: ${trimmedAppUrl}/docs` : "",
      `If you need help, reply to this email or contact ${supportEmail}.`,
      "Have a good day and happy customers!",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendUninstallEmail({
  to,
  shopName,
}: {
  to: string;
  shopName?: string | null;
}) {
  const safeShopName = shopName ? escapeHtml(shopName) : "there";
  const supportEmail = getSupportEmail();
  const safeSupportEmail = escapeHtml(supportEmail);

  return sendEmail({
    to,
    subject: "Goodbye from Tocito",
    html: `
      <p>Hi ${safeShopName},</p>
      <p>Tocito has been removed from your store.</p>
      <p>Thank you for trying Tocito.</p>
      <p>If there is anything you would like us to add, reply to this email or write to ${safeSupportEmail}.</p>
      <p>Have a good day and happy customers!</p>
    `,
    text: [
      `Hi ${shopName || "there"},`,
      "",
      "Tocito has been removed from your store.",
      "Thank you for trying Tocito.",
      `If there is anything you would like us to add, reply to this email or write to ${supportEmail}.`,
      "Have a good day and happy customers.",
    ].join("\n"),
  });
}
