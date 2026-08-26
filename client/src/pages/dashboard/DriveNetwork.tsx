import DashboardShell from "@/components/DashboardShell";
import { Award, Check, Copy, DollarSign, Link, ShieldCheck, Target, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getMarketerPath, getNextMarketerPath, isActiveTeamMember, marketerPaths } from "@shared/marketerDashboard";

type Tab = "overview" | "team" | "activity" | "tools";

function formatMoney(cents: number | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DriveNetwork() {
  const [tab, setTab] = useState<Tab>("overview");
  const statsQuery = trpc.driveNetwork.getStats.useQuery();
  const teamQuery = trpc.driveNetwork.getDownline.useQuery();
  const commissionsQuery = trpc.driveNetwork.getCommissions.useQuery();
  const stats = statsQuery.data;
  const team = teamQuery.data ?? [];
  const commissions = commissionsQuery.data ?? [];
  const currentPath = getMarketerPath(stats?.rank);
  const nextPath = getNextMarketerPath(stats?.rank);
  const activeTeamCount = team.filter(member => isActiveTeamMember(member.status)).length;
  const referralLink = stats?.referralCode
    ? `https://dreamcarz-xrgtgznf.manus.space/login?ref=${stats.referralCode}`
    : "";

  const copy = async (value: string, confirmation: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(confirmation);
  };

  const compliantInvite = referralLink
    ? `I’m sharing DreamCarz Network because it offers membership, vehicle, and approved business-path information in one place. Review the details and decide whether it is right for you: ${referralLink}`
    : "";

  return (
    <DashboardShell title="Associate Path">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-black p-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d9bc6b]"><Target size={14} /> DreamCarz Associate Path</div>
              <h2 className="font-display text-3xl font-bold leading-tight">Build customers. Create progress.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">Build verified customer relationships, recognize qualifying activity, and use approved sharing tools—designed for a responsible DreamCarz business path.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 lg:min-w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">Current Associate path</div>
              <div className="mt-1 text-xl font-bold">{currentPath.label}</div>
              <div className="mt-1 text-xs text-white/50">Next: {nextPath.label}</div>
            </div>
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 sm:grid-cols-4" aria-label="Marketer dashboard sections">
          {(["overview", "team", "activity", "tools"] as Tab[]).map(item => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-3 py-2.5 text-xs font-bold capitalize transition-colors ${tab === item ? "bg-white text-black shadow-sm" : "text-gray-500"}`}>{item}</button>)}
        </nav>

        {tab === "overview" && <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Direct connections", value: stats?.directReferrals ?? 0, icon: Users, note: "Recorded referrals" },
              { label: "Active direct team", value: stats?.activeDirectReferrals ?? activeTeamCount, icon: TrendingUp, note: "Active referral status" },
              { label: "This-month activity", value: formatMoney(stats?.thisMonthTotal), icon: DollarSign, note: "Recorded commission total" },
              { label: "Recognized total", value: formatMoney(stats?.totalEarned), icon: Award, note: "Recorded to your profile" },
            ].map(metric => {
              const Icon = metric.icon;
              return <div key={metric.label} className="rounded-2xl border border-gray-100 bg-white p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">{metric.label}</span><Icon size={16} className="text-gray-300" /></div><div className="mt-3 text-2xl font-bold text-black">{metric.value}</div><p className="mt-1 text-[10px] text-gray-400">{metric.note}</p></div>;
            })}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-black">Build → Recognize → Unlock</h3><p className="mt-1 text-xs leading-relaxed text-gray-500">A visibility tool—not a promise of rank, compensation, or results.</p></div><ShieldCheck size={18} className="text-[#b8860b]" /></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {marketerPaths.map(path => {
                  const completed = marketerPaths.findIndex(item => item.id === currentPath.id) > marketerPaths.findIndex(item => item.id === path.id);
                  const current = path.id === currentPath.id;
                  return <div key={path.id} className={`rounded-2xl border p-4 ${current ? "border-black bg-black text-white" : "border-gray-100 bg-gray-50"}`}><div className="flex items-center justify-between"><span className="text-xs font-bold">{path.label}</span>{completed && <Check size={14} className={current ? "text-[#d9bc6b]" : "text-green-600"} />}</div><p className={`mt-2 text-[11px] leading-relaxed ${current ? "text-white/60" : "text-gray-500"}`}>{path.description}</p></div>;
                })}
              </div>
            </div>
            <div className="rounded-3xl bg-[#f8f6f0] p-5"><h3 className="text-sm font-bold text-black">Compensation categories</h3><p className="mt-1 text-xs leading-relaxed text-gray-500">Where qualifying activity applies, official program documents govern eligibility, calculations, timing, and payment.</p><div className="mt-5 space-y-3">{["Advance Commissions", "Monthly Residuals", "Leadership Overrides", "Performance Bonuses"].map((label, index) => <div key={label} className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">0{index + 1}</div><span className="text-xs font-semibold text-black">{label}</span></div>)}</div></div>
          </section>
        </div>}

        {tab === "team" && <section className="rounded-3xl border border-gray-100 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-black">Your direct team</h3><p className="mt-1 text-xs text-gray-500">Only direct referral records are shown here. Team members’ personal compensation and private account details are not exposed.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-black">{team.length} total</span></div>{teamQuery.isLoading ? <p className="py-12 text-center text-sm text-gray-400">Loading team activity…</p> : team.length === 0 ? <div className="py-14 text-center"><Users size={26} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-semibold text-black">No direct connections yet</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-gray-500">Use the approved invitation resources to share DreamCarz information responsibly.</p></div> : <div className="mt-5 space-y-2">{team.map(member => <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-bold text-white">{(member.name ?? "M").split(" ").map(part => part[0]).join("").slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-black">{member.name ?? "DreamCarz member"}</p><p className="mt-0.5 text-[11px] text-gray-500">{getMarketerPath(member.rank).label} · Joined {formatDate(member.joinedAt)}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isActiveTeamMember(member.status) ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{member.status}</span><span className="text-[10px] text-gray-400">Level {member.level}</span></div></div>)}</div>}</section>}

        {tab === "activity" && <section className="rounded-3xl border border-gray-100 bg-white p-5"><div><h3 className="text-sm font-bold text-black">Recognized commission activity</h3><p className="mt-1 text-xs leading-relaxed text-gray-500">This reflects recorded activity only. It is not an earnings projection or income representation.</p></div>{commissionsQuery.isLoading ? <p className="py-12 text-center text-sm text-gray-400">Loading recorded activity…</p> : commissions.length === 0 ? <div className="py-14 text-center"><DollarSign size={26} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-semibold text-black">No recorded commission activity yet</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-gray-500">Qualifying activity, eligibility, payment timing, and all amounts are governed by official program documentation.</p></div> : <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left"><thead className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400"><tr><th className="pb-3 font-semibold">Period</th><th className="pb-3 font-semibold">Advance</th><th className="pb-3 font-semibold">Residual</th><th className="pb-3 font-semibold">Leadership</th><th className="pb-3 font-semibold">Performance</th><th className="pb-3 text-right font-semibold">Total</th></tr></thead><tbody>{commissions.map(item => <tr key={item.id} className="border-b border-gray-50 text-xs text-gray-600"><td className="py-4 font-semibold text-black">{item.month}</td><td className="py-4">{formatMoney(item.referralBonus)}</td><td className="py-4">{formatMoney(item.residualIncome)}</td><td className="py-4">{formatMoney(item.dcpMatching)}</td><td className="py-4">{formatMoney(item.rankBonus)}</td><td className="py-4 text-right font-bold text-black">{formatMoney(item.total)}</td></tr>)}</tbody></table></div>}</section>}

        {tab === "tools" && <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]"><section className="rounded-3xl border border-gray-100 bg-white p-5"><div className="flex items-center gap-2"><Link size={16} className="text-[#b8860b]" /><h3 className="text-sm font-bold text-black">Your approved invitation link</h3></div><p className="mt-2 text-xs leading-relaxed text-gray-500">Share only approved information. Do not represent compensation, vehicle access, results, or business outcomes as guaranteed.</p><div className="mt-5 flex gap-2 rounded-2xl bg-gray-50 p-3"><span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-600">{referralLink || "Creating your referral link…"}</span><button onClick={() => copy(referralLink, "Invitation link copied")} disabled={!referralLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-black px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Copy size={12} /> Copy</button></div></section><section className="rounded-3xl bg-black p-5 text-white"><h3 className="text-sm font-bold">Compliant invitation message</h3><p className="mt-2 text-xs leading-relaxed text-white/60">Use this starting point, then share your personal experience accurately.</p><div className="mt-4 rounded-2xl bg-white/10 p-4 text-xs leading-relaxed text-white/80">{compliantInvite || "Your approved invitation message will appear when your referral profile is ready."}</div><button onClick={() => copy(compliantInvite, "Invitation message copied")} disabled={!compliantInvite} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-black disabled:opacity-50"><Copy size={12} /> Copy message</button></section></div>}

        <p className="px-1 text-[10px] leading-relaxed text-gray-400">DreamCarz business-path participation is subject to approved program terms, applicable law, training requirements, and review. This dashboard does not make income, rank, or outcome guarantees.</p>
      </div>
    </DashboardShell>
  );
}
