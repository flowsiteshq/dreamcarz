import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, CarFront, CircleDollarSign, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";

const principles = [
  { title: "Choose a membership path", copy: "Membership helps you compare the program path, vehicle access, and next step that fit your current transportation needs." },
  { title: "Compare vehicle value clearly", copy: "Membership context and any vehicle-specific terms stay visible as separate decisions. Final vehicle terms are reviewed for the vehicle you choose." },
  { title: "Understand DCP rules", copy: "DCP is not cash. Eligible activity, verification, redemption limits, and program rules apply before DCP can be recorded or used." },
];
const dcpFlow = [
  ["01", "Qualify", "Eligible transportation activity is considered under program rules."],
  ["02", "Verify", "DreamCarz reviews eligible activity before recording it."],
  ["03", "Build", "Your membership path can help you understand DCP program value."],
  ["04", "Use when eligible", "Eligibility and redemption rules determine whether DCP can be applied."],
] as const;

export default function Membership() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main>
        <section className="bg-[#f8f8f5] pt-32 pb-20 sm:pt-40 sm:pb-24">
          <div className="container grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div className="reveal">
              <p className="section-label mb-4">DreamCarz membership</p>
              <h1 className="font-display max-w-2xl text-5xl font-bold tracking-[-0.055em] sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>Membership makes your vehicle path <span className="text-[#b08c2d]">clearer.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-gray-600">Start with what you need today. Then compare membership context, confirmed vehicle access, and DCP program value without hiding vehicle-specific terms or qualifications.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">Compare memberships & pricing <ArrowRight size={16} /></Link>
                <Link href="/fleet" className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white">View confirmed vehicles</Link>
              </div>
            </div>
            <aside className="rounded-2xl bg-black p-8 text-white reveal delay-100">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9bf73]">See value in context</p>
              <div className="mt-7 space-y-5">
                <div className="flex gap-4"><CircleDollarSign size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">Compare:</strong> understand membership context before you make a vehicle request.</p></div>
                <div className="flex gap-4"><CarFront size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">Choose:</strong> explore confirmed vehicles and select Rent or Buy.</p></div>
                <div className="flex gap-4"><ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">Confirm:</strong> availability, eligibility, and final terms are reviewed for each request.</p></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <p className="section-label mb-3 reveal">How the two decisions work together</p>
            <div className="grid gap-4 md:grid-cols-3">
              {principles.map((principle, index) => (
                <article key={principle.title} className="rounded-2xl border border-gray-200 p-7 reveal" style={{ transitionDelay: `${index * 90}ms` }}>
                  <span className="text-sm font-bold text-[#b08c2d]">0{index + 1}</span>
                  <h2 className="mt-6 font-display text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{principle.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{principle.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 py-20">
          <div className="container grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="reveal"><p className="section-label mb-4">DCP value path</p><h2 className="font-display text-4xl font-bold tracking-[-0.04em]" style={{ fontFamily: "var(--font-display)" }}>A vehicle decision can support a longer view.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-gray-600">DCP is not cash or a guaranteed discount. It is a program record that is subject to eligible activity, verification, and redemption rules.</p></div>
            <div className="grid border-y border-gray-200 sm:grid-cols-2">{dcpFlow.map(([number, title, copy]) => <div key={number} className="min-h-[150px] border-b border-gray-200 p-6 even:sm:border-l sm:nth-[n+3]:border-b-0"><p className="text-[10px] font-bold tracking-[0.16em] text-[#a8832d]">{number}</p><Sparkles className="mt-4 text-[#a8832d]" size={17} /><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-gray-500">{copy}</p></div>)}</div>
          </div>
        </section>

        <section className="bg-[#f8f8f5] py-20">
          <div className="container text-center reveal">
            <p className="section-label mb-3">Choose with confidence</p>
            <h2 className="font-display text-4xl font-bold tracking-[-0.04em]" style={{ fontFamily: "var(--font-display)" }}>See the membership price and vehicle path in one place.</h2>
            <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-800">Open pricing & vehicle access <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
