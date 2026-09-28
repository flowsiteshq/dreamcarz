import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, BriefcaseBusiness, CircleDollarSign, FileCheck2, LineChart, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";

const money = (cents: number | null | undefined) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
const percentage = (basisPoints: number) => `${(basisPoints / 100).toFixed(basisPoints % 100 ? 2 : 0)}%`;

export default function InvestorPortal() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const overview = trpc.investorPortal.overview.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const savePlanningAmount = trpc.investorPortal.savePlanningAmount.useMutation({ onSuccess: () => void utils.investorPortal.overview.invalidate() });
  const [amountDollars, setAmountDollars] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.assign("/investor-access");
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const saved = overview.data?.interest?.indicatedAmountCents;
    if (saved) setAmountDollars(String(saved / 100));
  }, [overview.data?.interest?.indicatedAmountCents]);

  const proposedCents = Math.max(0, Math.round(Number(amountDollars || 0) * 100));
  const targetRaiseCents = overview.data?.targetRaiseCents ?? 25_000_000;
  const localAllocationBps = Math.min(10_000, Math.round((proposedCents / targetRaiseCents) * 10_000));
  const currentAllocationBps = overview.data?.projection?.allocationBps ?? localAllocationBps;
  const latestMonthlyProfit = overview.data?.reports.at(-1)?.distributableProfitCents ?? null;
  const projectedMonthlyCents = latestMonthlyProfit === null ? null : Math.round(latestMonthlyProfit * (currentAllocationBps / 10_000));
  const chartData = useMemo(() => (overview.data?.reports ?? []).map(report => ({
    period: report.periodMonth,
    reportedProfit: (report.distributableProfitCents ?? 0) / 100,
    illustrativePayout: Math.round((report.distributableProfitCents ?? 0) * (currentAllocationBps / 10_000)) / 100,
  })), [currentAllocationBps, overview.data?.reports]);

  const savePlan = async () => {
    if (!overview.data?.opportunity || proposedCents < 10_000) {
      setNote("Enter a planning amount of at least $100.");
      return;
    }
    try {
      setNote("");
      await savePlanningAmount.mutateAsync({ opportunityId: overview.data.opportunity.id, indicatedAmountCents: proposedCents });
      setNote("Your personal planning amount has been saved. This is not an investment, payment, reservation, or ownership allocation.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Your planning amount could not be saved. Please try again.");
    }
  };

  if (loading || overview.isLoading) return <div className="min-h-screen bg-[#0b0b0a] text-white grid place-items-center"><div className="flex items-center gap-3 text-sm text-white/70"><Loader2 className="h-5 w-5 animate-spin" />Opening protected investor workspace…</div></div>;

  if (overview.error) return <main className="min-h-screen bg-[#0b0b0a] px-5 py-12 text-white"><section className="mx-auto max-w-2xl border border-[#b58a2a]/40 bg-[#131311] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7ad4c]">DreamCarz Investor Access</p><h1 className="mt-3 font-display text-4xl font-bold">Investor access is pending.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/70">This workspace is available only to verified DreamCarz accounts with an active Investor role. Create an account or sign in, then have a DreamCarz administrator grant Investor access.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/investor-access" className="inline-flex items-center gap-2 bg-[#d7ad4c] px-4 py-3 text-xs font-bold text-black">Investor access <ArrowRight size={15} /></Link><Link href="/" className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-xs font-bold text-white">Return to DreamCarz</Link></div></section></main>;

  const { opportunity } = overview.data ?? {};
  if (!opportunity) return <main className="min-h-screen bg-[#0b0b0a] px-5 py-12 text-white"><section className="mx-auto max-w-3xl border border-[#b58a2a]/40 bg-[#131311] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7ad4c]">Investor workspace</p><h1 className="mt-3 font-display text-4xl font-bold">Opportunity information is being prepared.</h1><p className="mt-4 text-sm leading-6 text-white/70">There is no investor opportunity available for this account to review at this time.</p></section></main>;

  return <main className="min-h-screen bg-[#0b0b0a] text-white">
    <header className="border-b border-white/10 bg-[#11110f]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5"><Link href="/" className="font-display text-lg font-bold tracking-[0.18em]">DREAMCARZ</Link><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#d7ad4c]"><LockKeyhole size={14} /> Investor workspace</div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-10 lg:py-14">
      <section className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d7ad4c]">Preliminary opportunity review</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] sm:text-6xl">{opportunity.title}</h1><p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">Review your personal planning allocation and published reporting in one controlled workspace. No investment, purchase, equity issuance, or payment is available on this page.</p></div><div className="border-l-2 border-[#d7ad4c] pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Target raise</p><p className="mt-1 font-display text-4xl font-bold">{money(opportunity.targetRaiseCents)}</p><p className="mt-2 text-xs leading-5 text-white/55">Status: <span className="font-semibold text-[#d7ad4c]">{opportunity.status.replaceAll("_", " ")}</span></p></div></section>

      <section className="mt-8 grid gap-5 md:grid-cols-3"><article className="border border-white/10 bg-[#151512] p-5"><BriefcaseBusiness className="h-5 w-5 text-[#d7ad4c]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Your planning amount</p><p className="mt-1 text-3xl font-bold">{money(proposedCents)}</p><p className="mt-2 text-xs leading-5 text-white/55">Saved only to your private planning profile.</p></article><article className="border border-white/10 bg-[#151512] p-5"><CircleDollarSign className="h-5 w-5 text-[#d7ad4c]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Illustrative allocation</p><p className="mt-1 text-3xl font-bold">{percentage(currentAllocationBps)}</p><p className="mt-2 text-xs leading-5 text-white/55">Planning amount ÷ stated target raise. Not equity or a binding allocation.</p></article><article className="border border-white/10 bg-[#151512] p-5"><LineChart className="h-5 w-5 text-[#d7ad4c]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Illustrative monthly share</p><p className="mt-1 text-3xl font-bold">{projectedMonthlyCents === null ? "—" : money(projectedMonthlyCents)}</p><p className="mt-2 text-xs leading-5 text-white/55">Available only after DreamCarz publishes a reported distributable-profit figure.</p></article></section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><article className="border border-[#d7ad4c]/40 bg-[#151512] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d7ad4c]">Allocation planner</p><h2 className="mt-2 font-display text-3xl font-bold">Explore your contribution level.</h2><p className="mt-3 text-sm leading-6 text-white/65">Use this private tool to see the mathematical percentage represented by a planning amount. It does not take funds or create a commitment.</p><label className="mt-6 block text-xs font-semibold text-white/75">Planning amount (USD)<input value={amountDollars} onChange={event => setAmountDollars(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="Example: 5000" className="mt-2 h-12 w-full border border-white/20 bg-black px-4 text-base text-white outline-none focus:border-[#d7ad4c]" /></label><button type="button" disabled={savePlanningAmount.isPending} onClick={() => void savePlan()} className="mt-4 inline-flex h-11 items-center gap-2 bg-[#d7ad4c] px-4 text-xs font-bold text-black disabled:opacity-50">{savePlanningAmount.isPending ? "Saving…" : "Save my planning amount"} <ArrowRight size={14} /></button>{note && <p className="mt-4 text-xs leading-5 text-white/65">{note}</p>}<div className="mt-6 border-t border-white/10 pt-5 text-[11px] leading-5 text-white/50"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#d7ad4c]" />No card, bank, wire, wallet, or payment information is requested or accepted in this workspace.</div></article>
        <article className="border border-white/10 bg-[#151512] p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d7ad4c]">Published reporting</p><h2 className="mt-2 font-display text-3xl font-bold">Performance and illustration.</h2></div><BarChart3 className="h-6 w-6 text-[#d7ad4c]" /></div>{chartData.length ? <><p className="mt-3 text-xs leading-5 text-white/60">Reported distributable profit is shown alongside the mathematical illustration for your saved planning allocation. Past results do not predict future outcomes.</p><div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -20 }}><defs><linearGradient id="reportedProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d7ad4c" stopOpacity={0.55}/><stop offset="95%" stopColor="#d7ad4c" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff18" vertical={false}/><XAxis dataKey="period" stroke="#ffffff66" tick={{ fill: "#ffffff99", fontSize: 11 }} tickLine={false} axisLine={false}/><YAxis stroke="#ffffff66" tick={{ fill: "#ffffff99", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={value => `$${Math.round(value / 1000)}k`}/><Tooltip contentStyle={{ background: "#0b0b0a", border: "1px solid #d7ad4c66", color: "#fff" }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "reportedProfit" ? "Reported distributable profit" : "Illustrative monthly share"]}/><Area type="monotone" dataKey="reportedProfit" stroke="#d7ad4c" fill="url(#reportedProfit)" strokeWidth={2}/><Area type="monotone" dataKey="illustrativePayout" stroke="#ffffff" fill="transparent" strokeWidth={2} strokeDasharray="5 5"/></AreaChart></ResponsiveContainer></div></> : <div className="mt-6 grid min-h-72 place-items-center border border-dashed border-white/20 bg-black/20 p-6 text-center"><div><FileCheck2 className="mx-auto h-7 w-7 text-[#d7ad4c]" /><p className="mt-4 text-sm font-semibold">No published financial report yet.</p><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/55">The chart and any payout illustration remain unavailable until an authorized DreamCarz administrator publishes a sourced monthly report.</p></div></div>}</article></section>

      <section className="mt-8 border border-white/10 bg-[#11110f] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d7ad4c]">Important notice</p><p className="mt-3 max-w-5xl text-xs leading-6 text-white/60">This portal is an information and planning workspace only. It is not an offer to sell, a solicitation to buy, a prospectus, an investment contract, or a guarantee of any return. An illustrative percentage is simply a mathematical comparison of a planning amount to the stated target raise. Any actual offering, investor eligibility review, legal documentation, transfer of funds, equity issuance, or distribution requires separately approved legal, compliance, accounting, and payment processes.</p></section>
    </div>
  </main>;
}
