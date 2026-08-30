import { useState } from "react";
import { trpc } from "@/lib/trpc";

type QuoteLineDraft = {
  lineType: "base_rental" | "membership_discount" | "tax" | "fee" | "protection" | "deposit_authorization" | "credit" | "purchase_price" | "trade_in_credit" | "down_payment" | "other";
  label: string;
  amount: string;
  isConditional: boolean;
};

const blankQuoteLine: QuoteLineDraft = { lineType: "other", label: "", amount: "", isConditional: false };

function formattedCurrency(cents?: number | null) {
  return typeof cents === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100) : "Not calculated";
}

export function TransactionQuoteManager({ detail }: { detail: any }) {
  const utils = trpc.useUtils();
  const [lines, setLines] = useState<QuoteLineDraft[]>([blankQuoteLine]);
  const [sku, setSku] = useState(detail.transaction.cocardProductSku || "");
  const [validUntil, setValidUntil] = useState("");
  const [formError, setFormError] = useState("");
  const createQuote = trpc.operations.createTransactionQuote.useMutation({
    onSuccess: () => {
      utils.operations.transactionDetail.invalidate({ reference: detail.transaction.reference });
      setLines([blankQuoteLine]);
      setFormError("");
    },
  });
  const quotes = detail.quotes ?? [];
  if (!["pricing", "payment", "review"].includes(detail.transaction.currentStep)) return null;

  const updateLine = (index: number, patch: Partial<QuoteLineDraft>) => setLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  const submit = () => {
    const prepared = lines.map(line => ({ ...line, amountCents: Math.round(Number(line.amount) * 100) }));
    if (prepared.some(line => !line.label.trim() || !Number.isFinite(line.amountCents))) {
      setFormError("Enter a clear label and a valid dollar amount for every quote line.");
      return;
    }
    setFormError("");
    createQuote.mutate({
      reference: detail.transaction.reference,
      cocardProductSku: sku.trim() || undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      lines: prepared.map(({ lineType, label, amountCents, isConditional }) => ({ lineType, label: label.trim(), amountCents, isConditional })),
    });
  };

  return <section className="mt-5 border border-[#ded8cf] bg-[#faf9f6] p-4">
    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a46c18]">Versioned quote</p>
    <p className="mt-2 text-xs leading-5 text-gray-600">Create an approved review artifact from verified business terms only. This does not create a charge or promise vehicle availability.</p>
    {quotes.length ? <div className="mt-4 space-y-2">{quotes.map((quote: any) => <article key={quote.id} className="border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-black">Quote v{quote.version} · {quote.status}</p><p className="text-xs font-semibold text-black">Due now: {formattedCurrency(quote.totalDueNowCents)}</p></div>
      {quote.conditionalTotalCents ? <p className="mt-1 text-[10px] text-gray-500">Conditional items: {formattedCurrency(quote.conditionalTotalCents)}</p> : null}
      <div className="mt-2 border-t border-gray-100 pt-2">{quote.lines?.map((line: any) => <p key={line.id} className="flex justify-between gap-3 text-[10px] leading-5 text-gray-600"><span>{line.label}{line.isConditional ? " · conditional" : ""}</span><span>{formattedCurrency(line.amountCents)}</span></p>)}</div>
    </article>)}</div> : <p className="mt-4 text-[11px] text-gray-500">No approved quote has been recorded for this transaction.</p>}
    <div className="mt-5 border-t border-gray-200 pt-4"><p className="text-[11px] font-bold text-black">Issue a new version</p><div className="mt-3 space-y-3">{lines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-[155px_1fr_110px_auto_auto]">
      <select value={line.lineType} onChange={event => updateLine(index, { lineType: event.target.value as QuoteLineDraft["lineType"] })} className="h-9 border border-gray-300 bg-white px-2 text-[11px] text-black"><option value="base_rental">Base rental</option><option value="purchase_price">Purchase price</option><option value="deposit_authorization">Deposit authorization</option><option value="down_payment">Down payment</option><option value="membership_discount">Membership discount</option><option value="trade_in_credit">Trade-in credit</option><option value="tax">Tax</option><option value="fee">Fee</option><option value="protection">Protection</option><option value="credit">Credit</option><option value="other">Other</option></select>
      <input value={line.label} onChange={event => updateLine(index, { label: event.target.value })} placeholder="Verified line description" className="h-9 border border-gray-300 bg-white px-2 text-[11px] text-black" />
      <input value={line.amount} onChange={event => updateLine(index, { amount: event.target.value })} placeholder="0.00" inputMode="decimal" className="h-9 border border-gray-300 bg-white px-2 text-[11px] text-black" />
      <label className="flex h-9 items-center gap-1 text-[10px] text-gray-600"><input checked={line.isConditional} onChange={event => updateLine(index, { isConditional: event.target.checked })} type="checkbox" className="accent-black" />Conditional</label>
      <button type="button" disabled={lines.length === 1} onClick={() => setLines(current => current.filter((_, lineIndex) => lineIndex !== index))} className="text-[10px] font-semibold text-red-600 disabled:opacity-30">Remove</button>
    </div>)}</div>
    <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setLines(current => [...current, { ...blankQuoteLine }])} className="text-[11px] font-semibold underline underline-offset-4">Add line</button><label className="text-[11px] font-semibold text-gray-600">Valid until <input value={validUntil} onChange={event => setValidUntil(event.target.value)} type="datetime-local" className="ml-2 h-9 border border-gray-300 bg-white px-2 text-[11px] font-normal text-black" /></label></div>
    <label className="mt-3 block text-[11px] font-semibold text-gray-600">CoCard Product Manager SKU <input value={sku} onChange={event => setSku(event.target.value)} placeholder="Exact pre-existing merchant product SKU, if checkout is needed" className="mt-1 h-9 w-full border border-gray-300 bg-white px-3 text-[11px] font-normal text-black" /></label>
    <button type="button" disabled={createQuote.isPending} onClick={submit} className="mt-3 h-9 bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50">{createQuote.isPending ? "Issuing quote…" : "Issue approved quote"}</button>
    {formError && <p className="mt-2 text-[11px] text-red-600">{formError}</p>}{createQuote.error && <p className="mt-2 text-[11px] text-red-600">{createQuote.error.message}</p>}
    </div>
  </section>;
}
