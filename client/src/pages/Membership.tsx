import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { CheckCircle2, Star, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const tiers = [
  { name: "Freedom", price: 39.95, enrollment: 139, weeklyFee: 79, bonus: "Base", perks: ["Start at $39.95/month — cancel anytime", "DCP on qualifying activity", "Credit Free access starts day 1", "Roadside assistance included", "Hassle Free member-only pricing", "$79/week program fee"], featured: false },
  { name: "Plus", price: 69.95, enrollment: 199, weeklyFee: 69, bonus: "+5%", perks: ["Everything in Freedom", "+5% redemption enhancement", "Reduced platform fee $69/wk", "Priority member support", "Enhanced DCP earning rates", "Worry Free VSC eligibility"], featured: false },
  { name: "Pro", price: 99.95, enrollment: 249, weeklyFee: 59, bonus: "+15%", perks: ["Everything in Plus", "+15% redemption enhancement", "$59/week program fee", "Fee Free DCP offset eligible", "Drive Free rental DCP eligible", "Priority inventory access"], featured: true },
  { name: "Elite", price: 149.95, enrollment: 299, weeklyFee: 49, bonus: "+25%", perks: ["Everything in Pro", "+25% redemption enhancement", "$49/week program fee", "Be Free ownership eligible", "Maximum combined multiplier", "Founding Member status available"], featured: false },
];

export default function Membership() {
  useScrollReveal();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container text-center">
          <div className="section-label mb-3 reveal">Membership Tiers</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Choose Your Level of Freedom</h1>
          <p className="text-gray-500 max-w-xl mx-auto mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>One membership. Many freedoms. Choose the path that helps you save, earn, and build transportation freedom.</p>
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-full reveal delay-300">
            {(["monthly", "annual"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${billing === b ? "bg-black text-white" : "text-gray-500 hover:text-black"}`} style={{ fontFamily: "var(--font-sans)" }}>
                {b === "monthly" ? "Monthly" : "Annual (Save 15%)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {tiers.map((tier, i) => (
              <div key={i} className={`rounded-2xl p-7 flex flex-col reveal ${tier.featured ? "bg-black text-white" : "bg-white border border-gray-200"}`} style={{ transitionDelay: `${i * 80}ms` }}>
                {tier.featured && <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">★ Most Popular</div>}
                <div className={`text-xs font-semibold tracking-wider uppercase mb-2 ${tier.featured ? "text-gray-400" : "text-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>{tier.name}</div>
                <div className={`font-display text-4xl font-bold mb-1 ${tier.featured ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)" }}>
                  ${billing === "annual" ? (tier.price * 0.85).toFixed(2) : tier.price}
                </div>
                <div className={`text-xs mb-6 ${tier.featured ? "text-gray-400" : "text-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>per month · Enrollment: ${tier.enrollment}</div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.perks.map((p, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className={`mt-0.5 flex-shrink-0 ${tier.featured ? "text-gray-400" : "text-black"}`} />
                      <span className={`text-xs ${tier.featured ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "var(--font-sans)" }}>{p}</span>
                    </li>
                  ))}
                </ul>
                <button className={`py-3 rounded-full text-sm font-semibold transition-all active:scale-[0.97] ${tier.featured ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`} style={{ fontFamily: "var(--font-sans)" }}>
                  Join {tier.name}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6" style={{ fontFamily: "var(--font-sans)" }}>Freedom membership starts at $39.95 per month and may be cancelled anytime. Program eligibility and DCP rewards are subject to applicable terms.</p>
        </div>
      </section>

      {/* Founding Member */}
      <section className="py-16 bg-section">
        <div className="container">
          <div className="bg-black rounded-2xl p-10 max-w-3xl mx-auto text-center reveal">
            <Star size={28} className="text-white mx-auto mb-4" />
            <div className="section-label text-gray-400 mb-3">Limited Availability</div>
            <h2 className="font-display text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>Founding Member Status</h2>
            <p className="text-gray-400 mb-8 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>Early adopters may qualify for locked membership pricing, permanent DCP earning enhancements, higher lifetime redemption ceilings, and special Founding Member status.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {["Locked Pricing", "Permanent DCP Boost", "Higher Ceiling", "Priority Inventory", "Early Credit Free", "Special Status"].map((b, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-white/10 rounded-xl">
                  <Zap size={12} className="text-white flex-shrink-0" />
                  <span className="text-xs text-gray-300" style={{ fontFamily: "var(--font-sans)" }}>{b}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary bg-white text-black hover:bg-gray-100">Claim Founding Member Status <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* Tenure */}
      <section className="py-16 bg-white">
        <div className="container text-center">
          <div className="section-label mb-3 reveal">Tenure Rewards</div>
          <h2 className="font-display text-4xl font-bold text-black mb-10 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>The Longer You Stay, the More Powerful Your DCP</h2>
          <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto reveal delay-200">
            {[{y:"Year 1",m:"1.00x"},{y:"Year 2",m:"1.10x"},{y:"Year 3",m:"1.20x"},{y:"Year 4",m:"1.35x"},{y:"Year 5+",m:"1.50x"}].map((item,i) => (
              <div key={i} className={`rounded-xl p-4 text-center ${i===4?"bg-black text-white":"bg-section border border-gray-200"}`}>
                <div className={`font-mono text-xl font-bold mb-1 ${i===4?"text-white":"text-black"}`}>{item.m}</div>
                <div className={`text-xs ${i===4?"text-gray-400":"text-gray-500"}`} style={{ fontFamily: "var(--font-sans)" }}>{item.y}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-5" style={{ fontFamily: "var(--font-sans)" }}>Illustrative multipliers. Subject to financial modeling and final approval.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
