/* Shared shell layout for all dashboard sidebar pages */
import AIConcierge from "@/components/AIConcierge";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Car, CalendarDays, Star, CreditCard, Gift,
  MapPin, Headphones, Settings, ChevronRight, ArrowUp, Sparkles, AlertTriangle, FileText,
  Bell, LogOut, Menu, TrendingUp, Trophy, Network, ClipboardCheck, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { loadStripe } from "@stripe/stripe-js";

const sidebarLinks = [
  { href: "/dashboard", label: "My Account", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "My Vehicles", icon: Car },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/dashboard/rental-setup", label: "Rental Setup", icon: ClipboardCheck },
  { href: "/dashboard/membership", label: "Membership", icon: Star },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/transactions", label: "My Records", icon: FileText },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/report", label: "Report an Issue", icon: AlertTriangle },
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
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");
  const provider = trpc.transactions.paymentProviderStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const transaction = trpc.transactions.get.useQuery({ reference }, { refetchOnWindowFocus: false });
  const start = trpc.transactions.startPaymentMethodSetup.useMutation();

  if (!provider.data?.configured || transaction.data?.transaction.currentStep !== "payment") return null;

  const launch = async () => {
    if (!authorized) { setMessage("Please authorize the stated future payment-method use before continuing to the payment provider."); return; }
    try {
      setMessage("");
      const response = await start.mutateAsync({ reference, futurePaymentConsent: true });
      if (!response.started) { setMessage("Secure payment setup is not configured. Your transaction remains available for DreamCarz manual review."); return; }
      window.location.assign(response.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Secure payment setup could not be started. Please contact DreamCarz support.");
    }
  };

  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Configured payment provider</p><h2 className="mt-2 font-display text-xl font-bold">Add a payment method securely</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">DreamCarz does not receive or store your card number, security code, or expiry date. The payment provider collects the method securely. No transaction amount is shown or charged here; final rates, deposits, and authorization terms must be confirmed before any charge.</p><label className="mt-4 flex gap-2 text-xs leading-5 text-gray-700"><input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} className="mt-0.5 accent-black" />I authorize DreamCarz to save this payment method only for the payment use and terms I approve in the final transaction agreement. I understand this step does not itself charge a vehicle price or deposit.</label><button type="button" disabled={start.isPending} onClick={() => void launch()} className="mt-5 inline-flex h-10 items-center bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{start.isPending ? "Opening secure payment…" : "Continue to secure payment"}</button>{message && <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p>}</section>;
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

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardShell({ children, title }: DashboardShellProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
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

  const withdrawIdentityConsent = async (consentType: "identity_document" | "identity_biometric") => {
    if (!transactionReference || !window.confirm("Withdraw this consent? Identity verification will pause and the transaction will require DreamCarz manual review.")) return;
    await withdrawal.mutateAsync({ reference: transactionReference, consentType });
  };

  const firstName = user?.name?.split(" ")[0] || "Member";
  const tier = "Pro";
  const tierGradient = tierColors[tier] || tierColors.Pro;

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
              <p className="text-[10px] text-gray-400">{tier} Member</p>
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
                  {tier} Member
                </span>
                <span className="text-[11px] text-gray-400">· Member since 2026</span>
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
          {location.startsWith("/dashboard/transactions") && transactionReference && <section className="mx-auto mt-8 max-w-6xl border-t border-gray-200 pt-5"><p className="text-xs leading-5 text-gray-500">Need to change your mind about identity processing? Withdrawing consent pauses this transaction and routes it to manual review; retained records remain subject to applicable legal and retention obligations.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={withdrawal.isPending} onClick={() => void withdrawIdentityConsent("identity_document")} className="text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Withdraw license-document consent</button><button type="button" disabled={withdrawal.isPending} onClick={() => void withdrawIdentityConsent("identity_biometric")} className="text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Withdraw selfie consent</button></div>{withdrawal.error && <p className="mt-3 text-xs text-red-600">{withdrawal.error.message}</p>}</section>}
          {location.startsWith("/dashboard/transactions") && transactionReference && <IdentityVerificationLauncher reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <PaymentMethodSetupLauncher reference={transactionReference} />}
          {location.startsWith("/dashboard/transactions") && transactionReference && <RentalConditionReportPanel reference={transactionReference} />}
        </main>
        <AIConcierge />
      </div>
    </div>
  );
}
