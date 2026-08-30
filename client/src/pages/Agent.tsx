import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DollarSign, Users, TrendingUp, Award, Zap, ChevronRight, Car } from "lucide-react";
import { Link } from "wouter";

const earnings = [
  { icon:<Car size={20}/>, title:"Vehicle Operations", desc:"Approved Fleet Partner and operations roles use controlled vehicle and transaction workflows." },
  { icon:<Users size={20}/>, title:"Customer Introductions", desc:"Authorized Associates can share a referral route and manage only consented follow-up contacts." },
  { icon:<DollarSign size={20}/>, title:"Recorded Activity", desc:"The private Associate workspace shows recorded referral and program activity without estimating compensation." },
  { icon:<TrendingUp size={20}/>, title:"Role-Based Growth", desc:"Access and responsibilities are reviewed by DreamCarz based on the applicable program terms." },
  { icon:<Award size={20}/>, title:"Program Review", desc:"DreamCarz confirms role standing and available operating tools before private access is granted." },
  { icon:<Zap size={20}/>, title:"Training Access", desc:"Any approved training materials are provided inside the authorized Associate workspace." },
];

export default function Agent() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Agent Opportunity</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Build a connected<br />DreamCarz Path.</h1>
          <p className="text-gray-500 max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Learn about Associate access, customer introductions, and role-based operating tools. Program terms and role approval are reviewed directly by DreamCarz.</p>
          <Link href="/contact" className="btn-primary reveal delay-300">Ask about Associate access <ChevronRight size={16} /></Link>
        </div>
      </section>
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {earnings.map((item,i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 reveal" style={{ transitionDelay:`${i*80}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black mb-4">{item.icon}</div>
                <h3 className="font-display text-lg font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8" style={{ fontFamily: "var(--font-sans)" }}>Role access, any program terms, and any recorded compensation arrangements are managed and confirmed directly by DreamCarz.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
