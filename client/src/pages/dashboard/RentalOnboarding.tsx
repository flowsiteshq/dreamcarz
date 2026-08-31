import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Fingerprint,
  Home,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  RENTAL_CONSENT_COPY,
  RENTAL_ONBOARDING_REQUIREMENTS,
  RENTAL_ONBOARDING_STEPS,
  type RentalDocumentType,
} from "@shared/rentalOnboarding";
import { findLegacyRentalContinuation } from "@shared/legacyRentalHandoff";

type FormState = {
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  licenseState: string;
  licenseClass: string;
  licenseExpiresOn: string;
  drivingExperience: string;
  recentClaims: string;
  preferredVehicleClasses: string[];
  rentalPurpose: string;
  pickupLocation: string;
  requestedStartDate: string;
  requestedEndDate: string;
};

const blankForm: FormState = {
  phone: "",
  addressLine1: "",
  city: "",
  state: "MD",
  postalCode: "",
  dateOfBirth: "",
  licenseState: "MD",
  licenseClass: "Class C",
  licenseExpiresOn: "",
  drivingExperience: "",
  recentClaims: "None",
  preferredVehicleClasses: [],
  rentalPurpose: "",
  pickupLocation: "DreamCarz HQ · Lanham, MD",
  requestedStartDate: "",
  requestedEndDate: "",
};

const vehiclePreferences = ["Value", "Luxury", "Performance", "Supercar", "Electric", "SUV"];

const documentLabels: Record<RentalDocumentType, { label: string; helper: string; icon: typeof FileText }> = {
  license_front: {
    label: "Driver's license — front",
    helper: "Make sure your name, photo, and expiration are clear.",
    icon: FileText,
  },
  license_back: {
    label: "Driver's license — back",
    helper: "Optional, but helps our team complete review faster.",
    icon: BadgeCheck,
  },
  live_selfie: {
    label: "Live selfie",
    helper: "Take a clear, well-lit photo of your face.",
    icon: ScanFace,
  },
};

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return 0;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function fieldError(condition: boolean, message: string) {
  return condition ? null : message;
}

