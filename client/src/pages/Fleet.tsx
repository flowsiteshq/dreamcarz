import { ArrowRight, Filter } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useState } from "react";

const confirmedInventory = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2024-chevrolet-malibu-gray_0b23eaa8.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", image: "/manus-storage/dreamcarz-2022-chevrolet-traverse-white-v2_2dfa6ba3.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2024-ford-fusion-gray-v2_b64c8909.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-traverse-gray-v2_a575affb.png" },
  { id: "2019-chevrolet-malibu-black", year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan", image: "/manus-storage/dreamcarz-2019-chevrolet-malibu-black-v2_343ebb32.png" },
  { id: "2015-ford-taurus-gray", year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2015-ford-taurus-gray-v2_b8c61858.png" },
  { id: "2020-chevrolet-equinox-gray", year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-equinox-gray-v2_5987046c.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-equinox-black-v2_ee7a80dd.png" },
] as const;

const filters = ["All", "Sedan", "SUV"] as const;
type FilterType = (typeof filters)[number];

export default function Fleet() {
  const [filter, setFilter] = useState<FilterType>("All");
  const inventory = filter === "All" ? confirmedInventory : confirmedInventory.filter((vehicle) => vehicle.type === filter);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main>
        <section className="bg-[#f7f5f0] px-6 pb-16 pt-32 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Confirmed inventory</p><div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end"><div><h1 className="font-display text-5xl font-bold tracking-[-0.055em] md:text-7xl">The vehicles we have today.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">This is the complete current DreamCarz inventory. Contact our team to confirm whether a vehicle is available for rental, sale, or neither at the time of your request.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">No unlisted vehicles.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Vehicle availability, rental terms, purchase terms, and any vehicle-specific details are confirmed directly by DreamCarz before a reservation or sale.</p></div></div></div></section>
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10"><div className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-center"><p className="text-sm text-gray-500">{inventory.length} of {confirmedInventory.length} confirmed vehicles</p><div className="flex items-center gap-2"><Filter size={15} className="text-gray-400" />{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === item ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-black hover:text-black"}`}>{item}</button>)}</div></div>
          <div className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{inventory.map((vehicle) => <article key={vehicle.id} className="group border-b border-gray-200 py-7 sm:px-6 sm:odd:border-l lg:border-b-0 lg:border-l lg:first:border-l-0"><div className="flex h-36 items-center justify-center overflow-hidden bg-[#f7f5f0]"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full w-full object-contain" /></div><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">{vehicle.type}</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h2><p className="mt-3 text-sm text-gray-500">Exterior: {vehicle.color}</p><div className="mt-5 border-t border-gray-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gray-400">Availability</p><p className="mt-1 text-sm leading-relaxed text-gray-600">Contact DreamCarz to confirm rental or sale options.</p></div><Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Ask about this vehicle <ArrowRight size={14} /></Link></article>)}</div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center"><p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-500">Do not see the vehicle you need? The displayed inventory is current as provided. Contact DreamCarz to discuss your transportation needs.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Contact DreamCarz <ArrowRight size={14} /></Link></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
