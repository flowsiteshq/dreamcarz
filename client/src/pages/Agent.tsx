import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DollarSign, Users, TrendingUp, Award, Zap, ChevronRight, Car } from "lucide-react";
import { Link } from "wouter";

const earnings = [
  { icon:<Car size={20}/>, title:"Dream Carz Supplies Vehicles", desc:"Operate a location and manage qualifying vehicle activity with Dream Carz vehicle support." },
  { icon:<Users size={20}/>, title:"Operate & Manage", desc:"Build a local business by managing customer relationships and day-to-day operations." },
  { icon:<DollarSign size={20}/>, title:"Transaction Commissions", desc:"Earn on qualifying rentals, RTO/LTO activity, and sales transactions." },
  { icon:<TrendingUp size={20}/>, title:"Scalable Location Model", desc:"Grow a location model designed to support expansion with lower operational risk." },
  { icon:<Award size={20}/>, title:"Leadership & Performance", desc:"Qualifying growth may unlock leadership overrides and performance bonuses." },
  { icon:<Zap size={20}/>, title:"Training Included", desc:"No experience is needed to begin; Dream Carz provides a path to learn, operate, and grow." },
];

export default function Agent() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Agent Opportunity</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>We Supply the Cars.<br />You Build the Business.</h1>
          <p className="text-gray-500 max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Operate. Manage. Earn. Build a scalable Dream Carz location through qualifying rentals, RTO/LTO activity, and sales support.</p>
          <Link href="/membership" className="btn-primary reveal delay-300">Become an Agent <ChevronRight size={16} /></Link>
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
          <p className="text-center text-xs text-gray-400 mt-8" style={{ fontFamily: "var(--font-sans)" }}>Exact compensation plan requires separate financial and legal modeling.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
