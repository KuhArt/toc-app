import type { LoaderFunctionArgs } from "react-router";

import { BILLING_PLANS } from "../../billing-plans";
import { hasPaidAccess } from "../../billing.server";
import { authenticate, isTestBilling } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, redirect, session } = await authenticate.admin(request);
  const isTest = isTestBilling(session.shop);
  const billingCheck = await billing.check({
    plans: [...BILLING_PLANS],
    isTest,
  });

  if (hasPaidAccess(billingCheck)) {
    return redirect("/app");
  }

  return redirect("/app/pricing");
};
