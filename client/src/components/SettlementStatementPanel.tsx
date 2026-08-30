import { FileText, ReceiptText } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not recorded";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

export function buildSettlementPrintHtml(input: {
  vehicleName: string;
  status: string;
  currency: string;
  approvedSubtotalCents: number;
  depositAppliedCents: number;
  adjustmentsCents: number;
  finalAmountCents: number;
  summary: string | null;
  finalizedAt: Date | string | null;
  adjustments: Array<{ adjustmentType: string; description: string; amountCents: number; status: string; reviewedAt: Date | string | null }>;
}) {
  const amount = (value: number) => escapeHtml(formatMoney(value, input.currency));
  const items = input.adjustments.length
    ? input.adjustments.map(item => `<tr><td><strong>${escapeHtml(item.adjustmentType.replaceAll("_", " "))}</strong><br><span>${escapeHtml(item.description)}</span><br><small>${escapeHtml(formatStatus(item.status))} · reviewed ${escapeHtml(formatDate(item.reviewedAt))}</small></td><td>${amount(item.amountCents)}</td></tr>`).join("")
    : `<tr><td colspan="2">No approved or disputed itemized adjustments are recorded.</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>DreamCarz reviewed return outcome</title><style>body{font-family:Arial,sans-serif;color:#111;margin:40px;line-height:1.45}h1{margin:0 0 4px}h2{margin-top:28px;font-size:16px}p{max-width:720px}table{border-collapse:collapse;width:100%;max-width:760px}th,td{border:1px solid #d8d1c4;padding:10px;text-align:left;vertical-align:top}th{background:#f7f5f0}td:last-child,th:last-child{text-align:right;white-space:nowrap}small,span{color:#555}.notice{border-left:3px solid #a8832d;background:#f7f5f0;padding:12px}</style></head><body><p>DreamCarz · Read-only settlement statement</p><h1>Reviewed return outcome</h1><p>${escapeHtml(input.vehicleName)} · ${escapeHtml(formatStatus(input.status))}</p><p class="notice"><strong>This is not a receipt of payment, an authorization to charge, or a collection action.</strong> It reflects the reviewed return record available to this account.</p><table><thead><tr><th>Reviewed subtotal</th><th>Deposit applied</th><th>Reviewed adjustments</th><th>Reviewed settlement total</th></tr></thead><tbody><tr><td>${amount(input.approvedSubtotalCents)}</td><td>${amount(input.depositAppliedCents)}</td><td>${amount(input.adjustmentsCents)}</td><td>${amount(input.finalAmountCents)}</td></tr></tbody></table>${input.summary ? `<h2>Settlement summary</h2><p>${escapeHtml(input.summary)}</p>` : ""}<h2>Reviewed return items</h2><table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${items}</tbody></table><p><small>Finalized ${escapeHtml(formatDate(input.finalizedAt))}. Keep this record private and contact DreamCarz with questions about the reviewed outcome.</small></p></body></html>`;
}

export function SettlementStatementPanel({ reference }: { reference: string }) {
  const statementQuery = trpc.transactions.getSettlementStatement.useQuery({ reference }, { enabled: Boolean(reference), refetchOnWindowFocus: false });
  const result = statementQuery.data;
  const statement = result?.statement;
  if (statementQuery.isLoading || statementQuery.error || !statement) return null;

  if (!statement.isFinalized) return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5 sm:p-6"><div className="flex items-start gap-3"><ReceiptText size={19} className="mt-0.5 shrink-0 text-[#a8832d]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Return settlement</p><h2 className="mt-1 text-xl font-bold text-black">Return review is in progress.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">DreamCarz is reviewing the return record. Itemized figures and the review summary remain unavailable until a final settlement status is recorded. This page does not collect payment or make a payment determination.</p><p className="mt-3 text-xs font-semibold text-gray-700">Current status: {formatStatus(statement.status)}</p><Link href="/dashboard/support" className="mt-4 inline-flex text-xs font-semibold underline underline-offset-4">Contact DreamCarz about this review</Link></div></div></section>;

  const printStatement = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(buildSettlementPrintHtml({
      vehicleName: result.transaction.vehicleName,
      status: statement.status,
      currency: statement.currency,
      approvedSubtotalCents: statement.approvedSubtotalCents,
      depositAppliedCents: statement.depositAppliedCents,
      adjustmentsCents: statement.adjustmentsCents,
      finalAmountCents: statement.finalAmountCents,
      summary: statement.summary,
      finalizedAt: statement.settledAt ?? statement.updatedAt,
      adjustments: statement.adjustments,
    }));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return <section className="mx-auto mt-8 max-w-6xl border border-[#d8d1c4] bg-[#f7f5f0] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><ReceiptText size={19} className="mt-0.5 shrink-0 text-[#a8832d]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Read-only settlement statement</p><h2 className="mt-1 text-xl font-bold text-black">Reviewed return outcome</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">This account-owned statement reflects the reviewed return record for {result.transaction.vehicleName}. It is not a receipt of payment, an authorization to charge, or a collection action.</p></div></div><span className="border border-[#d8d1c4] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#805f1b]">{formatStatus(statement.status)}</span></div>
    <div className="mt-5 grid gap-4 border-y border-[#ded8cf] py-5 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Reviewed subtotal</p><p className="mt-1 text-sm font-bold text-black">{formatMoney(statement.approvedSubtotalCents, statement.currency)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Deposit applied</p><p className="mt-1 text-sm font-bold text-black">{formatMoney(statement.depositAppliedCents, statement.currency)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Reviewed adjustments</p><p className="mt-1 text-sm font-bold text-black">{formatMoney(statement.adjustmentsCents, statement.currency)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Reviewed settlement total</p><p className="mt-1 text-sm font-bold text-black">{formatMoney(statement.finalAmountCents, statement.currency)}</p></div></div>
    {statement.summary ? <div className="mt-5 border-l-2 border-[#a8832d] bg-white px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#805f1b]">Settlement summary</p><p className="mt-2 text-sm leading-6 text-gray-700">{statement.summary}</p></div> : null}
    <div className="mt-5"><p className="text-sm font-bold text-black">Reviewed return items</p>{statement.adjustments.length ? <div className="mt-3 divide-y divide-gray-200 border-y border-gray-200 bg-white">{statement.adjustments.map((item, index) => <div key={`${item.adjustmentType}-${item.reviewedAt?.toString() ?? index}`} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"><div><p className="text-xs font-semibold capitalize text-black">{item.adjustmentType.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-gray-600">{item.description}</p><p className="mt-1 text-[10px] text-gray-400">{formatStatus(item.status)} · reviewed {formatDate(item.reviewedAt)}</p></div><p className="text-sm font-bold text-black">{formatMoney(item.amountCents, statement.currency)}</p></div>)}</div> : <p className="mt-3 border border-dashed border-gray-300 bg-white p-4 text-xs leading-5 text-gray-500">No approved or disputed itemized adjustments are recorded in this finalized statement.</p>}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ded8cf] pt-4"><p className="text-[11px] leading-5 text-gray-500">Finalized {formatDate(statement.settledAt ?? statement.updatedAt)}. Keep this record private and contact DreamCarz with questions about the reviewed outcome.</p><div className="flex items-center gap-4"><button type="button" onClick={printStatement} className="inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4"><ReceiptText size={13} /> Print statement</button><Link href="/dashboard/support" className="inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4"><FileText size={13} /> Ask about this statement</Link></div></div>
  </section>;
}
