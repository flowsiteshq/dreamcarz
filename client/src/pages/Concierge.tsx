import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Bookmark, CarFront, Check, Compass, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Intent = "rental" | "purchase" | "membership" | "explore";
type VehicleClass = "sedan" | "suv" | null;
type Timeline = "exploring" | "soon" | "this_week" | null;
type ConversationEntry = { id: string; role: "concierge" | "member"; text: string };
const STORAGE_KEY = "dreamcarz-concierge-selection";

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function welcome(name: string | null | undefined, signedIn: boolean): ConversationEntry {
  return {
    id: "welcome",
    role: "concierge",
    text: signedIn
      ? `Hi ${firstName(name)}. I’m your DreamCarz concierge. What can I help you with today?`
      : "Hi. I’m your DreamCarz concierge. What can I help you with today?",
  };
}

export default function Concierge() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const vehicles = trpc.concierge.confirmedVehicles.useQuery(undefined, { staleTime: 300_000 });
  const overview = trpc.dreamcarzId.overview.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const publicGuide = trpc.concierge.publicGuide.useMutation();
  const savePreference = trpc.concierge.saveJourneyPreference.useMutation();
  const beginTransaction = trpc.transactions.begin.useMutation();
  const [question, setQuestion] = useState("");
  const [intent, setIntent] = useState<Intent>("explore");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ConversationEntry[]>(() => [welcome(null, false)]);
  const savedJourney = overview.data?.conciergeJourney;
  const activeTransaction = overview.data?.transactions.find(item => !["settled", "cancelled", "closed"].includes(item.status));

  const append = (entry: ConversationEntry) => setHistory(previous => [...previous.slice(-19), entry]);
  useEffect(() => {
    setHistory(previous => previous.length === 1 && previous[0]?.id === "welcome" ? [welcome(user?.name, isAuthenticated)] : previous);
  }, [isAuthenticated, user?.name]);
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const data = JSON.parse(stored) as { intent?: Intent; vehicleClass?: VehicleClass; timeline?: Timeline; selectedVehicleId?: string };
      if (data.intent) setIntent(data.intent);
      if (data.vehicleClass === "sedan" || data.vehicleClass === "suv") setVehicleClass(data.vehicleClass);
      if (data.timeline === "exploring" || data.timeline === "soon" || data.timeline === "this_week") setTimeline(data.timeline);
      if (data.selectedVehicleId) setSelectedVehicleId(data.selectedVehicleId);
      append({ id: "restored", role: "concierge", text: "I restored the vehicle path you started. You can adjust it or keep going from here." });
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("intent");
    if (value !== "rental" && value !== "purchase") return;
    setIntent(value);
    append({ id: "route-intent", role: "concierge", text: value === "rental" ? "I can help with a rental. What matters most for the drive—space, passengers, or a sedan?" : "I can help with a purchase path. Are you looking for a sedan or an SUV?" });
  }, []);

  const visibleVehicles = useMemo(() => {
    const classMatches = vehicleClass ? (vehicles.data ?? []).filter(item => item.vehicleClass === vehicleClass) : (vehicles.data ?? []);
    const matched = recommendedIds ? classMatches.filter(item => recommendedIds.includes(item.vehicleId)) : classMatches;
    return matched.slice(0, 3);
  }, [vehicles.data, vehicleClass, recommendedIds]);
  const selectedVehicle = (vehicles.data ?? []).find(item => item.vehicleId === selectedVehicleId) ?? null;
  const showMatches = Boolean(recommendedIds?.length);
  const sending = publicGuide.isPending || savePreference.isPending || beginTransaction.isPending;

  const ask = async (rawQuestion: string) => {
    const value = rawQuestion.trim();
    if (!value || sending) return;
    const memberEntry: ConversationEntry = { id: `${Date.now()}-member`, role: "member", text: value };
    const context = [...history.slice(-5), memberEntry].map(entry => ({ role: entry.role === "member" ? "member" as const : "concierge" as const, text: entry.text.slice(0, 420) }));
    setQuestion("");
    setMessage("");
    append(memberEntry);
    try {
      const response = await publicGuide.mutateAsync({ question: value, conversation: context });
      const nextIntent = response.intent;
      setIntent(nextIntent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      const enoughVehicleContext = response.vehicleClass === "sedan" || response.vehicleClass === "suv" || /\b(suv|sedan|family|passengers?|space|room|recommend|show|options?)\b/i.test(value);
      setRecommendedIds(enoughVehicleContext ? response.recommendedVehicleIds : null);
      append({ id: `${Date.now()}-concierge`, role: "concierge", text: response.answer });
    } catch {
      setMessage("I can help with vehicle paths and general DreamCarz questions. Please do not share contact, license, payment, or government-ID information in this conversation.");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };
  const selectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setTimeline(null);
    const vehicle = (vehicles.data ?? []).find(item => item.vehicleId === id);
    if (vehicle) append({ id: `${Date.now()}-selection`, role: "concierge", text: `${vehicle.vehicleName} is selected for your path. When would you like to drive?` });
  };
  const restore = () => {
    if (!savedJourney) return;
    setIntent(savedJourney.intent);
    setSelectedVehicleId(savedJourney.selectedVehicleId ?? null);
    setTimeline(savedJourney.timeline === "exploring" || savedJourney.timeline === "soon" || savedJourney.timeline === "this_week" ? savedJourney.timeline : null);
    setVehicleClass(savedJourney.preferredVehicleClass === "sedan" || savedJourney.preferredVehicleClass === "suv" ? savedJourney.preferredVehicleClass : null);
    setRecommendedIds(savedJourney.selectedVehicleId ? [savedJourney.selectedVehicleId] : null);
    append({ id: `${Date.now()}-restore`, role: "concierge", text: `I restored your saved ${savedJourney.selectedVehicleName || "vehicle"} path. You can adjust it before continuing.` });
  };
  const resetConversation = () => {
    setHistory([welcome(user?.name, isAuthenticated)]);
    setIntent("explore");
    setVehicleClass(null);
    setRecommendedIds(null);
    setSelectedVehicleId(null);
    setTimeline(null);
    setMessage("");
  };
  const continueJourney = async () => {
    if (intent === "membership") {
      navigate("/pricing");
      return;
    }
    if (!selectedVehicle || !timeline) {
      setMessage("Choose a vehicle and timing before you continue.");
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId }));
      startLogin();
      return;
    }
    try {
      await savePreference.mutateAsync({ intent, preferredVehicleClass: vehicleClass, selectedVehicleId, timeline, confirmSave: true });
      const result = await beginTransaction.mutateAsync({ transactionType: intent === "purchase" ? "purchase" : "rental", vehicleId: selectedVehicle.vehicleId });
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(result.reference)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "DreamCarz could not start this vehicle journey. Please try again.");
    }
  };

  return <div className="min-h-screen max-w-full overflow-x-clip bg-[#050505] text-white"><Navigation /><main aria-label="DreamCarz Concierge" className="w-full max-w-full px-0 pt-[70px]"><section className="mx-auto min-h-[calc(100vh-70px)] w-full max-w-[1080px] bg-[#faf9f6] text-black lg:border-x lg:border-[#e5dfd5]"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ded5] px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-black text-[#d5b35b]"><Sparkles size={16} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">DreamCarz Concierge</p><p className="mt-0.5 text-xs text-gray-500">A continuous vehicle conversation</p></div></div><div className="flex items-center gap-2">{savedJourney ? <button type="button" onClick={restore} className="inline-flex items-center gap-1.5 border border-[#d8c985] px-3 py-2 text-xs font-semibold"><Bookmark size={14} className="text-[#a8832d]" /> Resume path</button> : null}{activeTransaction ? <button type="button" onClick={() => navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(activeTransaction.reference)}`)} className="hidden items-center gap-1.5 border border-black px-3 py-2 text-xs font-semibold sm:inline-flex">Continue journey <ArrowRight size={14} /></button> : null}<button type="button" onClick={resetConversation} aria-label="Start a new DreamCarz Concierge conversation" className="grid h-9 w-9 place-items-center border border-[#ded8cf] text-gray-600"><RotateCcw size={15} /></button></div></header><div className="mx-auto flex min-h-[calc(100vh-164px)] w-full max-w-3xl flex-col px-4 py-7 sm:px-8 sm:py-10"><div className="flex-1 space-y-6">{history.map(entry => <div key={entry.id} className={`flex min-w-0 items-start gap-3 ${entry.role === "member" ? "flex-row-reverse" : ""}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${entry.role === "member" ? "bg-[#e7e4df] text-black" : "bg-black text-[#d5b35b]"}`}>{entry.role === "member" ? <Compass size={16} /> : <Sparkles size={15} />}</span><div className={`max-w-[calc(100%-48px)] break-words border px-4 py-3.5 text-[15px] leading-7 ${entry.role === "member" ? "border-black bg-black text-white" : "border-[#e2dcd3] bg-white text-gray-700"}`}>{entry.text}</div></div>)}{publicGuide.isPending ? <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-black text-[#d5b35b]"><Sparkles size={15} /></span><div className="border border-[#e2dcd3] bg-white px-4 py-3 text-sm text-gray-500">DreamCarz is considering your question…</div></div> : null}{showMatches ? <div className="border-t border-[#e8e1d8] pt-7"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Relevant confirmed vehicles</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{visibleVehicles.map(vehicle => <button type="button" key={vehicle.vehicleId} onClick={() => selectVehicle(vehicle.vehicleId)} className={`overflow-hidden border bg-white text-left transition-transform hover:-translate-y-0.5 ${selectedVehicleId === vehicle.vehicleId ? "border-black ring-1 ring-black" : "border-[#e3ddd3]"}`}><div className="relative h-32 bg-[#f0ede7]"><span className="absolute left-3 top-3 z-10 bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em]">Confirmed</span><img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain" /></div><div className="p-3"><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">{vehicle.vehicleClass}</p><h2 className="mt-1 font-display text-lg font-bold tracking-[-0.04em]">{vehicle.vehicleName}</h2><span className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">{selectedVehicleId === vehicle.vehicleId ? <><Check size={13} className="text-[#a8832d]" /> Selected</> : <><CarFront size={13} className="text-[#a8832d]" /> Choose</>}</span></div></button>)}</div></div> : null}{selectedVehicle ? <div className="border border-[#dcc77d] bg-[#fffaf0] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Your selected path</p><h2 className="mt-2 font-display text-2xl font-bold">When would you like to drive your {selectedVehicle.vehicleName}?</h2><div className="mt-4 flex flex-wrap gap-2">{(["exploring", "soon", "this_week"] as const).map(item => <button type="button" key={item} onClick={() => setTimeline(item)} className={`h-9 border px-3 text-xs font-bold ${timeline === item ? "border-black bg-black text-white" : "border-[#d9cdb8] bg-white"}`}>{item === "exploring" ? "Exploring" : item === "soon" ? "Soon" : "This week"}</button>)}</div><button type="button" onClick={() => void continueJourney()} disabled={sending} className="mt-5 inline-flex h-11 items-center gap-2 bg-black px-5 text-sm font-semibold text-white disabled:opacity-60">{sending ? "Saving…" : isAuthenticated ? "Save & continue" : "Sign in to save"}<ArrowRight size={15} /></button></div> : null}{message ? <p className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{message}</p> : null}</div><form onSubmit={submit} className="mt-8 border border-[#d9d3ca] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"><div className="flex items-center gap-3"><input autoFocus value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} disabled={sending} placeholder="Message DreamCarz…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-gray-400" /><button type="submit" disabled={!question.trim() || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d5b35b] text-black disabled:opacity-50" aria-label="Ask DreamCarz Concierge"><Send size={17} /></button></div><p className="flex items-start gap-2 px-3 pt-2 text-[10px] leading-4 text-gray-500"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#a8832d]" /> This conversation is temporary. DreamCarz saves only vehicle choices you explicitly approve after sign-in.</p></form></div></section></main><Footer /></div>;
}
