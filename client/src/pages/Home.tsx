import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { ArrowRight, CalendarDays, CarFront, Check, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export const marketplaceInventory = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mFFrLJBzyJWqricP.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png" },
  { id: "2017-ford-fusion-silver", year: 2017, make: "Ford", model: "Fusion", color: "Silver", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/MJscoVpsHBOwqjYM.png" },
] as const;

type SearchMode = "rent" | "buy" | "rent-to-own";

type SearchPanelProps = { location: string; setLocation: (value: string) => void };

function SearchPanel({ location, setLocation }: SearchPanelProps) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<SearchMode>("rent");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({ mode, location });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    navigate(`/fleet?${params.toString()}`);
  };

  return <form id="vehicle-search" onSubmit={submit} className="relative z-20 mx-auto -mt-16 w-[calc(100%-2rem)] max-w-7xl rounded-[1.35rem] bg-white p-4 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:-mt-20 sm:w-[calc(100%-5rem)] sm:p-6 lg:w-[calc(100%-6rem)]">
    <div className="flex gap-1 border-b border-[#e7e1d7] px-1 sm:gap-3 sm:px-2">
      {(["rent", "buy", "rent-to-own"] as SearchMode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`-mb-px border-b-[3px] px-3 py-4 text-sm font-extrabold capitalize transition-colors sm:px-6 sm:text-base ${mode === item ? "border-[#c9a64e] text-[#161513]" : "border-transparent text-[#77736b] hover:text-black"}`}>{item.replaceAll("-", " ")}</button>)}
    </div>
    <div className="grid gap-3 pt-5 md:grid-cols-[1.05fr_1fr_1fr_auto] md:items-end">
      <label className="block rounded-xl border border-[#cfc6b9] px-4 py-3.5"><span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#625d55]"><MapPin size={16} className="text-[#a77d25]" /> Pickup location</span><select aria-label="Pickup location" value={location} onChange={(event) => setLocation(event.target.value)} className={`mt-2 w-full bg-transparent text-base font-bold outline-none ${location ? "text-[#171614]" : "text-[#817a70]"}`}><option value="">Select pickup location</option><option value="Houston, TX">Houston, TX</option></select></label>
      <label className="block rounded-xl border border-[#cfc6b9] px-4 py-3.5"><span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#625d55]"><CalendarDays size={16} className="text-[#a77d25]" /> {mode === "buy" ? "When are you looking?" : "Pickup date"}</span><input aria-label={mode === "buy" ? "When are you looking" : "Pickup date"} type={mode === "buy" ? "text" : "date"} value={start} onChange={(event) => setStart(event.target.value)} placeholder={mode === "buy" ? "As soon as possible" : "Select date"} className="mt-2 w-full bg-transparent text-base font-bold outline-none placeholder:text-[#817a70]" /></label>
      <label className="block rounded-xl border border-[#cfc6b9] px-4 py-3.5"><span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#625d55]"><CalendarDays size={16} className="text-[#a77d25]" /> {mode === "buy" ? "Vehicle type" : "Return date"}</span>{mode === "buy" ? <select aria-label="Vehicle type" value={end} onChange={(event) => setEnd(event.target.value)} className="mt-2 w-full bg-transparent text-base font-bold outline-none"><option value="">Any vehicle</option><option>SUV</option><option>Sedan</option></select> : <input aria-label="Return date" type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="mt-2 w-full bg-transparent text-base font-bold outline-none" />}</label>
      <button type="submit" className="h-[66px] rounded-xl bg-[#d7ad52] px-8 text-base font-extrabold text-[#171512] transition hover:bg-[#e6c36d] active:scale-[0.98]">Search</button>
    </div>
  </form>;
}

