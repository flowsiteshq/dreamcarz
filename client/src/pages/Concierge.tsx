import { useAuth } from "@/_core/hooks/useAuth";
import { ConciergeEnrollmentPanel } from "@/components/ConciergeEnrollmentPanel";
import { ConciergeWorkspace } from "@/components/ConciergeWorkspace";
import { conciergeComposerPlaceholder, shouldShowVehicleClassChoice, vehicleIdsForClass, type ConciergeIntent as Intent, type ConciergeSecureField, type ConciergeVehicleClass as VehicleClass } from "@/lib/conciergeFlow";
import { takeHomepageConciergePrompt } from "@/lib/conciergePromptHandoff";
import { trpc } from "@/lib/trpc";
import { formatUsdFromCents, type MarketRentalEstimate } from "@shared/marketRateReference";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";
import { ArrowRight, CarFront, Check, ChevronDown, Compass, Mic, Paperclip, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type Timeline = "exploring" | "soon" | "this_week" | null;
type Entry = { id: string; role: "concierge" | "member"; text: string; marketEstimate?: MarketRentalEstimate | null; waitlistVehicleId?: string | null };
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
const formatEstimateRange = (lowCents: number, highCents: number) => lowCents === highCents ? formatUsdFromCents(lowCents) : `${formatUsdFromCents(lowCents)}–${formatUsdFromCents(highCents)}`;
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
  const transcribeVoice = trpc.concierge.transcribeVoice.useMutation();
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
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maxRecordingTimerRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const homepagePromptConsumedRef = useRef(false);
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
  const sending = publicGuide.isPending || transcribeVoice.isPending || savePreference.isPending || beginTransaction.isPending || register.isPending || login.isPending || accountPath.isPending;
  const dashboardPrompt = dashboardCreationField === "email" ? "What email should we use?" : dashboardCreationField === "name" ? "What should I call you?" : dashboardCreationField === "existingPassword" ? "Enter your password to sign in" : "Create a secure password";
  const secureFieldActive = Boolean(dashboardCreationField && !dashboardQuestionMode);
  const composerPlaceholder = conciergeComposerPlaceholder({
    field: dashboardCreationField,
    askingGeneralQuestion: dashboardQuestionMode,
    selectedVehicleName: selectedVehicle?.vehicleName,
    hasActiveReservation: Boolean(enrollmentReference || activeTransaction),
    isMember: isAuthenticated,
  });
  const keyboardOpen = keyboardInset > 0;

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
      const response = await publicGuide.mutateAsync({
        question: value,
        conversation,
        context: {
          customerIntent: intent,
          selectedVehicleId,
          vehicleType: vehicleClass,
          customerStatus: isAuthenticated ? "member" : "guest",
          authenticationStatus: isAuthenticated ? "authenticated" : "guest",
          onboardingStage: enrollmentReference ? "in_progress" : activeTransaction?.currentStep ?? null,
          reservationStatus: enrollmentReference || activeTransaction ? "in_progress" : "none",
        },
      });
      setIntent(response.intent);
      setVehicleClass(response.vehicleClass === "sedan" || response.vehicleClass === "suv" ? response.vehicleClass : null);
      setRecommendedIds(/\b(suv|sedan|family|passengers?|space|room|recommend|show|options?)\b/i.test(value) ? response.recommendedVehicleIds : null);
      append({ id: `${Date.now()}-concierge`, role: "concierge", text: response.answer, marketEstimate: response.marketEstimate, waitlistVehicleId: response.waitlistVehicleId });
      if (dashboardQuestionMode && dashboardCreationField) {
        setDashboardQuestionMode(false);
        append({ id: `${Date.now() + 1}-dashboard-return`, role: "concierge", text: `When you’re ready, ${dashboardPrompt.toLowerCase()}` });
      }
    } catch {
      setNotice("Please avoid personal, license, or payment details here.");
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question); };
  useEffect(() => {
    if (homepagePromptConsumedRef.current) return;
    homepagePromptConsumedRef.current = true;
    const prompt = takeHomepageConciergePrompt();
    if (prompt) void ask(prompt);
  }, [ask]);
  const stopVoiceInput = () => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    if (maxRecordingTimerRef.current !== null) window.clearTimeout(maxRecordingTimerRef.current);
    animationFrameRef.current = null;
    maxRecordingTimerRef.current = null;
    setVoiceLevel(0);
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsRecording(false);
    if (recorder?.state === "recording") recorder.stop();
  };
  const cancelVoiceInput = () => {
    discardRecordingRef.current = true;
    stopVoiceInput();
    setNotice("Voice input cancelled.");
  };
  const startVoiceInput = async () => {
    if (sending || isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNotice("Voice input is not available in this browser. Please type your question."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(candidate => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        const clip = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        chunks.length = 0;
        if (discardRecordingRef.current) { discardRecordingRef.current = false; return; }
        if (!clip.size) { setNotice("I could not hear a question. Please try again."); return; }
        try {
          const audioData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Voice input could not be read."));
            reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Voice input could not be read."));
            reader.readAsDataURL(clip);
          });
          const result = await transcribeVoice.mutateAsync({ audioData });
          setQuestion(result.text);
          setNotice("Voice input is ready. You can edit it or send it when you’re ready.");
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Voice transcription is temporarily unavailable.");
        }
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      discardRecordingRef.current = false;
      setNotice("");
      setIsRecording(true);
      recorder.start();

      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = context;
      const levels = new Uint8Array(analyser.fftSize);
      let heardSpeech = false;
      let silenceSince: number | null = null;
      const watchForPause = () => {
        analyser.getByteTimeDomainData(levels);
        const peak = levels.reduce((highest, level) => Math.max(highest, Math.abs(level - 128)), 0);
        setVoiceLevel(Math.min(1, peak / 44));
        if (peak > 9) { heardSpeech = true; silenceSince = null; }
        else if (heardSpeech) {
          silenceSince ??= Date.now();
          if (Date.now() - silenceSince > 1_100) { stopVoiceInput(); return; }
        }
        animationFrameRef.current = window.requestAnimationFrame(watchForPause);
      };
      animationFrameRef.current = window.requestAnimationFrame(watchForPause);
      maxRecordingTimerRef.current = window.setTimeout(stopVoiceInput, 20_000);
    } catch {
      stopVoiceInput();
      setNotice("Microphone access is needed for voice input. Please allow it and try again.");
    }
  };
  useEffect(() => () => {
    stopVoiceInput();
  }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset > 150 ? inset : 0);
    };
    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);
  useEffect(() => {
    if (!keyboardOpen) return;
    setPrivacyOpen(false);
    const frame = window.requestAnimationFrame(() => composerInputRef.current?.scrollIntoView({ block: "nearest" }));
    return () => window.cancelAnimationFrame(frame);
  }, [keyboardOpen]);
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
        <div className={`mx-auto flex min-h-[calc(100vh-69px)] w-full flex-1 flex-col px-5 pb-40 pt-8 transition-opacity duration-200 motion-reduce:transition-none sm:px-8 sm:pb-44 sm:pt-10 ${dashboardMode ? "max-w-5xl" : "max-w-3xl"} ${hasEntered ? "opacity-100" : "opacity-0"}`}>
          <div className="space-y-6">
            {conversationHistory.map(entry => (
              <div key={entry.id} className={`flex min-w-0 gap-3 ${entry.role === "member" ? "flex-row-reverse" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${entry.role === "member" ? "bg-[#efefef] text-[#373737]" : "bg-black text-[#d5b35b]"}`}>
                  {entry.role === "member" ? <Compass size={15} /> : <Sparkles size={14} />}
                </span>
                <div className="max-w-[min(720px,calc(100%-44px))] min-w-0">
                  <p className={`break-words text-[15px] leading-7 ${entry.role === "member" ? "rounded-2xl rounded-tr-sm bg-[#111111] px-4 py-3 text-white" : "rounded-2xl rounded-tl-sm border border-[#eeeeec] bg-white px-4 py-3 text-[#2d2d2d]"}`}>{entry.text}</p>
                  {entry.role === "concierge" && entry.marketEstimate ? <section aria-label="Market estimate breakdown" className="mt-3 overflow-hidden rounded-2xl border border-[#e5d6a3] bg-[#fffdf8] text-[#252525] shadow-[0_8px_24px_rgba(168,131,45,0.08)]">
                    <div className="flex items-end justify-between gap-3 border-b border-[#eadfbf] px-4 py-3">
                      <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">BWI market estimate</p><p className="mt-1 text-xs text-[#69645a]">Recorded comparable rental snapshot</p></div>
                      <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#69645a]">Estimated total</p><p className="mt-0.5 text-lg font-bold tracking-tight">{formatEstimateRange(entry.marketEstimate.totalLowCents, entry.marketEstimate.totalHighCents)}</p></div>
                    </div>
                    <dl className="divide-y divide-[#eee6d0] px-4">
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="text-[#5d584f]">Daily market rate</dt><dd className="font-semibold">{formatEstimateRange(entry.marketEstimate.dailyLowCents, entry.marketEstimate.dailyHighCents)} / day</dd></div>
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="text-[#5d584f]">Rental days</dt><dd className="font-semibold">{entry.marketEstimate.days}</dd></div>
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="text-[#5d584f]">Comparable taxes &amp; fees</dt><dd className="text-right font-semibold">Included in source total*</dd></div>
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="text-[#5d584f]">DreamCarz fees &amp; deposit</dt><dd className="text-right font-semibold text-[#8a6b23]">Pending final quote</dd></div>
                    </dl>
                    <p className="border-t border-[#eadfbf] px-4 py-2.5 text-[11px] leading-4 text-[#69645a]">*The recorded BWI marketplace comparison included its displayed taxes and fees. DreamCarz charges, deposit, and live availability are not set by this estimate.</p>
                  </section> : null}
                  {entry.role === "concierge" && entry.waitlistVehicleId === "coming-soon-2024-tesla-model-3" ? <section aria-label="Tesla Model 3 waitlist" className="mt-3 rounded-2xl border border-[#e5d6a3] bg-[#fffdf8] p-4 shadow-[0_8px_24px_rgba(168,131,45,0.08)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a8832d]">Coming soon</p>
                    <p className="mt-1 text-sm font-semibold text-[#252525]">Tesla Model 3 waiting list</p>
                    <p className="mt-1 text-xs leading-5 text-[#69645a]">Join the interest list. Timing, availability, and final terms are confirmed separately.</p>
                    <button type="button" onClick={() => navigate(`/fleet?reserve=${encodeURIComponent(entry.waitlistVehicleId!)}`)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-xs font-semibold text-white active:scale-[0.97]">Join waiting list <ArrowRight size={14} /></button>
                  </section> : null}
                </div>
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
          <div className="pointer-events-none fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 sm:inset-x-6 sm:bottom-6" style={keyboardInset ? { bottom: `${keyboardInset + 12}px` } : undefined}>
            <form onSubmit={submit} className="pointer-events-auto mx-auto w-full max-w-3xl">
              {selectedVehicle ? <div className="mb-2 flex min-h-14 items-center gap-3 rounded-2xl border border-[#e5d6a3] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"><img src={selectedVehicle.image} alt="" className="h-10 w-16 shrink-0 object-contain" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#1c1c1c]">{selectedVehicle.vehicleName}</p><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a8832d]">Vehicle selected</p></div><button type="button" onClick={changeVehicle} className="shrink-0 text-xs font-semibold text-[#a8832d]">Change</button></div> : null}
              <div className={`min-h-16 rounded-[28px] border bg-[#151618]/95 px-2 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl ${secureFieldActive ? "border-[#d9b756] ring-2 ring-[#d9b756]/25" : "border-white/20"}`}>
                {isRecording ? <div className="flex h-16 items-center gap-3 px-3"><div className="flex h-8 flex-1 items-center justify-center gap-1.5 text-[#e8c661]" aria-label="Listening to your voice input">{[0.45, 0.8, 1, 0.7, 0.5, 0.85, 0.6].map((base, index) => <span key={index} className="w-1 rounded-full bg-current" style={{ height: `${8 + (14 * base * (0.35 + voiceLevel))}px` }} />)}</div><span className="text-base font-medium text-white">Listening…</span><button type="button" onClick={cancelVoiceInput} aria-label="Cancel voice input" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 text-white"><X size={19} /></button></div> : <div className="flex h-16 items-center gap-2 px-2"><button type="button" onClick={() => setNotice("Attachments are collected only inside the protected DreamCarz workflow.")} aria-label="Attachments are available in protected workflows" className="grid h-10 w-9 shrink-0 place-items-center border-r border-white/15 pr-2 text-white/65 hover:text-white"><Paperclip size={18} /></button><label htmlFor="dreamcarz-concierge-input" className="sr-only">Ask DreamCarz Concierge</label><input ref={composerInputRef} id="dreamcarz-concierge-input" autoFocus value={question} onChange={event => setQuestion(event.target.value)} maxLength={secureFieldActive && (dashboardCreationField === "password" || dashboardCreationField === "existingPassword") ? 128 : 240} disabled={sending} type={secureFieldActive && (dashboardCreationField === "password" || dashboardCreationField === "existingPassword") ? "password" : "text"} autoComplete={secureFieldActive && dashboardCreationField === "name" ? "name" : secureFieldActive && dashboardCreationField === "email" ? "email" : secureFieldActive && dashboardCreationField === "password" ? "new-password" : secureFieldActive && dashboardCreationField === "existingPassword" ? "current-password" : "off"} placeholder={composerPlaceholder} className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-white outline-none placeholder:text-white/45" /><button type="button" onClick={() => void startVoiceInput()} disabled={sending} aria-label="Start DreamCarz voice input" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 text-white hover:border-[#d9b756] hover:text-[#f0ce7f] disabled:opacity-40"><Mic size={19} /></button><button type="submit" disabled={!question.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d9b756] text-black shadow-[0_4px_16px_rgba(217,183,86,0.25)] disabled:opacity-40" aria-label="Send to DreamCarz Concierge"><Send size={17} /></button></div>}
              </div>
              {!keyboardOpen ? <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 text-[11px] leading-4 text-[#555]">{privacyOpen ? <p className="max-w-xl text-[#555]">Your conversation is private and secure. Sensitive information is collected through protected DreamCarz verification screens.</p> : <button type="button" onClick={() => setPrivacyOpen(true)} className="inline-flex items-center gap-1.5 font-medium text-[#4a4a4a]"><ShieldCheck size={13} className="text-[#b18a2d]" /> Secure &amp; private <ChevronDown size={13} /></button>}{privacyOpen ? <button type="button" onClick={() => setPrivacyOpen(false)} className="font-semibold text-[#a8832d]">Less</button> : null}{dashboardCreationField ? <button type="button" onClick={() => setDashboardQuestionMode(value => !value)} className="font-semibold text-[#a8832d] underline underline-offset-4">{dashboardQuestionMode ? `Continue: ${dashboardPrompt}` : "Ask a question instead"}</button> : null}</div> : null}
            </form>
          </div>
        </div>
    </ConciergeWorkspace>
  );
}
