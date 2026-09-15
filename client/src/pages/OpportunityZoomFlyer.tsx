import { ArrowUpRight, CalendarDays, Clock3, QrCode } from "lucide-react";
import { DREAMCARZ_ZOOM_MEETING_URL, DREAMCARZ_ZOOM_SHORT_PATH } from "@shared/zoomOpportunity";

const FLYER_BACKGROUND = "/manus-storage/dreamcarz-zoom-background_7f10da15.png";
const QR_CODE = "/manus-storage/dreamcarz-zoom-qr_5be3cbd2.png";

export default function OpportunityZoomFlyer() {
  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 sm:px-8 sm:py-12">
      <article className="relative mx-auto grid min-h-[1120px] w-full max-w-[840px] overflow-hidden bg-[#111111] text-white shadow-[0_32px_100px_rgba(0,0,0,0.6)]">
        <img src={FLYER_BACKGROUND} alt="DreamCarz opportunity call automotive scene" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.96)_0%,rgba(8,8,8,0.68)_42%,rgba(8,8,8,0.93)_100%)]" />
        <div className="relative z-10 flex min-h-[1120px] flex-col px-8 pb-8 pt-10 sm:px-14 sm:pt-14">
          <header className="flex items-center gap-3 border-b border-white/20 pb-7">
            <img src="/manus-storage/logo-light-mark-crop_649262e4.png" alt="DreamCarz" className="h-9 w-auto object-contain" />
            <span className="h-6 w-px bg-white/30" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e6c76b]">Opportunity Call</p>
          </header>

          <section className="pt-16 sm:pt-20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#e6c76b]">Tonight · Live on Zoom</p>
            <h1 className="mt-5 max-w-[650px] font-display text-5xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-7xl">Your next move<br /><span className="text-[#e6c76b]">starts here.</span></h1>
            <p className="mt-8 max-w-[560px] text-lg leading-8 text-white/80 sm:text-xl">Join DreamCarz for an opportunity call built around the road ahead.</p>
          </section>

          <section className="mt-12 grid gap-4 border-y border-white/20 py-7 sm:grid-cols-2 sm:gap-8">
            <div className="flex items-center gap-4"><CalendarDays className="h-6 w-6 text-[#e6c76b]" aria-hidden="true" /><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Date</p><p className="mt-1 text-lg font-semibold">Tonight</p></div></div>
            <div className="flex items-center gap-4"><Clock3 className="h-6 w-6 text-[#e6c76b]" aria-hidden="true" /><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Time</p><p className="mt-1 text-lg font-semibold">7:00 PM ET</p></div></div>
          </section>

          <section className="mt-auto grid items-end gap-8 pt-14 sm:grid-cols-[1fr_210px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e6c76b]">Reserve your seat</p>
              <p className="mt-3 max-w-md text-base leading-7 text-white/75">Scan the code to join the live Zoom call, or use the DreamCarz short link below.</p>
              <a href={DREAMCARZ_ZOOM_MEETING_URL} className="mt-7 inline-flex items-center gap-2 border border-[#e6c76b] bg-[#e6c76b] px-5 py-3 text-sm font-bold text-black transition-transform duration-150 active:scale-[0.97]">Join the Zoom call <ArrowUpRight size={16} /></a>
              <p className="mt-6 text-sm font-semibold text-white">dreamcarz.io{DREAMCARZ_ZOOM_SHORT_PATH}</p>
            </div>
            <div className="bg-white p-3 text-center text-black"><img src={QR_CODE} alt="QR code linking to the DreamCarz Zoom opportunity call" className="mx-auto h-[180px] w-[180px] object-contain" /><p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]"><QrCode size={12} /> Scan to join</p></div>
          </section>
        </div>
      </article>
    </main>
  );
}
