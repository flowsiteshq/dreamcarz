import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { CheckCircle2, DollarSign, Users, TrendingUp, ChevronRight, Car } from "lucide-react";
import { Link } from "wouter";

const benefits = [
  { icon: <DollarSign size={22} />, title: "Earn Transaction Proceeds", desc: "Receive income from every rental booking on your listed vehicles. Your car works for you." },
  { icon: <TrendingUp size={22} />, title: "Earn DCP Points", desc: "Host activity earns DCP, which builds your transportation purchasing power for fleet expansion." },
  { icon: <Car size={22} />, title: "Credit Free Fleet Growth", desc: "Use accumulated DCP to qualify for Credit Free access to additional vehicles for your fleet." },
  { icon: <Users size={22} />, title: "Dream Carz Member Network", desc: "Instantly tap into the Dream Carz member base as your customer pool — no marketing needed." },
];

const feeStructure = [
  { tier: "Freedom", fee: "$79/week", color: "oklch(0.52 0.008 75)" },
  { tier: "Plus", fee: "$69/week", color: "oklch(0.62 0.09 75)" },
  { tier: "Pro", fee: "$59/week", color: "oklch(0.72 0.12 75)" },
  { tier: "Elite", fee: "$49/week", color: "oklch(0.82 0.14 78)" },
];

export default function HostProgram() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/manus-storage/host-program_bdaa84c2.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.085_0.005_280/0.92)] via-[oklch(0.085_0.005_280/0.7)] to-transparent" />
        <div className="relative container py-32">
          <div className="max-w-xl">
            <div className="overline mb-4">Host Program</div>
            <h1 className="font-display text-5xl lg:text-6xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6">
              You Own the Car.<br />
              <span className="text-gradient-gold">We Bring the Business.</span>
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_75)] leading-relaxed mb-8" style={{ fontFamily: "var(--font-sans)" }}>
              List your vehicle on the Dream Carz platform and earn income while building transportation purchasing power for fleet growth.
            </p>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Become a Host
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14 reveal">
            <div className="overline mb-3">Why Host</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">Built for Vehicle Owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="glass-card glass-card-hover rounded-lg p-7 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-11 h-11 rounded-sm bg-[oklch(0.72_0.12_75/0.12)] flex items-center justify-center text-[oklch(0.72_0.12_75)] mb-5">
                  {b.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-[oklch(0.94_0.008_75)] mb-2">{b.title}</h3>
                <p className="text-sm text-[oklch(0.52_0.01_75)] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform fee structure */}
      <section className="py-20 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="text-center mb-14 reveal">
            <div className="overline mb-3">Platform Fees</div>
            <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)]">Lower Fees at Higher Tiers</h2>
            <p className="text-[oklch(0.52_0.01_75)] mt-4 max-w-lg mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
              Your membership level directly reduces your platform fees. Elite members keep more of every transaction.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {feeStructure.map((tier, i) => (
              <div key={i} className="glass-card rounded-lg p-5 text-center reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-sm font-semibold mb-2" style={{ color: tier.color, fontFamily: "var(--font-sans)" }}>{tier.tier}</div>
                <div className="dcp-number text-2xl font-bold text-[oklch(0.94_0.008_75)]">{tier.fee}</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)] mt-1" style={{ fontFamily: "var(--font-sans)" }}>per vehicle</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.38_0.006_75)] mt-6" style={{ fontFamily: "var(--font-sans)" }}>
            Illustrative rates. Each Host vehicle requires its own membership. Subject to final financial validation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center reveal">
          <h2 className="font-display text-4xl font-semibold text-[oklch(0.94_0.008_75)] mb-4">Ready to Put Your Car to Work?</h2>
          <p className="text-[oklch(0.52_0.01_75)] mb-8 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
            Join Dream Carz as a Host and start earning while building your transportation purchasing power.
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all active:scale-[0.97]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Get Started as a Host
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
