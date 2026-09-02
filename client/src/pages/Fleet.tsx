import { ArrowRight, BookmarkPlus, Filter } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { VehicleExperienceDialog, type InventoryVehicle } from "@/components/VehicleExperienceDialog";
import { useState } from "react";

const confirmedInventory = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", access: "mid-range", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", access: "elite", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", access: "mid-range", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", access: "mid-range", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mFFrLJBzyJWqricP.png" },
  { id: "2019-chevrolet-malibu-black", year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan", access: "entry", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/njSpzrWxcQZbiWBb.png" },
  { id: "2015-ford-taurus-gray", year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan", access: "entry", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BDcxxQLQxENUVvqj.png" },
  { id: "2020-chevrolet-equinox-gray", year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV", access: "entry", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QuCANehFYgQjJKfm.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", access: "entry", availability: "confirmed" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png" },
] as const;

const comingSoonVehicles = [
  { id: "coming-soon-2021-nissan-altima", year: 2021, make: "Nissan", model: "Altima", color: "Gray", type: "Sedan", access: "entry", availability: "coming-soon" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/jkbMhiqTKTteBRER.png" },
  { id: "coming-soon-2022-toyota-camry-xse", year: 2022, make: "Toyota", model: "Camry XSE", color: "Silver", type: "Sedan", access: "mid-range", availability: "coming-soon" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/PIRNNIziJCMKrKtY.png" },
  { id: "coming-soon-2024-tesla-model-3", year: 2024, make: "Tesla", model: "Model 3", color: "Pearl White", type: "Sedan", access: "elite", availability: "coming-soon" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/hvYNoOTakaOZmMrt.png" },
  { id: "coming-soon-2023-mercedes-e-class", year: 2023, make: "Mercedes-Benz", model: "E-Class", color: "Black", type: "Sedan", access: "elite", availability: "coming-soon" as const, image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/PLJYKMoLegFKavHq.png" },
] as const;

const filters = ["All", "Sedan", "SUV"] as const;
type FilterType = (typeof filters)[number];
const accessFilters = ["all", "entry", "mid-range", "elite"] as const;
type AccessFilter = (typeof accessFilters)[number];
type FleetVehicle = InventoryVehicle & { access: Exclude<AccessFilter, "all">; availability: "confirmed" | "coming-soon" };

const planPricing = {
  freedom: { name: "Freedom", focus: "Rentals + DCP" }, plus: { name: "Plus", focus: "Subscribe & Save exploration" }, pro: { name: "Pro", focus: "Broader vehicle path" }, elite: { name: "Elite", focus: "Lease-to-own exploration" }, silver: { name: "Silver", focus: "Silver and below guidance" }, gold: { name: "Gold", focus: "Host + fleet guidance" }, black: { name: "Black", focus: "Application-led exploration" },
} as const;

function accessLabel(access: AccessFilter) { return access === "all" ? "All vehicle access" : access === "mid-range" ? "Mid-Range access" : `${access[0].toUpperCase()}${access.slice(1)} access`; }

function VehicleCard({ vehicle, onSelect }: { vehicle: FleetVehicle; onSelect: (vehicle: FleetVehicle, view: "overview" | "rental" | "purchase" | "reserve") => void }) {
  const comingSoon = vehicle.availability === "coming-soon";
  return <article className="group border-b border-gray-200 py-7 sm:px-6 sm:odd:border-l lg:border-b-0 lg:border-l lg:first:border-l-0">
    <button type="button" onClick={() => onSelect(vehicle, "overview")} className="block w-full text-left focus:outline-none">
      <div className="flex h-36 items-center justify-center overflow-hidden bg-transparent"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /></div>
      <p className={`mt-6 text-[11px] font-bold uppercase tracking-[0.15em] ${comingSoon ? "text-[#a8832d]" : "text-gray-500"}`}>{comingSoon ? "Coming Soon" : "Confirmed inventory"} · {vehicle.type}</p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] underline-offset-4 group-hover:underline">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h2>
      <p className="mt-3 text-sm text-gray-500">Exterior: {vehicle.color}</p>
      <p className="mt-2 text-xs font-semibold text-gray-700">{comingSoon ? "View reserve option" : "View full vehicle"}</p>
    </button>
    <div className="mt-5 border-t border-gray-200 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gray-400">{comingSoon ? "Future access" : "Choose your path"}</p>
      {comingSoon ? <button type="button" onClick={() => onSelect(vehicle, "reserve")} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Reserve your vehicle <BookmarkPlus size={14} /></button> : <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => onSelect(vehicle, "rental")} className="text-sm font-semibold underline underline-offset-4">Rent this vehicle</button><button type="button" onClick={() => onSelect(vehicle, "purchase")} className="text-sm font-semibold underline underline-offset-4">Buy this vehicle</button></div>}
    </div>
  </article>;
}

export default function Fleet() {
  const [filter, setFilter] = useState<FilterType>("All");
  const requestedAccess = new URLSearchParams(window.location.search).get("access");
  const requestedPlan = new URLSearchParams(window.location.search).get("plan");
  const selectedMembershipPlan = requestedPlan && requestedPlan in planPricing ? planPricing[requestedPlan as keyof typeof planPricing] : undefined;
  const [accessFilter, setAccessFilter] = useState<AccessFilter>(accessFilters.includes(requestedAccess as AccessFilter) ? requestedAccess as AccessFilter : "all");
  const [selectedVehicle, setSelectedVehicle] = useState<{ vehicle: FleetVehicle; view: "overview" | "rental" | "purchase" | "reserve" } | null>(null);
  const matches = (vehicle: FleetVehicle) => (filter === "All" || vehicle.type === filter) && (accessFilter === "all" || vehicle.access === accessFilter);
  const currentVehicles = (confirmedInventory as readonly FleetVehicle[]).filter(matches);
  const reserveVehicles = (comingSoonVehicles as readonly FleetVehicle[]).filter(matches);

  return <div className="min-h-screen bg-white text-black"><Navigation /><main>
    <section className="bg-[#f7f5f0] px-6 pb-16 pt-32 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Vehicle access</p><div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end"><div><h1 className="font-display text-5xl font-bold tracking-[-0.055em] md:text-7xl">Choose what is ready now.<br />Reserve what is next.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">Confirmed inventory is available to request today. Vehicles labeled <strong className="text-black">Coming Soon</strong> are not current DreamCarz inventory; reserve your interest and we will guide you when an appropriate path is available.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">Clear inventory status.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Rental, purchase, reserve, availability, and final terms are reviewed per vehicle. A Coming Soon listing is never presented as an available vehicle.</p></div></div></div></section>
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">{selectedMembershipPlan && <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#dbc99a] bg-[#fcfaf2] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Your selected membership</p><p className="mt-1 text-sm text-gray-700"><strong className="text-black">{selectedMembershipPlan.name}</strong> · {selectedMembershipPlan.focus}. <span className="text-gray-500">Membership and vehicle-specific terms are reviewed separately when you choose Rent, Buy, or Reserve.</span></p></div><Link href="/pricing" className="shrink-0 text-sm font-semibold underline underline-offset-4">Change plan</Link></div>}
      <div className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="text-sm text-gray-500">{currentVehicles.length} current vehicle{currentVehicles.length === 1 ? "" : "s"}{accessFilter !== "all" ? ` in the ${accessLabel(accessFilter)}` : ""} · {reserveVehicles.length} Coming Soon reserve option{reserveVehicles.length === 1 ? "" : "s"}</p><div className="flex items-center gap-2"><Filter size={15} className="text-gray-400" />{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === item ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-black hover:text-black"}`}>{item}</button>)}</div></div><div className="flex flex-wrap gap-2">{accessFilters.map((access) => <button type="button" key={access} onClick={() => setAccessFilter(access)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${accessFilter === access ? "bg-[#a8832d] text-white" : "border border-gray-200 text-gray-600"}`}>{accessLabel(access)}</button>)}</div></div>
      <div className="pt-10"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Available to request now</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">Confirmed DreamCarz inventory</h2><div className="mt-6 grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{currentVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={(selected, view) => setSelectedVehicle({ vehicle: selected, view })} />)}</div></div>
      {reserveVehicles.length > 0 && <div className="mt-16 border-t border-gray-200 pt-10"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Expand your path</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">Coming Soon · reserve your vehicle</h2></div><p className="max-w-xl text-sm leading-6 text-gray-500">Representative options for this vehicle-access level. These are not part of current DreamCarz inventory.</p></div><div className="mt-6 grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{reserveVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={(selected, view) => setSelectedVehicle({ vehicle: selected, view })} />)}</div></div>}
      <div className="mt-10 border-t border-gray-200 pt-6 text-center"><p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-500">Do not see the vehicle you need? The displayed current inventory is complete as provided, while Coming Soon options can be reserved for future review.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Contact DreamCarz <ArrowRight size={14} /></Link></div>
    </section>
  </main><Footer />{selectedVehicle && <VehicleExperienceDialog vehicle={selectedVehicle.vehicle} membershipPlan={selectedMembershipPlan} open initialView={selectedVehicle.view} onOpenChange={(open) => !open && setSelectedVehicle(null)} />}</div>;
}
