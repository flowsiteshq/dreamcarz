import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ChevronRight, ArrowDown } from "lucide-react";
import { Link } from "wouter";

const stages = [
  {
    number: "01",
    name: "HASSLE FREE™",
    tagline: "Easy, convenient vehicle access",
    desc: "Join Dream Carz and immediately enjoy streamlined vehicle access, a dedicated member experience, and a single relationship that handles everything automotive.",
    color: "oklch(0.52 0.008 75)",
  },
  {
    number: "02",
    name: "CREDIT FREE™",
    tagline: "Qualifying access without traditional credit scores",
    desc: "Build your DCP balance to 25% of your target vehicle value and qualify for Credit Free vehicle access — no traditional credit score required. Dream Carz evaluates income, payment ability, and identity instead.",
    color: "oklch(0.58 0.07 75)",
  },
  {
    number: "03",
    name: "WORRY FREE™",
    tagline: "DCP toward Vehicle Service Contracts",
    desc: "Use eligible DCP toward qualifying Vehicle Service Contracts and vehicle protection. Your loyalty pays for peace of mind.",
    color: "oklch(0.62 0.09 75)",
  },
  {
    number: "04",
    name: "FEE FREE™",
    tagline: "DCP toward lease and program fees",
    desc: "Eligible DCP can offset qualifying Dream Carz lease and program fees. The longer you stay, the less you pay.",
    color: "oklch(0.67 0.10 75)",
  },
  {
    number: "05",
    name: "DRIVE FREE™",
    tagline: "DCP toward rental days",
    desc: "Apply eligible DCP toward qualifying rental days and vehicle-use expenses. Your accumulated loyalty literally drives you for free.",
    color: "oklch(0.72 0.12 75)",
  },
  {
    number: "06",
    name: "BE FREE™",
    tagline: "DCP toward vehicle ownership",
    desc: "The ultimate destination: use eligible DCP toward qualifying vehicle ownership. Your transportation relationship has been building to this moment.",
    color: "oklch(0.82 0.14 78)",
  },
];

const flywheel = [
  "Join Dream Carz",
  "Get Your Vehicle",
  "Earn DCP Points",
  "Make Successful Payments",
  "Earn More DCP",
  "Maintain Good Standing",
  "Receive DCP Bonuses",
  "Rent / Service / Buy",
  "Refer Members",
  "Reduce Future Costs",
  "Eventually Drive Free",
  "Be Free — Own It",
];

export default function HowItWorks() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container text-center">
          <div className="overline mb-4 reveal">The Dream Carz Journey</div>
          <h1 className="font-display text-5xl lg:text-7xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6 reveal delay-100">
            Six Stages to<br /><span className="text-gradient-gold">Transportation Freedom</span>
          </h1>
          <p className="text-lg text-[oklch(0.52_0.01_75)] max-w-2xl mx-auto reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
            The longer you stay, the better you perform, and the more business you do with Dream Carz — the more valuable your transportation relationship becomes.
          </p>
        </div>
      </section>

      {/* Six stages */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-6">
            {stages.map((stage, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="glass-card glass-card-hover rounded-lg p-7 flex gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="dcp-number text-3xl font-bold" style={{ color: stage.color }}>{stage.number}</div>
                    {i < stages.length - 1 && (
                      <div className="w-px flex-1 mt-4" style={{ background: `${stage.color}40` }}></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: stage.color, fontFamily: "var(--font-sans)" }}>
                      {stage.name}
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)] mb-2">{stage.tagline}</h3>
                    <p className="text-sm text-[oklch(0.52_0.01_75)] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{stage.desc}</p>
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown size={16} className="text-[oklch(0.72_0.12_75/0.4)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flywheel */}
      <section className="py-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="text-center mb-14 reveal">
            <div className="overline mb-3">The Dream Carz Flywheel</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">A Cycle That Rewards You Forever</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {flywheel.map((step, i) => (
                <div key={i} className="flex items-center gap-4 mb-3 reveal" style={{ transitionDelay: `${i * 50}ms` }}>
                  <div className="w-7 h-7 rounded-full border border-[oklch(0.72_0.12_75/0.3)] flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.12_75)]"></div>
                  </div>
                  <div className="flex-1 glass-card rounded-sm px-4 py-3">
                    <span className="text-sm text-[oklch(0.85_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{step}</span>
                  </div>
                  {i < flywheel.length - 1 && (
                    <ChevronRight size={14} className="text-[oklch(0.72_0.12_75/0.4)] flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DCP Earning */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14 reveal">
            <div className="overline mb-3">DCP Earning</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">Every Action Earns Points</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Membership Payments", "Vehicle Purchases", "Vehicle Payments", "Lease Payments",
              "Rental Activity", "Vehicle Service", "VSC Purchases", "Host Rentals",
              "Referrals", "Good-Standing Bonus", "Agent Production", "Renewals",
            ].map((activity, i) => (
              <div key={i} className="glass-card rounded-sm p-4 text-center reveal" style={{ transitionDelay: `${i * 40}ms` }}>
                <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.12_75)] mx-auto mb-2"></div>
                <span className="text-xs text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{activity}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.38_0.006_75)] mt-6" style={{ fontFamily: "var(--font-sans)" }}>
            Exact DCP earning rates are subject to final financial modeling and validation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container text-center reveal">
          <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)] mb-4">Start Your Journey Today</h2>
          <p className="text-[oklch(0.52_0.01_75)] mb-8 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
            Every day you wait is a day your DCP isn't growing. Join now as a Founding Member.
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Claim Your Membership
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
