import type { LoginError } from "@shopify/shopify-app-react-router/server";
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";

interface LoginErrorMessage {
  message?: string;
}

export function loginErrorMessage(loginErrors: LoginError): LoginErrorMessage {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return {
      message:
        "This login link is missing Shopify shop context. Open Tocito from Shopify admin or start installation from Shopify.",
    };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return {
      message:
        "This login link contains invalid Shopify shop context. Open Tocito from Shopify admin or start installation from Shopify.",
    };
  }

  return {};
}
