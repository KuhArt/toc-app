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
  return process.env.SUPPORT_EMAIL || "help@pompych.com";
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
  const safeAppUrl = appUrl ? escapeHtml(appUrl) : "";
  const supportEmail = getSupportEmail();
  const safeSupportEmail = escapeHtml(supportEmail);
  const appLink = safeAppUrl
    ? `<p><a href="${safeAppUrl}">Open Tocito</a></p>`
    : "";

  return sendEmail({
    to,
    subject: "Welcome to Tocito",
    html: `
      <p>Hi ${safeShopName},</p>
      <p>Thanks for installing Tocito.</p>
      <p>Configure your table of contents in the app, then enable the app embed in the Shopify theme editor.</p>
      ${appLink}
      <p>If you need help, reply to this email or contact ${safeSupportEmail}.</p>
    `,
    text: [
      `Hi ${shopName || "there"},`,
      "",
      "Thanks for installing Tocito.",
      "Configure your table of contents in the app, then enable the app embed in the Shopify theme editor.",
      appUrl ? `Open Tocito: ${appUrl}` : "",
      `If you need help, reply to this email or contact ${supportEmail}.`,
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
    subject: "Tocito was uninstalled",
    html: `
      <p>Hi ${safeShopName},</p>
      <p>Tocito has been removed from your store.</p>
      <p>The table of contents app embed will no longer run on your article pages.</p>
      <p>If something did not work as expected, reply to this email or contact ${safeSupportEmail}.</p>
    `,
    text: [
      `Hi ${shopName || "there"},`,
      "",
      "Tocito has been removed from your store.",
      "The table of contents app embed will no longer run on your article pages.",
      `If something did not work as expected, reply to this email or contact ${supportEmail}.`,
    ].join("\n"),
  });
}
