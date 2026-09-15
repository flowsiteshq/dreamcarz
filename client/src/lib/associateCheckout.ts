export type AssociateCheckoutConfig = {
  checkoutKey: string;
  checkoutScriptUrl: string;
  lineItems: Array<{ lineItemType?: string; sku: string; quantity: number }>;
  type: "sale" | "auth";
  customerVault: { addCustomer: boolean };
  receipt: { showReceipt: boolean; redirectToSuccessUrl: boolean; sendToCustomer?: boolean };
  successUrl: string;
  cancelUrl: string;
};

export function associateCheckoutScriptAttributes(config: Pick<AssociateCheckoutConfig, "checkoutScriptUrl" | "checkoutKey">) {
  return { src: config.checkoutScriptUrl, checkoutKey: config.checkoutKey };
}

async function loadCollectCheckout(config: Pick<AssociateCheckoutConfig, "checkoutScriptUrl" | "checkoutKey">) {
  if (window.CollectCheckout) return;
  await new Promise<void>((resolve, reject) => {
    const { src, checkoutKey } = associateCheckoutScriptAttributes(config);
    const existing = document.querySelector<HTMLScriptElement>('script[data-dreamcarz-associate-checkout="true"]');
    if (existing) {
      existing.dataset.checkoutKey = checkoutKey;
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Hosted checkout could not be loaded.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.checkoutKey = checkoutKey;
    script.dataset.dreamcarzAssociateCheckout = "true";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Hosted checkout could not be loaded."));
    document.head.appendChild(script);
  });
}

export async function openAssociateHostedCheckout(config: AssociateCheckoutConfig) {
  await loadCollectCheckout(config);
  if (!window.CollectCheckout) throw new Error("Hosted checkout is temporarily unavailable.");
  const { checkoutScriptUrl: _scriptUrl, ...checkout } = config;
  await window.CollectCheckout.redirectToCheckout(checkout);
}
