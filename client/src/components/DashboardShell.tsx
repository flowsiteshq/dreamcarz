/* Shared shell layout for all dashboard sidebar pages */
import AIConcierge from "@/components/AIConcierge";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Car, CalendarDays, Star, CreditCard, Gift,
  MapPin, Headphones, Settings, ChevronRight, ArrowUp, Sparkles, AlertTriangle, FileText,
  Bell, LogOut, Menu, TrendingUp, Trophy, Network, ClipboardCheck, ShieldCheck, BadgeCheck
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { loadStripe } from "@stripe/stripe-js";

declare global {
  interface Window {
    CollectCheckout?: {
      redirectToCheckout: (options: {
        lineItems: Array<{ sku: string; quantity: number }>;
        type: "auth";
        collectShippingInfo: boolean;
        customerVault: { addCustomer: boolean };
        successUrl: string;
        cancelUrl: string;
        receipt: { showReceipt: boolean; redirectToSuccessUrl: boolean };
      }) => Promise<unknown>;
    };
  }
}

function loadCoCardCheckout(scriptUrl: string, checkoutKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.CollectCheckout) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-dreamcarz-cocard="true"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("CoCard checkout failed to load.")), { once: true }); return; }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.dataset.checkoutKey = checkoutKey;
    script.dataset.dreamcarzCocard = "true";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("CoCard checkout failed to load."));
    document.head.appendChild(script);
  });
}

const sidebarLinks = [
  { href: "/dashboard", label: "My Account", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "My Vehicles", icon: Car },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/dashboard/rental-setup", label: "Rental Setup", icon: ClipboardCheck },
  { href: "/dashboard/membership", label: "Membership", icon: Star },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/dreamcarz-id", label: "DreamCarz ID", icon: BadgeCheck },
  { href: "/dashboard/transactions", label: "My Records", icon: FileText },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/report", label: "Report an Issue", icon: AlertTriangle },
  { href: "/dashboard/incidents", label: "Incident Center", icon: ShieldCheck },
  { href: "/dashboard/dream-journey", label: "Dream Journey", icon: Trophy },
  { href: "/dashboard/drive-network", label: "Associate Path", icon: Network },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin },
  { href: "/dashboard/support", label: "Support", icon: Headphones },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const tierColors: Record<string, string> = {
  Freedom: "linear-gradient(90deg, #3B82F6, #60A5FA)",
  Plus: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
  Pro: "linear-gradient(90deg, #B8860B, #D4A017)",
  Elite: "linear-gradient(90deg, #111, #B8860B)",
};

function IdentityVerificationLauncher({ reference }: { reference: string }) {
  const [consents, setConsents] = useState({ document: false, biometric: false });
  const [message, setMessage] = useState("");
  const provider = trpc.transactions.identityProviderStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const start = trpc.transactions.startIdentityVerification.useMutation();

  if (!provider.data?.configured || transaction.data?.transaction.currentStep !== "identity") return null;

  const launch = async () => {
    if (!consents.document || !consents.biometric) {
      setMessage("Please acknowledge both the document and biometric verification consents before continuing.");
      return;
    }
    try {
      setMessage("");
      const response = await start.mutateAsync({ reference, identityDocumentConsent: true, biometricConsent: true });
      if (!response.started) { setMessage("Identity verification is not configured. Your transaction remains available for manual review."); return; }
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) { setMessage("The secure identity window could not be opened. Please contact DreamCarz support."); return; }
      const result = await stripe.verifyIdentity(response.clientSecret);
      setMessage(result.error ? (result.error.message ?? "The provider could not complete verification. Please use manual review or try again later.") : "Your verification was submitted. DreamCarz will update this record after the provider response is verified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The identity session could not be started. Please use the manual-review path.");
    }
  };

  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Configured provider option</p><h2 className="mt-2 font-display text-xl font-bold">Verify with Stripe Identity</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">DreamCarz receives only the provider result needed for this transaction. Your verification session is tied to this account and must be completed by you.</p><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-700"><input type="checkbox" checked={consents.document} onChange={event => setConsents(current => ({ ...current, document: event.target.checked }))} className="mt-0.5 accent-black" />I consent to secure document verification for this transaction.</label><label className="mt-3 flex gap-2 text-xs leading-5 text-gray-700"><input type="checkbox" checked={consents.biometric} onChange={event => setConsents(current => ({ ...current, biometric: event.target.checked }))} className="mt-0.5 accent-black" />I separately consent to a live-selfie/biometric comparison performed by the configured provider.</label><button type="button" disabled={start.isPending} onClick={() => void launch()} className="mt-5 inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{start.isPending ? "Preparing secure session…" : "Begin secure identity verification"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

