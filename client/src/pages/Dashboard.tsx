import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { TrendingUp, Award, Car, Shield, Zap, ChevronRight } from "lucide-react";

const memberData = { name:"Marcus Johnson", tier:"Elite", memberSince:"2024", dcpEarned:425000, dcpRedeemed:140000, currentDCP:285000, redemptionMultiplier:1.5, transportationPower:4275, membershipPaid:4497, actualSavings:3840, totalValue:8115, memberValueRatio:1.80 };

export default function Dashboard() {
  useScrollReveal();
  const dcpValueDollars = (memberData.currentDCP/100)*memberData.redemptionMultiplier;
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-10 bg-section">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="section-label mb-2">Member Dashboard</div>
              <h1 className="font-display text-4xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Welcome back, {memberData.name}</h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full tracking-wider uppercase" style={{ fontFamily: "var(--font-sans)" }}>{memberData.tier} Member</span>
                <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Member since {memberData.memberSince}</span>
              </div>
            </div>
            <div className="bg-black text-white rounded-2xl p-5 text-right">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Member Value Ratio</div>
              <div className="font-mono text-4xl font-bold text-white">{memberData.memberValueRatio}x</div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-sans)" }}>Transportation value vs cost</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"DCP Earned", value:memberData.dcpEarned.toLocaleString(), sub:"Lifetime total", icon:<TrendingUp size={18} /> },
              { label:"Current DCP", value:memberData.currentDCP.toLocaleString(), sub:"Available balance", icon:<Zap size={18} /> },
              { label:"Transportation Power", value:`$${dcpValueDollars.toLocaleString()}`, sub:`At ${memberData.redemptionMultiplier}x multiplier`, icon:<Car size={18} /> },
              { label:"Actual Savings", value:`$${memberData.actualSavings.toLocaleString()}`, sub:"Realized to date", icon:<Shield size={18} /> },
            ].map((stat,i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 reveal" style={{ transitionDelay:`${i*80}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-black">{stat.icon}</span>
                </div>
                <div className="font-mono text-2xl lg:text-3xl font-bold text-black mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-black mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>{stat.label}</div>
                <div className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal">
                <h3 className="font-display text-xl font-bold text-black mb-5" style={{ fontFamily: "var(--font-display)" }}>DCP Journey</h3>
                <div className="space-y-4">
                  {[
                    { label:"Membership Payments", dcp:120000, pct:28 },
                    { label:"Vehicle Transaction", dcp:180000, pct:42 },
                    { label:"Rental Activity", dcp:85000, pct:20 },
                    { label:"Good-Standing Bonus", dcp:40000, pct:10 },
                  ].map((item,i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                        <span className="font-mono text-sm font-bold text-black">{item.dcp.toLocaleString()} DCP</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width:`${item.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-100">
                <h3 className="font-display text-xl font-bold text-black mb-5" style={{ fontFamily: "var(--font-display)" }}>Redemption Power Growth</h3>
                <div className="flex items-end gap-3 h-24">
                  {[{y:"Yr 1",m:1.00},{y:"Yr 2",m:1.10},{y:"Yr 3",m:1.20},{y:"Yr 4",m:1.35},{y:"Yr 5+",m:1.50}].map((item,i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-mono text-xs font-bold text-black">{item.m}x</span>
                      <div className={`w-full rounded-t-sm ${i===4?"bg-black":"bg-gray-200"}`} style={{ height:`${(item.m/1.5)*72}px` }}></div>
                      <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{item.y}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Value Summary</h3>
                <div className="space-y-3">
                  {[
                    { label:"Membership Paid", value:`$${memberData.membershipPaid.toLocaleString()}` },
                    { label:"Actual Savings", value:`+$${memberData.actualSavings.toLocaleString()}` },
                    { label:"Transportation Power", value:`+$${dcpValueDollars.toLocaleString()}` },
                  ].map((item,i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className="font-mono text-sm font-bold text-black">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>Total Value</span>
                    <span className="font-mono text-lg font-bold text-black">${memberData.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-200">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label:"Browse the Fleet", href:"/fleet", icon:<Car size={15} /> },
                    { label:"Calculate Your Value", href:"/calculator", icon:<TrendingUp size={15} /> },
                    { label:"Upgrade Membership", href:"/membership", icon:<Award size={15} /> },
                  ].map((action,i) => (
                    <a key={i} href={action.href} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-2.5">
                        <span className="text-black">{action.icon}</span>
                        <span className="text-sm text-gray-600 group-hover:text-black transition-colors" style={{ fontFamily: "var(--font-sans)" }}>{action.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
