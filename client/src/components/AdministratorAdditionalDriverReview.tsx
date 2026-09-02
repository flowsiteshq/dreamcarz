import { trpc } from "@/lib/trpc";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function AdministratorAdditionalDriverReview() {
  const [reference, setReference] = useState("");
  const normalizedReference = reference.trim();
  const review = trpc.transactions.adminAdditionalDrivers.useQuery({ reference: normalizedReference }, { enabled: normalizedReference.length >= 8, retry: false });
  return <section className="border border-[#e4e0d9] bg-white p-5 sm:p-6">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Additional-driver review</p>
    <h3 className="mt-1 text-lg font-bold text-black">Review a transaction’s added drivers</h3>
    <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-600">Search a transaction reference to see only driver names and identity/license review statuses. Contact details, documents, and any clearance action remain outside this queue.</p>
    <label className="mt-4 flex max-w-xl items-center gap-2 border border-gray-300 bg-white px-3"><Search size={15} className="text-gray-400" /><input value={reference} onChange={event => setReference(event.target.value)} placeholder="Transaction reference" className="h-10 min-w-0 flex-1 text-sm outline-none" /></label>
    {normalizedReference.length > 0 && normalizedReference.length < 8 ? <p className="mt-3 text-xs text-gray-500">Enter the complete transaction reference.</p> : null}
    {review.isLoading ? <p className="mt-4 flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading protected review data…</p> : null}
    {review.error ? <p className="mt-4 text-xs text-red-700">{review.error.message}</p> : null}
    {review.data ? <div className="mt-4 grid gap-2">{review.data.drivers.length ? review.data.drivers.map(driver => <div key={driver.id} className="flex items-center justify-between gap-4 border border-gray-200 px-4 py-3"><div><p className="text-sm font-semibold text-black">{driver.fullName}</p><p className="mt-1 text-[11px] text-gray-500">Added {new Date(driver.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700"><ShieldCheck size={14} className="text-[#a8832d]" />Identity: {driver.identityStatus} · License: {driver.licenseStatus}</div></div>) : <p className="border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">No additional drivers are recorded for this transaction.</p>}</div> : null}
  </section>;
}
