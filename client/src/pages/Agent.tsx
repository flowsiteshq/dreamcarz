import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DollarSign, Users, TrendingUp, Award, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";

const earnings = [
  { icon: <DollarSign size={20} />, title: "Personal Membership Sales", desc: "Earn cash commissions on every membership you personally enroll." },
  { icon: <Users size={20} />, title: "Team Production", desc: "Build a team and earn override commissions on their qualifying production." },
  { icon: <TrendingUp size={20} />, title: "Vehicle Transactions", desc: "Earn on qualifying vehicle transactions your customers complete through Dream Carz." },
  { icon: <Award size={20} />, title: "Rank Bonuses", desc: "Hit production milestones and unlock rank bonuses that reward your growth." },
  { icon: <Zap size={20} />, title: "DCP Bonuses", desc: "Earn DCP in addition to cash — building your own transportation purchasing power." },
  { icon: <TrendingUp size={20} />, title: "Renewal Income", desc: "Earn ongoing renewal commissions as your members maintain their memberships." },
];

export default function Agent() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="max-w-3xl">
            <div className="overline mb-4 reveal">Agent Opportunity</div>
            <h1 className="font-display text-5xl lg:text-6xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6 reveal delay-100">
              Earn <span className="text-gradient-gold">Cash + DCP</span><br />
              for Every Member You Bring
            </h1>
            <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
              Dream Carz Agents earn cash commissions and DCP points for qualifying customer and member production. Build a team, earn overrides, and grow your own transportation purchasing power simultaneously.
            </p>
            <div className="flex flex-wrap gap-4 reveal delay-300">
              <Link
                href="/membership"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Become an Agent
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[oklch(0.72_0.12_75/0.4)] text-[oklch(0.72_0.12_75)] font-semibold rounded-sm hover:border-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75/0.08)] transition-all"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Learn How DCP Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Important note */}
      <section className="py-10 border-y border-[oklch(0.72_0.12_75/0.08)]">
        <div className="container">
          <div className="glass-card rounded-lg p-6 max-w-3xl mx-auto reveal">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-sm bg-[oklch(0.72_0.12_75/0.12)] flex items-center justify-center text-[oklch(0.72_0.12_75)] flex-shrink-0">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)] mb-2">Built on Real Value</h3>
                <p className="text-sm text-[oklch(0.52_0.01_75)] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                  The Dream Carz compensation model is based primarily on genuine customer and member sales and real automotive activity — not recruitment alone. The consumer membership must make economic sense even with zero referrals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14 reveal">
            <div className="overline mb-3">Compensation</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">Multiple Ways to Earn</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {earnings.map((item, i) => (
              <div key={i} className="glass-card glass-card-hover rounded-lg p-6 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 rounded-sm bg-[oklch(0.72_0.12_75/0.12)] flex items-center justify-center text-[oklch(0.72_0.12_75)] mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-[oklch(0.94_0.008_75)] mb-2">{item.title}</h3>
                <p className="text-sm text-[oklch(0.52_0.01_75)] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.38_0.006_75)] mt-8" style={{ fontFamily: "var(--font-sans)" }}>
            Exact compensation plan requires separate financial and legal modeling. First-year commissions may be stronger than renewal commissions to encourage customer acquisition.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container text-center reveal">
          <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)] mb-4">Your Loyalty Has a Dollar Value.</h2>
          <p className="text-[oklch(0.52_0.01_75)] mb-8 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
            Join as an Agent and start building income and transportation purchasing power simultaneously.
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Join as an Agent
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

