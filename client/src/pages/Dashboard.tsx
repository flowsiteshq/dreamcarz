import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ActiveRentalSummary } from "@/components/ActiveRentalSummary";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";

const EDITORIAL_HERO_IMAGE = "/manus-storage/dreamcarz-cinematic-hero-architecture_c73786ec.png";
const FEATURED_VEHICLE_IDS = [
  "2024-chevrolet-malibu-gray",
  "2022-chevrolet-traverse-white",
  "2024-ford-fusion-gray",
  "2020-chevrolet-equinox-black",
] as const;

const dashboardActions = [
  { icon: Car, label: "Rent a vehicle", detail: "Start a guided rental path.", href: "/concierge?intent=rental" },
  { icon: ClipboardCheck, label: "Buy a vehicle", detail: "Explore a purchase path.", href: "/concierge?intent=purchase" },
  { icon: Star, label: "Explore membership", detail: "Review membership options.", href: "/pricing" },
  { icon: Compass, label: "Plan my journey", detail: "Continue your saved path.", href: "/dashboard/dream-journey" },
] as const;

const quickActions = [
  { icon: ShieldCheck, label: "Verify identity", href: "/dashboard/dreamcarz-id" },
  { icon: FileText, label: "Upload documents", href: "/dashboard/rental-setup" },
  { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
  { icon: CalendarDays, label: "Reservations", href: "/dashboard/reservations" },
  { icon: CheckCircle2, label: "Contact support", href: "/dashboard/support" },
] as const;

type ApprovedVehicleId = keyof typeof APPROVED_TRANSACTION_VEHICLES;

function findVehicle(vehicleId: string | null | undefined) {
  if (!vehicleId || !(vehicleId in APPROVED_TRANSACTION_VEHICLES)) return null;
  return APPROVED_TRANSACTION_VEHICLES[vehicleId as ApprovedVehicleId];
}

function humanize(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()) : "Not started";
}

