import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleCheckBig, Gauge, MessageCircleMore, Route, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Intent = "rental" | "purchase" | "membership" | "explore";
type VehicleClass = "sedan" | "suv" | null;
type Timeline = "exploring" | "soon" | "this_week" | null;
type ConversationEntry = { id: string; role: "concierge" | "member"; text: string };

const STORAGE_KEY = "dreamcarz-concierge-selection";
const quickPrompts = ["I need an SUV", "Show me sedans", "I want to buy"];

function firstName(name: string | null | undefined) { return name?.trim().split(/\s+/)[0] || "there"; }

export default function Concierge() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const vehicles = trpc.concierge.confirmedVehicles.useQuery(undefined, { staleTime: 5 * 60_000 });
  const accountOverview = trpc.dreamcarzId.overview.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
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
  const [history, setHistory] = useState<ConversationEntry[]>([]);

  useEffect(() => {
    const welcome = isAuthenticated
      ? `Welcome back, ${firstName(user?.name)}. I can help you continue your saved vehicle path or discover a new one.`
      : "Welcome to DreamCarz. Tell me what you need and I’ll shape a simple vehicle path around it.";
    setHistory(previous => previous.length ? previous : [{ id: "welcome", role: "concierge", text: welcome }]);
  }, [isAuthenticated, user?.name]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const value = JSON.parse(saved) as { intent?: Intent; vehicleClass?: VehicleClass; timeline?: Timeline; selectedVehicleId?: string | null };
      if (value.intent) setIntent(value.intent);
      if (value.vehicleClass === "sedan" || value.vehicleClass === "suv") setVehicleClass(value.vehicleClass);
      if (value.timeline === "exploring" || value.timeline === "soon" || value.timeline === "this_week") setTimeline(value.timeline);
      if (typeof value.selectedVehicleId === "string") setSelectedVehicleId(value.selectedVehicleId);
    } catch { window.sessionStorage.removeItem(STORAGE_KEY); }
  }, []);

  const visibleVehicles = useMemo(() => {
    const classFiltered = vehicleClass ? (vehicles.data ?? []).filter(vehicle => vehicle.vehicleClass === vehicleClass) : vehicles.data ?? [];
    return recommendedVehicleIds ? classFiltered.filter(vehicle => recommendedVehicleIds.includes(vehicle.vehicleId)) : classFiltered;
  }, [vehicles.data, vehicleClass, recommendedVehicleIds]);
  const selectedVehicle = (vehicles.data ?? []).find(vehicle => vehicle.vehicleId === selectedVehicleId) ?? null;
  const savedJourney = accountOverview.data?.conciergeJourney;
  const activeTransaction = accountOverview.data?.transactions.find(transaction => !["settled", "cancelled", "closed"].includes(transaction.status));
  const isSaving = savePreference.isPending || beginTransaction.isPending;
  const steps = [{ label: "Path", complete: intent !== "explore" }, { label: "Vehicle", complete: Boolean(selectedVehicle) }, { label: "Timing", complete: Boolean(timeline) }, { label: "Journey", complete: false }];
  const activeStep = Math.max(1, steps.findIndex(step => !step.complete) + 1);
  const nextGuidance = intent === "explore" ? "Tell me your goal or choose rent, buy, or membership." : !selectedVehicle ? "Choose a visual vehicle card. I will keep the next decision simple." : !timeline ? "Your vehicle is selected. Choose your timing preference." : "Your path is ready to save and move into a protected vehicle journey.";
  const addGuide = (text: string) => setHistory(previous => [...previous.slice(-5), { id: `guide-${Date.now()}`, role: "concierge", text }]);

  const chooseIntent = (nextIntent: Intent) => {
    setIntent(nextIntent); setSelectedVehicleId(null); setTimeline(null); setRecommendedVehicleIds(null); setMessage("");
    addGuide(nextIntent === "membership" ? "Membership is kept separate from vehicle pricing and approval. Explore the program first, then return when you are ready to select a vehicle." : `Let’s explore a ${nextIntent === "purchase" ? "purchase" : "rental"} path. Do you prefer a sedan or SUV?`);
  };
  const chooseVehicle = (vehicleId: string) => {
    const vehicle = (vehicles.data ?? []).find(item => item.vehicleId === vehicleId);
    setSelectedVehicleId(vehicleId); setTimeline(null); setMessage("");
    if (vehicle) addGuide(`${vehicle.vehicleName} is confirmed DreamCarz inventory. Choose your timing when you are ready.`);
  };
  const restoreSavedJourney = () => {
    if (!savedJourney) return;
    setIntent(savedJourney.intent);
    setVehicleClass(savedJourney.preferredVehicleClass === "sedan" || savedJourney.preferredVehicleClass === "suv" ? savedJourney.preferredVehicleClass : null);
    setSelectedVehicleId(savedJourney.selectedVehicleId ?? null);
    setTimeline(savedJourney.timeline === "exploring" || savedJourney.timeline === "soon" || savedJourney.timeline === "this_week" ? savedJourney.timeline : null);
    setRecommendedVehicleIds(savedJourney.selectedVehicleId ? [savedJourney.selectedVehicleId] : null);
    addGuide(`I restored your ${savedJourney.selectedVehicleName || "saved"} path. You can change any choice before you continue.`);
  };
  const askConcierge = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setQuestion(""); setMessage("");
    setHistory(previous => [...previous.slice(-5), { id: `member-${Date.now()}`, role: "member", text: value }]);
    try {
      const response = await publicGuide.mutateAsync({ question: value });
      setIntent(response.intent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      setRecommendedVehicleIds(response.recommendedVehicleIds);
      addGuide(`${response.answer}\n\n${response.nextPrompt}`);
    } catch (error) { setMessage(error instanceof Error && error.message.includes("privacy") ? error.message : "I can guide vehicle discovery, but please do not share contact, payment, license, government ID, or biometric information here."); }
  };
  const submitQuestion = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void askConcierge(question); };
  const continueJourney = async () => {
    if (intent === "membership") { navigate("/pricing"); return; }
    if (!selectedVehicleId || !selectedVehicle) { setMessage("Choose one confirmed vehicle before starting a saved journey."); return; }
    if (!timeline) { setMessage("Choose when you are looking to drive before you continue."); return; }
    const selection = JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId });
    if (!isAuthenticated) { window.sessionStorage.setItem(STORAGE_KEY, selection); startLogin(); return; }
    try {
      await savePreference.mutateAsync({ intent, preferredVehicleClass: vehicleClass, selectedVehicleId, timeline, confirmSave: true });
      const result = await beginTransaction.mutateAsync({ transactionType: intent === "purchase" ? "purchase" : "rental", vehicleId: selectedVehicleId });
      window.sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "DreamCarz could not start this saved journey. Please try again."); }
  };

  return <div className="min-h-screen bg-[#f8f7f4] text-black"><Navigation /><main className="pt-[68px]">
    <section className="border-b border-[#e8e2d8] bg-black px-5 py-12 text-white sm:px-8 lg:px-10 lg:py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#d5b35b]">DreamCarz Concierge</p><h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.9] tracking-[-0.055em] sm:text-6xl">{isAuthenticated ? `Welcome back, ${firstName(user?.name)}.` : "A more personal way to find your vehicle."}</h1><p className="mt-5 max-w-lg text-sm leading-7 text-gray-300">A guided cockpit that turns one natural question into a clear vehicle path. Your information stays in your control, and protected steps happen only when you decide to continue.</p></div><div className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5b35b]">Adaptive guidance</p><p className="mt-2 text-sm leading-6 text-gray-300">Conversation refines your view without replacing your judgement.</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5b35b]">Your saved path</p><p className="mt-2 text-sm leading-6 text-gray-300">Only selections you approve are saved to your DreamCarz ID.</p></div></div>{activeTransaction ? <button type="button" onClick={() => navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(activeTransaction.reference)}`)} className="mt-6 inline-flex h-11 items-center gap-2 border border-[#d5b35b] px-5 text-sm font-semibold text-white">Continue {activeTransaction.vehicleName} <ArrowRight size={15} /></button> : null}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10"><div className="grid overflow-hidden border border-[#e7e1d8] bg-white sm:grid-cols-4">{steps.map((step, index) => <div key={step.label} className={`flex items-center gap-3 border-b border-[#e7e1d8] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${index + 1 === activeStep ? "bg-[#fffaf0]" : ""}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${step.complete ? "bg-black text-white" : index + 1 === activeStep ? "bg-[#d5b35b] text-black" : "bg-[#ece8e1] text-gray-500"}`}>{step.complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{step.complete ? "Selected" : index + 1 === activeStep ? "Next" : "Up next"}</p><p className="text-xs font-bold text-black">{step.label}</p></div></div>)}</div></section>
    <section className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 lg:grid-cols-[0.74fr_1.26fr] lg:px-10 lg:py-14"><aside className="h-fit bg-white p-6 ring-1 ring-[#e7e1d8] lg:sticky lg:top-24"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]"><MessageCircleMore size={14} /> Live concierge</div><div className="mt-4 border-l-2 border-[#d5b35b] bg-[#fbfaf7] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Next best step</p><p className="mt-1 text-sm font-semibold leading-6 text-black">{nextGuidance}</p></div><div className="mt-5 space-y-3">{history.map(entry => <div key={entry.id} className={`flex ${entry.role === "member" ? "justify-end" : "justify-start"}`}><p className={`max-w-[92%] whitespace-pre-line px-4 py-3 text-sm leading-6 ${entry.role === "member" ? "bg-black text-white" : "bg-[#f8f6f1] text-gray-700"}`}>{entry.text}</p></div>)}</div><form onSubmit={submitQuestion} className="mt-6 flex items-center gap-2 border-b border-black pb-2"><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} disabled={publicGuide.isPending} placeholder="I need an SUV for my family…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-gray-400" /><button type="submit" disabled={!question.trim() || publicGuide.isPending} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white disabled:opacity-50" aria-label="Ask DreamCarz Concierge"><Send size={15} /></button></form><div className="mt-5 flex flex-wrap gap-2">{quickPrompts.map(prompt => <button key={prompt} type="button" onClick={() => void askConcierge(prompt)} className="border border-[#ded6ca] px-3 py-2 text-[11px] font-semibold text-gray-700">{prompt}</button>)}</div><div className="mt-6 border-t border-[#e9e3d9] pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Choose your path</p><div className="mt-3 flex flex-wrap gap-2">{(["rental", "purchase", "membership"] as const).map(option => <button type="button" key={option} onClick={() => chooseIntent(option)} className={`h-9 border px-3 text-xs font-bold ${intent === option ? "border-black bg-black text-white" : "border-[#ddd5c9] bg-white text-black"}`}>{option === "rental" ? "Rent" : option === "purchase" ? "Buy" : "Membership"}</button>)}</div></div><div className="mt-6 flex gap-3 text-xs leading-5 text-gray-600"><ShieldCheck size={17} className="shrink-0 text-[#a8832d]" /><p>Contact, identity, payment, and document information begin only in their protected next step.</p></div></aside>
      <div>{intent === "membership" ? <div className="border border-[#e7e1d8] bg-white p-8"><Sparkles className="text-[#a8832d]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Membership path</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em]">Explore membership first.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-gray-600">Membership details are separate from vehicle prices, eligibility, and availability. Review the program first, then return to choose a confirmed vehicle.</p><button type="button" onClick={() => navigate("/pricing")} className="mt-7 inline-flex h-11 items-center gap-2 bg-black px-5 text-sm font-semibold text-white">Explore membership <ArrowRight size={15} /></button></div> : <><div className="flex flex-col justify-between gap-4 border-b border-[#e6e0d7] pb-6 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Visual vehicle match</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Choose the vehicle that fits.</h2></div><div className="flex gap-2"><button type="button" onClick={() => { setVehicleClass(null); setRecommendedVehicleIds(null); }} className={`h-9 px-3 text-xs font-bold ${vehicleClass === null ? "bg-[#ece5d8]" : "text-gray-500"}`}>All</button><button type="button" onClick={() => setVehicleClass("sedan")} className={`h-9 px-3 text-xs font-bold ${vehicleClass === "sedan" ? "bg-[#ece5d8]" : "text-gray-500"}`}>Sedans</button><button type="button" onClick={() => setVehicleClass("suv")} className={`h-9 px-3 text-xs font-bold ${vehicleClass === "suv" ? "bg-[#ece5d8]" : "text-gray-500"}`}>SUVs</button></div></div>{savedJourney && !selectedVehicle ? <button type="button" onClick={restoreSavedJourney} className="mt-6 flex w-full items-center justify-between border border-[#d8c18a] bg-[#fffaf0] p-4 text-left"><span><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Saved DreamCarz ID path</span><span className="mt-1 block text-sm font-bold text-black">Resume {savedJourney.selectedVehicleName || "your vehicle selection"}</span></span><Route size={19} className="text-[#a8832d]" /></button> : null}<div className="mt-6 grid gap-5 sm:grid-cols-2">{visibleVehicles.map(vehicle => <button type="button" key={vehicle.vehicleId} onClick={() => chooseVehicle(vehicle.vehicleId)} className={`group overflow-hidden border bg-white text-left transition-all ${selectedVehicleId === vehicle.vehicleId ? "border-black ring-1 ring-black" : "border-[#e3ddd3] hover:-translate-y-0.5 hover:border-black"}`}><div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#f1eee8] sm:h-64"><span className="absolute left-4 top-4 z-10 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black">Confirmed</span>{selectedVehicleId === vehicle.vehicleId ? <span className="absolute right-4 top-4 z-10 grid h-7 w-7 place-items-center rounded-full bg-black text-white"><CircleCheckBig size={15} /></span> : null}<img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#a8832d]">{vehicle.vehicleClass}</p><h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-black">{vehicle.vehicleName}</h3></div><ChevronRight size={18} className="mt-2 text-black" /></div><div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-gray-500"><Gauge size={13} className="text-[#a8832d]" /> Select to add to your path</div></div></button>)}</div>{selectedVehicle ? <div className="mt-7 border border-[#dfd5c2] bg-[#fffdf8] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your selected vehicle</p><div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h3 className="font-display text-3xl font-bold tracking-[-0.04em]">{selectedVehicle.vehicleName}</h3><p className="mt-2 flex items-center gap-2 text-sm text-gray-600"><CalendarDays size={16} className="text-[#a8832d]" /> When are you looking to drive?</p><div className="mt-4 flex flex-wrap gap-2">{(["exploring", "soon", "this_week"] as const).map(option => <button type="button" key={option} onClick={() => setTimeline(option)} className={`h-9 border px-4 text-xs font-bold ${timeline === option ? "border-black bg-black text-white" : "border-[#d7cdbc] bg-white text-black"}`}>{option === "exploring" ? "Exploring" : option === "soon" ? "Soon" : "This week"}</button>)}</div></div><button type="button" onClick={() => void continueJourney()} disabled={isSaving} className="inline-flex h-11 shrink-0 items-center gap-2 bg-black px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving…" : isAuthenticated ? `Save & begin ${intent === "purchase" ? "purchase" : "rental"}` : "Sign in to save"}<ArrowRight size={15} /></button></div></div> : null}</>}</div>
    </section>{message ? <p className="mx-auto max-w-7xl px-5 pb-8 text-sm text-red-700 sm:px-8 lg:px-10" role="status">{message}</p> : null}
  </main><Footer /></div>;
}
