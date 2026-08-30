import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DollarSign, Users, TrendingUp, Car, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const benefits = [
  { icon:<Car size={22}/>, title:"Vehicle Review", desc:"Submit a vehicle for DreamCarz operational review before any fleet assignment is activated." },
  { icon:<Users size={22}/>, title:"Partner Operations", desc:"Approved Fleet Partners receive access only to assigned-vehicle operations and records." },
  { icon:<TrendingUp size={22}/>, title:"Readiness Workflow", desc:"Coordinate inspections, maintenance requests, incidents, and handoffs through an authorized operating workflow." },
  { icon:<DollarSign size={22}/>, title:"Terms Reviewed First", desc:"Commercial terms, payment timing, and any partner compensation are documented in an approved agreement—not public estimates." },
];

export default function HostProgram() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Host Program</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Bring Your Vehicle<br />Into a Structured Network.</h1>
          <p className="text-gray-500 max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>DreamCarz reviews fleet suitability, operating readiness, and partnership terms before assigning vehicle access or activating a partner workspace.</p>
          <Link href="/contact" className="btn-primary reveal delay-300">Start a partner review <ChevronRight size={16} /></Link>
        </div>
      </section>
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {benefits.map((b,i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-7 reveal" style={{ transitionDelay:`${i*80}ms` }}>
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-black mb-5">{b.icon}</div>
                <h3 className="font-display text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-section">
        <div className="container text-center reveal">
          <div className="section-label mb-3">Partner process</div>
          <h2 className="font-display text-4xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>A Controlled Operating Path</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
            {[{tier:"1",fee:"Vehicle review"},{tier:"2",fee:"Partner terms"},{tier:"3",fee:"Assignment"},{tier:"4",fee:"Portal access"}].map((t,i) => (
              <div key={i} className={`rounded-2xl p-5 text-center ${i===3?"bg-black text-white":"bg-white border border-gray-200"}`}>
                <div className={`text-sm font-semibold mb-1 ${i===3?"text-gray-400":"text-gray-500"}`} style={{ fontFamily: "var(--font-sans)" }}>{t.tier}</div>
                <div className={`font-mono text-2xl font-bold ${i===3?"text-white":"text-black"}`}>{t.fee}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
