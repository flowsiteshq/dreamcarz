import { trpc } from "@/lib/trpc";
import { ArrowRight, CalendarClock, Loader2, LockKeyhole, MapPin, ShieldCheck, Upload, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ProfileForm = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
};

const emptyProfile: ProfileForm = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "MD", postalCode: "", dateOfBirth: "" };
const fieldClass = "h-10 w-full rounded-xl border border-[#e7e7e7] bg-white px-3 text-sm outline-none focus:border-black";

export function ConciergeEnrollmentPanel({ reference, onProgress }: { reference: string; onProgress: (message: string) => void }) {
  const utils = trpc.useUtils();
  const journey = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const saveSchedule = trpc.transactions.saveRentalSchedule.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveProfile = trpc.transactions.saveProfile.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const advanceStep = trpc.transactions.saveStep.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveEligibility = trpc.transactions.saveEligibility.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveInsurance = trpc.transactions.saveInsurance.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const uploadIdentityDocument = trpc.transactions.uploadIdentityDocument.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveTradeIn = trpc.transactions.saveTradeIn.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const savePurchasePaymentPath = trpc.transactions.savePurchasePaymentPath.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const [pickupMethod, setPickupMethod] = useState<"pickup" | "delivery">("pickup");
  const [requestedStartAt, setRequestedStartAt] = useState("");
  const [requestedEndAt, setRequestedEndAt] = useState("");
  const [pickupLocation, setPickupLocation] = useState("DreamCarz Lanham");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [identityConsent, setIdentityConsent] = useState(false);
  const [eligibilityAttested, setEligibilityAttested] = useState(false);
  const [insurance, setInsurance] = useState({ insurer: "", policyLastFour: "", coverageExpiresOn: "", consent: false });
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInDescription, setTradeInDescription] = useState("");
  const [paymentPath, setPaymentPath] = useState<"cash" | "finance" | null>(null);
  const [creditAuthorized, setCreditAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = journey.data?.profile;
    const transaction = journey.data?.transaction;
    if (!saved && !transaction) return;
    setProfile({
      fullName: saved?.fullName ?? transaction?.contactName ?? "",
      phone: saved?.phone ?? transaction?.contactPhone ?? "",
      addressLine1: saved?.addressLine1 ?? transaction?.addressLine1 ?? "",
      addressLine2: saved?.addressLine2 ?? transaction?.addressLine2 ?? "",
      city: saved?.city ?? transaction?.city ?? "",
      state: saved?.state ?? transaction?.state ?? "MD",
      postalCode: saved?.postalCode ?? transaction?.postalCode ?? "",
      dateOfBirth: saved?.dateOfBirth ?? "",
    });
  }, [journey.data]);

  if (journey.isLoading) return <div className="mt-5 flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Opening your secure enrollment…</div>;
  if (journey.error || !journey.data?.transaction) return <p className="mt-5 text-sm text-red-700">Your enrollment could not be opened here. Please try again.</p>;

  const transaction = journey.data.transaction;
  const submitSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestedStartAt || !requestedEndAt) { setError("Choose a pickup and return time."); return; }
    try {
      setError("");
      await saveSchedule.mutateAsync({
        reference,
        requestedStartAt: new Date(requestedStartAt),
        requestedEndAt: new Date(requestedEndAt),
        pickupMethod,
        pickupLocation: pickupMethod === "pickup" ? pickupLocation : undefined,
        deliveryAddress: pickupMethod === "delivery" ? deliveryAddress : undefined,
      });
      onProgress("Great. I saved your requested handoff. Let’s confirm your details.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that yet."); }
  };
  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError("");
      await saveProfile.mutateAsync({ reference, ...profile, addressLine2: profile.addressLine2 || undefined });
      onProgress("Thank you. Your details are saved. I’ll keep guiding you through the next secure step here.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save those details yet."); }
  };
  const continueToIdentity = async () => {
    try {
      setError("");
      await advanceStep.mutateAsync({ reference, currentStep: "identity" });
      onProgress("Your contact review remains pending. When you’re ready, the next secure step is identity and driver’s-license review.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not continue yet."); }
  };
  const readFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = String(reader.result ?? ""); resolve(result.includes(",") ? result.split(",")[1] : result); };
    reader.onerror = () => reject(new Error("We could not read that file."));
    reader.readAsDataURL(file);
  });
  const uploadLicense = async (documentType: "license_front" | "license_back", file?: File) => {
    if (!file) return;
    if (!identityConsent) { setError("Please confirm your document consent first."); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 6 * 1024 * 1024) { setError("Use a JPG, PNG, or WEBP image that is 6 MB or smaller."); return; }
    try {
      setError("");
      await uploadIdentityDocument.mutateAsync({ reference, documentType, filename: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: await readFile(file), identityDocumentConsent: true });
      onProgress(documentType === "license_front" ? "Thank you. Your driver’s-license front is saved for protected review." : "Your supporting license image is saved for protected review.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that record."); }
  };
  const continueFromIdentity = async () => {
    const nextStep = transaction.transactionType === "purchase" ? "trade_in" : "eligibility";
    try { setError(""); await advanceStep.mutateAsync({ reference, currentStep: nextStep }); onProgress(nextStep === "trade_in" ? "Thanks. Do you have a vehicle to trade in?" : "Thanks. Next, we’ll record a brief eligibility attestation here."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Add your license front before continuing."); }
  };
  const submitEligibility = async () => {
    if (!eligibilityAttested) { setError("Confirm the attestation to continue."); return; }
    try { setError(""); await saveEligibility.mutateAsync({ reference, attestsInformationAccurate: true }); await advanceStep.mutateAsync({ reference, currentStep: "insurance" }); onProgress("Thank you. Let’s add your insurance details securely."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that yet."); }
  };
  const submitInsurance = async () => {
    if (!insurance.consent) { setError("Confirm insurance-review consent to continue."); return; }
    const nextStep = transaction.transactionType === "purchase" ? "review" : "additional_drivers";
    try { setError(""); await saveInsurance.mutateAsync({ reference, insurer: insurance.insurer, policyLastFour: insurance.policyLastFour, coverageExpiresOn: insurance.coverageExpiresOn, insuranceReviewConsent: true }); await advanceStep.mutateAsync({ reference, currentStep: nextStep }); onProgress(nextStep === "review" ? "Your insurance details are saved for review. I’ll keep your purchase request here while DreamCarz reviews it." : "Your insurance details are saved for review. Do you want to add another driver?"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that yet."); }
  };
  const continueStep = async (currentStep: string, message: string) => {
    try { setError(""); await advanceStep.mutateAsync({ reference, currentStep }); onProgress(message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "We could not continue yet."); }
  };

  if (transaction.currentStep === "dates") return <form onSubmit={submitSchedule} className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><CalendarClock size={16} /></span><div><p className="text-sm font-semibold">Let’s plan your handoff.</p><p className="mt-1 text-xs leading-5 text-gray-500">This is a request until DreamCarz confirms it.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold">Pickup<input required type="datetime-local" value={requestedStartAt} onChange={event => setRequestedStartAt(event.target.value)} className={fieldClass} /></label><label className="grid gap-1.5 text-xs font-semibold">Return<input required type="datetime-local" value={requestedEndAt} onChange={event => setRequestedEndAt(event.target.value)} className={fieldClass} /></label></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => setPickupMethod("pickup")} className={`rounded-full px-3 py-2 text-xs font-semibold ${pickupMethod === "pickup" ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>Pickup</button><button type="button" onClick={() => setPickupMethod("delivery")} className={`rounded-full px-3 py-2 text-xs font-semibold ${pickupMethod === "delivery" ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>Delivery</button></div>{pickupMethod === "pickup" ? <label className="mt-4 grid gap-1.5 text-xs font-semibold">Preferred pickup location<input required value={pickupLocation} onChange={event => setPickupLocation(event.target.value)} className={fieldClass} /></label> : <label className="mt-4 grid gap-1.5 text-xs font-semibold">Requested delivery address<input required value={deliveryAddress} onChange={event => setDeliveryAddress(event.target.value)} className={fieldClass} autoComplete="street-address" /></label>}{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button disabled={saveSchedule.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saveSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></form>;

  if (transaction.currentStep === "profile") return <form onSubmit={submitProfile} className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><LockKeyhole size={16} /></span><div><p className="text-sm font-semibold">Let’s save your secure details.</p><p className="mt-1 text-xs leading-5 text-gray-500">This form is protected and is not sent through chat.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold">Legal name<input required value={profile.fullName} onChange={event => setProfile(current => ({ ...current, fullName: event.target.value }))} className={fieldClass} autoComplete="name" /></label><label className="grid gap-1.5 text-xs font-semibold">Mobile number<input required type="tel" value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} className={fieldClass} autoComplete="tel" /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2">Street address<input required value={profile.addressLine1} onChange={event => setProfile(current => ({ ...current, addressLine1: event.target.value }))} className={fieldClass} autoComplete="street-address" /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2">Apartment or suite <span className="font-normal text-gray-500">(optional)</span><input value={profile.addressLine2} onChange={event => setProfile(current => ({ ...current, addressLine2: event.target.value }))} className={fieldClass} autoComplete="address-line2" /></label><label className="grid gap-1.5 text-xs font-semibold">City<input required value={profile.city} onChange={event => setProfile(current => ({ ...current, city: event.target.value }))} className={fieldClass} autoComplete="address-level2" /></label><label className="grid gap-1.5 text-xs font-semibold">State<input required value={profile.state} onChange={event => setProfile(current => ({ ...current, state: event.target.value }))} className={fieldClass} autoComplete="address-level1" /></label><label className="grid gap-1.5 text-xs font-semibold">Postal code<input required value={profile.postalCode} onChange={event => setProfile(current => ({ ...current, postalCode: event.target.value }))} className={fieldClass} autoComplete="postal-code" /></label><label className="grid gap-1.5 text-xs font-semibold">Date of birth<input required type="date" value={profile.dateOfBirth} onChange={event => setProfile(current => ({ ...current, dateOfBirth: event.target.value }))} className={fieldClass} autoComplete="bday" /></label></div>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button disabled={saveProfile.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Save & continue</button></form>;

  if (transaction.currentStep === "contact_verification") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><UserRound size={16} /></span><div><p className="text-sm font-semibold">Contact review is next.</p><p className="mt-1 text-xs leading-5 text-gray-500">DreamCarz will not mark your contact details verified until a provider result or authorized review is recorded.</p></div></div>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void continueToIdentity()} disabled={advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{advanceStep.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "identity") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><LockKeyhole size={16} /></span><div><p className="text-sm font-semibold">Secure identity review.</p><p className="mt-1 text-xs leading-5 text-gray-500">Your license files stay out of chat and are reviewed separately.</p></div></div><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-600"><input checked={identityConsent} onChange={event => setIdentityConsent(event.target.checked)} type="checkbox" className="mt-0.5 h-4 w-4 accent-black" /> I consent to secure driver’s-license collection and review for this rental.</label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold"><Upload className="mb-3 h-4 w-4 text-[#a8832d]" />License front<input onChange={event => void uploadLicense("license_front", event.target.files?.[0])} className="sr-only" accept="image/jpeg,image/png,image/webp" type="file" /></label><label className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold"><Upload className="mb-3 h-4 w-4 text-[#a8832d]" />License back <span className="font-normal text-gray-500">(optional)</span><input onChange={event => void uploadLicense("license_back", event.target.files?.[0])} className="sr-only" accept="image/jpeg,image/png,image/webp" type="file" /></label></div>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void continueFromIdentity()} disabled={advanceStep.isPending || uploadIdentityDocument.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{uploadIdentityDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "trade_in") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><p className="text-sm font-semibold">Do you have a trade-in?</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setHasTradeIn(false)} className={`rounded-full px-3 py-2 text-xs font-semibold ${!hasTradeIn ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>No trade-in</button><button type="button" onClick={() => setHasTradeIn(true)} className={`rounded-full px-3 py-2 text-xs font-semibold ${hasTradeIn ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>I have one</button></div>{hasTradeIn ? <label className="mt-4 grid gap-1.5 text-xs font-semibold">Vehicle description<input value={tradeInDescription} onChange={event => setTradeInDescription(event.target.value)} className={fieldClass} placeholder="Year, make, model" /></label> : null}{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void (async () => { if (hasTradeIn && !tradeInDescription.trim()) { setError("Describe your trade-in before continuing."); return; } try { setError(""); await saveTradeIn.mutateAsync({ reference, hasTradeIn, vehicleDescription: hasTradeIn ? tradeInDescription : undefined }); await advanceStep.mutateAsync({ reference, currentStep: "payment_path" }); onProgress("Thank you. Would you like to use cash or explore financing?"); } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that yet."); } })()} disabled={saveTradeIn.isPending || advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saveTradeIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "payment_path") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><p className="text-sm font-semibold">How would you like to proceed?</p><p className="mt-1 text-xs leading-5 text-gray-500">This records your preference. It does not start a payment or credit request.</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setPaymentPath("cash")} className={`rounded-full px-3 py-2 text-xs font-semibold ${paymentPath === "cash" ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>Cash</button><button type="button" onClick={() => setPaymentPath("finance")} className={`rounded-full px-3 py-2 text-xs font-semibold ${paymentPath === "finance" ? "bg-black text-white" : "border border-gray-200 bg-white"}`}>Financing</button></div>{paymentPath === "finance" ? <label className="mt-4 flex gap-2 text-xs leading-5 text-gray-600"><input checked={creditAuthorized} onChange={event => setCreditAuthorized(event.target.checked)} type="checkbox" className="mt-0.5 h-4 w-4 accent-black" /> I authorize DreamCarz to route a financing request only to a configured provider or manual review process.</label> : null}{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void (async () => { if (!paymentPath) { setError("Choose cash or financing to continue."); return; } if (paymentPath === "finance" && !creditAuthorized) { setError("Confirm authorization before choosing financing."); return; } try { setError(""); await savePurchasePaymentPath.mutateAsync({ reference, paymentPath, creditAuthorization: paymentPath === "finance" ? true : undefined }); await advanceStep.mutateAsync({ reference, currentStep: paymentPath === "finance" ? "financing" : "down_payment" }); onProgress(paymentPath === "finance" ? "Your financing preference is saved. DreamCarz will keep the next review here." : "Your cash preference is saved. I’ll keep the next review here."); } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save that yet."); } })()} disabled={savePurchasePaymentPath.isPending || advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savePurchasePaymentPath.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "eligibility") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><ShieldCheck size={16} /></span><div><p className="text-sm font-semibold">Eligibility review.</p><p className="mt-1 text-xs leading-5 text-gray-500">DreamCarz completes the final eligibility decision separately.</p></div></div><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-600"><input checked={eligibilityAttested} onChange={event => setEligibilityAttested(event.target.checked)} type="checkbox" className="mt-0.5 h-4 w-4 accent-black" /> I confirm the information I have provided is accurate.</label>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void submitEligibility()} disabled={saveEligibility.isPending || advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saveEligibility.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "insurance") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><ShieldCheck size={16} /></span><div><p className="text-sm font-semibold">Insurance review.</p><p className="mt-1 text-xs leading-5 text-gray-500">Only limited policy details are requested here; review remains pending.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold sm:col-span-3">Insurer<input required value={insurance.insurer} onChange={event => setInsurance(current => ({ ...current, insurer: event.target.value }))} className={fieldClass} /></label><label className="grid gap-1.5 text-xs font-semibold">Policy last 4<input required maxLength={4} value={insurance.policyLastFour} onChange={event => setInsurance(current => ({ ...current, policyLastFour: event.target.value }))} className={fieldClass} /></label><label className="grid gap-1.5 text-xs font-semibold sm:col-span-2">Coverage expiration<input required type="date" value={insurance.coverageExpiresOn} onChange={event => setInsurance(current => ({ ...current, coverageExpiresOn: event.target.value }))} className={fieldClass} /></label></div><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-600"><input checked={insurance.consent} onChange={event => setInsurance(current => ({ ...current, consent: event.target.checked }))} type="checkbox" className="mt-0.5 h-4 w-4 accent-black" /> I consent to insurance review for this rental.</label>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void submitInsurance()} disabled={saveInsurance.isPending || advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saveInsurance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={15} />} Continue</button></div>;

  if (transaction.currentStep === "additional_drivers") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><p className="text-sm font-semibold">Additional drivers.</p><p className="mt-1 text-xs leading-5 text-gray-500">You can continue without an additional driver. Each additional driver requires separate review.</p>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void continueStep("membership", "No problem. Next, we’ll review your membership path.")} disabled={advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><ArrowRight size={15} /> Continue</button></div>;

  if (transaction.currentStep === "membership") return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><p className="text-sm font-semibold">Membership review.</p><p className="mt-1 text-xs leading-5 text-gray-500">Your selected vehicle path is retained while DreamCarz reviews applicable membership rules.</p>{error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}<button type="button" onClick={() => void continueStep("pricing", "I’ll keep your request moving while DreamCarz reviews the next step.")} disabled={advanceStep.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><ArrowRight size={15} /> Continue</button></div>;

  const title = transaction.currentStep === "identity" ? "Identity and driver’s-license review" : transaction.currentStep.replaceAll("_", " ");
  return <div className="mt-5 border border-[#e5d6a3] bg-[#fffdf8] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><MapPin size={16} /></span><div><p className="text-sm font-semibold capitalize">{title}</p><p className="mt-1 text-xs leading-5 text-gray-500">I’ll keep this enrollment here. Secure provider, payment, and manual-review steps remain protected.</p></div></div></div>;
}
