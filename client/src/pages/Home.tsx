import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { ArrowRight, CalendarDays, CarFront, Check, ChevronDown, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export const marketplaceInventory = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mFFrLJBzyJWqricP.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png" },
  { id: "2017-ford-fusion-silver", year: 2017, make: "Ford", model: "Fusion", color: "Silver", type: "Sedan", pickup: "Houston, TX", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/MJscoVpsHBOwqjYM.png" },
] as const;

type SearchMode = "rent" | "buy" | "rent-to-own";

function SearchPanel() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<SearchMode>("rent");
  const [location, setLocation] = useState("Houston, TX");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ mode, location });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    navigate(`/fleet?${params.toString()}`);
  };

  return <form id="vehicle-search" onSubmit={submit} className="relative z-20 mx-auto -mt-14 max-w-6xl rounded-[1.35rem] bg-white p-3 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:p-5">
    <div className="flex border-b border-[#e7e1d7] px-1 sm:px-2">
      {(["rent", "buy", "rent-to-own"] as SearchMode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors sm:px-7 ${mode === item ? "border-[#c9a64e] text-[#161513]" : "border-transparent text-[#77736b] hover:text-black"}`}>{item.replaceAll("-", " ")}</button>)}
    </div>
    <div className="grid gap-3 pt-4 md:grid-cols-[1.05fr_1fr_1fr_auto] md:items-end">
      <label className="block rounded-xl border border-[#ddd5ca] px-4 py-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#817a70]"><MapPin size={14} /> Pickup location</span><select value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 w-full bg-transparent text-sm font-semibold outline-none"><option>Houston, TX</option><option>Flexible pickup</option></select></label>
      <label className="block rounded-xl border border-[#ddd5ca] px-4 py-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#817a70]"><CalendarDays size={14} /> {mode === "buy" ? "When are you looking?" : "Pickup date"}</span><input type={mode === "buy" ? "text" : "date"} value={start} onChange={(event) => setStart(event.target.value)} placeholder={mode === "buy" ? "As soon as possible" : "Select date"} className="mt-2 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#817a70]" /></label>
      <label className="block rounded-xl border border-[#ddd5ca] px-4 py-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#817a70]"><CalendarDays size={14} /> {mode === "buy" ? "Vehicle type" : "Return date"}</span>{mode === "buy" ? <select value={end} onChange={(event) => setEnd(event.target.value)} className="mt-2 w-full bg-transparent text-sm font-semibold outline-none"><option value="">Any vehicle</option><option>SUV</option><option>Sedan</option></select> : <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="mt-2 w-full bg-transparent text-sm font-semibold outline-none" />}</label>
      <button type="submit" className="h-[62px] rounded-xl bg-[#d7ad52] px-8 text-sm font-bold text-[#171512] transition hover:bg-[#e6c36d] active:scale-[0.98]">Search</button>
    </div>
  </form>;
}

export default function Home() {
  return <div className="min-h-screen bg-[#f8f4ed] text-[#171614]"><Navigation /><main>
    <section className="relative min-h-[670px] overflow-hidden bg-[#151515] text-white sm:min-h-[720px]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#111111_0%,rgba(17,17,17,0.96)_35%,rgba(17,17,17,0.25)_70%,rgba(17,17,17,0.05)_100%)]" />
      <img src={marketplaceInventory[1].image} alt="Chevrolet Traverse available from DreamCarz" className="absolute right-[-18%] top-0 h-full w-[88%] object-cover object-center opacity-80 sm:right-[-8%] sm:w-[72%] lg:right-0 lg:w-[67%]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),transparent_40%,rgba(0,0,0,0.55))]" />
      <div className="relative mx-auto flex min-h-[670px] max-w-7xl items-center px-6 pb-28 pt-28 sm:min-h-[720px] sm:px-10 lg:px-12">
        <div className="max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#d5ae58]">Drive with confidence</p><h1 className="mt-6 font-display text-6xl font-bold leading-[0.9] tracking-[-0.065em] sm:text-8xl">Find your<br />next car.</h1><p className="mt-7 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">Browse available vehicles to rent, buy, or rent to own.</p><div className="mt-8 flex flex-wrap items-center gap-5"><a href="#vehicle-search" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#d7ad52] px-6 text-sm font-bold text-[#171512] transition hover:bg-[#e6c36d]">Browse vehicles <ArrowRight size={16} /></a><Link href="/how-it-works" className="text-sm font-semibold text-white underline underline-offset-4">How it works</Link></div></div>
      </div>
    </section>
    <SearchPanel />
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12 lg:py-24"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#aa8129]">Available now</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] sm:text-6xl">Available vehicles</h2></div><Link href="/fleet" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">View all vehicles <ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-5 md:grid-cols-3">{marketplaceInventory.slice(0, 3).map((vehicle) => <Link key={vehicle.id} href={`/vehicle?id=${vehicle.id}`} className="group overflow-hidden rounded-xl border border-[#ded6ca] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(45,33,18,0.12)]"><div className="flex h-60 items-center justify-center overflow-hidden bg-[#f0ece5]"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#aa8129]">{vehicle.type}</p><span className="text-xs text-[#77736b]">{vehicle.pickup}</span></div><h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.04em]">{vehicle.year} {vehicle.make} {vehicle.model}</h3><p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">View vehicle <ArrowRight size={15} /></p></div></Link>)}</div></section>
    <section className="border-y border-[#e3dbcf] bg-white px-6 py-20 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#aa8129]">Simple from the start</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">How it works</h2></div><div className="mt-12 grid gap-8 md:grid-cols-3">{[["01", "Choose a vehicle", "Browse the vehicles available in your area and select the path that fits."], ["02", "Review your terms", "See the vehicle details, request context, and any costs that apply before moving forward."], ["03", "Request pickup", "Send your request. We will confirm availability and guide you through what happens next."]].map(([number, title, copy]) => <div key={number} className="border-t-2 border-[#d7ad52] pt-5"><p className="text-xs font-bold tracking-[0.2em] text-[#aa8129]">{number}</p><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6d675f]">{copy}</p></div>)}</div></div></section>
    <section className="bg-[#151515] px-6 py-16 text-white sm:px-10 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#d5ae58]">More than a vehicle</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] sm:text-5xl">Membership, made clear.</h2><p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">Membership benefits and vehicle costs stay separate, so you know exactly what you are reviewing at each step.</p></div><Link href="/membership" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#d7ad52] px-6 py-3 text-sm font-bold text-[#171512]">Explore membership <ArrowRight size={16} /></Link></div><div className="mx-auto mt-12 grid max-w-7xl gap-4 border-t border-white/15 pt-8 sm:grid-cols-3"><div className="flex gap-3"><Check className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Clear program guidance</p></div><div className="flex gap-3"><ShieldCheck className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Reviewed vehicle terms</p></div><div className="flex gap-3"><Sparkles className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Ask DreamCarz anytime</p></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-14 text-center sm:px-10"><CarFront className="mx-auto text-[#b18732]" size={22} /><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.05em]">Need help choosing?</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d675f]">Ask a question in plain English and DreamCarz Concierge will help you narrow it down.</p><Link href="/concierge" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Ask DreamCarz <ArrowRight size={15} /></Link></section>
  </main><Footer /></div>;
}
