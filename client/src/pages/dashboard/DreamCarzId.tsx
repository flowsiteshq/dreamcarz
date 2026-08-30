import { useEffect } from "react";
import { Link } from "wouter";
import { BadgeCheck, Car, CreditCard, FileText, Loader2, ShieldCheck, Wallet } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";

function formatStatus(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()) : "Not started";
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function DreamCarzId() {
  const overview = trpc.dreamcarzId.overview.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const ensure = trpc.dreamcarzId.ensure.useMutation({ onSuccess: () => void overview.refetch() });

  useEffect(() => {
    if (!overview.isLoading && overview.data && (!overview.data.profile || !overview.data.wallet) && !ensure.isPending) {
      void ensure.mutateAsync();
    }
  }, [ensure, overview]);

  if (overview.isLoading || ensure.isPending) {
    return <DashboardShell title="DreamCarz ID"><div className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center gap-3 text-sm text-gray-600"><Loader2 className="h-5 w-5 animate-spin" /> Preparing your private DreamCarz ID…</div></DashboardShell>;
  }

  if (!overview.data) {
    return <DashboardShell title="DreamCarz ID"><div className="mx-auto max-w-6xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Your DreamCarz ID is temporarily unavailable. Please try again or contact DreamCarz support.</div></DashboardShell>;
  }

  const { profile, membership, wallet, transactions, accountStanding } = overview.data;
  const verificationItems = [
    ["Identity", profile?.identityStatus],
    ["Driver license", profile?.licenseStatus],
    ["Account standing", accountStanding],
  ];

  return (
    <DashboardShell title="DreamCarz ID">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Private customer profile</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black sm:text-5xl">Your DreamCarz ID.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">One protected account for your profile, verification status, membership, approved credits, agreements, and vehicle transactions. Sensitive identity documents stay in private records and are available only through authorized access.</p>
          </div>
          <div className="border-l-2 border-[#a8832d] pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a8832d]">Account standing</p>
            <p className="mt-2 text-xl font-bold text-black">{formatStatus(accountStanding)}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">Standing reflects saved profile and account controls; it is not a vehicle approval or a payment decision.</p>
          </div>
        </section>

        <section className="grid border-y border-gray-200 sm:grid-cols-3">
          {verificationItems.map(([label, status]) => <div key={label} className="border-b border-gray-200 px-0 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0"><BadgeCheck className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-bold text-black">{label}</p><p className="mt-1 text-sm text-gray-500">{formatStatus(status)}</p></div>)}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="border border-gray-200 bg-white p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Membership</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-black">{membership?.plan.name ?? "No active membership"}</h3></div><ShieldCheck className="h-6 w-6 text-[#a8832d]" /></div>
            <p className="mt-4 text-sm leading-6 text-gray-600">{membership ? membership.plan.description || "Your active membership benefits are shown below." : "Membership benefits appear here only after DreamCarz records an active plan."}</p>
            {membership?.benefits.length ? <div className="mt-5 grid gap-2 border-t border-gray-200 pt-5">{membership.benefits.map(benefit => <p key={`${benefit.benefitType}-${benefit.label}`} className="text-sm text-gray-700">{benefit.label}</p>)}</div> : null}
            <Link href="/dashboard/membership" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">View membership options <span>→</span></Link>
          </article>
          <article className="border border-gray-200 bg-[#f7f5f0] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">DreamCarz wallet</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-black">{formatCurrency(wallet?.availableCreditCents ?? 0)}</h3></div><Wallet className="h-6 w-6 text-[#a8832d]" /></div>
            <p className="mt-3 text-sm text-gray-600">Available recorded credits</p>
            <div className="mt-5 border-t border-[#d8d1c4] pt-5 text-sm text-gray-700"><p>Active deposit holds: <span className="font-semibold">{formatCurrency(wallet?.activeHoldCents ?? 0)}</span></p><p className="mt-2 text-xs leading-5 text-gray-500">Wallet entries are recorded as an auditable ledger. This view does not create or modify credit value.</p></div>
          </article>
        </section>

        <section className="grid gap-7 border-t border-gray-200 pt-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Your activity</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-black">Saved vehicle journeys.</h3><p className="mt-4 text-sm leading-6 text-gray-600">Continue a saved rental or purchase flow, then access agreements and secure documents from My Records.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/transactions" className="inline-flex h-10 items-center gap-2 bg-black px-4 text-sm font-semibold text-white"><FileText className="h-4 w-4" /> My records</Link><Link href="/fleet" className="inline-flex h-10 items-center gap-2 border border-black px-4 text-sm font-semibold text-black"><Car className="h-4 w-4" /> Explore vehicles</Link></div></div>
          <div className="divide-y divide-gray-200 border-y border-gray-200">{transactions.length ? transactions.map(transaction => <Link key={transaction.reference} href={`/dashboard/transactions?ref=${encodeURIComponent(transaction.reference)}`} className="flex items-center justify-between gap-4 py-5"><div><p className="text-sm font-bold text-black">{transaction.vehicleName}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-500">{transaction.transactionType} · {formatStatus(transaction.status)}</p></div><span className="text-sm font-semibold text-[#a8832d]">Open →</span></Link>) : <div className="py-8"><CreditCard className="h-5 w-5 text-[#a8832d]" /><p className="mt-3 text-sm font-semibold text-black">No vehicle transaction has been started.</p><p className="mt-2 text-sm text-gray-500">Choose a confirmed vehicle to begin a saved rental or purchase journey.</p></div>}</div>
        </section>
      </div>
    </DashboardShell>
  );
}
