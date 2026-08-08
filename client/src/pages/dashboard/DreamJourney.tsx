/**
 * DreamCarz — Dream Journey
 * Single dream car goal with timeline progression, roadmap milestones,
 * and actionable steps to achieve it. NOT a shopping page.
 */
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Trophy, Star, Zap, Target, TrendingUp, CheckCircle2, Lock,
  Award, Flame, Shield, Crown, Sparkles, ArrowRight, Calendar,
  CreditCard, Car, ChevronRight, Edit2, Flag, Clock, DollarSign,
  BarChart3, Lightbulb, Phone,
} from "lucide-react";

// ── The member's selected dream car (would come from DB in production) ──
const dreamCar = {
  make: "LAMBORGHINI",
  model: "Huracán EVO",
  price: 280000,
  category: "Supercar",
  inNetwork: true,
  img: "/manus-storage/dj-lambo_83afae81.png",
  goal: "creditfree", // creditfree | finance | own
  targetAmount: 280000 * 0.15, // 15% DCP threshold for Credit Free
  timeline: 3, // years
};

// ── Member's current progress ──────────────────────────────────────────
const member = {
  dcp: 285000,
  dcpValue: 285000 * 0.01, // $2,850
  creditScore: 712,
  tier: "Pro",
  monthlyDcpEarned: 8500,
  memberSince: "January 2026",
};

const targetAmount = dreamCar.targetAmount; // $42,000
const dcpValue = member.dcpValue; // $2,850
const progressPct = Math.min((dcpValue / targetAmount) * 100, 100); // ~6.8%
const remaining = Math.max(targetAmount - dcpValue, 0); // ~$39,150
const monthlyDcpValueEarned = member.monthlyDcpEarned * 0.01; // $85/mo
const monthsRemaining = Math.ceil(remaining / monthlyDcpValueEarned); // ~460 months at current rate
const monthsWithElite = Math.ceil(remaining / (monthlyDcpValueEarned * 1.25)); // 25% faster with Elite

// ── Timeline milestones ────────────────────────────────────────────────
const milestones = [
  {
    id: 1,
    pct: 0,
    label: "Journey Started",
    date: "January 2026",
    desc: "You set your dream car goal and began your DCP journey.",
    status: "done",
    reward: null,
  },
  {
    id: 2,
    pct: 10,
    label: "10% — First Milestone",
    date: "Est. March 2026",
    desc: "Reach $4,200 in DCP value toward your Lamborghini.",
    status: "active",
    reward: "500 DCP bonus",
  },
  {
    id: 3,
    pct: 25,
    label: "25% — Quarter Way",
    date: "Est. September 2026",
    desc: "Reach $10,500 in DCP value. Unlock the Quarter Way badge.",
    status: "locked",
    reward: "1,500 DCP + Quarter Way badge",
  },
  {
    id: 4,
    pct: 50,
    label: "50% — Halfway There",
    date: "Est. June 2027",
    desc: "Reach $21,000 in DCP value. Unlock a tier discount.",
    status: "locked",
    reward: "3,000 DCP + Halfway badge + tier discount",
  },
  {
    id: 5,
    pct: 75,
    label: "75% — Almost There",
    date: "Est. March 2028",
    desc: "Reach $31,500 in DCP value. Almost Credit Free qualified.",
    status: "locked",
    reward: "5,000 DCP + Almost There badge",
  },
  {
    id: 6,
    pct: 100,
    label: "100% — Dream Achieved 🎉",
    date: "Est. December 2028",
    desc: "You've reached $42,000 in DCP value. You qualify for Credit Free access to your Lamborghini Huracán EVO.",
    status: "locked",
    reward: "10,000 DCP + Dream Achieved badge + exclusive event invite",
  },
];

// ── Action steps to accelerate ─────────────────────────────────────────
const accelerators = [
  {
    icon: TrendingUp,
    title: "Upgrade to Elite",
    impact: "Earn DCP 25% faster",
    desc: "Elite members earn at 1.5x vs your current 1.2x — shaving months off your timeline.",
    cta: "View Elite Benefits",
    href: "/dashboard/membership",
    urgency: "high",
  },
  {
    icon: Award,
    title: "Refer a Friend",
    impact: "+2,000 DCP per referral",
    desc: "Each friend you refer earns you 2,000 DCP instantly. Refer 10 friends = 20,000 DCP.",
    cta: "Get Referral Link",
    href: "/dashboard/rewards",
    urgency: "medium",
  },
  {
    icon: Calendar,
    title: "Extend Your Rentals",
    impact: "More DCP per dollar",
    desc: "Longer rentals earn more DCP per day than short ones. Maximize each booking.",
    cta: "Extend Current Rental",
    href: "/dashboard/vehicles",
    urgency: "medium",
  },
  {
    icon: CreditCard,
    title: "Improve Your Credit Score",
    impact: "Target: 740+",
    desc: `Your score is ${member.creditScore}. Reaching 740+ qualifies you for better financing terms if you choose to purchase.`,
    cta: "Credit Resources",
    href: "/dashboard/support",
    urgency: "low",
  },
];

