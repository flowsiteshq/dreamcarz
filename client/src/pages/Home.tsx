import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CircleDollarSign,
  Compass,
  Headphones,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const pathways = [
  {
    icon: Car,
    eyebrow: "Drive",
    title: "For Members",
    description: "Choose a membership experience, complete rental readiness, and manage transportation in one place.",
    href: "/membership",
    cta: "Explore memberships",
  },
  {
    icon: Users,
    eyebrow: "Build",
    title: "For Associates",
    description: "Share approved DreamCarz information and follow a qualification-based Associate path.",
    href: "/opportunity",
    cta: "Explore Associate Path",
  },
  {
    icon: Building2,
    eyebrow: "Participate",
    title: "For Fleet Partners",
    description: "Explore fleet participation under documented operating standards and written agreements.",
    href: "/opportunity",
    cta: "Explore Fleet Partners",
  },
] as const;

const journey = [
  { number: "01", title: "Join", description: "Create an account and choose the member path that fits your transportation needs.", icon: Users },
  { number: "02", title: "Choose", description: "Browse the confirmed inventory and open the vehicle experience you want to explore.", icon: Search },
  { number: "03", title: "Drive", description: "Request rental review, complete readiness, and manage the next step in My Account.", icon: Car },
  { number: "04", title: "Build", description: "Eligible activity may build DreamCarz Value, subject to applicable program rules.", icon: Star },
] as const;

