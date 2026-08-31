import { useAuth } from "@/_core/hooks/useAuth";
import DashboardShell from "@/components/DashboardShell";
import CustomerRecordsBackoffice from "@/components/CustomerRecordsBackoffice";
import InsuranceProofUpload from "@/components/InsuranceProofUpload";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgeCheck, CalendarClock, CheckCircle2, CircleAlert, ClipboardCheck, FilePenLine, Loader2, LockKeyhole, MapPin, ShieldCheck, Upload, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const rentalSteps = [["vehicle", "Vehicle selected"], ["dates", "Dates & handoff"], ["profile", "Profile & address"], ["contact_verification", "Phone & email"], ["identity", "Identity & license"], ["eligibility", "Driving eligibility"], ["insurance", "Insurance & protection"], ["additional_drivers", "Additional drivers"], ["membership", "Membership review"], ["pricing", "Pricing & deposit"], ["payment", "Payment method"], ["review", "Review & authorization"], ["agreement", "Rental agreement"], ["confirmation", "Confirmation"], ["pickup", "Pickup or delivery"], ["active_rental", "Active rental"], ["return", "Return & inspection"], ["settlement", "Final settlement"]] as const;
const purchaseSteps = [["vehicle", "Vehicle selected"], ["profile", "Profile & address"], ["identity", "Identity verification"], ["trade_in", "Trade-in"], ["payment_path", "Cash or finance"], ["financing", "Financing review"], ["down_payment", "Down payment"], ["insurance", "Insurance"], ["review", "Review & authorization"], ["agreement", "Purchase documents"], ["confirmation", "Confirmation"], ["delivery", "Delivery or pickup"]] as const;

type ProfileForm = { fullName: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; postalCode: string; dateOfBirth: string };
type ConditionForm = { odometerReading: string; fuelLevel: string; notes: string };
type RentalScheduleForm = { requestedStartAt: string; requestedEndAt: string; pickupMethod: "pickup" | "delivery"; pickupLocation: string; deliveryAddress: string; customerNotes: string };
const emptyProfile: ProfileForm = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "MD", postalCode: "", dateOfBirth: "" };
const emptyCondition: ConditionForm = { odometerReading: "", fuelLevel: "", notes: "" };
const emptyRentalSchedule: RentalScheduleForm = { requestedStartAt: "", requestedEndAt: "", pickupMethod: "pickup", pickupLocation: "DreamCarz Lanham", deliveryAddress: "", customerNotes: "" };
const inputClass = "h-11 w-full border border-gray-200 bg-white px-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-black";

function formatStatus(status?: string | null) {
  return status ? status.replaceAll("_", " ") : "not started";
}

