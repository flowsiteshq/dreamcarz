import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AdminOperationsContent } from "@/pages/dashboard/AdminOperations";
import { AlertTriangle, Bell, Car, ChevronRight, ClipboardCheck, FileText, KeyRound, Loader2, LogOut, Menu, ShieldCheck, Users, Wrench } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const adminLinks = [
  { label: "Dashboard", id: "admin-dashboard", icon: ShieldCheck },
  { label: "Fleet", id: "admin-fleet", icon: Car },
  { label: "Customers", id: "admin-customers", icon: Users },
  { label: "Rentals & sales", id: "admin-customers", icon: ClipboardCheck },
  { label: "DCP & pricing", id: "admin-dcp", icon: FileText },
  { label: "Maintenance", id: "admin-fleet", icon: Wrench },
  { label: "Compliance", id: "admin-reviews", icon: ShieldCheck },
  { label: "Documents", id: "admin-customers", icon: FileText },
  { label: "Operations", id: "admin-operations", icon: ClipboardCheck },
];

function AdministratorLogin() {
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const user = await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      if (user.role !== "admin") {
        setError("This account does not have Administrator access.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in could not be completed.");
    }
  };

  return <main className="min-h-screen bg-[#f7f6f3] p-5 text-black sm:p-8"><div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-5xl overflow-hidden border border-[#242424] bg-white lg:grid-cols-[0.95fr_1.05fr]"><section className="bg-[#0b0d0e] p-7 text-white sm:p-10"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border border-[#cfad58] text-sm font-bold text-[#cfad58]">DC</div><span className="text-sm font-bold tracking-[0.18em]">DREAMCARZ</span></div><div className="mt-20"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#cfad58]">Administrator portal</p><h1 className="mt-4 max-w-sm text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>Operate your fleet with clarity.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">Authorized staff access only. Fleet, customers, policies, reviews, and operations stay in one controlled workspace.</p></div></section><section className="flex items-center p-7 sm:p-10"><form onSubmit={submit} className="w-full max-w-sm" noValidate><div className="flex h-10 w-10 items-center justify-center bg-black text-[#cfad58]"><KeyRound size={17} /></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Secure administrator access</p><h2 className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Sign in to Admin</h2><p className="mt-3 text-sm leading-6 text-gray-500">Use your authorized DreamCarz administrator account.</p><label className="mt-8 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">Email<input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" className="mt-2 h-12 w-full border border-gray-300 bg-white px-3 text-sm text-black outline-none focus:border-black" /></label><label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-gray-600">Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" required placeholder="Your password" className="mt-2 h-12 w-full border border-gray-300 bg-white px-3 text-sm text-black outline-none focus:border-black" /></label>{error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="submit" disabled={login.isPending} className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-black text-sm font-semibold text-white disabled:opacity-60">{login.isPending ? <Loader2 size={17} className="animate-spin" /> : "Sign in to Administrator portal"}<ChevronRight size={17} /></button></form></section></div></main>;
}

