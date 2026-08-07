/* DreamCarz Network — Homepage
 * Midnight Prestige design: cinematic hero, DCP journey, fleet preview, membership CTA
 * Typography: Cormorant Garamond (display) + DM Sans (UI) + JetBrains Mono (data)
 * Colors: #0A0A0B bg, #C9A84C gold, #F5F0E8 warm white
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, ArrowDown, Star, Shield, Zap, Car, TrendingUp, Award } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { value: "6", label: "Stages to Freedom", suffix: "" },
  { value: "1.5", label: "Max Tenure Multiplier", suffix: "x" },
  { value: "100", label: "DCP = $1 Purchasing Power", suffix: "" },
  { value: "2.0", label: "Max Combined Multiplier", suffix: "x" },
];

const stages = [
  { name: "Hassle Free™", icon: <Star size={18} />, desc: "Convenient vehicle access" },
  { name: "Credit Free™", icon: <Shield size={18} />, desc: "No credit score required" },
  { name: "Worry Free™", icon: <Zap size={18} />, desc: "DCP toward protection" },
  { name: "Fee Free™", icon: <Car size={18} />, desc: "DCP offsets lease fees" },
  { name: "Drive Free™", icon: <TrendingUp size={18} />, desc: "DCP toward rentals" },
  { name: "Be Free™", icon: <Award size={18} />, desc: "DCP toward ownership" },
];

const membershipHighlights = [
  {
    tier: "Freedom",
    price: "$39.95",
    color: "oklch(0.52 0.008 75)",
    perks: ["DCP on all activity", "Credit Free eligible", "Roadside included"],
  },
  {
    tier: "Plus",
    price: "$69.95",
    color: "oklch(0.62 0.09 75)",
    perks: ["+5% redemption boost", "Reduced platform fees", "Priority support"],
  },
  {
    tier: "Pro",
    price: "$99.95",
    color: "oklch(0.72 0.12 75)",
    perks: ["+15% redemption boost", "Fee Free eligible", "Drive Free eligible"],
    featured: true,
  },
  {
    tier: "Elite",
    price: "$149.95",
    color: "oklch(0.82 0.14 78)",
    perks: ["+25% redemption boost", "Be Free eligible", "Founding Member access"],
  },
];

function CountUp({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const numTarget = parseFloat(target);
          const isDecimal = target.includes(".");
          const duration = 1500;
          const steps = 60;
          const increment = numTarget / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numTarget) {
              current = numTarget;
              clearInterval(timer);
            }
            setDisplay(isDecimal ? current.toFixed(1) : Math.round(current).toString());
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="dcp-number text-5xl lg:text-6xl font-bold text-[oklch(0.72_0.12_75)]">
      {display}{suffix}
    </div>
  );
}

export default function Home() {
  useScrollReveal();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════
          HERO SECTION — Cinematic full viewport
      ═══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/manus-storage/hero-car_b6b8cee9.jpg"
            alt="DreamCarz luxury vehicle"
            className="w-full h-full object-cover object-center"
            onLoad={() => setHeroLoaded(true)}
          />
          {/* Cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.085_0.005_280/0.92)] via-[oklch(0.085_0.005_280/0.65)] to-[oklch(0.085_0.005_280/0.2)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.8)] via-transparent to-[oklch(0.085_0.005_280/0.3)]"></div>
        </div>

        {/* Gold accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[oklch(0.72_0.12_75/0.4)] to-transparent"></div>

        {/* Content */}
        <div className="relative container py-32">
          <div className="max-w-2xl">
            {/* Overline */}
            <div
              className={`overline mb-5 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "200ms" }}
            >
              The Automotive Membership Ecosystem
            </div>

            {/* Headline */}
            <h1
              className={`font-display text-6xl lg:text-8xl font-semibold text-[oklch(0.94_0.008_75)] leading-[0.95] mb-6 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "350ms" }}
            >
              Your Loyalty<br />
              Has a <span className="text-gradient-gold italic">Dollar</span><br />
              Value.
            </h1>

            {/* Subheadline */}
            <p
              className={`text-xl text-[oklch(0.65_0.008_75)] leading-relaxed mb-10 max-w-lg transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ fontFamily: "var(--font-sans)", transitionDelay: "500ms" }}
            >
              Dream Carz rewards every transportation decision you make — payments, rentals, referrals — building purchasing power that drives your future.
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "650ms" }}
            >
              <Link
                href="/membership"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all duration-150 active:scale-[0.97]"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.03em" }}
              >
                Claim Your Membership
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[oklch(0.72_0.12_75/0.5)] text-[oklch(0.72_0.12_75)] font-semibold rounded-sm hover:border-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75/0.08)] transition-all duration-150"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                See Your Purchasing Power
              </Link>
            </div>

            {/* Trust indicators */}
            <div
              className={`flex items-center gap-6 mt-10 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "800ms" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.12_75)] animate-pulse-gold"></div>
                <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>Founding Members enrolling now</span>
              </div>
              <div className="w-px h-4 bg-[oklch(0.72_0.12_75/0.2)]"></div>
              <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>100 DCP = $1 Transportation Value</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-[oklch(0.52_0.01_75)] tracking-widest uppercase" style={{ fontFamily: "var(--font-sans)" }}>Scroll</span>
          <ArrowDown size={14} className="text-[oklch(0.72_0.12_75)]" />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════ */}
      <section className="py-16 bg-[oklch(0.07_0.004_280)] border-y border-[oklch(0.72_0.12_75/0.1)]">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <CountUp target={stat.value} suffix={stat.suffix} />
                <div className="text-sm text-[oklch(0.52_0.01_75)] mt-2" style={{ fontFamily: "var(--font-sans)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SIX-STAGE JOURNEY
      ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="overline mb-4 reveal">The Member Journey</div>
              <h2 className="font-display text-5xl lg:text-6xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6 reveal delay-100">
                Six Stages to<br /><span className="text-gradient-gold">Transportation Freedom</span>
              </h2>
              <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
                Every stage unlocks a new way to use your DCP. The longer you stay and the better you perform, the more your transportation relationship is worth.
              </p>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 text-[oklch(0.72_0.12_75)] font-medium hover:gap-3 transition-all reveal delay-300"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Explore the full journey
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Right: stage cards */}
            <div className="grid grid-cols-2 gap-3">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="glass-card glass-card-hover rounded-lg p-5 reveal"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-sm bg-[oklch(0.72_0.12_75/0.12)] flex items-center justify-center text-[oklch(0.72_0.12_75)]">
                      {stage.icon}
                    </div>
                    <span className="dcp-number text-xs text-[oklch(0.72_0.12_75/0.5)]">0{i + 1}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[oklch(0.94_0.008_75)] mb-1">{stage.name}</h3>
                  <p className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FLEET PREVIEW
      ═══════════════════════════════════════ */}
      <section className="py-24 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="overline mb-3 reveal">Featured Fleet</div>
              <h2 className="font-display text-5xl font-semibold text-[oklch(0.94_0.008_75)] reveal delay-100">Drive the Dream</h2>
            </div>
            <Link
              href="/fleet"
              className="inline-flex items-center gap-2 text-[oklch(0.72_0.12_75)] font-medium hover:gap-3 transition-all reveal delay-200"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              View full fleet
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Featured car — large */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="glass-card glass-card-hover rounded-lg overflow-hidden reveal">
              <div className="relative aspect-[16/9]">
                <img src="/manus-storage/fleet-car-1_684c9f3c.jpg" alt="Porsche 911 Turbo S" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.8)] via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-[oklch(0.72_0.12_75)] mb-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Sports</div>
                      <h3 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)]">Porsche 911 Turbo S</h3>
                    </div>
                    <div className="text-right">
                      <div className="dcp-number text-lg font-bold text-[oklch(0.72_0.12_75)]">$45,000</div>
                      <div className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>vehicle value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card glass-card-hover rounded-lg overflow-hidden reveal delay-100">
              <div className="relative aspect-[16/9]">
                <img src="/manus-storage/fleet-car-2_5f7bb78b.jpg" alt="Bentley Continental GT" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.8)] via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-[oklch(0.72_0.12_75)] mb-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Luxury</div>
                      <h3 className="font-display text-2xl font-semibold text-[oklch(0.94_0.008_75)]">Bentley Continental GT</h3>
                    </div>
                    <div className="text-right">
                      <div className="dcp-number text-lg font-bold text-[oklch(0.72_0.12_75)]">$65,000</div>
                      <div className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>vehicle value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three smaller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { img: "/manus-storage/fleet-car-3_335227f6.jpg", name: "Lamborghini Huracán", cat: "Supercar", price: "$85,000" },
              { img: "/manus-storage/fleet-car-4_c59c3c8d.jpg", name: "Mercedes-AMG GT 63 S", cat: "Sports", price: "$55,000" },
              { img: "/manus-storage/fleet-car-5_131e2b3a.jpg", name: "Ferrari Roma", cat: "Supercar", price: "$75,000" },
            ].map((car, i) => (
              <div key={i} className="glass-card glass-card-hover rounded-lg overflow-hidden reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="relative aspect-[3/2]">
                  <img src={car.img} alt={car.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.8)] via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-xs text-[oklch(0.72_0.12_75)] mb-0.5 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>{car.cat}</div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold text-[oklch(0.94_0.008_75)]">{car.name}</h3>
                      <span className="dcp-number text-sm font-bold text-[oklch(0.72_0.12_75)]">{car.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DCP EXPLAINED
      ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Right: visual */}
            <div className="order-2 lg:order-1">
              <div className="glass-card rounded-lg p-8 reveal">
                <div className="overline mb-4">DCP in Action</div>
                <div className="space-y-4">
                  {[
                    { label: "Monthly Membership (Elite)", dcp: "20,000 DCP", value: "$200" },
                    { label: "Vehicle Transaction ($15k)", dcp: "30,000 DCP", value: "$300" },
                    { label: "Annual Rental Activity", dcp: "12,000 DCP", value: "$120" },
                    { label: "Good-Standing Bonus (Q)", dcp: "+10%", value: "bonus" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[oklch(0.16_0.007_280)] rounded-sm">
                      <span className="text-sm text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="dcp-number text-sm font-bold text-[oklch(0.72_0.12_75)]">{item.dcp}</span>
                        <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>≈ {item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="gold-rule my-5"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[oklch(0.94_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>Transportation Purchasing Power</span>
                  <span className="dcp-number text-xl font-bold text-[oklch(0.72_0.12_75)]">$620+</span>
                </div>
                <p className="text-xs text-[oklch(0.38_0.006_75)] mt-3" style={{ fontFamily: "var(--font-sans)" }}>
                  Illustrative example. DCP rates subject to final financial modeling.
                </p>
              </div>
            </div>

            {/* Left: copy */}
            <div className="order-1 lg:order-2">
              <div className="overline mb-4 reveal">Dream Carz Points</div>
              <h2 className="font-display text-5xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6 reveal delay-100">
                Every Action Builds<br /><span className="text-gradient-gold">Purchasing Power</span>
              </h2>
              <p className="text-lg text-[oklch(0.52_0.01_75)] leading-relaxed mb-6 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
                DCP is not cash — it's Transportation Purchasing Power. 100 DCP equals $1 of base value, and that value grows with your tenure and membership level.
              </p>
              <div className="space-y-3 reveal delay-300">
                {[
                  "Earn DCP on every qualifying activity",
                  "Tenure multipliers up to 1.50x after 5 years",
                  "Elite membership adds +25% redemption power",
                  "Combined maximum multiplier of 2.00x",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.12_75)] mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{point}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 mt-8 text-[oklch(0.72_0.12_75)] font-medium hover:gap-3 transition-all reveal delay-400"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Learn how DCP works
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          MEMBERSHIP TIERS PREVIEW
      ═══════════════════════════════════════ */}
      <section className="py-24 bg-[oklch(0.07_0.004_280)]">
        <div className="container">
          <div className="text-center mb-14">
            <div className="overline mb-4 reveal">Membership</div>
            <h2 className="font-display text-5xl font-semibold text-[oklch(0.94_0.008_75)] reveal delay-100">
              Choose Your Level
            </h2>
            <p className="text-[oklch(0.52_0.01_75)] mt-4 max-w-xl mx-auto reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
              Every tier delivers real transportation value. A normal member who never recruits anyone should still see a compelling positive result.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {membershipHighlights.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-6 flex flex-col reveal ${m.featured ? "glow-gold" : "glass-card"}`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  border: m.featured ? "1px solid oklch(0.72 0.12 75 / 0.5)" : undefined,
                  background: m.featured ? "oklch(0.12 0.007 280)" : undefined,
                }}
              >
                {m.featured && (
                  <div className="text-xs font-semibold text-[oklch(0.72_0.12_75)] tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-sans)" }}>
                    ★ Most Popular
                  </div>
                )}
                <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: m.color, fontFamily: "var(--font-sans)" }}>{m.tier}</div>
                <div className="dcp-number text-3xl font-bold text-[oklch(0.94_0.008_75)] mb-1">{m.price}</div>
                <div className="text-xs text-[oklch(0.52_0.01_75)] mb-5" style={{ fontFamily: "var(--font-sans)" }}>per month</div>
                <ul className="space-y-2 flex-1">
                  {m.perks.map((perk, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: m.color }}></div>
                      <span className="text-xs text-[oklch(0.65_0.008_75)]" style={{ fontFamily: "var(--font-sans)" }}>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/membership"
                  className={`mt-5 py-2.5 rounded-sm text-sm font-semibold text-center transition-all active:scale-[0.97] ${m.featured ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] hover:bg-[oklch(0.82_0.14_78)]" : "border text-[oklch(0.94_0.008_75)] hover:bg-[oklch(0.72_0.12_75/0.08)]"}`}
                  style={{ borderColor: m.featured ? undefined : `${m.color}60`, fontFamily: "var(--font-sans)" }}
                >
                  Join {m.tier}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOST + AGENT PROGRAMS
      ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Host */}
            <div className="relative rounded-lg overflow-hidden reveal">
              <img src="/manus-storage/host-program_bdaa84c2.jpg" alt="Host Program" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.92)] via-[oklch(0.085_0.005_280/0.5)] to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="overline mb-2">Host Program</div>
                <h3 className="font-display text-3xl font-semibold text-[oklch(0.94_0.008_75)] mb-2">You Own the Car.<br />We Bring the Business.</h3>
                <p className="text-sm text-[oklch(0.65_0.008_75)] mb-5" style={{ fontFamily: "var(--font-sans)" }}>List your vehicle, earn transaction proceeds, and build DCP for fleet expansion.</p>
                <Link href="/host" className="inline-flex items-center gap-2 text-[oklch(0.72_0.12_75)] font-medium hover:gap-3 transition-all" style={{ fontFamily: "var(--font-sans)" }}>
                  Learn about hosting <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Agent */}
            <div className="relative rounded-lg overflow-hidden reveal delay-100">
              <img src="/manus-storage/lifestyle-member_c5a93940.jpg" alt="Agent Opportunity" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.085_0.005_280/0.92)] via-[oklch(0.085_0.005_280/0.5)] to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="overline mb-2">Agent Opportunity</div>
                <h3 className="font-display text-3xl font-semibold text-[oklch(0.94_0.008_75)] mb-2">Earn Cash + DCP<br />for Every Member.</h3>
                <p className="text-sm text-[oklch(0.65_0.008_75)] mb-5" style={{ fontFamily: "var(--font-sans)" }}>Build a team, earn commissions, and grow your own transportation purchasing power.</p>
                <Link href="/agent" className="inline-flex items-center gap-2 text-[oklch(0.72_0.12_75)] font-medium hover:gap-3 transition-all" style={{ fontFamily: "var(--font-sans)" }}>
                  Become an agent <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA — Founding Member
      ═══════════════════════════════════════ */}
      <section className="py-24 bg-[oklch(0.07_0.004_280)] relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[oklch(0.72_0.12_75)] blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[oklch(0.72_0.12_75)] blur-[120px]"></div>
        </div>
        <div className="relative container text-center">
          <div className="overline mb-4 reveal">Founding Member Enrollment</div>
          <h2 className="font-display text-5xl lg:text-7xl font-semibold text-[oklch(0.94_0.008_75)] leading-tight mb-6 reveal delay-100">
            Drive Free.<br /><span className="text-gradient-gold">Own Everything.</span>
          </h2>
          <p className="text-xl text-[oklch(0.52_0.01_75)] max-w-2xl mx-auto mb-10 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
            The Founding Member window is open now. Lock in your pricing, secure permanent DCP enhancements, and start building transportation purchasing power that compounds over time.
          </p>
          <div className="flex flex-wrap justify-center gap-4 reveal delay-300">
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] font-semibold text-lg rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all duration-150 active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Claim Founding Member Status
              <ChevronRight size={20} />
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 px-10 py-5 border border-[oklch(0.72_0.12_75/0.4)] text-[oklch(0.72_0.12_75)] font-semibold text-lg rounded-sm hover:border-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75/0.08)] transition-all"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Calculate Your Value
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
