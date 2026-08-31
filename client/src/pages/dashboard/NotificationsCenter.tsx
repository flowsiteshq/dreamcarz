import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2, Mail, MessageSquareText, Smartphone } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";

function dateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsCenter() {
  const inbox = trpc.communications.listMine.useQuery(undefined, { refetchOnWindowFocus: false });
  const markRead = trpc.communications.markRead.useMutation({ onSuccess: () => void inbox.refetch() });
  const markAllRead = trpc.communications.markAllRead.useMutation({ onSuccess: () => void inbox.refetch() });
  const updatePreferences = trpc.communications.updatePreferences.useMutation({ onSuccess: () => void inbox.refetch() });
  const [preferences, setPreferences] = useState({ emailEnabled: false, smsEnabled: false, pushEnabled: false, transactionalInAppEnabled: true });
  const unreadCount = useMemo(() => inbox.data?.notifications.filter(notification => !notification.readAt).length ?? 0, [inbox.data?.notifications]);

  useEffect(() => {
    if (!inbox.data?.preferences) return;
    setPreferences({
      emailEnabled: inbox.data.preferences.emailEnabled,
      smsEnabled: inbox.data.preferences.smsEnabled,
      pushEnabled: inbox.data.preferences.pushEnabled,
      transactionalInAppEnabled: inbox.data.preferences.transactionalInAppEnabled,
    });
  }, [inbox.data?.preferences]);

  if (inbox.isLoading) return <DashboardShell title="Notifications"><div className="flex min-h-[420px] items-center justify-center gap-3 text-sm text-gray-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading your private updates…</div></DashboardShell>;

  return <DashboardShell title="Notifications"><div className="mx-auto max-w-6xl space-y-8">
    <section className="border-b border-gray-200 pb-7"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Private communication center</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black sm:text-5xl">Updates that follow your journey.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">Review private in-app transaction, membership, vehicle, wallet, incident, and support updates. External delivery options remain off unless a DreamCarz-approved provider is intentionally configured.</p></section>
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="border border-gray-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">In-app inbox</p><h2 className="mt-2 font-display text-2xl font-bold text-black">Your notices</h2>{unreadCount > 0 && <p className="mt-1 text-xs text-gray-500">{unreadCount} unread update{unreadCount === 1 ? "" : "s"}</p>}</div><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-[#a8832d]" />{unreadCount > 0 && <button type="button" disabled={markAllRead.isPending} onClick={() => void markAllRead.mutateAsync()} className="inline-flex items-center gap-1 text-xs font-semibold text-black underline underline-offset-4 disabled:opacity-50"><CheckCheck className="h-3.5 w-3.5" />{markAllRead.isPending ? "Updating…" : "Mark all read"}</button>}</div></div><div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">{inbox.data?.notifications.length ? inbox.data.notifications.map(notification => <article key={notification.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a8832d]">{notification.category.replaceAll("_", " ")}</p><h3 className="mt-2 text-sm font-bold text-black">{notification.title}</h3></div>{notification.readAt ? <span className="text-xs text-gray-500">Read</span> : <button type="button" disabled={markRead.isPending} onClick={() => void markRead.mutateAsync({ id: notification.id })} className="inline-flex items-center gap-1 text-xs font-semibold text-black underline underline-offset-4"><CheckCheck className="h-3.5 w-3.5" /> Mark read</button>}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{notification.body}</p><p className="mt-3 text-xs text-gray-500">{dateTime(notification.createdAt)}</p>{notification.actionPath && <a href={notification.actionPath} className="mt-3 inline-flex text-xs font-semibold text-black underline underline-offset-4">Open related record</a>}</article>) : <div className="py-10 text-center"><Bell className="mx-auto h-6 w-6 text-[#a8832d]" /><p className="mt-3 text-sm font-semibold text-black">No private updates yet.</p><p className="mt-2 text-xs leading-5 text-gray-500">New notices will appear here when an authorized DreamCarz workflow creates them.</p></div>}</div>{markAllRead.error && <p className="mt-3 text-xs text-red-600">{markAllRead.error.message}</p>}</article>
      <article className="border border-gray-200 bg-[#f7f5f0] p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Communication preferences</p><h2 className="mt-2 font-display text-2xl font-bold text-black">Keep control of delivery.</h2><p className="mt-3 text-sm leading-6 text-gray-600">Your preferences are saved to your DreamCarz ID. Email, SMS, and push are not activated by this screen and remain disabled unless DreamCarz completes a separate approved provider setup.</p><div className="mt-5 space-y-4"><label className="flex items-start gap-3 text-sm text-gray-700"><input type="checkbox" checked={preferences.transactionalInAppEnabled} onChange={event => setPreferences(current => ({ ...current, transactionalInAppEnabled: event.target.checked }))} className="mt-1 accent-black" /><span><Bell className="mr-2 inline h-4 w-4 text-[#a8832d]" />In-app transactional updates</span></label><label className="flex items-start gap-3 text-sm text-gray-400"><input disabled type="checkbox" checked={preferences.emailEnabled} className="mt-1" /><span><Mail className="mr-2 inline h-4 w-4" />Email updates <small className="block pl-6 text-xs">Provider not configured</small></span></label><label className="flex items-start gap-3 text-sm text-gray-400"><input disabled type="checkbox" checked={preferences.smsEnabled} className="mt-1" /><span><MessageSquareText className="mr-2 inline h-4 w-4" />SMS updates <small className="block pl-6 text-xs">Provider not configured</small></span></label><label className="flex items-start gap-3 text-sm text-gray-400"><input disabled type="checkbox" checked={preferences.pushEnabled} className="mt-1" /><span><Smartphone className="mr-2 inline h-4 w-4" />Push updates <small className="block pl-6 text-xs">Provider not configured</small></span></label></div><button type="button" disabled={updatePreferences.isPending} onClick={() => void updatePreferences.mutateAsync(preferences)} className="mt-6 h-10 bg-black px-4 text-sm font-semibold text-white disabled:opacity-50">{updatePreferences.isPending ? "Saving…" : "Save preferences"}</button></article>
    </section>
  </div></DashboardShell>;
}
