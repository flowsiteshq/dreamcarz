import { ArrowRight, Car, CircleCheck, ClipboardCheck, Info } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";

const confirmedInventory = [
  { year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2024-chevrolet-malibu-gray_0b23eaa8.png" },
  { year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", image: "/manus-storage/dreamcarz-2022-chevrolet-traverse-white-v2_2dfa6ba3.png" },
  { year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2024-ford-fusion-gray-v2_b64c8909.png" },
  { year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-traverse-gray-v2_a575affb.png" },
  { year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan", image: "/manus-storage/dreamcarz-2019-chevrolet-malibu-black-v2_343ebb32.png" },
  { year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan", image: "/manus-storage/dreamcarz-2015-ford-taurus-gray-v2_b8c61858.png" },
  { year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-equinox-gray-v2_5987046c.png" },
  { year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", image: "/manus-storage/dreamcarz-2020-chevrolet-equinox-black-v2_ee7a80dd.png" },
] as const;

export default function MyVehicles() {
  return (
    <DashboardShell title="My Vehicles">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.85fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Vehicle access</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black">Confirmed inventory. Clear next steps.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">The vehicles below are the complete current DreamCarz inventory. A vehicle appears in your active account only after DreamCarz confirms your reservation.</p></div><div className="border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">Need to request a vehicle?</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Complete rental readiness first. Then contact DreamCarz to confirm rental or sale options for the vehicle you want.</p><Link href="/dashboard/rental-setup" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Open rental readiness <ArrowRight size={14} /></Link></div></section>
        <section className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-4">{confirmedInventory.map((vehicle) => <article key={`${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.color}`} className="border-b border-gray-200 py-6 sm:px-5 sm:odd:border-l lg:border-b-0 lg:border-l lg:first:border-l-0"><div className="flex h-28 items-center justify-center overflow-hidden bg-[#f7f5f0]"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full w-full object-contain" /></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">{vehicle.type}</p><h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h3><p className="mt-2 text-sm text-gray-500">Exterior: {vehicle.color}</p><p className="mt-4 text-sm leading-relaxed text-gray-500">Contact DreamCarz to confirm rental or sale options.</p></article>)}</section>
        <section className="grid gap-5 bg-[#f7f5f0] p-6 lg:grid-cols-3"><div><CircleCheck size={18} className="text-[#a8832d]" /><h3 className="mt-4 text-sm font-bold">Confirmed before display</h3><p className="mt-2 text-sm leading-relaxed text-gray-500">Active reservations and vehicle status are shown only after DreamCarz confirms them.</p></div><div><ClipboardCheck size={18} className="text-[#a8832d]" /><h3 className="mt-4 text-sm font-bold">Rental readiness first</h3><p className="mt-2 text-sm leading-relaxed text-gray-500">Keep your profile and eligibility review current before asking for a vehicle.</p></div><div><Info size={18} className="text-[#a8832d]" /><h3 className="mt-4 text-sm font-bold">No estimated terms</h3><p className="mt-2 text-sm leading-relaxed text-gray-500">Pricing, vehicle condition, availability, and any sale terms are confirmed directly by the DreamCarz team.</p></div></section>
      </div>
    </DashboardShell>
  );
}