function formatCurrency(cents: number | null | undefined) {
  if (typeof cents !== "number") return "No recorded value";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function Dashboard() {
  const { user } = useAuth();
  const overview = trpc.dreamcarzId.overview.useQuery(undefined, { staleTime: 30_000 });
  const firstName = user?.name?.split(" ")[0] || "Member";
  const openTransaction = overview.data?.transactions.find(transaction => !["settled", "cancelled", "closed", "completed", "canceled", "declined"].includes(transaction.status)) ?? null;
  const transactionVehicle = findVehicle(openTransaction?.vehicleId);
  const savedVehicle = findVehicle(overview.data?.conciergeJourney?.selectedVehicleId);
  const focusVehicle = transactionVehicle ?? savedVehicle;
  const membership = overview.data?.membership ?? null;
  const wallet = overview.data?.wallet ?? null;
  const journeyIntent = overview.data?.conciergeJourney?.intent;
  const memberStatus = overview.data?.accountStanding ? humanize(overview.data.accountStanding) : "Loading";

  return (
    <DashboardShell title="My Dashboard">
      <div className="mx-auto max-w-[1500px] space-y-5 pb-7 lg:space-y-6">
        <section className="relative isolate min-h-[360px] overflow-hidden border border-[#e4dfd5] bg-[#f7f1e9] sm:min-h-[390px]">
          <img src={EDITORIAL_HERO_IMAGE} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,0.98)_0%,rgba(255,252,247,0.95)_37%,rgba(255,252,247,0.49)_67%,rgba(255,252,247,0.08)_100%)]" />
          <div className="relative z-10 flex min-h-[360px] max-w-[640px] flex-col justify-between px-6 py-7 sm:min-h-[390px] sm:px-8 sm:py-9">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-[#252321]">Welcome back, {firstName}.</p>
              <h2 className="mt-2 max-w-lg font-display text-[44px] font-medium leading-[0.88] tracking-[-0.065em] text-[#111] sm:text-6xl lg:text-[68px]">Your next drive<br /><span className="text-[#a8832d]">starts with a clear path.</span></h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#4d4944]">Explore confirmed vehicles, save your preferred journey, and complete each protected step when you are ready.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6a24]">
              <span>Rent</span><span>Buy</span><span>Membership</span>
              {focusVehicle ? <span className="border-l border-[#b9974b]/50 pl-5">Current focus · {focusVehicle.vehicleName}</span> : null}
            </div>
          </div>
          <p className="absolute bottom-3 right-4 z-10 text-[9px] font-medium uppercase tracking-[0.14em] text-[#60564a]/75">Editorial image · not current inventory</p>
        </section>

        <section aria-label="Member actions" className="grid overflow-hidden border border-[#e5e1d9] bg-white sm:grid-cols-2 xl:grid-cols-4">
          {dashboardActions.map(({ icon: Icon, label, detail, href }, index) => (
            <Link key={label} href={href} className={`group flex min-h-[104px] items-center gap-4 p-5 transition-colors hover:bg-[#fbfaf7] ${index < dashboardActions.length - 1 ? "border-b border-[#e5e1d9] sm:border-r sm:last:border-r-0 xl:border-b-0" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ded8cb] bg-[#fffdf9] text-[#a8832d]"><Icon size={19} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#181716]">{label}</span><span className="mt-1 block text-[11px] leading-4 text-gray-500">{detail}</span></span>
              <ArrowRight size={16} className="shrink-0 text-[#a8832d] transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="space-y-5">
            <section aria-label="Current member journey" className="grid overflow-hidden border border-[#e5e1d9] bg-white lg:grid-cols-[0.82fr_1.18fr]">
              <div className="min-h-[268px] bg-[#f7f5f0] p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">My current journey</p>
                {focusVehicle ? <>
                  <img src={focusVehicle.image} alt={focusVehicle.vehicleName} className="mx-auto mt-4 h-28 w-full object-contain" />
                  <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-black">{focusVehicle.vehicleName}</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{openTransaction ? `Journey status: ${humanize(openTransaction.status)}.` : "Saved vehicle preference."}</p>
                  <Link href={openTransaction ? `/dashboard/transactions?ref=${encodeURIComponent(openTransaction.reference)}` : "/concierge"} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-black underline decoration-[#b28d3b] decoration-2 underline-offset-4">{openTransaction ? "Manage my journey" : "Continue with Concierge"}<ArrowRight size={14} /></Link>
                </> : <>
                  <span className="mt-7 grid h-12 w-12 place-items-center rounded-full bg-black text-[#d1ad54]"><Car size={21} /></span>
                  <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.04em] text-black">Choose your next vehicle.</h3>
                  <p className="mt-3 text-xs leading-5 text-gray-500">No vehicle is saved to this account yet. Start with a confirmed DreamCarz vehicle.</p>
                  <Link href="/concierge?intent=rental" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-black underline decoration-[#b28d3b] decoration-2 underline-offset-4">Find a vehicle <ArrowRight size={14} /></Link>
                </>}
              </div>
              <div className="flex min-h-[268px] flex-col justify-between p-5 sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Journey status</p>
                  <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#161514]">{openTransaction ? humanize(openTransaction.currentStep) : journeyIntent ? `${humanize(journeyIntent)} discovery` : "Ready when you are"}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">{openTransaction ? "Use your private journey to review the current step and any available records." : "DreamCarz will keep vehicle, membership, and transaction decisions separate until you choose a path."}</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href="/dashboard/reservations" className="flex items-center justify-between border-t border-[#e7e2da] pt-3 text-xs font-semibold text-[#272522]">Reservations <ArrowRight size={14} /></Link>
                  <Link href="/dashboard/dream-journey" className="flex items-center justify-between border-t border-[#e7e2da] pt-3 text-xs font-semibold text-[#272522]">Dream Journey <ArrowRight size={14} /></Link>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <article className="overflow-hidden border border-[#e5e1d9] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">DreamCarz Value</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">Recorded account value.</h3></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#fbf5e6] text-[#a8832d]"><WalletCards size={19} /></span></div>
                <p className="mt-5 text-3xl font-bold tracking-[-0.05em] text-black">{wallet ? formatCurrency(wallet.availableCreditCents) : "Not available"}</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">Ledger records only. Eligibility, approvals, and permitted use remain subject to current program rules.</p>
                <Link href="/dashboard/rewards" className="mt-5 inline-flex items-center gap-2 text-xs font-bold underline decoration-[#b28d3b] decoration-2 underline-offset-4">Review activity <ArrowRight size={14} /></Link>
              </article>
              <article className="overflow-hidden bg-[#151515] p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7b45c]">My membership</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">{membership?.plan.name ?? "Explore membership"}</h3></div><span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-[#dfbe69]"><Star size={18} /></span></div>
                <p className="mt-5 text-xs leading-5 text-white/65">{membership ? "Your active plan and recorded benefits are available for review." : "Compare membership options separately from vehicle access and final transaction terms."}</p>
                {membership?.benefits?.length ? <p className="mt-4 border-t border-white/15 pt-3 text-[11px] font-semibold text-[#dfbe69]">{membership.benefits.slice(0, 2).map(benefit => benefit.label).join(" · ")}</p> : null}
                <Link href="/dashboard/membership" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-white underline decoration-[#d7b45c] decoration-2 underline-offset-4">{membership ? "Manage membership" : "Review options"}<ArrowRight size={14} /></Link>
              </article>
            </section>

            <ActiveRentalSummary />

            <section aria-label="Confirmed DreamCarz vehicles" className="border-t border-[#ded8cc] pt-6">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Confirmed inventory</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-black">Explore vehicles.</h3></div><Link href="/fleet" className="inline-flex items-center gap-2 text-xs font-bold underline decoration-[#b28d3b] decoration-2 underline-offset-4">View all inventory <ArrowRight size={14} /></Link></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {FEATURED_VEHICLE_IDS.map(vehicleId => {
                  const vehicle = APPROVED_TRANSACTION_VEHICLES[vehicleId];
                  return <Link key={vehicleId} href={`/vehicle?id=${vehicleId}`} className="group overflow-hidden border border-[#e5e1d9] bg-white transition-shadow hover:shadow-[0_12px_25px_rgba(0,0,0,0.07)]"><div className="h-28 bg-[#f6f4ef] p-2"><img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /></div><div className="flex items-center justify-between gap-3 px-3 py-3"><p className="min-w-0 text-xs font-bold text-black">{vehicle.vehicleName}</p><ArrowRight size={14} className="shrink-0 text-[#a8832d]" /></div></Link>;
                })}
              </div>
            </section>

            <section className="grid gap-4 border-t border-[#ded8cc] pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Growing with DreamCarz</p><p className="mt-2 text-xs font-semibold text-[#252321]">Join → Drive → Build → Use</p><p className="mt-2 max-w-2xl text-[11px] leading-5 text-gray-500">Final vehicle, membership, activity, compensation, fleet, and program terms are governed by the applicable documentation and agreements.</p></div>
              <Link href="/opportunity#fleet-partner" className="inline-flex items-center gap-2 text-xs font-bold underline decoration-[#b28d3b] decoration-2 underline-offset-4">Fleet Partner Path <ArrowRight size={14} /></Link>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="border border-[#e5e1d9] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Quick actions</p><div className="mt-3 divide-y divide-[#ece8e0]">{quickActions.map(({ icon: Icon, label, href }) => <Link key={label} href={href} className="flex items-center gap-3 py-3 text-xs font-semibold text-[#2c2a27] transition-colors hover:text-[#a8832d]"><Icon size={16} className="text-[#8e8a83]" /><span className="flex-1">{label}</span><ArrowRight size={14} /></Link>)}</div></section>
            <section className="border border-[#e5e1d9] bg-[#fbfaf7] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Account status</p><p className="mt-3 text-lg font-bold tracking-[-0.03em] text-black">{memberStatus}</p><p className="mt-2 text-xs leading-5 text-gray-500">Review your DreamCarz ID for saved information and current verification status.</p><Link href="/dashboard/dreamcarz-id" className="mt-4 inline-flex items-center gap-2 text-xs font-bold underline decoration-[#b28d3b] decoration-2 underline-offset-4">Open DreamCarz ID <ArrowRight size={14} /></Link></section>
            <section className="overflow-hidden bg-black p-5 text-white"><MapPin size={19} className="text-[#d9b756]" /><h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.04em]">More destinations.<br />More possibilities.</h3><p className="mt-3 text-xs leading-5 text-white/65">Find DreamCarz locations and reference services as you plan your next move.</p><Link href="/dashboard/locations" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d9b756] px-4 py-2.5 text-xs font-bold text-black">Explore locations <ArrowRight size={14} /></Link></section>
            <section className="border border-[#e5e1d9] bg-white p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d9b756]"><Sparkles size={16} /></span><div><p className="text-sm font-bold text-black">Need help?</p><p className="mt-1 text-xs leading-5 text-gray-500">Ask DreamCarz about confirmed vehicles and your available next steps.</p></div></div><Link href="/concierge" className="mt-4 inline-flex items-center gap-2 text-xs font-bold underline decoration-[#b28d3b] decoration-2 underline-offset-4">Open Concierge <ArrowRight size={14} /></Link></section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
