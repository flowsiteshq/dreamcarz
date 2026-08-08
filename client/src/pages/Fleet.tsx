import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Users, Settings, Fuel, Eye } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const vehicles = [
  // ── Under $20,000 — Value Tier ──────────────────────────────────────────
  {
    id: 101, name: "Honda Civic 2023", category: "Value",
    image: "/manus-storage/car-budget-1_ab248f67.png",
    price: 16000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 158, seats: 5, fuel: "Gasoline" }, dcpEarn: 32000, available: true,
    badge: "Best Value",
  },
  {
    id: 102, name: "Toyota Corolla 2023", category: "Value",
    image: "/manus-storage/car-budget-8_9abf3a26.png",
    price: 15500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 169, seats: 5, fuel: "Gasoline" }, dcpEarn: 31000, available: true,
    badge: null,
  },
  {
    id: 103, name: "Toyota Camry 2023", category: "Value",
    image: "/manus-storage/car-budget-2_9d827670.png",
    price: 18500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 203, seats: 5, fuel: "Gasoline" }, dcpEarn: 37000, available: true,
    badge: "Popular",
  },
  {
    id: 104, name: "Nissan Altima 2023", category: "Value",
    image: "/manus-storage/car-budget-5_ff412710.png",
    price: 17000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 182, seats: 5, fuel: "Gasoline" }, dcpEarn: 34000, available: true,
    badge: null,
  },
  {
    id: 105, name: "Chevrolet Malibu 2023", category: "Value",
    image: "/manus-storage/car-budget-6_ad466653.png",
    price: 16500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 160, seats: 5, fuel: "Gasoline" }, dcpEarn: 33000, available: true,
    badge: null,
  },
  {
    id: 106, name: "Hyundai Tucson 2023", category: "Value",
    image: "/manus-storage/car-budget-3_cf351661.png",
    price: 19500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 187, seats: 5, fuel: "Gasoline" }, dcpEarn: 39000, available: true,
    badge: "SUV",
  },
  {
    id: 107, name: "Kia Sportage 2023", category: "Value",
    image: "/manus-storage/car-budget-4_f1bd50cc.png",
    price: 19000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 187, seats: 5, fuel: "Gasoline" }, dcpEarn: 38000, available: false,
    badge: "SUV",
  },
  {
    id: 108, name: "Ford Escape 2023", category: "Value",
    image: "/manus-storage/car-budget-7_1b4d2b9c.png",
    price: 18000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 181, seats: 5, fuel: "Gasoline" }, dcpEarn: 36000, available: true,
    badge: "SUV",
  },
  // ── Premium Tier ─────────────────────────────────────────────────────────
  {
    id: 1, name: "Porsche 911 Carrera 2025", category: "Sports",
    image: "/manus-storage/car-card-1_8dfc0a4a.png",
    price: 45000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 640, seats: 2, fuel: "Gasoline" }, dcpEarn: 90000, available: true,
    badge: null,
  },
  {
    id: 2, name: "Audi R8 V10 Performance", category: "Sports",
    image: "/manus-storage/car-card-2_d8411d99.png",
    price: 65000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 562, seats: 2, fuel: "Gasoline" }, dcpEarn: 130000, available: true,
    badge: null,
  },
  {
    id: 3, name: "Ferrari Portofino M 2025", category: "Supercar",
    image: "/manus-storage/car-card-3_23f3c0ab.png",
    price: 85000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 612, seats: 2, fuel: "Gasoline" }, dcpEarn: 170000, available: false,
    badge: null,
  },
  {
    id: 4, name: "Mercedes-Benz E-Class", category: "Luxury",
    image: "/manus-storage/car-card-4_6af95632.png",
    price: 55000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 429, seats: 4, fuel: "Gasoline" }, dcpEarn: 110000, available: true,
    badge: null,
  },
  {
    id: 5, name: "BMW i8 Coupe", category: "Electric",
    image: "/manus-storage/car-card-5_bd8a563d.png",
    price: 75000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 369, seats: 2, fuel: "Hybrid" }, dcpEarn: 150000, available: true,
    badge: null,
  },
  {
    id: 6, name: "Audi A6 Sedan", category: "Luxury",
    image: "/manus-storage/car-card-6_4972fbf1.png",
    price: 58000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 335, seats: 4, fuel: "Gasoline" }, dcpEarn: 116000, available: true,
    badge: null,
  },
];

