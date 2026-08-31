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
  const uploadInvoice = trpc.operations.vehiclePassports.uploadMaintenanceInvoice.useMutation();
  const openInvoice = trpc.operations.vehiclePassports.maintenanceInvoiceUrl.useMutation();

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

  const attachInvoice = async (maintenanceId: number, file?: File) => {
    if (!file) return;
    if (!(["application/pdf", "image/jpeg", "image/png"] as const).includes(file.type as "application/pdf" | "image/jpeg" | "image/png")) {
      setMessage("Choose a PDF, JPEG, or PNG maintenance invoice.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Maintenance invoices must be 8 MB or smaller.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The invoice could not be read."));
        reader.onerror = () => reject(new Error("The invoice could not be read."));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",", 2)[1];
      if (!base64) throw new Error("The invoice could not be read.");
      setMessage("");
      await uploadInvoice.mutateAsync({ maintenanceId, filename: file.name, contentType: file.type as "application/pdf" | "image/jpeg" | "image/png", base64 });
      await history.refetch();
      setMessage("Maintenance invoice stored as a protected record.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The maintenance invoice could not be uploaded.");
    }
  };

  const openProtectedInvoice = async (maintenanceId: number) => {
    try {
      setMessage("");
      const record = await openInvoice.mutateAsync({ maintenanceId });
      window.open(record.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The maintenance invoice could not be opened.");
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
    {canLoad && !history.isLoading && history.data?.operationalCounts && <div className="mt-5 grid gap-px border border-gray-200 bg-gray-200 sm:grid-cols-2"><div className="bg-[#faf9f6] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Open reservation activity</p><p className="mt-1 text-2xl font-bold text-black">{history.data.operationalCounts.openReservationCount}</p><p className="mt-1 text-[10px] leading-4 text-gray-500">Operational count only. Customer, schedule, pricing, and payment details remain restricted.</p></div><div className="bg-[#faf9f6] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Active rentals</p><p className="mt-1 text-2xl font-bold text-black">{history.data.operationalCounts.activeRentalCount}</p><p className="mt-1 text-[10px] leading-4 text-gray-500">Operational count only. Customer, schedule, pricing, and payment details remain restricted.</p></div></div>}
    {canLoad && <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
      {history.isLoading ? <p className="py-4 text-xs text-gray-500">Loading maintenance records…</p> : history.data?.maintenance.length ? history.data.maintenance.map(item => <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[1fr_190px_auto] md:items-end">
        <div><p className="text-xs font-semibold capitalize text-black">{item.maintenanceType.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-gray-500">Status: <span className="capitalize">{item.status.replaceAll("_", " ")}</span>{item.completedAt ? ` · Completed ${new Date(item.completedAt).toLocaleDateString()}` : ""}</p></div>
        {item.status !== "completed" ? <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Completion date<input type="date" value={completionDates[item.id] ?? ""} onChange={event => setCompletionDates(current => ({ ...current, [item.id]: event.target.value }))} className="mt-1 h-9 w-full border border-gray-300 bg-white px-2 text-xs font-normal text-black" /></label> : <span className="text-[11px] text-gray-400">Closed record</span>}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {item.status !== "completed" && <button type="button" disabled={updateStatus.isPending} onClick={() => void complete(item.id)} className="h-9 bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50">{updateStatus.isPending ? "Saving…" : "Mark completed"}</button>}
          <label className="cursor-pointer border border-black px-3 py-2 text-[10px] font-semibold text-black">{uploadInvoice.isPending ? "Saving…" : "Attach invoice"}<input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={uploadInvoice.isPending} onChange={event => { void attachInvoice(item.id, event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
          {Boolean(item.hasInvoiceDocument) && <button type="button" disabled={openInvoice.isPending} onClick={() => void openProtectedInvoice(item.id)} className="text-[10px] font-semibold underline underline-offset-4 disabled:opacity-50">Open invoice</button>}
        </div>
      </div>) : <p className="py-4 text-xs text-gray-500">No maintenance records are logged for this Vehicle Passport.</p>}
    </div>}
    {canLoad && !history.isLoading && <div className="mt-5 border-t border-gray-200 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Vehicle Passport activity</p>
      <p className="mt-1 text-[11px] leading-5 text-gray-500">A compact audit timeline for recorded operations actions. Document contents, storage references, sensitive vehicle details, and customer records are not shown here.</p>
      <div className="mt-3 divide-y divide-gray-100 border-y border-gray-200">
        {history.data?.activities?.length ? history.data.activities.map(activity => <div key={activity.id} className="flex items-center justify-between gap-4 py-2 text-[11px]"><span className="font-semibold capitalize text-black">{activity.eventType.replaceAll(".", " ").replaceAll("_", " ")}{activity.readinessTransition ? ` · ${activity.readinessTransition.fromReadinessStatus.replaceAll("_", " ")} → ${activity.readinessTransition.toReadinessStatus.replaceAll("_", " ")}` : ""}</span><time className="shrink-0 text-gray-500">{new Date(activity.createdAt).toLocaleString()}</time></div>) : <p className="py-3 text-xs text-gray-500">No audited Vehicle Passport activity is recorded yet.</p>}
      </div>
    </div>}
    {message && <p className={`mt-3 text-xs ${updateStatus.error ? "text-red-600" : "text-gray-600"}`}>{message}</p>}
  </section>;
}
