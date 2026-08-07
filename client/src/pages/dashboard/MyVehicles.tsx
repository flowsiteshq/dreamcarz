import { useState } from "react";
import { Car, Gauge, Zap, Clock, Plus, X, Phone, CalendarDays, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";

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
  const [manageOpen, setManageOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [extendSubmitted, setExtendSubmitted] = useState(false);
  const [manageAction, setManageAction] = useState<string | null>(null);

  const handleExtendSubmit = () => {
    setExtendSubmitted(true);
    setTimeout(() => {
      setExtendOpen(false);
      setExtendSubmitted(false);
    }, 2500);
  };

  const newEndDate = new Date(new Date("2026-06-28").getTime() + extendDays * 86400000)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      {/* MANAGE MODAL */}
      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => { setManageOpen(false); setManageAction(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-36 overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a, #000)" }}>
              <div className="absolute inset-0 opacity-40">
                <img src="/manus-storage/dash-car-current_6e167bf1.png" alt="Porsche" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 p-5 flex items-start justify-between h-full">
                <div className="mt-auto">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Managing</p>
                  <p className="text-white font-bold text-[16px]" style={{ fontFamily: "var(--font-display)" }}>2024 Porsche 911 Carrera S</p>
                  <p className="text-gray-400 text-[11px]">Deluxe Plan · 18 days remaining</p>
                </div>
                <button onClick={() => { setManageOpen(false); setManageAction(null); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={14} className="text-white" />
                </button>
              </div>
            </div>
            {!manageAction ? (
              <div className="p-5 space-y-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">What would you like to do?</p>
                {[
                  { icon: CalendarDays, label: "Extend Rental", desc: "Add more days to your current rental", action: "extend" },
                  { icon: Car, label: "Swap Vehicle", desc: "Switch to a different vehicle in the fleet", action: "swap" },
                  { icon: MapPin, label: "Update Pickup Location", desc: "Change your pickup or drop-off address", action: "location" },
                  { icon: Phone, label: "Contact Concierge", desc: "Speak directly with a DreamCarz team member", action: "call" },
                  { icon: AlertCircle, label: "Report an Issue", desc: "Report damage, mechanical issue, or concern", action: "report" },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button key={i} onClick={() => {
                      if (a.action === "call") { window.location.href = "tel:3017722500"; return; }
                      if (a.action === "extend") { setManageOpen(false); setExtendOpen(true); return; }
                      setManageAction(a.action);
                    }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-black" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-black">{a.label}</p>
                        <p className="text-[11px] text-gray-400">{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-5">
                <button onClick={() => setManageAction(null)} className="text-[12px] text-gray-400 hover:text-black transition-colors mb-4 block">← Back</button>
                {manageAction === "swap" && (
                  <div className="text-center py-4">
                    <Car size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-black mb-1">Vehicle Swap Request</p>
                    <p className="text-[12px] text-gray-500 mb-4">Our concierge team will contact you within 2 hours to arrange your vehicle swap.</p>
                    <button onClick={() => setManageAction("swap-done")} className="w-full py-3 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Submit Swap Request</button>
                  </div>
                )}
                {manageAction === "swap-done" && (
                  <div className="text-center py-4">
                    <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-black mb-1">Request Submitted!</p>
                    <p className="text-[12px] text-gray-500">We'll call you at (301) 772-2500 within 2 hours to confirm your swap.</p>
                  </div>
                )}
                {manageAction === "location" && (
                  <div>
                    <p className="text-[13px] font-bold text-black mb-3">Update Pickup Location</p>
                    <input type="text" placeholder="Enter new address..." className="w-full p-3 bg-gray-50 rounded-xl text-[13px] outline-none border border-gray-100 focus:border-gray-300 transition-colors mb-3" />
                    <button className="w-full py-3 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Update Location</button>
                  </div>
                )}
                {manageAction === "report" && (
                  <div>
                    <p className="text-[13px] font-bold text-black mb-3">Report an Issue</p>
                    <textarea placeholder="Describe the issue..." className="w-full h-24 p-3 bg-gray-50 rounded-xl text-[13px] outline-none border border-gray-100 focus:border-gray-300 transition-colors resize-none mb-3" />
                    <button className="w-full py-3 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Submit Report</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXTEND MODAL */}
      {extendOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => { setExtendOpen(false); setExtendSubmitted(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Extend Rental</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">2024 Porsche 911 Carrera S</p>
              </div>
              <button onClick={() => { setExtendOpen(false); setExtendSubmitted(false); }} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={14} className="text-black" />
              </button>
            </div>
            {!extendSubmitted ? (
              <>
                <p className="text-[12px] text-gray-500 mb-4">Current rental ends <strong className="text-black">Jun 28, 2026</strong>. How many additional days?</p>
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 mb-4">
                  <button onClick={() => setExtendDays(d => Math.max(1, d - 1))} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-black text-xl font-bold hover:border-gray-400 transition-colors flex items-center justify-center active:scale-95">−</button>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{extendDays}</p>
                    <p className="text-[11px] text-gray-400">additional days</p>
                  </div>
                  <button onClick={() => setExtendDays(d => Math.min(30, d + 1))} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-black text-xl font-bold hover:border-gray-400 transition-colors flex items-center justify-center active:scale-95">+</button>
                </div>
                <div className="flex gap-2 mb-5">
                  {[3, 7, 14, 30].map(d => (
                    <button key={d} onClick={() => setExtendDays(d)} className={`flex-1 py-2 text-[11px] font-semibold rounded-full transition-colors ${extendDays === d ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{d}d</button>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-gray-500">{extendDays} days × $245/day</span>
                    <span className="font-semibold text-black">${(extendDays * 245).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-gray-500">Pro Member discount (15%)</span>
                    <span className="font-semibold text-green-600">−${Math.round(extendDays * 245 * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px] pt-2 border-t border-gray-200">
                    <span className="font-semibold text-black">Total</span>
                    <span className="font-bold text-black">${Math.round(extendDays * 245 * 0.85).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-green-600 mt-1.5 font-medium">+{(extendDays * 245 * 10).toLocaleString()} DCP earned on this extension</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">New end date: <strong className="text-black">{newEndDate}</strong></p>
                <button onClick={handleExtendSubmit} className="w-full py-3 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-gray-900 transition-colors active:scale-[0.98]">
                  Confirm Extension · ${Math.round(extendDays * 245 * 0.85).toLocaleString()}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">Subject to vehicle availability. Our team will confirm within 1 hour.</p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <p className="text-[16px] font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Extension Requested!</p>
                <p className="text-[12px] text-gray-500">We'll confirm your {extendDays}-day extension within 1 hour. Check your email for confirmation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <DashboardShell title="My Vehicles">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>My Vehicles</h2>
              <p className="text-sm text-gray-400 mt-0.5">Your garage — current, reserved, and wishlist vehicles</p>
            </div>
            <Link href="/dashboard/vehicles" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
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
                        <button onClick={() => setManageOpen(true)} className="flex-1 py-2 bg-white text-black text-[11px] font-semibold rounded-full border border-white/20 hover:bg-gray-100 transition-colors active:scale-[0.97]">Manage</button>
                        <button onClick={() => setExtendOpen(true)} className="flex-1 py-2 border border-white/20 text-white text-[11px] rounded-full hover:bg-white/10 transition-colors active:scale-[0.97]">Extend</button>
                      </>
                    )}
                    {v.status === "Reserved" && (
                      <button className="flex-1 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">View Reservation</button>
                    )}
                    {v.status === "Wishlist" && (
                      <Link href="/dashboard/membership" className="flex-1 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors text-center">Upgrade Now</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
    </>
  );
}
