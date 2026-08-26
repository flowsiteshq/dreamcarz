import { ArrowRight, Building2, CalendarDays, Car, CheckCircle2, ClipboardCheck, Compass, Network, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";

const memberActions = [
  { icon: ClipboardCheck, label: "Rental readiness", description: "Complete or review the profile steps needed before requesting a vehicle.", href: "/dashboard/rental-setup", cta: "Open rental readiness" },
  { icon: CalendarDays, label: "Reservations", description: "Request, review, and manage your available DreamCarz reservations.", href: "/dashboard/reservations", cta: "View reservations" },
  { icon: Compass, label: "Dream Journey", description: "Organize the member actions that support your transportation objective.", href: "/dashboard/dream-journey", cta: "Open Dream Journey" },
] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Member";

  return (
    <DashboardShell title={`Welcome back, ${firstName}`}>
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">My Account</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black">Your transportation plan, all in one place.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">Start with rental readiness, manage available reservations, review eligible value, and choose the next step that fits your DreamCarz journey.</p></div>
          <div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">Your member process</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Join → Drive → Build → Use. Eligibility, availability, release, redemption, and member benefits are governed by the applicable program terms.</p></div>
        </section>

        <section className="grid grid-cols-1 border-t border-gray-200 md:grid-cols-3">{memberActions.map(({ icon: Icon, label, description, href, cta }) => <article key={label} className="border-b border-gray-200 py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"><Icon size={17} /></span><h3 className="mt-5 text-lg font-bold text-black">{label}</h3><p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p><Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{cta}<ArrowRight size={14} /></Link></article>)}</section>

        <section className="grid gap-6 bg-[#f7f5f0] p-6 lg:grid-cols-2 lg:p-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">DreamCarz Value</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Review eligible value with clarity.</h3><p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-600">View your recorded activity and any available eligible DreamCarz Value in My Account. Use is limited to approved transportation charges and benefits under the current rules.</p><Link href="/dashboard/rewards" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Review activity <ArrowRight size={14} /></Link></div><div className="grid gap-4 sm:grid-cols-2"><div className="border border-[#d8d1c4] bg-white p-5"><ShieldCheck size={18} className="text-[#a8832d]" /><p className="mt-4 text-sm font-semibold">Program-aware</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Eligibility, release, and redemption remain visible before use.</p></div><div className="border border-[#d8d1c4] bg-white p-5"><Car size={18} className="text-[#a8832d]" /><p className="mt-4 text-sm font-semibold">Transportation-focused</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Value applies only to approved transportation charges and benefits.</p></div></div></section>

        <section className="grid gap-6 border-t border-gray-200 pt-8 lg:grid-cols-[1fr_0.9fr]"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Beyond membership</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Explore the pathway that fits your objective.</h3><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">Members can stay focused on transportation access. If you are interested in helping build customers or participating in fleet growth, explore the separate pathways and their written requirements.</p></div><div className="grid divide-y divide-gray-200 border-y border-gray-200"><Link href="/dashboard/drive-network" className="flex items-center justify-between gap-4 py-5"><div className="flex items-center gap-3"><Network size={17} className="text-[#a8832d]" /><div><p className="text-sm font-semibold">Associate Path</p><p className="mt-1 text-xs text-gray-500">Build verified customer relationships with approved resources.</p></div></div><ArrowRight size={15} /></Link><Link href="/opportunity#fleet-partner" className="flex items-center justify-between gap-4 py-5"><div className="flex items-center gap-3"><Building2 size={17} className="text-[#a8832d]" /><div><p className="text-sm font-semibold">Fleet Partner Path</p><p className="mt-1 text-xs text-gray-500">Review fleet participation expectations and speak with the team.</p></div></div><ArrowRight size={15} /></Link></div></section>
        <section className="border-t border-gray-200 pt-6"><p className="flex gap-2 text-sm leading-relaxed text-gray-500"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#a8832d]" />DreamCarz member, Associate, and Fleet Partner pathways have different requirements. Final vehicle, membership, activity, compensation, fleet, and program terms are governed by the applicable documentation and agreements.</p></section>
      </div>
    </DashboardShell>
  );
}
