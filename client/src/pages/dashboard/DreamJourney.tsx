/**
 * DreamCarz — Dream Journey
 * Premium redesign matching the reference: horizontal car carousel with real photos,
 * Journey Progress, Upcoming Reservation, Transportation Power Growth, Suggested Upgrade,
 * credit score in stats, full dashboard shell layout.
 */
import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  Search, ChevronRight, ChevronLeft, Trophy, Star, Zap, Target, TrendingUp,
  CheckCircle2, Lock, Award, Flame, Shield, Crown, Sparkles, ArrowRight,
  Calendar, MapPin, DollarSign, Gauge, CreditCard, BarChart3, Car,
} from "lucide-react";

// ── Car catalog ──────────────────────────────────────────────────────────
const dreamCars = [
  { id: "lambo-huracan", make: "LAMBORGHINI", model: "Huracán EVO", price: 280000, category: "Supercar", inNetwork: true, img: "/manus-storage/dj-lambo_83afae81.png" },
  { id: "ferrari-488", make: "FERRARI", model: "488 GTB", price: 330000, category: "Supercar", inNetwork: true, img: "/manus-storage/dj-ferrari_145a6fc1.png" },
  { id: "porsche-turbo", make: "PORSCHE", model: "911 Turbo S", price: 230000, category: "Sports", inNetwork: true, img: "/manus-storage/dj-porsche_224406e9.png" },
  { id: "mclaren-720s", make: "MCLAREN", model: "720S", price: 310000, category: "Supercar", inNetwork: true, img: "/manus-storage/dj-mclaren_c0411a69.png" },
  { id: "rr-ghost", make: "ROLLS-ROYCE", model: "Ghost", price: 380000, category: "Luxury", inNetwork: true, img: "/manus-storage/dj-rr_7b2d3902.png" },
  { id: "bentley-cont", make: "BENTLEY", model: "Continental GT", price: 250000, category: "Luxury", inNetwork: true, img: "/manus-storage/dj-bentley_b91a77f9.png" },
  { id: "bugatti-chiron", make: "BUGATTI", model: "Chiron", price: 3200000, category: "Hypercar", inNetwork: false, img: "/manus-storage/dj-bugatti_96f9ca77.png" },
  { id: "tesla-roadster", make: "TESLA", model: "Roadster 2025", price: 250000, category: "Electric", inNetwork: false, img: "/manus-storage/dj-porsche_224406e9.png" },
];

const categories = ["All", "Supercar", "Hypercar", "Sports", "Luxury", "Electric"];

function fmt(n: number) { return "$" + n.toLocaleString(); }

// ── Badges ───────────────────────────────────────────────────────────────
const badges = [
  { id: "first-drive", icon: Car, label: "First Drive", desc: "Complete your first rental", earned: true, xp: 100 },
  { id: "week-1", icon: Calendar, label: "Week 1 Member", desc: "Active for 7 days", earned: true, xp: 150 },
  { id: "dcp-1k", icon: Zap, label: "DCP Starter", desc: "Earn 1,000 DCP", earned: true, xp: 200 },
  { id: "dcp-100k", icon: Star, label: "DCP Centurion", desc: "Earn 100,000 DCP", earned: true, xp: 500 },
  { id: "dcp-250k", icon: Trophy, label: "DCP Elite", desc: "Earn 250,000 DCP", earned: true, xp: 1000 },
  { id: "referral-1", icon: Award, label: "Ambassador", desc: "Refer your first member", earned: false, xp: 300 },
  { id: "6-month", icon: Shield, label: "6-Month Loyal", desc: "Active for 6 months", earned: false, xp: 750 },
  { id: "credit-ready", icon: CheckCircle2, label: "Credit Ready", desc: "Meet Credit Free requirements", earned: false, xp: 1500 },
  { id: "dream-25", icon: Target, label: "Quarter Way", desc: "25% to your dream car", earned: false, xp: 500 },
  { id: "dream-50", icon: TrendingUp, label: "Halfway There", desc: "50% to your dream car", earned: false, xp: 1000 },
  { id: "dream-75", icon: Flame, label: "Almost There", desc: "75% to your dream car", earned: false, xp: 2000 },
  { id: "dream-100", icon: Crown, label: "Dream Achieved", desc: "Reach your dream car goal", earned: false, xp: 5000 },
];

