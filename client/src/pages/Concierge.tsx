import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";
import { ArrowRight, Bookmark, CarFront, Check, Compass, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type Intent = "rental" | "purchase" | "membership" | "explore";
type VehicleClass = "sedan" | "suv" | null;
type Timeline = "exploring" | "soon" | "this_week" | null;
type Entry = { id: string; role: "concierge" | "member"; text: string };
const STORAGE_KEY = "dreamcarz-concierge-selection";
const VEHICLE_CLASS_IMAGES = {
  sedan: APPROVED_TRANSACTION_VEHICLES["2024-chevrolet-malibu-gray"].image,
  suv: APPROVED_TRANSACTION_VEHICLES["2022-chevrolet-traverse-white"].image,
} as const;

const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "there";
const getRouteIntent = (): Intent => {
  const routeIntent = new URLSearchParams(window.location.search).get("intent");
  return routeIntent === "rental" || routeIntent === "purchase" ? routeIntent : "explore";
};
const welcome = (name: string | null | undefined, signedIn: boolean, intent: Intent): Entry => ({
  id: "welcome",
  role: "concierge",
  text: intent === "rental"
    ? signedIn ? `Hi ${firstName(name)}. What type of vehicle are you looking to rent?` : "What type of vehicle are you looking to rent?"
    : intent === "purchase"
      ? signedIn ? `Hi ${firstName(name)}. What type of vehicle are you looking to buy?` : "What type of vehicle are you looking to buy?"
      : signedIn ? `Hi ${firstName(name)}. How can I help?` : "Hi. How can I help?",
});

export function shouldShowVehicleClassChoice(input: {
  intent: Intent;
  vehicleClass: VehicleClass;
  hasSelectedVehicle: boolean;
  latestConciergeMessage: string;
}) {
  return !input.vehicleClass
    && !input.hasSelectedVehicle
    && (input.intent === "rental" || input.intent === "purchase")
    && /\b(?:vehicle|sedan|suv)\b/i.test(input.latestConciergeMessage)
    && /\b(?:type|sedan|suv)\b/i.test(input.latestConciergeMessage);
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
  const [intent, setIntent] = useState<Intent>(getRouteIntent);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null);
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<Entry[]>(() => {
    const routeIntent = getRouteIntent();
    return [welcome(null, false, routeIntent)];
  });
  const savedJourney = overview.data?.conciergeJourney;
  const activeTransaction = overview.data?.transactions.find(item => !["settled", "cancelled", "closed"].includes(item.status));
  const append = (entry: Entry) => setHistory(previous => [...previous.slice(-19), entry]);

  useEffect(() => {
    setHistory(previous => previous.length === 1 && previous[0]?.id === "welcome" ? [welcome(user?.name, isAuthenticated, intent)] : previous);
  }, [intent, isAuthenticated, user?.name]);
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const saved = JSON.parse(stored) as { intent?: Intent; vehicleClass?: VehicleClass; timeline?: Timeline; selectedVehicleId?: string };
      if (saved.intent) setIntent(saved.intent);
      if (saved.vehicleClass === "sedan" || saved.vehicleClass === "suv") setVehicleClass(saved.vehicleClass);
      if (saved.timeline === "exploring" || saved.timeline === "soon" || saved.timeline === "this_week") setTimeline(saved.timeline);
      if (saved.selectedVehicleId) setSelectedVehicleId(saved.selectedVehicleId);
      append({ id: "restored", role: "concierge", text: "Your saved path is ready." });
    } catch { sessionStorage.removeItem(STORAGE_KEY); }
  }, []);
  const visibleVehicles = useMemo(() => {
    const classMatches = vehicleClass ? (vehicles.data ?? []).filter(item => item.vehicleClass === vehicleClass) : (vehicles.data ?? []);
    return (recommendedIds ? classMatches.filter(item => recommendedIds.includes(item.vehicleId)) : classMatches).slice(0, 2);
  }, [vehicles.data, vehicleClass, recommendedIds]);
  const selectedVehicle = (vehicles.data ?? []).find(item => item.vehicleId === selectedVehicleId) ?? null;
  const latestConciergeMessage = [...history].reverse().find(entry => entry.role === "concierge")?.text ?? "";
  const showVehicleClassChoice = shouldShowVehicleClassChoice({ intent, vehicleClass, hasSelectedVehicle: Boolean(selectedVehicle), latestConciergeMessage });
  const vehicleClassChoices = (["sedan", "suv"] as const).map(kind => ({
    kind,
    image: (vehicles.data ?? []).find(vehicle => vehicle.vehicleClass === kind)?.image ?? VEHICLE_CLASS_IMAGES[kind],
  }));
  const sending = publicGuide.isPending || savePreference.isPending || beginTransaction.isPending;

  const ask = async (rawQuestion: string) => {
    const value = rawQuestion.trim();
    if (!value || sending) return;
    const memberEntry: Entry = { id: `${Date.now()}-member`, role: "member", text: value };
    const conversation = [...history.slice(-5), memberEntry].map(entry => ({ role: entry.role === "member" ? "member" as const : "concierge" as const, text: entry.text.slice(0, 420) }));
    setQuestion("");
    setNotice("");
    append(memberEntry);
    try {
      const response = await publicGuide.mutateAsync({ question: value, conversation });
      setIntent(response.intent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      setRecommendedIds(/\b(suv|sedan|family|passengers?|space|room|recommend|show|options?)\b/i.test(value) ? response.recommendedVehicleIds : null);
      append({ id: `${Date.now()}-concierge`, role: "concierge", text: response.answer });
    } catch {
      setNotice("Please avoid personal, license, or payment details here.");
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };
  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setTimeline(null);
    const vehicle = (vehicles.data ?? []).find(item => item.vehicleId === vehicleId);
    if (vehicle) append({ id: `${Date.now()}-selection`, role: "concierge", text: `${vehicle.vehicleName} selected. When would you like to drive?` });
  };
  const selectVehicleClass = (choice: Exclude<VehicleClass, null>) => {
    setVehicleClass(choice);
    setRecommendedIds(null);
    append({ id: `${Date.now()}-class`, role: "member", text: choice === "suv" ? "SUV" : "Sedan" });
    append({ id: `${Date.now() + 1}-class-guide`, role: "concierge", text: `Here are confirmed ${choice === "suv" ? "SUV" : "sedan"} options.` });
  };
  const restore = () => {
    if (!savedJourney) return;
    setIntent(savedJourney.intent);
    setSelectedVehicleId(savedJourney.selectedVehicleId ?? null);
    setTimeline(savedJourney.timeline === "exploring" || savedJourney.timeline === "soon" || savedJourney.timeline === "this_week" ? savedJourney.timeline : null);
    setVehicleClass(savedJourney.preferredVehicleClass === "sedan" || savedJourney.preferredVehicleClass === "suv" ? savedJourney.preferredVehicleClass : null);
    setRecommendedIds(savedJourney.selectedVehicleId ? [savedJourney.selectedVehicleId] : null);
    append({ id: `${Date.now()}-restore`, role: "concierge", text: "Your saved path is open." });
  };
  const reset = () => {
    setIntent("explore"); setHistory([welcome(user?.name, isAuthenticated, "explore")]);
    setVehicleClass(null); setRecommendedIds(null); setSelectedVehicleId(null); setTimeline(null); setNotice("");
  };
  const continueJourney = async () => {
    if (intent === "membership") { navigate("/pricing"); return; }
    if (!selectedVehicle || !timeline) { setNotice("Choose a vehicle and timing first."); return; }
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
      setNotice(error instanceof Error ? error.message : "DreamCarz could not start your journey.");
    }
  };

  return (
    <main aria-label="DreamCarz Concierge" className="min-h-screen bg-white text-[#1f1f1f]">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col border-x border-[#efefef] bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eeeeee] bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-bold tracking-[0.18em] text-black">DREAMCARZ</Link>
            <span className="h-4 w-px bg-[#dddddd]" />
            <p className="text-sm font-semibold">Concierge</p>
          </div>
          <div className="flex items-center gap-2">
            {savedJourney ? <button type="button" onClick={restore} className="hidden items-center gap-1.5 text-xs font-semibold text-gray-700 sm:flex"><Bookmark size={14} /> Saved</button> : null}
            {activeTransaction ? <button type="button" onClick={() => navigate(`/dashboard/rental-setup?ref=${encodeURIComponent(activeTransaction.reference)}`)} className="hidden items-center gap-1.5 text-xs font-semibold text-gray-700 sm:flex">Continue <ArrowRight size={14} /></button> : null}
            <button type="button" onClick={reset} aria-label="New DreamCarz Concierge conversation" className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100"><RotateCcw size={18} /></button>
          </div>
        </header>
        <div className="mx-auto flex min-h-[calc(100vh-69px)] w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
          <div className="space-y-6">
            {history.map(entry => (
              <div key={entry.id} className={`flex min-w-0 gap-3 ${entry.role === "member" ? "flex-row-reverse" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${entry.role === "member" ? "bg-[#efefef] text-[#373737]" : "bg-black text-[#d5b35b]"}`}>
                  {entry.role === "member" ? <Compass size={15} /> : <Sparkles size={14} />}
                </span>
                <p className={`max-w-[calc(100%-44px)] break-words text-[16px] leading-7 ${entry.role === "member" ? "rounded-2xl rounded-tr-sm bg-[#f0f0f0] px-4 py-3 text-[#1f1f1f]" : "pt-0.5 text-[#2d2d2d]"}`}>{entry.text}</p>
              </div>
            ))}
            {publicGuide.isPending ? <div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><Sparkles size={14} /></span><span className="pt-2 text-sm text-gray-400">Thinking…</span></div> : null}
            {showVehicleClassChoice ? <div className="grid max-w-md grid-cols-2 gap-3 pt-1">{vehicleClassChoices.map(option => <button type="button" key={option.kind} onClick={() => selectVehicleClass(option.kind)} className="overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white text-left active:scale-[0.98]"><div className="h-28 bg-[#f7f6f3] sm:h-32">{option.image ? <img src={option.image} alt={`${option.kind === "suv" ? "SUV" : "Sedan"} rental category`} className="h-full w-full object-contain" /> : <span className="grid h-full place-items-center text-gray-400"><CarFront size={28} /></span>}</div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-sm font-semibold capitalize">{option.kind}</span><ArrowRight size={14} className="text-[#a8832d]" /></div></button>)}</div> : null}
            {recommendedIds?.length ? <div className="pt-3"><p className="mb-3 text-xs font-semibold text-gray-500">Confirmed matches</p><div className="grid gap-3 sm:grid-cols-2">{visibleVehicles.map(vehicle => <button type="button" key={vehicle.vehicleId} onClick={() => selectVehicle(vehicle.vehicleId)} className={`overflow-hidden rounded-xl border bg-white text-left ${selectedVehicleId === vehicle.vehicleId ? "border-black ring-1 ring-black" : "border-[#e6e6e6]"}`}><div className="h-32 bg-[#f7f6f3]"><img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain" /></div><div className="p-3"><h2 className="font-display text-lg font-bold">{vehicle.vehicleName}</h2><span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">{selectedVehicleId === vehicle.vehicleId ? <><Check size={13} className="text-[#a8832d]" /> Selected</> : <><CarFront size={13} className="text-[#a8832d]" /> Choose</>}</span></div></button>)}</div></div> : null}
            {selectedVehicle ? <div className="rounded-xl border border-[#e5d6a3] bg-[#fffdf8] p-4"><p className="font-semibold">When would you like to drive?</p><div className="mt-3 flex flex-wrap gap-2">{(["exploring", "soon", "this_week"] as const).map(item => <button type="button" key={item} onClick={() => setTimeline(item)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${timeline === item ? "border-black bg-black text-white" : "border-[#ddd4c2] bg-white"}`}>{item === "exploring" ? "Exploring" : item === "soon" ? "Soon" : "This week"}</button>)}</div><button type="button" onClick={() => void continueJourney()} disabled={sending} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Saving…" : isAuthenticated ? "Save & continue" : "Sign in to save"}<ArrowRight size={15} /></button></div> : null}
            {notice ? <p className="text-sm text-red-700">{notice}</p> : null}
          </div>
          <form onSubmit={submit} className="mt-auto pt-8">
            <div className="flex items-center gap-2 rounded-[26px] bg-[#f4f4f4] px-4 py-2">
              <input autoFocus value={question} onChange={event => setQuestion(event.target.value)} maxLength={240} disabled={sending} placeholder="Ask DreamCarz" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-gray-500" />
              <button type="submit" disabled={!question.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white disabled:opacity-40" aria-label="Ask DreamCarz Concierge"><Send size={17} /></button>
            </div>
            <p className="mt-3 flex items-start gap-1.5 px-2 text-[10px] leading-4 text-gray-400"><ShieldCheck size={12} className="mt-0.5 shrink-0" /> No private details in chat.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
