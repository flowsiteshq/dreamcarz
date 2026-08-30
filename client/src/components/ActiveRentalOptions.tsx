import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export function ActiveRentalOptions({ reference }: { reference: string }) {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const request = trpc.operations.requestLinkedTransaction.useMutation({
    onSuccess: result => setLocation(`/dashboard/transactions?ref=${encodeURIComponent(result.reference)}`),
    onError: result => setError(result.message),
  });

  return <div className="mt-5 flex flex-wrap items-center gap-3">
    <button type="button" disabled={request.isPending} onClick={() => { setError(""); request.mutate({ reference, linkType: "rent_to_buy" }); }} className="h-10 border border-white/40 px-4 text-xs font-semibold text-white disabled:opacity-60">{request.isPending ? "Starting review…" : "Request rent-to-buy review"}</button>
    {error ? <p className="text-xs text-amber-200">{error}</p> : null}
  </div>;
}
