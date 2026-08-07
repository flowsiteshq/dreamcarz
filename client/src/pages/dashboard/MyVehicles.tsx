import DashboardShell from "@/components/DashboardShell";
import { Car, Gauge, Zap, Navigation, Clock, ChevronRight, Plus } from "lucide-react";
import { Link } from "wouter";

const vehicles = [
  {
    id: 1,
    name: "2024 Porsche 911 Carrera S",
    status: "Currently Driving",
    statusColor: "bg-green-100 text-green-700",
    plan: "Deluxe Plan",
    renews: "Jun 28, 2026",
    mileage: "1,247 mi",
    daysLeft: 18,
    img: "/manus-storage/dash-car-current_6e167bf1.png",
    dark: true,
  },
  {
    id: 2,
    name: "2024 Range Rover Sport SE",
    status: "Reserved",
    statusColor: "bg-blue-100 text-blue-700",
    plan: "Pro Plan",
    renews: "May 24, 2026",
    mileage: "—",
    daysLeft: null,
    img: "/manus-storage/dash-car-reservation_63adc66d.png",
    dark: false,
  },
  {
    id: 3,
    name: "2024 Porsche 911 Turbo S",
    status: "Wishlist",
    statusColor: "bg-yellow-100 text-yellow-700",
    plan: "Upgrade Available",
    renews: "—",
    mileage: "—",
    daysLeft: null,
    img: "/manus-storage/dash-car-upgrade_fe8b1f8d.png",
    dark: false,
  },
];

export default function MyVehicles() {
  return (
    <DashboardShell title="My Vehicles">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>My Vehicles</h2>
            <p className="text-sm text-gray-400 mt-0.5">Your garage — current, reserved, and wishlist vehicles</p>
          </div>
          <Link href="/fleet" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
            <Plus size={14} /> Browse Fleet
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className={`rounded-2xl overflow-hidden border ${v.dark ? "border-0" : "border-gray-100 bg-white"} hover:shadow-md transition-all duration-300`}>
              {v.dark ? (
                <div className="relative h-48" style={{ background: "linear-gradient(135deg, #1a1a1a, #000)" }}>
                  <div className="absolute inset-0 opacity-50">
                    <img src={v.img} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                    <span className={`self-start px-2.5 py-0.5 text-[10px] font-bold rounded-full ${v.statusColor}`}>{v.status}</span>
                    <div>
                      <p className="text-white font-bold text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{v.name}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">{v.plan} · Renews {v.renews}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 bg-gray-50 flex items-center justify-center p-4">
                  <img src={v.img} alt={v.name} className="h-full object-contain" />
                </div>
              )}
              <div className={`p-4 ${v.dark ? "bg-black" : ""}`}>
                {!v.dark && (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{v.name}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${v.statusColor}`}>{v.status}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-3">{v.plan}</p>
                  </>
                )}
                <div className="flex gap-2">
                  {v.status === "Currently Driving" && (
                    <>
                      <button className="flex-1 py-2 bg-white text-black text-[11px] font-semibold rounded-full border border-white/20 hover:bg-gray-100 transition-colors">Manage</button>
                      <button className="flex-1 py-2 border border-white/20 text-white text-[11px] rounded-full hover:bg-white/10 transition-colors">Extend</button>
                    </>
                  )}
                  {v.status === "Reserved" && (
                    <button className="flex-1 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">View Reservation</button>
                  )}
                  {v.status === "Wishlist" && (
                    <button className="flex-1 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Upgrade Now</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Vehicles Driven", value: "5", icon: Car },
            { label: "Total Miles", value: "4,821 mi", icon: Gauge },
            { label: "Active Rentals", value: "1", icon: Zap },
            { label: "Upcoming", value: "1", icon: Clock },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
                <Icon size={18} className="text-gray-400 mb-3" />
                <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

