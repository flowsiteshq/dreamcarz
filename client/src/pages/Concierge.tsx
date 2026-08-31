import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CarFront, Check, ChevronRight, Clock3, MessageCircleMore, Route, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Intent = "rental" | "purchase" | "membership" | "explore";
type VehicleClass = "sedan" | "suv" | null;
type Timeline = "exploring" | "soon" | "this_week" | null;
type ConversationEntry = { id: string; role: "concierge" | "member"; text: string };

const STORAGE_KEY = "dreamcarz-concierge-selection";
const prompts = ["I need an SUV", "Show me sedans", "I want to buy"];

function firstName(name: string | null | undefined) { return name?.trim().split(/\s+/)[0] || "there"; }

export default function Concierge() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const vehicles = trpc.concierge.confirmedVehicles.useQuery(undefined, { staleTime: 5 * 60_000 });
  const overview = trpc.dreamcarzId.overview.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const publicGuide = trpc.concierge.publicGuide.useMutation();
  const savePreference = trpc.concierge.saveJourneyPreference.useMutation();
  const beginTransaction = trpc.transactions.begin.useMutation();
  const [question, setQuestion] = useState("");
  const [intent, setIntent] = useState<Intent>("explore");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [recommendedVehicleIds, setRecommendedVehicleIds] = useState<string[] | null>(null);
  const [showMoreVehicles, setShowMoreVehicles] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ConversationEntry[]>([]);

  useEffect(() => {
    const welcome = isAuthenticated
      ? `Welcome back, ${firstName(user?.name)}. What would feel right for your next vehicle?`
      : "Welcome to DreamCarz. Tell me what you need and I’ll guide you one decision at a time.";
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

  useEffect(() => {
    const deepLinkIntent = new URLSearchParams(window.location.search).get("intent");
    if (deepLinkIntent !== "rental" && deepLinkIntent !== "purchase") return;
    setIntent(deepLinkIntent);
    setHistory(previous => previous.some(entry => entry.id === "intent-entry") ? previous : [...previous, { id: "intent-entry", role: "concierge", text: deepLinkIntent === "rental" ? "Let’s build a rental path. I’ll start with a small group of confirmed vehicles—choose what feels closest." : "Let’s build a purchase path. I’ll start with a small group of confirmed vehicles—choose what interests you." }]);
  }, []);

  const allVisibleVehicles = useMemo(() => {
    const classFiltered = vehicleClass ? (vehicles.data ?? []).filter(vehicle => vehicle.vehicleClass === vehicleClass) : vehicles.data ?? [];
    return recommendedVehicleIds ? classFiltered.filter(vehicle => recommendedVehicleIds.includes(vehicle.vehicleId)) : classFiltered;
  }, [vehicles.data, vehicleClass, recommendedVehicleIds]);
  const displayedVehicles = showMoreVehicles ? allVisibleVehicles : allVisibleVehicles.slice(0, 3);
  const selectedVehicle = (vehicles.data ?? []).find(vehicle => vehicle.vehicleId === selectedVehicleId) ?? null;
  const savedJourney = overview.data?.conciergeJourney;
  const activeTransaction = overview.data?.transactions.find(transaction => !["settled", "cancelled", "closed"].includes(transaction.status));
  const readyForVehicle = intent === "rental" || intent === "purchase";
  const isSaving = savePreference.isPending || beginTransaction.isPending;
  const steps = [{ label: "Conversation", complete: intent !== "explore" }, { label: "Vehicle match", complete: Boolean(selectedVehicle) }, { label: "Timing", complete: Boolean(timeline) }, { label: "Secure journey", complete: false }];
  const activeStep = Math.max(1, steps.findIndex(step => !step.complete) + 1);
  const addGuide = (text: string) => setHistory(previous => [...previous.slice(-5), { id: `guide-${Date.now()}`, role: "concierge", text }]);

  const setPath = (nextIntent: Intent) => {
    setIntent(nextIntent); setVehicleClass(null); setSelectedVehicleId(null); setTimeline(null); setRecommendedVehicleIds(null); setShowMoreVehicles(false); setMessage("");
    addGuide(nextIntent === "membership" ? "Membership is separate from vehicle selection, pricing, and approval. You can explore that path first." : `Great. I’ll show only a small starting set of confirmed ${nextIntent === "purchase" ? "purchase" : "rental"} choices. You can narrow it further with one question.`);
  };
  const askConcierge = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setQuestion(""); setMessage(""); setShowMoreVehicles(false);
    setHistory(previous => [...previous.slice(-5), { id: `member-${Date.now()}`, role: "member", text: value }]);
    try {
      const response = await publicGuide.mutateAsync({ question: value });
      setIntent(response.intent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      setRecommendedVehicleIds(response.recommendedVehicleIds);
      addGuide(`${response.answer}\n\n${response.nextPrompt}`);
    } catch (error) { setMessage(error instanceof Error && error.message.includes("privacy") ? error.message : "I can help with vehicle discovery. Please do not share contact, payment, license, government ID, or biometric information in this conversation."); }
  };
  const submitQuestion = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void askConcierge(question); };
  const selectVehicle = (vehicleId: string) => {
    const vehicle = (vehicles.data ?? []).find(item => item.vehicleId === vehicleId);
    setSelectedVehicleId(vehicleId); setTimeline(null); setMessage("");
    if (vehicle) addGuide(`${vehicle.vehicleName} is now your vehicle match. When would you like to drive?`);
  };
  const restoreSavedJourney = () => {
    if (!savedJourney) return;
    setIntent(savedJourney.intent);
    setVehicleClass(savedJourney.preferredVehicleClass === "sedan" || savedJourney.preferredVehicleClass === "suv" ? savedJourney.preferredVehicleClass : null);
    setSelectedVehicleId(savedJourney.selectedVehicleId ?? null);
    setTimeline(savedJourney.timeline === "exploring" || savedJourney.timeline === "soon" || savedJourney.timeline === "this_week" ? savedJourney.timeline : null);
    setRecommendedVehicleIds(savedJourney.selectedVehicleId ? [savedJourney.selectedVehicleId] : null);
    setShowMoreVehicles(false);
    addGuide(`I restored your ${savedJourney.selectedVehicleName || "saved"} vehicle path. You can adjust any choice before you continue.`);
  };
  const continueJourney = async () => {
    if (intent === "membership") { navigate("/pricing"); return; }
    if (!selectedVehicle || !timeline) { setMessage("Choose your vehicle and timing before you continue."); return; }
    const selection = JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId });
    if (!isAuthenticated) { window.sessionStorage.setItem(STORAGE_KEY, selection); startLogin(); return; }
    try {
      await savePreference.mutateAsync({ intent, preferredVehicleClass: vehicleClass, selectedVehicleId, timeline, confirmSave: true });
      const result = await beginTransaction.mutateAsync({ transactionType: intent === "purchase" ? "purchase" : "rental", vehicleId: selectedVehicle.vehicleId });
      window.sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "DreamCarz could not start this vehicle journey. Please try again."); }
  };

  return <div className="min-h-screen bg-[#f8f7f4] text-black"><Navigation /><main className="pt-[68px]">
    <section className="border-b border-[#24201b] bg-black px-5 py-12 text-white sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#d5b35b]">DreamCarz Concierge</p><div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.9] tracking-[-0.055em] sm:text-6xl">{isAuthenticated ? `Welcome back, ${firstName(user?.name)}.` : "Your vehicle journey starts with one conversation."}</h1><p className="mt-5 max-w-xl text-sm leading-7 text-gray-300">One thought at a time. A small set of visual matches only when you are ready. Your sensitive steps remain protected and separate.</p></div>{activeTransaction ? <button type="button" onClick={() => navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(activeTransaction.reference)}`)} className="inline-flex h-11 shrink-0 items-center gap-2 border border-[#d5b35b] px-5 text-sm font-semibold text-white">Continue your journey <ArrowRight size={15} /></button> : null}</div></div></section>
    <section className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 lg:px-10"><div className="grid overflow-hidden border border-[#e7e1d8] bg-white sm:grid-cols-4">{steps.map((step, index) => <div key={step.label} className={`flex items-center gap-3 border-b border-[#e7e1d8] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${index + 1 === activeStep ? "bg-[#fffaf0]" : ""}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${step.complete ? "bg-black text-white" : index + 1 === activeStep ? "bg-[#d5b35b] text-black" : "bg-[#ece8e1] text-gray-500"}`}>{step.complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{step.complete ? "Set" : index + 1 === activeStep ? "Now" : "Later"}</p><p className="text-xs font-bold text-black">{step.label}</p></div></div>)}</div></section>
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12"><div className="border border-[#e4ddd2] bg-white"><div className="border-b border-[#e8e2d8] px-5 py-5 sm:px-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]"><MessageCircleMore size={14} /> Conversation</div><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.045em] sm:text-4xl">What are you looking for?</h2><p className="mt-2 text-sm leading-6 text-gray-600">The concierge uses the conversation to narrow your view. It does not save chat or request protected information here.</p></div><div className="px-5 py-6 sm:px-8"><div className="mx-auto max-w-3xl space-y-4">{history.map(entry => <div key={entry.id} className={`flex ${entry.role === "member" ? "justify-end" : "justify-start"}`}><p className={`max-w-[88%] whitespace-pre-line px-4 py-3 text-sm leading-6 ${entry.role === "member" ? "bg-black text-white" : "border-l-2 border-[#d5b35b] bg-[#faf8f4] text-gray-700"}`}>{entry.text}</p></div>)}</div><form onSubmit={submitQuestion} className="mx-auto mt-7 flex max-w-3xl items-center gap-3 border border-black bg-white px-4"><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} disabled={publicGuide.isPending} placeholder="For example: I need something spacious for my family" className="min-w-0 flex-1 py-4 text-sm outline-none placeholder:text-gray-400" /><button type="submit" disabled={!question.trim() || publicGuide.isPending} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white disabled:opacity-50" aria-label="Ask DreamCarz Concierge"><Send size={15} /></button></form><div className="mx-auto mt-4 flex max-w-3xl flex-wrap gap-2">{prompts.map(prompt => <button key={prompt} type="button" onClick={() => void askConcierge(prompt)} className="border border-[#ded6ca] px-3 py-2 text-[11px] font-semibold text-gray-700">{prompt}</button>)}</div><div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center gap-2 border-t border-[#ebe4d8] pt-6"><span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Or choose your path</span>{(["rental", "purchase", "membership"] as const).map(option => <button type="button" key={option} onClick={() => setPath(option)} className={`h-9 border px-4 text-xs font-bold ${intent === option ? "border-black bg-black text-white" : "border-[#ded6ca] bg-white text-black"}`}>{option === "rental" ? "Rent" : option === "purchase" ? "Buy" : "Membership"}</button>)}</div></div></div>
      {intent === "membership" ? <div className="mt-6 border border-[#e4ddd2] bg-[#fffdf8] p-7 sm:p-8"><Sparkles className="text-[#a8832d]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Membership path</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em]">Explore membership first.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">Membership information is separate from vehicle pricing, availability, and approval. Review the program first, then return when you are ready to select a confirmed vehicle.</p><button type="button" onClick={() => navigate("/pricing")} className="mt-6 inline-flex h-11 items-center gap-2 bg-black px-5 text-sm font-semibold text-white">Explore membership <ArrowRight size={15} /></button></div> : null}
      {readyForVehicle ? <div className="mt-8"><div className="flex flex-col justify-between gap-4 border-b border-[#e6e0d7] pb-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Your starting matches</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">A few choices, not the whole fleet.</h2></div><div className="flex gap-2"><button type="button" onClick={() => { setVehicleClass(null); setRecommendedVehicleIds(null); setShowMoreVehicles(false); }} className={`h-9 px-3 text-xs font-bold ${vehicleClass === null ? "bg-[#ece5d8]" : "text-gray-500"}`}>All</button><button type="button" onClick={() => { setVehicleClass("sedan"); setShowMoreVehicles(false); }} className={`h-9 px-3 text-xs font-bold ${vehicleClass === "sedan" ? "bg-[#ece5d8]" : "text-gray-500"}`}>Sedans</button><button type="button" onClick={() => { setVehicleClass("suv"); setShowMoreVehicles(false); }} className={`h-9 px-3 text-xs font-bold ${vehicleClass === "suv" ? "bg-[#ece5d8]" : "text-gray-500"}`}>SUVs</button></div></div>{savedJourney && !selectedVehicle ? <button type="button" onClick={restoreSavedJourney} className="mt-5 flex w-full items-center justify-between border border-[#d8c18a] bg-[#fffaf0] p-4 text-left"><span><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Saved DreamCarz ID path</span><span className="mt-1 block text-sm font-bold text-black">Resume {savedJourney.selectedVehicleName || "your vehicle selection"}</span></span><Route size={19} className="text-[#a8832d]" /></button> : null}<div className="mt-6 grid gap-5 md:grid-cols-3">{displayedVehicles.map(vehicle => <button type="button" key={vehicle.vehicleId} onClick={() => selectVehicle(vehicle.vehicleId)} className={`group overflow-hidden border bg-white text-left transition-all ${selectedVehicleId === vehicle.vehicleId ? "border-black ring-1 ring-black" : "border-[#e3ddd3] hover:-translate-y-0.5 hover:border-black"}`}><div className="relative flex h-52 items-center justify-center overflow-hidden bg-[#f1eee8]"><span className="absolute left-4 top-4 z-10 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black">Confirmed</span>{selectedVehicleId === vehicle.vehicleId ? <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-black text-white"><Check size={15} /></span> : null}<img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /></div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#a8832d]">{vehicle.vehicleClass}</p><div className="mt-2 flex items-start justify-between gap-3"><h3 className="font-display text-2xl font-bold tracking-[-0.04em] text-black">{vehicle.vehicleName}</h3><ChevronRight size={17} className="mt-1 shrink-0" /></div><p className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-gray-500"><CarFront size={13} className="text-[#a8832d]" /> Choose this vehicle</p></div></button>)}</div>{allVisibleVehicles.length > 3 && !showMoreVehicles ? <button type="button" onClick={() => setShowMoreVehicles(true)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-black underline decoration-[#d5b35b] decoration-2 underline-offset-4">Show {allVisibleVehicles.length - 3} more confirmed options <ChevronRight size={15} /></button> : null}</div> : null}
      {selectedVehicle ? <div className="mt-8 border border-[#d9cba8] bg-[#fffdf8] p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Your vehicle match</p><div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><h3 className="font-display text-3xl font-bold tracking-[-0.045em]">{selectedVehicle.vehicleName}</h3><p className="mt-3 flex items-center gap-2 text-sm text-gray-600"><Clock3 size={16} className="text-[#a8832d]" /> When are you looking to drive?</p><div className="mt-4 flex flex-wrap gap-2">{(["exploring", "soon", "this_week"] as const).map(option => <button type="button" key={option} onClick={() => setTimeline(option)} className={`h-9 border px-4 text-xs font-bold ${timeline === option ? "border-black bg-black text-white" : "border-[#d7cdbc] bg-white text-black"}`}>{option === "exploring" ? "Exploring" : option === "soon" ? "Soon" : "This week"}</button>)}</div></div><button type="button" onClick={() => void continueJourney()} disabled={isSaving} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-black px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving…" : isAuthenticated ? `Save & begin ${intent === "purchase" ? "purchase" : "rental"}` : "Sign in to save"}<ArrowRight size={15} /></button></div></div> : null}
      <div className="mt-8 flex gap-3 border-t border-[#e7e1d8] pt-6 text-xs leading-5 text-gray-600"><ShieldCheck size={17} className="shrink-0 text-[#a8832d]" /><p>Conversation is temporary. DreamCarz saves only vehicle choices you explicitly approve after signing in. Contact details, identity, payment, documents, and biometric checks remain in protected transaction steps.</p></div>{message ? <p className="mt-5 text-sm text-red-700" role="status">{message}</p> : null}</section>
  </main><Footer /></div>;
}
