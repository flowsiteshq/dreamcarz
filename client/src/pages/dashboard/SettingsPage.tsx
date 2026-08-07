import DashboardShell from "@/components/DashboardShell";
import { User, Bell, Shield, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });

  return (
    <DashboardShell title="Settings">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Settings</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences</p>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <User size={16} className="text-gray-400" />
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Profile</h3>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{user?.name?.[0] || "M"}</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-black">{user?.name || "Member"}</p>
              <p className="text-[12px] text-gray-400">{user?.email || "—"}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Pro Member · Since 2026</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Full Name", value: user?.name || "—" },
              { label: "Email Address", value: user?.email || "—" },
              { label: "Phone Number", value: "Not set" },
              { label: "Member ID", value: `DC-${user?.id || "000000"}` },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-[12px] text-gray-400">{f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-black">{f.value}</span>
                  <button className="text-[11px] text-gray-400 hover:text-black transition-colors">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell size={16} className="text-gray-400" />
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: "email" as const, label: "Email Notifications", desc: "Receipts, reminders, and account updates" },
              { key: "sms" as const, label: "SMS Notifications", desc: "Reservation confirmations and alerts" },
              { key: "push" as const, label: "Push Notifications", desc: "Real-time DCP updates and AI insights" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-black">{n.label}</p>
                  <p className="text-[11px] text-gray-400">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications[n.key] ? "bg-black" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={16} className="text-gray-400" />
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Security</h3>
          </div>
          <div className="space-y-1">
            {[
              { label: "Change Password", desc: "Update your account password" },
              { label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
              { label: "Active Sessions", desc: "View and manage logged-in devices" },
            ].map((s, i) => (
              <button key={i} className="w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors text-left">
                <div>
                  <p className="text-[13px] font-medium text-black">{s.label}</p>
                  <p className="text-[11px] text-gray-400">{s.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 text-red-500 text-[13px] font-semibold rounded-2xl hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </DashboardShell>
  );
}