export default function RentalOnboarding() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const applicationQuery = trpc.rentalOnboarding.getApplication.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const saveDraft = trpc.rentalOnboarding.saveDraft.useMutation();
  const uploadDocument = trpc.rentalOnboarding.uploadDocument.useMutation();
  const submitApplication = trpc.rentalOnboarding.submitApplication.useMutation();
  const transactionsQuery = trpc.transactions.list.useQuery(undefined, { enabled: Boolean(user), refetchOnWindowFocus: false });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(blankForm);
  const [consents, setConsents] = useState({ identity: false, rentalTerms: false });
  const [uploadedDocuments, setUploadedDocuments] = useState<Set<RentalDocumentType>>(new Set());
  const [documentPreviews, setDocumentPreviews] = useState<Partial<Record<RentalDocumentType, string>>>({});
  const [pageError, setPageError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const frontLicenseRef = useRef<HTMLInputElement>(null);
  const backLicenseRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const application = applicationQuery.data?.application;
  const documents = applicationQuery.data?.documents ?? [];
  const isAwaitingReview = application?.status === "submitted" || application?.status === "under_review";
  const isApproved = application?.status === "approved";
  const reviewReference = application ? `DC-R${String(application.id).padStart(6, "0")}` : "";
  const transactionContinuation = useMemo(() => findLegacyRentalContinuation(transactionsQuery.data ?? []), [transactionsQuery.data]);

  useEffect(() => {
    if (!application) return;
    setStep(Math.min(5, Math.max(1, application.currentStep || 1)));
    setForm({
      phone: application.phone || "",
      addressLine1: application.addressLine1 || "",
      city: application.city || "",
      state: application.state || "MD",
      postalCode: application.postalCode || "",
      dateOfBirth: application.dateOfBirth || "",
      licenseState: application.licenseState || "MD",
      licenseClass: application.licenseClass || "Class C",
      licenseExpiresOn: application.licenseExpiresOn || "",
      drivingExperience: application.drivingExperience || "",
      recentClaims: application.recentClaims || "None",
      preferredVehicleClasses: application.preferredVehicleClasses
        ? JSON.parse(application.preferredVehicleClasses)
        : [],
      rentalPurpose: application.rentalPurpose || "",
      pickupLocation: application.pickupLocation || "DreamCarz HQ · Lanham, MD",
      requestedStartDate: application.requestedStartDate || "",
      requestedEndDate: application.requestedEndDate || "",
    });
    setUploadedDocuments(new Set(documents.map(document => document.documentType)));
  }, [application, documents]);

  const progress = useMemo(() => Math.round((step / RENTAL_ONBOARDING_STEPS.length) * 100), [step]);
  const age = calculateAge(form.dateOfBirth);

  const updateForm = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
    setPageError("");
  };

  const persistDraft = async (currentStep: number) => {
    await saveDraft.mutateAsync({ currentStep, ...form });
    await utils.rentalOnboarding.getApplication.invalidate();
  };

  const stepValidation = () => {
    if (step === 1) {
      return (
        fieldError(Boolean(form.phone.trim()), "Add a mobile number so we can contact you about your application.") ||
        fieldError(Boolean(form.addressLine1.trim() && form.city.trim() && form.state.trim() && form.postalCode.trim()), "Complete your current home address.") ||
        fieldError(Boolean(form.dateOfBirth), "Add your date of birth.") ||
        fieldError(age >= RENTAL_ONBOARDING_REQUIREMENTS.minimumAge, "DreamCarz rental applicants must be at least 21 years old.")
      );
    }
    if (step === 2) {
      return (
        fieldError(Boolean(form.licenseState && form.licenseExpiresOn), "Add your license jurisdiction and expiration date.") ||
        fieldError(new Date(`${form.licenseExpiresOn}T00:00:00`) > new Date(), "Your driver's license must be current to apply.") ||
        fieldError(Boolean(form.drivingExperience), "Tell us about your driving experience.")
      );
    }
    if (step === 3) {
      return fieldError(
        uploadedDocuments.has("license_front") && uploadedDocuments.has("live_selfie"),
        "Upload your driver's license front and a live selfie to continue.",
      );
    }
    if (step === 4) {
      return (
        fieldError(form.preferredVehicleClasses.length > 0, "Choose at least one vehicle class.") ||
        fieldError(Boolean(form.rentalPurpose), "Choose how you plan to use your rental.") ||
        fieldError(Boolean(form.requestedStartDate), "Choose a preferred rental start date.")
      );
    }
    return null;
  };

  const goForward = async () => {
    const error = stepValidation();
    if (error) {
      setPageError(error);
      return;
    }
    try {
      setPageError("");
      const nextStep = Math.min(step + 1, 5);
      await persistDraft(nextStep);
      setStep(nextStep);
    } catch {
      setPageError("We could not save your progress. Please check your connection and try again.");
    }
  };

  const goBack = () => {
    setPageError("");
    setStep(current => Math.max(1, current - 1));
  };

  const toggleVehiclePreference = (preference: string) => {
    updateForm(
      "preferredVehicleClasses",
      form.preferredVehicleClasses.includes(preference)
        ? form.preferredVehicleClasses.filter(item => item !== preference)
        : [...form.preferredVehicleClasses, preference],
    );
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        resolve(value.includes(",") ? value.split(",")[1] : value);
      };
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const handleDocumentUpload = async (documentType: RentalDocumentType, file?: File) => {
    if (!file) return;
    setDocumentError("");
    if (!RENTAL_ONBOARDING_REQUIREMENTS.acceptedImageTypes.includes(file.type as "image/jpeg")) {
      setDocumentError("Use a JPG, PNG, or WEBP image for identity documents.");
      return;
    }
    if (file.size > RENTAL_ONBOARDING_REQUIREMENTS.maxDocumentBytes) {
      setDocumentError("Each document must be 6 MB or smaller.");
      return;
    }
    try {
      setDocumentPreviews(current => ({ ...current, [documentType]: URL.createObjectURL(file) }));
      const base64 = await readFileAsBase64(file);
      await uploadDocument.mutateAsync({
        documentType,
        filename: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        base64,
      });
      setUploadedDocuments(current => new Set([...Array.from(current), documentType]));
      await utils.rentalOnboarding.getApplication.invalidate();
    } catch {
      setDocumentError("We could not securely upload that document. Please try again with a clear image.");
    }
  };

  const submitForReview = async () => {
    const error = stepValidation();
    if (error) {
      setPageError(error);
      return;
    }
    if (!consents.identity || !consents.rentalTerms) {
      setPageError("Review and accept both authorizations before submitting your application.");
      return;
    }
    try {
      setPageError("");
      await persistDraft(5);
      await submitApplication.mutateAsync({ identityConsent: true, rentalTermsConsent: true });
      await utils.rentalOnboarding.getApplication.invalidate();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "We could not submit your application. Please try again.");
    }
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-[14px] text-black outline-none transition-colors placeholder:text-gray-300 focus:border-black";
  const labelClass = "mb-2 block text-[12px] font-semibold text-black";

  if (applicationQuery.isLoading) {
    return (
      <DashboardShell title="Rental Setup">
        <div className="min-h-[55vh] flex items-center justify-center">
          <Loader2 size={26} className="animate-spin text-gray-400" />
        </div>
      </DashboardShell>
    );
  }

  if (isAwaitingReview || isApproved) {
    return (
      <DashboardShell title="Rental Setup">
        <div className="max-w-3xl mx-auto py-5 lg:py-10">
          <div className="relative overflow-hidden bg-black rounded-[28px] p-7 sm:p-10 text-white">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d7b257]/20 blur-3xl" />
            <div className="relative max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                {isApproved ? <BadgeCheck size={25} className="text-[#e4c46f]" /> : <Clock3 size={24} className="text-[#e4c46f]" />}
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#e4c46f] font-bold mb-3">
                {isApproved ? "Rental access unlocked" : "Application received"}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {isApproved ? "You’re ready to reserve your next vehicle." : "Your rental application is in review."}
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/60">
                {isApproved
                  ? "Your identity and rental profile are verified. Browse the fleet whenever you’re ready."
                  : "DreamCarz is reviewing your rental profile and identity documents. Check My Account for status updates or continue an existing vehicle-specific transaction."}
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/45">Application reference</p>
                  <p className="mt-1 text-sm font-semibold">{reviewReference}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/45">Identity status</p>
                  <p className="mt-1 text-sm font-semibold">{isApproved ? "Verified" : "Pending review"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-7">
                <Link href={transactionContinuation ? `/dashboard/transactions?ref=${encodeURIComponent(transactionContinuation.reference)}` : "/dashboard/vehicles"} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-100 transition-colors">
                  {transactionContinuation ? "Continue vehicle setup" : isApproved ? "Browse vehicles" : "Choose a confirmed vehicle"}
                </Link>
                <Link href="/dashboard" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">Return to My Account</Link>
              </div>
            </div>
          </div>

          <section className="mt-5 border border-[#ded8cf] bg-[#fbfaf7] p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Vehicle transaction</p>
            <h3 className="mt-2 text-lg font-bold text-black">Continue your vehicle-specific setup.</h3>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-600">Your rental application review and vehicle transaction stay separate. DreamCarz does not copy identity documents or biometric consent between them. Continue an existing rental transaction, or select a confirmed vehicle to start one.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {transactionContinuation ? <Link href={`/dashboard/transactions?ref=${encodeURIComponent(transactionContinuation.reference)}`} className="inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white">Continue {transactionContinuation.vehicleName} <ArrowRight size={14} className="ml-2" /></Link> : <Link href="/dashboard/vehicles" className="inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white">Choose a confirmed vehicle <ArrowRight size={14} className="ml-2" /></Link>}
              {transactionContinuation ? <Link href="/dashboard/vehicles" className="inline-flex h-10 items-center border border-black px-4 text-xs font-semibold text-black">Choose a different vehicle</Link> : null}
            </div>
          </section>

          <div className="mt-5 grid sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "Secure review", text: "Your documents are stored privately and reviewed only for rental eligibility." },
              { icon: Bell, title: "Clear updates", text: "We’ll let you know if anything else is needed to complete your application." },
              { icon: CarFront, title: "Ready when approved", text: "Approved members can book the DreamCarz fleet directly from My Account." },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <Icon size={18} className="text-black mb-4" />
                  <p className="text-sm font-semibold text-black">{item.title}</p>
                  <p className="text-[12px] leading-5 text-gray-400 mt-1">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Rental Setup">
      <div className="max-w-6xl mx-auto pb-12">
        <section className="pt-1 sm:pt-4 mb-6 lg:mb-8">
          <div className="flex items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#b88918] mb-3">Rental onboarding</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-black" style={{ fontFamily: "var(--font-display)" }}>
                Your fastest path to the keys.
              </h2>
              <p className="text-sm leading-6 text-gray-500 mt-3 max-w-xl">
                Complete your rental profile once. DreamCarz will use it to verify your eligibility, personalize your experience, and make every future reservation faster.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0 bg-white rounded-full border border-gray-100 px-4 py-2.5 shadow-sm">
              <LockKeyhole size={14} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-600">Private & secure</span>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 lg:gap-8 items-start">
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-[28px] border border-gray-100 overflow-hidden shadow-[0_16px_45px_rgba(0,0,0,0.035)]">
              <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Step {step} of 5</p>
                    <h3 className="mt-1 text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                      {RENTAL_ONBOARDING_STEPS[step - 1].title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-black text-white text-[11px] font-bold px-3 py-1.5">{progress}%</span>
                </div>
                <div className="mt-5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-gray-100 shrink-0"><UserRound size={17} /></div>
                      <div>
                        <p className="text-sm font-semibold text-black">Let’s make this personal.</p>
                        <p className="mt-1 text-[12px] text-gray-500 leading-5">We’ll use these details only to verify your identity and manage your rental application.</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Full legal name</label>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                          <UserRound size={17} className="text-gray-400" />
                          <span className="text-[14px] text-black font-medium">{user?.name || "DreamCarz Member"}</span>
                          <span className="ml-auto text-[11px] text-gray-400">From your account</span>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Mobile number</label>
                        <div className="relative"><Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input className={`${inputClass} pl-10`} value={form.phone} onChange={event => updateForm("phone", event.target.value)} placeholder="(301) 555-0123" inputMode="tel" /></div>
                      </div>
                      <div>
                        <label className={labelClass}>Date of birth</label>
                        <input className={inputClass} value={form.dateOfBirth} onChange={event => updateForm("dateOfBirth", event.target.value)} type="date" max={new Date().toISOString().slice(0, 10)} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Home address</label>
                        <div className="relative"><Home size={16} className="absolute left-4 top-4 text-gray-400" /><input className={`${inputClass} pl-10`} value={form.addressLine1} onChange={event => updateForm("addressLine1", event.target.value)} placeholder="Street address" autoComplete="street-address" /></div>
                      </div>
                      <div>
                        <label className={labelClass}>City</label>
                        <input className={inputClass} value={form.city} onChange={event => updateForm("city", event.target.value)} placeholder="Lanham" autoComplete="address-level2" />
                      </div>
                      <div className="grid grid-cols-[1fr_0.75fr] gap-3">
                        <div><label className={labelClass}>State</label><input className={inputClass} value={form.state} onChange={event => updateForm("state", event.target.value.toUpperCase())} placeholder="MD" autoComplete="address-level1" /></div>
                        <div><label className={labelClass}>ZIP</label><input className={inputClass} value={form.postalCode} onChange={event => updateForm("postalCode", event.target.value)} placeholder="20706" inputMode="numeric" autoComplete="postal-code" /></div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-[#fffbef] border border-[#f6e8b8] p-4">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-[#f6e8b8] shrink-0"><BadgeCheck size={17} className="text-[#a7770c]" /></div>
                      <div><p className="text-sm font-semibold text-black">A current license keeps every rental safe.</p><p className="mt-1 text-[12px] text-gray-500 leading-5">We’ll securely verify your license details with the document you upload in the next step.</p></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className={labelClass}>License jurisdiction</label><input className={inputClass} value={form.licenseState} onChange={event => updateForm("licenseState", event.target.value)} placeholder="MD" /></div>
                      <div><label className={labelClass}>License class</label><select className={inputClass} value={form.licenseClass} onChange={event => updateForm("licenseClass", event.target.value)}><option>Class C</option><option>Class A</option><option>Class B</option><option>Other</option></select></div>
                      <div><label className={labelClass}>License expiration</label><input className={inputClass} value={form.licenseExpiresOn} onChange={event => updateForm("licenseExpiresOn", event.target.value)} type="date" /></div>
                      <div><label className={labelClass}>Driving experience</label><select className={inputClass} value={form.drivingExperience} onChange={event => updateForm("drivingExperience", event.target.value)}><option value="">Select experience</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>10+ years</option></select></div>
                      <div className="sm:col-span-2"><label className={labelClass}>Insurance claims or moving violations in the last 3 years</label><select className={inputClass} value={form.recentClaims} onChange={event => updateForm("recentClaims", event.target.value)}><option>None</option><option>One minor incident</option><option>Two or more incidents</option><option>Prefer to discuss with DreamCarz</option></select><p className="mt-2 text-[11px] leading-5 text-gray-400">A prior incident does not automatically disqualify you. DreamCarz reviews each application individually.</p></div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-gray-100 shrink-0"><Fingerprint size={17} /></div>
                      <div><p className="text-sm font-semibold text-black">Secure identity verification.</p><p className="mt-1 text-[12px] text-gray-500 leading-5">We compare your identity documents during a protected review. Until automated facial matching is configured, submissions are queued for manual verification.</p></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {(["license_front", "license_back", "live_selfie"] as RentalDocumentType[]).map(documentType => {
                        const details = documentLabels[documentType];
                        const Icon = details.icon;
                        const isUploaded = uploadedDocuments.has(documentType);
                        const isUploading = uploadDocument.isPending && uploadDocument.variables?.documentType === documentType;
                        const ref = documentType === "license_front" ? frontLicenseRef : documentType === "license_back" ? backLicenseRef : selfieRef;
                        return (
                          <div key={documentType} className={`relative rounded-2xl border p-4 transition-colors ${isUploaded ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}>
                            <input ref={ref} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture={documentType === "live_selfie" ? "user" : "environment"} onChange={event => handleDocumentUpload(documentType, event.target.files?.[0])} />
                            {documentPreviews[documentType] ? <img src={documentPreviews[documentType]} alt="Document preview" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover" /> : <div className={`mb-3 aspect-[4/3] rounded-xl flex items-center justify-center ${isUploaded ? "bg-green-100" : "bg-gray-50"}`}><Icon size={24} className={isUploaded ? "text-green-600" : "text-gray-300"} /></div>}
                            <p className="text-[13px] font-semibold text-black">{details.label}</p>
                            <p className="mt-1 min-h-10 text-[11px] leading-4 text-gray-400">{details.helper}</p>
                            <button type="button" onClick={() => ref.current?.click()} disabled={isUploading} className={`mt-3 w-full rounded-xl py-2.5 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${isUploaded ? "bg-white border border-green-200 text-green-700 hover:bg-green-50" : "bg-black text-white hover:bg-gray-800"}`}>
                              {isUploading ? <Loader2 size={13} className="animate-spin" /> : isUploaded ? <Check size={14} /> : <Upload size={13} />}
                              {isUploading ? "Uploading" : isUploaded ? "Replace image" : documentType === "live_selfie" ? "Open camera" : "Upload image"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 flex gap-3">
                      <LockKeyhole size={17} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-5 text-gray-400">Accepted formats: JPG, PNG, or WEBP, up to 6 MB each. Identity images are stored privately for rental eligibility review and are not displayed in your member profile.</p>
                    </div>
                    {documentError && <p className="rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{documentError}</p>}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold text-black">What would you love to drive?</p>
                      <p className="mt-1 text-[12px] leading-5 text-gray-400">Choose any classes that fit your lifestyle. This helps DreamCarz surface the right vehicles first.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {vehiclePreferences.map(preference => {
                          const selected = form.preferredVehicleClasses.includes(preference);
                          return <button type="button" key={preference} onClick={() => toggleVehiclePreference(preference)} className={`rounded-full px-4 py-2.5 text-[12px] font-semibold transition-colors ${selected ? "bg-black text-white" : "border border-gray-200 text-gray-500 hover:border-black hover:text-black"}`}>{selected && <Check size={12} className="inline mr-1.5 -mt-0.5" />}{preference}</button>;
                        })}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><label className={labelClass}>Primary rental purpose</label><select className={inputClass} value={form.rentalPurpose} onChange={event => updateForm("rentalPurpose", event.target.value)}><option value="">Select one</option><option>Weekend / lifestyle</option><option>Business travel</option><option>Special occasion</option><option>Daily transportation</option><option>Extended rental</option></select></div>
                      <div><label className={labelClass}>Preferred pickup location</label><div className="relative"><MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><select className={`${inputClass} pl-10`} value={form.pickupLocation} onChange={event => updateForm("pickupLocation", event.target.value)}><option>DreamCarz HQ · Lanham, MD</option><option>Delivery request · DMV area</option><option>Discuss with concierge</option></select></div></div>
                      <div><label className={labelClass}>Ideal start date</label><div className="relative"><CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input className={`${inputClass} pl-10`} value={form.requestedStartDate} onChange={event => updateForm("requestedStartDate", event.target.value)} type="date" min={new Date().toISOString().slice(0, 10)} /></div></div>
                      <div><label className={labelClass}>Ideal return date <span className="font-normal text-gray-400">(optional)</span></label><input className={inputClass} value={form.requestedEndDate} onChange={event => updateForm("requestedEndDate", event.target.value)} type="date" min={form.requestedStartDate || new Date().toISOString().slice(0, 10)} /></div>
                    </div>
                    <div className="rounded-2xl bg-black p-5 text-white flex gap-4">
                      <Sparkles size={20} className="text-[#e4c46f] shrink-0 mt-0.5" />
                      <div><p className="text-sm font-semibold">Built around your preferences.</p><p className="mt-1 text-[12px] leading-5 text-white/55">Once approved, your My Account experience will prioritize matching vehicles, availability, and Dream Journey goals.</p></div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
                      <div className="flex items-center justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Rental applicant</p><p className="mt-1 text-lg font-bold text-black">{user?.name || "DreamCarz Member"}</p></div><button onClick={() => setStep(1)} className="text-[12px] font-semibold text-black underline underline-offset-4">Edit</button></div>
                      <div className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-4 text-[12px]">
                        <div><p className="text-gray-400">Contact</p><p className="mt-1 font-medium text-black">{form.phone}</p></div>
                        <div><p className="text-gray-400">License</p><p className="mt-1 font-medium text-black">{form.licenseState} · Expires {form.licenseExpiresOn}</p></div>
                        <div><p className="text-gray-400">Rental request</p><p className="mt-1 font-medium text-black">{form.rentalPurpose}</p></div>
                        <div><p className="text-gray-400">Vehicle interests</p><p className="mt-1 font-medium text-black">{form.preferredVehicleClasses.join(", ")}</p></div>
                        <div><p className="text-gray-400">Pickup</p><p className="mt-1 font-medium text-black">{form.pickupLocation}</p></div>
                        <div><p className="text-gray-400">Preferred dates</p><p className="mt-1 font-medium text-black">{form.requestedStartDate}{form.requestedEndDate ? ` → ${form.requestedEndDate}` : ""}</p></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                      <div className="p-4 flex items-start gap-3"><CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" /><div><p className="text-[13px] font-semibold text-black">Identity documents ready</p><p className="mt-1 text-[11px] text-gray-400">License front and live selfie are securely attached for review.</p></div></div>
                      <label className="p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" checked={consents.identity} onChange={event => setConsents(current => ({ ...current, identity: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-black" /><span className="text-[12px] leading-5 text-gray-600">{RENTAL_CONSENT_COPY.identity}</span></label>
                      <label className="p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors"><input type="checkbox" checked={consents.rentalTerms} onChange={event => setConsents(current => ({ ...current, rentalTerms: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-black" /><span className="text-[12px] leading-5 text-gray-600">{RENTAL_CONSENT_COPY.rentalTerms} <Link href="/terms" className="font-semibold text-black underline underline-offset-2">Read terms</Link>.</span></label>
                    </div>
                    <div className="rounded-2xl bg-[#fffbef] border border-[#f6e8b8] p-4 flex gap-3"><Clock3 size={18} className="text-[#a7770c] shrink-0 mt-0.5" /><p className="text-[12px] leading-5 text-[#7a5b12]">After submission, DreamCarz reviews your information and identity documents. You’ll see your application status in My Account and receive a notification if we need anything else.</p></div>
                  </div>
                )}

                {pageError && <div className="mt-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 flex gap-2 text-[12px] text-red-600"><CircleAlert size={16} className="shrink-0" />{pageError}</div>}

                <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <button type="button" onClick={goBack} disabled={step === 1 || saveDraft.isPending || submitApplication.isPending} className={`rounded-full px-4 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${step === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-black"}`}><ArrowLeft size={15} /> Back</button>
                  {step < 5 ? <button type="button" onClick={goForward} disabled={saveDraft.isPending || uploadDocument.isPending} className="rounded-full bg-black text-white px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-300"><span>{saveDraft.isPending ? "Saving" : "Continue"}</span>{saveDraft.isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}</button> : <button type="button" onClick={submitForReview} disabled={saveDraft.isPending || submitApplication.isPending || !consents.identity || !consents.rentalTerms} className="rounded-full bg-black text-white px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-300"><span>{submitApplication.isPending ? "Submitting" : "Submit for review"}</span>{submitApplication.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}</button>}
                </div>
              </div>
            </div>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-[94px]">
            <div className="bg-black text-white rounded-[26px] overflow-hidden">
              <div className="p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#e4c46f] font-bold">Your rental profile</p>
                <h3 className="mt-3 text-xl font-bold leading-6" style={{ fontFamily: "var(--font-display)" }}>One setup. Every rental made easier.</h3>
                <p className="mt-3 text-[12px] leading-5 text-white/55">Save your verified profile once, then move from vehicle selection to confirmed reservation with less friction.</p>
              </div>
              <div className="border-t border-white/10 px-4 py-3">
                {RENTAL_ONBOARDING_STEPS.map(item => {
                  const complete = item.number < step;
                  const active = item.number === step;
                  return <div key={item.id} className="flex items-center gap-3 py-2"><span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${complete ? "bg-[#e4c46f] text-black" : active ? "bg-white text-black" : "bg-white/10 text-white/45"}`}>{complete ? <Check size={12} /> : item.number}</span><span className={`text-[12px] ${active ? "font-semibold text-white" : complete ? "text-white/60" : "text-white/35"}`}>{item.title}</span></div>;
                })}
              </div>
              <div className="m-4 rounded-2xl bg-white/10 p-4"><div className="flex items-center gap-2 text-[#e4c46f]"><ShieldCheck size={15} /><span className="text-[11px] font-bold uppercase tracking-wider">Privacy first</span></div><p className="mt-2 text-[11px] leading-5 text-white/55">Your identity images are held privately for eligibility review and are never visible to other members.</p></div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
