import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DollarSign, Users, TrendingUp, Award, Zap, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const earnings = [
  { icon:<DollarSign size={20}/>, title:"Personal Membership Sales", desc:"Earn cash commissions on every membership you personally enroll." },
  { icon:<Users size={20}/>, title:"Team Production", desc:"Build a team and earn override commissions on their qualifying production." },
  { icon:<TrendingUp size={20}/>, title:"Vehicle Transactions", desc:"Earn on qualifying vehicle transactions your customers complete through Dream Carz." },
  { icon:<Award size={20}/>, title:"Rank Bonuses", desc:"Hit production milestones and unlock rank bonuses that reward your growth." },
  { icon:<Zap size={20}/>, title:"DCP Bonuses", desc:"Earn DCP in addition to cash — building your own transportation purchasing power." },
  { icon:<TrendingUp size={20}/>, title:"Renewal Income", desc:"Earn ongoing renewal commissions as your members maintain their memberships." },
];

export default function Agent() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-16 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Agent Opportunity</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>Earn Cash + DCP<br />for Every Member You Bring</h1>
          <p className="text-gray-500 max-w-xl mb-8 reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Dream Carz Agents earn cash commissions and DCP points for qualifying customer and member production. Build a team, earn overrides, and grow your own transportation purchasing power simultaneously.</p>
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

