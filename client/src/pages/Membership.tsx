import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { CheckCircle2, ChevronRight, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const tiers = [
  {
    name: "Freedom",
    price: 39.95,
    enrollment: 139,
    weeklyFee: 79,
    color: "oklch(0.52 0.008 75)",
    features: [
      "DCP earning on all qualifying activity",
      "Credit Free vehicle access (with DCP)",
      "Roadside assistance included",
      "Base redemption multiplier (1.00x)",
      "Host vehicle listing eligible",
      "Platform fee: $79/week",
    ],
    highlight: false,
  },
  {
    name: "Plus",
    price: 69.95,
    enrollment: 199,
    weeklyFee: 69,
    color: "oklch(0.62 0.09 75)",
    features: [
      "Everything in Freedom",
      "+5% redemption enhancement",
      "Reduced platform fee: $69/week",
      "Priority member support",
      "Enhanced DCP earning rates",
      "Worry Free VSC eligibility",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: 99.95,
    enrollment: 249,
    weeklyFee: 59,
    color: "oklch(0.72 0.12 75)",
    features: [
      "Everything in Plus",
      "+15% redemption enhancement",
      "Reduced platform fee: $59/week",
      "Fee Free DCP offset eligibility",
      "Drive Free rental DCP eligibility",
      "Priority inventory access",
    ],
    highlight: true,
  },
  {
    name: "Elite",
    price: 149.95,
    enrollment: 299,
    weeklyFee: 49,
    color: "oklch(0.82 0.14 78)",
    features: [
      "Everything in Pro",
      "+25% redemption enhancement",
      "Lowest platform fee: $49/week",
      "Be Free ownership DCP eligibility",
      "Maximum combined multiplier path",
      "Founding Member status available",
    ],
    highlight: false,
  },
];

export default function Membership() {
  useScrollReveal();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero — editorial asymmetric */}
      <section className="pt-32 pb-16 bg-[oklch(0.07_0.004_280)] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.3)] to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.1)] to-transparent"></div>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end mb-10">
            <div>
              <div className="overline mb-4 reveal">Membership Access</div>
              <h1 className="font-display text-5xl lg:text-7xl font-semibold text-[oklch(0.94_0.008_75)] leading-[0.92] mb-5 reveal delay-100">
                Choose Your<br />Level of<br /><span className="text-gradient-gold italic">Freedom</span>
              </h1>
              <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
                Every tier delivers real transportation value. Higher tiers amplify your DCP purchasing power and reduce your program costs.
              </p>
            </div>
            <div className="reveal delay-300">
              <div className="glass-card rounded-lg p-6" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.2)" }}>
                <div className="overline mb-3">The Membership Promise</div>
                <p className="font-display text-xl text-[oklch(0.94_0.008_75)] italic leading-relaxed mb-4">
                  "A normal member who never recruits anyone should still receive meaningful value."
                </p>
                <div className="gold-rule mb-4"></div>
                <p className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>
                  Target: 1.5x–2x measurable transportation value relative to membership cost. Subject to financial validation.
                </p>
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 p-1 bg-[oklch(0.11_0.006_280)] border border-[oklch(0.72_0.12_75/0.15)] rounded-sm reveal delay-300">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-5 py-2 text-sm font-medium rounded-sm transition-all ${billing === b ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)]" : "text-[oklch(0.52_0.01_75)] hover:text-[oklch(0.94_0.008_75)]"}`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {b === "monthly" ? "Monthly" : "Annual (Save 15%)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`relative rounded-lg p-7 flex flex-col reveal ${tier.highlight ? "glow-gold" : "glass-card"}`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  border: tier.highlight ? `1px solid oklch(0.72 0.12 75 / 0.5)` : undefined,
                  background: tier.highlight ? "oklch(0.12 0.007 280)" : undefined,
                }}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] text-xs font-semibold rounded-sm tracking-wider uppercase" style={{ fontFamily: "var(--font-sans)" }}>
                    Most Popular
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: tier.color, fontFamily: "var(--font-sans)" }}>{tier.name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="dcp-number text-4xl font-bold text-[oklch(0.94_0.008_75)]">
                      ${billing === "annual" ? (tier.price * 0.85).toFixed(2) : tier.price}
                    </span>
                    <span className="text-sm text-[oklch(0.52_0.01_75)] mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>/mo</span>
                  </div>
                  <div className="text-xs text-[oklch(0.52_0.01_75)] mb-6" style={{ fontFamily: "var(--font-sans)" }}>
                    Enrollment fee: ${tier.enrollment}
                  </div>
                  <div className="gold-rule mb-6"></div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                        <span className="text-sm text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <button
                    className={`w-full py-3 rounded-sm text-sm font-semibold transition-all active:scale-[0.97] ${tier.highlight ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] hover:bg-[oklch(0.82_0.14_78)]" : "border text-[oklch(0.94_0.008_75)] hover:bg-[oklch(0.72_0.12_75/0.08)]"}`}
                    style={{ borderColor: tier.highlight ? undefined : `${tier.color}60`, fontFamily: "var(--font-sans)" }}
                    onClick={() => {}}
                  >
                    Join {tier.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.38_0.006_75)] mt-8" style={{ fontFamily: "var(--font-sans)" }}>
            Pricing subject to final financial validation. Enrollment fees under consideration. DCP earning rates to be determined by financial model.
          </p>
        </div>
      </section>

      {/* Founding Member */}
      <section className="py-16 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="glass-card rounded-lg p-10 max-w-3xl mx-auto text-center reveal" style={{ border: "1px solid oklch(0.72 0.12 75 / 0.3)" }}>
            <div className="w-12 h-12 rounded-full bg-[oklch(0.72_0.12_75/0.15)] flex items-center justify-center mx-auto mb-5">
              <Star size={22} className="text-[oklch(0.72_0.12_75)]" />
            </div>
            <div className="overline mb-3">Limited Availability</div>
            <h2 className="font-display text-3xl font-semibold text-[oklch(0.94_0.008_75)] mb-4">Founding Member Status</h2>
            <p className="text-[oklch(0.52_0.01_75)] mb-6 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Early adopters may qualify for locked membership pricing, permanent DCP earning enhancements, higher lifetime redemption ceilings, and special Founding Member status. This is genuine urgency — not artificial scarcity.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {["Locked Pricing", "Permanent DCP Boost", "Higher Redemption Ceiling", "Priority Inventory", "Early Credit Free", "Special Status"].map((b, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-[oklch(0.72_0.12_75/0.08)] rounded-sm">
                  <Zap size={12} className="text-[oklch(0.72_0.12_75)] flex-shrink-0" />
                  <span className="text-xs text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{b}</span>
                </div>
              ))}
            </div>
            <button
              className="inline-flex items-center gap-2 px-10 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)" }}
              onClick={() => {}}
            >
              Claim Founding Member Status
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Tenure multiplier */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="overline mb-3">Tenure Rewards</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">The Longer You Stay, the More Powerful Your DCP</h2>
          </div>
          <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto reveal delay-100">
            {[
              { year: "Year 1", mult: "1.00x" },
              { year: "Year 2", mult: "1.10x" },
              { year: "Year 3", mult: "1.20x" },
              { year: "Year 4", mult: "1.35x" },
              { year: "Year 5+", mult: "1.50x" },
            ].map((item, i) => (
              <div key={i} className={`glass-card rounded-lg p-4 text-center ${i === 4 ? "border-[oklch(0.72_0.12_75/0.4)] glow-gold-sm" : ""}`}>
                <div className="dcp-number text-xl font-bold text-[oklch(0.72_0.12_75)] mb-1">{item.mult}</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.year}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.38_0.006_75)] mt-6" style={{ fontFamily: "var(--font-sans)" }}>
            Illustrative tenure multipliers. Subject to financial modeling and final approval. Combined maximum multiplier under consideration.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
