/* DreamCarz Network — AI-First Homepage
 * Matches reference: light gray bg, car bleeding right, inline prompt, stats bar with icons
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowUp, Sparkles, ChevronRight,
  Car, Diamond, Crown, UserCircle, MapPin, HeadphonesIcon,
  Users, Trophy, Shield
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";

const rotatingPrompts = [
  "Ask DreamCarz anything...",
  "Rent a Porsche this weekend.",
  "Help me buy my next vehicle.",
  "Upgrade my membership.",
  "Find a location near me.",
  "Show me luxury SUVs under $500/day.",
  "Find an exotic car for my wedding.",
  "Reserve a Corvette for tomorrow.",
  "Check my account balance.",
  "Extend my rental.",
];

const quickSuggestions = [
  "Rent a Porsche this weekend",
  "Upgrade my membership",
  "Check my balance",
];

const chips = [
  { label: "Rent a Car", icon: Car, prompt: "I'd like to rent a car.", href: "/fleet" },
  { label: "Buy a Car", icon: Diamond, prompt: "Help me buy my next vehicle.", href: "/fleet" },
  { label: "Memberships", icon: Crown, prompt: "Show me membership options.", href: "/membership" },
  { label: "My Account", icon: UserCircle, prompt: "Show my account and DCP balance.", href: "/dashboard" },
  { label: "Locations", icon: MapPin, prompt: "Find a DreamCarz location near me.", href: "/contact" },
  { label: "Support", icon: HeadphonesIcon, prompt: "I need help with something.", href: "/contact" },
  { label: "Refer a Friend", icon: Users, prompt: "How do I join the Drive Network and refer friends?", href: "/opportunity" },
];

const stats = [
  { icon: Car, value: "$39.95", label: "Freedom Membership" },
  { icon: Trophy, value: "6", label: "Freedom Stages" },
  { icon: Sparkles, value: "DCP", label: "Earn & Redeem" },
  { icon: Users, value: "4", label: "Ways to Build" },
];

const aiResponses: Record<string, { title: string; body: string; cta: string; href: string }> = {
  rent: { title: "Let's find your perfect ride.", body: "Browse our full fleet — from everyday value vehicles to exotic supercars. Every rental earns DCP Transportation Purchasing Power.", cta: "Browse Fleet", href: "/fleet" },
  buy: { title: "Ready to own your dream car?", body: "Our Lease-to-Own program lets you drive the vehicle while building equity. DCP points apply toward your purchase.", cta: "Explore Lease-to-Own", href: "/agent" },
  membership: { title: "Choose your freedom path.", body: "Freedom starts at $39.95 per month and can be cancelled anytime. Qualifying membership activity earns DCP and opens a progression of benefits over time.", cta: "View Memberships", href: "/membership" },
  balance: { title: "Your DCP balance is waiting.", body: "Sign in to view your current DCP balance, redemption power, member value ratio, and full account history.", cta: "Go to Dashboard", href: "/dashboard" },
  location: { title: "We're in Lanham, MD.", body: "10001 Derekwood Ln, Suite 204, Lanham, MD 20706. Open Mon–Fri 9am–6pm, Saturday 9am–3pm. Call (301) 772-2500.", cta: "Get Directions", href: "/contact" },
  upgrade: { title: "Upgrade your membership.", body: "Moving to a higher tier increases your DCP earning rate, unlocks exclusive vehicles, and accelerates your path to Credit Free.", cta: "Compare Tiers", href: "/membership" },
  support: { title: "We're here to help.", body: "Reach our team at (301) 772-2500 or info@dreamcarz.com. Mon–Fri 9am–6pm, Saturday 9am–3pm.", cta: "Contact Us", href: "/contact" },
  referral: { title: "Build with Dream Carz.", body: "Explore Associate, Host, Agent, and Freedom Member paths. Qualifying builders may access advance commissions, monthly residuals, leadership overrides, and performance bonuses.", cta: "View the Opportunity", href: "/opportunity" },
  default: { title: "Let me help you with that.", body: "Browse our fleet, explore membership tiers, or contact our team directly. DreamCarz is here to make your automotive experience effortless.", cta: "Browse Fleet", href: "/fleet" },
};

function getAIResponse(input: string) {
  const q = input.toLowerCase();
  if (q.match(/rent|drive|book|reserve|weekend|tomorrow|lamborghini|ferrari|porsche|corvette|bmw|mercedes|exotic|suv|car for/)) return aiResponses.rent;
  if (q.match(/buy|purchase|own|finance|lease.to.own|next vehicle/)) return aiResponses.buy;
  if (q.match(/membership|tier|freedom|plus|pro|elite|join|enroll/)) return aiResponses.membership;
  if (q.match(/balance|dcp|points|account|invoice|payment|history/)) return aiResponses.balance;
  if (q.match(/location|near|address|where|directions|find.*location/)) return aiResponses.location;
  if (q.match(/upgrade|higher tier|elite|renew/)) return aiResponses.upgrade;
  if (q.match(/help|support|cancel|extend|issue|problem|question/)) return aiResponses.support;
  if (q.match(/refer|friend|network|mlm|income|earn|commission|passive|drive network|opportunity/)) return aiResponses.referral;
  return aiResponses.default;
}

const memberReasons = [
  { title: "Save", text: "Access member-only pricing and qualifying savings across rentals, purchases, and services." },
  { title: "Earn", text: "Earn DCP on qualifying membership payments, rentals, RTO/LTO activity, purchases, referrals, and anniversaries." },
  { title: "Build", text: "Follow a path from Hassle Free access to qualifying ownership-focused benefits over time." },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<typeof aiResponses.default | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (focused || input) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % rotatingPrompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [focused, input]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    setIsTyping(true);
    setSubmitted(true);
    setTimeout(() => {
      setResponse(getAIResponse(input));
      setIsTyping(false);
    }, 800);
  }, [input]);

  const handleChip = (chip: typeof chips[0]) => {
    setInput(chip.prompt);
    setIsTyping(true);
    setSubmitted(true);
    setTimeout(() => {
      setResponse(getAIResponse(chip.prompt));
      setIsTyping(false);
    }, 700);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    setIsTyping(true);
    setSubmitted(true);
    setTimeout(() => {
      setResponse(getAIResponse(text));
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  const handleReset = () => {
    setInput(""); setResponse(null); setSubmitted(false); setIsTyping(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative min-h-screen overflow-hidden flex flex-col"
        style={{ background: "#f5f5f5" }}
      >
        {/* Car image — bleeds right, absolute positioned */}
        <div className="absolute right-0 top-0 bottom-0 w-[55%] lg:w-[52%] pointer-events-none select-none hidden md:flex items-center justify-center overflow-hidden">
          {/* Left fade to blend with background */}
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#f5f5f5] to-transparent z-10" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f5f5f5] to-transparent z-10" />
          <img
            src="/manus-storage/hero-car-white_b6931126.png"
            alt="DreamCarz luxury vehicle"
            className="w-full h-full object-contain"
            style={{ objectPosition: "30% center", transform: "scale(1.05)" }}
          />
        </div>

        {/* Content — left side */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 lg:px-10 pt-24 pb-8">
          <div className="max-w-[520px]">

            {/* Headline */}
            <h1
              className="font-bold text-black leading-[1.0] mb-5"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.035em",
                fontSize: "clamp(3.2rem, 7vw, 5.8rem)",
              }}
            >
              Drive Your<br />Dream.
            </h1>

            {/* Subheadline */}
            <p className="text-[15px] text-gray-500 mb-7 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              <strong className="text-black font-semibold">One membership. Many freedoms.</strong><br />Save, earn, and build freedom through vehicles, rewards, and relationships.
            </p>

            {/* Prompt box — single line, reference style */}
            <div
              className={`relative bg-white rounded-2xl transition-all duration-300 mb-3 ${
                focused
                  ? "shadow-[0_0_0_2px_rgba(0,0,0,0.12),0_8px_32px_rgba(0,0,0,0.12)]"
                  : "shadow-[0_2px_20px_rgba(0,0,0,0.10)]"
              }`}
            >
              <div className="flex items-center px-4 py-3.5 gap-3">
                <Sparkles size={16} className="text-gray-300 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value); if (submitted) { setSubmitted(false); setResponse(null); } }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={rotatingPrompts[placeholderIdx]}
                  className="flex-1 bg-transparent text-[14px] text-black placeholder-gray-300 outline-none"
                  style={{ fontFamily: "var(--font-sans)" }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    input.trim()
                      ? "bg-black text-white hover:bg-gray-800 active:scale-95"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp size={15} />
                </button>
              </div>
              {/* Quick suggestions inside box */}
              <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                {quickSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[11px] text-gray-400 hover:text-black hover:border-gray-300 transition-all duration-150 active:scale-[0.97]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Response */}
            {(isTyping || response) && (
              <div className="mb-4">
                {isTyping ? (
                  <div className="flex items-center gap-1.5 py-3 px-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                ) : response ? (
                  <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <Sparkles size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-black mb-1" style={{ fontFamily: "var(--font-sans)" }}>{response.title}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed mb-3" style={{ fontFamily: "var(--font-sans)" }}>{response.body}</p>
                        <div className="flex items-center gap-3">
                          <Link href={response.href} className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                            {response.cta} <ChevronRight size={11} />
                          </Link>
                          <button onClick={handleReset} className="text-[11px] text-gray-400 hover:text-black transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                            Ask something else
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Action chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.label}
                    onClick={() => handleChip(chip)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white shadow-[0_1px_8px_rgba(0,0,0,0.08)] text-[12px] font-medium text-gray-600 hover:text-black hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-all duration-150 active:scale-[0.97]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <Icon size={13} className="text-gray-400" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats bar — bottom of hero */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-10">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 ${i > 0 ? "pl-4 md:pl-6" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{s.value}</div>
                      <div className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FLEET PREVIEW ═══════════ */}
      <section className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-2" style={{ fontFamily: "var(--font-sans)" }}>Our Fleet</p>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
                Every eligible transaction<br />can earn DCP.
              </h2>
            </div>
            <Link href="/fleet" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-black transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Honda Civic 2023", price: "$16,000", cat: "Value", img: "/manus-storage/car-budget-1_ab248f67.png" },
              { name: "Toyota Camry 2023", price: "$18,500", cat: "Value", img: "/manus-storage/car-budget-2_9d827670.png" },
              { name: "Porsche 911 Carrera", price: "$45,000", cat: "Sports", img: "/manus-storage/car-card-1_8dfc0a4a.png" },
            ].map((car, i) => (
              <Link href="/fleet" key={i} className="group block rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="bg-gray-50 p-6 flex items-center justify-center" style={{ height: "180px" }}>
                  <img src={car.img} alt={car.name} className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>{car.cat}</p>
                      <p className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{car.name}</p>
                    </div>
                    <p className="text-sm font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{car.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/fleet" className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-full text-sm font-medium text-black hover:border-gray-400 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              Browse all vehicles <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ DCP EXPLAINER ═══════════ */}
      <section className="py-24 px-6 lg:px-10 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-3" style={{ fontFamily: "var(--font-sans)" }}>DCP Program</p>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-white leading-tight mb-5" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
                Your loyalty has<br />a dollar value.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8 text-[15px]" style={{ fontFamily: "var(--font-sans)" }}>
                Earn DCP through qualifying membership payments, vehicle rentals, RTO/LTO payments, vehicle purchases, referrals, and anniversary activity — then redeem eligible points for real rewards.
              </p>
              <Link href="/calculator" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                Calculate your value <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "Year 1 Multiplier", value: "1.00x" },
                { label: "Year 2 Multiplier", value: "1.10x" },
                { label: "Year 3 Multiplier", value: "1.20x" },
                { label: "Year 5+ Multiplier", value: "1.50x" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                  <span className="font-mono text-lg font-bold text-white">{item.value}</span>
                </div>
              ))}
              <p className="text-[11px] text-gray-600 pt-2" style={{ fontFamily: "var(--font-sans)" }}>Illustrative multipliers. Subject to financial modeling and final approval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-3 text-center" style={{ fontFamily: "var(--font-sans)" }}>The Dream Carz Difference</p>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-black text-center mb-14" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Why Dream Carz.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {memberReasons.map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">Dream Carz</div>
                <p className="text-lg font-semibold text-black mb-3" style={{ fontFamily: "var(--font-display)" }}>{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 px-6 lg:px-10 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-black mb-5 leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
            Ready to start?
          </h2>
          <p className="text-gray-400 mb-8 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
            Start your freedom journey with membership beginning at $39.95 per month. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-7 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                Go to Dashboard
              </Link>
            ) : (
              <button onClick={() => window.location.assign("/login")} className="px-7 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors active:scale-[0.97]" style={{ fontFamily: "var(--font-sans)" }}>
                Get Started
              </button>
            )}
            <Link href="/membership" className="px-7 py-3 border border-gray-200 text-black text-sm font-semibold rounded-full hover:border-gray-400 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              View Memberships
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
