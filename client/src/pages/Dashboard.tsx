/* DreamCarz Network — Member Dashboard
 * Midnight Prestige: black-card financial ledger aesthetic
 * Large JetBrains Mono gold numerals as hero moments, editorial asymmetry
 */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { TrendingUp, Award, Car, Shield, Zap, ChevronRight } from "lucide-react";

const memberData = {
  name: "Marcus Johnson",
  tier: "Elite",
  memberSince: "2024",
  dcpEarned: 425000,
  dcpRedeemed: 140000,
  currentDCP: 285000,
  redemptionMultiplier: 1.5,
  transportationPower: 4275,
  membershipPaid: 4497,
  actualSavings: 3840,
  totalValue: 8115,
  memberValueRatio: 1.80,
};

export default function Dashboard() {
  useScrollReveal();
  const dcpValueDollars = (memberData.currentDCP / 100) * memberData.redemptionMultiplier;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero — editorial asymmetric layout */}
      <section className="pt-32 pb-0 bg-[oklch(0.07_0.004_280)] relative overflow-hidden">
        {/* Gold vertical accent */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.3)] to-transparent"></div>
        {/* Oversized background number — editorial depth */}
        <div className="absolute right-8 top-16 dcp-number text-[18rem] font-bold text-[oklch(0.72_0.12_75/0.04)] leading-none select-none pointer-events-none hidden lg:block">
          {memberData.memberValueRatio}x
        </div>
        <div className="container pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2">
              <div className="overline mb-3 reveal">Member Ledger</div>
              <h1 className="font-display text-5xl lg:text-6xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-4 reveal delay-100">
                Welcome back,<br /><span className="text-gradient-gold">{memberData.name}</span>
              </h1>
              <div className="flex items-center gap-3 reveal delay-200">
                <span className="px-3 py-1 bg-[oklch(0.72_0.12_75/0.15)] border border-[oklch(0.72_0.12_75/0.3)] rounded-sm text-xs font-semibold text-[oklch(0.72_0.12_75)] tracking-wider uppercase" style={{ fontFamily: "var(--font-sans)" }}>
                  {memberData.tier} Member
                </span>
                <span className="text-sm text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                  Loyalty since {memberData.memberSince}
                </span>
              </div>
            </div>
            {/* Statement value ratio */}
            <div className="reveal delay-300">
              <div className="glass-card rounded-lg p-6 text-right" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.25)" }}>
                <div className="overline mb-2 text-right">Member Value Ratio</div>
                <div className="dcp-number text-6xl font-bold text-[oklch(0.72_0.12_75)] leading-none">{memberData.memberValueRatio}x</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)] mt-2" style={{ fontFamily: "var(--font-sans)" }}>Transportation value vs membership cost</div>
                <div className="gold-rule mt-4"></div>
                <div className="text-xs text-[oklch(0.72_0.12_75)] mt-3 font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                  Every $1 paid → ${memberData.memberValueRatio.toFixed(2)} in value
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom gold rule */}
        <div className="gold-rule"></div>
      </section>

      {/* Black-card stats — statement numbers */}
      <section className="py-12 border-b border-[oklch(0.72_0.12_75/0.08)]">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[oklch(0.72_0.12_75/0.08)]">
            {[
              { label: "DCP Earned", value: memberData.dcpEarned.toLocaleString(), sub: "Lifetime total", icon: <TrendingUp size={16} />, unit: "DCP" },
              { label: "Transportation Power", value: `$${dcpValueDollars.toLocaleString()}`, sub: `At ${memberData.redemptionMultiplier}x multiplier`, icon: <Car size={16} />, unit: "" },
              { label: "Actual Savings", value: `$${memberData.actualSavings.toLocaleString()}`, sub: "Realized to date", icon: <Shield size={16} />, unit: "" },
              { label: "Current DCP Balance", value: memberData.currentDCP.toLocaleString(), sub: "Available now", icon: <Zap size={16} />, unit: "DCP" },
            ].map((stat, i) => (
              <div key={i} className="bg-[oklch(0.085_0.005_280)] p-7 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[oklch(0.72_0.12_75/0.6)]">{stat.icon}</span>
                  <span className="text-xs text-[oklch(0.52_0.01_75)] uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>{stat.label}</span>
                </div>
                <div className="dcp-number text-3xl lg:text-4xl font-bold text-[oklch(0.72_0.12_75)] leading-none mb-1">
                  {stat.value}
                </div>
                {stat.unit && <div className="text-xs text-[oklch(0.72_0.12_75/0.5)] font-semibold" style={{ fontFamily: "var(--font-sans)" }}>{stat.unit}</div>}
                <div className="text-xs text-[oklch(0.38_0.006_75)] mt-2" style={{ fontFamily: "var(--font-sans)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content — asymmetric 2/3 + 1/3 */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DCP Progress — 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-lg p-7 reveal">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-[oklch(0.72_0.12_75/0.4)]"></div>
                  <h3 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)]">DCP Accumulation Ledger</h3>
                </div>
                <div className="space-y-5">
                  {[
                    { label: "Membership Payments", dcp: 120000, pct: 28 },
                    { label: "Vehicle Transaction", dcp: 180000, pct: 42 },
                    { label: "Rental Activity", dcp: 85000, pct: 20 },
                    { label: "Good-Standing Bonus", dcp: 40000, pct: 10 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="dcp-number text-base font-bold text-[oklch(0.72_0.12_75)]">{item.dcp.toLocaleString()}</span>
                          <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>DCP</span>
                        </div>
                      </div>
                      <div className="h-1 bg-[oklch(0.16_0.007_280)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${item.pct}%`, background: `oklch(0.72 0.12 75 / ${0.4 + i * 0.15})` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <div className="gold-rule mt-2"></div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-[oklch(0.94_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>Total DCP Earned</span>
                    <div className="flex items-baseline gap-2">
                      <span className="dcp-number text-2xl font-bold text-[oklch(0.72_0.12_75)]">{memberData.dcpEarned.toLocaleString()}</span>
                      <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>DCP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenure multiplier — bar chart */}
              <div className="glass-card rounded-lg p-7 reveal delay-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-[oklch(0.72_0.12_75/0.4)]"></div>
                  <h3 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)]">Redemption Power Growth</h3>
                </div>
                <div className="flex items-end gap-4 h-28">
                  {[
                    { year: "Yr 1", mult: 1.00, active: false },
                    { year: "Yr 2", mult: 1.10, active: false },
                    { year: "Yr 3", mult: 1.20, active: false },
                    { year: "Yr 4", mult: 1.35, active: false },
                    { year: "Yr 5+", mult: 1.50, active: true },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className={`dcp-number text-xs font-bold ${item.active ? "text-[oklch(0.72_0.12_75)]" : "text-[oklch(0.52_0.01_75)]"}`}>{item.mult}x</span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${(item.mult / 1.5) * 80}px`,
                          background: item.active ? "oklch(0.72 0.12 75)" : "oklch(0.72 0.12 75 / 0.2)",
                          boxShadow: item.active ? "0 0 16px oklch(0.72 0.12 75 / 0.3)" : "none",
                        }}
                      ></div>
                      <span className="text-[10px] text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.year}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[oklch(0.38_0.006_75)] mt-5" style={{ fontFamily: "var(--font-sans)" }}>
                  Illustrative tenure multipliers. Your DCP becomes more powerful every year you maintain good standing.
                </p>
              </div>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-5">
              {/* Black-card value ledger */}
              <div className="glass-card rounded-lg p-6 reveal" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.2)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-px bg-[oklch(0.72_0.12_75/0.4)]"></div>
                  <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)]">Value Ledger</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Membership Investment", value: `$${memberData.membershipPaid.toLocaleString()}`, type: "cost" },
                    { label: "Realized Savings", value: `+$${memberData.actualSavings.toLocaleString()}`, type: "positive" },
                    { label: "Purchasing Power", value: `+$${dcpValueDollars.toLocaleString()}`, type: "positive" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-[oklch(0.72_0.12_75/0.08)]">
                      <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className={`dcp-number text-sm font-bold ${item.type === "positive" ? "text-[oklch(0.72_0.12_75)]" : "text-[oklch(0.65_0.008_75)]"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-[oklch(0.94_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>Total Value</span>
                    <span className="dcp-number text-xl font-bold text-[oklch(0.72_0.12_75)]">${memberData.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Access points */}
              <div className="glass-card rounded-lg p-6 reveal delay-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-px bg-[oklch(0.72_0.12_75/0.4)]"></div>
                  <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)]">Access Your Benefits</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Browse the Fleet", href: "/fleet", icon: <Car size={15} /> },
                    { label: "Calculate Your Value", href: "/calculator", icon: <TrendingUp size={15} /> },
                    { label: "Upgrade Membership", href: "/membership", icon: <Award size={15} /> },
                  ].map((action, i) => (
                    <a
                      key={i}
                      href={action.href}
                      className="flex items-center justify-between p-3 rounded-sm bg-[oklch(0.16_0.007_280)] hover:bg-[oklch(0.72_0.12_75/0.1)] border border-transparent hover:border-[oklch(0.72_0.12_75/0.2)] transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[oklch(0.72_0.12_75)]">{action.icon}</span>
                        <span className="text-sm text-[oklch(0.65_0.008_75)] group-hover:text-[oklch(0.94_0.008_75)] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>{action.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-[oklch(0.52_0.01_75)]" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Tier status */}
              <div className="glass-card rounded-lg p-6 reveal delay-300" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.15)" }}>
                <div className="overline mb-3">Membership Status</div>
                <div className="dcp-number text-3xl font-bold text-[oklch(0.72_0.12_75)] mb-1">{memberData.tier}</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)] mb-4" style={{ fontFamily: "var(--font-sans)" }}>+25% redemption enhancement</div>
                <div className="gold-rule mb-4"></div>
                <div className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                  Combined multiplier at Year 5+: <span className="dcp-number text-[oklch(0.72_0.12_75)] font-semibold">1.875x</span>
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
