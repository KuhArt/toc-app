import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import db from "./db.server";
import { sendUninstallEmail, sendWelcomeEmail } from "./email.server";

type ShopDetails = {
  name?: string | null;
  email?: string | null;
  contactEmail?: string | null;
};

function getPrimaryEmail(shop: ShopDetails) {
  return shop.contactEmail || shop.email || null;
}

function maskEmail(email: string | null) {
  if (!email) {
    return null;
  }

  const [local, domain] = email.split("@");

  if (!domain) {
    return "[invalid-email]";
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

export async function recordAppInstalled({
  admin,
  shop,
}: {
  admin: AdminApiContext;
  shop: string;
}) {
  console.log("Install email flow started", { shop });

  const response = await admin.graphql(
    `#graphql
      query LoadShopEmailDetails {
        shop {
          name
          email
          contactEmail
        }
      }`,
  );
  const responseJson = await response.json();
  const shopDetails = (responseJson?.data?.shop || {}) as ShopDetails;
  const installedAt = new Date();
  const email = getPrimaryEmail(shopDetails);

  console.log("Loaded shop email details", {
    shop,
    name: shopDetails.name || null,
    email: maskEmail(shopDetails.email || null),
    contactEmail: maskEmail(shopDetails.contactEmail || null),
    primaryEmail: maskEmail(email),
  });

  const storedShop = await db.shop.upsert({
    where: { shop },
    create: {
      shop,
      name: shopDetails.name,
      email: shopDetails.email,
      contactEmail: shopDetails.contactEmail,
      installedAt,
      uninstalledAt: null,
    },
    update: {
      name: shopDetails.name,
      email: shopDetails.email,
      contactEmail: shopDetails.contactEmail,
      installedAt,
      uninstalledAt: null,
    },
  });

  console.log("Upserted shop install state", {
    shop,
    hadWelcomeEmailSentAt: Boolean(storedShop.welcomeEmailSentAt),
    installedAt,
  });

  if (!email || storedShop.welcomeEmailSentAt) {
    console.log("Skipping welcome email", {
      shop,
      reason: !email ? "missing-email" : "already-sent",
    });
    return;
  }

  try {
    const sent = await sendWelcomeEmail({
      to: email,
      shopName: shopDetails.name,
      appUrl: process.env.SHOPIFY_APP_URL,
    });

    if (sent) {
      await db.shop.update({
        where: { shop },
        data: { welcomeEmailSentAt: new Date() },
      });
      console.log("Recorded welcome email sent", { shop });
    }
  } catch (error) {
    console.error(`Failed to send welcome email for ${shop}`, error);
  }
}

export async function recordAppUninstalled(shop: string) {
  console.log("Uninstall email flow started", { shop });

  const storedShop = await db.shop.upsert({
    where: { shop },
    create: {
      shop,
      uninstalledAt: new Date(),
    },
    update: {
      uninstalledAt: new Date(),
    },
  });
  const email = getPrimaryEmail(storedShop);

  console.log("Loaded shop uninstall state", {
    shop,
    email: maskEmail(storedShop.email),
    contactEmail: maskEmail(storedShop.contactEmail),
    primaryEmail: maskEmail(email),
    hadUninstallEmailSentAt: Boolean(storedShop.uninstallEmailSentAt),
  });

  if (!email || storedShop.uninstallEmailSentAt) {
    console.log("Skipping uninstall email", {
      shop,
      reason: !email ? "missing-email" : "already-sent",
    });
    return;
  }

  try {
    const sent = await sendUninstallEmail({
      to: email,
      shopName: storedShop.name,
    });

    if (sent) {
      await db.shop.update({
        where: { shop },
        data: { uninstallEmailSentAt: new Date() },
      });
      console.log("Recorded uninstall email sent", { shop });
    }
  } catch (error) {
    console.error(`Failed to send uninstall email for ${shop}`, error);
  }
}
