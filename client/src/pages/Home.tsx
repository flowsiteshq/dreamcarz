/* DreamCarz Network — AI-First Homepage
 * Apple + Tesla + ChatGPT aesthetic
 * Centered AI prompt as primary interface
 * Minimal. Elegant. Premium.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUp, Sparkles, ChevronRight, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

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

const chips = [
  { label: "Rent a Car", prompt: "I'd like to rent a car.", href: "/fleet" },
  { label: "Buy a Car", prompt: "Help me buy my next vehicle.", href: "/fleet" },
  { label: "Sell My Car", prompt: "I want to sell my car through DreamCarz.", href: "/host" },
  { label: "Memberships", prompt: "Show me membership options.", href: "/membership" },
  { label: "My Account", prompt: "Show my account and DCP balance.", href: "/dashboard" },
  { label: "Locations", prompt: "Find a DreamCarz location near me.", href: "/contact" },
  { label: "Reservations", prompt: "Show my active reservations.", href: "/dashboard" },
  { label: "Support", prompt: "I need help with something.", href: "/contact" },
];

// AI workflow responses
const aiResponses: Record<string, { title: string; body: string; cta: string; href: string }> = {
  rent: {
    title: "Let's find your perfect ride.",
    body: "Browse our full fleet — from everyday value vehicles to exotic supercars. Every rental earns DCP Transportation Purchasing Power.",
    cta: "Browse Fleet",
    href: "/fleet",
  },
  buy: {
    title: "Ready to own your dream car?",
    body: "Our Lease-to-Own program lets you drive the vehicle while building equity. DCP points apply toward your purchase.",
    cta: "Explore Lease-to-Own",
    href: "/agent",
  },
  sell: {
    title: "Turn your car into income.",
    body: "Join our Host Program. You own the car — we bring the business. Earn program fees and DCP on every rental.",
    cta: "Become a Host",
    href: "/host",
  },
  membership: {
    title: "Choose your membership tier.",
    body: "Freedom, Plus, Pro, or Elite. Every tier earns DCP points that grow your transportation purchasing power over time.",
    cta: "View Memberships",
    href: "/membership",
  },
  balance: {
    title: "Your DCP balance is waiting.",
    body: "Sign in to view your current DCP balance, redemption power, member value ratio, and full account history.",
    cta: "Go to Dashboard",
    href: "/dashboard",
  },
  location: {
    title: "We're in Lanham, MD.",
    body: "10001 Derekwood Ln, Suite 204, Lanham, MD 20706. Open Mon–Fri 9am–6pm, Saturday 9am–3pm. Call (301) 772-2500.",
    cta: "Get Directions",
    href: "/contact",
  },
  upgrade: {
    title: "Upgrade your membership.",
    body: "Moving to a higher tier increases your DCP earning rate, unlocks exclusive vehicles, and accelerates your path to Credit Free.",
    cta: "Compare Tiers",
    href: "/membership",
  },
  support: {
    title: "We're here to help.",
    body: "Reach our team at (301) 772-2500 or info@dreamcarz.com. Mon–Fri 9am–6pm, Saturday 9am–3pm.",
    cta: "Contact Us",
    href: "/contact",
  },
  default: {
    title: "Let me help you with that.",
    body: "Browse our fleet, explore membership tiers, or contact our team directly. DreamCarz is here to make your automotive experience effortless.",
    cta: "Browse Fleet",
    href: "/fleet",
  },
};

function getAIResponse(input: string) {
  const q = input.toLowerCase();
  if (q.match(/rent|drive|book|reserve|weekend|tomorrow|lamborghini|ferrari|porsche|corvette|bmw|mercedes|exotic|suv|car for/)) return aiResponses.rent;
  if (q.match(/buy|purchase|own|finance|lease.to.own|next vehicle/)) return aiResponses.buy;
  if (q.match(/sell|host|income|list my car/)) return aiResponses.sell;
  if (q.match(/membership|tier|freedom|plus|pro|elite|join|enroll/)) return aiResponses.membership;
  if (q.match(/balance|dcp|points|account|invoice|payment|history/)) return aiResponses.balance;
  if (q.match(/location|near|address|where|directions|find.*location/)) return aiResponses.location;
  if (q.match(/upgrade|higher tier|elite|renew/)) return aiResponses.upgrade;
  if (q.match(/help|support|cancel|extend|issue|problem|question/)) return aiResponses.support;
  return aiResponses.default;
}

const stats = [
  { value: "500+", label: "Vehicles" },
  { value: "24/7", label: "Support" },
  { value: "4", label: "Membership Tiers" },
  { value: "MD", label: "Lanham, MD" },
];

const testimonials = [
  { text: "The DCP program is unlike anything I've seen. I've been a Pro member for 8 months and my transportation purchasing power has grown significantly.", name: "Marcus T.", tier: "Pro Member" },
  { text: "Renting through DreamCarz feels completely different. It's not just a rental — it's an investment in your future vehicle ownership.", name: "Priya S.", tier: "Elite Member" },
  { text: "The fleet is incredible. I drove a Porsche 911 last weekend and the whole experience from booking to return was seamless.", name: "James R.", tier: "Plus Member" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<typeof aiResponses.default | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Rotate placeholder text
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
    }, 900);
  }, [input]);

  const handleChip = (chip: typeof chips[0]) => {
    setInput(chip.prompt);
    setIsTyping(true);
    setSubmitted(true);
    setTimeout(() => {
      setResponse(getAIResponse(chip.prompt));
      setIsTyping(false);
    }, 700);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setInput("");
    setResponse(null);
    setSubmitted(false);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ═══════════ HERO — AI PROMPT CENTER ═══════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-5 pt-16 pb-12 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,0,0,0.03),transparent)] pointer-events-none" />

        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 text-[11px] font-medium text-gray-500 mb-8 tracking-wider uppercase" style={{ fontFamily: "var(--font-sans)" }}>
            <Sparkles size={11} className="text-gray-400" />
            AI Concierge
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(2.8rem,8vw,5rem)] font-bold text-black leading-[1.05] tracking-tight mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            Drive Your Dream.
          </h1>

          {/* Subheadline */}
          <p
            className="text-[clamp(1rem,2.5vw,1.2rem)] text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-sans)", fontWeight: 400 }}
          >
            Tell DreamCarz what you want to do.<br className="hidden sm:block" /> We'll handle the rest.
          </p>

          {/* AI Prompt Box */}
          <div
            className={`relative w-full rounded-2xl transition-all duration-300 ${
              focused
                ? "shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_8px_40px_rgba(0,0,0,0.10)]"
                : "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_20px_rgba(0,0,0,0.06)]"
            } bg-white`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); if (submitted) { setSubmitted(false); setResponse(null); } }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={rotatingPrompts[placeholderIdx]}
              rows={1}
              className="w-full resize-none bg-transparent px-5 pt-4 pb-14 text-[15px] text-black placeholder-gray-300 outline-none leading-relaxed rounded-2xl"
              style={{ fontFamily: "var(--font-sans)", minHeight: "80px", maxHeight: "200px" }}
            />
            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3.5">
              <span className="text-[11px] text-gray-300" style={{ fontFamily: "var(--font-sans)" }}>
                Press Enter to send
              </span>
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  input.trim()
                    ? "bg-black text-white hover:bg-gray-800 active:scale-95"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <ArrowUp size={15} />
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChip(chip)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200 text-[12px] font-medium text-gray-500 hover:border-gray-400 hover:text-black transition-all duration-150 active:scale-[0.97] bg-white"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* AI Response */}
          {(isTyping || response) && (
            <div className="mt-6 w-full">
              {isTyping ? (
                <div className="flex items-center justify-center gap-1.5 py-6">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              ) : response ? (
                <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                        {response.title}
                      </p>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3" style={{ fontFamily: "var(--font-sans)" }}>
                        {response.body}
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          href={response.href}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-900 transition-colors"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {response.cta} <ChevronRight size={12} />
                        </Link>
                        <button
                          onClick={handleReset}
                          className="text-xs text-gray-400 hover:text-black transition-colors"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          Ask something else
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        {!submitted && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-300" />
          </div>
        )}
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="border-y border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-black mb-0.5" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-sans)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FLEET PREVIEW ═══════════ */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-2" style={{ fontFamily: "var(--font-sans)" }}>Our Fleet</p>
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
                Every vehicle earns<br />purchasing power.
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
      <section className="py-24 px-5 bg-black text-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-3" style={{ fontFamily: "var(--font-sans)" }}>DCP Program</p>
              <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold text-white leading-tight mb-5" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
                Your loyalty has<br />a dollar value.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8 text-[15px]" style={{ fontFamily: "var(--font-sans)" }}>
                Every membership payment, vehicle transaction, and rental earns DCP — Dream Carz Points that grow into real transportation purchasing power. The longer you stay, the more powerful your membership becomes.
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
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-3 text-center" style={{ fontFamily: "var(--font-sans)" }}>Member Stories</p>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold text-black text-center mb-14" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Trusted by members.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-black text-black" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5" style={{ fontFamily: "var(--font-sans)" }}>"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{t.name}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>{t.tier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 px-5 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-black mb-5 leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
            Ready to start?
          </h2>
          <p className="text-gray-400 mb-8 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
            Join DreamCarz Network and turn every drive into an investment in your future vehicle ownership.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-7 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                Go to Dashboard
              </Link>
            ) : (
              <button onClick={() => startLogin()} className="px-7 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors active:scale-[0.97]" style={{ fontFamily: "var(--font-sans)" }}>
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
