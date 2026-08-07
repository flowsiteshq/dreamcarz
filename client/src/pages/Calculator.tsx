import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useMemo } from "react";
import { Info, TrendingUp } from "lucide-react";

type Tier = "freedom" | "plus" | "pro" | "elite";

const tierData = {
  freedom: { price: 39.95, enrollment: 139, weeklyFee: 79, redemptionBonus: 0, label: "Freedom" },
  plus: { price: 69.95, enrollment: 199, weeklyFee: 69, redemptionBonus: 0.05, label: "Plus" },
  pro: { price: 99.95, enrollment: 249, weeklyFee: 59, redemptionBonus: 0.15, label: "Pro" },
  elite: { price: 149.95, enrollment: 299, weeklyFee: 49, redemptionBonus: 0.25, label: "Elite" },
};

const tenureMultipliers: Record<number, number> = { 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.35, 5: 1.5 };

function getTenureMultiplier(years: number): number {
  if (years >= 5) return 1.5;
  return tenureMultipliers[years] ?? 1.0;
}

export default function Calculator() {
  useScrollReveal();

  const [tier, setTier] = useState<Tier>("elite");
  const [years, setYears] = useState(3);
  const [vehiclePrice, setVehiclePrice] = useState(25000);
  const [rentals, setRentals] = useState(4);
  const [referrals, setReferrals] = useState(0);
  const [showReferrals, setShowReferrals] = useState(false);

  const calc = useMemo(() => {
    const td = tierData[tier];
    const membershipPaid = td.enrollment + td.price * 12 * years;
    const tenureMult = getTenureMultiplier(years);
    const tierBonus = td.redemptionBonus;
    const combinedMult = Math.min(tenureMult * (1 + tierBonus), 2.0);

    // Illustrative DCP earning (rates not finalized)
    const dcpFromMembership = td.price * 12 * years * 200; // illustrative
    const dcpFromVehicle = vehiclePrice * 2; // illustrative 2 DCP per $1
    const dcpFromRentals = rentals * 5000; // illustrative
    const dcpFromReferrals = showReferrals ? referrals * 20000 : 0;
    const totalDCP = dcpFromMembership + dcpFromVehicle + dcpFromRentals + dcpFromReferrals;

    const transportationPower = (totalDCP / 100) * combinedMult;

    // Savings
    const weeklyFeeSavings = (79 - td.weeklyFee) * 52 * years;
    const roadsideValue = 120 * years;
    const rentalSavings = rentals * 150 * years;
    const totalSavings = weeklyFeeSavings + roadsideValue + rentalSavings;

    const totalValue = totalSavings + transportationPower;
    const memberValueRatio = totalValue / membershipPaid;

    // Credit Free check
    const creditFreeRequired = vehiclePrice * 0.25;
    const creditFreeDCP = creditFreeRequired / combinedMult * 100;

    return {
      membershipPaid,
      tenureMult,
      tierBonus,
      combinedMult,
      totalDCP,
      transportationPower,
      totalSavings,
      totalValue,
      memberValueRatio,
      creditFreeRequired,
      creditFreeDCP,
      dcpFromMembership,
      dcpFromVehicle,
      dcpFromRentals,
    };
  }, [tier, years, vehiclePrice, rentals, referrals, showReferrals]);

  const SliderInput = ({ label, value, min, max, step, onChange, format }: any) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{label}</label>
        <span className="dcp-number text-sm font-bold text-[oklch(0.72_0.12_75)]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, oklch(0.72 0.12 75) 0%, oklch(0.72 0.12 75) ${((value - min) / (max - min)) * 100}%, oklch(0.16 0.007 280) ${((value - min) / (max - min)) * 100}%, oklch(0.16 0.007 280) 100%)`,
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero — asymmetric editorial layout */}
      <section className="pt-32 pb-16 bg-[oklch(0.07_0.004_280)] relative overflow-hidden">
        {/* Gold vertical accent */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.3)] to-transparent"></div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
            <div>
              <div className="overline mb-4 reveal">Transportation Value Ledger</div>
              <h1 className="font-display text-5xl lg:text-7xl font-semibold text-[oklch(0.94_0.008_75)] leading-[0.92] mb-6 reveal delay-100">
                What Is Your<br />Membership<br /><span className="text-gradient-gold italic">Actually Worth?</span>
              </h1>
              <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
                Adjust the inputs to see your projected DCP accumulation, transportation purchasing power, and member value ratio — the black-card ledger of your loyalty.
              </p>
            </div>
            {/* Right: statement number */}
            <div className="reveal delay-300 flex justify-end">
              <div className="text-right">
                <div className="overline mb-2">Base Conversion Rate</div>
                <div className="dcp-number text-8xl font-bold text-[oklch(0.72_0.12_75/0.15)] leading-none select-none">100</div>
                <div className="dcp-number text-lg font-semibold text-[oklch(0.72_0.12_75)] -mt-4">DCP = $1.00</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)] mt-1" style={{ fontFamily: "var(--font-sans)" }}>Transportation Purchasing Power</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator — black-card ledger layout */}
      <section className="py-16 relative">
        {/* Subtle gold glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[oklch(0.72_0.12_75/0.03)] blur-[100px] pointer-events-none"></div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Inputs panel */}
            <div className="glass-card rounded-lg p-8 reveal" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.12)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-px bg-[oklch(0.72_0.12_75/0.4)]"></div>
                <h2 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)]">Configure Your Membership</h2>
              </div>

              {/* Tier selector */}
              <div className="mb-6">
                <label className="text-sm font-medium text-[oklch(0.65_0.008_75)] block mb-3" style={{ fontFamily: "var(--font-sans)" }}>Membership Tier</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(tierData) as Tier[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`py-2 text-xs font-semibold rounded-sm transition-all ${tier === t ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)]" : "border border-[oklch(0.72_0.12_75/0.2)] text-[oklch(0.52_0.01_75)] hover:border-[oklch(0.72_0.12_75/0.5)]"}`}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {tierData[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <SliderInput label="Years as Member" value={years} min={1} max={10} step={1} onChange={setYears} format={(v: number) => `${v} yr${v > 1 ? "s" : ""}`} />
              <SliderInput label="Vehicle Price" value={vehiclePrice} min={5000} max={100000} step={1000} onChange={setVehiclePrice} format={(v: number) => `$${v.toLocaleString()}`} />
              <SliderInput label="Annual Rentals" value={rentals} min={0} max={52} step={1} onChange={setRentals} format={(v: number) => `${v} rentals`} />

              <div className="mt-4">
                <button
                  onClick={() => setShowReferrals(!showReferrals)}
                  className="text-xs text-[oklch(0.52_0.01_75)] hover:text-[oklch(0.72_0.12_75)] transition-colors"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {showReferrals ? "− Hide" : "+ Include"} referral income (optional)
                </button>
                {showReferrals && (
                  <div className="mt-3">
                    <SliderInput label="Annual Referrals" value={referrals} min={0} max={50} step={1} onChange={setReferrals} format={(v: number) => `${v} referrals`} />
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-[oklch(0.72_0.12_75/0.06)] rounded-sm border border-[oklch(0.72_0.12_75/0.15)]">
                <div className="flex gap-2">
                  <Info size={14} className="text-[oklch(0.72_0.12_75)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[oklch(0.52_0.01_75)] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                    DCP earning rates are illustrative and subject to final financial modeling. This calculator is for educational purposes only and does not constitute a guarantee of value.
                  </p>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-5 reveal delay-100">
              {/* Value ratio hero */}
              <div className="glass-card rounded-lg p-8 text-center" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.3)" }}>
                <div className="overline mb-2">Member Value Ratio</div>
                <div className="dcp-number text-7xl font-bold text-[oklch(0.72_0.12_75)] mb-2">{calc.memberValueRatio.toFixed(2)}x</div>
                <div className="text-sm text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                  Total value vs membership cost
                </div>
              </div>

              {/* Breakdown */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)] mb-4">Value Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: "A. Membership Cost", value: `-$${calc.membershipPaid.toFixed(0)}`, muted: false },
                    { label: "B. Actual Savings Realized", value: `+$${calc.totalSavings.toFixed(0)}`, positive: true },
                    { label: "C. Transportation Purchasing Power", value: `+$${calc.transportationPower.toFixed(0)}`, positive: true },
                    { label: "D. Total Member Value", value: `$${calc.totalValue.toFixed(0)}`, bold: true },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between items-center py-2 ${i < 3 ? "border-b border-[oklch(0.72_0.12_75/0.08)]" : ""}`}>
                      <span className={`text-sm ${item.bold ? "font-semibold text-[oklch(0.94_0.008_75)]" : "text-[oklch(0.65_0.008_75)]"}`} style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className={`dcp-number text-sm font-bold ${item.positive ? "text-[oklch(0.72_0.12_75)]" : item.bold ? "text-[oklch(0.72_0.12_75)]" : "text-[oklch(0.94_0.008_75)]"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DCP breakdown */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)] mb-4">DCP Accumulation</h3>
                <div className="space-y-2">
                  {[
                    { label: "From Membership Payments", dcp: calc.dcpFromMembership },
                    { label: "From Vehicle Transaction", dcp: calc.dcpFromVehicle },
                    { label: "From Rentals", dcp: calc.dcpFromRentals },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5">
                      <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className="dcp-number text-xs font-semibold text-[oklch(0.72_0.12_75)]">{item.dcp.toLocaleString()} DCP</span>
                    </div>
                  ))}
                  <div className="gold-rule my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[oklch(0.94_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>Total DCP</span>
                    <span className="dcp-number text-base font-bold text-[oklch(0.72_0.12_75)]">{calc.totalDCP.toLocaleString()} DCP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>Redemption multiplier ({calc.combinedMult.toFixed(2)}x)</span>
                    <span className="dcp-number text-sm font-bold text-[oklch(0.72_0.12_75)]">${calc.transportationPower.toFixed(0)} power</span>
                  </div>
                </div>
              </div>

              {/* Credit Free */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)] mb-3">Credit Free Requirement</h3>
                <p className="text-xs text-[oklch(0.52_0.01_75)] mb-3" style={{ fontFamily: "var(--font-sans)" }}>
                  For a ${vehiclePrice.toLocaleString()} vehicle, you need:
                </p>
                <div className="flex items-center justify-between p-3 bg-[oklch(0.72_0.12_75/0.08)] rounded-sm">
                  <span className="text-sm text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>Required DCP (at {calc.combinedMult.toFixed(2)}x)</span>
                  <span className="dcp-number text-base font-bold text-[oklch(0.72_0.12_75)]">{Math.round(calc.creditFreeDCP).toLocaleString()} DCP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
