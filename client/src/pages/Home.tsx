import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Car, CircleDollarSign, Compass, ShieldCheck, Users, Building2, Route } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";

const pathways = [
  {
    icon: Car,
    label: "Drive",
    title: "Member",
    description: "Choose a membership experience, complete rental readiness, select an available vehicle, and manage your transportation in one place.",
    href: "/membership",
    cta: "Explore membership",
  },
  {
    icon: Users,
    label: "Build",
    title: "Associate",
    description: "Share approved DreamCarz information, support verified customer activity, and follow a qualification-based business path.",
    href: "/opportunity",
    cta: "Explore the Associate path",
  },
  {
    icon: Building2,
    label: "Participate",
    title: "Fleet Partner",
    description: "Explore fleet participation opportunities built around operating standards, transparent documentation, and written agreements.",
    href: "/opportunity",
    cta: "Explore fleet participation",
  },
];

const memberSteps = [
  ["01", "Join", "Create your account and choose the membership experience that fits your transportation needs."],
  ["02", "Drive", "Complete rental readiness and select an available DreamCarz vehicle."],
  ["03", "Build", "Eligible activity may build DreamCarz Value, subject to program rules."],
  ["04", "Use", "Apply eligible value toward approved DreamCarz transportation charges and benefits."],
] as const;

