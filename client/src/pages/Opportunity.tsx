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
  { id: 1, title: "Associate", icon: "🤝", req: "Share & refer", personal: 0, legs: 0, color: "bg-gray-100 text-gray-700", accent: "#6b7280" },
  { id: 2, title: "Host", icon: "🚗", req: "Own, list & earn", personal: 0, legs: 0, color: "bg-blue-50 text-blue-700", accent: "#3b82f6" },
  { id: 3, title: "Agent", icon: "📈", req: "Operate & manage", personal: 0, legs: 0, color: "bg-purple-50 text-purple-700", accent: "#8b5cf6" },
  { id: 4, title: "Freedom Member", icon: "⭐", req: "Join & build", personal: 0, legs: 0, color: "bg-black text-white", accent: "#C9A84C" },
];

const incomeStreams = [
  {
    icon: DollarSign,
    title: "Advance Commissions",
    subtitle: "Qualifying activity may earn upfront compensation",
    description: "Build through qualifying new-member and business activity under the applicable compensation plan.",
    tiers: [
      { label: "Associate path", value: "Share & refer" },
      { label: "Host path", value: "List & earn" },
      { label: "Agent path", value: "Operate & manage" },
    ],
    color: "bg-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Monthly Residuals",
    subtitle: "Recurring qualifying compensation",
    description: "Qualifying ongoing activity may contribute to monthly residual compensation under the current plan.",
    tiers: [
      { label: "Member activity", value: "Qualifying" },
      { label: "Team activity", value: "Qualifying" },
    ],
    color: "bg-green-600",
  },
  {
    icon: Zap,
    title: "Leadership Overrides",
    subtitle: "Recognition for qualifying leadership activity",
    description: "Build, lead, and support your organization as you work toward qualifying leadership compensation.",
    tiers: [
      { label: "Leadership activity", value: "Qualifying" },
      { label: "Team support", value: "Qualifying" },
    ],
    color: "bg-amber-500",
  },
  {
    icon: Award,
    title: "Performance Bonuses",
    subtitle: "Rewards for qualifying performance",
    description: "Qualifying performance may unlock additional bonuses under the current Dream Carz compensation plan.",
    tiers: [
      { label: "Milestones", value: "Qualifying" },
      { label: "Performance", value: "Qualifying" },
    ],
    color: "bg-purple-600",
  },
];

const faqs = [
  { q: "What are the ways to build with Dream Carz?", a: "You can choose an Associate, Host, Agent, or Freedom Member path. Each path is designed to connect qualifying activity with the Dream Carz automotive ecosystem." },
  { q: "What compensation themes does the plan include?", a: "The plan includes advance commissions, monthly residuals, leadership overrides, and performance bonuses. Eligibility and amounts are governed by the current written compensation plan." },
  { q: "Do I need experience to become an Agent?", a: "No prior experience is required. Dream Carz provides a path to learn, operate, and grow." },
  { q: "How does hosting work?", a: "Hosts may list qualifying vehicles on the platform, connect with Dream Carz members as potential customers, earn from qualifying transactions, and explore responsible fleet growth." },
  { q: "Can a Freedom Member build toward benefits?", a: "Freedom membership begins at $39.95 per month, can be cancelled anytime, and provides access to qualifying DCP and program benefits." },
  { q: "Where can I review the current plan?", a: "Contact the Dream Carz team for the current written compensation plan, eligibility rules, and program terms." },
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
              Multiple Ways to Build<br />
              <span style={{ color: "#C9A84C" }}>With Dream Carz.</span>
              </h1>
              <p className="text-white/60 text-lg max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
              Choose your path: Associate, Host, Agent, or Freedom Member. Share, list, operate, or join — then build toward greater freedom through vehicles, rewards, and relationships.
            </p>
            <div className="flex flex-wrap gap-4 reveal delay-300">
              <button
                onClick={() => window.location.assign("/login")}
                className="px-8 py-4 rounded-full font-bold text-black text-sm"
                style={{ background: "#C9A84C", fontFamily: "var(--font-sans)" }}
              >
                Explore Your Path →
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
              { label: "Ways to build", value: "4" },
              { label: "Compensation themes", value: "4" },
              { label: "Freedom membership starts", value: "$39.95" },
              { label: "DCP reward uses", value: "6" },
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
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Build a Path That Fits You.</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-sans)" }}>Whether you share, host, operate, or join, Dream Carz connects every path to the same automotive ecosystem.</p>
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
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>A Powerful Compensation Plan</h2>
            <p className="text-gray-400 mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-sans)" }}>Qualifying builders can work toward advance commissions, monthly residuals, leadership overrides, and performance bonuses.</p>
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
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Build Your Dream Carz Path</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Choose Your Path", desc: "Build as an Associate, Host, Agent, or Freedom Member within the Dream Carz ecosystem.", icon: Car },
              { step: "02", title: "Take Qualifying Action", desc: "Share, list, operate, or join—then follow the applicable program and compensation plan.", icon: Users },
              { step: "03", title: "Earn & Build", desc: "Qualifying activity may create access to advance commissions, residuals, leadership overrides, and bonuses.", icon: TrendingUp },
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
