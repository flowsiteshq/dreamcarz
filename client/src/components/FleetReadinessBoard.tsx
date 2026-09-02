import { AlertTriangle, CarFront, CheckCircle2, Clock3, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";

const attentionStates = new Set(["inspection_due", "maintenance_due", "out_of_service"]);

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function FleetReadinessBoard() {
  const passports = trpc.operations.vehiclePassports.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const schedules = trpc.operations.fleetCalendar.useQuery(undefined, { refetchOnWindowFocus: false });
  const records = passports.data ?? [];
  const upcoming = (schedules.data ?? []).filter(entry => !entry.requestedEndAt || new Date(entry.requestedEndAt).getTime() >= Date.now());
  const scheduledVehicles = new Set(upcoming.map(entry => entry.vehicleName));
  const available = records.filter(record => record.readinessStatus === "available").length;
  const inUse = records.filter(record => ["reserved", "active_rental"].includes(record.readinessStatus)).length;
  const attention = records.filter(record => attentionStates.has(record.readinessStatus)).length;
  const summary = [
    { label: "Available", count: available, icon: CheckCircle2, tone: "text-emerald-700" },
    { label: "Reserved / active", count: inUse, icon: CarFront, tone: "text-gray-700" },
    { label: "Needs attention", count: attention, icon: AlertTriangle, tone: "text-[#a46c18]" },
    { label: "Upcoming windows", count: upcoming.length, icon: Clock3, tone: "text-gray-700" },
  ];

  return <section className="border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Fleet command</p><h3 className="mt-1 text-[16px] font-bold text-black">Readiness board</h3><p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-500">Live Vehicle Passport status paired with schedule coordination. Customer, payment, location, document, and vehicle-note details remain in their controlled records.</p></div><span className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-600"><Wrench size={14} className="text-[#B8860B]" /> {records.length} tracked vehicles</span></div>
    <div className="mt-5 grid gap-px overflow-hidden border border-gray-200 bg-gray-200 sm:grid-cols-2 xl:grid-cols-4">{summary.map(item => { const Icon = item.icon; return <div key={item.label} className="bg-white p-4"><Icon size={15} className={item.tone} /><p className="mt-4 text-2xl font-bold text-black">{item.count}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">{item.label}</p></div>; })}</div>
    <div className="mt-5 overflow-x-auto border border-gray-200 bg-white"><table className="min-w-[660px] w-full text-left"><thead className="border-b border-gray-200 bg-[#f4f1eb]"><tr className="text-[10px] uppercase tracking-wider text-gray-500"><th className="px-3 py-3">Vehicle</th><th className="px-3 py-3">Readiness</th><th className="px-3 py-3">Schedule coordination</th><th className="px-3 py-3">Last updated</th></tr></thead><tbody>{records.map(record => <tr key={record.id} className="border-b border-gray-100 last:border-0 text-[11px] text-gray-600"><td className="px-3 py-3 font-semibold text-black">{record.vehicleName}</td><td className="px-3 py-3"><span className={attentionStates.has(record.readinessStatus) ? "border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800" : "border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600"}>{label(record.readinessStatus)}</span></td><td className="px-3 py-3 text-[11px]">{scheduledVehicles.has(record.vehicleName) ? "Upcoming schedule window" : "No upcoming window"}</td><td className="px-3 py-3 text-[11px] text-gray-500">{new Date(record.updatedAt).toLocaleDateString()}</td></tr>)}{!passports.isLoading && !records.length && <tr><td colSpan={4} className="px-3 py-10 text-center text-[11px] text-gray-400">No Vehicle Passports have been created for confirmed inventory.</td></tr>}</tbody></table></div>
  </section>;
}
