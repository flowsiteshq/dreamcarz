import DashboardShell from "@/components/DashboardShell";
import { User, Bell, Shield, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const setDirectPassword = trpc.auth.setDirectPassword.useMutation();

  const saveDirectPassword = async () => {
    setPasswordMessage(null);
    if (password.length < 10) return setPasswordMessage("Use at least 10 characters for your password.");
    if (password !== confirmPassword) return setPasswordMessage("Your passwords do not match.");
    try {
      await setDirectPassword.mutateAsync({ password });
      setPassword("");
      setConfirmPassword("");
      setPasswordMessage("Your DreamCarz password is ready. You can now sign in with your email and this password.");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "We could not save your password. Please try again.");
    }
  };

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
          <p className="mb-4 text-[12px] leading-relaxed text-gray-500">Set a direct password for your existing account. You can then sign in with <span className="font-medium text-black">{user?.email}</span> even if your account was originally created with another sign-in method.</p>
          <div className="space-y-3">
            <input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="New password (at least 10 characters)" className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-black outline-none focus:border-black" />
            <input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="Confirm new password" className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-black outline-none focus:border-black" />
            <button onClick={saveDirectPassword} disabled={setDirectPassword.isPending} className="flex h-11 w-full items-center justify-center rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-60">{setDirectPassword.isPending ? "Saving password…" : "Save DreamCarz password"}</button>
            {passwordMessage && <p className={`rounded-lg px-3 py-2 text-[12px] ${passwordMessage.startsWith("Your DreamCarz") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{passwordMessage}</p>}
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
