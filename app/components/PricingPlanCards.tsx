import { type ComponentProps, type ComponentType, useState } from "react";
import { Form, useNavigation } from "react-router";

import {
  BASIC_ANNUAL_PLAN,
  BASIC_MONTHLY_PLAN,
  LIFETIME_PLAN,
} from "../billing-plans";

type FillButtonProps = ComponentProps<"s-button"> & {
  inlineSize: "fill";
};

type PricingPlanCardsProps = {
  activeBasicPlan: string | null;
  hasLifetime: boolean;
};

const FillButton = "s-button" as unknown as ComponentType<FillButtonProps>;

export const PRICING_LAYOUT_STYLES = `
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

export function PricingPlanCards({
  activeBasicPlan,
  hasLifetime,
}: PricingPlanCardsProps) {
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
    : defaultDescription;

  if (hasLifetime) {
    return null;
  }

  return (
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
              <div aria-hidden="true" className="toc-plan-description-sizer">
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
            <Form className="toc-pricing-form" method="post" reloadDocument>
              <input type="hidden" name="plan" value={selectedBasicPlan} />
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
                  Same Tocito features as Basic. Pay once. No monthly or yearly
                  billing.
                </s-paragraph>
              </div>
              <div aria-hidden="true" className="toc-plan-description-sizer">
                <s-paragraph>{defaultDescription}</s-paragraph>
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
            <Form className="toc-pricing-form" method="post" reloadDocument>
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
  );
}
