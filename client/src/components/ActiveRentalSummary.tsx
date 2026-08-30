import { ArrowRight, Car, FileText, PhoneCall, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ActiveRentalOptions } from "@/components/ActiveRentalOptions";

function formatStatus(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()) : "Not available";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not yet scheduled";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function StatusItem({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="border-t border-white/20 pt-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d1ad54]">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p>{detail ? <p className="mt-1 text-[11px] leading-4 text-white/65">{detail}</p> : null}</div>;
}

export function ActiveRentalSummary() {
  const summary = trpc.transactions.activeRentalSummary.useQuery(undefined, { refetchOnWindowFocus: false });
  if (summary.isLoading) return <section className="border border-gray-200 bg-[#f7f5f0] p-6"><p className="text-sm font-semibold text-black">Loading your current-rental status…</p></section>;
  const rental = summary.data;
  if (!rental) return null;
  const handoffDetail = rental.schedule?.scheduledHandoffAt
    ? formatDate(rental.schedule.scheduledHandoffAt)
    : rental.schedule?.pickupMethod === "pickup" && rental.schedule.pickupLocation
      ? rental.schedule.pickupLocation
      : "DreamCarz will confirm handoff details in your private journey.";

  return <section className="border border-black bg-black p-5 text-white sm:p-7">
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1ad54]">Current vehicle · private rental status</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h3 className="font-display text-3xl font-bold tracking-[-0.04em]">{rental.vehicle.name}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Use this secure overview for return planning, agreement records, condition status, support, and eligible next-step requests. Amounts, payment references, and private documents are not displayed here.</p></div><span className="border border-[#d1ad54]/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e7c66f]">{formatStatus(rental.lifecycle.activeRentalStatus)}</span></div>
        <div className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatusItem label="Return details" value={formatDate(rental.schedule?.requestedEndAt)} detail={rental.schedule?.pickupMethod ? `${formatStatus(rental.schedule.pickupMethod)} return arrangement` : "Return arrangement pending"} />
          <StatusItem label="Handoff" value={formatStatus(rental.schedule?.handoffStatus ?? rental.lifecycle.pickupStatus)} detail={handoffDetail} />
          <StatusItem label="Agreement" value={formatStatus(rental.lifecycle.agreementStatus)} detail={rental.agreement?.signedAt ? `Signed ${formatDate(rental.agreement.signedAt)}` : "Review the private record for current details."} />
          <StatusItem label="Payment status" value={formatStatus(rental.lifecycle.paymentStatus)} detail="Status only; no payment details are shown." />
          <StatusItem label="Condition records" value={`Pickup: ${formatStatus(rental.condition.pickup?.status ?? "not_started")}`} detail={`Return: ${formatStatus(rental.condition.return?.status ?? rental.lifecycle.returnStatus)}`} />
          <StatusItem label="Settlement" value={formatStatus(rental.lifecycle.settlementStatus)} detail="Reviewed return items remain available through your private journey." />
        </div>
      </div>
      <aside className="border border-white/20 bg-white/[0.06] p-4 sm:p-5">
        {rental.vehicle.image ? <img src={rental.vehicle.image} alt={rental.vehicle.name} className="mx-auto h-32 w-full object-contain" /> : <div className="grid h-32 place-items-center border border-white/15 text-white/55"><Car size={28} /></div>}
        <div className="mt-5 grid gap-2"><Link href={`/dashboard/transactions?ref=${encodeURIComponent(rental.reference)}`} className="inline-flex h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-black">Manage rental <ArrowRight size={15} /></Link><Link href={`/dashboard/transactions?ref=${encodeURIComponent(rental.reference)}`} className="inline-flex h-10 items-center justify-center gap-2 border border-white/35 px-4 text-xs font-semibold text-white"><FileText size={14} /> My agreement & records</Link><Link href="/dashboard/incidents" className="inline-flex h-10 items-center justify-center gap-2 border border-white/35 px-4 text-xs font-semibold text-white"><ShieldCheck size={14} /> Report an issue or incident</Link><Link href="/dashboard/support" className="inline-flex h-10 items-center justify-center gap-2 border border-white/35 px-4 text-xs font-semibold text-white"><PhoneCall size={14} /> Contact DreamCarz</Link></div>
      </aside>
    </div>
    <div className="mt-7 border-t border-white/20 pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1ad54]">Available next steps</p><ActiveRentalOptions reference={rental.reference} currentVehicleId={rental.vehicle.id} /></div>
  </section>;
}
