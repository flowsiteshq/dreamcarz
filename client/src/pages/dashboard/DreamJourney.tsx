/**
 * DreamCarz — Dream Car Journey
 * Gamified goal-setting: pick any dream car, get a personalized roadmap,
 * earn badges, track milestones, and work toward ownership.
 */
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Trophy, Star, Zap, Target, TrendingUp, CheckCircle2,
  Lock, ChevronRight, Search, Car, DollarSign, Calendar,
  Award, Flame, Shield, Crown, Sparkles, ArrowRight, Info
} from "lucide-react";

// ── Dream car catalog (in-network + popular out-of-network) ──────────────
const dreamCars = [
  // In-network
  { id: "lambo-huracan", name: "Lamborghini Huracán EVO", price: 280000, category: "Supercar", inNetwork: true, emoji: "🟡", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
  { id: "ferrari-488", name: "Ferrari 488 GTB", price: 330000, category: "Supercar", inNetwork: true, emoji: "🔴", img: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&q=80" },
  { id: "porsche-turbo", name: "Porsche 911 Turbo S", price: 230000, category: "Sports", inNetwork: true, emoji: "⚫", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },
  { id: "mclaren-720s", name: "McLaren 720S", price: 310000, category: "Supercar", inNetwork: true, emoji: "🟠", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "rr-ghost", name: "Rolls-Royce Ghost", price: 380000, category: "Luxury", inNetwork: true, emoji: "⚪", img: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=400&q=80" },
  { id: "bentley-cont", name: "Bentley Continental GT", price: 250000, category: "Luxury", inNetwork: true, emoji: "🟢", img: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80" },
  // Out-of-network
  { id: "bugatti-chiron", name: "Bugatti Chiron", price: 3200000, category: "Hypercar", inNetwork: false, emoji: "🔵", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
  { id: "koenigsegg", name: "Koenigsegg Regera", price: 1900000, category: "Hypercar", inNetwork: false, emoji: "🟣", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
  { id: "pagani-huayra", name: "Pagani Huayra", price: 2600000, category: "Hypercar", inNetwork: false, emoji: "🟤", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
  { id: "aston-valkyrie", name: "Aston Martin Valkyrie", price: 3000000, category: "Hypercar", inNetwork: false, emoji: "🔶", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
  { id: "tesla-roadster", name: "Tesla Roadster 2025", price: 250000, category: "Electric", inNetwork: false, emoji: "⚡", img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80" },
  { id: "rimac-nevera", name: "Rimac Nevera", price: 2400000, category: "Electric Hypercar", inNetwork: false, emoji: "💙", img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80" },
];

// ── Achievement badges ────────────────────────────────────────────────────
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

// ── Weekly challenges ─────────────────────────────────────────────────────
const challenges = [
  { label: "Refer a Friend", reward: "2,000 DCP", deadline: "3 days left", progress: 0, max: 1, icon: Award },
  { label: "Complete Your Profile", reward: "500 DCP", deadline: "Ongoing", progress: 3, max: 5, icon: CheckCircle2 },
  { label: "Extend Your Current Rental", reward: "1,500 DCP", deadline: "5 days left", progress: 0, max: 1, icon: Calendar },
  { label: "Rate Your Experience", reward: "250 DCP", deadline: "2 days left", progress: 0, max: 1, icon: Star },
];

function formatPrice(n: number) {
  return "$" + n.toLocaleString();
}

function getRoadmap(car: typeof dreamCars[0], goal: string, timeline: number, currentDcp: number) {
  const dcpValue = currentDcp * 0.01; // $0.01 per DCP
  const dcpMultiplier = 1.2; // Pro tier
  const monthlyDcp = 499 * 12 * dcpMultiplier; // ~$7,186 DCP/year
  const monthlyDcpValue = monthlyDcp * 0.01 / 12;

  let targetAmount = car.price;
  if (goal === "finance") targetAmount = car.price * 0.2; // 20% down
  if (goal === "creditfree") targetAmount = car.price * 0.15; // 15% DCP threshold

  const dcpProgress = Math.min((dcpValue / targetAmount) * 100, 100);
  const monthsToGoal = Math.ceil((targetAmount - dcpValue) / monthlyDcpValue);

  const creditScore = car.price > 500000 ? 780 : car.price > 200000 ? 740 : 700;
  const annualIncome = car.price > 500000 ? car.price * 0.5 : car.price * 0.3;

  return {
    targetAmount,
    dcpProgress,
    monthsToGoal: Math.max(monthsToGoal, 1),
    creditScore,
    annualIncome,
    monthlyPayment: goal === "finance" ? Math.round((car.price * 0.8) / (timeline * 12) * 1.06) : 0,
    dcpContribution: Math.min(dcpValue, targetAmount),
    remaining: Math.max(targetAmount - dcpValue, 0),
  };
}

// ── Step components ───────────────────────────────────────────────────────
function StepSelectCar({ onSelect }: { onSelect: (car: typeof dreamCars[0]) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Supercar", "Hypercar", "Sports", "Luxury", "Electric"];

  const filtered = dreamCars.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "All" || c.category === filter;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mx-auto mb-4">
          <Sparkles size={24} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>What's Your Dream Car?</h2>
        <p className="text-gray-500 text-sm">Choose any car — in our fleet or beyond. We'll build your path to it.</p>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any make or model..."
          className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm text-black placeholder-gray-400 outline-none border border-gray-100 focus:border-gray-300 transition-colors" />
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${filter === c ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(car => (
          <button key={car.id} onClick={() => onSelect(car)}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
              {car.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-black truncate">{car.name}</p>
              <p className="text-[11px] text-gray-400">{formatPrice(car.price)} · {car.category}</p>
              {!car.inNetwork && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Out of Network</span>}
              {car.inNetwork && <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">In DreamCarz Fleet</span>}
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-black transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSetGoal({ car, onNext }: { car: typeof dreamCars[0]; onNext: (goal: string, timeline: number) => void }) {
  const [goal, setGoal] = useState("creditfree");
  const [timeline, setTimeline] = useState(3);

  const goals = [
    { id: "creditfree", label: "Credit Free Access", desc: "Use DCP to access this car through DreamCarz without a credit check", icon: Shield, available: car.inNetwork },
    { id: "finance", label: "Finance / Purchase", desc: "Save for a down payment and finance through a lender", icon: DollarSign, available: true },
    { id: "own", label: "Full Cash Purchase", desc: "Save and purchase outright — the ultimate goal", icon: Crown, available: true },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Dream Car</p>
        <h2 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>{car.name}</h2>
        <p className="text-gray-400 text-sm">{formatPrice(car.price)}</p>
      </div>

      <h3 className="text-[13px] font-bold text-black mb-3 uppercase tracking-wider">What's your goal?</h3>
      <div className="space-y-2 mb-6">
        {goals.map(g => (
          <button key={g.id} onClick={() => g.available && setGoal(g.id)} disabled={!g.available}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${goal === g.id ? "border-black bg-black text-white" : g.available ? "border-gray-100 bg-white hover:border-gray-300" : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${goal === g.id ? "bg-white/10" : "bg-gray-100"}`}>
              <g.icon size={16} className={goal === g.id ? "text-white" : "text-gray-600"} />
            </div>
            <div>
              <p className={`text-[13px] font-bold ${goal === g.id ? "text-white" : "text-black"}`}>{g.label}</p>
              <p className={`text-[11px] mt-0.5 ${goal === g.id ? "text-white/70" : "text-gray-400"}`}>{g.desc}</p>
              {!g.available && <span className="text-[10px] text-amber-600">Only available for in-network vehicles</span>}
            </div>
          </button>
        ))}
      </div>

      <h3 className="text-[13px] font-bold text-black mb-3 uppercase tracking-wider">Timeline</h3>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 5, 10].map(y => (
          <button key={y} onClick={() => setTimeline(y)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-colors ${timeline === y ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {y}yr
          </button>
        ))}
      </div>

      <button onClick={() => onNext(goal, timeline)}
        className="w-full py-3.5 bg-black text-white text-sm font-bold rounded-2xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
        Build My Roadmap <ArrowRight size={16} />
      </button>
    </div>
  );
}

function RoadmapView({ car, goal, timeline, onReset }: { car: typeof dreamCars[0]; goal: string; timeline: number; onReset: () => void }) {
  const currentDcp = 285000;
  const rm = getRoadmap(car, goal, timeline, currentDcp);
  const [activeTab, setActiveTab] = useState<"roadmap" | "badges" | "challenges">("roadmap");
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);
  const totalXP = earnedBadges.reduce((s, b) => s + b.xp, 0);

  const milestones = [
    { pct: 10, label: "Journey Begins", desc: "You've started your dream car path", reward: "500 DCP bonus", done: rm.dcpProgress >= 10 },
    { pct: 25, label: "Quarter Way", desc: "25% of your goal reached", reward: "1,500 DCP + Quarter Way badge", done: rm.dcpProgress >= 25 },
    { pct: 50, label: "Halfway There", desc: "50% of your goal reached", reward: "3,000 DCP + Halfway badge + tier discount", done: rm.dcpProgress >= 50 },
    { pct: 75, label: "Almost There", desc: "75% of your goal reached", reward: "5,000 DCP + Almost There badge", done: rm.dcpProgress >= 75 },
    { pct: 100, label: "Dream Achieved! 🎉", desc: "You've reached your dream car goal", reward: "10,000 DCP + Dream Achieved badge + exclusive event invite", done: rm.dcpProgress >= 100 },
  ];

  const goalLabel = goal === "creditfree" ? "Credit Free Access" : goal === "finance" ? "Finance Down Payment" : "Full Purchase";

  return (
    <div className="space-y-6">
      {/* Dream car hero */}
      <div className="relative rounded-3xl overflow-hidden bg-black" style={{ minHeight: 180 }}>
        <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">{car.emoji}</div>
        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Your Dream Car</p>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{car.name}</h2>
              <p className="text-gray-400 text-sm">{formatPrice(car.price)} · {goalLabel}</p>
            </div>
            <button onClick={onReset} className="text-[11px] text-gray-500 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full">Change</button>
          </div>

          {/* Dream Meter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-gray-400">Dream Meter</p>
              <p className="text-[11px] font-bold text-white">{rm.dcpProgress.toFixed(1)}%</p>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${rm.dcpProgress}%`, background: "linear-gradient(90deg, #B8860B, #FFD700)" }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-gray-500">{formatPrice(rm.dcpContribution)} contributed via DCP</p>
              <p className="text-[10px] text-gray-500">{formatPrice(rm.remaining)} remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
          <Trophy size={18} className="text-yellow-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-bold text-black">Level 5 — Pro Dreamer</p>
            <p className="text-[11px] text-gray-400">{totalXP.toLocaleString()} XP</p>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: "62%" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">380 XP to Level 6</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {(["roadmap", "badges", "challenges"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors ${activeTab === t ? "bg-white text-black shadow-sm" : "text-gray-500"}`}>
            {t === "badges" ? `Badges (${earnedBadges.length}/${badges.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "roadmap" && (
        <div className="space-y-4">
          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Target Amount</p>
              <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{formatPrice(rm.targetAmount)}</p>
              <p className="text-[11px] text-gray-400">{goalLabel}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Est. Timeline</p>
              <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{rm.monthsToGoal} mo</p>
              <p className="text-[11px] text-gray-400">at current DCP rate</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Credit Score Needed</p>
              <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{rm.creditScore}+</p>
              <p className="text-[11px] text-gray-400">recommended minimum</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Income Suggested</p>
              <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{formatPrice(annualIncome(car.price))}/yr</p>
              <p className="text-[11px] text-gray-400">for comfortable payments</p>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <h3 className="text-[13px] font-bold text-black mb-3 uppercase tracking-wider">Milestones</h3>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${m.done ? "border-green-100 bg-green-50" : "border-gray-100 bg-white"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.done ? "bg-green-500" : "bg-gray-100"}`}>
                    {m.done ? <CheckCircle2 size={14} className="text-white" /> : <Lock size={14} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-[13px] font-bold ${m.done ? "text-green-700" : "text-black"}`}>{m.label}</p>
                      <span className="text-[10px] font-bold text-gray-400">{m.pct}%</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{m.desc}</p>
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">🎁 {m.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-black rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-yellow-400" />
              <p className="text-[12px] font-bold text-white uppercase tracking-wider">DreamCarz Tips to Get There Faster</p>
            </div>
            <ul className="space-y-2">
              {[
                `Upgrade to Elite tier to earn DCP at 1.5x — that's 25% faster accumulation`,
                `Refer 3 friends to earn a 5,000 DCP referral bonus each`,
                `Extend your rentals instead of swapping to maximize DCP per dollar`,
                `Check your credit score monthly — aim for ${rm.creditScore}+ before applying`,
                goal === "finance" ? `Start a dedicated savings account for your ${formatPrice(rm.targetAmount)} down payment` : `Your ${formatPrice(rm.dcpContribution)} DCP value can offset the Credit Free threshold directly`,
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-400">
                  <span className="text-yellow-400 flex-shrink-0 mt-0.5">→</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "badges" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[12px] font-bold text-black uppercase tracking-wider mb-3">Earned ({earnedBadges.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map(b => (
                <div key={b.id} className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <b.icon size={18} className="text-yellow-500" />
                  </div>
                  <p className="text-[11px] font-bold text-black text-center leading-tight">{b.label}</p>
                  <p className="text-[10px] text-yellow-600 font-semibold">+{b.xp} XP</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Locked ({lockedBadges.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {lockedBadges.map(b => (
                <div key={b.id} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 border border-gray-100 rounded-2xl opacity-60">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-400 text-center leading-tight">{b.label}</p>
                  <p className="text-[10px] text-gray-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "challenges" && (
        <div className="space-y-3">
          <p className="text-[12px] text-gray-400">Complete challenges to earn bonus DCP and XP toward your dream car.</p>
          {challenges.map((c, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <c.icon size={16} className="text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[13px] font-bold text-black">{c.label}</p>
                    <span className="text-[11px] font-bold text-amber-600">{c.reward}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-2">{c.deadline}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(c.progress / c.max) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{c.progress}/{c.max} completed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function annualIncome(price: number) {
  return price > 500000 ? Math.round(price * 0.5 / 1000) * 1000 : Math.round(price * 0.3 / 1000) * 1000;
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function DreamJourney() {
  const [step, setStep] = useState<"select" | "goal" | "roadmap">("select");
  const [selectedCar, setSelectedCar] = useState<typeof dreamCars[0] | null>(null);
  const [selectedGoal, setSelectedGoal] = useState("creditfree");
  const [selectedTimeline, setSelectedTimeline] = useState(3);

  return (
    <DashboardShell title="Dream Journey" >
      <div className="max-w-2xl mx-auto">
        {step === "select" && (
          <StepSelectCar onSelect={car => { setSelectedCar(car); setStep("goal"); }} />
        )}
        {step === "goal" && selectedCar && (
          <StepSetGoal car={selectedCar} onNext={(goal, timeline) => { setSelectedGoal(goal); setSelectedTimeline(timeline); setStep("roadmap"); }} />
        )}
        {step === "roadmap" && selectedCar && (
          <RoadmapView car={selectedCar} goal={selectedGoal} timeline={selectedTimeline} onReset={() => setStep("select")} />
        )}
      </div>
    </DashboardShell>
  );
}
