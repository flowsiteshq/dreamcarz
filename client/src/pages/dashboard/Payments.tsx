import DashboardShell from "@/components/DashboardShell";
import { CreditCard, Download, ChevronRight, TrendingUp } from "lucide-react";

const transactions = [
  { id: "INV-2026-042", date: "Jun 1, 2026", desc: "Pro Membership — June", amount: "$499.00", status: "Paid", dcp: "+4,990 DCP" },
  { id: "INV-2026-041", date: "May 1, 2026", desc: "Pro Membership — May", amount: "$499.00", status: "Paid", dcp: "+4,990 DCP" },
  { id: "INV-2026-040", date: "Apr 10, 2026", desc: "Vehicle Rental — Porsche 911", amount: "$245.00", status: "Paid", dcp: "+2,450 DCP" },
  { id: "INV-2026-039", date: "Apr 1, 2026", desc: "Pro Membership — April", amount: "$499.00", status: "Paid", dcp: "+4,990 DCP" },
  { id: "INV-2026-038", date: "Mar 1, 2026", desc: "Pro Membership — March", amount: "$499.00", status: "Paid", dcp: "+4,990 DCP" },
  { id: "INV-2026-037", date: "Feb 1, 2026", desc: "Plus Membership — February", amount: "$299.00", status: "Paid", dcp: "+2,990 DCP" },
];

export default function Payments() {
  return (
    <DashboardShell title="Payments">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Payments</h2>
          <p className="text-sm text-gray-400 mt-0.5">Billing history and payment methods</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Paid (2026)", value: "$2,540", icon: CreditCard },
            { label: "Next Payment", value: "Jul 1, 2026", icon: TrendingUp },
            { label: "Next Amount", value: "$499.00", icon: CreditCard },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
                <Icon size={18} className="text-gray-400 mb-3" />
                <p className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Payment Method</h3>
            <button className="text-[11px] text-gray-400 hover:text-black transition-colors">Update</button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-7 bg-black rounded flex items-center justify-center">
              <CreditCard size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-black">•••• •••• •••• 4242</p>
              <p className="text-[11px] text-gray-400">Expires 08/2028</p>
            </div>
            <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Active</span>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Transaction History</h3>
            <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-black transition-colors"><Download size={12} /> Export</button>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-black">{t.desc}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.id} · {t.date}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-[13px] font-semibold text-black">{t.amount}</p>
                  <p className="text-[10px] text-green-600 font-medium">{t.dcp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

