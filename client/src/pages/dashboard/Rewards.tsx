import DashboardShell from "@/components/DashboardShell";
import { Gift, Zap, TrendingUp, Star, ChevronRight } from "lucide-react";

const rewards = [
  { title: "Free Weekend Rental", desc: "Redeem 50,000 DCP for a complimentary weekend in any vehicle up to $40K value.", cost: "50,000 DCP", available: true },
  { title: "Membership Month Free", desc: "Redeem 100,000 DCP for one free month at your current membership tier.", cost: "100,000 DCP", available: true },
  { title: "Vehicle Upgrade Credit", desc: "Apply 75,000 DCP toward upgrading to the next membership tier for 3 months.", cost: "75,000 DCP", available: true },
  { title: "VIP Concierge Day", desc: "Dedicated concierge service for a full day — vehicle delivery, pickup, and personal assistance.", cost: "30,000 DCP", available: true },
  { title: "Credit Free Down Payment", desc: "Apply accumulated DCP toward a Credit Free vehicle purchase down payment.", cost: "200,000 DCP", available: false },
  { title: "Elite Trial Month", desc: "Experience Elite membership for 30 days, including all exclusive vehicles and perks.", cost: "150,000 DCP", available: false },
];

export default function Rewards() {
  return (
    <DashboardShell title="Rewards">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Rewards</h2>
          <p className="text-sm text-gray-400 mt-0.5">Redeem your DCP points for exclusive benefits</p>
        </div>

        {/* DCP balance */}
        <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #111, #333)" }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 translate-x-16 -translate-y-16" />
          <p className="text-[11px] uppercase tracking-wider text-white/60 mb-1">Available DCP Balance</p>
          <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
          <p className="text-white/60 text-sm mt-1">$2,850 in transportation purchasing power</p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Lifetime Earned</p>
              <p className="text-lg font-bold">425,000 DCP</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Redeemed</p>
              <p className="text-lg font-bold">140,000 DCP</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Multiplier</p>
              <p className="text-lg font-bold">1.2x</p>
            </div>
          </div>
        </div>

        {/* Reward catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((r, i) => (
            <div key={i} className={`bg-white rounded-2xl border p-5 flex flex-col hover:shadow-md transition-all duration-300 ${r.available ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Gift size={18} className="text-black" />
              </div>
              <h4 className="text-[14px] font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>{r.title}</h4>
              <p className="text-[11px] text-gray-500 flex-1 mb-3">{r.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-black font-mono">{r.cost}</span>
                {r.available ? (
                  <button className="px-3 py-1.5 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors active:scale-[0.97]">Redeem</button>
                ) : (
                  <span className="text-[10px] text-gray-400 font-medium">Need more DCP</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

