import { ArrowRight, Car, ChevronLeft, CircleCheck, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const allVehicles = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV" },
  { id: "2019-chevrolet-malibu-black", year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan" },
  { id: "2015-ford-taurus-gray", year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan" },
  { id: "2020-chevrolet-equinox-gray", year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV" },
] as const;

export default function VehicleDetail() {
  const [, navigate] = useLocation();
  const selectedId = new URLSearchParams(window.location.search).get("id");
  const vehicle = allVehicles.find((item) => item.id === selectedId) ?? allVehicles[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="px-6 pb-20 pt-28 lg:px-10"><div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate("/fleet")} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-black"><ChevronLeft size={16} /> Back to confirmed inventory</button>
        <section className="mt-8 grid gap-10 border-y border-gray-200 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div className="flex min-h-[300px] items-center justify-center bg-[#f7f5f0]"><Car size={90} strokeWidth={1} className="text-[#a8832d]" aria-hidden="true" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Confirmed DreamCarz inventory</p><h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.055em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h1><p className="mt-4 text-sm leading-relaxed text-gray-600">Exterior color: {vehicle.color}. Vehicle type: {vehicle.type}.</p><div className="mt-7 border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">Availability is confirmed directly.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">DreamCarz will confirm current rental or sale options, pricing, vehicle condition, required documents, and timing before any request is accepted.</p></div><Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">Ask about this vehicle <ArrowRight size={14} /></Link></div></section>
        <section className="mt-10 grid gap-6 md:grid-cols-3"><article className="border border-gray-200 p-5"><CircleCheck size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">Vehicle details</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Year, make, model, vehicle type, and exterior color are shown from the confirmed inventory record.</p></article><article className="border border-gray-200 p-5"><Info size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">No assumed pricing</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">DreamCarz does not publish a price, program fee, vehicle value, or payment estimate for this vehicle until it is confirmed.</p></article><article className="border border-gray-200 p-5"><Car size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">Next step</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Contact the DreamCarz team to discuss availability and the option that may be right for you.</p></article></section>
      </div></main>
      <Footer />
    </div>
  );
}
