import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { openAssociateHostedCheckout } from "@/lib/associateCheckout";
import { CheckCircle2, ChevronRight, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function queryValue(key: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function AssociateEnroll() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [authorizeRecurring, setAuthorizeRecurring] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const completionStarted = useRef(false);
  const status = trpc.associateEnrollment.status.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const startCheckout = trpc.associateEnrollment.startCheckout.useMutation();
  const completeCheckout = trpc.associateEnrollment.completeCheckout.useMutation({ onSuccess: () => void status.refetch() });
  const reference = queryValue("reference");
  const transactionId = queryValue("transactionId");
  const canceled = queryValue("canceled") === "1";

  useEffect(() => {
    if (!isAuthenticated || !reference || !transactionId || completionStarted.current) return;
    completionStarted.current = true;
    completeCheckout.mutate({ reference, transactionId });
  }, [completeCheckout, isAuthenticated, reference, transactionId]);

  const beginCheckout = async () => {
    if (!authorizeRecurring) return;
    setCheckoutError(null);
    try {
      const result = await startCheckout.mutateAsync({ authorizeRecurring: true });
      if (result.alreadyActive) {
        setLocation("/associates");
        return;
      }
      await openAssociateHostedCheckout(result.checkout);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Secure checkout could not be opened. Please try again or contact DreamCarz support.");
    }
  };

  if (loading || (isAuthenticated && status.isLoading)) return <LoadingState />;
  if (!isAuthenticated) return <div className="min-h-screen bg-[#08090b] px-5 py-16 text-white"><div className="mx-auto max-w-xl border border-white/10 bg-[#111215] p-8"><Brand /><p className="mt-8 text-[10px] font-bold uppercase tracking-[.18em] text-[#e4b450]">DreamCarz Associate enrollment</p><h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">Create or sign in to your account first.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">Your DreamCarz account is required before the secure Associate enrollment payment can begin.</p><Link href="/login?next=/associate-enroll" className="mt-7 inline-flex h-11 items-center bg-[#e4b450] px-5 text-sm font-bold text-black">Continue to sign in <ChevronRight className="ml-2 h-4 w-4" /></Link></div></div>;

  const enrollment = status.data?.enrollment;
  if (enrollment?.status === "active") return <div className="min-h-screen bg-[#08090b] px-5 py-16 text-white"><div className="mx-auto max-w-xl border border-[#e4b450]/35 bg-[#111215] p-8"><Brand /><CheckCircle2 className="mt-10 h-10 w-10 text-[#e4b450]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[#e4b450]">Associate access active</p><h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">Welcome to DreamCarz Leverage.</h1><p className="mt-4 text-sm leading-6 text-zinc-400">Your enrollment and monthly subscription were verified by the payment provider. Your next billing date is shown in your protected account record.</p><button type="button" onClick={() => setLocation("/associates")} className="mt-7 h-11 bg-[#e4b450] px-5 text-sm font-bold text-black">Open Associate portal</button></div></div>;

  return <div className="min-h-screen bg-[#08090b] text-white"><header className="border-b border-white/10 bg-black/30"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><Link href="/" className="text-sm font-bold tracking-[.23em] text-[#e4b450]">DREAMCARZ</Link><Link href="/associates" className="text-xs font-semibold text-zinc-300 hover:text-white">Associate portal</Link></div></header><main className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-20"><section><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e4b450]">DreamCarz Leverage</p><h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[.94] tracking-[-.055em] sm:text-6xl">Build your route.<br /><span className="text-[#e4b450]">Start with clarity.</span></h1><p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400">Associate enrollment is a paid business-access path. It does not promise earnings, rank, commissions, vehicle access, membership benefits, or payment approval.</p><div className="mt-10 grid gap-3 sm:grid-cols-2"><Benefit icon={CreditCard} title="Provider-hosted payment" copy="Card details are entered only with CoCard." /><Benefit icon={ShieldCheck} title="Account-owned access" copy="Access starts after payment verification." /></div></section><section className="border border-[#e4b450]/35 bg-[#111215] p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#e4b450]">Associate enrollment</p><div className="mt-7 border-y border-white/10 py-6"><div className="flex items-end justify-between"><div><p className="text-sm text-zinc-400">Enrollment today</p><p className="mt-1 text-4xl font-bold">{money(14_900)}</p></div><p className="text-right text-xs leading-5 text-zinc-400">Then {money(4_900)} monthly<br />until cancelled</p></div></div>{canceled ? <p className="mt-5 border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">Checkout was canceled. No Associate access was activated.</p> : null}{completeCheckout.isPending ? <div className="mt-6 flex items-center gap-3 border border-white/10 p-4 text-sm text-zinc-300"><Loader2 className="h-4 w-4 animate-spin text-[#e4b450]" /> Verifying your hosted enrollment payment…</div> : null}{completeCheckout.error ? <p className="mt-5 border border-red-400/30 bg-red-400/10 p-3 text-xs leading-5 text-red-100">{completeCheckout.error.message}</p> : null}<label className="mt-7 flex gap-3 text-xs leading-5 text-zinc-400"><input type="checkbox" checked={authorizeRecurring} onChange={event => setAuthorizeRecurring(event.target.checked)} className="mt-1 h-4 w-4" /> <span>I authorize a one-time {money(14_900)} Associate enrollment payment and a recurring {money(4_900)} monthly Associate subscription until I cancel it through DreamCarz support. I understand payment processing occurs with CoCard.</span></label><button type="button" disabled={!authorizeRecurring || startCheckout.isPending || completeCheckout.isPending || !status.data?.providerReady} onClick={() => void beginCheckout()} className="mt-6 flex h-12 w-full items-center justify-center bg-[#e4b450] px-5 text-sm font-bold text-black disabled:opacity-40">{startCheckout.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening secure checkout…</> : "Continue to secure checkout"}</button>{startCheckout.error ? <p className="mt-3 text-xs text-red-300">{startCheckout.error.message}</p> : null}{checkoutError ? <p className="mt-3 border border-red-400/30 bg-red-400/10 p-3 text-xs leading-5 text-red-100">{checkoutError}</p> : null}<p className="mt-4 text-[11px] leading-5 text-zinc-500">Enrollment access is issued only after provider verification. Keep your card details out of DreamCarz chat and forms.</p></section></main></div>;
}

function Benefit({ icon: Icon, title, copy }: { icon: typeof CreditCard; title: string; copy: string }) { return <div className="border border-white/10 bg-[#111215] p-5"><Icon className="h-5 w-5 text-[#e4b450]" /><p className="mt-4 text-sm font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{copy}</p></div>; }
function Brand() { return <div className="text-sm font-bold tracking-[.23em] text-[#e4b450]">DREAMCARZ</div>; }
function LoadingState() { return <div className="flex min-h-screen items-center justify-center bg-[#08090b] text-zinc-400"><Loader2 className="mr-3 h-5 w-5 animate-spin text-[#e4b450]" /> Preparing secure enrollment…</div>; }
