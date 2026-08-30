import { useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function RentalExtensionQueue() {
  const extensions = trpc.operations.rentalExtensions.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const review = trpc.operations.rentalExtensions.review.useMutation({ onSuccess: () => extensions.refetch() });
  const pendingCount = extensions.data?.filter(item => item.status === "pending").length ?? 0;

  const decide = (requestId: number, decision: "approved" | "declined") => {
    const reviewNote = notes[requestId]?.trim();
    if (!reviewNote) return;
    review.mutate({ requestId, decision, reviewNote });
  };

  return <section className="mt-6 border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Rental changes</p><h3 className="mt-1 text-[16px] font-bold text-black">Extension review queue</h3><p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-500">Approve only after confirming availability, agreement requirements, and any revised approved pricing. An approval updates the requested rental end date and creates an audit event.</p></div><span className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-700"><CalendarClock size={14} className="text-[#B8860B]" /> {pendingCount} pending</span></div>
    <div className="mt-5 space-y-3">{extensions.data?.map(request => <article key={request.id} className="border border-gray-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-black">{request.vehicleName}</p><p className="mt-1 text-[10px] text-gray-500">{request.customerName || "Customer profile incomplete"} · {request.reference}</p></div><span className={request.status === "pending" ? "border border-[#d7b458] bg-[#fffaf0] px-2 py-1 text-[10px] font-bold uppercase text-[#936f17]" : "border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase text-gray-500"}>{request.status}</span></div><div className="mt-3 grid gap-2 text-[11px] leading-5 text-gray-600 sm:grid-cols-2"><p>Requested end: <span className="font-semibold text-black">{request.requestedEndDate}</span></p><p>Requested: {new Date(request.requestedAt).toLocaleString()}</p></div>{request.customerNote ? <p className="mt-3 border-t border-gray-100 pt-3 text-[11px] leading-5 text-gray-600">Customer note: {request.customerNote}</p> : null}{request.status === "pending" ? <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]"><input value={notes[request.id] || ""} onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))} placeholder="Required decision note" className="h-10 border border-gray-300 bg-white px-3 text-xs text-black" /><button type="button" disabled={review.isPending || !(notes[request.id]?.trim())} onClick={() => decide(request.id, "approved")} className="inline-flex h-10 items-center justify-center gap-2 bg-black px-3 text-xs font-semibold text-white disabled:opacity-50"><Check size={14} /> Approve</button><button type="button" disabled={review.isPending || !(notes[request.id]?.trim())} onClick={() => decide(request.id, "declined")} className="inline-flex h-10 items-center justify-center gap-2 border border-gray-300 px-3 text-xs font-semibold text-black disabled:opacity-50"><X size={14} /> Decline</button></div> : <p className="mt-3 text-[11px] leading-5 text-gray-500">Decision note: {request.reviewNote || "Not recorded"}</p>}</article>)}{!extensions.isLoading && !extensions.data?.length ? <div className="border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">No rental extension requests have been submitted.</div> : null}</div>
  </section>;
}
