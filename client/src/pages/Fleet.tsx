import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Fuel, Gauge, Users, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const vehicles = [
  {
    id: 1,
    name: "Porsche 911 Turbo S",
    category: "Sports",
    image: "/manus-storage/fleet-car-1_684c9f3c.jpg",
    price: 45000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 640, seats: 2, fuel: "Gasoline" },
    dcpEarn: 90000,
    available: true,
  },
  {
    id: 2,
    name: "Bentley Continental GT",
    category: "Luxury",
    image: "/manus-storage/fleet-car-2_5f7bb78b.jpg",
    price: 65000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 542, seats: 4, fuel: "Gasoline" },
    dcpEarn: 130000,
    available: true,
  },
  {
    id: 3,
    name: "Lamborghini Huracán",
    category: "Supercar",
    image: "/manus-storage/fleet-car-3_335227f6.jpg",
    price: 85000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 610, seats: 2, fuel: "Gasoline" },
    dcpEarn: 170000,
    available: false,
  },
  {
    id: 4,
    name: "Mercedes-AMG GT 63 S",
    category: "Sports",
    image: "/manus-storage/fleet-car-4_c59c3c8d.jpg",
    price: 55000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 630, seats: 4, fuel: "Gasoline" },
    dcpEarn: 110000,
    available: true,
  },
  {
    id: 5,
    name: "Ferrari Roma",
    category: "Supercar",
    image: "/manus-storage/fleet-car-5_131e2b3a.jpg",
    price: 75000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 612, seats: 2, fuel: "Gasoline" },
    dcpEarn: 150000,
    available: true,
  },
  {
    id: 6,
    name: "Porsche Taycan Turbo S",
    category: "Electric",
    image: "/manus-storage/hero-car_b6b8cee9.jpg",
    price: 58000,
    weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 750, seats: 4, fuel: "Electric" },
    dcpEarn: 116000,
    available: true,
  },
];

const categories = ["All", "Sports", "Luxury", "Supercar", "Electric", "SUV"];