function AdminPortalOverview({ onOpen }: { onOpen: (section: string) => void }) {
  const fleet = trpc.operations.vehiclePassports.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const calendar = trpc.operations.fleetCalendar.useQuery(undefined, { refetchOnWindowFocus: false });
  const queue = trpc.operations.getQueue.useQuery(undefined, { refetchOnWindowFocus: false });
  const transactions = trpc.operations.transactionConsole.useQuery({ query: undefined }, { refetchOnWindowFocus: false });
  const passports = fleet.data ?? [];
  const calendarEntries = calendar.data ?? [];
  const transactionRows = transactions.data ?? [];
  const attention = passports.filter(item => ["inspection_due", "maintenance_due", "out_of_service"].includes(item.readinessStatus)).length;
  const active = passports.filter(item => ["reserved", "active_rental"].includes(item.readinessStatus)).length;
  const available = passports.filter(item => item.readinessStatus === "available").length;
  const reviewCount = (queue.data?.applications ?? []).filter(item => ["submitted", "under_review", "needs_attention"].includes(item.status)).length + (queue.data?.reservations ?? []).filter(item => ["submitted", "under_review", "change_requested"].includes(item.status)).length + transactionRows.filter(item => ["manual_review", "verification_pending", "eligibility_review"].includes(item.status)).length;
  const metrics = [
    { label: "Tracked vehicles", value: passports.length, note: "Vehicle Passports", section: "admin-fleet", icon: Car, tone: "text-[#a87918]" },
    { label: "Available", value: available, note: "Readiness status", section: "admin-fleet", icon: ShieldCheck, tone: "text-emerald-700" },
    { label: "Reserved / active", value: active, note: "Current fleet movement", section: "admin-operations", icon: ClipboardCheck, tone: "text-blue-700" },
    { label: "Needs attention", value: attention, note: "Inspection or service", section: "admin-fleet", icon: AlertTriangle, tone: "text-amber-700" },
    { label: "Manual reviews", value: reviewCount, note: "Human decision required", section: "admin-reviews", icon: Users, tone: "text-violet-700" },
  ];

  return <div className="space-y-6">
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="border border-[#e4dfd5] bg-white p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Today&apos;s command center</p><h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Run DreamCarz with clarity.</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">Live fleet readiness, customer journeys, controlled policy administration, and manual review queues. Counts reflect recorded DreamCarz data only.</p><div className="mt-6 grid gap-px overflow-hidden border border-gray-200 bg-gray-200 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(metric => { const Icon = metric.icon; return <button type="button" key={metric.label} onClick={() => onOpen(metric.section)} className="min-h-[150px] bg-white p-4 text-left hover:bg-[#fbfaf7]"><Icon size={17} className={metric.tone} /><p className="mt-6 text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{metric.value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-700">{metric.label}</p><p className="mt-1 text-[10px] text-gray-400">{metric.note}</p></button>; })}</div></div>
      <aside className="border border-[#1a1d1f] bg-[#0b0d0e] p-5 text-white"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#cfad58]">Concierge operations</p><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><h3 className="mt-5 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>What needs attention?</h3><p className="mt-2 text-sm leading-6 text-white/55">Open the next controlled workspace. Financial collection, provider actions, and releases remain separately gated.</p><div className="mt-5 space-y-2"><button type="button" onClick={() => onOpen("admin-reviews")} className="flex h-11 w-full items-center justify-between border border-white/15 px-3 text-left text-xs font-semibold hover:border-[#cfad58]"><span>Review member queue</span><ChevronRight size={15} /></button><button type="button" onClick={() => onOpen("admin-fleet")} className="flex h-11 w-full items-center justify-between border border-white/15 px-3 text-left text-xs font-semibold hover:border-[#cfad58]"><span>Open fleet readiness</span><ChevronRight size={15} /></button><button type="button" onClick={() => onOpen("admin-dcp")} className="flex h-11 w-full items-center justify-between border border-white/15 px-3 text-left text-xs font-semibold hover:border-[#cfad58]"><span>Manage DCP policies</span><ChevronRight size={15} /></button></div></aside>
    </section>
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="border border-[#e4dfd5] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Operations pulse</p><h3 className="mt-1 text-lg font-bold text-black">Recorded workflow activity</h3></div><button type="button" onClick={() => onOpen("admin-operations")} className="text-xs font-semibold text-black underline underline-offset-4">Open operations</button></div><div className="mt-5 grid gap-px border border-gray-200 bg-gray-200 sm:grid-cols-3"><button type="button" onClick={() => onOpen("admin-operations")} className="bg-[#fbfaf7] p-4 text-left"><p className="text-2xl font-bold text-black">{calendarEntries.length}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Schedule windows</p></button><button type="button" onClick={() => onOpen("admin-customers")} className="bg-[#fbfaf7] p-4 text-left"><p className="text-2xl font-bold text-black">{transactionRows.length}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Recorded journeys</p></button><button type="button" onClick={() => onOpen("admin-reviews")} className="bg-[#fbfaf7] p-4 text-left"><p className="text-2xl font-bold text-black">{reviewCount}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Review items</p></button></div></div>
      <div className="border border-[#e4dfd5] bg-white p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Quick access</p><h3 className="mt-1 text-lg font-bold text-black">Open a management area</h3><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => onOpen("admin-customers")} className="flex min-h-[74px] flex-col justify-between border border-gray-200 p-3 text-left text-xs font-semibold hover:border-black"><Users size={16} className="text-[#a8832d]" />Customers</button><button type="button" onClick={() => onOpen("admin-fleet")} className="flex min-h-[74px] flex-col justify-between border border-gray-200 p-3 text-left text-xs font-semibold hover:border-black"><Car size={16} className="text-[#a8832d]" />Fleet</button><button type="button" onClick={() => onOpen("admin-dcp")} className="flex min-h-[74px] flex-col justify-between border border-gray-200 p-3 text-left text-xs font-semibold hover:border-black"><FileText size={16} className="text-[#a8832d]" />DCP policies</button><button type="button" onClick={() => onOpen("admin-reviews")} className="flex min-h-[74px] flex-col justify-between border border-gray-200 p-3 text-left text-xs font-semibold hover:border-black"><ClipboardCheck size={16} className="text-[#a8832d]" />Review queue</button></div></div>
    </section>
  </div>;
}

export default function AdminPortal() {
  const { user, loading, isAuthenticated } = useAuth();
  const logout = trpc.auth.logout.useMutation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("admin-dashboard");

  const navigateTo = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
    if (id === "admin-dashboard") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (activeSection === "admin-dashboard") return;
    const timer = window.setTimeout(() => document.getElementById(activeSection)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(timer);
  }, [activeSection]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f3]"><Loader2 size={26} className="animate-spin text-gray-400" /></main>;
  if (!isAuthenticated) return <AdministratorLogin />;
  if (user?.role !== "admin") return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f3] p-5"><section className="max-w-md border border-[#ded8cf] bg-white p-8 text-center"><AlertTriangle className="mx-auto text-[#b88725]" size={28} /><h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Administrator access required</h1><p className="mt-3 text-sm leading-6 text-gray-500">This account does not have permission to open DreamCarz Administrator.</p><button type="button" onClick={() => logout.mutate()} className="mt-6 h-10 bg-black px-4 text-xs font-semibold text-white">Sign out</button></section></main>;

  return <div className="min-h-screen bg-[#f7f6f3] text-black"><aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#0b0d0e] text-white transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}><div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center border border-[#cfad58] text-xs font-bold text-[#cfad58]">DC</div><span className="text-sm font-bold tracking-[0.16em]">DREAMCARZ</span></div><button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close administrator navigation"><ChevronRight size={18} /></button></div><div className="px-4 pt-6"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Command Center</p><nav className="mt-3 space-y-1">{adminLinks.map((item) => { const Icon = item.icon; const selected = activeSection === item.id; return <button key={item.label} type="button" onClick={() => navigateTo(item.id)} className={`flex h-11 w-full items-center gap-3 px-3 text-left text-sm font-medium ${selected ? "bg-[#2b291f] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}><Icon size={16} className={selected ? "text-[#d7aa46]" : "text-white/50"} />{item.label}</button>; })}</nav></div><div className="mt-auto border-t border-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#cfad58]">Authorized operator</p><p className="mt-2 text-sm font-semibold">{user.name || user.email || "Administrator"}</p><button type="button" onClick={() => logout.mutate()} className="mt-4 flex h-10 w-full items-center justify-center gap-2 border border-[#cfad58]/60 text-xs font-semibold text-[#f0cd77]"><LogOut size={14} /> Sign out</button></div></aside><div className="lg:pl-72"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e4e0d9] bg-white/95 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-4"><button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden" aria-label="Open administrator navigation"><Menu size={20} /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">DreamCarz</p><h1 className="text-base font-bold">Administrator</h1></div></div><div className="flex items-center gap-4"><button type="button" onClick={() => navigateTo("admin-dashboard")} className="hidden h-10 border border-gray-300 px-3 text-xs font-semibold sm:inline-flex">Command center</button><Bell size={18} className="text-gray-500" /><div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white">{(user.name || user.email || "A").slice(0, 2).toUpperCase()}</div></div></header><main id="admin-dashboard" className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8"><header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Operating overview</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]" style={{ fontFamily: "var(--font-display)" }}>Good day, {user.name?.split(" ")[0] || "Administrator"}.</h2><p className="mt-2 text-sm text-gray-500">Recorded fleet, customer, review, and policy activity in one place.</p></div>{activeSection !== "admin-dashboard" && <button type="button" onClick={() => navigateTo("admin-dashboard")} className="flex h-11 items-center gap-2 bg-black px-4 text-xs font-semibold text-white"><ChevronRight size={15} className="rotate-180 text-[#cfad58]" /> Back to overview</button>}</header>{activeSection === "admin-dashboard" ? <AdminPortalOverview onOpen={navigateTo} /> : <AdminOperationsContent />}</main></div></div>;
}
