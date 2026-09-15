import { saveAdvertisingLeadHandoff } from "@/lib/advertisingLeadHandoff";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const HERO_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/GcmlolOGiXZGYYDf.png";

export default function GetStarted() {
  const [, navigate] = useLocation();
  const captureLead = trpc.advertisingLeads.capture.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");

  const continueToConcierge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (captureLead.isPending) return;
    setNotice("");
    if (!consent) { setNotice("Please agree to contact before continuing."); return; }
    captureLead.mutate({ contactName: name, contactEmail: email, contactPhone: phone, consentToContact: true }, {
      onSuccess: result => {
        saveAdvertisingLeadHandoff({ reference: result.reference, firstName: name });
        navigate("/concierge");
      },
      onError: error => setNotice(error.message || "We could not save your details. Please try again."),
    });
  };

  return (
    <main className="min-h-screen bg-[#f9f5ed] text-[#171614]">
      <section className="relative isolate min-h-screen overflow-hidden">
        <img src={HERO_IMAGE} alt="DreamCarz editorial automotive scene at a modern city overlook" className="absolute inset-0 h-full w-full object-cover object-[69%_center]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(249,245,237,0.98)_0%,rgba(249,245,237,0.94)_43%,rgba(249,245,237,0.70)_67%,rgba(249,245,237,0.22)_100%)] lg:bg-[linear-gradient(90deg,rgba(249,245,237,0.98)_0%,rgba(249,245,237,0.95)_38%,rgba(249,245,237,0.50)_60%,rgba(249,245,237,0.10)_78%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-14">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="DreamCarz home"><img src="/manus-storage/logo-dark-mark-crop_f052e278.png" alt="DreamCarz" className="h-9 w-auto object-contain" /></Link>
            <Link href="/login" className="text-sm font-semibold text-[#292722] underline decoration-[#b48d32] decoration-2 underline-offset-4">Member sign in</Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-20">
            <section className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.27em] text-[#9b7627]"><Sparkles className="h-4 w-4" /> DreamCarz concierge</p>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[0.93] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Find the drive that <span className="text-[#af8730]">moves you.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#55504a]">Share a few details, then continue straight into a personal DreamCarz conversation about renting, buying, or membership.</p>
              <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
                {[["01", "Tell us who you are"], ["02", "Start your AI conversation"], ["03", "Explore your next step"]].map(([number, label]) => <div key={number} className="border-t border-black/15 pt-3"><p className="text-xs font-bold tracking-[0.16em] text-[#aa822c]">{number}</p><p className="mt-1 text-sm font-semibold leading-5 text-[#24211d]">{label}</p></div>)}
              </div>
            </section>

            <section className="border border-black/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(67,50,22,0.18)] backdrop-blur sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9b7627]">Start here</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Meet your concierge.</h2>
              <p className="mt-3 text-sm leading-6 text-[#625e58]">Enter your contact details first. Then tell DreamCarz what you need.</p>
              <form onSubmit={continueToConcierge} className="mt-7 space-y-4" noValidate>
                <div><label htmlFor="ad-lead-name" className="text-sm font-semibold">Full name</label><input id="ad-lead-name" value={name} onChange={event => setName(event.target.value)} required maxLength={160} autoComplete="name" placeholder="Your name" className="mt-2 h-12 w-full border border-black/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-[#9a958d] focus:border-[#ad8630]" /></div>
                <div><label htmlFor="ad-lead-phone" className="text-sm font-semibold">Mobile number</label><input id="ad-lead-phone" value={phone} onChange={event => setPhone(event.target.value)} required minLength={7} maxLength={48} autoComplete="tel" inputMode="tel" type="tel" placeholder="(000) 000-0000" className="mt-2 h-12 w-full border border-black/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-[#9a958d] focus:border-[#ad8630]" /></div>
                <div><label htmlFor="ad-lead-email" className="text-sm font-semibold">Email address</label><input id="ad-lead-email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={320} autoComplete="email" inputMode="email" type="email" placeholder="you@example.com" className="mt-2 h-12 w-full border border-black/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-[#9a958d] focus:border-[#ad8630]" /></div>
                <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-5 text-[#625e58]"><input checked={consent} onChange={event => setConsent(event.target.checked)} required type="checkbox" className="mt-1 h-4 w-4 accent-black" /><span>I agree that DreamCarz may contact me by phone and email about my request. I can opt out at any time.</span></label>
                {notice && <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{notice}</p>}
                <button type="submit" disabled={captureLead.isPending || !name.trim() || !phone.trim() || !email.trim() || !consent} className="mt-2 flex h-13 w-full items-center justify-center gap-2 bg-black px-5 text-sm font-bold text-white transition-transform duration-150 hover:bg-[#27231d] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]">{captureLead.isPending ? "Saving your details…" : <>Continue to DreamCarz AI <ArrowRight size={17} /></>}</button>
              </form>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#7d776f]"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9b7627]" />We collect only the information needed to start this conversation. Please do not enter payment, driver-license, or password details here.</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#56514a]"><CheckCircle2 className="h-4 w-4 text-[#9b7627]" />No commitment or vehicle reservation is created.</p>
            </section>
          </div>
          <footer className="flex flex-wrap gap-x-5 gap-y-2 pt-5 text-xs text-[#625e58]"><Link href="/privacy-policy" className="underline underline-offset-4">Privacy</Link><Link href="/terms" className="underline underline-offset-4">Terms</Link><span>DreamCarz Concierge</span></footer>
        </div>
      </section>
    </main>
  );
}