// ── Badges ─────────────────────────────────────────────────────────────
const badges = [
  { icon: Car, label: "First Drive", earned: true, xp: 100 },
  { icon: Calendar, label: "Week 1 Member", earned: true, xp: 150 },
  { icon: Zap, label: "DCP Starter", earned: true, xp: 200 },
  { icon: Star, label: "DCP Centurion", earned: true, xp: 500 },
  { icon: Trophy, label: "DCP Elite", earned: true, xp: 1000 },
  { icon: Award, label: "Ambassador", earned: false, xp: 300 },
  { icon: Shield, label: "6-Month Loyal", earned: false, xp: 750 },
  { icon: CheckCircle2, label: "Credit Ready", earned: false, xp: 1500 },
  { icon: Target, label: "Quarter Way", earned: false, xp: 500 },
  { icon: TrendingUp, label: "Halfway There", earned: false, xp: 1000 },
  { icon: Flame, label: "Almost There", earned: false, xp: 2000 },
  { icon: Crown, label: "Dream Achieved", earned: false, xp: 5000 },
];

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function DreamJourney() {
  const [activeTab, setActiveTab] = useState<"roadmap" | "accelerate" | "badges">("roadmap");
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <DashboardShell title="Dream Journey">
      <div className="space-y-6 max-w-4xl">

        {/* ── Dream Car Hero ── */}
        <div className="bg-black rounded-3xl overflow-hidden relative" style={{ minHeight: 220 }}>
          {/* Background car image */}
          <img
            src={dreamCar.img}
            alt={dreamCar.model}
            className="absolute right-0 top-0 h-full w-1/2 object-contain opacity-90"
            style={{ objectPosition: "right center" }}
          />
          {/* Left gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #000 55%, transparent 100%)" }} />
          {/* Content */}
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Your Dream Car</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{dreamCar.make}</p>
                <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {dreamCar.model}
                </h2>
                <p className="text-gray-400 text-sm mt-1">{fmt(dreamCar.price)} · Credit Free Access Goal</p>
              </div>
              <button className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                <Edit2 size={10} /> Change Goal
              </button>
            </div>

            {/* Dream Meter */}
            <div className="mt-6 max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Dream Meter</p>
                <p className="text-[13px] font-bold text-white">{progressPct.toFixed(1)}% complete</p>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #B8860B, #FFD700)" }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-500">{fmt(dcpValue)} DCP value applied</p>
                <p className="text-[11px] text-gray-500">{fmt(remaining)} remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Key Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-amber-500" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Current DCP</p>
            </div>
            <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
            <p className="text-[11px] text-gray-400">{fmt(dcpValue)} value</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={13} className="text-purple-500" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Target</p>
            </div>
            <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{fmt(targetAmount)}</p>
            <p className="text-[11px] text-gray-400">Credit Free threshold</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={13} className="text-blue-500" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Est. Timeline</p>
            </div>
            <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>~{Math.ceil(monthsWithElite / 12)} yrs</p>
            <p className="text-[11px] text-gray-400">with Elite upgrade</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={13} className="text-amber-500" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Credit Score</p>
            </div>
            <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{member.creditScore}</p>
            <p className="text-[11px] text-amber-600 font-semibold">Target: 740+</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {(["roadmap", "accelerate", "badges"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold capitalize transition-colors ${activeTab === t ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "accelerate" ? "How to Get There" : t === "badges" ? `Badges (${earnedBadges.length}/${badges.length})` : "Roadmap"}
            </button>
          ))}
        </div>

        {/* ── Roadmap Tab ── */}
        {activeTab === "roadmap" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-[15px] font-bold text-black mb-1">Your Path to the Lamborghini Huracán EVO</h3>
              <p className="text-[12px] text-gray-400 mb-6">Every DCP point you earn moves you closer. Here's your journey broken down into achievable milestones.</p>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

                <div className="space-y-6">
                  {milestones.map((m, i) => (
                    <div key={m.id} className="flex gap-5 relative">
                      {/* Node */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                        m.status === "done" ? "bg-green-500 border-green-500" :
                        m.status === "active" ? "bg-amber-400 border-amber-400 animate-pulse" :
                        "bg-white border-gray-200"
                      }`}>
                        {m.status === "done" ? <CheckCircle2 size={14} className="text-white" /> :
                         m.status === "active" ? <Flag size={12} className="text-white" /> :
                         <Lock size={12} className="text-gray-300" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-2 ${m.status === "active" ? "bg-amber-50 border border-amber-100 rounded-2xl p-4 -ml-1" : ""}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className={`text-[13px] font-bold ${m.status === "done" ? "text-green-700" : m.status === "active" ? "text-amber-700" : "text-black"}`}>
                              {m.label}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{m.date}</p>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            m.status === "done" ? "bg-green-100 text-green-700" :
                            m.status === "active" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-400"
                          }`}>
                            {m.pct}%
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 mb-2">{m.desc}</p>
                        {m.reward && (
                          <p className="text-[11px] font-semibold text-amber-600">🎁 {m.reward}</p>
                        )}
                        {m.status === "active" && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[11px] text-amber-600 font-semibold">Progress to this milestone</p>
                              <p className="text-[11px] font-bold text-amber-700">{((dcpValue / (targetAmount * 0.1)) * 100).toFixed(0)}%</p>
                            </div>
                            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min((dcpValue / (targetAmount * 0.1)) * 100, 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DCP Projection Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-black">DCP Accumulation Projection</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">How your DCP value grows toward {fmt(targetAmount)}</p>
                </div>
                <BarChart3 size={18} className="text-gray-300" />
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-2 h-32 mb-3">
                {[
                  { label: "Now", val: dcpValue, pct: (dcpValue / targetAmount) * 100 },
                  { label: "6mo", val: dcpValue + monthlyDcpValueEarned * 6, pct: Math.min(((dcpValue + monthlyDcpValueEarned * 6) / targetAmount) * 100, 100) },
                  { label: "1yr", val: dcpValue + monthlyDcpValueEarned * 12, pct: Math.min(((dcpValue + monthlyDcpValueEarned * 12) / targetAmount) * 100, 100) },
                  { label: "2yr", val: dcpValue + monthlyDcpValueEarned * 24, pct: Math.min(((dcpValue + monthlyDcpValueEarned * 24) / targetAmount) * 100, 100) },
                  { label: "3yr", val: dcpValue + monthlyDcpValueEarned * 36, pct: Math.min(((dcpValue + monthlyDcpValueEarned * 36) / targetAmount) * 100, 100) },
                  { label: "Elite\n3yr", val: dcpValue + monthlyDcpValueEarned * 1.25 * 36, pct: Math.min(((dcpValue + monthlyDcpValueEarned * 1.25 * 36) / targetAmount) * 100, 100), highlight: true },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-bold text-gray-400 text-center">{fmt(Math.round(bar.val))}</p>
                    <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${bar.highlight ? "bg-amber-400" : bar.pct >= 100 ? "bg-green-500" : "bg-black"}`}
                        style={{ height: `${Math.max(bar.pct, 4)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 text-center whitespace-pre-line">{bar.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-black inline-block" /> Current pace</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> With Elite tier</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Goal reached</div>
              </div>
            </div>
          </div>
        )}

        {/* ── How to Get There Tab ── */}
        {activeTab === "accelerate" && (
          <div className="space-y-3">
            <div className="bg-black rounded-2xl p-5 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-yellow-400" />
                <p className="text-[12px] font-bold text-white uppercase tracking-wider">At your current pace</p>
              </div>
              <p className="text-[13px] text-gray-300">
                You're earning <span className="text-white font-bold">{fmt(Math.round(monthlyDcpValueEarned))}/month</span> in DCP value.
                At this rate, you'll reach your Lamborghini goal in approximately <span className="text-amber-400 font-bold">{Math.ceil(monthsRemaining / 12)} years</span>.
                Here's how to get there faster:
              </p>
            </div>
            {accelerators.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.urgency === "high" ? "bg-amber-50" : "bg-gray-50"}`}>
                    <a.icon size={18} className={a.urgency === "high" ? "text-amber-500" : "text-gray-600"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-0.5">
                      <p className="text-[14px] font-bold text-black">{a.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.urgency === "high" ? "bg-amber-100 text-amber-700" : a.urgency === "medium" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                        {a.urgency === "high" ? "High Impact" : a.urgency === "medium" ? "Medium Impact" : "Helpful"}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-amber-600 mb-1">{a.impact}</p>
                    <p className="text-[12px] text-gray-500 mb-3">{a.desc}</p>
                    <button className="flex items-center gap-1.5 text-[12px] font-bold text-black hover:gap-2.5 transition-all">
                      {a.cta} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Call to action */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-black">Talk to a DreamCarz Advisor</p>
                <p className="text-[12px] text-gray-400">Get a personalized plan to reach your Lamborghini faster.</p>
              </div>
              <a href="tel:3017722500" className="flex-shrink-0 px-4 py-2 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-gray-900 transition-colors">
                Call Now
              </a>
            </div>
          </div>
        )}

        {/* ── Badges Tab ── */}
        {activeTab === "badges" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Trophy size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-black">Level 5 — Pro Dreamer</p>
                  <p className="text-[11px] text-gray-400">{earnedBadges.reduce((s, b) => s + b.xp, 0).toLocaleString()} XP · 380 XP to Level 6</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: "62%" }} />
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Earned ({earnedBadges.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-5">
                {earnedBadges.map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 bg-yellow-50 border border-yellow-100 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <b.icon size={18} className="text-yellow-500" />
                    </div>
                    <p className="text-[11px] font-bold text-black text-center leading-tight">{b.label}</p>
                    <p className="text-[10px] text-yellow-600 font-semibold">+{b.xp} XP</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Locked ({lockedBadges.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {lockedBadges.map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 border border-gray-100 rounded-2xl opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                      <Lock size={14} className="text-gray-400" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 text-center leading-tight">{b.label}</p>
                    <p className="text-[10px] text-gray-400 text-center text-[10px]">{b.xp} XP</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
