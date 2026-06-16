import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useActionData, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  BASIC_ANNUAL_PLAN,
  BASIC_MONTHLY_PLAN,
  LIFETIME_PLAN,
} from "../../billing-plans";
import {
  PricingPlanCards,
  PRICING_LAYOUT_STYLES,
} from "../../components/PricingPlanCards";
import db from "../../db.server";
import { authenticate, isTestBilling } from "../../shopify.server";
import {
  cancelBasicSubscriptionsAfterLifetimePurchase,
  getEmbeddedAdminAppUrl,
  isBasicSubscription,
  isLifetimePurchase,
} from "../../billing.server";

type ActionData = {
  error?: string;
};

type ActiveBasicSubscription = {
  createdAt?: string;
  currentPeriodEnd?: string;
  lineItems?: unknown[];
  name: string;
  trialDays?: number;
};

type RecurringLineItem = {
  plan?: {
    pricingDetails?: {
      price?: {
        amount?: number | string;
      };
    };
  };
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const BASIC_TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function isBasicPlan(plan: FormDataEntryValue | null) {
  return plan === BASIC_MONTHLY_PLAN || plan === BASIC_ANNUAL_PLAN;
}

function formatMoney(amount: number | string | undefined, fallback: string) {
  const numericAmount =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (typeof numericAmount !== "number" || Number.isNaN(numericAmount)) {
    return fallback;
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(numericAmount);
}

function formatDate(date: Date) {
  return DATE_FORMATTER.format(date);
}

function isValidDate(date: Date | null) {
  return Boolean(date && !Number.isNaN(date.getTime()));
}

function getPlanFallbackPrice(plan: string) {
  if (plan === BASIC_ANNUAL_PLAN) {
    return "$10";
  }

  return "$1";
}

function getPlanBillingCycle(plan: string) {
  if (plan === BASIC_ANNUAL_PLAN) {
    return "year";
  }

  return "month";
}

function getPlanCycleDays(plan: string) {
  if (plan === BASIC_ANNUAL_PLAN) {
    return 365;
  }

  return 30;
}

function getSubscriptionPriceAmount(subscription: ActiveBasicSubscription) {
  const lineItem = subscription.lineItems?.[0] as RecurringLineItem | undefined;

  return lineItem?.plan?.pricingDetails?.price?.amount;
}

function getBasicPaymentSummary(subscription: ActiveBasicSubscription) {
  const amount = formatMoney(
    getSubscriptionPriceAmount(subscription),
    getPlanFallbackPrice(subscription.name),
  );
  const cycle = getPlanBillingCycle(subscription.name);
  const createdAt = subscription.createdAt
    ? new Date(subscription.createdAt)
    : null;
  const currentPeriodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const trialDays = subscription.trialDays || BASIC_TRIAL_DAYS;
  const trialEndsAt = isValidDate(createdAt)
    ? new Date(createdAt!.getTime() + trialDays * DAY_MS)
    : isValidDate(currentPeriodEnd)
      ? new Date(
          currentPeriodEnd!.getTime() -
            getPlanCycleDays(subscription.name) * DAY_MS,
        )
      : null;
  const now = new Date();
  const trialDaysRemaining =
    trialEndsAt && trialEndsAt.getTime() > now.getTime()
      ? Math.max(
          1,
          Math.ceil(
            (trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
          ),
        )
      : 0;

  if (trialDaysRemaining > 0 && trialEndsAt) {
    return `${trialDaysRemaining} trial ${
      trialDaysRemaining === 1 ? "day" : "days"
    } left. Then ${amount} /${cycle} starting ${formatDate(trialEndsAt)}.`;
  }

  if (currentPeriodEnd && !Number.isNaN(currentPeriodEnd.getTime())) {
    return `${amount} /${cycle}. Next payment on ${formatDate(currentPeriodEnd)}.`;
  }

  return `${amount}/${cycle}.`;
}

async function markBillingTrialUsed(request: Request) {
  const shop = new URL(request.url).searchParams.get("shop");

  if (!shop) {
    return;
  }

  await db.shop.upsert({
    where: { shop },
    update: { billingTrialUsedAt: new Date() },
    create: {
      billingTrialUsedAt: new Date(),
      shop,
    },
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const billingCheck =
    await cancelBasicSubscriptionsAfterLifetimePurchase(request);
  const activeBasicSubscription =
    billingCheck.appSubscriptions.find(isBasicSubscription);
  const hasLifetime = billingCheck.oneTimePurchases.some(isLifetimePurchase);

  if (activeBasicSubscription) {
    await markBillingTrialUsed(request);
  }

  return {
    activeBasicPlan: activeBasicSubscription?.name ?? null,
    currentPlanDescription: hasLifetime
      ? "Enjoy your plan forever."
      : activeBasicSubscription
        ? getBasicPaymentSummary(activeBasicSubscription)
        : "To use Tocito, choose a plan. You can start with a free trial before deciding to purchase. You can also change your plan later.",
    currentPlanTitle: hasLifetime
      ? "Lifetime"
      : activeBasicSubscription
        ? "Basic"
        : "Not set",
    hasBasic: Boolean(activeBasicSubscription),
    hasLifetime,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const isTest = isTestBilling(session.shop);
  const formData = await request.formData();
  const plan = formData.get("plan");

  if (
    plan !== BASIC_MONTHLY_PLAN &&
    plan !== BASIC_ANNUAL_PLAN &&
    plan !== LIFETIME_PLAN
  ) {
    return { error: "Choose a valid plan." } satisfies ActionData;
  }

  const billingCheck = await billing.check({
    plans: [BASIC_MONTHLY_PLAN, BASIC_ANNUAL_PLAN, LIFETIME_PLAN],
    isTest,
  });
  const hasExistingPaidAccess =
    billingCheck.appSubscriptions.some(isBasicSubscription) ||
    billingCheck.oneTimePurchases.some(isLifetimePurchase);
  const shopBillingState = await db.shop.upsert({
    where: { shop: session.shop },
    update: {},
    create: {
      billingTrialUsedAt: null,
      shop: session.shop,
    },
    select: { billingTrialUsedAt: true },
  });
  const shouldGiveBasicTrial =
    isBasicPlan(plan) &&
    !hasExistingPaidAccess &&
    !shopBillingState.billingTrialUsedAt;

  return await billing.request({
    plan,
    isTest,
    returnUrl: getEmbeddedAdminAppUrl(session.shop, "/app/pricing/approve"),
    ...(isBasicPlan(plan) ? { trialDays: shouldGiveBasicTrial ? 7 : 0 } : {}),
  });
};

export default function Pricing() {
  const {
    activeBasicPlan,
    currentPlanDescription,
    currentPlanTitle,
    hasLifetime,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Billing">
      <style>{PRICING_LAYOUT_STYLES}</style>
      <s-stack direction="block" gap="base">
        <div className="toc-current-plan">
          <s-section heading="Current plan">
            <s-stack direction="block" gap="small">
              <s-badge tone={currentPlanTitle === "Not set" ? "warning" : "success"}>
                {currentPlanTitle}
              </s-badge>
              <s-paragraph>{currentPlanDescription}</s-paragraph>
            </s-stack>
          </s-section>
        </div>

        {actionData?.error ? (
          <s-section>
            <s-paragraph>{actionData.error}</s-paragraph>
          </s-section>
        ) : null}

        <PricingPlanCards
          activeBasicPlan={activeBasicPlan}
          hasLifetime={hasLifetime}
        />
      </s-stack>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
