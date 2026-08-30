import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";

const confirmedVehicles = Object.entries(APPROVED_TRANSACTION_VEHICLES);

export function ActiveRentalOptions({ reference, currentVehicleId }: { reference: string; currentVehicleId?: string }) {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [swapVehicleId, setSwapVehicleId] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [extensionNote, setExtensionNote] = useState("");
  const [extensionMessage, setExtensionMessage] = useState("");
  const request = trpc.operations.requestLinkedTransaction.useMutation({
    onSuccess: result => setLocation(`/dashboard/transactions?ref=${encodeURIComponent(result.reference)}`),
    onError: result => setError(result.message),
  });
  const extension = trpc.transactions.requestRentalExtension.useMutation({
    onSuccess: result => { setExtensionMessage(`Extension request received for ${result.requestedEndDate}. DreamCarz will review it before your rental schedule changes.`); setExtensionDate(""); setExtensionNote(""); },
    onError: result => setExtensionMessage(result.message),
  });

  return <div className="mt-5 space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={request.isPending} onClick={() => { setError(""); request.mutate({ reference, linkType: "rent_to_buy" }); }} className="h-10 border border-white/40 px-4 text-xs font-semibold text-white disabled:opacity-60">{request.isPending ? "Starting review…" : "Request rent-to-buy review"}</button>
      {error ? <p className="text-xs text-amber-200">{error}</p> : null}
    </div>
    <div className="border border-white/20 p-3"><p className="text-xs font-semibold text-white">Request a vehicle swap</p><p className="mt-1 text-[11px] leading-5 text-white/65">Choose another confirmed DreamCarz vehicle to request a review. This does not change your rental, guarantee vehicle availability, or create pricing; DreamCarz reviews the current rental, vehicle condition, eligibility, and available inventory first.</p><div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]"><select value={swapVehicleId} onChange={event => setSwapVehicleId(event.target.value)} className="h-10 min-w-0 border border-white/25 bg-white px-2 text-xs text-black"><option value="">Select a confirmed vehicle</option>{confirmedVehicles.filter(([vehicleId]) => vehicleId !== currentVehicleId).map(([vehicleId, vehicle]) => <option key={vehicleId} value={vehicleId}>{vehicle.vehicleName}</option>)}</select><button type="button" disabled={!swapVehicleId || request.isPending} onClick={() => { setError(""); request.mutate({ reference, linkType: "swap", targetVehicleId: swapVehicleId }); }} className="h-10 border border-white bg-white px-4 text-xs font-semibold text-black disabled:opacity-60">{request.isPending ? "Starting review…" : "Request swap review"}</button></div></div>
    <div className="border border-white/20 p-3"><p className="text-xs font-semibold text-white">Request a rental extension</p><p className="mt-1 text-[11px] leading-5 text-white/65">An extension is a request, not an automatic schedule change. DreamCarz will review eligibility and availability before approval.</p><div className="mt-3 grid gap-2 md:grid-cols-[180px_1fr_auto]"><input type="date" value={extensionDate} onChange={event => setExtensionDate(event.target.value)} className="h-10 border border-white/25 bg-white px-2 text-xs text-black" /><input value={extensionNote} maxLength={1000} onChange={event => setExtensionNote(event.target.value)} placeholder="Optional note for DreamCarz" className="h-10 border border-white/25 bg-white px-2 text-xs text-black" /><button type="button" disabled={!extensionDate || extension.isPending} onClick={() => { setExtensionMessage(""); extension.mutate({ reference, requestedEndDate: extensionDate, note: extensionNote.trim() || undefined }); }} className="h-10 border border-white bg-white px-4 text-xs font-semibold text-black disabled:opacity-60">{extension.isPending ? "Sending…" : "Request extension"}</button></div>{extensionMessage ? <p className="mt-3 text-xs leading-5 text-amber-200">{extensionMessage}</p> : null}</div>
  </div>;
}
