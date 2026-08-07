/* DreamCarz Network — Member Dashboard
 * Protected page — requires login via Manus OAuth
 * Shows DCP journey, redemption power, value summary, quick actions
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { TrendingUp, Award, Car, Shield, Zap, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Dashboard() {
  useScrollReveal();
  const { user, isAuthenticated, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      startLogin();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  // Demo DCP data — in production this would come from a tRPC query
  const memberName = user?.name ?? "Member";
  const memberTier = "Pro"; // Would come from DB
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : "2024";
  const dcpEarned = 425000;
  const currentDCP = 285000;
  const redemptionMultiplier = 1.20;
  const dcpValueDollars = Math.round((currentDCP / 100) * redemptionMultiplier);
  const actualSavings = 3840;
  const membershipPaid = 4497;
  const totalValue = actualSavings + dcpValueDollars;
  const memberValueRatio = (totalValue / membershipPaid).toFixed(2);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-10 bg-section">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="section-label mb-2">Member Dashboard</div>
              <h1 className="font-display text-4xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Welcome back, {memberName.split(" ")[0]}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full tracking-wider uppercase" style={{ fontFamily: "var(--font-sans)" }}>
                  {memberTier} Member
                </span>
                <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                  Member since {memberSince}
                </span>
              </div>
            </div>
            <div className="bg-black text-white rounded-2xl p-5 text-right">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Member Value Ratio</div>
              <div className="font-mono text-4xl font-bold text-white">{memberValueRatio}x</div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-sans)" }}>Transportation value vs cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="py-10 border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "DCP Earned", value: dcpEarned.toLocaleString(), sub: "Lifetime total", icon: <TrendingUp size={18} /> },
              { label: "Current DCP", value: currentDCP.toLocaleString(), sub: "Available balance", icon: <Zap size={18} /> },
              { label: "Transportation Power", value: `$${dcpValueDollars.toLocaleString()}`, sub: `At ${redemptionMultiplier}x multiplier`, icon: <Car size={18} /> },
              { label: "Actual Savings", value: `$${actualSavings.toLocaleString()}`, sub: "Realized to date", icon: <Shield size={18} /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
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

      {/* Main content */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* DCP Journey */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal">
                <h3 className="font-display text-xl font-bold text-black mb-5" style={{ fontFamily: "var(--font-display)" }}>DCP Journey</h3>
                <div className="space-y-4">
                  {[
                    { label: "Membership Payments", dcp: 120000, pct: 28 },
                    { label: "Vehicle Transaction", dcp: 180000, pct: 42 },
                    { label: "Rental Activity", dcp: 85000, pct: 20 },
                    { label: "Good-Standing Bonus", dcp: 40000, pct: 10 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                        <span className="font-mono text-sm font-bold text-black">{item.dcp.toLocaleString()} DCP</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redemption Power Growth */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-100">
                <h3 className="font-display text-xl font-bold text-black mb-5" style={{ fontFamily: "var(--font-display)" }}>Redemption Power Growth</h3>
                <div className="flex items-end gap-3 h-24">
                  {[{ y: "Yr 1", m: 1.00 }, { y: "Yr 2", m: 1.10 }, { y: "Yr 3", m: 1.20 }, { y: "Yr 4", m: 1.35 }, { y: "Yr 5+", m: 1.50 }].map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="font-mono text-xs font-bold text-black">{item.m}x</span>
                      <div className={`w-full rounded-t-sm ${i === 4 ? "bg-black" : "bg-gray-200"}`} style={{ height: `${(item.m / 1.5) * 72}px` }}></div>
                      <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{item.y}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3" style={{ fontFamily: "var(--font-sans)" }}>Illustrative multipliers. Subject to financial modeling and final approval.</p>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Value Summary */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Value Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: "Membership Paid", value: `-$${membershipPaid.toLocaleString()}` },
                    { label: "Actual Savings", value: `+$${actualSavings.toLocaleString()}` },
                    { label: "Transportation Power", value: `+$${dcpValueDollars.toLocaleString()}` },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                      <span className="font-mono text-sm font-bold text-black">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>Total Value</span>
                    <span className="font-mono text-lg font-bold text-black">${totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-100">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Account</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Name</span>
                    <span className="text-xs font-medium text-black" style={{ fontFamily: "var(--font-sans)" }}>{user?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Email</span>
                    <span className="text-xs font-medium text-black truncate max-w-[140px]" style={{ fontFamily: "var(--font-sans)" }}>{user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>Tier</span>
                    <span className="text-xs font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{memberTier}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-200">
                <h3 className="font-display text-lg font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Browse the Fleet", href: "/fleet", icon: <Car size={15} /> },
                    { label: "Calculate Your Value", href: "/calculator", icon: <TrendingUp size={15} /> },
                    { label: "Upgrade Membership", href: "/membership", icon: <Award size={15} /> },
                  ].map((action, i) => (
                    <Link key={i} href={action.href} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-2.5">
                        <span className="text-black">{action.icon}</span>
                        <span className="text-sm text-gray-600 group-hover:text-black transition-colors" style={{ fontFamily: "var(--font-sans)" }}>{action.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </Link>
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
