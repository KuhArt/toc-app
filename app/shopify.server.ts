import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import {
  BASIC_ANNUAL_PLAN,
  BASIC_MONTHLY_PLAN,
  LIFETIME_PLAN,
} from "./billing-plans";
import prisma from "./db.server";

const ALWAYS_TEST_BILLING_SHOPS = ["tocito-test-store-4.myshopify.com", "tocito-test-store-6.myshopify.com", "tocito-test-store-7.myshopify.com", "tocito-test-store-8.myshopify.com", "tocito-test-store-9.myshopify.com", "tocito-test-store-10.myshopify.com"];

export function isTestBilling(shop?: string | null) {
  return (
    process.env.NODE_ENV !== "production" ||
    Boolean(
      shop &&
        ALWAYS_TEST_BILLING_SHOPS.includes(shop.trim().toLowerCase()),
    )
  );
}

const scopes = (process.env.SCOPES || "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes,
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    [BASIC_MONTHLY_PLAN]: {
      trialDays: 7,
      lineItems: [
        {
          amount: 1,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    [BASIC_ANNUAL_PLAN]: {
      trialDays: 7,
      lineItems: [
        {
          amount: 10,
          currencyCode: "USD",
          interval: BillingInterval.Annual,
        },
      ],
    },
    [LIFETIME_PLAN]: {
      amount: 12,
      currencyCode: "USD",
      interval: BillingInterval.OneTime,
    },
  },
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
