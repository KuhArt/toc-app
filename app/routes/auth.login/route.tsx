import { AppProvider } from "@shopify/shopify-app-react-router/react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const { errors } = loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Log in from Shopify">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              {errors.message ||
                "Open Tocito from Shopify admin or start installation from Shopify."}
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
