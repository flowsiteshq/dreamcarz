import DashboardShell from "@/components/DashboardShell";
import { CalendarDays, MapPin, Clock, ChevronRight, Plus } from "lucide-react";
import { Link } from "wouter";

const reservations = [
  {
    id: "DC789456",
    vehicle: "2024 Range Rover Sport SE",
    img: "/manus-storage/dash-car-reservation_63adc66d.png",
    start: "May 24, 2026",
    end: "May 28, 2026",
    location: "Lanham, MD",
    status: "Upcoming",
    statusColor: "bg-blue-100 text-blue-700",
    plan: "Pro Plan",
    dailyRate: "$285",
    total: "$1,140",
  },
  {
    id: "DC654321",
    vehicle: "2024 Porsche 911 Carrera S",
    img: "/manus-storage/dash-car-current_6e167bf1.png",
    start: "Apr 10, 2026",
    end: "Jun 28, 2026",
    location: "Lanham, MD",
    status: "Active",
    statusColor: "bg-green-100 text-green-700",
    plan: "Deluxe Plan",
    dailyRate: "$245",
    total: "$18,620",
  },
  {
    id: "DC445566",
    vehicle: "2024 BMW M4 Competition",
    img: "/manus-storage/car-card-2_f7e5a123.png",
    start: "Feb 1, 2026",
    end: "Mar 31, 2026",
    location: "Lanham, MD",
    status: "Completed",
    statusColor: "bg-gray-100 text-gray-500",
    plan: "Pro Plan",
    dailyRate: "$220",
    total: "$13,200",
  },
];

export default function Reservations() {
  return (
    <DashboardShell title="Reservations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Reservations</h2>
            <p className="text-sm text-gray-400 mt-0.5">Manage your active, upcoming, and past reservations</p>
          </div>
          <Link href="/fleet" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
            <Plus size={14} /> New Reservation
          </Link>
        </div>

        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={r.img} alt={r.vehicle} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{r.vehicle}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Reservation #{r.id} · {r.plan}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${r.statusColor}`}>{r.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400"><CalendarDays size={11} /> {r.start} – {r.end}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400"><MapPin size={11} /> {r.location}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={11} /> {r.dailyRate}/day · Total {r.total}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                {r.status === "Active" && (
                  <>
                    <button className="px-4 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Manage</button>
                    <button className="px-4 py-2 border border-gray-200 text-black text-[11px] rounded-full hover:border-gray-400 transition-colors">Extend Rental</button>
                    <button className="px-4 py-2 border border-gray-200 text-black text-[11px] rounded-full hover:border-gray-400 transition-colors">Swap Vehicle</button>
                  </>
                )}
                {r.status === "Upcoming" && (
                  <>
                    <button className="px-4 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">View Details</button>
                    <button className="px-4 py-2 border border-gray-200 text-black text-[11px] rounded-full hover:border-gray-400 transition-colors">Modify</button>
                    <button className="px-4 py-2 border border-red-100 text-red-500 text-[11px] rounded-full hover:bg-red-50 transition-colors">Cancel</button>
                  </>
                )}
                {r.status === "Completed" && (
                  <>
                    <button className="px-4 py-2 border border-gray-200 text-black text-[11px] rounded-full hover:border-gray-400 transition-colors">View Receipt</button>
                    <button className="px-4 py-2 border border-gray-200 text-black text-[11px] rounded-full hover:border-gray-400 transition-colors">Book Again</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

