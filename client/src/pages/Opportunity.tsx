/**
 * DreamCarz Network — The Drive Network Opportunity Page
 * Public-facing MLM compensation plan overview
 */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  DollarSign, Users, TrendingUp, Star, Award, Zap,
  ChevronRight, Check, Car, Crown, Shield, Target
} from "lucide-react";

const ranks = [
  { id: 1, title: "Associate", icon: "🚗", req: "Active member", personal: 0, legs: 0, color: "bg-gray-100 text-gray-700", accent: "#6b7280" },
  { id: 2, title: "Driver", icon: "🏎️", req: "3 personal referrals", personal: 3, legs: 0, color: "bg-blue-50 text-blue-700", accent: "#3b82f6" },
  { id: 3, title: "Road Captain", icon: "⚡", req: "10 personal + 1 Driver leg", personal: 10, legs: 1, color: "bg-purple-50 text-purple-700", accent: "#8b5cf6" },
  { id: 4, title: "Fleet Director", icon: "🏆", req: "25 personal + 3 Road Captain legs", personal: 25, legs: 3, color: "bg-amber-50 text-amber-700", accent: "#f59e0b" },
  { id: 5, title: "Elite Executive", icon: "💎", req: "50 personal + 5 Fleet Director legs", personal: 50, legs: 5, color: "bg-orange-50 text-orange-700", accent: "#f97316" },
  { id: 6, title: "Dream Ambassador", icon: "👑", req: "100 personal + 3 Elite Exec legs", personal: 100, legs: 3, color: "bg-black text-white", accent: "#C9A84C" },
];

const incomeStreams = [
  {
    icon: DollarSign,
    title: "Personal Referral Bonus",
    subtitle: "Paid immediately on enrollment",
    description: "Earn $50–$150 cash for every new member you personally enroll. Amount scales with the tier they join.",
    tiers: [
      { label: "Freedom tier enroll", value: "$50" },
      { label: "Plus tier enroll", value: "$75" },
      { label: "Pro tier enroll", value: "$100" },
      { label: "Elite tier enroll", value: "$150" },
    ],
    color: "bg-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Residual Team Commissions",
    subtitle: "Monthly passive income from your team",
    description: "Earn a percentage of your downline's monthly membership fees — up to 5 levels deep. The deeper your network, the more you earn.",
    tiers: [
      { label: "Level 1 (personal)", value: "10%" },
      { label: "Level 2", value: "7%" },
      { label: "Level 3", value: "5%" },
      { label: "Level 4", value: "3%" },
      { label: "Level 5", value: "2%" },
    ],
    color: "bg-green-600",
  },
  {
    icon: Zap,
    title: "DCP Matching Bonus",
    subtitle: "Earn DCP when your team earns DCP",
    description: "Receive 20% of all DCP points your direct referrals accumulate. Their DCP earnings become your DCP earnings — accelerating your path to Credit Free.",
    tiers: [
      { label: "Direct referral DCP match", value: "20%" },
      { label: "Level 2 DCP match", value: "10%" },
    ],
    color: "bg-amber-500",
  },
  {
    icon: Award,
    title: "Rank Advancement Bonus",
    subtitle: "One-time cash rewards for hitting ranks",
    description: "Earn a one-time cash bonus every time you or a member of your team advances to a new rank.",
    tiers: [
      { label: "Reach Driver", value: "$100" },
      { label: "Reach Road Captain", value: "$500" },
      { label: "Reach Fleet Director", value: "$1,500" },
      { label: "Reach Elite Executive", value: "$5,000" },
      { label: "Reach Dream Ambassador", value: "$10,000" },
    ],
    color: "bg-purple-600",
  },
  {
    icon: Crown,
    title: "Dream Car Pool",
    subtitle: "Share in company-wide revenue",
    description: "The top 50 Dream Ambassadors share equally in 2% of DreamCarz Network's total monthly membership revenue — paid quarterly.",
    tiers: [
      { label: "Pool share (top 50)", value: "2% rev" },
      { label: "Paid", value: "Quarterly" },
    ],
    color: "bg-black",
  },
];

const faqs = [
  { q: "Do I need to be a DreamCarz member to participate?", a: "Yes. All Drive Network participants must hold an active DreamCarz membership at any tier. Your membership is your business license." },
  { q: "Is there a separate fee to join the Drive Network?", a: "No separate fee. Your DreamCarz membership automatically qualifies you to participate in the Drive Network compensation plan." },
  { q: "When are commissions paid?", a: "Personal Referral Bonuses are paid within 7 business days of enrollment. Residual commissions are paid monthly on the 15th. Rank bonuses are paid within 30 days of qualification." },
  { q: "How deep does the downline go?", a: "Residual commissions pay 5 levels deep. DCP matching pays 2 levels deep. There is no limit on the width of your organization." },
  { q: "Can I earn from members I didn't personally enroll?", a: "Yes. Residual commissions pay on your entire downline up to 5 levels, regardless of who enrolled them." },
  { q: "What happens if I cancel my membership?", a: "Your Drive Network commissions pause while your membership is inactive. They resume automatically when you reactivate." },
];