export default function Fleet() {
  useScrollReveal();
  const [activeCategory, setActiveCategory] = useState("All");
  const [memberTier, setMemberTier] = useState<"freedom" | "plus" | "pro" | "elite">("pro");

  const filtered = activeCategory === "All" ? vehicles : vehicles.filter((v) => v.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero — editorial asymmetric with oversized background text */}
      <section className="pt-32 pb-16 bg-[oklch(0.07_0.004_280)] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.3)] to-transparent"></div>
        <div className="absolute right-0 top-8 dcp-number text-[12rem] font-bold text-[oklch(0.72_0.12_75/0.04)] leading-none select-none pointer-events-none hidden lg:block">
          FLEET
        </div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
            <div>
              <div className="overline mb-4 reveal">Curated Vehicle Access</div>
              <h1 className="font-display text-5xl lg:text-7xl font-semibold text-[oklch(0.94_0.008_75)] leading-[0.92] mb-5 reveal delay-100">
                Drive the Car<br /><span className="text-gradient-gold italic">You Deserve</span>
              </h1>
              <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
                Every vehicle earns you DCP. The more you drive through Dream Carz, the more transportation purchasing power you build.
              </p>
            </div>
            <div className="reveal delay-300">
              <div className="glass-card rounded-lg p-6" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.2)" }}>
                <div className="overline mb-3">DCP on Acquisition</div>
                <div className="dcp-number text-5xl font-bold text-[oklch(0.72_0.12_75)] leading-none mb-1">2 DCP</div>
                <div className="text-sm text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>per $1 of qualifying vehicle value (illustrative)</div>
                <div className="gold-rule my-4"></div>
                <div className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                  A $15,000 vehicle → <span className="dcp-number text-[oklch(0.72_0.12_75)] font-semibold">30,000 DCP</span> = <span className="dcp-number text-[oklch(0.72_0.12_75)] font-semibold">$300</span> base purchasing power
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-[oklch(0.72_0.12_75/0.08)] sticky top-16 lg:top-20 z-40 bg-[oklch(0.085_0.005_280/0.95)] backdrop-blur-xl">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-sm rounded-sm transition-all ${activeCategory === cat ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold" : "border border-[oklch(0.72_0.12_75/0.2)] text-[oklch(0.52_0.01_75)] hover:border-[oklch(0.72_0.12_75/0.5)] hover:text-[oklch(0.94_0.008_75)]"}`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>Your tier:</span>
              <select
                value={memberTier}
                onChange={(e) => setMemberTier(e.target.value as any)}
                className="text-sm bg-[oklch(0.11_0.006_280)] border border-[oklch(0.72_0.12_75/0.2)] text-[oklch(0.94_0.008_75)] rounded-sm px-3 py-1.5 outline-none"
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
      </section>

      {/* Fleet grid */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((vehicle, i) => (
              <div key={vehicle.id} className="glass-card glass-card-hover rounded-lg overflow-hidden reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.7)] to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-[oklch(0.085_0.005_280/0.8)] text-[oklch(0.72_0.12_75)] border border-[oklch(0.72_0.12_75/0.3)]" style={{ fontFamily: "var(--font-sans)" }}>
                      {vehicle.category}
                    </span>
                  </div>
                  {!vehicle.available && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-[oklch(0.085_0.005_280/0.8)] text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                        Reserved
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold text-[oklch(0.94_0.008_75)] mb-1">{vehicle.name}</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                      <Gauge size={12} />
                      {vehicle.specs.hp} hp
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                      <Users size={12} />
                      {vehicle.specs.seats} seats
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                      <Fuel size={12} />
                      {vehicle.specs.fuel}
                    </div>
                  </div>

                  <div className="gold-rule mb-4"></div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-[oklch(0.52_0.01_75)] mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Vehicle value</div>
                      <div className="dcp-number text-lg font-bold text-[oklch(0.94_0.008_75)]">${vehicle.price.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[oklch(0.52_0.01_75)] mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Program fee ({memberTier})</div>
                      <div className="dcp-number text-lg font-bold text-[oklch(0.72_0.12_75)]">${vehicle.weeklyFee[memberTier]}/wk</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[oklch(0.72_0.12_75/0.08)] rounded-sm mb-4">
                    <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>Est. DCP earned on acquisition</span>
                    <span className="dcp-number text-sm font-bold text-[oklch(0.72_0.12_75)]">{vehicle.dcpEarn.toLocaleString()} DCP</span>
                  </div>

                  <button
                    className={`w-full py-2.5 rounded-sm text-sm font-semibold transition-all active:scale-[0.97] ${vehicle.available ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] hover:bg-[oklch(0.82_0.14_78)]" : "bg-[oklch(0.16_0.007_280)] text-[oklch(0.52_0.01_75)] cursor-not-allowed"}`}
                    style={{ fontFamily: "var(--font-sans)" }}
                    disabled={!vehicle.available}
                    onClick={() => {}}
                  >
                    {vehicle.available ? "Access This Vehicle" : "Join Priority Waitlist"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Free callout */}
      <section className="py-16 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="glass-card rounded-lg p-10 max-w-3xl mx-auto text-center reveal" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.25)" }}>
            <div className="overline mb-3">Credit Free Access</div>
            <h2 className="font-display text-3xl font-semibold text-[oklch(0.94_0.008_75)] mb-4">No Credit Score? No Problem.</h2>
            <p className="text-[oklch(0.52_0.01_75)] mb-6 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Build your DCP balance to 25% of your target vehicle value and qualify for Credit Free access. Dream Carz evaluates income, payment ability, and identity — not just your credit score.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { vehicle: "$10,000", dcp: "250,000 DCP", note: "at base" },
                { vehicle: "$15,000", dcp: "375,000 DCP", note: "at base" },
                { vehicle: "$20,000", dcp: "500,000 DCP", note: "at base" },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-[oklch(0.72_0.12_75/0.08)] rounded-sm">
                  <div className="dcp-number text-lg font-bold text-[oklch(0.94_0.008_75)] mb-1">{item.vehicle}</div>
                  <div className="dcp-number text-sm text-[oklch(0.72_0.12_75)]">{item.dcp}</div>
                  <div className="text-xs text-[oklch(0.52_0.01_75)] mt-1" style={{ fontFamily: "var(--font-sans)" }}>{item.note}</div>
                </div>
              ))}
            </div>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Calculate Your DCP Path
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