export default function Home() {
  const [pickupLocation, setPickupLocation] = useState("");
  return <div className="min-h-screen bg-[#f8f4ed] text-[#171614]"><Navigation /><main>
    <section className="relative min-h-[610px] overflow-hidden bg-[#101419] text-white sm:min-h-[735px] lg:min-h-[760px]">
      <img src="/chevrolet-traverse-dusk-garage.jpg" alt="Dark SUV with headlights on in a city parking structure at dusk" className="absolute inset-0 h-full w-full object-cover object-[76%_center] sm:object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,14,0.92)_0%,rgba(7,10,14,0.73)_34%,rgba(7,10,14,0.12)_72%,rgba(7,10,14,0.06)_100%)]" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_45%,rgba(0,0,0,0.42))]" />
      <div className="relative mx-auto flex min-h-[610px] max-w-7xl items-start px-6 pb-20 pt-36 sm:min-h-[735px] sm:items-center sm:px-10 sm:pt-28 lg:min-h-[760px] lg:px-12"><div className="max-w-[600px]"><p className="text-xs font-extrabold uppercase tracking-[0.34em] text-[#e0bb65]">Drive with confidence</p><h1 className="mt-6 font-display text-5xl font-bold leading-[0.9] tracking-[-0.065em] sm:text-8xl">Find your<br />next car.</h1><p className="mt-7 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">Browse available vehicles to rent, buy, or rent to own.</p><div className="mt-8 flex flex-wrap items-center gap-5"><a href="#vehicle-search" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#d7ad52] px-6 text-sm font-extrabold text-[#171512] transition hover:bg-[#e6c36d]">Browse vehicles <ArrowRight size={16} /></a><Link href="/how-it-works" className="text-sm font-bold text-white underline underline-offset-4">How it works</Link></div></div></div>
    </section>
    <SearchPanel location={pickupLocation} setLocation={setPickupLocation} />
    <section className="mx-auto w-[calc(100%-2rem)] max-w-7xl px-0 py-20 sm:w-[calc(100%-5rem)] sm:py-24 lg:w-[calc(100%-6rem)]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#aa8129]">Available now</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] sm:text-6xl">Available vehicles</h2></div><Link href="/fleet" className="inline-flex items-center gap-2 text-sm font-extrabold underline underline-offset-4">View all vehicles <ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-5 md:grid-cols-3">{marketplaceInventory.slice(0, 3).map((vehicle) => <Link key={vehicle.id} href={`/vehicle?id=${vehicle.id}`} className="group overflow-hidden rounded-xl border border-[#ded6ca] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(45,33,18,0.12)]"><div className="aspect-[4/3] overflow-hidden bg-[#f0ece5]"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#aa8129]">{vehicle.type}</p><span className={`text-xs font-bold ${pickupLocation ? "text-[#77736b]" : "text-[#9b6f1f]"}`}>{pickupLocation || "Select pickup location"}</span></div><h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.04em]">{vehicle.year} {vehicle.make} {vehicle.model}</h3><p className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold underline underline-offset-4">View vehicle <ArrowRight size={15} /></p></div></Link>)}</div></section>
    <section className="border-y border-[#e3dbcf] bg-white px-6 py-20 sm:px-10 lg:px-12"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#aa8129]">Simple from the start</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">How it works</h2></div><div className="mt-12 grid gap-8 md:grid-cols-3">{[["01", "Choose a vehicle", "Browse the vehicles available in your area and select the path that fits."], ["02", "Review your terms", "See the vehicle details, request context, and any costs that apply before moving forward."], ["03", "Request pickup", "Send your request. We will confirm availability and guide you through what happens next."]].map(([number, title, copy]) => <div key={number} className="border-t-2 border-[#d7ad52] pt-5"><p className="text-xs font-extrabold tracking-[0.2em] text-[#aa8129]">{number}</p><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6d675f]">{copy}</p></div>)}</div></div></section>
    <section className="bg-[#151515] px-6 py-16 text-white sm:px-10 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d5ae58]">More than a vehicle</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] sm:text-5xl">Membership, made clear.</h2><p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">Membership benefits and vehicle costs stay separate, so you know exactly what you are reviewing at each step.</p></div><Link href="/membership" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#d7ad52] px-6 py-3 text-sm font-extrabold text-[#171512]">Explore membership <ArrowRight size={16} /></Link></div><div className="mx-auto mt-12 grid max-w-7xl gap-4 border-t border-white/15 pt-8 sm:grid-cols-3"><div className="flex gap-3"><Check className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Clear program guidance</p></div><div className="flex gap-3"><ShieldCheck className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Reviewed vehicle terms</p></div><div className="flex gap-3"><Sparkles className="shrink-0 text-[#d7ad52]" size={18} /><p className="text-sm text-white/75">Ask DreamCarz anytime</p></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-14 text-center sm:px-10"><CarFront className="mx-auto text-[#b18732]" size={22} /><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.05em]">Need help choosing?</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6d675f]">Ask a question in plain English and DreamCarz Concierge will help you narrow it down.</p><Link href="/concierge" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold underline underline-offset-4">Ask DreamCarz <ArrowRight size={15} /></Link></section>
  </main><Footer /></div>;
}