const challenges = [
  { label: "Refer a Friend", reward: "2,000 DCP", deadline: "3 days left", progress: 0, max: 1, icon: Award },
  { label: "Complete Your Profile", reward: "500 DCP", deadline: "Ongoing", progress: 3, max: 5, icon: CheckCircle2 },
  { label: "Extend Your Current Rental", reward: "1,500 DCP", deadline: "5 days left", progress: 0, max: 1, icon: Calendar },
  { label: "Rate Your Experience", reward: "250 DCP", deadline: "2 days left", progress: 0, max: 1, icon: Star },
];

export default function DreamJourney() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedCar, setSelectedCar] = useState<typeof dreamCars[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "badges" | "challenges">("progress");
  const carouselRef = useRef<HTMLDivElement>(null);

  const filtered = dreamCars.filter(c => {
    const matchSearch = (c.make + " " + c.model).toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "All" || c.category === filter;
    return matchSearch && matchCat;
  });

  const scroll = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const currentDcp = 285000;
  const dcpValue = currentDcp * 0.01;
  const car = selectedCar || dreamCars[0];
  const targetAmount = car.price * 0.15;
  const dcpProgress = Math.min((dcpValue / targetAmount) * 100, 100);
  const creditScore = 712;

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);
  const totalXP = earnedBadges.reduce((s, b) => s + b.xp, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Dream Journey</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Pro Member</span>
              <span className="text-[12px] text-gray-400">· Member since 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 w-72">
              <Sparkles size={14} className="text-gray-400" />
              <span className="text-[13px] text-gray-400">Ask DreamCarz anything...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "DCP Balance", value: "285,000", sub: "$2,850 Value", icon: Zap, color: "text-amber-500" },
            { label: "Transportation Power", value: "$3,420", sub: "At 1.2x multiplier", icon: TrendingUp, color: "text-blue-500" },
            { label: "Credit Score", value: creditScore.toString(), sub: creditScore >= 740 ? "Excellent — Credit Ready" : creditScore >= 700 ? "Good — Keep Building" : "Fair — Needs Work", icon: CreditCard, color: creditScore >= 740 ? "text-green-500" : creditScore >= 700 ? "text-amber-500" : "text-red-500" },
            { label: "Dream Meter", value: `${dcpProgress.toFixed(0)}%`, sub: `${fmt(Math.max(targetAmount - dcpValue, 0))} remaining`, icon: Target, color: "text-purple-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{s.label}</p>
                <s.icon size={14} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
              {s.label === "Credit Score" && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(((creditScore - 300) / 550) * 100, 100)}%`, background: creditScore >= 740 ? "#22c55e" : creditScore >= 700 ? "#f59e0b" : "#ef4444" }} />
                </div>
              )}
              {s.label === "Dream Meter" && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${dcpProgress}%`, background: "linear-gradient(90deg,#B8860B,#FFD700)" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Car selector ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>What's Your Dream Car?</h2>
            <p className="text-gray-400 text-sm">Choose any car — in our fleet or beyond. We'll build your path to it.</p>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any make or model..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm text-black placeholder-gray-400 outline-none border border-gray-100 focus:border-gray-300 transition-colors" />
            </div>
            <button className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-yellow-400" />
            </button>
          </div>

          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${filter === c ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Horizontal carousel */}
          <div className="relative">
            <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <ChevronLeft size={16} />
            </button>
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {filtered.map(car => (
                <button key={car.id} onClick={() => setSelectedCar(car)}
                  className={`flex-shrink-0 w-72 rounded-2xl border-2 transition-all overflow-hidden text-left ${selectedCar?.id === car.id ? "border-black shadow-lg" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"}`}>
                  <div className="bg-gray-50 p-4 pb-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{car.make}</p>
                    <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{car.model}</p>
                    <p className="text-[12px] text-gray-400 mb-2">{fmt(car.price)} · {car.category}</p>
                    <img src={car.img} alt={car.model} className="w-full h-36 object-contain" />
                  </div>
                  <div className="px-4 py-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${car.inNetwork ? "bg-green-500" : "bg-amber-400"}`} />
                      <span className="text-[12px] font-semibold text-gray-600">{car.inNetwork ? "In DreamCarz Fleet" : "Out of Network"}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Journey Progress + Upcoming Reservation ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Journey Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-black">Your Journey Progress</h3>
              <button className="text-[12px] text-gray-400 hover:text-black flex items-center gap-1">View full breakdown <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Membership Payments", dcp: "120,000 DCP", pct: 75 },
                { label: "Vehicle Transactions", dcp: "180,000 DCP", pct: 90 },
                { label: "Rental Activity", dcp: "85,000 DCP", pct: 55 },
                { label: "Loyalty & Bonuses", dcp: "40,000 DCP", pct: 35 },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {i === 0 ? <CreditCard size={10} className="text-gray-500" /> : i === 1 ? <Car size={10} className="text-gray-500" /> : i === 2 ? <Gauge size={10} className="text-gray-500" /> : <Star size={10} className="text-gray-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] text-gray-600">{row.label}</p>
                      <p className="text-[12px] font-bold text-black">{row.dcp}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Reservation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-black">Upcoming Reservation</h3>
              <Link href="/dashboard/reservations" className="text-[12px] text-gray-400 hover:text-black flex items-center gap-1">View all <ArrowRight size={12} /></Link>
            </div>
            <div className="flex gap-4 mb-4">
              <img src="/manus-storage/dj-rr_7b2d3902.png" alt="Range Rover" className="w-28 h-20 object-contain bg-gray-50 rounded-xl flex-shrink-0" />
              <div>
                <p className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>2024 Range Rover Sport SE</p>
                <p className="text-[12px] text-gray-400 mb-2">Reservation #DC789456</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={12} className="text-gray-400" />
                  <p className="text-[12px] text-gray-600">May 24 – May 28, 2026</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-gray-400" />
                  <p className="text-[12px] text-gray-600">Lanham, MD</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard/reservations"
              className="block w-full py-2.5 bg-black text-white text-[13px] font-bold rounded-xl text-center hover:bg-gray-900 transition-colors">
              View Reservation
            </Link>
          </div>
        </div>

        {/* ── Transportation Power Growth + Suggested Upgrade ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Transportation Power Growth */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-black">Transportation Power Growth</h3>
            </div>
            <div className="flex items-end gap-3 mb-4">
              {[
                { label: "Year 1", mult: "1x", h: 30 },
                { label: "Year 2", mult: "1.1x", h: 45 },
                { label: "Year 3", mult: "1.2x", h: 60 },
                { label: "Year 4", mult: "1.35x", h: 75 },
                { label: "Year 5+", mult: "1.5x", h: 100, active: true },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[11px] font-bold text-gray-500">{bar.mult}</p>
                  <div className={`w-full rounded-t-lg transition-all ${bar.active ? "bg-black" : "bg-gray-200"}`} style={{ height: `${bar.h * 0.8}px` }} />
                  <p className="text-[10px] text-gray-400">{bar.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-gray-400">Your Transportation Power multiplies the value of every dollar you spend.</p>
            <button className="mt-3 text-[12px] font-semibold text-black flex items-center gap-1 hover:gap-2 transition-all">Learn more <ArrowRight size={12} /></button>
          </div>

          {/* Suggested Upgrade */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-black">Suggested Upgrade for You</h3>
              <span className="text-[10px] font-bold text-white bg-black px-2.5 py-1 rounded-full uppercase tracking-wider">AI Recommended</span>
            </div>
            <div className="flex gap-4 mb-4">
              <img src="/manus-storage/dj-porsche-upgrade_2e580512.png" alt="Porsche 911 Turbo S" className="w-28 h-20 object-contain bg-gray-50 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Porsche 911 Turbo S</p>
                <p className="text-[12px] text-gray-400 mb-2">More power. More exhilaration.</p>
                <div className="space-y-1">
                  {[
                    { label: "Price difference", val: "+$80,000" },
                    { label: "Est. monthly difference", val: "+$149/mo" },
                    { label: "Transportation Power", val: "+15% more DCP" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {i === 0 ? <DollarSign size={10} className="text-gray-400" /> : i === 1 ? <CreditCard size={10} className="text-gray-400" /> : <Zap size={10} className="text-gray-400" />}
                        <p className="text-[11px] text-gray-400">{row.label}</p>
                      </div>
                      <p className="text-[11px] font-bold text-black">{row.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-900 transition-colors">Upgrade Now</button>
              <button className="flex-1 py-2.5 bg-white text-black text-[13px] font-bold rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">Compare Vehicles</button>
            </div>
          </div>
        </div>

        {/* ── Badges / Challenges tabs ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5 w-fit">
            {(["progress", "badges", "challenges"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors ${activeTab === t ? "bg-white text-black shadow-sm" : "text-gray-500"}`}>
                {t === "badges" ? `Badges (${earnedBadges.length}/${badges.length})` : t === "progress" ? "Milestones" : "Challenges"}
              </button>
            ))}
          </div>

          {activeTab === "progress" && (
            <div className="space-y-3">
              {[
                { pct: 10, label: "Journey Begins", reward: "500 DCP bonus", done: dcpProgress >= 10 },
                { pct: 25, label: "Quarter Way", reward: "1,500 DCP + Quarter Way badge", done: dcpProgress >= 25 },
                { pct: 50, label: "Halfway There", reward: "3,000 DCP + Halfway badge + tier discount", done: dcpProgress >= 50 },
                { pct: 75, label: "Almost There", reward: "5,000 DCP + Almost There badge", done: dcpProgress >= 75 },
                { pct: 100, label: "Dream Achieved! 🎉", reward: "10,000 DCP + Dream Achieved badge + exclusive event invite", done: dcpProgress >= 100 },
              ].map((m, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${m.done ? "border-green-100 bg-green-50" : "border-gray-100"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.done ? "bg-green-500" : "bg-gray-100"}`}>
                    {m.done ? <CheckCircle2 size={14} className="text-white" /> : <Lock size={14} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-[13px] font-bold ${m.done ? "text-green-700" : "text-black"}`}>{m.label}</p>
                      <span className="text-[11px] font-bold text-gray-400">{m.pct}%</span>
                    </div>
                    <p className="text-[11px] text-amber-600 font-semibold mt-0.5">🎁 {m.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "badges" && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Earned ({earnedBadges.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {earnedBadges.map(b => (
                    <div key={b.id} className="flex flex-col items-center gap-1.5 p-3 bg-yellow-50 border border-yellow-100 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <b.icon size={18} className="text-yellow-500" />
                      </div>
                      <p className="text-[11px] font-bold text-black text-center leading-tight">{b.label}</p>
                      <p className="text-[10px] text-yellow-600 font-semibold">+{b.xp} XP</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Locked ({lockedBadges.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {lockedBadges.map(b => (
                    <div key={b.id} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 border border-gray-100 rounded-2xl opacity-60">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <Lock size={14} className="text-gray-400" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 text-center leading-tight">{b.label}</p>
                      <p className="text-[10px] text-gray-400 text-center">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "challenges" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenges.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <c.icon size={16} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[13px] font-bold text-black">{c.label}</p>
                      <span className="text-[11px] font-bold text-amber-600">{c.reward}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">{c.deadline}</p>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${(c.progress / c.max) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{c.progress}/{c.max} completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
