/* Shared shell layout for all dashboard sidebar pages */
import AIConcierge from "@/components/AIConcierge";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Car, CalendarDays, Star, CreditCard, Gift,
  MapPin, Headphones, Settings, ChevronRight, ArrowUp, Sparkles, AlertTriangle,
  Bell, LogOut, Menu, TrendingUp
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const sidebarLinks = [
  { href: "/dashboard", label: "My Account", icon: LayoutDashboard },
  { href: "/dashboard/vehicles", label: "My Vehicles", icon: Car },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/dashboard/membership", label: "Membership", icon: Star },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/report", label: "Report an Issue", icon: AlertTriangle },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin },
  { href: "/dashboard/support", label: "Support", icon: Headphones },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const tierColors: Record<string, string> = {
  Freedom: "linear-gradient(90deg, #3B82F6, #60A5FA)",
  Plus: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
  Pro: "linear-gradient(90deg, #B8860B, #D4A017)",
  Elite: "linear-gradient(90deg, #111, #B8860B)",
};

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardShell({ children, title }: DashboardShellProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiFocused, setAiFocused] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "Member";
  const tier = "Pro";
  const tierGradient = tierColors[tier] || tierColors.Pro;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-5">
            <Car size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Member Dashboard</h2>
          <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-sans)" }}>Sign in to access your DreamCarz member dashboard.</p>
          <button onClick={() => startLogin()} className="w-full py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors">Sign In</button>
          <Link href="/" className="block mt-3 text-sm text-gray-400 hover:text-black transition-colors">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[210px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-5 h-[68px] border-b border-gray-100 flex-shrink-0">
          <img src="/manus-storage/logo-dark-mark-crop_f052e278.png" alt="DC" className="h-7 w-auto object-contain" />
          <img src="/manus-storage/logo-dark-wordmark-crop_bb978492.png" alt="DREAMCARZ" className="h-[12px] w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = location === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] font-medium transition-all duration-150 ${active ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-gray-50"}`}
              >
                <Icon size={16} className={active ? "text-white" : "text-gray-400"} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 flex-shrink-0 space-y-3">
          <div className="rounded-2xl bg-black text-white p-4 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/5 translate-x-6 translate-y-6" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">DCP Balance</p>
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>285,000</p>
            <p className="text-[11px] text-gray-400 mt-0.5">$2,850 Value</p>
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-500">Transportation Power</p>
              <p className="text-[11px] font-bold text-white">$3,420</p>
            </div>
            <p className="text-[10px] text-gray-500">At 1.2x multiplier</p>
            <Link href="/dashboard/rewards" className="mt-2 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              View activity <ChevronRight size={10} />
            </Link>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{firstName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-black truncate">{user?.name || "Member"}</p>
              <p className="text-[10px] text-gray-400">{tier} Member</p>
            </div>
            <button onClick={() => logout()} className="text-gray-300 hover:text-black transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-[210px] flex flex-col min-h-screen">
        <div className="sticky top-0 z-20">
          <div className="h-1.5 w-full" style={{ background: tierGradient }} />
          <header className="bg-white border-b border-gray-100 px-5 lg:px-8 flex items-center gap-4" style={{ minHeight: "68px" }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-black">
              <Menu size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {title || `Welcome back, ${firstName}`}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider text-white" style={{ background: tierGradient }}>
                  {tier} Member
                </span>
                <span className="text-[11px] text-gray-400">· Member since 2026</span>
              </div>
            </div>
            <div className={`hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 w-64 transition-all duration-200 ${aiFocused ? "shadow-[0_0_0_2px_rgba(0,0,0,0.1)] bg-white" : ""}`}>
              <Sparkles size={14} className="text-gray-300 flex-shrink-0" />
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onFocus={() => setAiFocused(true)}
                onBlur={() => setAiFocused(false)}
                placeholder="Ask DreamCarz anything..."
                className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none"
              />
              <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${aiInput.trim() ? "bg-black text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                <ArrowUp size={13} />
              </button>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </header>
        </div>
        <main className="flex-1 p-5 lg:p-8">
          {children}
        </main>
        <AIConcierge />
      </div>
    </div>
  );
}
