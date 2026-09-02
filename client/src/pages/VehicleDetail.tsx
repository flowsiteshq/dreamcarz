import { ArrowRight, Car, ChevronLeft, CircleCheck, Info, Maximize2, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { VehicleExperienceDialog } from "@/components/VehicleExperienceDialog";
import { useState } from "react";

export const allVehicles = [
  { id: "2024-chevrolet-malibu-gray", year: 2024, make: "Chevrolet", model: "Malibu", color: "Gray", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png" },
  { id: "2022-chevrolet-traverse-white", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png" },
  { id: "2024-ford-fusion-gray", year: 2024, make: "Ford", model: "Fusion", color: "Gray", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png" },
  { id: "2020-chevrolet-traverse-gray", year: 2020, make: "Chevrolet", model: "Traverse", color: "Gray", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/mFFrLJBzyJWqricP.png" },
  { id: "2019-chevrolet-malibu-black", year: 2019, make: "Chevrolet", model: "Malibu", color: "Black", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/njSpzrWxcQZbiWBb.png" },
  { id: "2015-ford-taurus-gray", year: 2015, make: "Ford", model: "Taurus", color: "Gray", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BDcxxQLQxENUVvqj.png" },
  { id: "2020-chevrolet-equinox-gray", year: 2020, make: "Chevrolet", model: "Equinox", color: "Gray", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QuCANehFYgQjJKfm.png" },
  { id: "2020-chevrolet-equinox-black", year: 2020, make: "Chevrolet", model: "Equinox", color: "Black", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png" },
] as const;

const membershipPlanContext: Record<string, { name: string; focus: string }> = {
  freedom: { name: "Freedom", focus: "Rentals + DCP" }, plus: { name: "Plus", focus: "Subscribe & Save exploration" }, pro: { name: "Pro", focus: "Broader vehicle path" }, elite: { name: "Elite", focus: "Lease-to-own exploration" }, silver: { name: "Silver", focus: "Silver and below guidance" }, gold: { name: "Gold", focus: "Host + fleet guidance" }, black: { name: "Black", focus: "Application-led exploration" },
};

export default function VehicleDetail() {
  const [, navigate] = useLocation();
  const [experience, setExperience] = useState<"overview" | "rental" | "purchase" | null>(null);
  const query = new URLSearchParams(window.location.search);
  const selectedId = query.get("id");
  const membershipPlan = query.get("plan") ? membershipPlanContext[query.get("plan")!] : undefined;
  const backQuery = new URLSearchParams(query);
  backQuery.delete("id");
  const backToInventory = `/fleet${backQuery.size ? `?${backQuery.toString()}` : ""}`;
  const vehicle = allVehicles.find((item) => item.id === selectedId) ?? allVehicles[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="px-6 pb-20 pt-28 lg:px-10"><div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate(backToInventory)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-black"><ChevronLeft size={16} /> Back to confirmed inventory</button>
        <section className="mt-8 grid gap-10 border-y border-gray-200 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><button type="button" onClick={() => setExperience("overview")} className="group relative flex min-h-[300px] items-center justify-center bg-[#f7f5f0] text-left"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full min-h-[300px] w-full object-contain" /><span className="absolute bottom-5 right-5 inline-flex items-center gap-2 bg-black px-4 py-2 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"><Maximize2 size={14} /> View full vehicle</span></button><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Confirmed DreamCarz inventory</p><h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.055em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h1><p className="mt-4 text-sm leading-relaxed text-gray-600">Exterior color: {vehicle.color}. Vehicle type: {vehicle.type}.</p>{membershipPlan && <div className="mt-5 border-l-2 border-[#a8832d] bg-[#faf8f1] py-3 pl-4 pr-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Your selected membership</p><p className="mt-1 text-sm font-semibold">{membershipPlan.name} · {membershipPlan.focus}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">Membership and vehicle-specific terms are reviewed separately for your request.</p></div>}<div className="mt-7 border-l-2 border-[#a8832d] pl-5"><p className="text-sm font-semibold">Choose your vehicle path.</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Request this vehicle for rental or send a purchase inquiry. DreamCarz confirms the final availability and terms after reviewing your request.</p></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => setExperience("rental")} className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"><Car size={15} /> Rent this vehicle</button><button type="button" onClick={() => setExperience("purchase")} className="inline-flex items-center gap-2 rounded-full border border-black px-6 py-3 text-sm font-semibold text-black"><ShoppingBag size={15} /> Buy this vehicle</button></div></div></section>
        <section className="mt-10 grid gap-6 md:grid-cols-3"><article className="border border-gray-200 p-5"><CircleCheck size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">Vehicle details</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Year, make, model, vehicle type, and exterior color are shown from the confirmed inventory record.</p></article><article className="border border-gray-200 p-5"><Info size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">No assumed pricing</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">DreamCarz does not publish a price, program fee, vehicle value, or payment estimate for this vehicle until it is confirmed.</p></article><article className="border border-gray-200 p-5"><Car size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">Next step</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Contact the DreamCarz team to discuss availability and the option that may be right for you.</p></article></section>
      </div></main>
      <Footer />
      {experience && <VehicleExperienceDialog vehicle={vehicle} membershipPlan={membershipPlan} open={Boolean(experience)} initialView={experience} onOpenChange={(open) => !open && setExperience(null)} />}
    </div>
  );
}
