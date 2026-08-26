import { Check, ChevronRight, Star } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";

const tiers = [
  { name: "Freedom", experience: "Everyday vehicle experience", details: ["Foundational DreamCarz membership", "Available vehicle access", "Rental readiness support"] },
  { name: "Plus", experience: "Upgraded vehicle experience", details: ["Expanded member experience", "Eligible program benefits", "Priority support options"] },
  { name: "Pro", experience: "Premium vehicle experience", details: ["Premium vehicle focus", "Enhanced member support", "Progression options under program rules"] },
  { name: "Elite", experience: "Luxury vehicle experience", details: ["Luxury-focused experience", "Priority consideration where available", "Eligibility and availability apply"] },
] as const;

export default function MembershipPage() {
  return (
    <DashboardShell title="Membership">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="grid gap-8 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Member experience</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-black">Choose your drive.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">Start with the vehicle experience. The benefit matrix, eligibility, availability, and DreamCarz Value use for every tier are defined by the applicable program terms.</p></div>
          <div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold text-black">Your membership is a transportation relationship.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Complete rental readiness, manage reservations, review available eligible value, and explore the pathway that fits your current needs.</p></div>
        </section>
        <section className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{tiers.map((tier) => <article key={tier.name} className="border-b border-gray-200 py-7 sm:px-5 sm:first:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"><Star size={15} /></span><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">{tier.name}</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-black">{tier.experience}</h3><div className="mt-5 space-y-3">{tier.details.map((detail) => <p key={detail} className="flex gap-2 text-sm leading-relaxed text-gray-600"><Check size={15} className="mt-0.5 shrink-0 text-[#a8832d]" />{detail}</p>)}</div></article>)}</section>
        <section className="grid gap-8 bg-[#f7f5f0] p-6 lg:grid-cols-[1fr_0.9fr] lg:p-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">DreamCarz Value</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Make value easy to understand.</h3><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">Eligible activity may build DreamCarz Value. Review your activity and available eligible value in My Account before applying it toward approved transportation charges or benefits.</p></div><div className="border-t border-[#d8d1c4] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><p className="text-sm font-semibold">What to review</p><ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600"><li>Eligibility and activity status</li><li>Release and redemption rules</li><li>Approved transportation uses</li><li>Current program documentation</li></ul><Link href="/dashboard/rewards" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-black underline underline-offset-4">View my activity <ChevronRight size={14} /></Link></div></section>
      </div>
    </DashboardShell>
  );
}
