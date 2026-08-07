import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useMemo } from "react";
import { Info } from "lucide-react";

type Tier = "freedom"|"plus"|"pro"|"elite";
const tierData = {
  freedom: { price:39.95, enrollment:139, weeklyFee:79, redemptionBonus:0, label:"Freedom" },
  plus: { price:69.95, enrollment:199, weeklyFee:69, redemptionBonus:0.05, label:"Plus" },
  pro: { price:99.95, enrollment:249, weeklyFee:59, redemptionBonus:0.15, label:"Pro" },
  elite: { price:149.95, enrollment:299, weeklyFee:49, redemptionBonus:0.25, label:"Elite" },
};
const tenureMults: Record<number,number> = {1:1.0,2:1.1,3:1.2,4:1.35,5:1.5};
function getTenureMult(y:number) { return y>=5?1.5:tenureMults[y]??1.0; }

export default function Calculator() {
  useScrollReveal();
  const [tier, setTier] = useState<Tier>("pro");
  const [years, setYears] = useState(3);
  const [vehiclePrice, setVehiclePrice] = useState(25000);
  const [rentals, setRentals] = useState(4);

  const calc = useMemo(() => {
    const td = tierData[tier];
    const membershipPaid = td.enrollment + td.price*12*years;
    const tenureMult = getTenureMult(years);
    const combinedMult = Math.min(tenureMult*(1+td.redemptionBonus), 2.0);
    const dcpFromMembership = td.price*12*years*200;
    const dcpFromVehicle = vehiclePrice*2;
    const dcpFromRentals = rentals*5000;
    const totalDCP = dcpFromMembership+dcpFromVehicle+dcpFromRentals;
    const transportationPower = (totalDCP/100)*combinedMult;
    const weeklyFeeSavings = (79-td.weeklyFee)*52*years;
    const roadsideValue = 120*years;
    const rentalSavings = rentals*150*years;
    const totalSavings = weeklyFeeSavings+roadsideValue+rentalSavings;
    const totalValue = totalSavings+transportationPower;
    const memberValueRatio = totalValue/membershipPaid;
    const creditFreeDCP = (vehiclePrice*0.25)/combinedMult*100;
    return { membershipPaid, combinedMult, totalDCP, transportationPower, totalSavings, totalValue, memberValueRatio, creditFreeDCP, dcpFromMembership, dcpFromVehicle, dcpFromRentals };
  }, [tier, years, vehiclePrice, rentals]);

  const Slider = ({ label, value, min, max, step, onChange, fmt }: any) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "var(--font-sans)" }}>{label}</label>
        <span className="font-mono text-sm font-bold text-black">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000 0%, #000 ${((value-min)/(max-min))*100}%, #e5e7eb ${((value-min)/(max-min))*100}%, #e5e7eb 100%)` }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="pt-28 pb-12 bg-section">
        <div className="container text-center">
          <div className="section-label mb-3 reveal">Value Calculator</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>What Is Your Membership Actually Worth?</h1>
          <p className="text-gray-500 max-w-xl mx-auto reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>Adjust the inputs to see your projected DCP accumulation, transportation purchasing power, and member value ratio.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 reveal">
              <h2 className="font-display text-2xl font-bold text-black mb-6" style={{ fontFamily: "var(--font-display)" }}>Your Inputs</h2>
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-3" style={{ fontFamily: "var(--font-sans)" }}>Membership Tier</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(tierData) as Tier[]).map(t => (
                    <button key={t} onClick={() => setTier(t)} className={`py-2 text-xs font-semibold rounded-full transition-all ${tier===t?"bg-black text-white":"border border-gray-200 text-gray-500 hover:border-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>{tierData[t].label}</button>
                  ))}
                </div>
              </div>
              <Slider label="Years as Member" value={years} min={1} max={10} step={1} onChange={setYears} fmt={(v:number) => `${v} yr${v>1?"s":""}`} />
              <Slider label="Vehicle Price" value={vehiclePrice} min={5000} max={100000} step={1000} onChange={setVehiclePrice} fmt={(v:number) => `$${v.toLocaleString()}`} />
              <Slider label="Annual Rentals" value={rentals} min={0} max={52} step={1} onChange={setRentals} fmt={(v:number) => `${v} rentals`} />
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-2">
                <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>DCP earning rates are illustrative and subject to final financial modeling. This calculator is for educational purposes only.</p>
              </div>
            </div>

            <div className="space-y-5 reveal delay-100">
              <div className="bg-black rounded-2xl p-8 text-center">
                <div className="section-label text-gray-400 mb-2">Member Value Ratio</div>
                <div className="font-mono text-7xl font-bold text-white mb-2">{calc.memberValueRatio.toFixed(2)}x</div>
                <div className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>Total value vs membership cost</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Value Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label:"A. Membership Cost", value:`-$${calc.membershipPaid.toFixed(0)}`, positive:false },
                    { label:"B. Actual Savings", value:`+$${calc.totalSavings.toFixed(0)}`, positive:true },
                    { label:"C. Transportation Power", value:`+$${calc.transportationPower.toFixed(0)}`, positive:true },
                    { label:"D. Total Member Value", value:`$${calc.totalValue.toFixed(0)}`, bold:true },
                  ].map((item,i) => (
                    <div key={i} className={`flex justify-between items-center py-2 ${i<3?"border-b border-gray-100":""}`}>
                      <span className={`text-sm ${item.bold?"font-semibold text-black":"text-gray-600"}`} style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className={`font-mono text-sm font-bold ${item.positive?"text-black":item.bold?"text-black":"text-gray-700"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>DCP Accumulation</h3>
                <div className="space-y-2">
                  {[
                    { label:"From Membership Payments", dcp:calc.dcpFromMembership },
                    { label:"From Vehicle Transaction", dcp:calc.dcpFromVehicle },
                    { label:"From Rentals", dcp:calc.dcpFromRentals },
                  ].map((item,i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className="font-mono text-xs font-bold text-black">{item.dcp.toLocaleString()} DCP</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>Total DCP</span>
                    <span className="font-mono text-base font-bold text-black">{calc.totalDCP.toLocaleString()} DCP</span>
                  </div>
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
