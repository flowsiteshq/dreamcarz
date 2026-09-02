import { CalendarDays, CarFront, Clock3, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled";
}

function formatDateTime(value: Date | null) {
  return value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not scheduled";
}

export function FleetOperationsCalendar() {
  const calendar = trpc.operations.fleetCalendar.useQuery(undefined, { refetchOnWindowFocus: false });
  const entries = calendar.data ?? [];
  const upcomingEntries = entries.filter(entry => !entry.requestedEndAt || new Date(entry.requestedEndAt).getTime() >= Date.now()).slice(0, 12);

  return <section className="border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Fleet scheduling</p><h3 className="mt-1 text-[16px] font-bold text-black">Operations calendar</h3><p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-500">Coordinate actual vehicle windows and handoff status. Customer contact, payment, location, and document details stay out of this schedule view.</p></div><span className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-600"><CalendarDays size={14} className="text-[#B8860B]" /> {upcomingEntries.length} upcoming windows</span></div>

    <div className="mt-5 overflow-x-auto border border-gray-200 bg-white"><table className="min-w-[760px] w-full text-left"><thead className="border-b border-gray-200 bg-[#f4f1eb]"><tr className="text-[10px] uppercase tracking-wider text-gray-500"><th className="px-3 py-3">Vehicle</th><th className="px-3 py-3">Window</th><th className="px-3 py-3">Handoff</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{upcomingEntries.map(entry => <tr key={entry.reference} className="border-b border-gray-100 last:border-0 text-[11px] text-gray-600"><td className="px-3 py-3"><p className="flex items-center gap-1.5 font-semibold text-black"><CarFront size={13} className="text-[#B8860B]" />{entry.vehicleName}</p><p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-400">{entry.transactionType} · {entry.reference}</p></td><td className="px-3 py-3"><p className="font-medium text-gray-700">{formatDate(entry.requestedStartAt)} — {formatDate(entry.requestedEndAt)}</p><p className="mt-0.5 text-[10px] text-gray-400">Requested window</p></td><td className="px-3 py-3"><p className="flex items-center gap-1.5 font-medium text-gray-700"><Clock3 size={12} className="text-[#B8860B]" />{formatDateTime(entry.scheduledHandoffAt)}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400"><MapPin size={10} />{entry.pickupMethod || "Method pending"}</p></td><td className="px-3 py-3"><span className="inline-block border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">{entry.handoffStatus.replaceAll("_", " ")}</span><p className="mt-1 text-[10px] text-gray-400">{entry.transactionStatus.replaceAll("_", " ")}</p></td></tr>)}{!calendar.isLoading && !upcomingEntries.length && <tr><td colSpan={4} className="px-3 py-10 text-center text-[11px] text-gray-400">No future rental or purchase schedule windows have been recorded.</td></tr>}</tbody></table></div>
  </section>;
}