export default function Opportunity() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-20 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 60%)" }} />
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-sm text-white/70 mb-6 reveal" style={{ fontFamily: "var(--font-sans)" }}>
              <Star size={12} className="text-amber-400" fill="currentColor" />
              The Drive Network — Powered by DreamCarz
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 reveal delay-100" style={{ fontFamily: "var(--font-display)", lineHeight: 1.05 }}>
              Drive Your Income.<br />
              <span style={{ color: "#C9A84C" }}>Own Your Future.</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
              Turn your DreamCarz membership into a business. Earn cash, residual income, DCP bonuses, and rank rewards — simply by sharing what you already love.
            </p>
            <div className="flex flex-wrap gap-4 reveal delay-300">
              <button
                onClick={() => window.location.assign("/login")}
                className="px-8 py-4 rounded-full font-bold text-black text-sm"
                style={{ background: "#C9A84C", fontFamily: "var(--font-sans)" }}
              >
                Join the Drive Network →
              </button>
              <a href="#compensation" className="px-8 py-4 rounded-full font-bold text-white text-sm border border-white/20 hover:border-white/50 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                View Comp Plan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Avg monthly residual (Driver)", value: "$340" },
              { label: "Avg monthly residual (Fleet Director)", value: "$2,800" },
              { label: "Top Dream Ambassador monthly", value: "$18,000+" },
              { label: "Income streams", value: "5" },
            ].map((s, i) => (
              <div key={i} className="text-center reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="font-display text-3xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>{s.value}</div>
                <div className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rank Structure */}
      <section className="py-20 bg-section">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-3">Rank Structure</div>
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>6 Ranks. Unlimited Potential.</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-sans)" }}>Every rank unlocks new income streams and higher commission rates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranks.map((rank, i) => (
              <div key={rank.id} className="bg-white rounded-3xl p-6 border border-gray-100 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{rank.icon}</span>
                  <div>
                    <div className="text-xs text-gray-400 font-mono">RANK {rank.id}</div>
                    <div className="font-display text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{rank.title}</div>
                  </div>
                </div>
                <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${rank.color}`} style={{ fontFamily: "var(--font-sans)" }}>
                  {rank.req}
                </div>
                {rank.id >= 2 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                      <Users size={12} /> {rank.personal} personal enrollments
                    </div>
                    {rank.legs > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                        <Target size={12} /> {rank.legs} qualifying {rank.id === 3 ? "Driver" : rank.id === 4 ? "Road Captain" : rank.id === 5 ? "Fleet Director" : "Elite Exec"} leg{rank.legs > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Income Streams */}
      <section id="compensation" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-3">Compensation Plan</div>
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>5 Ways to Earn</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-sans)" }}>Stack multiple income streams simultaneously. The more you build, the more each stream grows.</p>
          </div>
          <div className="space-y-6">
            {incomeStreams.map((stream, i) => {
              const Icon = stream.icon;
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stream.color}`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <div>
                          <div className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{stream.title}</div>
                          <div className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{stream.subtitle}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{stream.description}</p>
                    </div>
                    <div className="md:w-72 bg-gray-50 rounded-2xl p-4">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-sans)" }}>Rate Schedule</div>
                      <div className="space-y-2">
                        {stream.tiers.map((t, j) => (
                          <div key={j} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>{t.label}</span>
                            <span className="font-mono font-bold text-black text-sm">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-section">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-3">Getting Started</div>
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>3 Steps to Your First Check</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Join DreamCarz", desc: "Activate any membership tier. Your membership is your business foundation.", icon: Car },
              { step: "02", title: "Share Your Link", desc: "Get your personal referral link from the Drive Network dashboard. Share it anywhere.", icon: Users },
              { step: "03", title: "Earn & Build", desc: "Earn referral bonuses immediately. Build your downline for residual monthly income.", icon: TrendingUp },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="font-mono text-4xl font-bold text-gray-100 mb-4">{s.step}</div>
                  <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container max-w-3xl">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-3">FAQ</div>
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-2xl p-5 reveal group" style={{ transitionDelay: `${i * 60}ms` }}>
                <summary className="font-semibold text-black cursor-pointer flex items-center justify-between" style={{ fontFamily: "var(--font-sans)" }}>
                  {faq.q}
                  <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="container text-center">
          <h2 className="font-display text-5xl font-bold text-white mb-4 reveal" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Build Your <span style={{ color: "#C9A84C" }}>Drive Network?</span>
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto reveal delay-100" style={{ fontFamily: "var(--font-sans)" }}>
            Join DreamCarz today and your Drive Network business activates automatically. No extra fees. No separate application.
          </p>
          <button
            onClick={() => window.location.assign("/login")}
            className="px-10 py-4 rounded-full font-bold text-black text-sm reveal delay-200"
            style={{ background: "#C9A84C", fontFamily: "var(--font-sans)" }}
          >
            Start Building Today →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
