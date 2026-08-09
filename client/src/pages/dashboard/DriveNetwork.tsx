/**
 * DreamCarz — Drive Network Dashboard
 * In-app MLM pipeline: rank tracker, downline tree, earnings, referral tools
 */
import DashboardShell from "@/components/DashboardShell";
import {
  Users, DollarSign, TrendingUp, Copy, Share2, Award,
  ChevronRight, Star, Zap, Crown, Car, Target, Check,
  ArrowUpRight, Gift, Link
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const ranks = [
  { id: 1, title: "Associate", icon: "🚗", color: "#6b7280", bgColor: "bg-gray-100", textColor: "text-gray-700" },
  { id: 2, title: "Driver", icon: "🏎️", color: "#3b82f6", bgColor: "bg-blue-50", textColor: "text-blue-700" },
  { id: 3, title: "Road Captain", icon: "⚡", color: "#8b5cf6", bgColor: "bg-purple-50", textColor: "text-purple-700" },
  { id: 4, title: "Fleet Director", icon: "🏆", color: "#f59e0b", bgColor: "bg-amber-50", textColor: "text-amber-700" },
  { id: 5, title: "Elite Executive", icon: "💎", color: "#f97316", bgColor: "bg-orange-50", textColor: "text-orange-700" },
  { id: 6, title: "Dream Ambassador", icon: "👑", color: "#C9A84C", bgColor: "bg-black", textColor: "text-white" },
];

const currentRank = ranks[1]; // Driver
const nextRank = ranks[2]; // Road Captain

const downlineMembers = [
  { id: 1, name: "Marcus Johnson", tier: "Pro", rank: "Driver", joined: "Jan 2026", dcp: 42000, monthlyFee: 199, level: 1, active: true, referrals: 3 },
  { id: 2, name: "Tanya Williams", tier: "Plus", rank: "Associate", joined: "Feb 2026", dcp: 18000, monthlyFee: 149, level: 1, active: true, referrals: 1 },
  { id: 3, name: "Derek Thompson", tier: "Freedom", rank: "Associate", joined: "Mar 2026", dcp: 9000, monthlyFee: 99, level: 1, active: true, referrals: 0 },
  { id: 4, name: "Keisha Brown", tier: "Elite", rank: "Driver", joined: "Feb 2026", dcp: 65000, monthlyFee: 299, level: 2, active: true, referrals: 4 },
  { id: 5, name: "James Carter", tier: "Pro", rank: "Associate", joined: "Mar 2026", dcp: 22000, monthlyFee: 199, level: 2, active: true, referrals: 0 },
  { id: 6, name: "Alicia Davis", tier: "Plus", rank: "Associate", joined: "Apr 2026", dcp: 11000, monthlyFee: 149, level: 3, active: false, referrals: 0 },
];

const earningsHistory = [
  { month: "Apr 2026", referralBonus: 225, residual: 187, dcpMatch: 0, rankBonus: 0, total: 412 },
  { month: "May 2026", referralBonus: 150, residual: 234, dcpMatch: 0, rankBonus: 500, total: 884 },
  { month: "Jun 2026", referralBonus: 75, residual: 289, dcpMatch: 0, rankBonus: 0, total: 364 },
  { month: "Jul 2026", referralBonus: 300, residual: 312, dcpMatch: 0, rankBonus: 0, total: 612 },
  { month: "Aug 2026", referralBonus: 150, residual: 341, dcpMatch: 0, rankBonus: 0, total: 491 },
];

const tierColors: Record<string, string> = {
  Freedom: "bg-gray-100 text-gray-600",
  Plus: "bg-blue-50 text-blue-600",
  Pro: "bg-amber-50 text-amber-700",
  Elite: "bg-black text-white",
};

export default function DriveNetwork() {
  const [activeTab, setActiveTab] = useState<"overview" | "downline" | "earnings" | "tools">("overview");
  const [copied, setCopied] = useState(false);

  // Live data from database
  const { data: stats, isLoading: statsLoading } = trpc.driveNetwork.getStats.useQuery();
  const { data: downline } = trpc.driveNetwork.getDownline.useQuery();
  const { data: liveCommissions } = trpc.driveNetwork.getCommissions.useQuery();

  // Use live data where available, fall back to demo data
  const liveReferralCode = stats?.referralCode;
  const referralLink = liveReferralCode
    ? `https://dreamcarz-xrgtgznf.manus.space/?ref=${liveReferralCode}`
    : "https://dreamcarz-xrgtgznf.manus.space/?ref=LOADING";
  const liveTeamSize = stats?.teamSize ?? downlineMembers.length;
  const liveTotalEarned = stats?.totalEarned ? (stats.totalEarned / 100) : earningsHistory.reduce((s, m) => s + m.total, 0);
  const liveThisMonth = stats?.thisMonthTotal ? (stats.thisMonthTotal / 100) : earningsHistory[earningsHistory.length - 1].total;
  const liveDirectRefs = stats?.directReferrals ?? 3;
  const liveRank = stats?.rank ?? "driver";
  const rankIndex = ranks.findIndex(r => r.title.toLowerCase().replace(" ", "_") === liveRank) ?? 1;
  const currentRankLive = ranks[Math.max(0, rankIndex)] ?? ranks[1];
  const nextRankLive = ranks[Math.min(5, rankIndex + 1)] ?? ranks[2];

  const totalEarned = liveTotalEarned;
  const thisMonth = earningsHistory[earningsHistory.length - 1];
  // Always use demo downline data for display (live data shows counts only)
  const level1 = downlineMembers.filter(m => m.level === 1);
  const level2 = downlineMembers.filter(m => m.level === 2);
  const level3 = downlineMembers.filter(m => m.level === 3);
  const liveLevel1Count = downline ? downline.filter(m => m.level === 1).length : level1.length;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell title="Drive Network">
      <div className="space-y-4">

        {/* Current rank hero */}
        <div className="bg-black rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #C9A84C 0%, transparent 60%)" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
            <div className="text-[11px] text-white/40 uppercase tracking-wider mb-1">YOUR RANK</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{currentRankLive.icon}</span>
                <span className="text-[22px] font-bold">{statsLoading ? "Loading..." : currentRankLive.title}</span>
              </div>
              <div className="text-[12px] text-white/50">Rank {currentRankLive.id} of 6 · Next: {nextRankLive.title}</div>
              {/* Progress to next rank */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                  <span>Progress to {nextRank.title}</span>
                  <span>3 / 10 enrollments · 0 / 1 Driver legs</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: "30%", background: "#C9A84C" }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-56">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="text-[18px] font-bold">{liveTeamSize}</div>
                <div className="text-[10px] text-white/40">Team Size</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="text-[18px] font-bold">${liveThisMonth}</div>
                <div className="text-[10px] text-white/40">This Month</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="text-[18px] font-bold">${liveTotalEarned.toLocaleString()}</div>
                <div className="text-[10px] text-white/40">Total Earned</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="text-[18px] font-bold">{liveDirectRefs}</div>
                <div className="text-[10px] text-white/40">Direct Refs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {(["overview", "downline", "earnings", "tools"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-white text-black shadow-sm" : "text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* 5 income streams summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Referral Bonuses", value: `$${earningsHistory.reduce((s,m)=>s+m.referralBonus,0)}`, sub: "Lifetime", icon: Gift, color: "bg-blue-600" },
                { label: "Residual Income", value: `$${thisMonth.residual}/mo`, sub: "This month", icon: TrendingUp, color: "bg-green-600" },
                { label: "DCP Matching", value: "12,400 DCP", sub: "From team activity", icon: Zap, color: "bg-amber-500" },
                { label: "Rank Bonus Earned", value: "$500", sub: "Driver rank bonus", icon: Award, color: "bg-purple-600" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400">{item.label}</div>
                      <div className="text-[16px] font-bold text-black">{item.value}</div>
                      <div className="text-[10px] text-gray-400">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rank progression */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5">
              <div className="text-[13px] font-bold text-black mb-4">Rank Progression</div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {ranks.map((rank, i) => {
                  const isCompleted = rank.id < currentRank.id;
                  const isCurrent = rank.id === currentRank.id;
                  return (
                    <div key={rank.id} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`flex flex-col items-center gap-1 ${isCurrent ? "opacity-100" : isCompleted ? "opacity-100" : "opacity-40"}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                          isCurrent ? "border-black bg-black" : isCompleted ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                        }`}>
                          {isCompleted ? <Check size={14} className="text-green-600" /> : rank.icon}
                        </div>
                        <div className={`text-[9px] font-bold text-center w-14 ${isCurrent ? "text-black" : "text-gray-400"}`}>{rank.title}</div>
                      </div>
                      {i < ranks.length - 1 && (
                        <div className={`w-6 h-0.5 flex-shrink-0 mb-4 ${rank.id < currentRank.id ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next rank requirements */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-bold text-black">Next Rank: {nextRank.icon} {nextRank.title}</div>
                <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-full">$500 bonus on unlock</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-gray-500">Personal enrollments</span>
                    <span className="font-bold text-black">3 / 10</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-gray-500">Driver legs in downline</span>
                    <span className="font-bold text-black">0 / 1</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">Marcus Johnson is closest to Driver rank — 0 more enrollments needed. Help him enroll 0 more to unlock your Driver leg.</p>
            </div>
          </div>
        )}

        {/* DOWNLINE TAB */}
        {activeTab === "downline" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Level 1", count: level1.length, desc: "Direct referrals" },
                { label: "Level 2", count: level2.length, desc: "Their referrals" },
                { label: "Level 3+", count: level3.length, desc: "Deeper network" },
              ].map((l, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
                  <div className="text-[20px] font-bold text-black">{l.count}</div>
                  <div className="text-[11px] font-semibold text-black">{l.label}</div>
                  <div className="text-[10px] text-gray-400">{l.desc}</div>
                </div>
              ))}
            </div>

            {/* Level 1 */}
            <div>
              <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Level 1 — Direct Referrals</div>
              <div className="space-y-2">
                {level1.map(member => (
                  <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-black">{member.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tierColors[member.tier]}`}>{member.tier}</span>
                        {!member.active && <span className="text-[9px] text-red-500 font-bold">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>{member.rank}</span>
                        <span>·</span>
                        <span>{member.referrals} referrals</span>
                        <span>·</span>
                        <span>Joined {member.joined}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-bold text-black">${Math.round(member.monthlyFee * 0.10)}/mo</div>
                      <div className="text-[10px] text-gray-400">Your residual</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level 2 */}
            <div>
              <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Level 2</div>
              <div className="space-y-2">
                {level2.map(member => (
                  <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 opacity-80">
                    <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-black">{member.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tierColors[member.tier]}`}>{member.tier}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{member.rank} · Joined {member.joined}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-bold text-black">${Math.round(member.monthlyFee * 0.07)}/mo</div>
                      <div className="text-[10px] text-gray-400">Your residual</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level 3 */}
            {level3.length > 0 && (
              <div>
                <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Level 3</div>
                <div className="space-y-2">
                  {level3.map(member => (
                    <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 opacity-60">
                      <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-black">{member.name}</div>
                        <div className="text-[10px] text-gray-400">{member.rank} · {member.active ? "Active" : "Inactive"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[13px] font-bold text-black">${Math.round(member.monthlyFee * 0.05)}/mo</div>
                        <div className="text-[10px] text-gray-400">Your residual</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "earnings" && (
          <div className="space-y-4">
            {/* Total summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black text-white rounded-2xl p-4">
                <div className="text-[11px] text-white/40 mb-1">Total Earned</div>
                <div className="text-[24px] font-bold">${totalEarned.toLocaleString()}</div>
                <div className="text-[10px] text-white/40">All time</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-[11px] text-gray-400 mb-1">This Month</div>
                <div className="text-[24px] font-bold text-black">${thisMonth.total}</div>
                <div className="text-[10px] text-green-500 flex items-center gap-1"><ArrowUpRight size={10} /> +35% vs last month</div>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5">
              <div className="text-[13px] font-bold text-black mb-4">Monthly Earnings Breakdown</div>
              <div className="space-y-3">
                {earningsHistory.slice().reverse().map((month, i) => (
                  <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-black">{month.month}</span>
                      <span className="text-[14px] font-bold text-black">${month.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Referral Bonus</span>
                        <span className="font-mono text-blue-600">${month.referralBonus}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Residual</span>
                        <span className="font-mono text-green-600">${month.residual}</span>
                      </div>
                      {month.rankBonus > 0 && (
                        <div className="flex items-center justify-between text-[11px] col-span-2">
                          <span className="text-gray-400">Rank Bonus</span>
                          <span className="font-mono text-purple-600">${month.rankBonus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projected growth */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
              <div className="text-[13px] font-bold text-black mb-3">Projected at Road Captain Rank</div>
              <div className="space-y-2">
                {[
                  { label: "Est. residual (10 direct, 15 level 2)", value: "$780/mo" },
                  { label: "Rank advancement bonus", value: "$500 one-time" },
                  { label: "DCP matching (team activity)", value: "~25,000 DCP/mo" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-bold text-black">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <div className="space-y-4">
            {/* Referral link */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5">
              <div className="text-[13px] font-bold text-black mb-1">Your Referral Link</div>
              <div className="text-[11px] text-gray-400 mb-3">Share this link to earn referral bonuses and grow your downline.</div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3 mb-3">
                <Link size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[12px] text-gray-600 flex-1 truncate font-mono">{referralLink}</span>
                <button
                  onClick={copyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex-shrink-0 ${copied ? "bg-green-500 text-white" : "bg-black text-white"}`}
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Share on X", color: "bg-black text-white" },
                  { label: "Share on Facebook", color: "bg-blue-600 text-white" },
                  { label: "Copy Message", color: "border border-gray-200 text-black" },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (btn.label === "Copy Message") {
                        navigator.clipboard.writeText(`🚗 I just joined DreamCarz Network — the luxury car membership that pays you back! Use my link to join and we both earn: ${referralLink}`);
                        toast.success("Message copied!");
                      } else {
                        toast.info("Opening share dialog...");
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${btn.color}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Share templates */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5">
              <div className="text-[13px] font-bold text-black mb-3">Ready-to-Send Messages</div>
              <div className="space-y-3">
                {[
                  {
                    platform: "Text/DM",
                    message: `Hey! I've been using DreamCarz Network — it's a luxury car membership where you actually earn points toward owning your dream car. Join through my link and get started: ${referralLink}`,
                  },
                  {
                    platform: "Social Post",
                    message: `🚗 Driving luxury cars AND building passive income? That's what DreamCarz Network is. Every rental earns DCP points toward your dream car. Join my team: ${referralLink} #DreamCarz #DriveNetwork`,
                  },
                  {
                    platform: "Email",
                    message: `Subject: You need to check out DreamCarz Network\n\nHey,\n\nI wanted to share something I've been part of — DreamCarz Network. It's a luxury car membership where you earn Dream Carz Points (DCP) on every rental that can be redeemed toward purchasing your dream car.\n\nThere's also a referral program where we both benefit when you join through my link:\n${referralLink}\n\nLet me know if you have questions!`,
                  },
                ].map((template, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-black">{template.platform}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(template.message); toast.success("Message copied!"); }}
                        className="text-[10px] text-gray-400 hover:text-black flex items-center gap-1"
                      >
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{template.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard teaser */}
            <div className="bg-black text-white rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} style={{ color: "#C9A84C" }} />
                <span className="text-[13px] font-bold">Dream Ambassador Leaderboard</span>
              </div>
              <p className="text-[12px] text-white/50 mb-3">Top 50 Dream Ambassadors share 2% of monthly company revenue. Current pool estimate: <span className="text-white font-bold">$12,400/quarter</span></p>
              <div className="space-y-2">
                {["Ambassador #1 — $4,200/mo", "Ambassador #2 — $3,800/mo", "Ambassador #3 — $3,400/mo"].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 opacity-60">
                    <span className="text-[11px] font-mono text-white/40">#{i + 1}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${90 - i * 10}%`, background: "#C9A84C" }} />
                    </div>
                    <span className="text-[10px] text-white/40">{a.split("—")[1]}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/30 mt-3">Reach Dream Ambassador rank to unlock your share of the pool.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
