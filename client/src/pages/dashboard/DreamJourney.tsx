import { ArrowRight, Car, CheckCircle2, Compass, Flag, Route, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";

const checkpoints = [
  { icon: Flag, title: "Set your destination", description: "Choose a dream vehicle or transportation objective that gives your journey a clear direction." },
  { icon: ShieldCheck, title: "Build readiness", description: "Keep your member profile, rental readiness, and transportation plan current." },
  { icon: Route, title: "Track your activity", description: "Review eligible activity and available DreamCarz Value under the current program rules." },
  { icon: Car, title: "Review your next move", description: "Explore available vehicles and options with the DreamCarz team when you are ready." },
] as const;

export default function DreamJourney() {
  return (
    <DashboardShell title="Dream Journey">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="grid gap-8 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your member journey</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black">One destination.<br />A clearer path.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">Dream Journey helps you organize the actions that support your transportation goals. It does not estimate vehicle ownership, point values, qualification dates, or financial outcomes.</p></div>
          <div className="bg-[#f7f5f0] p-6"><Compass size={22} className="text-[#a8832d]" /><p className="mt-5 text-sm font-semibold text-black">Your next step</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Complete rental readiness or review your current member activity to keep your transportation plan moving.</p><Link href="/dashboard/rental-setup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Open rental readiness <ArrowRight size={14} /></Link></div>
        </section>
        <section>
          <div className="flex items-end justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your roadmap</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Progress through the essentials.</h3></div><Link href="/dashboard/vehicles" className="hidden items-center gap-2 text-sm font-semibold underline underline-offset-4 sm:inline-flex">Browse vehicles <ArrowRight size={14} /></Link></div>
          <div className="mt-7 grid grid-cols-1 border-t border-gray-200 md:grid-cols-2">{checkpoints.map(({ icon: Icon, title, description }, index) => <article key={title} className="border-b border-gray-200 py-6 md:px-7 md:odd:pl-0 md:even:border-l md:even:pl-7"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white"><Icon size={16} /></span><div><p className="text-[11px] font-bold tracking-[0.16em] text-[#a8832d]">STEP {String(index + 1).padStart(2, "0")}</p><h4 className="mt-2 text-base font-bold text-black">{title}</h4><p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p></div></div></article>)}</div>
        </section>
        <section className="border-t border-gray-200 pt-7"><p className="flex gap-2 text-sm leading-relaxed text-gray-500"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#a8832d]" />Eligibility, release, redemption, vehicle availability, membership benefits, and any future transportation options are governed by the applicable program terms and agreements.</p></section>
      </div>
    </DashboardShell>
  );
}