const currentInventory = [
  { year: "2024", make: "Chevrolet", model: "Malibu", color: "Gray", category: "Sedan", availability: "Contact to confirm rental or sale" },
  { year: "2022", make: "Chevrolet", model: "Traverse", color: "White", category: "SUV", availability: "Contact to confirm rental or sale" },
  { year: "2024", make: "Ford", model: "Fusion", color: "Gray", category: "Sedan", availability: "Contact to confirm rental or sale" },
  { year: "2020", make: "Chevrolet", model: "Traverse", color: "Gray", category: "SUV", availability: "Contact to confirm rental or sale" },
  { year: "2019", make: "Chevrolet", model: "Malibu", color: "Black", category: "Sedan", availability: "Contact to confirm rental or sale" },
  { year: "2015", make: "Ford", model: "Taurus", color: "Gray", category: "Sedan", availability: "Contact to confirm rental or sale" },
  { year: "2020", make: "Chevrolet", model: "Equinox", color: "Gray", category: "SUV", availability: "Contact to confirm rental or sale" },
  { year: "2020", make: "Chevrolet", model: "Equinox", color: "Black", category: "SUV", availability: "Contact to confirm rental or sale" },
] as const;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activePath, setActivePath] = useState("Member");
  const selected = pathways.find((path) => path.title === activePath) ?? pathways[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main>
        <section className="overflow-hidden bg-[#f7f5f0] pt-28">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-20">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">DreamCarz ecosystem</p>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[0.94] tracking-[-0.05em] md:text-7xl">Drive your life<br />forward.</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600">One connected transportation relationship. Choose a vehicle experience, build eligible value through qualifying activity, and follow a clearer path toward what is next.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.97]">{isAuthenticated ? "Go to My Account" : "Create your account"}<ArrowRight size={15} /></Link>
                <Link href="/opportunity" className="inline-flex items-center gap-2 rounded-full border border-black px-6 py-3 text-sm font-semibold text-black transition-transform active:scale-[0.97]">Explore the ecosystem<ArrowRight size={15} /></Link>
              </div>
            </div>
            <div className="flex min-h-[340px] items-center justify-center overflow-hidden bg-[#ebe7de] lg:min-h-[510px]">
              <img src="/manus-storage/dreamcarz-tesla-model-3-hero_c8d4d37e.png" alt="White Tesla Model 3 in DreamCarz studio setting" className="h-full min-h-[340px] w-full object-cover lg:min-h-[510px]" />
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200 bg-white md:grid-cols-4">
              {["3 clear pathways", "4 member steps", "Eligible value", "1 connected ecosystem"].map((item) => <div key={item} className="px-4 py-5 text-center text-xs font-semibold tracking-wide text-gray-700">{item}</div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Choose your lane</p><h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">One brand. Three ways in.</h2></div><p className="max-w-md text-sm leading-relaxed text-gray-500">Each pathway starts with a clear purpose and is governed by the applicable program documents, eligibility rules, and agreements.</p></div>
          <div className="mt-12 grid grid-cols-1 border-t border-gray-200 md:grid-cols-3">
            {pathways.map((path) => { const Icon = path.icon; return <button type="button" key={path.title} onClick={() => setActivePath(path.title)} className={`border-b border-gray-200 px-0 py-8 text-left md:border-b-0 md:px-7 md:first:pl-0 ${activePath === path.title ? "text-black" : "text-gray-400"}`}><span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"><Icon size={17} /></span><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.17em] text-[#a8832d]">{path.label}</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">{path.title}</h3><p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">{path.description}</p></button>; })}
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center"><p className="text-sm text-gray-600">Selected pathway: <strong className="text-black">{selected.title}</strong></p><Link href={selected.href} className="inline-flex items-center gap-2 text-sm font-semibold text-black underline underline-offset-4">{selected.cta}<ArrowRight size={14} /></Link></div>
        </section>

        <section className="bg-[#f7f5f0] px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">For members</p><h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-[-0.04em] md:text-5xl">A transportation journey anyone can understand.</h2><div className="mt-12 grid grid-cols-1 border-t border-[#d8d1c4] md:grid-cols-4">{memberSteps.map(([number, title, description]) => <div key={number} className="border-b border-[#d8d1c4] py-7 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"><p className="font-display text-4xl text-[#a8832d]">{number}</p><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p></div>)}</div><div className="mt-8 flex flex-col gap-4 border-t border-[#d8d1c4] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="font-display text-xl">Join → Drive → Build → Use</p><Link href={isAuthenticated ? "/dashboard/rental-setup" : "/login"} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Start rental readiness<ArrowRight size={14} /></Link></div></div></section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Current inventory</p><h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl">Vehicles in the DreamCarz lineup.</h2></div><p className="max-w-md text-sm leading-relaxed text-gray-500">Explore the vehicles we currently have. Contact the DreamCarz team to confirm rental or purchase options, availability, and next steps.</p></div>
          <div className="mt-12 grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{currentInventory.map((vehicle) => <article key={`${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.color}`} className="group border-b border-gray-200 py-6 sm:px-5 sm:odd:border-r lg:border-b-0 lg:border-r lg:odd:border-r lg:first:pl-0 lg:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">{vehicle.category}</span><Car size={16} className="text-gray-300 transition-colors group-hover:text-black" /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{vehicle.year} · {vehicle.color}</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-black">{vehicle.make}<br />{vehicle.model}</h3><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">Availability</p><p className="mt-1 text-sm leading-relaxed text-gray-500">{vehicle.availability}</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Ask about this vehicle <ArrowRight size={14} /></Link></article>)}</div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center"><p className="text-sm leading-relaxed text-gray-500">Inventory changes. Vehicle availability and purchase terms are confirmed before reservation or sale.</p><Link href="/fleet" className="inline-flex items-center gap-2 text-sm font-semibold text-black underline underline-offset-4">Browse vehicle experiences <ArrowRight size={14} /></Link></div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">DreamCarz Value</p><h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.04em]">Make value easy to understand.</h2><p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-600">Members can review available eligible value in My Account and use it toward approved transportation charges and benefits, subject to availability, release, redemption, and program rules.</p><Link href={isAuthenticated ? "/dashboard/rewards" : "/calculator"} className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Learn about DreamCarz Value<ArrowRight size={14} /></Link></div><div className="grid grid-cols-1 divide-y divide-gray-200 border-y border-gray-200"><div className="py-5"><p className="font-semibold">Visible eligibility</p><p className="mt-2 text-sm text-gray-500">See the activity and rules that affect available value.</p></div><div className="py-5"><p className="font-semibold">Approved transportation uses</p><p className="mt-2 text-sm text-gray-500">Use value only where the program makes it available.</p></div><div className="py-5"><p className="font-semibold">Clear program rules</p><p className="mt-2 text-sm text-gray-500">Eligibility, release, redemption, and limitations remain explicit.</p></div></div></section>

        <section className="border-t border-gray-200 px-6 py-20 lg:px-10"><div className="mx-auto max-w-3xl text-center"><Route size={24} className="mx-auto text-[#a8832d]" /><h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.04em]">A clearer road forward.</h2><p className="mt-4 text-sm leading-relaxed text-gray-500">Create your DreamCarz account to begin the member journey, or explore the Associate and Fleet Partner pathways before you decide.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={isAuthenticated ? "/dashboard" : "/login"} className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">{isAuthenticated ? "Go to My Account" : "Get started"}</Link><Link href="/opportunity" className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-black">View all pathways</Link></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
