import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { recordAppUninstalled } from "../shop-emails.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("App uninstall webhook email flow starting", { shop });

  await recordAppUninstalled(shop);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  const deleteResult = await db.session.deleteMany({ where: { shop } });
  console.log("Deleted sessions after uninstall", {
    shop,
    count: deleteResult.count,
  });

  return new Response();
};
