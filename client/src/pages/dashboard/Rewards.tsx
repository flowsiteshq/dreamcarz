import DashboardShell from "@/components/DashboardShell";
import { Gift, History, ShieldCheck, WalletCards } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatPoints(points: number) {
  return `${points.toLocaleString("en-US")} DCP`;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function Rewards() {
  const wallets = trpc.masterProgram.myWallets.useQuery(undefined, { staleTime: 30_000 });
  const streams = wallets.data?.wallets ?? [];
  return (
    <DashboardShell title="Rewards">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Rewards</h2>
          <p className="text-sm text-gray-400 mt-0.5">Your account-owned DCP wallet records and permitted-use guidance.</p>
        </div>

        <section className="relative overflow-hidden border border-[#29251d] bg-[#161513] p-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-16 -translate-y-16 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-[#d9b756]"><WalletCards size={19} /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#dfbd65]">DCP wallet records</p><h3 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">Recorded by wallet stream.</h3><p className="mt-2 max-w-3xl text-xs leading-5 text-white/65">Only posted immutable DCP ledger entries appear as recorded points. DCP is not cash, does not create a payment right, and can be used only when a separate applicable program rule and agreement permit it.</p></div></div>
        </section>

        {wallets.isLoading ? <p className="py-8 text-center text-sm text-gray-400">Loading account-owned wallet records…</p> : null}
        {!wallets.isLoading && !streams.length ? <section className="border border-dashed border-gray-300 bg-white p-7 text-center"><Gift className="mx-auto text-[#a8832d]" size={21} /><h3 className="mt-3 text-base font-bold text-black">No active DCP wallet streams are available to this account.</h3><p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-gray-500">A DCP wallet appears only when an active approved program configuration includes that stream. No balance or reward outcome is inferred.</p></section> : null}
        <div className="grid gap-4 lg:grid-cols-2">{streams.map(wallet => <article key={wallet.walletCode} className="border border-[#e5e1d9] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">{wallet.walletCode}</p><h3 className="mt-1 font-display text-xl font-bold tracking-[-0.04em] text-black">{wallet.walletName}</h3></div><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fbf5e6] text-[#a8832d]"><Gift size={17} /></span></div><p className="mt-4 text-3xl font-bold tracking-[-0.05em] text-black">{formatPoints(wallet.balance.recordedPostedPoints)}</p><p className="mt-1 text-[11px] text-gray-500">Recorded posted points · pending {formatPoints(wallet.balance.pendingPoints)} · held {formatPoints(wallet.balance.heldPoints)}</p><div className="mt-4 border-t border-[#ece8e0] pt-3"><p className="text-xs font-semibold text-[#292622]">Permitted-use guidance</p><p className="mt-1 text-[11px] leading-5 text-gray-500">{wallet.primaryUse}</p><p className="mt-2 text-[10px] leading-4 text-[#8a6c2e]">{wallet.guardrail}</p></div><p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Minimum membership tier: {wallet.minimumTier}</p><div className="mt-4 border-t border-[#ece8e0] pt-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500"><History size={13} /> Recent immutable events</p>{wallet.balance.entries.length ? <div className="mt-2 space-y-1.5">{wallet.balance.entries.slice(0, 4).map(entry => <p key={entry.reference} className="text-[10px] text-gray-500">{humanize(entry.transactionType)} · {formatPoints(entry.points)} · {humanize(entry.status)} · {new Date(entry.createdAt).toLocaleDateString()}</p>)}</div> : <p className="mt-2 text-[10px] text-gray-400">No recorded DCP activity for this wallet.</p>}</div></article>)}</div>
        <section className="flex gap-3 border border-[#e5e1d9] bg-[#fbfaf7] p-4 text-xs leading-5 text-gray-600"><ShieldCheck className="mt-0.5 shrink-0 text-[#a8832d]" size={17} /><p>Viewing wallet records does not redeem DCP, change a balance, determine eligibility, or authorize a rental, purchase, membership, deposit, or payment action.</p></section>
      </div>
    </DashboardShell>
  );
}
