import { describe, expect, it } from "vitest";
import { associateCheckoutScriptAttributes } from "./associateCheckout";

describe("associate checkout script configuration", () => {
  it("preserves the provider script URL and checkout key for the hosted checkout loader", () => {
    expect(associateCheckoutScriptAttributes({
      checkoutScriptUrl: "https://secure.networkmerchants.com/token/CollectCheckout.js",
      checkoutKey: "public-checkout-key",
    })).toEqual({
      src: "https://secure.networkmerchants.com/token/CollectCheckout.js",
      checkoutKey: "public-checkout-key",
    });
  });
});
