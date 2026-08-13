import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, CalendarCheck, Check, AlertTriangle, X, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

function formatDate(value?: Date | string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not submitted";
}

export default function AdminOperations() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const queueQuery = trpc.operations.getQueue.useQuery(undefined, { enabled: user?.role === "admin", refetchOnWindowFocus: false });
  const reviewApplication = trpc.operations.reviewApplication.useMutation({ onSuccess: () => utils.operations.getQueue.invalidate() });
  const reviewReservation = trpc.operations.reviewReservation.useMutation({ onSuccess: () => utils.operations.getQueue.invalidate() });
  const reviewServiceReport = trpc.operations.reviewServiceReport.useMutation({ onSuccess: () => utils.operations.getQueue.invalidate() });
  const partnerQuery = trpc.partners.adminList.useQuery(undefined, { enabled: user?.role === "admin" });
  const setPartnerActive = trpc.partners.setActive.useMutation({ onSuccess: () => partnerQuery.refetch() });
  const [applicationNotes, setApplicationNotes] = useState<Record<number, string>>({});
  const [reservationNotes, setReservationNotes] = useState<Record<number, string>>({});

  if (user?.role !== "admin") {
    return <DashboardShell title="Operations"><div className="rounded-3xl border border-gray-100 bg-white p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-gray-300" size={28} /><h2 className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Administrator access required</h2><p className="mt-2 text-[13px] text-gray-400">This workspace is available only to DreamCarz administrators.</p></div></DashboardShell>;
  }

  const applications = queueQuery.data?.applications ?? [];
  const reservations = queueQuery.data?.reservations ?? [];
  const serviceReports = queueQuery.data?.serviceReports ?? [];
  const applicationsAwaitingReview = applications.filter(item => ["submitted", "under_review", "needs_attention"].includes(item.status)).length;
  const reservationRequestsAwaitingReview = reservations.filter(item => ["submitted", "under_review", "change_requested"].includes(item.status)).length;

  return (
    <DashboardShell title="Operations">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8860B]">DreamCarz operations</p>
            <h2 className="mt-1 text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Member review queue</h2>
            <p className="mt-1 text-[13px] text-gray-400">Approve rental readiness, guide members who need attention, and confirm vehicle requests.</p>
          </div>
          <button onClick={() => queueQuery.refetch()} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[12px] font-semibold text-black hover:border-gray-400"><RefreshCw size={13} className={queueQuery.isFetching ? "animate-spin" : ""} /> Refresh</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-black p-5 text-white"><p className="text-[10px] uppercase tracking-wider text-white/50">Applications to review</p><p className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{applicationsAwaitingReview}</p><p className="mt-1 text-[11px] text-white/50">Rental Setup submissions</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5"><p className="text-[10px] uppercase tracking-wider text-gray-400">Vehicle requests</p><p className="mt-2 text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{reservationRequestsAwaitingReview}</p><p className="mt-1 text-[11px] text-gray-400">Awaiting availability review</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5"><p className="text-[10px] uppercase tracking-wider text-gray-400">Approved members</p><p className="mt-2 text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{applications.filter(item => item.status === "approved").length}</p><p className="mt-1 text-[11px] text-gray-400">Eligible for requests</p></div>
        </div>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><ClipboardCheck size={17} className="text-[#B8860B]" /><h3 className="text-[16px] font-bold text-black">Rental Setup approvals</h3></div>
          {queueQuery.isLoading ? <p className="py-8 text-center text-[13px] text-gray-400">Loading applications…</p> : applications.length ? <div className="space-y-4">{applications.map((application) => (
            <div key={application.id} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[14px] font-bold text-black">{application.memberName || "Member"}</p><p className="text-[11px] text-gray-400">{application.memberEmail || "No email"} · Submitted {formatDate(application.submittedAt)}</p></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">{application.status.replaceAll("_", " ")}</span></div>
              <div className="mt-3 grid gap-2 text-[12px] text-gray-500 sm:grid-cols-3"><p>Identity: <span className="font-semibold text-black">{application.identityVerificationStatus.replaceAll("_", " ")}</span></p><p>Requested: <span className="font-semibold text-black">{application.requestedStartDate || "—"}</span></p><p>Pickup: <span className="font-semibold text-black">{application.pickupLocation || "—"}</span></p></div>
              <textarea value={applicationNotes[application.id] ?? application.reviewNote ?? ""} onChange={event => setApplicationNotes(current => ({ ...current, [application.id]: event.target.value }))} placeholder="Optional member-facing review note" rows={2} className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-gray-300" />
              <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => reviewApplication.mutate({ id: application.id, status: "approved", reviewNote: applicationNotes[application.id] })} className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-[11px] font-semibold text-white"><Check size={12} /> Approve</button><button onClick={() => reviewApplication.mutate({ id: application.id, status: "needs_attention", reviewNote: applicationNotes[application.id] })} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3.5 py-2 text-[11px] font-semibold text-amber-800"><AlertTriangle size={12} /> Needs Attention</button><button onClick={() => reviewApplication.mutate({ id: application.id, status: "declined", reviewNote: applicationNotes[application.id] })} className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3.5 py-2 text-[11px] font-semibold text-red-600"><X size={12} /> Decline</button></div>
            </div>))}</div> : <p className="py-8 text-center text-[13px] text-gray-400">No rental applications have been submitted yet.</p>}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><CalendarCheck size={17} className="text-[#B8860B]" /><h3 className="text-[16px] font-bold text-black">Vehicle request review</h3></div>
          {queueQuery.isLoading ? <p className="py-8 text-center text-[13px] text-gray-400">Loading vehicle requests…</p> : reservations.length ? <div className="space-y-4">{reservations.map((reservation) => (
            <div key={reservation.id} className="rounded-2xl border border-gray-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[14px] font-bold text-black">{reservation.vehicleName}</p><p className="text-[11px] text-gray-400">{reservation.reference} · {reservation.memberName || "Member"} · {reservation.memberEmail || "No email"}</p></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">{reservation.status.replaceAll("_", " ")}</span></div><div className="mt-3 grid gap-2 text-[12px] text-gray-500 sm:grid-cols-3"><p>Dates: <span className="font-semibold text-black">{reservation.requestedStartDate} – {reservation.requestedEndDate}</span></p><p>Pickup: <span className="font-semibold text-black">{reservation.pickupLocation}</span></p><p>Phone: <span className="font-semibold text-black">{reservation.contactPhone}</span></p></div>{reservation.notes && <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-[12px] text-gray-500">Member note: {reservation.notes}</p>}<textarea value={reservationNotes[reservation.id] ?? reservation.reviewNote ?? ""} onChange={event => setReservationNotes(current => ({ ...current, [reservation.id]: event.target.value }))} placeholder="Optional member-facing availability note" rows={2} className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] outline-none focus:border-gray-300" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => reviewReservation.mutate({ id: reservation.id, status: "confirmed", reviewNote: reservationNotes[reservation.id] })} className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-[11px] font-semibold text-white"><Check size={12} /> Confirm</button><button onClick={() => reviewReservation.mutate({ id: reservation.id, status: "change_requested", reviewNote: reservationNotes[reservation.id] })} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3.5 py-2 text-[11px] font-semibold text-amber-800"><AlertTriangle size={12} /> Request Change</button><button onClick={() => reviewReservation.mutate({ id: reservation.id, status: "declined", reviewNote: reservationNotes[reservation.id] })} className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3.5 py-2 text-[11px] font-semibold text-red-600"><X size={12} /> Decline</button></div></div>))}</div> : <p className="py-8 text-center text-[13px] text-gray-400">No vehicle requests have been submitted yet.</p>}
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><AlertTriangle size={17} className="text-[#B8860B]" /><h3 className="text-[16px] font-bold text-black">Service & incident reports</h3></div>
          {serviceReports.length ? <div className="space-y-3">{serviceReports.map(report => <div key={report.id} className="rounded-2xl border border-gray-100 p-4"><div className="flex justify-between gap-3"><div><p className="text-[14px] font-bold text-black">{report.category} · {report.vehicleName}</p><p className="text-[11px] text-gray-400">{report.reference} · {report.memberName || "Member"} · {formatDate(report.createdAt)}</p></div><span className="text-[10px] font-bold uppercase text-red-600">{report.urgency} · {report.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-[12px] text-gray-600">{report.description}</p>{report.history.length ? <div className="mt-3 border-l-2 border-gray-100 pl-3">{report.history.map(event => <div key={event.id} className="mb-2 last:mb-0"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{event.status.replaceAll("_", " ")} · {formatDate(event.createdAt)}</p>{event.note && <p className="mt-0.5 text-[11px] text-gray-500">{event.note}</p>}</div>)}</div> : null}<div className="mt-3 flex gap-2"><button onClick={() => reviewServiceReport.mutate({ id: report.id, status: "under_review" })} className="rounded-full bg-black px-3 py-2 text-[11px] font-semibold text-white">Review</button><button onClick={() => reviewServiceReport.mutate({ id: report.id, status: "assigned" })} className="rounded-full border border-amber-200 px-3 py-2 text-[11px] font-semibold text-amber-800">Assign</button><button onClick={() => reviewServiceReport.mutate({ id: report.id, status: "resolved" })} className="rounded-full border border-green-200 px-3 py-2 text-[11px] font-semibold text-green-700">Resolve</button></div></div>)}</div> : <p className="py-8 text-center text-[13px] text-gray-400">No service or incident reports have been submitted yet.</p>}
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-bold text-black">Partner directory</h3><span className="text-[11px] text-gray-400">{partnerQuery.data?.length || 0} listings</span></div><div className="space-y-2">{partnerQuery.data?.map(partner => <div key={partner.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"><div><p className="text-[12px] font-bold text-black">{partner.name}</p><p className="text-[10px] text-gray-400">{partner.category} · {partner.city}, {partner.state}</p></div><button onClick={() => setPartnerActive.mutate({ id: partner.id, isActive: !Boolean(partner.isActive) })} className="rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-black">{partner.isActive ? "Deactivate" : "Activate"}</button></div>) || <p className="text-[12px] text-gray-400">No managed partner listings yet.</p>}</div></section>
      </div>
    </DashboardShell>
  );
}