const categories = ["All", "Value", "Sports", "Luxury", "Supercar", "Electric"];

type Tier = "freedom" | "plus" | "pro" | "elite";

export default function Fleet() {
  useScrollReveal();
  const [, navigate] = useLocation();
  const [cat, setCat] = useState("All");
  const [tier, setTier] = useState<Tier>("pro");
  const filtered = cat === "All" ? vehicles : vehicles.filter(v => v.category === cat);
  const valueCount = vehicles.filter(v => v.category === "Value").length;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Vehicle Fleet</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>
            Find Your Perfect Ride
          </h1>
          <p className="text-gray-500 max-w-xl reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
            From everyday value vehicles under $20,000 to exotic supercars — every vehicle earns you DCP Transportation Purchasing Power.
          </p>
          {/* Value highlight banner */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-black text-white rounded-full reveal delay-300">
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            <span className="text-sm font-medium" style={{ fontFamily: "var(--font-sans)" }}>
              {valueCount} vehicles available under $20,000 — perfect for everyday driving
            </span>
            <button onClick={() => setCat("Value")} className="text-xs underline text-gray-300 hover:text-white transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              View all →
            </button>
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-gray-100 py-4">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  cat === c
                    ? "bg-black text-white font-semibold"
                    : "border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {c}
                {c === "Value" && (
                  <span className="ml-1.5 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                    Under $20K
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>Your tier:</span>
            <select
              value={tier}
              onChange={e => setTier(e.target.value as Tier)}
              className="text-sm bg-white border border-gray-200 text-black rounded-full px-3 py-1.5 outline-none"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <option value="freedom">Freedom</option>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle grid */}
      <section className="py-12">
        <div className="container">
          {/* Section header when showing Value tier */}
          {(cat === "All" || cat === "Value") && (
            <div className="mb-8 reveal">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <h2 className="font-display text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                  Value Fleet — Under $20,000
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-5" style={{ fontFamily: "var(--font-sans)" }}>
                Reliable everyday vehicles. Same DCP earning program, same membership benefits.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((v, i) => (
              <div key={v.id} className="vehicle-card reveal" style={{ transitionDelay: `${(i % 6) * 80}ms` }}>
                {/* Car image */}
                <div className="bg-gray-50 p-6 flex items-center justify-center relative" style={{ minHeight: "200px" }}>
                  <img src={v.image} alt={v.name} className="w-full object-contain" style={{ maxHeight: "160px" }} />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="tag">{v.category}</span>
                    {v.badge && (
                      <span className="tag bg-black text-white">{v.badge}</span>
                    )}
                  </div>
                  {!v.available && (
                    <div className="absolute top-3 right-3">
                      <span className="tag bg-gray-200 text-gray-500">Reserved</span>
                    </div>
                  )}
                  {v.price <= 20000 && (
                    <div className="absolute bottom-3 right-3">
                      <span className="tag bg-white border border-gray-200 text-black font-semibold">
                        Under $20K
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 border-t border-gray-100">
                  <h3 className="font-display text-base font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    {v.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {v.specs.seats} Seats</span>
                    <span className="flex items-center gap-1"><Settings size={11} /> Auto</span>
                    <span className="flex items-center gap-1"><Fuel size={11} /> {v.specs.fuel}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Vehicle value</div>
                      <div className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                        ${v.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Program fee ({tier})</div>
                      <div className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                        ${v.weeklyFee[tier]}/wk
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl mb-4 text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="text-gray-500">Est. DCP on acquisition</span>
                    <span className="font-mono font-bold text-black">{v.dcpEarn.toLocaleString()} DCP</span>
                  </div>
                  <button
                    disabled={!v.available}
                    className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] ${
                      v.available
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {v.available ? "Book Now" : "Join Waitlist"}
                  </button>
                  <button
                    onClick={() => navigate(`/vehicle?id=${v.id}`)}
                    className="w-full mt-2 py-2.5 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black transition-all flex items-center justify-center gap-2"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <Eye size={13} /> View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Premium section divider when showing All */}
          {cat === "All" && (
            <div className="mt-16 mb-8 reveal">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <h2 className="font-display text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                  Premium Fleet
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-5" style={{ fontFamily: "var(--font-sans)" }}>
                Luxury, sports, and supercar vehicles for the ultimate driving experience.
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
