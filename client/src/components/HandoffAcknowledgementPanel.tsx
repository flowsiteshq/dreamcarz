import { CheckCircle2, MapPin } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function HandoffAcknowledgementPanel({ reference }: { reference: string }) {
  const transactionQuery = trpc.transactions.get.useQuery({ reference }, { enabled: Boolean(reference), refetchOnWindowFocus: false });
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState("");
  const confirm = trpc.transactions.confirmHandoff.useMutation({
    onSuccess: async () => {
      await transactionQuery.refetch();
      setMessage("Your handoff acknowledgement has been recorded. DreamCarz will complete the remaining handoff process separately.");
    },
    onError: error => setMessage(error.message),
  });
  const transaction = transactionQuery.data?.transaction;
  const schedule = transactionQuery.data?.schedule;
  const canConfirm = transaction?.transactionType === "rental" && transaction.status === "ready_for_pickup" && schedule?.handoffStatus === "arrived";
  if (!canConfirm) return null;

  const methodLabel = schedule.pickupMethod === "delivery" ? "delivery" : "pickup";
  const location = schedule.pickupMethod === "delivery" ? schedule.deliveryAddress : schedule.pickupLocation;
  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white"><MapPin size={16} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Handoff acknowledgement</p><h2 className="mt-1 text-xl font-bold text-black">Confirm the {methodLabel} handoff.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">DreamCarz has marked your {methodLabel} as arrived{location ? ` at ${location}` : ""}. Confirm only after you are present for the handoff. This acknowledgement does not activate the rental, confirm vehicle condition, waive any agreement term, or make a payment determination.</p></div></div><label className="mt-5 flex items-start gap-3 border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 accent-black" /><span>I confirm that I am present for this DreamCarz {methodLabel} handoff.</span></label><button type="button" disabled={!acknowledged || confirm.isPending} onClick={() => { setMessage(""); confirm.mutate({ reference, acknowledgesHandoff: true }); }} className="mt-4 inline-flex h-10 items-center gap-2 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15} />{confirm.isPending ? "Recording acknowledgement…" : "Confirm handoff presence"}</button>{message ? <p className="mt-3 text-xs leading-5 text-gray-600">{message}</p> : null}</section>;
}