function RentalScheduleStage({ form, error, saving, onChange, onSubmit }: { form: RentalScheduleForm; error: string; saving: boolean; onChange: (next: RentalScheduleForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit} className="mx-auto max-w-3xl border border-gray-200 bg-[#fbfaf7] p-6 sm:p-9"><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><CalendarClock size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Rental timing</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Plan your handoff.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">Choose the requested rental window and how you would like to receive the vehicle. This is a request, not a confirmed reservation or delivery promise.</p></div></div><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Requested pickup<input required value={form.requestedStartAt} onChange={event => onChange({ ...form, requestedStartAt: event.target.value })} className={inputClass} type="datetime-local" /></label><label className="grid gap-2 text-sm font-semibold">Requested return<input required value={form.requestedEndAt} onChange={event => onChange({ ...form, requestedEndAt: event.target.value })} className={inputClass} type="datetime-local" /></label></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => onChange({ ...form, pickupMethod: "pickup" })} className={`border p-5 text-left ${form.pickupMethod === "pickup" ? "border-black bg-white" : "border-gray-200 bg-[#f4f1e9]"}`}><MapPin className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold">DreamCarz pickup</p><p className="mt-1 text-xs leading-5 text-gray-500">Handoff location confirmed by DreamCarz.</p></button><button type="button" onClick={() => onChange({ ...form, pickupMethod: "delivery" })} className={`border p-5 text-left ${form.pickupMethod === "delivery" ? "border-black bg-white" : "border-gray-200 bg-[#f4f1e9]"}`}><MapPin className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold">Deliver to me</p><p className="mt-1 text-xs leading-5 text-gray-500">Subject to service area, scheduling, and approval.</p></button></div>{form.pickupMethod === "pickup" ? <label className="mt-5 grid gap-2 text-sm font-semibold">Preferred pickup location<input required value={form.pickupLocation} onChange={event => onChange({ ...form, pickupLocation: event.target.value })} className={inputClass} /></label> : <label className="mt-5 grid gap-2 text-sm font-semibold">Requested delivery address<textarea required value={form.deliveryAddress} onChange={event => onChange({ ...form, deliveryAddress: event.target.value })} className={`${inputClass} min-h-24 py-3`} /></label>}<label className="mt-5 grid gap-2 text-sm font-semibold">Notes <span className="font-normal text-gray-500">(optional)</span><textarea value={form.customerNotes} onChange={event => onChange({ ...form, customerNotes: event.target.value })} className={`${inputClass} min-h-24 py-3`} placeholder="Accessibility, timing, or handoff notes" /></label>{error && <p className="mt-5 text-sm text-red-600">{error}</p>}<div className="mt-8 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center"><p className="max-w-xl text-xs leading-5 text-gray-500">DreamCarz will review vehicle availability, location, and delivery feasibility before confirming this request.</p><button disabled={saving} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-black px-6 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={16} />} Save dates & continue</button></div></form>;
}

export default function TransactionOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const search = typeof window === "undefined" ? "" : window.location.search;
  const parameters = useMemo(() => new URLSearchParams(search), [search]);
  const reference = parameters.get("ref") ?? "";
  const intent = parameters.get("intent") === "purchase" ? "purchase" : parameters.get("intent") === "rental" ? "rental" : null;
  const vehicleId = parameters.get("vehicle") ?? "";
  const membershipPlan = parameters.get("plan") ?? undefined;
  const utils = trpc.useUtils();
  const launchAttempt = useRef("");
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [profileError, setProfileError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [identityConsents, setIdentityConsents] = useState({ documents: false, selfie: false });
  const [conditionForm, setConditionForm] = useState<ConditionForm>(emptyCondition);
  const [conditionError, setConditionError] = useState("");
  const [scheduleForm, setScheduleForm] = useState<RentalScheduleForm>(emptyRentalSchedule);
  const [scheduleError, setScheduleError] = useState("");
  const [paymentReturnMessage, setPaymentReturnMessage] = useState("");
  const cocardReturnAttempt = useRef("");

  const startTransaction = trpc.transactions.begin.useMutation({ onSuccess: result => setLocation(`/dashboard/transactions?ref=${encodeURIComponent(result.reference)}`) });
  const transactionQuery = trpc.transactions.get.useQuery({ reference }, { enabled: Boolean(user && reference), refetchOnWindowFocus: false });
  const backOfficeQuery = trpc.transactions.backOffice.useQuery(undefined, { enabled: Boolean(user && !reference && !intent && !vehicleId), refetchOnWindowFocus: false });
  const saveProfile = trpc.transactions.saveProfile.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveRentalSchedule = trpc.transactions.saveRentalSchedule.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const saveStep = trpc.transactions.saveStep.useMutation({ onSuccess: () => utils.transactions.get.invalidate({ reference }) });
  const getRecordLink = trpc.transactions.getRecordLink.useMutation();
  const uploadIdentityDocument = trpc.transactions.uploadIdentityDocument.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.transactions.get.invalidate({ reference }), utils.transactions.backOffice.invalidate()]);
      setDocumentError("");
    },
  });
  const withdrawIdentityConsent = trpc.transactions.withdrawIdentityConsent.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.transactions.get.invalidate({ reference }), utils.transactions.backOffice.invalidate()]);
      setIdentityConsents({ documents: false, selfie: false });
      setDocumentError("Your consent has been withdrawn. This transaction now requires DreamCarz manual review.");
    },
  });
  const submitConditionReport = trpc.transactions.submitConditionReport.useMutation({
    onSuccess: async () => {
      await transactionQuery.refetch();
      setConditionForm(emptyCondition);
      setConditionError("");
    },
  });
  const recordCoCardCheckoutReturn = trpc.transactions.recordCoCardCheckoutReturn.useMutation({
    onSuccess: async () => {
      await transactionQuery.refetch();
      setPaymentReturnMessage("CoCard returned a gateway transaction reference. DreamCarz is verifying the authorization before this transaction can proceed.");
    },
  });

  useEffect(() => {
    if (!user || reference || !intent || !vehicleId || startTransaction.isPending) return;
    const key = `${intent}:${vehicleId}:${membershipPlan ?? ""}`;
    if (launchAttempt.current === key) return;
    launchAttempt.current = key;
    startTransaction.mutate({ transactionType: intent, vehicleId, membershipPlan: membershipPlan as "free" | "freedom" | "plus" | "pro" | "elite" | "silver" | "gold" | "black" | undefined });
  }, [intent, membershipPlan, reference, startTransaction, user, vehicleId]);

  useEffect(() => {
    const checkoutAttemptToken = parameters.get("cocard_attempt");
    const gatewayTransactionId = parameters.get("cocard_transaction");
    const customerVaultId = parameters.get("cocard_vault") || undefined;
    if (!user || !reference || !checkoutAttemptToken || !gatewayTransactionId || gatewayTransactionId.includes("(") || recordCoCardCheckoutReturn.isPending) return;
    const key = `${reference}:${checkoutAttemptToken}:${gatewayTransactionId}`;
    if (cocardReturnAttempt.current === key) return;
    cocardReturnAttempt.current = key;
    recordCoCardCheckoutReturn.mutate({ reference, checkoutAttemptToken, gatewayTransactionId, customerVaultId });
  }, [parameters, recordCoCardCheckoutReturn, reference, user]);

  useEffect(() => {
    const profile = transactionQuery.data?.profile;
    const transaction = transactionQuery.data?.transaction;
    if (!profile && !transaction) return;
    setForm({
      fullName: profile?.fullName ?? transaction?.contactName ?? user?.name ?? "",
      phone: profile?.phone ?? transaction?.contactPhone ?? "",
      addressLine1: profile?.addressLine1 ?? transaction?.addressLine1 ?? "",
      addressLine2: profile?.addressLine2 ?? transaction?.addressLine2 ?? "",
      city: profile?.city ?? transaction?.city ?? "",
      state: profile?.state ?? transaction?.state ?? "MD",
      postalCode: profile?.postalCode ?? transaction?.postalCode ?? "",
      dateOfBirth: profile?.dateOfBirth ?? "",
    });
  }, [transactionQuery.data, user?.name]);

  useEffect(() => {
    const schedule = transactionQuery.data?.schedule;
    if (!schedule) return;
    const localInputValue = (value: Date | string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";
    setScheduleForm({
      requestedStartAt: localInputValue(schedule.requestedStartAt),
      requestedEndAt: localInputValue(schedule.requestedEndAt),
      pickupMethod: schedule.pickupMethod === "delivery" ? "delivery" : "pickup",
      pickupLocation: schedule.pickupLocation ?? "DreamCarz Lanham",
      deliveryAddress: schedule.deliveryAddress ?? "",
      customerNotes: schedule.customerNotes ?? "",
    });
  }, [transactionQuery.data?.schedule]);

  const saveProfileDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reference) return;
    try {
      setProfileError("");
      await saveProfile.mutateAsync({ reference, ...form, addressLine2: form.addressLine2 || undefined });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Your profile could not be saved. Please try again.");
    }
  };

  const saveScheduleDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reference) return;
    if (!scheduleForm.requestedStartAt || !scheduleForm.requestedEndAt) { setScheduleError("Choose both your requested pickup and return time."); return; }
    try {
      setScheduleError("");
      await saveRentalSchedule.mutateAsync({
        reference,
        requestedStartAt: new Date(scheduleForm.requestedStartAt),
        requestedEndAt: new Date(scheduleForm.requestedEndAt),
        pickupMethod: scheduleForm.pickupMethod,
        pickupLocation: scheduleForm.pickupMethod === "pickup" ? scheduleForm.pickupLocation : undefined,
        deliveryAddress: scheduleForm.pickupMethod === "delivery" ? scheduleForm.deliveryAddress : undefined,
        customerNotes: scheduleForm.customerNotes || undefined,
      });
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "Your requested rental dates could not be saved. Please try again.");
    }
  };

  const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const value = String(reader.result ?? ""); resolve(value.includes(",") ? value.split(",")[1] : value); };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

  const captureIdentityRecord = async (documentType: "license_front" | "license_back" | "live_selfie", file?: File) => {
    if (!file || !reference) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setDocumentError("Use a JPG, PNG, or WEBP image for identity records."); return; }
    if (file.size > 6 * 1024 * 1024) { setDocumentError("Each identity record must be 6 MB or smaller."); return; }
    if (documentType === "live_selfie" ? !identityConsents.selfie : !identityConsents.documents) { setDocumentError(documentType === "live_selfie" ? "Confirm identity and biometric consent before uploading a live selfie." : "Confirm identity-document consent before uploading a driver’s license image."); return; }
    try {
      setDocumentError("");
      const base64 = await readFileAsBase64(file);
      await uploadIdentityDocument.mutateAsync({
        reference,
        documentType,
        filename: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        base64,
        identityDocumentConsent: documentType !== "live_selfie" ? true : undefined,
        biometricConsent: documentType === "live_selfie" ? true : undefined,
      });
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Your secure identity record could not be saved. Please try again.");
    }
  };

  const advanceToIdentity = async () => {
    try {
      setDocumentError("");
      await saveStep.mutateAsync({ reference, currentStep: "identity" });
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "We could not save this step. Please try again.");
    }
  };

  const withdrawConsent = async (consentType: "identity_document" | "identity_biometric") => {
    if (!reference || !window.confirm("Withdraw this identity consent? DreamCarz will pause verification and route the transaction to manual review.")) return;
    try {
      setDocumentError("");
      await withdrawIdentityConsent.mutateAsync({ reference, consentType });
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "We could not withdraw your consent. Please try again.");
    }
  };

  const saveConditionReport = async (stage: "pickup" | "return") => {
    if (!reference) return;
    const parsedOdometer = conditionForm.odometerReading.trim() ? Number(conditionForm.odometerReading) : undefined;
    if (parsedOdometer !== undefined && (!Number.isInteger(parsedOdometer) || parsedOdometer < 0)) {
      setConditionError("Enter a valid non-negative whole-number odometer reading.");
      return;
    }
    try {
      setConditionError("");
      await submitConditionReport.mutateAsync({
        reference,
        stage,
        odometerReading: parsedOdometer,
        fuelLevel: conditionForm.fuelLevel || undefined,
        notes: conditionForm.notes || undefined,
      });
    } catch (error) {
      setConditionError(error instanceof Error ? error.message : "Your condition report could not be saved. Please try again.");
    }
  };

  const openRecord = async (recordType: "legacy_license_document" | "transaction_license_document" | "agreement", id: number) => {
    try {
      const record = await getRecordLink.mutateAsync({ recordType, id });
      window.open(record.url, "_blank", "noopener,noreferrer");
    } catch {
      setProfileError("This secure record could not be opened. Please try again or contact DreamCarz support.");
    }
  };

  if (!user) return <DashboardShell title="Transaction onboarding"><div /></DashboardShell>;

  if (!reference && intent && vehicleId) return <DashboardShell title="Transaction onboarding"><div className="mx-auto grid max-w-2xl place-items-center py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#a8832d]" /><h2 className="mt-6 font-display text-3xl font-bold">Preparing your transaction</h2><p className="mt-3 max-w-md text-sm leading-6 text-gray-500">We are securely creating your saved rental or purchase path.</p>{startTransaction.error && <><p className="mt-5 max-w-md text-sm leading-6 text-red-600">{startTransaction.error.message}</p><Link href="/fleet" className="mt-5 inline-flex text-sm font-semibold underline underline-offset-4">Return to confirmed inventory</Link></>}</div></DashboardShell>;

  if (!reference) return <DashboardShell title="My Records"><CustomerRecordsBackoffice /></DashboardShell>;

  if (!reference) {
    const records = backOfficeQuery.data;
    return <DashboardShell title="My Records"><div className="mx-auto max-w-6xl"><section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Customer back office</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black sm:text-5xl">Your agreements and license records.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Review the private records associated with your DreamCarz account. Documents appear only after you provide them or DreamCarz completes the relevant transaction stage.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><LockKeyhole className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-semibold">Private by design</p><p className="mt-2 text-sm leading-6 text-gray-500">Only you and authorized DreamCarz staff can access these account-bound records.</p></div></section>{backOfficeQuery.isLoading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#a8832d]" /></div> : backOfficeQuery.error ? <div className="mt-8 border border-red-200 bg-red-50 p-6 text-sm text-red-700">{backOfficeQuery.error.message}</div> : <section className="mt-8 grid gap-8 lg:grid-cols-2"><div className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-8"><div className="flex items-start gap-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><BadgeCheck size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Driver’s license</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Verification record</h3><p className="mt-3 text-sm leading-6 text-gray-600">Status: <strong className="capitalize text-black">{formatStatus(records?.profile?.licenseStatus)}</strong></p></div></div><div className="mt-7 divide-y divide-gray-200 border-y border-gray-200">{records?.licenseDocuments?.length ? records.licenseDocuments.map(document => <div key={`${document.recordSource}-${document.id}`} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold capitalize">{formatStatus(document.documentType)}</p><p className="mt-1 text-xs text-gray-500">{document.originalFilename} · {formatStatus(document.reviewStatus)}</p></div><button type="button" onClick={() => openRecord(document.recordSource, document.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Open securely</button></div>) : <p className="py-5 text-sm leading-6 text-gray-500">No driver-license documents are on file yet. They will appear here after the secure identity stage is completed.</p>}</div></div><div className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-8"><div className="flex items-start gap-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><FilePenLine size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Contracts & agreements</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Transaction documents</h3><p className="mt-3 text-sm leading-6 text-gray-600">Draft, sent, and signed agreement status is retained with its related vehicle transaction.</p></div></div><div className="mt-7 divide-y divide-gray-200 border-y border-gray-200">{records?.agreements?.length ? records.agreements.map(agreement => <div key={agreement.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold">{agreement.vehicleName}</p><p className="mt-1 text-xs capitalize text-gray-500">{agreement.agreementType} · Version {agreement.version} · {formatStatus(agreement.status)}</p></div>{agreement.hasSignedDocument ? <button type="button" onClick={() => openRecord("agreement", agreement.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Open securely</button> : <span className="shrink-0 text-xs text-gray-400">No signed file yet</span>}</div>) : <p className="py-5 text-sm leading-6 text-gray-500">No transaction agreements are on file yet. Agreements will appear after a legally approved template is generated and signed through the configured e-signature process.</p>}</div></div></section>}<p className="mt-8 text-center text-xs leading-5 text-gray-500">Do not share downloaded records. Agreement templates and signatures are not activated until legal review and provider configuration are complete.</p></div></DashboardShell>;
  }

  if (transactionQuery.isLoading) return <DashboardShell title="Transaction onboarding"><div className="grid min-h-80 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#a8832d]" /></div></DashboardShell>;
  const transaction = transactionQuery.data?.transaction;
  if (transactionQuery.error || !transaction) return <DashboardShell title="Transaction onboarding"><div className="mx-auto max-w-2xl border border-gray-200 bg-[#fbfaf7] p-8"><CircleAlert className="h-7 w-7 text-[#a8832d]" /><h2 className="mt-5 font-display text-3xl font-bold">We could not open this transaction.</h2><p className="mt-3 text-sm leading-6 text-gray-600">{transactionQuery.error?.message ?? "The selected transaction is unavailable."}</p><Link href="/fleet" className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">Return to confirmed inventory</Link></div></DashboardShell>;

  const isPurchase = transaction.transactionType === "purchase";
  const steps = isPurchase ? purchaseSteps : rentalSteps;
  const activeIndex = Math.max(0, steps.findIndex(([id]) => id === transaction.currentStep));
  const isDatesStep = !isPurchase && transaction.currentStep === "dates";
  const needsProfile = transaction.currentStep === "profile";
  const isIdentityStep = transaction.currentStep === "identity";
  const isContactStep = transaction.currentStep === "contact_verification";
  const isConditionStep = !isPurchase && ["pickup", "active_rental", "return"].includes(transaction.currentStep);
  const conditionStage = transaction.currentStep === "pickup" ? "pickup" as const : "return" as const;
  const hasFaceLivenessManualReview = transaction.identityProvider === "aws_face_liveness" && transaction.identityStatus === "manual_review";

  if (isDatesStep) return <DashboardShell title="Rental journey"><div className="mx-auto max-w-6xl"><section className="mb-8 border-b border-gray-200 pb-7"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Rental transaction · {transaction.reference}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em]">{transaction.vehicleName}</h1><p className="mt-3 text-sm leading-6 text-gray-600">Step 1 of {rentalSteps.length}: requested dates and handoff preference.</p></section><RentalScheduleStage form={scheduleForm} error={scheduleError} saving={saveRentalSchedule.isPending} onChange={setScheduleForm} onSubmit={saveScheduleDetails} /></div></DashboardShell>;

  if (transaction.currentStep === "insurance") return <DashboardShell title={isPurchase ? "Purchase journey" : "Rental journey"}><div className="mx-auto max-w-6xl"><section className="mb-8 border-b border-gray-200 pb-7"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">{isPurchase ? "Purchase transaction" : "Rental transaction"} · {transaction.reference}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em]">{transaction.vehicleName}</h1><p className="mt-3 text-sm leading-6 text-gray-600">Insurance status: <strong>{formatStatus(transaction.insuranceStatus)}</strong>. DreamCarz reviews proof before any release decision.</p></section>{hasFaceLivenessManualReview ? <section className="mb-6 border border-[#e7d8a9] bg-[#fffbef] p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Liveness check complete</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-black">Face Liveness completed successfully.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">This confirms that the live liveness check was completed. DreamCarz now completes the separate driver’s-license review. License validity, eligibility, insurance, payment, agreement, and vehicle release are separate decisions and remain pending until their own required review is complete.</p></section> : null}<InsuranceProofUpload reference={reference} /></div></DashboardShell>;

  return <DashboardShell title={isPurchase ? "Purchase journey" : "Rental journey"}><div className="mx-auto max-w-6xl"><section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">{isPurchase ? "Purchase transaction" : "Rental transaction"} · {transaction.reference}</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black sm:text-5xl">{transaction.vehicleName}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Your progress is saved to your DreamCarz profile. Current vehicle availability, pricing, deposits, financing, and final terms remain subject to DreamCarz review and the applicable agreement.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Current status</p><p className="mt-2 text-lg font-bold capitalize">{formatStatus(transaction.status)}</p><p className="mt-2 text-sm leading-6 text-gray-500">Next: {steps[activeIndex]?.[1] ?? "DreamCarz review"}</p></div></section><section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><aside className="bg-black p-6 text-white sm:p-8"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1ad54]">Transaction path</p><span className="text-xs text-white/60">{activeIndex + 1} / {steps.length}</span></div><ol className="mt-7 space-y-3">{steps.map(([id, label], index) => <li key={id} className={`flex items-center gap-3 text-sm ${index === activeIndex ? "text-white" : index < activeIndex ? "text-white/70" : "text-white/40"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === activeIndex ? "bg-[#a8832d] text-black" : index < activeIndex ? "bg-white text-black" : "border border-white/25"}`}>{index < activeIndex ? <CheckCircle2 size={13} /> : index + 1}</span>{label}</li>)}</ol><div className="mt-8 border-t border-white/15 pt-6 text-xs leading-5 text-white/65"><ShieldCheck className="mb-3 h-5 w-5 text-[#d1ad54]" />DreamCarz does not store card numbers, security codes, face templates, or provider client secrets. Verification and payment stages are activated only through configured providers or secure manual review.</div></aside><div className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-9">{needsProfile ? <form onSubmit={saveProfileDetails}><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><UserRound size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Saved profile</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Confirm your details.</h3><p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">We prefill what is already on your account. Update it once here; future rental and purchase transactions can reuse the verified profile when re-verification is not required.</p></div></div><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Legal name<input required value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} className={inputClass} autoComplete="name" /></label><label className="grid gap-2 text-sm font-semibold">Mobile number<input required value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} className={inputClass} type="tel" autoComplete="tel" /></label><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Street address<input required value={form.addressLine1} onChange={event => setForm(current => ({ ...current, addressLine1: event.target.value }))} className={inputClass} autoComplete="street-address" /></label><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Apartment, suite, or unit <span className="font-normal text-gray-500">(optional)</span><input value={form.addressLine2} onChange={event => setForm(current => ({ ...current, addressLine2: event.target.value }))} className={inputClass} autoComplete="address-line2" /></label><label className="grid gap-2 text-sm font-semibold">City<input required value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} className={inputClass} autoComplete="address-level2" /></label><label className="grid gap-2 text-sm font-semibold">State<input required value={form.state} onChange={event => setForm(current => ({ ...current, state: event.target.value }))} className={inputClass} autoComplete="address-level1" /></label><label className="grid gap-2 text-sm font-semibold">Postal code<input required value={form.postalCode} onChange={event => setForm(current => ({ ...current, postalCode: event.target.value }))} className={inputClass} autoComplete="postal-code" /></label><label className="grid gap-2 text-sm font-semibold">Date of birth<input required value={form.dateOfBirth} onChange={event => setForm(current => ({ ...current, dateOfBirth: event.target.value }))} className={inputClass} type="date" autoComplete="bday" /></label></div>{profileError && <p className="mt-5 text-sm text-red-600">{profileError}</p>}<div className="mt-8 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center"><p className="max-w-xl text-xs leading-5 text-gray-500">Your account email is used for this transaction. Phone and email verification, identity review, insurance, payments, and electronic agreements are separate stages.</p><button disabled={saveProfile.isPending} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-black px-6 text-sm font-semibold text-white disabled:opacity-60">{saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={16} />} Save & continue</button></div></form> : isContactStep ? <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Contact verification</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Phone and email review.</h3><p className="mt-4 max-w-xl text-sm leading-7 text-gray-600">A contact-verification provider is not yet configured. DreamCarz keeps this step pending and will not mark your phone or email as verified until a verified provider result or authorized manual review is recorded.</p><div className="mt-7 border-l-2 border-[#a8832d] bg-[#f4f1e9] px-5 py-4 text-sm leading-6 text-gray-700">You may securely continue to the identity-document stage. Contact verification remains pending in the transaction record.</div>{documentError && <p className="mt-5 text-sm text-red-600">{documentError}</p>}<button type="button" disabled={saveStep.isPending} onClick={advanceToIdentity} className="mt-8 inline-flex h-12 items-center gap-2 bg-black px-6 text-sm font-semibold text-white disabled:opacity-60">{saveStep.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={16} />} Continue to identity documents</button></div> : isIdentityStep ? <div><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><BadgeCheck size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Identity & driver’s license</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Secure identity records.</h3><p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">License images and a live selfie are stored as private account records for verification. They remain pending until a configured provider or authorized DreamCarz reviewer completes verification.</p></div></div><label className="mt-7 flex items-start gap-3 border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700"><input checked={identityConsents.documents} onChange={event => setIdentityConsents(current => ({ ...current, documents: event.target.checked }))} type="checkbox" className="mt-1 h-4 w-4 accent-black" /><span>I consent to DreamCarz collecting and securely retaining my driver’s-license images for identity and driving-eligibility review. I understand I can request review or withdrawal, which may require manual review or prevent completion.</span></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="flex min-h-32 cursor-pointer flex-col justify-between border border-gray-200 bg-white p-5"><div><Upload className="h-5 w-5 text-[#a8832d]" /><p className="mt-4 text-sm font-bold">Driver’s license — front</p><p className="mt-1 text-xs leading-5 text-gray-500">JPG, PNG, or WEBP · 6 MB maximum</p></div><span className="mt-4 text-sm font-semibold underline underline-offset-4">Choose file<input className="sr-only" onChange={event => void captureIdentityRecord("license_front", event.target.files?.[0])} accept="image/jpeg,image/png,image/webp" type="file" /></span></label><label className="flex min-h-32 cursor-pointer flex-col justify-between border border-gray-200 bg-white p-5"><div><Upload className="h-5 w-5 text-[#a8832d]" /><p className="mt-4 text-sm font-bold">Driver’s license — back</p><p className="mt-1 text-xs leading-5 text-gray-500">Optional supporting record</p></div><span className="mt-4 text-sm font-semibold underline underline-offset-4">Choose file<input className="sr-only" onChange={event => void captureIdentityRecord("license_back", event.target.files?.[0])} accept="image/jpeg,image/png,image/webp" type="file" /></span></label></div><label className="mt-6 flex items-start gap-3 border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700"><input checked={identityConsents.selfie} onChange={event => setIdentityConsents(current => ({ ...current, selfie: event.target.checked }))} type="checkbox" className="mt-1 h-4 w-4 accent-black" /><span>I separately consent to a live selfie being used for identity matching and liveness review. DreamCarz does not store a facial template; any automated verification must use a configured provider and may be replaced by manual review where appropriate.</span></label><label className="mt-4 flex min-h-28 cursor-pointer flex-col justify-between border border-gray-200 bg-white p-5"><div><Upload className="h-5 w-5 text-[#a8832d]" /><p className="mt-4 text-sm font-bold">Live selfie</p><p className="mt-1 text-xs leading-5 text-gray-500">Take a clear, well-lit image. It remains pending until review is completed.</p></div><span className="mt-4 text-sm font-semibold underline underline-offset-4">Choose file<input className="sr-only" onChange={event => void captureIdentityRecord("live_selfie", event.target.files?.[0])} accept="image/jpeg,image/png,image/webp" type="file" /></span></label>{uploadIdentityDocument.isPending && <p className="mt-5 inline-flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Saving your secure record…</p>}{documentError && <p className="mt-5 text-sm text-red-600">{documentError}</p>}<p className="mt-6 text-xs leading-5 text-gray-500">Files are stored as private records and appear in <Link href="/dashboard/transactions" className="font-semibold underline underline-offset-4">My Records</Link>. Uploading a document does not by itself mean it is verified or approved.</p></div> : <div><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><ClipboardCheck size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Saved progress</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">{steps[activeIndex]?.[1]}</h3><p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">Your profile is saved. This stage will be completed through verified provider workflows or a DreamCarz manual-review path; it will not collect payment data or biometric records directly in this app.</p></div></div><div className="mt-8 grid gap-4 border-y border-gray-200 py-6 sm:grid-cols-3"><div><BadgeCheck className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold">Identity</p><p className="mt-1 text-xs capitalize text-gray-500">{formatStatus(transaction.identityStatus)}</p></div><div><ShieldCheck className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold">Eligibility</p><p className="mt-1 text-xs capitalize text-gray-500">{formatStatus(transaction.eligibilityStatus)}</p></div><div><FilePenLine className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold">Agreement</p><p className="mt-1 text-xs capitalize text-gray-500">{formatStatus(transaction.agreementStatus)}</p></div></div><div className="mt-7 border-l-2 border-[#a8832d] bg-[#f4f1e9] px-5 py-4"><p className="text-sm font-semibold">Provider connection pending</p><p className="mt-2 text-sm leading-6 text-gray-600">DreamCarz will not represent this stage as verified until the relevant identity, payment, or e-signature provider has been configured and the required consent is collected.</p></div><Link href="/dashboard" className="mt-8 inline-flex h-11 items-center gap-2 border border-black px-5 text-sm font-semibold">Return to My Account <ArrowRight size={16} /></Link></div>}</div></section><p className="mt-8 text-center text-xs leading-5 text-gray-500">Agreement content and any supplied rental addendum must receive legal review before use in a production e-signature flow. No vehicle rate, deposit, purchase price, finance term, or availability has been inferred here.</p></div></DashboardShell>;
}
