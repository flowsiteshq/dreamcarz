import { useState } from "react";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function SupportRequestQueue() {
  const queue = trpc.supportRequests.queue.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const review = trpc.supportRequests.review.useMutation({ onSuccess: () => void utils.supportRequests.queue.invalidate() });
  const [drafts, setDrafts] = useState<Record<number, { status: "submitted" | "under_review" | "resolved" | "closed"; customerUpdate: string; internalNote: string }>>({});

  const draftFor = (request: NonNullable<typeof queue.data>[number]) => drafts[request.id] ?? { status: request.status, customerUpdate: "", internalNote: "" };
  const updateDraft = (id: number, update: Partial<{ status: "submitted" | "under_review" | "resolved" | "closed"; customerUpdate: string; internalNote: string }>) => setDrafts(previous => ({ ...previous, [id]: { ...draftFor(queue.data?.find(item => item.id === id) as NonNullable<typeof queue.data>[number]), ...previous[id], ...update } }));

  return <section className="border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2"><MessageSquareText size={17} className="text-[#B8860B]" /><h3 className="text-[16px] font-bold text-black">Support request queue</h3></div>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-500">Private member requests. Customer updates and customer follow-ups are visible only in this authorized queue; internal notes stay in operations. Sending an update does not create email, SMS, or live-chat delivery.</p>
      </div>
      <button type="button" onClick={() => void queue.refetch()} className="inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 text-[11px] font-semibold text-black"><RefreshCw size={13} className={queue.isFetching ? "animate-spin" : ""} />Refresh</button>
    </div>
    <div className="mt-5 space-y-3">
      {queue.data?.map(request => {
        const draft = draftFor(request);
        return <article key={request.id} className="border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[11px] font-bold text-black">{request.reference} · {request.subject}</p><p className="mt-1 text-[10px] text-gray-500">{request.category.replaceAll("_", " ")} · {request.urgency} · submitted {new Date(request.createdAt).toLocaleDateString()}</p></div>
            <span className="border border-gray-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-700">{request.status.replaceAll("_", " ")}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[12px] leading-5 text-gray-700">{request.description}</p>
          {request.customerFollowUps.length > 0 && <div className="mt-4 border-y border-gray-100 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a6710]">Customer follow-ups</p>
            <div className="mt-2 space-y-2">{request.customerFollowUps.map(event => <div key={event.id} className="border-l-2 border-[#B8860B] pl-3"><p className="whitespace-pre-wrap text-[11px] text-gray-700">{event.message}</p><p className="mt-0.5 text-[10px] text-gray-400">{new Date(event.createdAt).toLocaleString()}</p></div>)}</div>
          </div>}
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Status<select value={draft.status} onChange={event => updateDraft(request.id, { status: event.target.value as typeof draft.status })} className="mt-1 h-9 w-full border border-gray-300 bg-white px-2 text-[11px] font-medium text-black"><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
            <label className="lg:col-span-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">Customer update<textarea value={draft.customerUpdate} onChange={event => updateDraft(request.id, { customerUpdate: event.target.value })} rows={2} placeholder="Optional private update visible to the member" className="mt-1 w-full border border-gray-300 bg-white p-2 text-[11px] font-normal text-black outline-none focus:border-black" /></label>
            <label className="lg:col-span-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">Internal note<textarea value={draft.internalNote} onChange={event => updateDraft(request.id, { internalNote: event.target.value })} rows={2} placeholder="Optional internal operations note" className="mt-1 w-full border border-gray-300 bg-white p-2 text-[11px] font-normal text-black outline-none focus:border-black" /></label>
          </div>
          <button type="button" disabled={review.isPending} onClick={() => review.mutate({ supportRequestId: request.id, status: draft.status, customerUpdate: draft.customerUpdate.trim() || undefined, internalNote: draft.internalNote.trim() || undefined })} className="mt-3 h-9 bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50">{review.isPending ? "Saving…" : "Save review"}</button>
        </article>;
      })}
      {!queue.isLoading && !queue.data?.length ? <p className="border border-dashed border-gray-300 bg-white p-5 text-[12px] text-gray-500">No support requests are waiting for review.</p> : null}
    </div>
    {queue.error || review.error ? <p className="mt-3 text-[11px] text-red-600">{queue.error?.message || review.error?.message}</p> : null}
  </section>;
}
