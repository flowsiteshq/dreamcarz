/**
 * DreamCarz — Dream Journey
 * Premium page matching the reference design.
 */
import { useState, useRef } from "react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";
import {
  Search, ChevronRight, ChevronLeft, Trophy, Star, Zap, Target, TrendingUp,
  CheckCircle2, Lock, Award, Flame, Shield, Crown, Sparkles, ArrowRight,
  Calendar, MapPin, DollarSign, Gauge, CreditCard, Car,
} from "lucide-react";

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

function fmt(n: number) { return "$" + n.toLocaleString(); }

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

  const milestones = [
    { pct: 10, label: "Journey Begins", reward: "500 DCP bonus", done: dcpProgress >= 10 },
    { pct: 25, label: "Quarter Way", reward: "1,500 DCP + Quarter Way badge", done: dcpProgress >= 25 },
    { pct: 50, label: "Halfway There", reward: "3,000 DCP + Halfway badge + tier discount", done: dcpProgress >= 50 },
    { pct: 75, label: "Almost There", reward: "5,000 DCP + Almost There badge", done: dcpProgress >= 75 },
    { pct: 100, label: "Dream Achieved! 🎉", reward: "10,000 DCP + Dream Achieved badge + exclusive event invite", done: dcpProgress >= 100 },
  ];

  return (
    <DashboardShell title="Dream Journey">
      <div className="space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">DCP Balance</p>
              <Zap size={14} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
            <p className="text-[11px] text-gray-400 mt-0.5">$2,850 Value</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Transportation Power</p>
              <TrendingUp size={14} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>$3,420</p>
            <p className="text-[11px] text-gray-400 mt-0.5">At 1.2x multiplier</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Credit Score</p>
              <CreditCard size={14} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{creditScore}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Good — Keep Building</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(((creditScore - 300) / 550) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Dream Meter</p>
              <Target size={14} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{dcpProgress.toFixed(0)}%</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{fmt(Math.max(targetAmount - dcpValue, 0))} remaining</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${dcpProgress}%`, background: "linear-gradient(90deg,#B8860B,#FFD700)" }} />
            </div>
          </div>
        </div>

        {/* Car selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>What's Your Dream Car?</h2>
            <p className="text-gray-400 text-sm">Choose any car — in our fleet or beyond. We'll build your path to it.</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search any make or model..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm text-black placeholder-gray-400 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
            <button className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-yellow-400" />
            </button>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${filter === c ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
            >
              <ChevronLeft size={16} />
            </button>
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCar(c)}
                  className={`flex-shrink-0 w-64 rounded-2xl border-2 transition-all overflow-hidden text-left ${selectedCar?.id === c.id ? "border-black shadow-lg" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"}`}
                >
                  <div className="bg-gray-50 p-4 pb-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.make}</p>
                    <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{c.model}</p>
                    <p className="text-[12px] text-gray-400 mb-2">{fmt(c.price)} · {c.category}</p>
                    <img src={c.img} alt={c.model} className="w-full h-32 object-contain" />
                  </div>
                  <div className="px-4 py-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${c.inNetwork ? "bg-green-500" : "bg-amber-400"}`} />
                      <span className="text-[12px] font-semibold text-gray-600">{c.inNetwork ? "In DreamCarz Fleet" : "Out of Network"}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Journey Progress + Upcoming Reservation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-black">Your Journey Progress</h3>
              <button className="text-[12px] text-gray-400 hover:text-black flex items-center gap-1">
                View full breakdown <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Membership Payments", dcp: "120,000 DCP", pct: 75, Icon: CreditCard },
                { label: "Vehicle Transactions", dcp: "180,000 DCP", pct: 90, Icon: Car },
                { label: "Rental Activity", dcp: "85,000 DCP", pct: 55, Icon: Gauge },
                { label: "Loyalty & Bonuses", dcp: "40,000 DCP", pct: 35, Icon: Star },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <row.Icon size={10} className="text-gray-500" />
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-black">Upcoming Reservation</h3>
              <Link href="/dashboard/reservations" className="text-[12px] text-gray-400 hover:text-black flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
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
            <Link href="/dashboard/reservations" className="block w-full py-2.5 bg-black text-white text-[13px] font-bold rounded-xl text-center hover:bg-gray-900 transition-colors">
              View Reservation
            </Link>
          </div>
        </div>

        {/* Transportation Power Growth + Suggested Upgrade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[15px] font-bold text-black mb-5">Transportation Power Growth</h3>
            <div className="flex items-end gap-3 mb-4">
              {[
                { label: "Year 1", mult: "1x", h: 30, active: false },
                { label: "Year 2", mult: "1.1x", h: 45, active: false },
                { label: "Year 3", mult: "1.2x", h: 60, active: false },
                { label: "Year 4", mult: "1.35x", h: 75, active: false },
                { label: "Year 5+", mult: "1.5x", h: 100, active: true },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[11px] font-bold text-gray-500">{bar.mult}</p>
                  <div className={`w-full rounded-t-lg ${bar.active ? "bg-black" : "bg-gray-200"}`} style={{ height: `${bar.h * 0.8}px` }} />
                  <p className="text-[10px] text-gray-400">{bar.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-gray-400">Your Transportation Power multiplies the value of every dollar you spend.</p>
            <button className="mt-3 text-[12px] font-semibold text-black flex items-center gap-1 hover:gap-2 transition-all">
              Learn more <ArrowRight size={12} />
            </button>
          </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={10} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Price difference</p>
                    </div>
                    <p className="text-[11px] font-bold text-black">+$80,000</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={10} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Est. monthly difference</p>
                    </div>
                    <p className="text-[11px] font-bold text-black">+$149/mo</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap size={10} className="text-gray-400" />
                      <p className="text-[11px] text-gray-400">Transportation Power</p>
                    </div>
                    <p className="text-[11px] font-bold text-black">+15% more DCP</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-gray-900 transition-colors">Upgrade Now</button>
              <button className="flex-1 py-2.5 bg-white text-black text-[13px] font-bold rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">Compare Vehicles</button>
            </div>
          </div>
        </div>

        {/* Milestones / Badges / Challenges */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5 w-fit">
            {(["progress", "badges", "challenges"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors ${activeTab === t ? "bg-white text-black shadow-sm" : "text-gray-500"}`}
              >
                {t === "badges" ? `Badges (${earnedBadges.length}/${badges.length})` : t === "progress" ? "Milestones" : "Challenges"}
              </button>
            ))}
          </div>

          {activeTab === "progress" && (
            <div className="space-y-3">
              {milestones.map((m, i) => (
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
    </DashboardShell>
  );
}
