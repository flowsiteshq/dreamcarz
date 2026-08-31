import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, Check, ChevronRight, MessageCircleMore, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type Intent = "rental" | "purchase" | "membership" | "explore";
type VehicleClass = "sedan" | "suv" | null;
type Timeline = "exploring" | "soon" | "this_week" | null;
type ConversationEntry = { id: string; role: "concierge" | "member"; text: string };

const STORAGE_KEY = "dreamcarz-concierge-selection";

function intentLabel(intent: Intent) {
  return intent === "rental" ? "renting" : intent === "purchase" ? "buying" : intent === "membership" ? "membership" : "exploring";
}

function inferIntent(question: string): Intent {
  const normalized = question.toLowerCase();
  if (normalized.includes("buy") || normalized.includes("purchase") || normalized.includes("own")) return "purchase";
  if (normalized.includes("member") || normalized.includes("plan")) return "membership";
  return "rental";
}

function inferVehicleClass(question: string): VehicleClass {
  const normalized = question.toLowerCase();
  if (normalized.includes("suv") || normalized.includes("traverse") || normalized.includes("equinox")) return "suv";
  if (normalized.includes("sedan") || normalized.includes("malibu") || normalized.includes("fusion") || normalized.includes("taurus")) return "sedan";
  return null;
}

