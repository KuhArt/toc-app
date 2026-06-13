import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";

const CUSTOMER_DATA_REQUEST = "CUSTOMERS_DATA_REQUEST";
const CUSTOMERS_REDACT = "CUSTOMERS_REDACT";
const SHOP_REDACT = "SHOP_REDACT";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} compliance webhook for ${shop}`);

  switch (topic) {
    case CUSTOMER_DATA_REQUEST:
      console.log("Acknowledged customer data request compliance webhook", {
        shop,
        dataRequestId: payload.data_request?.id ?? null,
        customerId: payload.customer?.id ?? null,
      });
      break;
    case CUSTOMERS_REDACT:
      console.log("Acknowledged customer redact compliance webhook", {
        shop,
        customerId: payload.customer?.id ?? null,
      });
      break;
    case SHOP_REDACT:
      await db.$transaction([
        db.session.deleteMany({ where: { shop } }),
        db.shop.deleteMany({ where: { shop } }),
      ]);
      console.log("Deleted shop data for shop redact compliance webhook", {
        shop,
      });
      break;
    default:
      console.warn("Received unexpected compliance webhook topic", {
        shop,
        topic,
      });
  }

  return new Response();
};
