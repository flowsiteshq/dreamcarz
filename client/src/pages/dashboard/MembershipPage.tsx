import { Check, ChevronRight, Crown, Gauge, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";

const packages = [
  {
    name: "Entry",
    access: "Entry vehicle access",
    eyebrow: "Practical driving",
    description: "Designed for members beginning with practical, lower-tier vehicles in the confirmed DreamCarz lineup.",
    details: ["Explore practical sedan and SUV options", "Start with rental readiness and a vehicle request", "Review availability and final terms before approval"],
    href: "/fleet?access=entry",
    cta: "Explore Entry vehicles",
    icon: Gauge,
    featured: false,
  },
  {
    name: "Mid-Range",
    access: "Mid-Range vehicle access",
    eyebrow: "Everyday flexibility",
    description: "Designed for members seeking balanced everyday, family, and mid-range vehicle options.",
    details: ["Explore balanced sedan and SUV options", "Choose a rental or purchase request path", "Use My Account to manage your next steps"],
    href: "/fleet?access=mid-range",
    cta: "Explore Mid-Range vehicles",
    icon: ShieldCheck,
    featured: true,
  },
  {
    name: "Elite",
    access: "Elite vehicle access",
    eyebrow: "Highest current category",
    description: "Designed for members considering the highest vehicle category represented in the current confirmed lineup.",
    details: ["Explore the highest current vehicle category", "Request review for rental or purchase options", "Final vehicle access remains subject to review"],
    href: "/fleet?access=elite",
    cta: "Explore Elite vehicles",
    icon: Crown,
    featured: false,
  },
] as const;

export default function MembershipPage() {
  return (
    <DashboardShell title="Vehicle Access Packages">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="border-b border-gray-200 pb-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Vehicle access packages</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.045em] text-black sm:text-5xl">Choose the vehicle category that fits your drive.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500">Start with the kind of vehicle you want to drive: Entry, Mid-Range, or Elite. Each package leads to the current confirmed inventory and a clear rental-or-purchase request path.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <article key={pkg.name} className={`flex min-h-[440px] flex-col border p-7 ${pkg.featured ? "border-black bg-black text-white" : "border-gray-200 bg-white text-black"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${pkg.featured ? "bg-white text-black" : "bg-black text-white"}`}><Icon size={18} /></div>
                <p className={`mt-6 text-[11px] font-bold uppercase tracking-[0.16em] ${pkg.featured ? "text-[#d8bc79]" : "text-[#a8832d]"}`}>{pkg.eyebrow}</p>
                <h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">{pkg.name}</h3>
                <p className={`mt-1 text-sm font-semibold ${pkg.featured ? "text-white" : "text-gray-700"}`}>{pkg.access}</p>
                <p className={`mt-5 text-sm leading-relaxed ${pkg.featured ? "text-gray-300" : "text-gray-500"}`}>{pkg.description}</p>
                <div className={`mt-7 space-y-3 border-t pt-5 ${pkg.featured ? "border-gray-700" : "border-gray-200"}`}>
                  {pkg.details.map((detail) => <p key={detail} className={`flex gap-2 text-sm leading-relaxed ${pkg.featured ? "text-gray-200" : "text-gray-600"}`}><Check size={15} className={`mt-0.5 shrink-0 ${pkg.featured ? "text-[#d8bc79]" : "text-[#a8832d]"}`} />{detail}</p>)}
                </div>
                <Link href={pkg.href} className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${pkg.featured ? "bg-white text-black" : "bg-black text-white"}`}>{pkg.cta} <ChevronRight size={15} /></Link>
              </article>
            );
          })}
        </section>

        <section className="grid gap-7 border-y border-gray-200 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">How vehicle access works</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Select. Explore. Request.</h3><p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-500">Choose a vehicle-access package, explore the matching confirmed inventory, then open a vehicle to request rental review or purchase information.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[["01", "Select", "Choose the vehicle category that fits your current needs."], ["02", "Explore", "Review the confirmed vehicles represented in that category."], ["03", "Request", "Submit a rental or purchase request for DreamCarz review."]].map(([number, title, description]) => <div key={number} className="border border-gray-200 bg-[#f7f5f0] p-4"><p className="text-[10px] font-bold tracking-[0.16em] text-[#a8832d]">{number}</p><p className="mt-4 font-semibold">{title}</p><p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p></div>)}</div>
        </section>

        <section className="grid gap-6 bg-[#f7f5f0] p-6 lg:grid-cols-[1fr_0.95fr] lg:p-8">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Important to know</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">The package guides the request. It does not promise a vehicle.</h3></div>
          <p className="text-sm leading-relaxed text-gray-600">Vehicle availability, rental terms, purchase terms, member eligibility, and final approval are confirmed by DreamCarz for each request. The displayed inventory is current as provided and may change.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
