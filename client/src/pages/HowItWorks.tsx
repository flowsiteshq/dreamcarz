import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const stages = [
  { n:"01", name:"HASSLE FREE™", tagline:"Easy, convenient vehicle access", desc:"Join Dream Carz and immediately enjoy streamlined vehicle access, a dedicated member experience, and a single relationship that handles everything automotive." },
  { n:"02", name:"CREDIT FREE™", tagline:"Qualifying access without traditional credit scores", desc:"Build your DCP balance to 25% of your target vehicle value and qualify for Credit Free vehicle access — no traditional credit score required." },
  { n:"03", name:"WORRY FREE™", tagline:"DCP toward Vehicle Service Contracts", desc:"Use eligible DCP toward qualifying Vehicle Service Contracts and vehicle protection. Your loyalty pays for peace of mind." },
  { n:"04", name:"FEE FREE™", tagline:"DCP toward lease and program fees", desc:"Eligible DCP can offset qualifying Dream Carz lease and program fees. The longer you stay, the less you pay." },
  { n:"05", name:"DRIVE FREE™", tagline:"DCP toward rental days", desc:"Apply eligible DCP toward qualifying rental days and vehicle-use expenses. Your accumulated loyalty literally drives you for free." },
  { n:"06", name:"BE FREE™", tagline:"DCP toward vehicle ownership", desc:"The ultimate destination: use eligible DCP toward qualifying vehicle ownership." },
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
          <p className="text-gray-500 max-w-xl mx-auto reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>The longer you stay, the better you perform, and the more business you do with Dream Carz — the more valuable your transportation relationship becomes.</p>
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
