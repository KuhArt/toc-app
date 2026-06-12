import {
  BASIC_ANNUAL_PLAN,
  BASIC_MONTHLY_PLAN,
  BILLING_PLANS,
  LIFETIME_PLAN,
} from "./billing-plans";
import { authenticate, isTestBilling } from "./shopify.server";

type ActiveSubscription = {
  id: string;
  name: string;
  status: string;
};

type OneTimePurchase = {
  name: string;
  status: string;
};

type BillingCheck = {
  hasActivePayment: boolean;
  appSubscriptions: ActiveSubscription[];
  oneTimePurchases: OneTimePurchase[];
};

export const BASIC_PLAN_OPTIONS = [BASIC_MONTHLY_PLAN, BASIC_ANNUAL_PLAN];

export function isLifetimePurchase(purchase: OneTimePurchase) {
  return purchase.name === LIFETIME_PLAN && purchase.status === "ACTIVE";
}

export function isBasicSubscription(subscription: ActiveSubscription) {
  return (
    BASIC_PLAN_OPTIONS.includes(subscription.name) &&
    subscription.status === "ACTIVE"
  );
}

export function hasPaidAccess(billingCheck: BillingCheck) {
  return (
    billingCheck.oneTimePurchases.some(isLifetimePurchase) ||
    billingCheck.appSubscriptions.some(isBasicSubscription)
  );
}

export function getActivePlanLabels(billingCheck: BillingCheck) {
  const labels = [];

  if (billingCheck.appSubscriptions.some(isBasicSubscription)) {
    labels.push("Basic");
  }

  if (billingCheck.oneTimePurchases.some(isLifetimePurchase)) {
    labels.push("Lifetime");
  }

  return labels;
}

export function buildEmbeddedAppPath(request: Request, pathname: string) {
  const url = new URL(request.url);
  const embeddedParams = new URLSearchParams();
  const host = url.searchParams.get("host");
  const shop = url.searchParams.get("shop");

  if (host) {
    embeddedParams.set("host", host);
  }

  if (shop) {
    embeddedParams.set("shop", shop);
  }

  const queryString = embeddedParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export async function cancelBasicSubscriptionsAfterLifetimePurchase(
  request: Request,
) {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.check({
    plans: [...BILLING_PLANS],
    isTest: isTestBilling(),
  });

  if (!billingCheck.oneTimePurchases.some(isLifetimePurchase)) {
    return billingCheck;
  }

  await Promise.all(
    billingCheck.appSubscriptions
      .filter(isBasicSubscription)
      .map((subscription) =>
        billing.cancel({
          subscriptionId: subscription.id,
          isTest: isTestBilling(),
          prorate: true,
        }),
      ),
  );

  return billing.check({
    plans: [...BILLING_PLANS],
    isTest: isTestBilling(),
  });
}
