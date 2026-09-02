import { useAuth } from "@/_core/hooks/useAuth";
import { ConciergeEnrollmentPanel } from "@/components/ConciergeEnrollmentPanel";
import { ConciergeWorkspace } from "@/components/ConciergeWorkspace";
import { conciergeComposerPlaceholder, shouldShowVehicleClassChoice, vehicleIdsForClass, type ConciergeIntent as Intent, type ConciergeSecureField, type ConciergeVehicleClass as VehicleClass } from "@/lib/conciergeFlow";
import { trpc } from "@/lib/trpc";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";
import { ArrowRight, CarFront, Check, Compass, Mic, Paperclip, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Timeline = "exploring" | "soon" | "this_week" | null;
type Entry = { id: string; role: "concierge" | "member"; text: string };
type DashboardCreationField = ConciergeSecureField;
const STORAGE_KEY = "dreamcarz-concierge-selection";
const VEHICLE_CLASS_IMAGES = {
  sedan: APPROVED_TRANSACTION_VEHICLES["2024-chevrolet-malibu-gray"].image,
  suv: APPROVED_TRANSACTION_VEHICLES["2022-chevrolet-traverse-white"].image,
} as const;
const CONFIRMED_CONCIERGE_VEHICLES = [
  { vehicleId: "2024-chevrolet-malibu-gray", vehicleName: "2024 Chevrolet Malibu · Gray", vehicleClass: "sedan", image: APPROVED_TRANSACTION_VEHICLES["2024-chevrolet-malibu-gray"].image },
  { vehicleId: "2022-chevrolet-traverse-white", vehicleName: "2022 Chevrolet Traverse · White", vehicleClass: "suv", image: APPROVED_TRANSACTION_VEHICLES["2022-chevrolet-traverse-white"].image },
  { vehicleId: "2024-ford-fusion-gray", vehicleName: "2024 Ford Fusion · Gray", vehicleClass: "sedan", image: APPROVED_TRANSACTION_VEHICLES["2024-ford-fusion-gray"].image },
  { vehicleId: "2020-chevrolet-traverse-gray", vehicleName: "2020 Chevrolet Traverse · Gray", vehicleClass: "suv", image: APPROVED_TRANSACTION_VEHICLES["2020-chevrolet-traverse-gray"].image },
  { vehicleId: "2019-chevrolet-malibu-black", vehicleName: "2019 Chevrolet Malibu · Black", vehicleClass: "sedan", image: APPROVED_TRANSACTION_VEHICLES["2019-chevrolet-malibu-black"].image },
  { vehicleId: "2015-ford-taurus-gray", vehicleName: "2015 Ford Taurus · Gray", vehicleClass: "sedan", image: APPROVED_TRANSACTION_VEHICLES["2015-ford-taurus-gray"].image },
  { vehicleId: "2020-chevrolet-equinox-gray", vehicleName: "2020 Chevrolet Equinox · Gray", vehicleClass: "suv", image: APPROVED_TRANSACTION_VEHICLES["2020-chevrolet-equinox-gray"].image },
  { vehicleId: "2020-chevrolet-equinox-black", vehicleName: "2020 Chevrolet Equinox · Black", vehicleClass: "suv", image: APPROVED_TRANSACTION_VEHICLES["2020-chevrolet-equinox-black"].image },
] as const;

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

export default function Concierge() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const vehicles = trpc.concierge.confirmedVehicles.useQuery(undefined, { staleTime: 300_000 });
  const overview = trpc.dreamcarzId.overview.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const publicGuide = trpc.concierge.publicGuide.useMutation();
  const savePreference = trpc.concierge.saveJourneyPreference.useMutation();
  const beginTransaction = trpc.transactions.begin.useMutation();
  const register = trpc.auth.register.useMutation();
  const login = trpc.auth.login.useMutation();
  const accountPath = trpc.auth.conciergeAccountPath.useMutation();
  const utils = trpc.useUtils();
  const [question, setQuestion] = useState("");
  const [intent, setIntent] = useState<Intent>(getRouteIntent);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null);
  const [notice, setNotice] = useState("");
  const [hasEntered, setHasEntered] = useState(false);
  const [enrollmentReference, setEnrollmentReference] = useState<string | null>(null);
  const [dashboardCreationField, setDashboardCreationField] = useState<DashboardCreationField>(null);
  const [dashboardQuestionMode, setDashboardQuestionMode] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardEmail, setDashboardEmail] = useState("");
  const [continueAfterRegistration, setContinueAfterRegistration] = useState(false);
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
    const frame = window.requestAnimationFrame(() => setHasEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const saved = JSON.parse(stored) as { intent?: Intent; vehicleClass?: VehicleClass; timeline?: Timeline; selectedVehicleId?: string };
      if (saved.intent) setIntent(saved.intent);
      if (saved.vehicleClass === "sedan" || saved.vehicleClass === "suv") setVehicleClass(saved.vehicleClass);
      if (saved.timeline === "exploring" || saved.timeline === "soon" || saved.timeline === "this_week") setTimeline(saved.timeline);
      if (saved.selectedVehicleId) setSelectedVehicleId(saved.selectedVehicleId);
    } catch { sessionStorage.removeItem(STORAGE_KEY); }
  }, []);
  const inventory = vehicles.data?.length ? vehicles.data : CONFIRMED_CONCIERGE_VEHICLES;
  const visibleVehicles = useMemo(() => {
    const classMatches = vehicleClass ? inventory.filter(item => item.vehicleClass === vehicleClass) : inventory;
    return (recommendedIds ? classMatches.filter(item => recommendedIds.includes(item.vehicleId)) : classMatches).slice(0, 2);
  }, [inventory, vehicleClass, recommendedIds]);
  const selectedVehicle = inventory.find(item => item.vehicleId === selectedVehicleId) ?? null;
  const savedPathVehicleId = activeTransaction?.vehicleId ?? savedJourney?.selectedVehicleId ?? null;
  const savedPathVehicle = inventory.find(item => item.vehicleId === savedPathVehicleId) ?? null;
  const savedPathIntent = activeTransaction?.transactionType ?? savedJourney?.intent;
  const workspacePathIntent = savedPathIntent === "rental" || savedPathIntent === "purchase" ? savedPathIntent : intent === "rental" || intent === "purchase" ? intent : null;
  const savedPathTimeline = savedJourney?.timeline;
  const savedPathStep = activeTransaction?.currentStep?.replaceAll("_", " ");
  const hasSavedPath = Boolean(savedPathVehicle || activeTransaction || savedJourney);
  const dashboardMode = Boolean(selectedVehicleId || enrollmentReference || savedJourney?.selectedVehicleId || activeTransaction);
  const activeQuestionIndex = history.map(entry => entry.role).lastIndexOf("concierge");
  const activeQuestion = history[activeQuestionIndex]?.text ?? welcome(user?.name, isAuthenticated, intent).text;
  const conversationHistory = history.filter((_, index) => index !== activeQuestionIndex);
  const latestConciergeMessage = activeQuestion;
  const showVehicleClassChoice = shouldShowVehicleClassChoice({ intent, vehicleClass, hasSelectedVehicle: Boolean(selectedVehicle), latestConciergeMessage });
  const vehicleClassChoices = (["sedan", "suv"] as const).map(kind => ({
    kind,
    image: inventory.find(vehicle => vehicle.vehicleClass === kind)?.image ?? VEHICLE_CLASS_IMAGES[kind],
  }));
  const sending = publicGuide.isPending || savePreference.isPending || beginTransaction.isPending || register.isPending || login.isPending || accountPath.isPending;
  const dashboardPrompt = dashboardCreationField === "email" ? "What email should we use?" : dashboardCreationField === "name" ? "What should I call you?" : dashboardCreationField === "existingPassword" ? "Enter your password to sign in" : "Create a secure password";
  const secureFieldActive = Boolean(dashboardCreationField && !dashboardQuestionMode);
  const composerPlaceholder = conciergeComposerPlaceholder(dashboardCreationField, dashboardQuestionMode);

  const answerDashboardCreation = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value || !dashboardCreationField || sending) return;
    setQuestion("");
    setNotice("");
    if (dashboardCreationField === "email") {
      if (!/^\S+@\S+\.\S+$/.test(value)) { setNotice("Please enter a valid email address."); return; }
      setDashboardEmail(value);
      try {
        const account = await accountPath.mutateAsync({ email: value });
        if (account.hasPasswordAccount) {
          setDashboardCreationField("existingPassword");
          append({ id: `${Date.now()}-dashboard-sign-in`, role: "concierge", text: "I found your DreamCarz dashboard. Enter your password to sign in and continue." });
        } else {
          setDashboardCreationField("name");
          append({ id: `${Date.now()}-dashboard-name`, role: "concierge", text: "Great. What should I call you?" });
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "We could not check that email yet.");
      }
      return;
    }
    if (dashboardCreationField === "name") {
      if (value.length < 2) { setNotice("Please enter your name."); return; }
      setDashboardName(value);
      setDashboardCreationField("password");
      append({ id: `${Date.now()}-dashboard-password`, role: "concierge", text: "Create a secure password. Use at least 10 characters." });
      return;
    }
    if (dashboardCreationField === "password" && value.length < 10) { setNotice("Use at least 10 characters for your password."); return; }
    try {
      const account = dashboardCreationField === "existingPassword"
        ? await login.mutateAsync({ email: dashboardEmail, password: rawValue })
        : await register.mutateAsync({ name: dashboardName, email: dashboardEmail, password: rawValue, acceptedTerms: true });
      utils.auth.me.setData(undefined, account);
      await utils.auth.me.invalidate();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId }));
      setDashboardCreationField(null);
      setContinueAfterRegistration(true);
      append({ id: `${Date.now()}-dashboard-ready`, role: "concierge", text: "Your DreamCarz dashboard is ready. I’ll keep your vehicle path right here." });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not create your dashboard yet.");
    }
  };
  const ask = async (rawQuestion: string) => {
    const value = rawQuestion.trim();
    if (!value || sending) return;
    if (dashboardCreationField && !dashboardQuestionMode) {
      await answerDashboardCreation(rawQuestion);
      return;
    }
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
      if (dashboardQuestionMode && dashboardCreationField) {
        setDashboardQuestionMode(false);
        append({ id: `${Date.now() + 1}-dashboard-return`, role: "concierge", text: `When you’re ready, ${dashboardPrompt.toLowerCase()}` });
      }
    } catch {
      setNotice("Please avoid personal, license, or payment details here.");
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };
  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setTimeline(null);
    const vehicle = inventory.find(item => item.vehicleId === vehicleId);
    if (vehicle) append({ id: `${Date.now()}-selection`, role: "concierge", text: `Perfect. I’ve saved the ${vehicle.vehicleName}. When would you like to drive?` });
  };
  const selectVehicleClass = (choice: Exclude<VehicleClass, null>) => {
    setVehicleClass(choice);
    setRecommendedIds(vehicleIdsForClass(inventory, choice));
    append({ id: `${Date.now()}-class`, role: "member", text: choice === "suv" ? "SUV" : "Sedan" });
    append({ id: `${Date.now() + 1}-class-guide`, role: "concierge", text: `Here are two confirmed ${choice === "suv" ? "SUV" : "sedan"} options. Choose the one that fits you.` });
  };
  const restore = () => {
    if (!savedJourney) return;
    setIntent(savedJourney.intent);
    setSelectedVehicleId(savedJourney.selectedVehicleId ?? null);
    setTimeline(savedJourney.timeline === "exploring" || savedJourney.timeline === "soon" || savedJourney.timeline === "this_week" ? savedJourney.timeline : null);
    setVehicleClass(savedJourney.preferredVehicleClass === "sedan" || savedJourney.preferredVehicleClass === "suv" ? savedJourney.preferredVehicleClass : null);
    setRecommendedIds(savedJourney.selectedVehicleId ? [savedJourney.selectedVehicleId] : null);
    if (activeTransaction) openEnrollment(activeTransaction.reference);
  };
  const choosePath = (nextIntent: "rental" | "purchase") => {
    setIntent(nextIntent);
    setHistory([welcome(user?.name, isAuthenticated, nextIntent)]);
    setVehicleClass(null); setRecommendedIds(null); setSelectedVehicleId(null); setTimeline(null); setEnrollmentReference(null); setNotice("");
  };
  const changeVehicle = () => {
    setVehicleClass(null); setRecommendedIds(null); setSelectedVehicleId(null); setTimeline(null); setEnrollmentReference(null); setNotice("");
    append({ id: `${Date.now()}-change-vehicle`, role: "concierge", text: "What type of vehicle would you like instead?" });
  };
  const openAccount = () => {
    if (isAuthenticated) { navigate("/dashboard"); return; }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId }));
    if (dashboardCreationField) return;
    setDashboardQuestionMode(false);
    setDashboardCreationField("email");
    append({ id: `${Date.now()}-dashboard-start`, role: "concierge", text: "I’ll create your DreamCarz dashboard and keep this vehicle path here. What email should we use?" });
  };
  const openEnrollment = (reference: string) => {
    setEnrollmentReference(reference);
    setNotice("");
  };
  const reset = () => {
    setIntent("explore"); setHistory([welcome(user?.name, isAuthenticated, "explore")]);
    setVehicleClass(null); setRecommendedIds(null); setSelectedVehicleId(null); setTimeline(null); setEnrollmentReference(null); setNotice("");
  };
  const continueJourney = async () => {
    if (intent === "membership") { navigate("/pricing"); return; }
    if (!selectedVehicle || !timeline) { setNotice("Choose a vehicle and timing first."); return; }
    if (!isAuthenticated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, vehicleClass, timeline, selectedVehicleId }));
      openAccount();
      return;
    }
    try {
      await savePreference.mutateAsync({ intent, preferredVehicleClass: vehicleClass, selectedVehicleId, timeline, confirmSave: true });
      const result = await beginTransaction.mutateAsync({ transactionType: intent === "purchase" ? "purchase" : "rental", vehicleId: selectedVehicle.vehicleId });
      sessionStorage.removeItem(STORAGE_KEY);
      openEnrollment(result.reference);
      append({ id: `${Date.now()}-enrollment`, role: "concierge", text: `Great choice. I’ll keep your ${intent === "purchase" ? "purchase" : "rental"} enrollment right here.` });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "DreamCarz could not start your journey.");
    }
  };
  useEffect(() => {
    if (!continueAfterRegistration || !isAuthenticated || !selectedVehicle || !timeline) return;
    setContinueAfterRegistration(false);
    void continueJourney();
  }, [continueAfterRegistration, isAuthenticated, selectedVehicle, timeline]);

  return (
    <ConciergeWorkspace dashboard={dashboardMode} intent={intent === "rental" || intent === "purchase" ? intent : null} userName={user?.name} isAuthenticated={isAuthenticated} hasSavedPath={hasSavedPath} savedPath={{ vehicleName: savedPathVehicle?.vehicleName ?? selectedVehicle?.vehicleName ?? null, vehicleImage: savedPathVehicle?.image ?? selectedVehicle?.image ?? null, intent: workspacePathIntent, timeline: savedPathTimeline ?? timeline, nextStep: savedPathStep ?? (enrollmentReference ? "Continue enrollment" : null) }} canResume={Boolean(activeTransaction)} onResume={() => activeTransaction ? openEnrollment(activeTransaction.reference) : restore()} onNewConversation={reset} onChoosePath={choosePath} onChangeVehicle={changeVehicle} onAccount={openAccount}>
        <div className={`mx-auto flex min-h-[calc(100vh-69px)] w-full flex-1 flex-col px-5 py-8 transition-opacity duration-200 motion-reduce:transition-none sm:px-8 sm:py-10 ${dashboardMode ? "max-w-5xl" : "max-w-3xl"} ${hasEntered ? "opacity-100" : "opacity-0"}`}>
          <div className="space-y-6">
            {conversationHistory.map(entry => (
              <div key={entry.id} className={`flex min-w-0 gap-3 ${entry.role === "member" ? "flex-row-reverse" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${entry.role === "member" ? "bg-[#efefef] text-[#373737]" : "bg-black text-[#d5b35b]"}`}>
                  {entry.role === "member" ? <Compass size={15} /> : <Sparkles size={14} />}
                </span>
                <p className={`max-w-[min(720px,calc(100%-44px))] break-words text-[15px] leading-7 ${entry.role === "member" ? "rounded-2xl rounded-tr-sm bg-[#111111] px-4 py-3 text-white" : "rounded-2xl rounded-tl-sm border border-[#eeeeec] bg-white px-4 py-3 text-[#2d2d2d]"}`}>{entry.text}</p>
              </div>
            ))}
            {publicGuide.isPending ? <div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><Sparkles size={14} /></span><span className="pt-2 text-sm text-gray-400">Thinking…</span></div> : null}
            {!dashboardMode && hasSavedPath ? <section aria-label="Saved Concierge choices" className="border border-[#e5d6a3] bg-[#fffdf8] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Your saved path</p><p className="mt-1 text-sm font-semibold">Pick up where you left off.</p></div>{activeTransaction ? <button type="button" onClick={() => openEnrollment(activeTransaction.reference)} className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">Resume</button> : null}</div><div className="mt-4 grid gap-2 text-xs text-gray-600">{savedPathVehicle ? <div className="flex items-center gap-3 border-t border-[#eee4c9] pt-3"><img src={savedPathVehicle.image} alt="" className="h-10 w-16 object-contain" /><span><strong className="text-gray-900">Vehicle</strong> · {savedPathVehicle.vehicleName}</span></div> : null}{savedPathIntent === "rental" || savedPathIntent === "purchase" ? <p><strong className="text-gray-900">Path</strong> · {savedPathIntent === "rental" ? "Renting" : "Buying"}</p> : null}{savedPathTimeline ? <p><strong className="text-gray-900">Timing</strong> · {savedPathTimeline === "this_week" ? "This week" : savedPathTimeline === "soon" ? "Soon" : "Exploring"}</p> : null}{savedPathStep ? <p><strong className="text-gray-900">Next</strong> · {savedPathStep}</p> : null}</div></section> : null}
            <section aria-label="Current Concierge question" className="flex gap-3 pt-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#d5b35b]"><Sparkles size={16} /></span>
              <div className="min-w-0 flex-1 rounded-2xl border border-[#e4cb84] bg-[#fffdf8] px-5 py-4 shadow-[0_8px_30px_rgba(168,131,45,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">DreamCarz is asking</p>
                <p className="mt-2 break-words text-[19px] font-semibold leading-7 text-[#1c1c1c] sm:text-[21px]">{activeQuestion}</p>
              </div>
            </section>
            {showVehicleClassChoice ? <div className="grid max-w-md grid-cols-2 gap-3 pt-1">{vehicleClassChoices.map(option => <button type="button" key={option.kind} onClick={() => selectVehicleClass(option.kind)} className="overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white text-left active:scale-[0.98]"><div className="h-28 bg-[#f7f6f3] sm:h-32">{option.image ? <img src={option.image} alt={`${option.kind === "suv" ? "SUV" : "Sedan"} rental category`} className="h-full w-full object-contain" /> : <span className="grid h-full place-items-center text-gray-400"><CarFront size={28} /></span>}</div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-sm font-semibold">{option.kind === "suv" ? "SUV" : "Sedan"}</span><ArrowRight size={14} className="text-[#a8832d]" /></div></button>)}</div> : null}
            {recommendedIds?.length && !selectedVehicle ? <div className="pt-3"><p className="mb-3 text-xs font-semibold text-gray-500">Confirmed matches</p><div className="grid gap-3 sm:grid-cols-2">{visibleVehicles.map(vehicle => <button type="button" key={vehicle.vehicleId} onClick={() => selectVehicle(vehicle.vehicleId)} className="overflow-hidden rounded-xl border border-[#e6e6e6] bg-white text-left active:scale-[0.98]"><div className="h-32 bg-[#f7f6f3]"><img src={vehicle.image} alt={vehicle.vehicleName} className="h-full w-full object-contain" /></div><div className="p-3"><h2 className="font-display text-lg font-bold">{vehicle.vehicleName}</h2><span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500"><CarFront size={13} className="text-[#a8832d]" /> Choose</span></div></button>)}</div></div> : null}
            {selectedVehicle && !dashboardCreationField ? <div className="rounded-2xl border border-[#e5d6a3] bg-[#fffdf8] p-4"><div className="flex items-center gap-3"><img src={selectedVehicle.image} alt="" className="h-14 w-20 rounded-lg bg-white object-contain" /><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Selected vehicle</p><p className="mt-1 text-sm font-semibold">{selectedVehicle.vehicleName}</p></div><Check size={17} className="ml-auto text-[#a8832d]" /></div><div className="mt-4 flex flex-wrap gap-2" aria-label="Choose timing">{(["exploring", "soon", "this_week"] as const).map(item => <button type="button" key={item} onClick={() => { setTimeline(item); if (!isAuthenticated) openAccount(); }} className={`rounded-full border px-3 py-2 text-xs font-semibold ${timeline === item ? "border-black bg-black text-white" : "border-[#ddd4c2] bg-white"}`}>{item === "exploring" ? "Just exploring" : item === "soon" ? "Soon" : "This week"}</button>)}</div>{timeline && !isAuthenticated ? <p className="mt-3 text-xs leading-5 text-gray-500">I’ll create your dashboard here and keep this vehicle saved.</p> : null}{timeline ? <button type="button" onClick={() => void continueJourney()} disabled={sending} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Saving…" : isAuthenticated ? "Save & continue" : "Create your dashboard"}<ArrowRight size={15} /></button> : null}</div> : null}
            {enrollmentReference ? <ConciergeEnrollmentPanel reference={enrollmentReference} onProgress={message => append({ id: `${Date.now()}-enrollment-progress`, role: "concierge", text: message })} /> : null}
            {notice ? <p className="text-sm text-red-700">{notice}</p> : null}
          </div>
          <form onSubmit={submit} className="sticky bottom-3 z-10 mt-auto bg-white/95 pt-8 backdrop-blur-sm sm:bottom-5">
            <div className={`rounded-[28px] border bg-[#f6f6f5] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.06)] ${secureFieldActive ? "border-[#d9b756] ring-2 ring-[#d9b756]/15" : "border-[#e4e4e2]"}`}>
              <div className="flex items-end gap-2 px-2">
                <button type="button" onClick={() => setNotice("Attachments are collected only inside the protected DreamCarz workflow.")} aria-label="Attachments are available in protected workflows" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-white"><Paperclip size={18} /></button>
                <button type="button" onClick={() => setNotice("Voice input is not enabled for this Concierge yet.")} aria-label="Voice input is not enabled" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-white"><Mic size={18} /></button>
                <input autoFocus value={question} onChange={event => setQuestion(event.target.value)} maxLength={secureFieldActive && (dashboardCreationField === "password" || dashboardCreationField === "existingPassword") ? 128 : 240} disabled={sending} type={secureFieldActive && (dashboardCreationField === "password" || dashboardCreationField === "existingPassword") ? "password" : "text"} autoComplete={secureFieldActive && dashboardCreationField === "name" ? "name" : secureFieldActive && dashboardCreationField === "email" ? "email" : secureFieldActive && dashboardCreationField === "password" ? "new-password" : secureFieldActive && dashboardCreationField === "existingPassword" ? "current-password" : "off"} placeholder={composerPlaceholder} className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none placeholder:text-gray-500" />
                <button type="submit" disabled={!question.trim() || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d9b756] text-black disabled:opacity-40" aria-label="Send to DreamCarz Concierge"><Send size={18} /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] leading-4 text-gray-500"><p className="flex max-w-xl items-start gap-1.5"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#a8832d]" /> Your conversation is private and secure. Sensitive information is collected through protected DreamCarz verification screens.</p>{dashboardCreationField ? <button type="button" onClick={() => setDashboardQuestionMode(value => !value)} className="font-semibold text-[#6a5420] underline underline-offset-4">{dashboardQuestionMode ? `Continue: ${dashboardPrompt}` : "Ask a question instead"}</button> : null}</div>
          </form>
        </div>
    </ConciergeWorkspace>
  );
}