const inventory = [
  { id: "2024-chevrolet-malibu-gray", year: "2024", make: "Chevrolet", model: "Malibu", color: "Gray", category: "Sedan", image: "/manus-storage/dreamcarz-studio-2024-chevrolet-malibu-gray_0bd4e28f.png" },
  { id: "2022-chevrolet-traverse-white", year: "2022", make: "Chevrolet", model: "Traverse", color: "White", category: "SUV", image: "/manus-storage/dreamcarz-studio-2022-chevrolet-traverse-white_d645f2d2.png" },
  { id: "2024-ford-fusion-gray", year: "2024", make: "Ford", model: "Fusion", color: "Gray", category: "Sedan", image: "/manus-storage/dreamcarz-studio-2024-ford-fusion-gray_2089712d.png" },
  { id: "2020-chevrolet-traverse-gray", year: "2020", make: "Chevrolet", model: "Traverse", color: "Gray", category: "SUV", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-traverse-gray_2787506d.png" },
  { id: "2019-chevrolet-malibu-black", year: "2019", make: "Chevrolet", model: "Malibu", color: "Black", category: "Sedan", image: "/manus-storage/dreamcarz-studio-2019-chevrolet-malibu-black_7c058f70.png" },
  { id: "2015-ford-taurus-gray", year: "2015", make: "Ford", model: "Taurus", color: "Gray", category: "Sedan", image: "/manus-storage/dreamcarz-studio-2015-ford-taurus-gray_529b5b07.png" },
  { id: "2020-chevrolet-equinox-gray", year: "2020", make: "Chevrolet", model: "Equinox", color: "Gray", category: "SUV", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-equinox-gray_be9e6d4f.png" },
  { id: "2020-chevrolet-equinox-black", year: "2020", make: "Chevrolet", model: "Equinox", color: "Black", category: "SUV", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-equinox-black_9ced45ba.png" },
] as const;

const promptSuggestions = ["Browse inventory", "How does membership work?", "Start rental readiness", "Explore the Associate Path"] as const;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState("");

  const handlePrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = prompt.trim().toLowerCase();
    if (!query) return;
    if (query.includes("vehicle") || query.includes("inventory") || query.includes("rent") || query.includes("buy")) navigate("/fleet");
    else if (query.includes("associate") || query.includes("partner")) navigate("/opportunity");
    else if (query.includes("member") || query.includes("membership")) navigate("/membership");
    else navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main>
        <section className="border-b border-[#ebe7df] bg-[#fbfaf7] pt-24 lg:pt-28">
          <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="flex min-h-[410px] flex-col justify-center px-6 py-14 lg:min-h-[500px] lg:px-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b08b35]">Freedom. Choice. Value.</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Drive your life<br />forward.</h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">DreamCarz brings confirmed inventory, member readiness, and clear next steps together in one automotive ecosystem. Explore rental or purchase options for the vehicles you see today.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/fleet" className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition-transform active:scale-[0.97]">Browse inventory <ArrowRight size={15} /></Link><Link href="/membership" className="inline-flex h-11 items-center gap-2 rounded-full border border-black px-5 text-sm font-semibold text-black">How DreamCarz works <CircleDollarSign size={15} /></Link></div>
            </div>
            <div className="flex min-h-[360px] items-center justify-center overflow-hidden bg-[#f2eee6] lg:min-h-[500px]"><img src="/manus-storage/dreamcarz-tesla-model-3-hero_c8d4d37e.png" alt="White Tesla Model 3 in a DreamCarz studio setting" className="h-full min-h-[360px] w-full object-cover lg:min-h-[500px]" /></div>
          </div>
          <div className="mx-auto max-w-7xl px-6 pb-9 pt-0 lg:px-10"><div className="grid overflow-hidden rounded-xl border border-[#eae5db] bg-white shadow-sm md:grid-cols-4"><div className="flex gap-3 border-b border-[#eae5db] p-4 md:border-b-0 md:border-r"><BadgeCheck className="mt-0.5 shrink-0 text-[#b08b35]" size={18} /><div><p className="text-xs font-bold">Confirmed inventory</p><p className="mt-1 text-xs text-gray-500">Current vehicles shown clearly.</p></div></div><div className="flex gap-3 border-b border-[#eae5db] p-4 md:border-b-0 md:border-r"><CircleDollarSign className="mt-0.5 shrink-0 text-[#b08b35]" size={18} /><div><p className="text-xs font-bold">Rent or Buy</p><p className="mt-1 text-xs text-gray-500">Choose a vehicle request path.</p></div></div><div className="flex gap-3 border-b border-[#eae5db] p-4 md:border-b-0 md:border-r"><ShieldCheck className="mt-0.5 shrink-0 text-[#b08b35]" size={18} /><div><p className="text-xs font-bold">Clear next steps</p><p className="mt-1 text-xs text-gray-500">Readiness, review, and support.</p></div></div><div className="flex gap-3 p-4"><Sparkles className="mt-0.5 shrink-0 text-[#b08b35]" size={18} /><div><p className="text-xs font-bold">DreamCarz Value</p><p className="mt-1 text-xs text-gray-500">Subject to program rules.</p></div></div></div></div>
        </section>

        <section className="border-b border-gray-200 bg-white px-6 py-5 lg:px-10"><div className="mx-auto max-w-7xl"><form onSubmit={handlePrompt} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-[#fbfaf7] p-3 sm:flex-row sm:items-center"><Search size={18} className="ml-2 text-[#b08b35]" /><input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-gray-400" placeholder="Ask DreamCarz anything — vehicles, membership, rentals, or your next step" /><button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white">Find my path <ArrowRight size={15} /></button></form><div className="mt-3 flex flex-wrap gap-2">{promptSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-black hover:text-black">{suggestion}</button>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10"><div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b08b35]">One brand. Three ways in.</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Choose the path that moves you.</h2></div><p className="max-w-lg text-sm leading-relaxed text-gray-500">DreamCarz is more than cars. It is a connected ecosystem designed to help you drive, build, and move toward what is next.</p></div><div className="mt-10 grid gap-7 md:grid-cols-3">{pathways.map((path) => { const Icon = path.icon; return <article key={path.title} className="border-t border-gray-200 pt-6"><span className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><Icon size={17} /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#b08b35]">{path.eyebrow}</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">{path.title}</h3><p className="mt-3 text-sm leading-relaxed text-gray-500">{path.description}</p><Link href={path.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{path.cta} <ArrowRight size={14} /></Link></article>; })}</div></section>

        <section className="border-y border-[#ece8e1] bg-[#fbfaf7] px-6 py-16 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b08b35]">The DreamCarz journey</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] sm:text-5xl">A transportation journey.</h2><p className="mt-3 text-sm text-gray-500">Simple steps. Real value. A better way to move forward.</p><div className="mt-9 grid gap-3 md:grid-cols-4">{journey.map((step) => { const Icon = step.icon; return <article key={step.number} className="border border-[#e4ded3] bg-white p-5"><div className="flex items-start justify-between"><Icon size={20} className="text-[#b08b35]" /><ArrowRight size={16} className="text-gray-300" /></div><p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b08b35]">{step.number}</p><h3 className="mt-2 text-lg font-bold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p></article>; })}</div></div></section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b08b35]">Confirmed inventory</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Vehicles in the DreamCarz lineup.</h2></div><p className="max-w-sm text-sm leading-relaxed text-gray-500">Real vehicles. Confirmed availability. Rent or buy with confidence.</p></div><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{inventory.map((vehicle) => <Link key={vehicle.id} href={`/vehicle?id=${vehicle.id}`} className="group border border-gray-200 bg-white p-3 transition-colors hover:border-black"><div className="relative flex h-28 items-center justify-center bg-[#fbfaf7]"><span className="absolute left-2 top-2 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500">Available</span><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full w-full object-contain" /></div><p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-[#b08b35]">{vehicle.category}</p><h3 className="mt-1 font-display text-lg font-bold tracking-[-0.04em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h3><div className="mt-3 flex items-center justify-between text-xs font-semibold"><span>Rent or buy</span><ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></div></Link>)}</div><div className="mt-8 text-center"><Link href="/fleet" className="inline-flex h-11 items-center gap-2 rounded-full border border-black px-6 text-sm font-semibold text-black">View all inventory <ArrowRight size={15} /></Link></div></section>

        <section className="border-t border-gray-200 px-6 py-16 lg:px-10"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center"><div><Headphones className="text-[#b08b35]" size={28} /><h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em]">We are here to help.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">Our team can help you find the right vehicle and answer questions about membership, rental readiness, and the next step.</p><Link href="/contact" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white">Contact DreamCarz <ArrowRight size={15} /></Link></div><div className="divide-y divide-gray-200 border-y border-gray-200"><div className="flex items-center gap-4 py-5"><CircleDollarSign className="text-[#b08b35]" size={19} /><div className="flex-1"><p className="text-sm font-semibold">Rent or Buy — Your Choice</p><p className="mt-1 text-sm text-gray-500">Open a vehicle to choose a request path.</p></div><ArrowRight size={16} /></div><div className="flex items-center gap-4 py-5"><ShieldCheck className="text-[#b08b35]" size={19} /><div className="flex-1"><p className="text-sm font-semibold">Protection & Support</p><p className="mt-1 text-sm text-gray-500">Clear next steps and documented review.</p></div><ArrowRight size={16} /></div><div className="flex items-center gap-4 py-5"><MapPin className="text-[#b08b35]" size={19} /><div className="flex-1"><p className="text-sm font-semibold">Locations & Partners</p><p className="mt-1 text-sm text-gray-500">Find DreamCarz locations and reference services.</p></div><ArrowRight size={16} /></div><div className="flex items-center gap-4 py-5"><Compass className="text-[#b08b35]" size={19} /><div className="flex-1"><p className="text-sm font-semibold">Transparent & Simple</p><p className="mt-1 text-sm text-gray-500">No assumed availability, pricing, or approval.</p></div><ArrowRight size={16} /></div></div></div></section>

        <section className="border-t border-[#ebe7df] bg-[#fbfaf7] px-6 py-16 text-center lg:px-10"><Sparkles className="mx-auto text-[#b08b35]" size={26} /><h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em]">A better road forward.</h2><p className="mt-3 text-sm text-gray-500">Drive today. Build value. Unlock tomorrow.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/fleet" className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white">Browse inventory <ArrowRight size={15} /></Link><Link href={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex h-11 items-center gap-2 rounded-full border border-black px-6 text-sm font-semibold text-black">{isAuthenticated ? "Go to My Account" : "Create your account"} <ArrowRight size={15} /></Link></div></section>
      </main>
      <Footer />
    </div>
  );
}
