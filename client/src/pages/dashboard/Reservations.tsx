import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { CalendarDays, MapPin, Clock, ChevronRight, Plus, ClipboardCheck, X } from "lucide-react";
import { Link } from "wouter";

const statusStyles = {
  submitted: "bg-amber-50 text-amber-700",
  under_review: "bg-blue-50 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  change_requested: "bg-orange-50 text-orange-700",
  canceled: "bg-gray-100 text-gray-500",
  declined: "bg-red-50 text-red-600",
} as const;

const statusLabels = {
  submitted: "Submitted",
  under_review: "In Review",
  confirmed: "Confirmed",
  change_requested: "Action Needed",
  canceled: "Canceled",
  declined: "Unavailable",
} as const;

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Reservations() {
  const utils = trpc.useUtils();
  const reservationsQuery = trpc.reservations.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const cancelReservation = trpc.reservations.cancel.useMutation({
    onSuccess: () => utils.reservations.list.invalidate(),
  });

  return (
    <DashboardShell title="Reservations">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Reservations</h2>
            <p className="text-sm text-gray-400 mt-0.5">Track your submitted requests and confirmed DreamCarz reservations.</p>
          </div>
          <Link href="/dashboard/vehicles" className="flex shrink-0 items-center gap-2 px-4 py-2 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
            <Plus size={14} /> New Request
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-amber-50/60 px-4 py-3 text-[12px] leading-relaxed text-amber-900">
          A vehicle request is not a confirmed booking. DreamCarz reviews eligibility, vehicle availability, and your requested dates before confirming your reservation.
        </div>

        {reservationsQuery.isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center text-[13px] text-gray-400">Loading your reservation requests…</div>
        ) : reservationsQuery.data?.length ? (
          <div className="space-y-3">
            {reservationsQuery.data.map((reservation) => {
              const canCancel = ["submitted", "under_review", "change_requested"].includes(reservation.status);
              return (
                <div key={reservation.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={reservation.vehicleImage} alt={reservation.vehicleName} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{reservation.vehicleName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Request #{reservation.reference} · {reservation.memberTier} membership</p>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${statusStyles[reservation.status]}`}>{statusLabels[reservation.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400"><CalendarDays size={11} /> {formatDate(reservation.requestedStartDate)} – {formatDate(reservation.requestedEndDate)}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400"><MapPin size={11} /> {reservation.pickupLocation}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={11} /> Est. ${reservation.estimatedWeeklyFee}/week · Final terms pending review</span>
                      </div>
                      {reservation.reviewNote && <p className="mt-3 text-[12px] leading-relaxed text-gray-500">DreamCarz note: {reservation.reviewNote}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <Link href={`/vehicle?id=${reservation.vehicleId}`} className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">Vehicle Details <ChevronRight size={13} /></Link>
                    {canCancel && <button disabled={cancelReservation.isPending} onClick={() => cancelReservation.mutate({ id: reservation.id })} className="flex items-center gap-1.5 px-4 py-2 border border-red-100 text-red-500 text-[11px] rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"><X size={12} /> Cancel Request</button>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50"><ClipboardCheck size={22} className="text-gray-400" /></div>
            <h3 className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>No reservation requests yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-gray-400">Once your Rental Setup is approved, choose a vehicle and submit the dates that work for you. We’ll keep the entire review in this account.</p>
            <Link href="/dashboard/vehicles" className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white">Browse Vehicles <ChevronRight size={14} /></Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
