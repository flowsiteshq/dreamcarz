import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const stages = [
  { n:"01", name:"HASSLE FREE™", tagline:"Day 1 · Easy, convenient vehicle access", desc:"Start with a simple way to access a vehicle, no-haggle member-only pricing, roadside assistance, Dream Carz certified vehicles, and DCP on eligible transactions." },
  { n:"02", name:"CREDIT FREE™", tagline:"Starts Day 1 · Fast, simple approval", desc:"Qualifying members may access vehicles without traditional credit-score requirements. Approval is based on ability to pay and other applicable factors." },
  { n:"03", name:"WORRY FREE™", tagline:"Year 1 · Protection and peace of mind", desc:"Qualifying vehicles may include enhanced protection and warranty benefits designed to bring greater confidence while you drive and own." },
  { n:"04", name:"INTEREST FREE™", tagline:"Year 2 · Put eligible DCP to work", desc:"Eligible DCP may reduce or cover interest charges on qualifying lease or financing programs, subject to program terms." },
  { n:"05", name:"DRIVE FREE™", tagline:"Year 3 · Unlock free rental days", desc:"Eligible DCP may be used toward free rental days and additional member benefits, subject to availability and program terms." },
  { n:"06", name:"BE FREE™", tagline:"Year 4+ · Build toward ownership", desc:"Eligible DCP may be used toward owning a vehicle, creating a longer-term path from membership activity to vehicle ownership." },
];

export default function HowItWorks() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container text-center">
          <div className="section-label mb-3 reveal">The Dream Carz Journey</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Six Stages to Transportation Freedom</h1>
          <p className="text-gray-500 max-w-xl mx-auto reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Start strong. Stay loyal. Get freedom. The longer you stay, the more DCP-enabled benefits you can unlock.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="container max-w-3xl mx-auto">
          {stages.map((stage, i) => (
            <div key={i} className="reveal" style={{ transitionDelay:`${i*80}ms` }}>
              <div className="bg-white border border-gray-200 rounded-2xl p-7 flex gap-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="font-mono text-2xl font-bold text-black">{stage.n}</div>
                  {i<stages.length-1 && <div className="w-px flex-1 mt-4 bg-gray-200"></div>}
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-widest uppercase mb-1 text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{stage.name}</div>
                  <h3 className="font-display text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>{stage.tagline}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{stage.desc}</p>
                </div>
              </div>
              {i<stages.length-1 && <div className="flex justify-center my-2"><ArrowDown size={16} className="text-gray-300" /></div>}
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 bg-section">
        <div className="container text-center reveal">
          <h2 className="font-display text-4xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Start Your Journey Today</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>Every day you wait is a day your DCP isn't growing. Join now as a Founding Member.</p>
          <Link href="/membership" className="btn-primary">Claim Your Membership <ChevronRight size={16} /></Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
