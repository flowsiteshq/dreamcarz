import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { CheckCircle2, Info, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const freedomProgression = [
  { point: "Day 1", title: "Hassle Free", detail: "Start your DreamCarz membership journey." },
  { point: "Day 1", title: "Credit Free", detail: "Begin building toward a more flexible transportation future." },
  { point: "Year 1", title: "Worry Free", detail: "Use the member ecosystem, resources, and program pathways." },
  { point: "Year 2", title: "Interest Free", detail: "Continue working toward your personal transportation goals." },
  { point: "Year 3", title: "Drive Free", detail: "Advance through the program based on your individual journey." },
  { point: "Year 4+", title: "Be Free", detail: "Sustain a long-term freedom plan built around your goals." },
];

const earningPathways = ["Membership payments", "Vehicle rentals", "RTO/LTO payments", "Vehicle purchases", "Referrals", "Anniversary bonuses"];
const redemptionCategories = ["Free rental days", "Lease and interest credits", "Down-payment assistance", "Vehicle purchase credits", "Service and maintenance savings", "Exclusive member perks"];

export default function Calculator() {
  useScrollReveal();
  const [years, setYears] = useState(1);
  const activeProgressionIndex = useMemo(() => years >= 4 ? 5 : years === 3 ? 4 : years === 2 ? 3 : 2, [years]);
  const currentStage = freedomProgression[activeProgressionIndex];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="bg-section pb-12 pt-28">
        <div className="container text-center">
          <div className="section-label mb-3 reveal">Freedom Progression Planner</div>
          <h1 className="font-display mb-4 text-5xl font-bold text-black">Plan Your Path to More Freedom.</h1>
          <p className="mx-auto max-w-2xl text-gray-500">Explore the approved DreamCarz Freedom Progression, DCP earning pathways, and redemption categories. This is an educational planning view—not a value, return, or DCP-earnings projection.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="reveal rounded-2xl border border-gray-200 bg-white p-8">
              <p className="section-label mb-2">Freedom Membership</p>
              <div className="flex items-end justify-between border-b border-gray-100 pb-6">
                <div><h2 className="font-display text-2xl font-bold text-black">Terms confirmed during enrollment</h2><p className="mt-1 text-sm text-gray-500">Plan availability and membership terms are reviewed before enrollment.</p></div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-[#B8860B]">Planning view</span>
              </div>
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium text-gray-700">Planning horizon</label><span className="font-mono text-sm font-bold text-black">{years} year{years > 1 ? "s" : ""}</span></div>
                <input aria-label="Planning horizon" type="range" min={1} max={5} step={1} value={years} onChange={event => setYears(Number(event.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #000 0%, #000 ${((years - 1) / 4) * 100}%, #e5e7eb ${((years - 1) / 4) * 100}%, #e5e7eb 100%)` }} />
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-gray-400"><span>Year 1</span><span>Year 2</span><span>Year 3</span><span>Year 4+</span></div>
              </div>
              <div className="mt-7 rounded-xl border border-gray-100 bg-gray-50 p-4"><div className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0 text-gray-400" /><p className="text-xs leading-relaxed text-gray-500">DCP availability, earning criteria, redemption availability, and program terms are determined by the applicable membership and transaction documentation. DreamCarz does not present fixed DCP rates, savings, or personal outcomes in this planner.</p></div></div>
            </div>

            <div className="reveal delay-100 rounded-2xl bg-black p-8 text-white">
              <div className="section-label mb-2 text-gray-400">Current planning milestone</div>
              <div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A84C] text-black"><Sparkles size={18} /></div><div><p className="font-display text-3xl font-bold">{currentStage.title}</p><p className="text-sm text-white/55">{currentStage.point}</p></div></div>
              <p className="text-sm leading-relaxed text-white/70">{currentStage.detail}</p>
              <div className="mt-8 flex gap-1.5">{freedomProgression.map((stage, index) => <div key={stage.title} className={`h-2 flex-1 rounded-full ${index <= activeProgressionIndex ? "bg-[#C9A84C]" : "bg-white/15"}`} />)}</div>
              <p className="mt-3 text-[11px] text-white/45">Progression stages communicate the program journey; they are not a promise of financial, credit, vehicle, or earnings outcomes.</p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-7 reveal">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="section-label mb-2">Approved Freedom Progression</p><h2 className="font-display text-2xl font-bold text-black">Six stages, one member journey.</h2></div><p className="max-w-md text-right text-xs text-gray-500">Use this sequence to frame your personal goals with DreamCarz—not as a schedule of guaranteed results.</p></div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{freedomProgression.map((stage, index) => <div key={stage.title} className={`rounded-xl border p-4 ${index === activeProgressionIndex ? "border-[#C9A84C] bg-amber-50" : "border-gray-100 bg-white"}`}><div className="flex items-center justify-between gap-3"><p className="font-display text-lg font-bold text-black">{stage.title}</p><span className="text-[10px] font-bold uppercase tracking-wide text-[#B8860B]">{stage.point}</span></div><p className="mt-2 text-xs leading-relaxed text-gray-500">{stage.detail}</p></div>)}</div>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="reveal rounded-2xl border border-gray-200 bg-white p-7"><p className="section-label mb-2">DCP earning pathways</p><h2 className="font-display mb-5 text-2xl font-bold text-black">Ways DCP may be earned</h2><div className="space-y-3">{earningPathways.map(pathway => <div key={pathway} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"><CheckCircle2 size={16} className="text-[#B8860B]" /><span className="text-sm font-medium text-gray-700">{pathway}</span></div>)}</div></div>
            <div className="reveal delay-100 rounded-2xl border border-gray-200 bg-white p-7"><p className="section-label mb-2">DCP redemption categories</p><h2 className="font-display mb-5 text-2xl font-bold text-black">Ways DCP may be redeemed</h2><div className="space-y-3">{redemptionCategories.map(category => <div key={category} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"><CheckCircle2 size={16} className="text-[#B8860B]" /><span className="text-sm font-medium text-gray-700">{category}</span></div>)}</div></div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
