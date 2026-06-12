import { type ComponentProps, type ComponentType, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import {
  BASIC_ANNUAL_PLAN,
  BASIC_MONTHLY_PLAN,
  LIFETIME_PLAN,
} from "../../billing-plans";
import db from "../../db.server";
import { authenticate, isTestBilling } from "../../shopify.server";
import {
  buildEmbeddedAppPath,
  cancelBasicSubscriptionsAfterLifetimePurchase,
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

type FillButtonProps = ComponentProps<"s-button"> & {
  inlineSize: "fill";
};

const FillButton = "s-button" as unknown as ComponentType<FillButtonProps>;

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

const PRICING_LAYOUT_STYLES = `
  .toc-current-plan {
    margin-inline: auto;
    max-width: calc(550px + 1.2rem);
    width: 100%;
  }

  .toc-pricing-grid {
    align-items: stretch;
    display: grid;
    gap: 1.2rem;
    grid-template-columns: minmax(0, 275px);
    justify-content: center;
  }

  .toc-pricing-card {
    display: flex;
    font-size: 1.2rem;
    height: 100%;
    width: 100%;
  }

  .toc-pricing-card > s-section {
    display: block;
    flex: 1;
    width: 100%;
  }

  .toc-pricing-card > s-section > s-stack {
    padding: 0.25rem;
  }

  .toc-pricing-card s-paragraph,
  .toc-billing-toggle s-text {
    font-size: 1.2rem;
    line-height: 1.45;
  }

  .toc-billing-toggle {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .toc-billing-toggle-placeholder {
    pointer-events: none;
    visibility: hidden;
  }

  .toc-plan-title {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .toc-plan-title-text {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .toc-plan-description {
    display: block;
    position: relative;
  }

  .toc-plan-description-visible {
    inset: 0 auto auto 0;
    position: absolute;
    width: 100%;
  }

  .toc-plan-description-sizer {
    margin-top: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .toc-annual-label {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 0.075rem;
  }

  .toc-saving-badge {
    background: var(--p-color-bg-fill-caution-secondary, #ffeb78);
    border-radius: 999px;
    color: var(--p-color-text-caution, #4f4700);
    display: inline-flex;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.1;
    padding: 0.075rem 0.3rem;
  }

  .toc-pricing-form {
    display: block;
    margin: 0;
    width: 100%;
  }

  .toc-pricing-form s-button {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    width: 100%;
  }

  .toc-price {
    align-items: baseline;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .toc-price-amount {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .toc-price-cycle {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1;
  }

  @media (min-width: 48rem) {
    .toc-pricing-grid {
      align-items: stretch;
      grid-template-columns: repeat(2, minmax(0, 275px));
    }
  }
`;

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
        : null,
    currentPlanTitle: hasLifetime
      ? "Lifetime"
      : activeBasicSubscription
        ? "Basic"
        : null,
    hasBasic: Boolean(activeBasicSubscription),
    hasLifetime,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
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
    isTest: isTestBilling(),
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

  await billing.request({
    plan,
    isTest: isTestBilling(),
    returnUrl: new URL(
      buildEmbeddedAppPath(request, "/app/pricing"),
      request.url,
    ).toString(),
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
  const navigation = useNavigation();
  const submittingPlan = navigation.formData?.get("plan");
  const isSubmitting = navigation.state !== "idle";
  const [isAnnualBilling, setIsAnnualBilling] = useState(
    activeBasicPlan !== BASIC_MONTHLY_PLAN,
  );
  const selectedBasicPlan = isAnnualBilling
    ? BASIC_ANNUAL_PLAN
    : BASIC_MONTHLY_PLAN;
  const basicPrice = isAnnualBilling ? "$10" : "$1";
  const basicPriceCycle = isAnnualBilling ? "/year" : "/month";
  const isSubmittingSelectedBasicPlan = submittingPlan === selectedBasicPlan;
  const isSelectedBasicPlanCurrent = selectedBasicPlan === activeBasicPlan;
  const defaultDescription =
    "All Tocito features with a 7-day free trial. Pay monthly, or choose yearly billing.";
  const basicDescription = activeBasicPlan
    ? "All Tocito features. Select between monthly and yearly billing."
    : "All Tocito features with a 7-day free trial. Pay monthly, or choose yearly billing.";

  return (
    <s-page heading="Pricing">
      <style>{PRICING_LAYOUT_STYLES}</style>
      <s-stack direction="block" gap="base">
        {currentPlanTitle ? (
          <div className="toc-current-plan">
            <s-section heading="Current plan">
              <s-stack direction="block" gap="small">
                <s-badge tone="success">{currentPlanTitle}</s-badge>
                {currentPlanDescription ? (
                  <s-paragraph>{currentPlanDescription}</s-paragraph>
                ) : null}
              </s-stack>
            </s-section>
          </div>
        ) : null}

        {actionData?.error ? (
          <s-section>
            <s-paragraph>{actionData.error}</s-paragraph>
          </s-section>
        ) : null}

        {!hasLifetime ? (
          <div className="toc-pricing-grid">
            <div className="toc-pricing-card">
              <s-section>
                <s-stack direction="block" gap="base">
                  <div className="toc-plan-title">
                    <span className="toc-plan-title-text">Basic</span>
                    {activeBasicPlan ? null : (
                      <s-badge tone="info">7-day free trial</s-badge>
                    )}
                  </div>
                  <div className="toc-plan-description">
                    <div className="toc-plan-description-visible">
                      <s-paragraph>{basicDescription}</s-paragraph>
                    </div>
                    <div
                      aria-hidden="true"
                      className="toc-plan-description-sizer"
                    >
                      <s-paragraph>{defaultDescription}</s-paragraph>
                    </div>
                  </div>
                  <div className="toc-billing-toggle">
                    <s-text>Monthly</s-text>
                    <s-switch
                      checked={isAnnualBilling}
                      disabled={isSubmitting}
                      label="Annual billing"
                      labelAccessibilityVisibility="exclusive"
                      onChange={(event) =>
                        setIsAnnualBilling(event.currentTarget.checked)
                      }
                    ></s-switch>
                    <div className="toc-annual-label">
                      <s-text>Annual</s-text>
                      <span className="toc-saving-badge">Save 17%</span>
                    </div>
                  </div>
                  <div className="toc-price">
                    <span className="toc-price-amount">{basicPrice}</span>
                    <span className="toc-price-cycle">{basicPriceCycle}</span>
                  </div>
                  <Form
                    className="toc-pricing-form"
                    method="post"
                    reloadDocument
                  >
                    <input
                      type="hidden"
                      name="plan"
                      value={selectedBasicPlan}
                    />
                    <FillButton
                      disabled={
                        isSubmitting ||
                        isSubmittingSelectedBasicPlan ||
                        isSelectedBasicPlanCurrent
                      }
                      inlineSize="fill"
                      type="submit"
                      variant="primary"
                    >
                      {isSelectedBasicPlanCurrent
                        ? "Current plan"
                        : isSubmittingSelectedBasicPlan
                          ? "Opening approval..."
                          : "Select this plan"}
                    </FillButton>
                  </Form>
                </s-stack>
              </s-section>
            </div>

            <div className="toc-pricing-card">
              <s-section>
                <s-stack direction="block" gap="base">
                  <div className="toc-plan-title">
                    <span className="toc-plan-title-text">Lifetime</span>
                  </div>
                  <div className="toc-plan-description">
                    <div className="toc-plan-description-visible">
                      <s-paragraph>
                        Same Tocito features as Basic. Pay once. No monthly or
                        yearly billing.
                      </s-paragraph>
                    </div>
                    <div
                      aria-hidden="true"
                      className="toc-plan-description-sizer"
                    >
                      <s-paragraph>
                        All Tocito features with a 7-day free trial. Pay
                        monthly, or choose yearly billing.
                      </s-paragraph>
                    </div>
                  </div>
                  <div className="toc-billing-toggle toc-billing-toggle-placeholder">
                    <s-text>Monthly</s-text>
                    <s-switch
                      checked={false}
                      disabled
                      label="Annual billing"
                      labelAccessibilityVisibility="exclusive"
                    ></s-switch>
                    <div className="toc-annual-label">
                      <s-text>Annual</s-text>
                      <span className="toc-saving-badge">Save 17%</span>
                    </div>
                  </div>
                  <div className="toc-price">
                    <span className="toc-price-amount">$12</span>
                    <span className="toc-price-cycle">once</span>
                  </div>
                  <Form
                    className="toc-pricing-form"
                    method="post"
                    reloadDocument
                  >
                    <input type="hidden" name="plan" value={LIFETIME_PLAN} />
                    <FillButton
                      disabled={
                        isSubmitting ||
                        hasLifetime ||
                        submittingPlan === LIFETIME_PLAN
                      }
                      inlineSize="fill"
                      type="submit"
                      variant="primary"
                    >
                      {hasLifetime
                        ? "Purchased"
                        : submittingPlan === LIFETIME_PLAN
                          ? "Opening approval..."
                          : "Select this plan"}
                    </FillButton>
                  </Form>
                </s-stack>
              </s-section>
            </div>
          </div>
        ) : null}
      </s-stack>
    </s-page>
  );
}
