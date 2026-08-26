import { ArrowRight, Filter } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { VehicleExperienceDialog } from "@/components/VehicleExperienceDialog";
import { useState } from "react";

const confirmedInventory = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", access: "mid-range", image: "/manus-storage/dreamcarz-studio-2024-chevrolet-malibu-gray_0bd4e28f.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", access: "elite", image: "/manus-storage/dreamcarz-studio-2022-chevrolet-traverse-white_d645f2d2.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", access: "mid-range", image: "/manus-storage/dreamcarz-studio-2024-ford-fusion-gray_2089712d.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", access: "mid-range", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-traverse-gray_2787506d.png" },
  { id: "2019-chevrolet-malibu-black", year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan", access: "entry", image: "/manus-storage/dreamcarz-studio-2019-chevrolet-malibu-black_7c058f70.png" },
  { id: "2015-ford-taurus-gray", year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan", access: "entry", image: "/manus-storage/dreamcarz-studio-2015-ford-taurus-gray_529b5b07.png" },
  { id: "2020-chevrolet-equinox-gray", year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV", access: "entry", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-equinox-gray_be9e6d4f.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", access: "entry", image: "/manus-storage/dreamcarz-studio-2020-chevrolet-equinox-black_9ced45ba.png" },
] as const;

const filters = ["All", "Sedan", "SUV"] as const;
type FilterType = (typeof filters)[number];
const accessFilters = ["all", "entry", "mid-range", "elite"] as const;
type AccessFilter = (typeof accessFilters)[number];

export default function Fleet() {
  const [filter, setFilter] = useState<FilterType>("All");
  const requestedAccess = new URLSearchParams(window.location.search).get("access");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>(accessFilters.includes(requestedAccess as AccessFilter) ? requestedAccess as AccessFilter : "all");
  const [selectedVehicle, setSelectedVehicle] = useState<{ vehicle: (typeof confirmedInventory)[number]; view: "overview" | "rental" | "purchase" } | null>(null);
  const inventory = confirmedInventory.filter((vehicle) => (filter === "All" || vehicle.type === filter) && (accessFilter === "all" || vehicle.access === accessFilter));

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main>
        <section className="bg-[#f7f5f0] px-6 pb-16 pt-32 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Confirmed inventory</p><div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end"><div><h1 className="font-display text-5xl font-bold tracking-[-0.055em] md:text-7xl">The vehicles we have today.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">This is the complete current DreamCarz inventory. Contact our team to confirm whether a vehicle is available for rental, sale, or neither at the time of your request.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">No unlisted vehicles.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Vehicle availability, rental terms, purchase terms, and any vehicle-specific details are confirmed directly by DreamCarz before a reservation or sale.</p></div></div></div></section>
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10"><div className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="text-sm text-gray-500">{inventory.length} of {confirmedInventory.length} confirmed vehicles{accessFilter !== "all" ? ` in the ${accessFilter === "mid-range" ? "Mid-Range" : accessFilter[0].toUpperCase() + accessFilter.slice(1)} access view` : ""}</p><div className="flex items-center gap-2"><Filter size={15} className="text-gray-400" />{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === item ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-black hover:text-black"}`}>{item}</button>)}</div></div><div className="flex flex-wrap gap-2">{accessFilters.map((access) => <button type="button" key={access} onClick={() => setAccessFilter(access)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${accessFilter === access ? "bg-[#a8832d] text-white" : "border border-gray-200 text-gray-600"}`}>{access === "all" ? "All vehicle access" : access === "mid-range" ? "Mid-Range" : `${access[0].toUpperCase()}${access.slice(1)} access`}</button>)}</div></div>
          <div className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{inventory.map((vehicle) => <article key={vehicle.id} className="group border-b border-gray-200 py-7 sm:px-6 sm:odd:border-l lg:border-b-0 lg:border-l lg:first:border-l-0"><button type="button" onClick={() => setSelectedVehicle({ vehicle, view: "overview" })} className="block w-full text-left focus:outline-none"><div className="flex h-36 items-center justify-center overflow-hidden bg-transparent"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /></div><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">{vehicle.type}</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] underline-offset-4 group-hover:underline">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h2><p className="mt-3 text-sm text-gray-500">Exterior: {vehicle.color}</p><p className="mt-2 text-xs font-semibold text-gray-700">View full vehicle</p></button><div className="mt-5 border-t border-gray-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gray-400">Choose your path</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setSelectedVehicle({ vehicle, view: "rental" })} className="text-sm font-semibold underline underline-offset-4">Rent this vehicle</button><button type="button" onClick={() => setSelectedVehicle({ vehicle, view: "purchase" })} className="text-sm font-semibold underline underline-offset-4">Buy this vehicle</button></div></div></article>)}</div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center"><p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-500">Do not see the vehicle you need? The displayed inventory is current as provided. Contact DreamCarz to discuss your transportation needs.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Contact DreamCarz <ArrowRight size={14} /></Link></div>
        </section>
      </main>
      <Footer />
      {selectedVehicle && <VehicleExperienceDialog vehicle={selectedVehicle.vehicle} open={Boolean(selectedVehicle)} initialView={selectedVehicle.view} onOpenChange={(open) => !open && setSelectedVehicle(null)} />}
    </div>
  );
}
