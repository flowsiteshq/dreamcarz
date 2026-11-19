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
  { id: "2022-chevrolet-traverse-white-unit-2", year: 2022, make: "Chevrolet", model: "Traverse", color: "White", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ibNpYLtoMWyXtPYw.png" },
  { id: "2017-ford-fusion-silver", year: 2017, make: "Ford", model: "Fusion", color: "Silver", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/MJscoVpsHBOwqjYM.png" },
  { id: "2020-chevrolet-traverse-silver-unit-2", year: 2020, make: "Chevrolet", model: "Traverse", color: "Silver", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/EFLRddTiajWoQmmp.png" },
  { id: "2017-buick-lacrosse-white", year: 2017, make: "Buick", model: "LaCrosse", color: "White", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ggykZyKcfAvaeDoj.png" },
  { id: "2021-nissan-rogue-white", year: 2021, make: "Nissan", model: "Rogue", color: "White", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/GYAvvZnLmaGvpgfs.png" },
  { id: "2017-gmc-acadia-silver", year: 2017, make: "GMC", model: "Acadia", color: "Silver", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/WCXSwGUMEeKTyfbX.png" },
  { id: "2020-buick-enclave-black", year: 2020, make: "Buick", model: "Enclave", color: "Black", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/WTcVGAqmVazArBBX.png" },
  { id: "2017-chevrolet-tahoe-gray", year: 2017, make: "Chevrolet", model: "Tahoe", color: "Gray", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/CTgaDpgPRgxUhEIe.png" },
  { id: "2019-chevrolet-impala-silver", year: 2019, make: "Chevrolet", model: "Impala", color: "Silver", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/gzRvLaQjOrkVkUDO.png" },
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
  const requestMode = query.get("mode");
  const requestLocation = query.get("location") ?? "Houston, TX";
  const backQuery = new URLSearchParams(query);
  backQuery.delete("id");
  const backToInventory = `/fleet${backQuery.size ? `?${backQuery.toString()}` : ""}`;
  const vehicle = allVehicles.find((item) => item.id === selectedId) ?? allVehicles[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="px-6 pb-20 pt-28 lg:px-10"><div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate(backToInventory)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-black"><ChevronLeft size={16} /> Back to vehicles</button>
        <section className="mt-8 grid gap-10 border-y border-gray-200 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><button type="button" onClick={() => setExperience("overview")} className="group relative flex min-h-[300px] items-center justify-center bg-[#f7f5f0] text-left"><img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`} className="h-full min-h-[300px] w-full object-contain" /><span className="absolute bottom-5 right-5 inline-flex items-center gap-2 bg-black px-4 py-2 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"><Maximize2 size={14} /> View full vehicle</span></button><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Available DreamCarz vehicle</p><h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.055em]">{vehicle.year} {vehicle.make}<br />{vehicle.model}</h1><p className="mt-4 text-sm leading-relaxed text-gray-600">{vehicle.type} · {vehicle.color} exterior · Pickup in {requestLocation}.</p>{requestMode && <p className="mt-3 inline-flex rounded-full bg-[#f5efe1] px-3 py-1 text-xs font-semibold capitalize text-[#7e6125]">Your search: {requestMode.replaceAll("-", " ")}</p>}{membershipPlan && <div className="mt-5 border-l-2 border-[#a8832d] bg-[#faf8f1] py-3 pl-4 pr-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Your selected membership</p><p className="mt-1 text-sm font-semibold">{membershipPlan.name} · {membershipPlan.focus}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">Membership and vehicle-specific terms are reviewed separately for your request.</p></div>}<div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-gray-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Pricing</p><p className="mt-2 text-sm font-semibold">Confirmed on request</p><p className="mt-1 text-xs leading-relaxed text-gray-500">Final rental, purchase, and recurring costs are reviewed before approval.</p></div><div className="rounded-xl border border-gray-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Availability</p><p className="mt-2 text-sm font-semibold">Reviewing for {requestLocation}</p><p className="mt-1 text-xs leading-relaxed text-gray-500">A request does not charge you or guarantee a reservation.</p></div></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => setExperience("rental")} className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"><Car size={15} /> Request to rent</button><button type="button" onClick={() => setExperience("purchase")} className="inline-flex items-center gap-2 rounded-full border border-black px-6 py-3 text-sm font-semibold text-black"><ShoppingBag size={15} /> Request to buy</button></div></div></section>
        <section className="mt-10 grid gap-6 md:grid-cols-3"><article className="border border-gray-200 p-5"><CircleCheck size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">What you are viewing</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Year, make, model, vehicle type, color, and pickup location are shown from the current DreamCarz inventory record.</p></article><article className="border border-gray-200 p-5"><Info size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">Clear costs</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Vehicle-specific pricing, billing frequency, insurance, and membership charges are labeled and confirmed before you commit.</p></article><article className="border border-gray-200 p-5"><Car size={18} className="text-[#a8832d]" /><h2 className="mt-4 text-sm font-bold">What happens next</h2><p className="mt-2 text-sm leading-relaxed text-gray-500">Choose a request path, share the needed details, and DreamCarz will confirm availability and the next step.</p></article></section>
      </div></main>
      <Footer />
      {experience && <VehicleExperienceDialog vehicle={vehicle} membershipPlan={membershipPlan} open={Boolean(experience)} initialView={experience} onOpenChange={(open) => !open && setExperience(null)} />}
    </div>
  );
}
