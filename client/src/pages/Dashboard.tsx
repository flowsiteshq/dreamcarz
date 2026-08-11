/* DreamCarz Network — Luxury AI Dashboard
 * Matches reference: sidebar nav, AI prompt bar, current vehicle hero,
 * stats cards, DCP journey, upgrade suggestion, quick actions, insights
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Car, CalendarDays, Star, CreditCard, Gift,
  MapPin, Headphones, Settings, ChevronRight, ArrowUp, Sparkles, AlertTriangle,
  TrendingUp, Zap, Shield, Bell, LogOut, Clock,
  Navigation, Gauge, Trophy, BookOpen, Phone, Compass, Network,
  UserPlus, Calculator, Menu, ClipboardCheck
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const sidebarLinks = [
  { href: "/dashboard", label: "My Account", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "My Vehicles", icon: Car },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/dashboard/rental-setup", label: "Rental Setup", icon: ClipboardCheck },
  { href: "/dashboard/membership", label: "Membership", icon: Star },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/report", label: "Report an Issue", icon: AlertTriangle },
  { href: "/dashboard/dream-journey", label: "Dream Journey", icon: Trophy },
  { href: "/dashboard/drive-network", label: "Drive Network", icon: Network },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin },
  { href: "/dashboard/support", label: "Support", icon: Headphones },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const aiPrompts = [
  "Ask DreamCarz anything...",
  "Rent a Lamborghini tomorrow",
  "Upgrade my membership",
  "Extend my rental",
  "Find me an SUV",
  "Show my balance",
];

const aiResponses: Record<string, { title: string; body: string; href: string }> = {
  rent: { title: "Let's find your next ride.", body: "Browse available vehicles and reserve your next luxury experience.", href: "/fleet" },
  upgrade: { title: "Upgrade your membership.", body: "Moving to Elite increases your DCP earning rate and unlocks exclusive vehicles.", href: "/dashboard/membership" },
  balance: { title: "Your DCP balance.", body: "You have 285,000 DCP — worth $2,850 in transportation purchasing power at your current 1.2x multiplier.", href: "/dashboard/rewards" },
  extend: { title: "Extend your rental.", body: "Contact our concierge at (301) 772-2500 to extend your current Porsche 911 rental.", href: "/dashboard/support" },
  default: { title: "I can help with that.", body: "Browse our fleet, manage your membership, or contact our concierge team for personalized assistance.", href: "/dashboard/vehicles" },
};

function getDashAIResponse(input: string) {
  const q = input.toLowerCase();
  if (q.match(/rent|book|reserve|lamborghini|ferrari|suv|car/)) return aiResponses.rent;
  if (q.match(/upgrade|elite|pro|tier|membership/)) return aiResponses.upgrade;
  if (q.match(/balance|dcp|points|savings/)) return aiResponses.balance;
  if (q.match(/extend|more days|longer/)) return aiResponses.extend;
  return aiResponses.default;
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default ${accent ? "bg-black text-white" : "bg-white border border-gray-100"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent ? "bg-white/10" : "bg-gray-50"}`}>
        <span className={accent ? "text-white" : "text-black"}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1 text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{label}</p>
        <p className={`text-2xl font-bold leading-tight ${accent ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</p>
        <p className="text-[11px] mt-0.5 text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{sub}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const rentalApplicationQuery = trpc.rentalOnboarding.getApplication.useQuery(undefined, { enabled: isAuthenticated });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState<typeof aiResponses.default | null>(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [aiFocused, setAiFocused] = useState(false);
  const aiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aiFocused || aiInput) return;
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % aiPrompts.length), 3000);
    return () => clearInterval(t);
  }, [aiFocused, aiInput]);

  const handleAI = () => {
    if (!aiInput.trim()) return;
    setAiTyping(true);
    setTimeout(() => { setAiResponse(getDashAIResponse(aiInput)); setAiTyping(false); }, 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-black border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5">
            <Car size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Member Dashboard</h2>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-sans)" }}>Sign in to access your DreamCarz member dashboard, DCP balance, and vehicle management.</p>
          <button onClick={() => startLogin()} className="w-full py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
            Sign In to Dashboard
          </button>
          <Link href="/" className="block mt-3 text-sm text-gray-400 hover:text-black transition-colors" style={{ fontFamily: "var(--font-sans)" }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Member";

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[210px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-5 h-[68px] border-b border-gray-100 flex-shrink-0">
          <img src="/manus-storage/logo-dark-mark-crop_f052e278.png" alt="DC" className="h-7 w-auto object-contain" />
          <img src="/manus-storage/logo-dark-wordmark-crop_bb978492.png" alt="DREAMCARZ" className="h-[12px] w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = link.href === "/dashboard" && location === "/dashboard";
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] font-medium transition-all duration-150 ${active ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-50"}`}
              >
                <Icon size={16} className={active ? "text-white" : "text-gray-400"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 flex-shrink-0 space-y-3">
          <div className="rounded-2xl bg-black text-white p-4 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">DCP Balance</p>
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
            <p className="text-[11px] text-gray-400 mt-0.5">$2,850 Value</p>
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-500">Transportation Power</p>
              <p className="text-[11px] font-bold text-white">$3,420</p>
            </div>
            <p className="text-[10px] text-gray-500">At 1.2x multiplier</p>
            <button className="mt-2 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              View activity <ChevronRight size={10} />
            </button>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{firstName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-black truncate">{user?.name || "Member"}</p>
              <p className="text-[10px] text-gray-400">Pro Member</p>
            </div>
            <button onClick={() => logout()} className="text-gray-300 hover:text-black transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 lg:ml-[210px] flex flex-col min-h-screen">
        {/* Membership tier color strip */}
        <div className="sticky top-0 z-20">
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg, #B8860B 0%, #D4A017 35%, #C9A84C 65%, #B8860B 100%)" }}
          />
          <header className="bg-white border-b border-gray-100 px-5 lg:px-8 flex items-center gap-4" style={{ minHeight: "68px", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-black">
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider"
                style={{ background: "linear-gradient(90deg, #B8860B, #D4A017)", color: "#fff" }}
              >
                Pro Member
              </span>
              <span className="text-[11px] text-gray-400">· Member since 2026</span>
            </div>
          </div>
          <div className={`hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 w-72 transition-all duration-200 relative ${aiFocused ? "shadow-[0_0_0_2px_rgba(0,0,0,0.1)] bg-white" : ""}`}>
            <Sparkles size={14} className="text-gray-300 flex-shrink-0" />
            <input
              ref={aiRef}
              type="text"
              value={aiInput}
              onChange={e => { setAiInput(e.target.value); setAiResponse(null); }}
              onFocus={() => setAiFocused(true)}
              onBlur={() => setTimeout(() => setAiFocused(false), 200)}
              onKeyDown={e => e.key === "Enter" && handleAI()}
              placeholder={aiPrompts[placeholderIdx]}
              className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none"
            />
            <button onClick={handleAI} disabled={!aiInput.trim()} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${aiInput.trim() ? "bg-black text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              <ArrowUp size={13} />
            </button>
            {(aiTyping || aiResponse) && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                {aiTyping ? (
                  <div className="flex gap-1.5 py-2">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                  </div>
                ) : aiResponse ? (
                  <div>
                    <p className="text-[13px] font-semibold text-black mb-1">{aiResponse.title}</p>
                    <p className="text-[12px] text-gray-500 mb-3">{aiResponse.body}</p>
                    <div className="flex items-center gap-2">
                      <Link href={aiResponse.href} className="px-3 py-1.5 bg-black text-white text-[11px] font-semibold rounded-full inline-flex items-center gap-1">Go <ChevronRight size={10} /></Link>
                      <button onClick={() => { setAiResponse(null); setAiInput(""); }} className="text-[11px] text-gray-400 hover:text-black">Dismiss</button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </header>
        </div>

        <main className="flex-1 p-5 lg:p-8 space-y-6">
          {/* Current vehicle + upgrade — FIRST, hero of the dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #000 100%)", minHeight: "280px" }}>
              <div className="absolute inset-0 opacity-50">
                <img src="/manus-storage/dash-car-current_6e167bf1.png" alt="2024 Porsche 911 Carrera S" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 p-6 flex flex-col" style={{ minHeight: "280px" }}>
                <div className="flex items-start justify-between mb-auto">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Your Current Vehicle</p>
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>2024 Porsche 911 Carrera S</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400"><BookOpen size={11} /> Deluxe Plan</span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={11} /> Renews Jun 28, 2026</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 border border-white/30 text-white text-[11px] font-medium rounded-full hover:bg-white/10 transition-colors flex-shrink-0">View Details</button>
                </div>
                <div className="mt-auto pt-6">
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "DISCOUNT", value: "15%" },
                      { label: "DAILY RATE", value: "$245" },
                      { label: "DAYS REM.", value: "18" },
                      { label: "TOTAL DRIVEN", value: "1,247 mi" },
                    ].map((s, i) => (
                      <div key={i}>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">{s.label}</p>
                        <p className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="px-4 py-2 bg-white text-black text-[12px] font-semibold rounded-full hover:bg-gray-100 transition-colors active:scale-[0.97]">Manage Reservation</button>
                    <button className="px-4 py-2 border border-white/30 text-white text-[12px] font-medium rounded-full hover:bg-white/10 transition-colors">Extend Rental</button>
                    <button className="px-4 py-2 border border-white/30 text-white text-[12px] font-medium rounded-full hover:bg-white/10 transition-colors hidden sm:block">Swap Vehicle</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Suggested Upgrade</p>
                <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-full border border-gray-100">Popular</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Porsche 911 Turbo S</h3>
              <p className="text-[12px] text-gray-400 mb-3">More power. More exhilaration.<br />Elevate your drive.</p>
              <div className="flex-1 flex items-center justify-center py-2">
                <img src="/manus-storage/dash-car-upgrade_fe8b1f8d.png" alt="Porsche 911 Turbo S" className="w-full max-h-28 object-contain" />
              </div>
              <div className="space-y-1.5 my-3">
                {[
                  { icon: <Gauge size={12} />, text: "640 HP" },
                  { icon: <Zap size={12} />, text: "0-60 in 2.6s" },
                  { icon: <Navigation size={12} />, text: "All-Wheel Drive" },
                  { icon: <Clock size={12} />, text: "Available Now" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-gray-500">
                    <span className="text-gray-400">{f.icon}</span> {f.text}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button className="flex-1 py-2 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors active:scale-[0.97]">Upgrade Now</button>
                <button className="flex-1 py-2 border border-gray-200 text-black text-[12px] font-medium rounded-full hover:border-gray-400 transition-colors">View Details</button>
              </div>
            </div>
          </div>

          {!rentalApplicationQuery.isLoading && !["under_review", "approved"].includes(rentalApplicationQuery.data?.application?.status || "not_started") && (
            <Link href="/dashboard/rental-setup" className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between rounded-2xl border border-[#efdfaa] bg-[#fffbef] px-5 py-4 hover:border-[#d6b554] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-black text-white flex items-center justify-center"><ClipboardCheck size={18} /></div>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#a7770c]">Rental access</p>
                  <p className="mt-0.5 text-sm font-bold text-black">Complete your secure rental setup</p>
                  <p className="mt-1 text-[12px] leading-5 text-gray-500">Verify your profile once to make every future reservation faster.</p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[12px] font-semibold text-white group-hover:bg-gray-800">Start setup <ChevronRight size={14} /></span>
            </Link>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<TrendingUp size={18} />} label="DCP Earned" value="425,000" sub="Lifetime total" />
            <StatCard icon={<Zap size={18} />} label="Current DCP" value="285,000" sub="Available balance" />
            <StatCard icon={<Car size={18} />} label="Transportation Power" value="$3,420" sub="At 1.2x multiplier" />
            <StatCard icon={<Shield size={18} />} label="Actual Savings" value="$3,840" sub="Realized to date" accent />
          </div>

          {/* DCP Journey + Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Your DCP Journey</h3>
                <button className="text-[11px] text-gray-400 hover:text-black transition-colors flex items-center gap-1">View Full Breakdown <ChevronRight size={11} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Membership Payments", value: 128000, max: 200000, dcp: "128,000 DCP" },
                  { label: "Vehicle Transactions", value: 180000, max: 200000, dcp: "180,000 DCP" },
                  { label: "Rental Activity", value: 85000, max: 200000, dcp: "85,000 DCP" },
                  { label: "Good-Standing Bonus", value: 40000, max: 200000, dcp: "40,000 DCP" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-gray-600">{item.label}</span>
                      <span className="text-[12px] font-semibold text-black font-mono">{item.dcp}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Upcoming Reservation</h3>
                <button className="text-[11px] text-gray-400 hover:text-black transition-colors">View All</button>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src="/manus-storage/dash-car-reservation_63adc66d.png" alt="Range Rover" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-black">2024 Range Rover Sport SE</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Reservation #DC789456</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                    <CalendarDays size={11} /> May 24 – May 28, 2026
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                    <MapPin size={11} /> Lanham, MD
                  </div>
                </div>
              </div>
              <button className="w-full py-2 border border-gray-200 text-black text-[12px] font-medium rounded-full hover:border-gray-400 transition-colors">View Reservation</button>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h4 className="text-[12px] font-semibold text-black mb-3">Quick Actions</h4>
                <div className="space-y-1">
                  {[
                    { icon: Car, label: "Browse the Fleet", href: "/fleet" },
                    { icon: Calculator, label: "Calculate Your Value", href: "/dashboard/rewards" },
                    { icon: Star, label: "Upgrade Membership", href: "/dashboard/membership" },
                    { icon: UserPlus, label: "Refer a Friend", href: "/contact" },
                  ].map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <Link key={i} href={a.href} className="flex items-center justify-between py-2 text-[12px] text-gray-600 hover:text-black transition-colors group">
                        <div className="flex items-center gap-2">
                          <Icon size={13} className="text-gray-400 group-hover:text-black transition-colors" />
                          {a.label}
                        </div>
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-black transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Power Growth */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Redemption Power Growth</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Multipliers increase the value of your DCP and savings over time.</p>
              </div>
              <button className="text-[11px] text-gray-400 hover:text-black transition-colors flex items-center gap-1">Learn More <ChevronRight size={11} /></button>
            </div>
            <div className="flex items-end gap-3 h-28">
              {[
                { year: "Year 1", mult: "1x", pct: 40 },
                { year: "Year 2", mult: "1.1x", pct: 52 },
                { year: "Year 3", mult: "1.2x", pct: 64 },
                { year: "Year 4", mult: "1.35x", pct: 78 },
                { year: "Year 5+", mult: "1.5x", pct: 100 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-gray-500">{bar.mult}</span>
                  <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${bar.pct}%`, background: i === 4 ? "#000" : "#e5e5e5" }} />
                  <span className="text-[10px] text-gray-400">{bar.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-black rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <h3 className="text-[14px] font-bold" style={{ fontFamily: "var(--font-display)" }}>AI Insights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "You could save $320/month by upgrading to Elite.",
                "The Porsche Taycan becomes available tomorrow.",
                "You've earned enough DCP for a free weekend rental.",
                "Your Transportation Power increased 6% this month.",
                "You qualify for Elite membership — upgrade today.",
                "18 days left on your current rental. Extend now.",
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0" />
                  <p className="text-[12px] text-gray-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[15px] font-bold text-black mb-5" style={{ fontFamily: "var(--font-display)" }}>Loyalty Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-5">
                {[
                  { label: "Joined DreamCarz", date: "January 2026", icon: Star, done: true },
                  { label: "First Rental — Porsche 911", date: "February 2026", icon: Car, done: true },
                  { label: "Pro Upgrade", date: "March 2026", icon: TrendingUp, done: true },
                  { label: "5 Vehicles Driven", date: "May 2026", icon: Trophy, done: true },
                  { label: "Elite Qualification", date: "Upcoming", icon: Shield, done: false },
                  { label: "Credit Free Milestone", date: "Projected 2027", icon: Zap, done: false },
                ].map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 pl-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${event.done ? "bg-black" : "bg-gray-100 border-2 border-dashed border-gray-300"}`}>
                        <Icon size={14} className={event.done ? "text-white" : "text-gray-400"} />
                      </div>
                      <div>
                        <p className={`text-[13px] font-semibold ${event.done ? "text-black" : "text-gray-400"}`}>{event.label}</p>
                        <p className="text-[11px] text-gray-400">{event.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