function PaymentMethodSetupLauncher({ reference }: { reference: string }) {
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const provider = trpc.transactions.paymentProviderStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const start = trpc.transactions.startPaymentMethodSetup.useMutation();
  if (transaction.data?.transaction.currentStep !== "payment") return null;
  const status = provider.data;
  const launch = async () => {
    if (!consent) { setMessage("Acknowledge the payment authorization before continuing to CoCard’s secure checkout."); return; }
    try {
      setMessage("");
      const response = await start.mutateAsync({ reference, futurePaymentConsent: true });
      if (!response.started) { setMessage(response.message); return; }
      await loadCoCardCheckout(response.provider.checkoutScriptUrl, response.checkoutKey);
      if (!window.CollectCheckout) { setMessage("CoCard checkout could not be prepared. Please contact DreamCarz support."); return; }
      const query = new URLSearchParams({ ref: response.reference, cocard_attempt: response.checkoutAttemptToken, cocard_transaction: "(TRANSACTION_ID)", cocard_vault: "(CUSTOMER_VAULT_ID)" });
      const destination = `${window.location.origin}/dashboard/transactions?${query.toString()}`;
      await window.CollectCheckout.redirectToCheckout({ lineItems: [{ sku: response.productSku, quantity: 1 }], type: "auth", collectShippingInfo: false, customerVault: { addCustomer: true }, successUrl: destination, cancelUrl: `${window.location.origin}/dashboard/transactions?ref=${encodeURIComponent(response.reference)}&cocard_cancelled=true`, receipt: { showReceipt: false, redirectToSuccessUrl: false } });
    } catch (error) { setMessage(error instanceof Error ? error.message : "CoCard checkout could not be opened. Please contact DreamCarz support."); }
  };
  const ready = Boolean(status?.configured && transaction.data?.transaction.cocardProductSku);
  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">CoCard payment authorization</p><h2 className="mt-2 font-display text-xl font-bold">Authorize through secure CoCard checkout.</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">DreamCarz does not receive or store your card number, security code, or expiry date. When available, the authorization takes place on CoCard’s hosted checkout page for the approved transaction item; payment status changes only after a verified gateway callback or server-side review.</p><p className="mt-3 text-xs font-semibold text-black">Gateway status: <span className="capitalize">{status?.mode?.replaceAll("_", " ") || "Checking configuration"}</span></p>{ready ? <><label className="mt-4 flex max-w-3xl gap-2 text-xs leading-5 text-gray-700"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5 accent-black" />I authorize DreamCarz to open CoCard’s secure checkout for this approved transaction. I understand no card data is entered into or stored by DreamCarz.</label><button type="button" disabled={!consent || start.isPending} onClick={() => void launch()} className="mt-4 inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{start.isPending ? "Preparing secure checkout…" : "Continue to CoCard checkout"}</button></> : <p className="mt-3 text-[11px] leading-5 text-gray-500">DreamCarz will notify you when the secure, gateway-approved payment method is available or provide a documented manual alternative.</p>}{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

function RentalConditionReportPanel({ reference }: { reference: string }) {
  const [odometerReading, setOdometerReading] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const submit = trpc.transactions.submitConditionReport.useMutation({ onSuccess: () => transaction.refetch() });
  const record = transaction.data?.transaction;
  const stage = record?.currentStep === "pickup" ? "pickup" as const : "return" as const;
  const eligible = record?.transactionType === "rental" && (record.currentStep === "pickup" || record.currentStep === "active_rental" || record.currentStep === "return");
  if (!eligible) return null;
  const save = async () => {
    const parsedOdometer = odometerReading.trim() ? Number(odometerReading) : undefined;
    if (parsedOdometer !== undefined && (!Number.isInteger(parsedOdometer) || parsedOdometer < 0)) { setMessage("Enter a valid non-negative whole-number odometer reading."); return; }
    try {
      setMessage("");
      await submit.mutateAsync({ reference, stage, odometerReading: parsedOdometer, fuelLevel: fuelLevel || undefined, notes: notes || undefined });
      setOdometerReading(""); setFuelLevel(""); setNotes("");
      setMessage(`${stage === "pickup" ? "Pickup" : "Return"} condition report submitted for DreamCarz review.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The condition report could not be saved. Please try again."); }
  };
  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">{stage} condition record</p><h2 className="mt-2 font-display text-xl font-bold">{stage === "pickup" ? "Document the vehicle at handoff" : "Document the vehicle at return"}</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">Record observed mileage, fuel level, and notes. This creates an account-bound inspection record; it is not a final settlement or damage determination.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold text-gray-700">Odometer reading <input value={odometerReading} onChange={event => setOdometerReading(event.target.value)} inputMode="numeric" className="h-10 border border-gray-300 bg-white px-3 text-sm font-normal text-black" /></label><label className="grid gap-1 text-xs font-semibold text-gray-700">Fuel level <input value={fuelLevel} onChange={event => setFuelLevel(event.target.value)} placeholder="Example: Full" className="h-10 border border-gray-300 bg-white px-3 text-sm font-normal text-black" /></label></div><label className="mt-3 grid gap-1 text-xs font-semibold text-gray-700">Condition notes <textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} rows={3} placeholder="Note any observed condition concerns" className="border border-gray-300 bg-white p-3 text-sm font-normal text-black" /></label><button type="button" disabled={submit.isPending} onClick={() => void save()} className="mt-4 inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{submit.isPending ? "Saving report…" : `Submit ${stage} report`}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

function TransactionDetailsPanel({ reference }: { reference: string }) {
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const [notes, setNotes] = useState("");
  const [insurer, setInsurer] = useState("");
  const [policyLastFour, setPolicyLastFour] = useState("");
  const [coverageExpiresOn, setCoverageExpiresOn] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [tradeInDescription, setTradeInDescription] = useState("");
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [paymentPath, setPaymentPath] = useState<"cash" | "finance">("cash");
  const [message, setMessage] = useState("");
  const eligibility = trpc.transactions.saveEligibility.useMutation({ onSuccess: () => transaction.refetch() });
  const insurance = trpc.transactions.saveInsurance.useMutation({ onSuccess: () => transaction.refetch() });
  const additionalDriver = trpc.transactions.addAdditionalDriver.useMutation({ onSuccess: () => transaction.refetch() });
  const tradeIn = trpc.transactions.saveTradeIn.useMutation({ onSuccess: () => transaction.refetch() });
  const purchasePath = trpc.transactions.savePurchasePaymentPath.useMutation({ onSuccess: () => transaction.refetch() });
  const record = transaction.data?.transaction;
  const step = record?.currentStep;
  const eligible = ["eligibility", "insurance", "additional_drivers", "trade_in", "payment_path", "financing"].includes(step || "");
  if (!eligible) return null;

  const clearMessage = () => setMessage("");
  const reportError = (error: unknown) => setMessage(error instanceof Error ? error.message : "This transaction detail could not be saved. Please try again.");
  const fieldClass = "mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black outline-none focus:border-black";

  if (step === "eligibility") return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Eligibility review</p><h2 className="mt-2 font-display text-xl font-bold">Confirm your application information.</h2><p className="mt-2 text-xs leading-5 text-gray-600">DreamCarz will review eligibility separately; this attestation does not approve a vehicle or override identity, insurance, or agreement requirements.</p><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-700"><input id="eligibility-attestation" type="checkbox" className="mt-0.5 accent-black" />I confirm that the information I provided is accurate to the best of my knowledge.</label><label className="mt-3 grid gap-1 text-xs font-semibold text-gray-700">Optional review note<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={3} className="border border-gray-300 bg-white p-3 text-sm font-normal text-black" /></label><button type="button" disabled={eligibility.isPending} onClick={async () => { const checkbox = document.getElementById("eligibility-attestation") as HTMLInputElement | null; if (!checkbox?.checked) { setMessage("Please confirm the accuracy attestation before saving."); return; } try { clearMessage(); await eligibility.mutateAsync({ reference, attestsInformationAccurate: true, notes: notes || undefined }); setMessage("Eligibility information saved for DreamCarz review."); } catch (error) { reportError(error); } }} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{eligibility.isPending ? "Saving…" : "Save eligibility details"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;

  if (step === "insurance") return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Insurance & protection</p><h2 className="mt-2 font-display text-xl font-bold">Save limited policy details for review.</h2><p className="mt-2 text-xs leading-5 text-gray-600">Do not enter a full policy number. DreamCarz stores only the insurer, last four policy characters, and coverage-expiry date pending verification.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-gray-700">Insurer<input value={insurer} onChange={event => setInsurer(event.target.value)} className={fieldClass} /></label><label className="text-xs font-semibold text-gray-700">Policy last four<input value={policyLastFour} onChange={event => setPolicyLastFour(event.target.value.toUpperCase())} maxLength={4} className={fieldClass} /></label><label className="text-xs font-semibold text-gray-700">Coverage expires<input value={coverageExpiresOn} onChange={event => setCoverageExpiresOn(event.target.value)} type="date" className={fieldClass} /></label></div><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-700"><input id="insurance-consent" type="checkbox" className="mt-0.5 accent-black" />I consent to DreamCarz reviewing these limited insurance details for this transaction.</label><button type="button" disabled={insurance.isPending} onClick={async () => { const consent = document.getElementById("insurance-consent") as HTMLInputElement | null; if (!consent?.checked) { setMessage("Please consent to the limited insurance review before saving."); return; } try { clearMessage(); await insurance.mutateAsync({ reference, insurer, policyLastFour, coverageExpiresOn, insuranceReviewConsent: true }); setMessage("Insurance details saved for review."); } catch (error) { reportError(error); } }} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{insurance.isPending ? "Saving…" : "Save insurance details"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;

  if (step === "additional_drivers") return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Additional drivers</p><h2 className="mt-2 font-display text-xl font-bold">Add a driver for separate review.</h2><p className="mt-2 text-xs leading-5 text-gray-600">An added driver is not authorized to operate the vehicle until DreamCarz completes their separate eligibility and identity review.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-gray-700">Full legal name<input value={driverName} onChange={event => setDriverName(event.target.value)} className={fieldClass} /></label><label className="text-xs font-semibold text-gray-700">Email (optional)<input value={driverEmail} onChange={event => setDriverEmail(event.target.value)} type="email" className={fieldClass} /></label></div><button type="button" disabled={additionalDriver.isPending} onClick={async () => { try { clearMessage(); await additionalDriver.mutateAsync({ reference, fullName: driverName, email: driverEmail || undefined }); setDriverName(""); setDriverEmail(""); setMessage("Additional driver saved as pending review."); } catch (error) { reportError(error); } }} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{additionalDriver.isPending ? "Saving…" : "Add driver"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;

  if (step === "trade_in") return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Optional trade-in</p><h2 className="mt-2 font-display text-xl font-bold">Tell us whether you have a trade-in.</h2><p className="mt-2 text-xs leading-5 text-gray-600">DreamCarz does not calculate or promise trade-in value here. An appraisal, if offered, remains subject to separate inspection and terms.</p><label className="mt-4 flex gap-2 text-xs font-semibold text-gray-700"><input checked={hasTradeIn} onChange={event => setHasTradeIn(event.target.checked)} type="checkbox" className="accent-black" />I have a vehicle to discuss as a trade-in.</label>{hasTradeIn && <label className="mt-3 grid gap-1 text-xs font-semibold text-gray-700">Vehicle description<input value={tradeInDescription} onChange={event => setTradeInDescription(event.target.value)} placeholder="Year, make, model" className={fieldClass} /></label>}<button type="button" disabled={tradeIn.isPending} onClick={async () => { try { clearMessage(); await tradeIn.mutateAsync({ reference, hasTradeIn, vehicleDescription: tradeInDescription || undefined }); setMessage("Trade-in preference saved for DreamCarz review."); } catch (error) { reportError(error); } }} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{tradeIn.isPending ? "Saving…" : "Save trade-in preference"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;

  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Purchase path</p><h2 className="mt-2 font-display text-xl font-bold">Select cash or financing review.</h2><p className="mt-2 text-xs leading-5 text-gray-600">DreamCarz does not collect credit credentials in this app. Financing requests require your authorization and are routed only to a configured provider or manual-review process.</p><div className="mt-4 flex gap-4 text-xs font-semibold text-gray-700"><label><input checked={paymentPath === "cash"} onChange={() => setPaymentPath("cash")} type="radio" name="purchase-payment-path" className="mr-2 accent-black" />Cash</label><label><input checked={paymentPath === "finance"} onChange={() => setPaymentPath("finance")} type="radio" name="purchase-payment-path" className="mr-2 accent-black" />Finance</label></div>{paymentPath === "finance" && <label className="mt-4 flex gap-2 text-xs leading-5 text-gray-700"><input id="credit-authorization" type="checkbox" className="mt-0.5 accent-black" />I authorize DreamCarz to route my financing request for a separate provider or manual-review process. This does not submit a credit application in this app.</label>}<button type="button" disabled={purchasePath.isPending} onClick={async () => { const authorized = paymentPath === "cash" || Boolean((document.getElementById("credit-authorization") as HTMLInputElement | null)?.checked); if (!authorized) { setMessage("Explicit authorization is required before selecting financing review."); return; } try { clearMessage(); await purchasePath.mutateAsync({ reference, paymentPath, creditAuthorization: paymentPath === "finance" ? true : undefined }); setMessage(paymentPath === "finance" ? "Financing preference saved for provider or manual review." : "Cash purchase preference saved for DreamCarz review."); } catch (error) { reportError(error); } }} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{purchasePath.isPending ? "Saving…" : "Save purchase path"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

function NativeAgreementPanel({ reference }: { reference: string }) {
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const agreement = trpc.transactions.getNativeAgreement.useQuery({ reference }, { refetchOnWindowFocus: false });
  const [signerName, setSignerName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureConsent, setSignatureConsent] = useState(false);
  const [message, setMessage] = useState("");
  const prepare = trpc.transactions.prepareNativeAgreement.useMutation({ onSuccess: async () => { await agreement.refetch(); await transaction.refetch(); } });
  const sign = trpc.transactions.signNativeAgreement.useMutation({ onSuccess: async () => { await agreement.refetch(); await transaction.refetch(); } });
  const record = transaction.data?.transaction;
  if (!record || !["review", "agreement", "confirmation"].includes(record.currentStep)) return null;
  const activeAgreement = agreement.data;
  const prepareAgreement = async () => {
    try { setMessage(""); await prepare.mutateAsync({ reference }); setMessage("Your agreement is ready to review and sign."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "DreamCarz could not prepare an agreement at this time."); }
  };
  const signAgreement = async () => {
    if (!activeAgreement || !acknowledged || !signatureConsent) { setMessage("Confirm the acknowledgement and electronic-signature consent before signing."); return; }
    try { setMessage(""); await sign.mutateAsync({ reference, agreementId: activeAgreement.id, signerName, acknowledgesAgreement: true, electronicSignatureConsent: true }); setMessage("Your signed agreement is stored in My Records and has been routed to DreamCarz for final review."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "DreamCarz could not record the signature at this time."); }
  };
  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">DreamCarz agreement</p><h2 className="mt-2 font-display text-xl font-bold">Review and sign your controlled transaction document.</h2>{!activeAgreement && <><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">DreamCarz will generate a document only from an active, legally approved internal template. The supplied rental addendum remains unavailable until its legal and entity-consistency review is complete.</p><button type="button" disabled={prepare.isPending || record.currentStep !== "review"} onClick={() => void prepareAgreement()} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{prepare.isPending ? "Preparing…" : "Prepare agreement"}</button></>}{activeAgreement && <><div className="mt-4 max-h-80 overflow-y-auto border border-gray-300 bg-white p-4"><p className="text-xs font-bold text-black">{activeAgreement.agreementType} agreement · version {activeAgreement.version}</p><pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-5 text-gray-700">{activeAgreement.contentSnapshot}</pre></div>{activeAgreement.status === "awaiting_signature" ? <div className="mt-4 space-y-3"><label className="grid gap-1 text-xs font-semibold text-gray-700">Type your full legal name<input value={signerName} onChange={event => setSignerName(event.target.value)} maxLength={160} className="h-10 border border-gray-300 bg-white px-3 text-sm font-normal text-black outline-none focus:border-black" /></label><label className="flex gap-2 text-xs leading-5 text-gray-700"><input checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} type="checkbox" className="mt-0.5 accent-black" />I have reviewed this version of the agreement and intend to sign it electronically.</label><label className="flex gap-2 text-xs leading-5 text-gray-700"><input checked={signatureConsent} onChange={event => setSignatureConsent(event.target.checked)} type="checkbox" className="mt-0.5 accent-black" />I consent to DreamCarz recording my typed signature, acknowledgement timestamp, and integrity record for this transaction.</label><button type="button" disabled={sign.isPending || signerName.trim().length < 2} onClick={() => void signAgreement()} className="h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{sign.isPending ? "Recording signature…" : "Sign agreement"}</button></div> : <p className="mt-4 text-xs leading-5 text-gray-600">Agreement status: <span className="font-semibold capitalize text-black">{activeAgreement.status.replaceAll("_", " ")}</span>. A signed copy is available in My Records when generated.</p>}</>}{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

function TransactionStepAdvance({ reference }: { reference: string }) {
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const advance = trpc.transactions.saveStep.useMutation({ onSuccess: () => transaction.refetch() });
  const [message, setMessage] = useState("");
  const record = transaction.data?.transaction;
  if (!record) return null;
  const rentalNext: Record<string, [string, string]> = {
    identity: ["eligibility", "Continue to driving eligibility"], eligibility: ["insurance", "Continue to insurance"], insurance: ["additional_drivers", "Continue to additional drivers"], additional_drivers: ["membership", "Continue to membership review"], membership: ["pricing", "Continue to pricing review"],
  };
  const purchaseNext: Record<string, [string, string]> = {
    identity: ["trade_in", "Continue to trade-in"], trade_in: ["payment_path", "Continue to cash or finance"], payment_path: [record.purchasePaymentPath === "finance" ? "financing" : "down_payment", record.purchasePaymentPath === "finance" ? "Continue to financing review" : "Continue to down payment"], down_payment: ["insurance", "Continue to insurance"], insurance: ["review", "Continue to review"],
  };
  const next = (record.transactionType === "rental" ? rentalNext : purchaseNext)[record.currentStep];
  if (!next) return null;
  const continueJourney = async () => {
    try { setMessage(""); await advance.mutateAsync({ reference, currentStep: next[0] }); setMessage("Progress saved. The next transaction stage is now ready."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "This stage cannot be advanced yet."); }
  };
  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Transaction progression</p><p className="mt-2 text-xs leading-5 text-gray-600">Continue only after completing the current stage. DreamCarz validates required saved records before progress is updated.</p><button type="button" disabled={advance.isPending} onClick={() => void continueJourney()} className="mt-4 inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{advance.isPending ? "Saving progress…" : next[1]}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
}

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardShell({ children, title }: DashboardShellProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const dreamcarzId = trpc.dreamcarzId.overview.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: false });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiFocused, setAiFocused] = useState(false);
  const utils = trpc.useUtils();
  const transactionReference = new URLSearchParams(location.split("?")[1] ?? "").get("ref");
  const withdrawal = trpc.transactions.withdrawIdentityConsent.useMutation({
    onSuccess: async () => {
      if (!transactionReference) return;
      await utils.transactions.get.invalidate({ reference: transactionReference });
    },
  });
  const deletionRequest = trpc.transactions.requestIdentityRecordDeletion.useMutation({
    onSuccess: async () => {
      if (!transactionReference) return;
      await utils.transactions.get.invalidate({ reference: transactionReference });
    },
  });

  const withdrawIdentityConsent = async (consentType: "identity_document" | "identity_biometric") => {
    if (!transactionReference || !window.confirm("Withdraw this consent? Identity verification will pause and the transaction will require DreamCarz manual review.")) return;
    await withdrawal.mutateAsync({ reference: transactionReference, consentType });
  };

  const requestIdentityDeletion = async () => {
    if (!transactionReference || !window.confirm("Request review for deletion of identity records? DreamCarz will pause this transaction and evaluate applicable retention obligations before deleting any secure records.")) return;
    await deletionRequest.mutateAsync({ reference: transactionReference });
  };

  const firstName = user?.name?.split(" ")[0] || "Member";
  const membershipName = dreamcarzId.data?.membership?.plan.name ?? null;
  const profileStatus = dreamcarzId.data?.profile?.profileStatus ?? "incomplete";
  const tier = membershipName ?? "DreamCarz ID";
  const tierGradient = membershipName ? (tierColors[membershipName] || tierColors.Pro) : "linear-gradient(90deg, #111, #4b4030)";
  const headerStatus = membershipName ? `${membershipName} member` : `Profile ${profileStatus.replaceAll("_", " ")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5">
            <Car size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Member Dashboard</h2>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-sans)" }}>Sign in to access your DreamCarz member dashboard.</p>
          <Link href="/login" className="block w-full py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors">Sign In</Link>
          <Link href="/" className="block mt-3 text-sm text-gray-400 hover:text-black transition-colors">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[210px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-5 h-[68px] border-b border-gray-100 flex-shrink-0">
          <img src="/manus-storage/logo-dark-mark-crop_f052e278.png" alt="DC" className="h-7 w-auto object-contain" />
          <img src="/manus-storage/logo-dark-wordmark-crop_bb978492.png" alt="DREAMCARZ" className="h-[12px] w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {[...sidebarLinks, ...(user?.role === "admin" ? [{ href: "/dashboard/operations", label: "Operations", icon: ShieldCheck }] : [])].map((link) => {
            const Icon = link.icon;
            const active = location === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] font-medium transition-all duration-150 ${active ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-50"}`}
              >
                <Icon size={16} className={active ? "text-white" : "text-gray-400"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 flex-shrink-0 space-y-3">
          <div className="rounded-2xl bg-black text-white p-4 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">DreamCarz Value</p>
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Eligible activity</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Review your available value in My Account</p>
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-500">Approved transportation use</p>
              <p className="text-[11px] font-bold text-white">Program rules apply</p>
            </div>
            <p className="text-[10px] text-gray-500">Eligibility, release, redemption, and availability apply.</p>
            <Link href="/dashboard/rewards" className="mt-2 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              View activity <ChevronRight size={10} />
            </Link>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{firstName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-black truncate">{user?.name || "Member"}</p>
              <p className="text-[10px] capitalize text-gray-400">{headerStatus}</p>
            </div>
            <button onClick={() => logout()} className="text-gray-300 hover:text-black transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-[210px] flex flex-col min-h-screen">
        <div className="sticky top-0 z-20">
          <div className="h-1.5 w-full" style={{ background: tierGradient }} />
          <header className="bg-white border-b border-gray-100 px-5 lg:px-8 flex items-center gap-4" style={{ minHeight: "68px" }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-black">
              <Menu size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {title || `Welcome back, ${firstName}`}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider text-white" style={{ background: tierGradient }}>
                  {headerStatus}
                </span>
                {dreamcarzId.data?.membership?.startsAt && <span className="text-[11px] text-gray-400">· Active since {new Date(dreamcarzId.data.membership.startsAt).getFullYear()}</span>}
              </div>
            </div>
            <div className={`hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 w-64 transition-all duration-200 ${aiFocused ? "shadow-[0_0_0_2px_rgba(0,0,0,0.1)] bg-white" : ""}`}>
              <Sparkles size={14} className="text-gray-300 flex-shrink-0" />
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onFocus={() => setAiFocused(true)}
                onBlur={() => setAiFocused(false)}
                placeholder="Ask DreamCarz anything..."
                className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none"
              />
              <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${aiInput.trim() ? "bg-black text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                <ArrowUp size={13} />
              </button>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </header>
        </div>
        <main className="flex-1 p-5 lg:p-8">
          {children}
          {location.startsWith("/dashboard/transactions") && transactionReference && <section className="mx-auto mt-8 max-w-6xl border-t border-gray-200 pt-5"><p className="text-xs leading-5 text-gray-500">Need to change your mind about identity processing? Withdrawing consent pauses this transaction and routes it to manual review. You may also request record deletion; DreamCarz will first evaluate applicable legal and retention obligations.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={withdrawal.isPending} onClick={() => void withdrawIdentityConsent("identity_document")} className="text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Withdraw license-document consent</button><button type="button" disabled={withdrawal.isPending} onClick={() => void withdrawIdentityConsent("identity_biometric")} className="text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Withdraw selfie consent</button><button type="button" disabled={deletionRequest.isPending} onClick={() => void requestIdentityDeletion()} className="text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Request identity-record deletion</button></div>{withdrawal.error && <p className="mt-3 text-xs text-red-600">{withdrawal.error.message}</p>}{deletionRequest.error && <p className="mt-3 text-xs text-red-600">{deletionRequest.error.message}</p>}</section>}
          {location.startsWith("/dashboard/transactions") && transactionReference && <IdentityVerificationLauncher reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <PaymentMethodSetupLauncher reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <RentalConditionReportPanel reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <TransactionDetailsPanel reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <TransactionStepAdvance reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <NativeAgreementPanel reference={transactionReference} />}
        </main>
        <AIConcierge />
      </div>
    </div>
  );
}
