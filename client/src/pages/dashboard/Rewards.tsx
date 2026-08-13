import DashboardShell from "@/components/DashboardShell";
import { Gift, Zap, TrendingUp, Star, ChevronRight } from "lucide-react";

const rewards = [
  { title: "Free Rental Days", desc: "Use eligible DCP toward qualifying free rental days.", cost: "Eligible DCP", available: true },
  { title: "Lease & Interest Credits", desc: "Apply eligible DCP toward qualifying lease and interest credits.", cost: "Eligible DCP", available: true },
  { title: "Down Payment Assistance", desc: "Use eligible DCP toward qualifying down-payment assistance.", cost: "Eligible DCP", available: true },
  { title: "Vehicle Purchase Credits", desc: "Apply eligible DCP toward qualifying vehicle-purchase credits.", cost: "Eligible DCP", available: true },
  { title: "Service & Maintenance Savings", desc: "Use eligible DCP toward qualifying service and maintenance savings.", cost: "Eligible DCP", available: false },
  { title: "Exclusive Member Perks", desc: "Discover additional eligible member perks as your Dream Carz journey grows.", cost: "Eligible DCP", available: false },
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
          <p className="text-[11px] uppercase tracking-wider text-white/60 mb-1">DCP Program Overview</p>
          <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
          <p className="text-white/60 text-sm mt-1">Earn DCP through qualifying activity and redeem eligible points for real rewards.</p>
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
