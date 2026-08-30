import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function MaintenanceCompletionControl() {
  const passports = trpc.operations.vehiclePassports.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const [passportId, setPassportId] = useState("");
  const [completionDates, setCompletionDates] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const selectedPassportId = Number(passportId);
  const canLoad = Number.isInteger(selectedPassportId) && selectedPassportId > 0;
  const history = trpc.operations.vehiclePassports.operationalHistory.useQuery(
    { vehiclePassportId: selectedPassportId },
    { enabled: canLoad, refetchOnWindowFocus: false },
  );
  const updateStatus = trpc.operations.vehiclePassports.updateMaintenanceStatus.useMutation();

  const complete = async (maintenanceId: number) => {
    const dateValue = completionDates[maintenanceId];
    if (!dateValue) {
      setMessage("Enter the staff-recorded completion date before marking maintenance complete.");
      return;
    }
    const completedAt = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(completedAt.getTime())) {
      setMessage("Enter a valid completion date.");
      return;
    }
    try {
      setMessage("");
      await updateStatus.mutateAsync({ maintenanceId, status: "completed", completedAt });
      await history.refetch();
      setMessage("Maintenance completion saved. Vehicle readiness was not changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The maintenance status could not be updated.");
    }
  };

  return <section className="mt-6 border border-[#ded8cf] bg-white p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#B8860B]" />
      <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Maintenance completion</p><h3 className="mt-1 text-[16px] font-bold text-black">Close a logged service record</h3><p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-500">Record the actual completion date for a logged maintenance item. This updates only that maintenance record; it does not automatically mark the vehicle available, release a rental, or affect settlement.</p></div>
    </div>
    <label className="mt-4 block max-w-xl text-[11px] font-semibold text-gray-600">Vehicle Passport
      <select value={passportId} onChange={event => { setPassportId(event.target.value); setMessage(""); }} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs text-black outline-none focus:border-black">
        <option value="">Select a Vehicle Passport</option>
        {passports.data?.map(passport => <option key={passport.id} value={passport.id}>{passport.vehicleName} · {passport.vehicleId}</option>)}
      </select>
    </label>
    {canLoad && <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
      {history.isLoading ? <p className="py-4 text-xs text-gray-500">Loading maintenance records…</p> : history.data?.maintenance.length ? history.data.maintenance.map(item => <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[1fr_190px_auto] md:items-end">
        <div><p className="text-xs font-semibold capitalize text-black">{item.maintenanceType.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-gray-500">Status: <span className="capitalize">{item.status.replaceAll("_", " ")}</span>{item.completedAt ? ` · Completed ${new Date(item.completedAt).toLocaleDateString()}` : ""}</p></div>
        {item.status !== "completed" ? <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Completion date<input type="date" value={completionDates[item.id] ?? ""} onChange={event => setCompletionDates(current => ({ ...current, [item.id]: event.target.value }))} className="mt-1 h-9 w-full border border-gray-300 bg-white px-2 text-xs font-normal text-black" /></label> : <span className="text-[11px] text-gray-400">Closed record</span>}
        {item.status !== "completed" && <button type="button" disabled={updateStatus.isPending} onClick={() => void complete(item.id)} className="h-9 bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50">{updateStatus.isPending ? "Saving…" : "Mark completed"}</button>}
      </div>) : <p className="py-4 text-xs text-gray-500">No maintenance records are logged for this Vehicle Passport.</p>}
    </div>}
    {message && <p className={`mt-3 text-xs ${updateStatus.error ? "text-red-600" : "text-gray-600"}`}>{message}</p>}
  </section>;
}