export function HomeConcierge() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const vehicles = trpc.concierge.confirmedVehicles.useQuery(undefined, { staleTime: 5 * 60_000 });
  const publicGuide = trpc.concierge.publicGuide.useMutation();
  const savePreference = trpc.concierge.saveJourneyPreference.useMutation();
  const beginTransaction = trpc.transactions.begin.useMutation();
  const [question, setQuestion] = useState("");
  const [intent, setIntent] = useState<Intent>("explore");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [recommendedVehicleIds, setRecommendedVehicleIds] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ConversationEntry[]>([
    { id: "welcome", role: "concierge", text: "Tell me what brings you to DreamCarz. I’ll help you find a confirmed vehicle, save the choices you approve, and start the right journey when you’re ready." },
  ]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const value = JSON.parse(saved) as { intent?: Intent; vehicleClass?: VehicleClass; timeline?: Timeline; selectedVehicleId?: string | null };
      if (value.intent) setIntent(value.intent);
      if (value.vehicleClass === "sedan" || value.vehicleClass === "suv") setVehicleClass(value.vehicleClass);
      if (value.timeline === "exploring" || value.timeline === "soon" || value.timeline === "this_week") setTimeline(value.timeline);
      if (typeof value.selectedVehicleId === "string") setSelectedVehicleId(value.selectedVehicleId);
      setHistory(previous => previous.length === 1 ? [...previous, { id: "return", role: "concierge", text: "Welcome back. Your non-sensitive vehicle preferences are still here. Sign in to save them to your DreamCarz ID and continue." }] : previous);
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const visibleVehicles = useMemo(() => {
    const all = vehicles.data ?? [];
    const classFiltered = vehicleClass ? all.filter(vehicle => vehicle.vehicleClass === vehicleClass) : all;
    return recommendedVehicleIds ? classFiltered.filter(vehicle => recommendedVehicleIds.includes(vehicle.vehicleId)) : classFiltered;
  }, [vehicles.data, vehicleClass, recommendedVehicleIds]);
  const selectedVehicle = (vehicles.data ?? []).find(vehicle => vehicle.vehicleId === selectedVehicleId) ?? null;
  const isSaving = savePreference.isPending || beginTransaction.isPending;

  const addGuide = (text: string) => setHistory(previous => [...previous.slice(-4), { id: `guide-${Date.now()}`, role: "concierge", text }]);

  const answerQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;
    setQuestion("");
    setHistory(previous => [...previous.slice(-4), { id: `member-${Date.now()}`, role: "member", text: value }]);
    try {
      const response = await publicGuide.mutateAsync({ question: value });
      setIntent(response.intent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      setRecommendedVehicleIds(response.recommendedVehicleIds);
      setHistory(previous => [...previous.slice(-4), { id: `guide-${Date.now()}`, role: "concierge", text: `${response.answer}\n\n${response.nextPrompt}` }]);
    } catch (error) {
      const nextIntent = inferIntent(value);
      const nextVehicleClass = inferVehicleClass(value);
      setIntent(nextIntent);
      if (nextVehicleClass) setVehicleClass(nextVehicleClass);
      setRecommendedVehicleIds(null);
      const safeMessage = error instanceof Error && error.message.includes("For your privacy") ? error.message : "I can still help you select a confirmed vehicle. Please do not enter contact, payment, license, or identity information in this conversation.";
      setHistory(previous => [...previous.slice(-4), { id: `guide-${Date.now()}`, role: "concierge", text: safeMessage }]);
    }
  };

  const chooseIntent = (nextIntent: Intent) => {
    setIntent(nextIntent);
    setSelectedVehicleId(null);
    setRecommendedVehicleIds(null);
    setMessage("");
    addGuide(nextIntent === "membership" ? "Membership is separate from a vehicle transaction. You can review plans before choosing a confirmed vehicle." : `Great—let’s explore a ${nextIntent === "purchase" ? "purchase" : "rental"} path. Which vehicle type fits you best?`);
  };

  const chooseVehicle = (vehicleId: string) => {
    const vehicle = (vehicles.data ?? []).find(option => option.vehicleId === vehicleId);
    setSelectedVehicleId(vehicleId);
    setMessage("");
    if (vehicle) addGuide(`${vehicle.vehicleName} is confirmed inventory. When you choose a timing preference, you can sign in to save this selection and begin the appropriate protected journey.`);
  };

  const continueJourney = async () => {
    if (intent === "membership") {
      navigate("/pricing");
      return;
    }
    if (!selectedVehicleId || !selectedVehicle) {
      setMessage("Choose one confirmed vehicle before beginning a saved journey.");
      return;
    }
    const selection = JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId });
    if (!isAuthenticated) {
      window.sessionStorage.setItem(STORAGE_KEY, selection);
      startLogin();
      return;
    }
    try {
      setMessage("");
      await savePreference.mutateAsync({ intent, preferredVehicleClass: vehicleClass, selectedVehicleId, timeline, confirmSave: true });
      const transactionType = intent === "purchase" ? "purchase" : "rental";
      const result = await beginTransaction.mutateAsync({ transactionType, vehicleId: selectedVehicleId });
      window.sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "DreamCarz could not start this saved journey. Please try again.");
    }
  };

  return <section aria-label="DreamCarz Concierge" className="mx-auto -mt-5 max-w-6xl pb-7 sm:-mt-7">
    <div className="grid overflow-hidden border border-[#e5ddce] bg-white lg:grid-cols-[0.75fr_1.25fr]">
      <div className="bg-black px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#d3b25d]/60 bg-[#171512]"><Sparkles size={17} className="text-[#d3b25d]" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d3b25d]">DreamCarz Concierge</p><p className="mt-1 text-sm font-semibold">Your guided starting point.</p></div></div>
        <h2 className="mt-8 max-w-sm font-display text-3xl font-bold leading-[0.96] tracking-[-0.05em] sm:text-4xl">A vehicle journey that remembers what you approve.</h2>
        <p className="mt-5 max-w-sm text-sm leading-6 text-gray-300">Start in conversation, see only confirmed inventory, then save your vehicle path to your DreamCarz ID. Identity, payment, and document steps stay protected and happen only in their dedicated flow.</p>
        <div className="mt-7 space-y-3 border-t border-white/15 pt-6 text-xs text-gray-300"><div className="flex gap-3"><ShieldCheck size={16} className="shrink-0 text-[#d3b25d]" /><p>Do not enter payment card details, license numbers, government ID, or biometric information here.</p></div><div className="flex gap-3"><Check size={16} className="shrink-0 text-[#d3b25d]" /><p>Only choices you explicitly save are added to your account.</p></div></div>
      </div>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]"><MessageCircleMore size={14} /> Concierge conversation</div>
        <div className="mt-4 space-y-3">{history.map(entry => <div key={entry.id} className={`flex ${entry.role === "member" ? "justify-end" : "justify-start"}`}><p className={`max-w-[90%] px-4 py-3 text-sm leading-6 ${entry.role === "member" ? "bg-black text-white" : "border border-[#e7e1d8] bg-[#fbfaf7] text-gray-700"}`}>{entry.text}</p></div>)}</div>
        <form onSubmit={event => void answerQuestion(event)} className="mt-5 flex items-center gap-2 border-b border-black pb-2"><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} disabled={publicGuide.isPending} placeholder="I need a vehicle for this weekend…" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-black outline-none placeholder:text-gray-400 disabled:opacity-60" /><button type="submit" disabled={!question.trim() || publicGuide.isPending} aria-label="Ask DreamCarz Concierge" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white transition-transform active:scale-[0.97] disabled:opacity-50"><Send size={15} /></button></form>
        <div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">1. Choose your path</p><div className="mt-3 flex flex-wrap gap-2">{(["rental", "purchase", "membership"] as const).map(option => <button type="button" key={option} onClick={() => chooseIntent(option)} className={`h-9 border px-4 text-xs font-semibold capitalize transition-colors ${intent === option ? "border-black bg-black text-white" : "border-[#dcd5ca] bg-white text-black hover:border-black"}`}>{option === "purchase" ? "Buy" : option === "rental" ? "Rent" : "Membership"}</button>)}</div></div>
        {intent !== "membership" ? <><div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">2. Narrow the selection</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setVehicleClass(null)} className={`h-8 px-3 text-xs font-semibold ${vehicleClass === null ? "bg-[#eee8dc] text-black" : "text-gray-500"}`}>All confirmed</button><button type="button" onClick={() => setVehicleClass("sedan")} className={`h-8 px-3 text-xs font-semibold ${vehicleClass === "sedan" ? "bg-[#eee8dc] text-black" : "text-gray-500"}`}>Sedans</button><button type="button" onClick={() => setVehicleClass("suv")} className={`h-8 px-3 text-xs font-semibold ${vehicleClass === "suv" ? "bg-[#eee8dc] text-black" : "text-gray-500"}`}>SUVs</button></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{visibleVehicles.map(vehicle => <button key={vehicle.vehicleId} type="button" onClick={() => chooseVehicle(vehicle.vehicleId)} className={`group flex min-h-[98px] items-center gap-3 border p-3 text-left transition-colors ${selectedVehicleId === vehicle.vehicleId ? "border-black bg-[#fbfaf7]" : "border-[#e2ddd5] hover:border-black"}`}><img src={vehicle.image} alt="" className="h-16 w-24 shrink-0 object-contain" /><span><span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Confirmed {vehicle.vehicleClass}</span><span className="mt-1 block text-sm font-bold text-black">{vehicle.vehicleName}</span><span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">Choose <ChevronRight size={12} /></span></span></button>)}</div></> : <div className="mt-6 border border-[#e2ddd5] bg-[#fbfaf7] p-4"><p className="text-sm font-semibold text-black">Membership and vehicle access are shown separately.</p><p className="mt-2 text-xs leading-5 text-gray-600">Review membership information first. Vehicle pricing, eligibility, and availability are not set by this conversation.</p><button type="button" onClick={() => void continueJourney()} className="mt-4 inline-flex h-10 items-center gap-2 bg-black px-4 text-xs font-semibold text-white">Explore membership <ArrowRight size={14} /></button></div>}
        {intent !== "membership" && selectedVehicle ? <div className="mt-6 border-t border-[#e5ded3] pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">3. Timing</p><div className="mt-3 flex flex-wrap gap-2">{(["exploring", "soon", "this_week"] as const).map(option => <button key={option} type="button" onClick={() => setTimeline(option)} className={`h-8 border px-3 text-xs font-semibold transition-colors ${timeline === option ? "border-black bg-black text-white" : "border-[#dcd5ca] text-black hover:border-black"}`}>{option === "exploring" ? "Exploring" : option === "soon" ? "Soon" : "This week"}</button>)}</div><button type="button" onClick={() => void continueJourney()} disabled={isSaving} className="mt-5 inline-flex h-11 items-center gap-2 bg-black px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving your path…" : isAuthenticated ? `Save & begin ${intent === "purchase" ? "purchase" : "rental"} journey` : "Sign in to save & begin"}<ArrowRight size={15} /></button><p className="mt-3 text-[11px] leading-5 text-gray-500">{isAuthenticated ? "This saves only your approved vehicle-path preferences. The next page collects any required profile information in the secure transaction flow." : "You can explore without an account. Sign in only when you choose to save your path and begin onboarding."}</p></div> : null}
        {message ? <p className="mt-4 text-xs leading-5 text-red-700" role="status">{message}</p> : null}
      </div>
    </div>
  </section>;
}
