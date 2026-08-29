import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, CarFront, CircleDollarSign, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const principles = [
  { title: "Membership is recurring", copy: "Each membership plan has a one-time enrollment amount and a separate monthly membership amount." },
  { title: "Vehicle access is separate", copy: "Rental, subscription, lease-to-own, purchase, insurance, taxes, and vehicle charges are reviewed for the vehicle you choose." },
  { title: "Your choice stays visible", copy: "You can compare membership plans, then explore current inventory and select Rent or Buy without blending those decisions." },
];

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
              <h1 className="font-display max-w-2xl text-5xl font-bold tracking-[-0.055em] sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>Membership opens your path. <span className="text-[#b08c2d]">It does not hide your vehicle cost.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-gray-600">Choose a membership for the program path you want to explore. Then select a confirmed vehicle and review vehicle-specific terms separately before you send a request.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">Compare memberships & pricing <ArrowRight size={16} /></Link>
                <Link href="/fleet" className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white">View confirmed vehicles</Link>
              </div>
            </div>
            <aside className="rounded-2xl bg-black p-8 text-white reveal delay-100">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9bf73]">Keep your costs clear</p>
              <div className="mt-7 space-y-5">
                <div className="flex gap-4"><CircleDollarSign size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">First:</strong> choose your enrollment and monthly membership plan.</p></div>
                <div className="flex gap-4"><CarFront size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">Then:</strong> choose Rent or Buy for a vehicle and review its separate charges.</p></div>
                <div className="flex gap-4"><ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#d9bf73]" /><p className="text-sm leading-6 text-gray-200"><strong className="text-white">Before you submit:</strong> availability, eligibility, and terms are confirmed for your request.</p></div>
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
