import { useEffect, useState } from "react";
import { ArrowRight, Car, CheckCircle2, Compass, Flag, History, Route, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";

const checkpoints = [
  { icon: Flag, title: "Set your destination", description: "Choose a dream vehicle or transportation objective that gives your journey a clear direction." },
  { icon: ShieldCheck, title: "Build readiness", description: "Keep your member profile, rental readiness, and transportation plan current." },
  { icon: Route, title: "Track your activity", description: "Review eligible activity and available DreamCarz Value under the current program rules." },
  { icon: Car, title: "Review your next move", description: "Explore available vehicles and options with the DreamCarz team when you are ready." },
] as const;

export default function DreamJourney() {
  const futureDriver = trpc.futureDriver.mine.useQuery(undefined, { staleTime: 30_000 });
  const utils = trpc.useUtils();
  const profile = futureDriver.data?.profile;
  const [goalArea, setGoalArea] = useState<"vehicle_discovery" | "rental_readiness" | "membership_review" | "transportation_plan">(profile?.goalArea ?? "vehicle_discovery");
  const [horizon, setHorizon] = useState<"exploring" | "later" | "preparing">(profile?.horizon ?? "exploring");
  const [desiredVehicleId, setDesiredVehicleId] = useState(profile?.desiredVehicleId ?? "");
  useEffect(() => {
    if (!profile) return;
    setGoalArea(profile.goalArea);
    setHorizon(profile.horizon);
    setDesiredVehicleId(profile.desiredVehicleId ?? "");
  }, [profile?.id, profile?.goalArea, profile?.horizon, profile?.desiredVehicleId]);
  const saveGoal = trpc.futureDriver.saveGoal.useMutation({ onSuccess: () => void utils.futureDriver.mine.invalidate() });
  const setMode = trpc.futureDriver.setMode.useMutation({ onSuccess: () => void utils.futureDriver.mine.invalidate() });
  const profileVehicle = profile?.desiredVehicleId && profile.desiredVehicleId in APPROVED_TRANSACTION_VEHICLES ? APPROVED_TRANSACTION_VEHICLES[profile.desiredVehicleId as keyof typeof APPROVED_TRANSACTION_VEHICLES] : null;
  return (
    <DashboardShell title="Dream Journey">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="grid gap-8 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your member journey</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black">One destination.<br />A clearer path.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">Dream Journey helps you organize the actions that support your transportation goals. It does not estimate vehicle ownership, point values, qualification dates, or financial outcomes.</p></div>
          <div className="bg-[#f7f5f0] p-6"><Compass size={22} className="text-[#a8832d]" /><p className="mt-5 text-sm font-semibold text-black">Your next step</p><p className="mt-2 text-sm leading-relaxed text-gray-500">Complete rental readiness or review your current member activity to keep your transportation plan moving.</p><Link href="/dashboard/rental-setup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Open rental readiness <ArrowRight size={14} /></Link></div>
        </section>
        <section className="border border-[#e5e1d9] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Future Driver</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-black">Plan without promises.</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">Save a neutral transportation goal and revisit it when you are ready. This planning mode does not create DCP, membership benefits, a vehicle reservation, eligibility, an accelerator schedule, or a financial outcome.</p></div>{profile ? <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${profile.mode === "future_driver" ? "bg-[#fbf5e6] text-[#8a6925]" : "bg-gray-100 text-gray-500"}`}>{profile.mode === "future_driver" ? "Planning active" : "Planning paused"}</span> : null}</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-xs font-semibold text-gray-700">Focus<select value={goalArea} onChange={event => setGoalArea(event.target.value as typeof goalArea)} className="mt-2 h-10 w-full border border-gray-300 bg-white px-3 text-xs"><option value="vehicle_discovery">Vehicle discovery</option><option value="rental_readiness">Rental readiness</option><option value="membership_review">Membership review</option><option value="transportation_plan">Transportation plan</option></select></label><label className="text-xs font-semibold text-gray-700">Planning horizon<select value={horizon} onChange={event => setHorizon(event.target.value as typeof horizon)} className="mt-2 h-10 w-full border border-gray-300 bg-white px-3 text-xs"><option value="exploring">Exploring</option><option value="later">Later</option><option value="preparing">Preparing</option></select></label><label className="text-xs font-semibold text-gray-700">Vehicle preference (optional)<select value={desiredVehicleId} onChange={event => setDesiredVehicleId(event.target.value)} className="mt-2 h-10 w-full border border-gray-300 bg-white px-3 text-xs"><option value="">Keep vehicle open</option>{Object.entries(APPROVED_TRANSACTION_VEHICLES).map(([vehicleId, vehicle]) => <option key={vehicleId} value={vehicleId}>{vehicle.vehicleName}</option>)}</select></label></div>
          <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => saveGoal.mutate({ goalArea, horizon, desiredVehicleId: desiredVehicleId || null })} disabled={saveGoal.isPending} className="inline-flex h-10 items-center gap-2 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">Save planning goal <ArrowRight size={14} /></button>{profile?.mode === "future_driver" ? <button type="button" onClick={() => setMode.mutate({ mode: "inactive" })} disabled={setMode.isPending} className="h-10 border border-gray-300 px-4 text-xs font-semibold text-black disabled:opacity-50">Pause planning</button> : profile ? <button type="button" onClick={() => setMode.mutate({ mode: "future_driver" })} disabled={setMode.isPending} className="h-10 border border-gray-300 px-4 text-xs font-semibold text-black disabled:opacity-50">Resume planning</button> : null}{profileVehicle ? <p className="text-xs text-gray-500">Current vehicle preference: <span className="font-semibold text-black">{profileVehicle.vehicleName}</span></p> : null}</div>
          {futureDriver.data?.events.length ? <div className="mt-5 border-t border-gray-100 pt-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500"><History size={13} /> Account-owned planning activity</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{futureDriver.data.events.slice(0, 4).map((event, index) => <p key={`${event.eventType}-${event.createdAt}-${index}`} className="text-[10px] text-gray-500">{event.eventType.replaceAll("_", " ")} · {new Date(event.createdAt).toLocaleDateString()}</p>)}</div></div> : null}
        </section>
        <section>
          <div className="flex items-end justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your roadmap</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Progress through the essentials.</h3></div><Link href="/dashboard/vehicles" className="hidden items-center gap-2 text-sm font-semibold underline underline-offset-4 sm:inline-flex">Browse vehicles <ArrowRight size={14} /></Link></div>
          <div className="mt-7 grid grid-cols-1 border-t border-gray-200 md:grid-cols-2">{checkpoints.map(({ icon: Icon, title, description }, index) => <article key={title} className="border-b border-gray-200 py-6 md:px-7 md:odd:pl-0 md:even:border-l md:even:pl-7"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white"><Icon size={16} /></span><div><p className="text-[11px] font-bold tracking-[0.16em] text-[#a8832d]">STEP {String(index + 1).padStart(2, "0")}</p><h4 className="mt-2 text-base font-bold text-black">{title}</h4><p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p></div></div></article>)}</div>
        </section>
        <section className="border-t border-gray-200 pt-7"><p className="flex gap-2 text-sm leading-relaxed text-gray-500"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#a8832d]" />Eligibility, release, redemption, vehicle availability, membership benefits, and any future transportation options are governed by the applicable program terms and agreements.</p></section>
      </div>
    </DashboardShell>
  );
}
