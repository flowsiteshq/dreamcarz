import DashboardShell from "@/components/DashboardShell";
import { Star, Zap, Shield, TrendingUp, ChevronRight, Check } from "lucide-react";
import { Link } from "wouter";

const tiers = [
  { name: "Freedom", color: "#3B82F6", price: "$199/mo", dcp: "1x", vehicles: "Up to $20K", perks: ["Basic fleet access", "1x DCP earning", "Standard support"] },
  { name: "Plus", color: "#8B5CF6", price: "$299/mo", dcp: "1.1x", vehicles: "Up to $40K", perks: ["Extended fleet access", "1.1x DCP earning", "Priority support", "Loyalty bonus"] },
  { name: "Pro", color: "#B8860B", price: "$499/mo", dcp: "1.2x", vehicles: "Up to $80K", perks: ["Full fleet access", "1.2x DCP earning", "Concierge support", "Loyalty bonus", "Swap privilege"] },
  { name: "Elite", color: "#111", price: "$999/mo", dcp: "1.5x", vehicles: "Unlimited", perks: ["All vehicles", "1.5x DCP earning", "24/7 concierge", "Credit Free eligible", "VIP events", "Priority swap"] },
];

export default function MembershipPage() {
  const currentTier = "Pro";
  return (
    <DashboardShell title="Membership">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Membership</h2>
          <p className="text-sm text-gray-400 mt-0.5">Your current plan and upgrade options</p>
        </div>

        {/* Current plan banner */}
        <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #B8860B, #D4A017)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 translate-x-16 -translate-y-16" />
          <p className="text-[11px] uppercase tracking-wider text-white/70 mb-1">Current Plan</p>
          <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Pro Member</h3>
          <p className="text-white/80 text-sm mt-1">$499/month · Renews Jun 28, 2026</p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">DCP Multiplier</p>
              <p className="text-xl font-bold">1.2x</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Vehicle Access</p>
              <p className="text-xl font-bold">Up to $80K</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">DCP Balance</p>
              <p className="text-xl font-bold">285,000</p>
            </div>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => {
            const isCurrent = tier.name === currentTier;
            return (
              <div key={tier.name} className={`rounded-2xl border p-5 flex flex-col transition-all duration-300 hover:shadow-md ${isCurrent ? "border-2 ring-2" : "border-gray-100 bg-white"}`}
                style={isCurrent ? { borderColor: tier.color } : {}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: tier.color }}>
                    <Star size={14} className="text-white" />
                  </div>
                  {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: tier.color }}>Current</span>}
                </div>
                <h4 className="text-[15px] font-bold text-black mb-0.5" style={{ fontFamily: "var(--font-display)" }}>{tier.name}</h4>
                <p className="text-[13px] font-semibold text-black mb-1">{tier.price}</p>
                <p className="text-[11px] text-gray-400 mb-3">{tier.dcp} DCP · {tier.vehicles}</p>
                <div className="space-y-1.5 flex-1">
                  {tier.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                      <Check size={11} className="text-green-500 flex-shrink-0" /> {perk}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  {isCurrent ? (
                    <button className="w-full py-2 border border-gray-200 text-black text-[11px] font-medium rounded-full cursor-default">Current Plan</button>
                  ) : (
                    <Link href="/membership" className="block w-full py-2 text-white text-[11px] font-semibold rounded-full text-center hover:opacity-90 transition-opacity" style={{ background: tier.color }}>
                      {tier.name === "Elite" ? "Upgrade to Elite" : `Switch to ${tier.name}`}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DCP progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-[15px] font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Elite Qualification Progress</h3>
          <p className="text-[12px] text-gray-500 mb-3">You need 315,000 more DCP to qualify for Elite membership.</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: "47%", background: "linear-gradient(90deg, #B8860B, #D4A017)" }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>285,000 DCP earned</span>
            <span>600,000 DCP required</span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
