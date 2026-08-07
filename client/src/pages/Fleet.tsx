import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Users, Settings, Fuel, ChevronRight } from "lucide-react";
import { useState } from "react";

const vehicles = [
  { id:1, name:"Porsche 911 Carrera 2025", category:"Sports", image:"/manus-storage/car-card-1_8dfc0a4a.png", price:45000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:640,seats:2,fuel:"Gasoline"}, dcpEarn:90000, available:true },
  { id:2, name:"Audi R8 V10 Performance", category:"Sports", image:"/manus-storage/car-card-2_d8411d99.png", price:65000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:562,seats:2,fuel:"Gasoline"}, dcpEarn:130000, available:true },
  { id:3, name:"Ferrari Portofino M 2025", category:"Supercar", image:"/manus-storage/car-card-3_23f3c0ab.png", price:85000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:612,seats:2,fuel:"Gasoline"}, dcpEarn:170000, available:false },
  { id:4, name:"Mercedes-Benz E-Class", category:"Luxury", image:"/manus-storage/car-card-4_6af95632.png", price:55000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:429,seats:4,fuel:"Gasoline"}, dcpEarn:110000, available:true },
  { id:5, name:"BMW i8 Coupe", category:"Electric", image:"/manus-storage/car-card-5_bd8a563d.png", price:75000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:369,seats:2,fuel:"Hybrid"}, dcpEarn:150000, available:true },
  { id:6, name:"Audi A6 Sedan", category:"Luxury", image:"/manus-storage/car-card-6_4972fbf1.png", price:58000, weeklyFee:{freedom:79,plus:69,pro:59,elite:49}, specs:{hp:335,seats:4,fuel:"Gasoline"}, dcpEarn:116000, available:true },
];
const categories = ["All","Sports","Luxury","Supercar","Electric"];

export default function Fleet() {
  useScrollReveal();
  const [cat, setCat] = useState("All");
  const [tier, setTier] = useState<"freedom"|"plus"|"pro"|"elite">("pro");
  const filtered = cat === "All" ? vehicles : vehicles.filter(v => v.category === cat);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-12 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Vehicle Fleet</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Find Your Perfect Ride</h1>
          <p className="text-gray-500 max-w-xl reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Explore a handpicked collection of luxury and performance cars. Every vehicle earns you DCP Transportation Purchasing Power.</p>
        </div>
      </section>

      <div className="sticky top-[70px] z-40 bg-white border-b border-gray-100 py-4">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 text-sm rounded-full transition-all ${cat===c?"bg-black text-white font-semibold":"border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black"}`} style={{ fontFamily: "var(--font-sans)" }}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>Your tier:</span>
            <select value={tier} onChange={e => setTier(e.target.value as any)} className="text-sm bg-white border border-gray-200 text-black rounded-full px-3 py-1.5 outline-none" style={{ fontFamily: "var(--font-sans)" }}>
              <option value="freedom">Freedom</option>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((v, i) => (
              <div key={v.id} className="vehicle-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="bg-gray-50 p-6 flex items-center justify-center relative" style={{ minHeight: "200px" }}>
                  <img src={v.image} alt={v.name} className="w-full object-contain" style={{ maxHeight: "160px" }} />
                  <div className="absolute top-3 left-3"><span className="tag">{v.category}</span></div>
                  {!v.available && <div className="absolute top-3 right-3"><span className="tag bg-gray-200 text-gray-500">Reserved</span></div>}
                </div>
                <div className="p-5 border-t border-gray-100">
                  <h3 className="font-display text-base font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>{v.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {v.specs.seats} Seats</span>
                    <span className="flex items-center gap-1"><Settings size={11} /> Auto</span>
                    <span className="flex items-center gap-1"><Fuel size={11} /> {v.specs.fuel}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Vehicle value</div>
                      <div className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>${v.price.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Program fee ({tier})</div>
                      <div className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>${v.weeklyFee[tier]}/wk</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl mb-4 text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="text-gray-500">Est. DCP on acquisition</span>
                    <span className="font-mono font-bold text-black">{v.dcpEarn.toLocaleString()} DCP</span>
                  </div>
                  <button disabled={!v.available} className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] ${v.available?"bg-black text-white hover:bg-gray-900":"bg-gray-100 text-gray-400 cursor-not-allowed"}`} style={{ fontFamily: "var(--font-sans)" }}>
                    {v.available ? "Book Now" : "Join Waitlist"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
