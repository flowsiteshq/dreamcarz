import { ArrowRight, Bookmark, CarFront, CircleUserRound, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";

type SavedPath = {
  vehicleName: string | null;
  vehicleImage: string | null;
  intent: "rental" | "purchase" | null | undefined;
  timeline: "exploring" | "soon" | "this_week" | null | undefined;
  nextStep: string | null | undefined;
};

type ConciergeWorkspaceProps = {
  dashboard: boolean;
  intent: "rental" | "purchase" | null;
  userName: string | null | undefined;
  isAuthenticated: boolean;
  hasSavedPath: boolean;
  savedPath: SavedPath;
  canResume: boolean;
  onResume: () => void;
  onNewConversation: () => void;
  onChoosePath: (path: "rental" | "purchase") => void;
  onChangeVehicle: () => void;
  onAccount: () => void;
  children: ReactNode;
};

const timelineLabel = (timeline: SavedPath["timeline"]) => timeline === "this_week" ? "This week" : timeline === "soon" ? "Soon" : timeline === "exploring" ? "Exploring" : null;

export function ConciergeWorkspace({
  dashboard,
  intent,
  userName,
  isAuthenticated,
  hasSavedPath,
  savedPath,
  canResume,
  onResume,
  onNewConversation,
  onChoosePath,
  onChangeVehicle,
  onAccount,
  children,
}: ConciergeWorkspaceProps) {
  const [entered, setEntered] = useState(false);
  const firstName = userName?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    if (!dashboard) { setEntered(false); return; }
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [dashboard]);

  const header = (
    <header className={`sticky top-0 z-20 flex items-center justify-between border-b px-5 py-4 sm:px-7 ${dashboard ? "border-white/10 bg-[#070707] text-white" : "border-[#eeeeee] bg-white text-[#1f1f1f]"}`}>
      <div className="flex items-center gap-4">
        <Link href="/" className={`text-sm font-bold tracking-[0.18em] ${dashboard ? "text-white" : "text-black"}`}>DREAMCARZ</Link>
        <span className={`h-4 w-px ${dashboard ? "bg-white/20" : "bg-[#dddddd]"}`} />
        <p className="text-sm font-semibold">Concierge</p>
      </div>
      <div className="flex items-center gap-3">
        {dashboard && isAuthenticated ? <button type="button" onClick={onAccount} className="hidden items-center gap-2 text-xs font-semibold text-white/80 sm:flex"><CircleUserRound size={15} /> {firstName}</button> : null}
        {hasSavedPath && !dashboard ? <button type="button" onClick={onResume} className="hidden items-center gap-1.5 text-xs font-semibold text-gray-700 sm:flex"><Bookmark size={14} /> Saved</button> : null}
        {canResume ? <button type="button" onClick={onResume} className={`flex items-center gap-1.5 text-xs font-semibold ${dashboard ? "text-[#d9b756]" : "text-gray-700"}`}>Resume <ArrowRight size={14} /></button> : null}
        <button type="button" onClick={onNewConversation} aria-label="New DreamCarz Concierge conversation" className={`grid h-9 w-9 place-items-center rounded-full ${dashboard ? "text-white/60 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}><RotateCcw size={18} /></button>
      </div>
    </header>
  );

  if (!dashboard) {
    return <main aria-label="DreamCarz Concierge" className="min-h-screen bg-white text-[#1f1f1f]"><section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col border-x border-[#efefef] bg-white">{header}{children}</section></main>;
  }

  return (
    <main aria-label="DreamCarz Concierge dashboard" className="min-h-screen bg-[#f5f5f3] text-[#1f1f1f]">
      <section className={`min-h-screen w-full bg-white transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
        {header}
        <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_280px]">
          <aside className="hidden bg-[#0d0f10] px-4 py-5 text-white lg:flex lg:flex-col">
            <div className="border-b border-white/10 pb-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#17191b] text-[#d9b756]"><Sparkles size={15} /></span> DreamCarz Concierge</div>
              <p className="mt-3 text-xs leading-5 text-white/55">Your selected vehicle and next step stay together here.</p>
            </div>
            <nav aria-label="Concierge actions" className="mt-5 grid gap-2">
              <button type="button" onClick={() => onChoosePath("rental")} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold active:scale-[0.98] ${intent === "rental" ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10"}`}><CarFront size={16} className="text-[#d9b756]" /> Rent a vehicle</button>
              <button type="button" onClick={() => onChoosePath("purchase")} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold active:scale-[0.98] ${intent === "purchase" ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10"}`}><CarFront size={16} className="text-[#d9b756]" /> Buy a vehicle</button>
              <button type="button" onClick={onChangeVehicle} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/75 hover:bg-white/10 active:scale-[0.98]"><Bookmark size={16} className="text-[#d9b756]" /> Change vehicle</button>
            </nav>
            <div className="mt-auto border-t border-white/10 pt-5 text-xs leading-5 text-white/55">Ask a question anytime. Your enrollment stays at the exact next step.</div>
          </aside>
          <section className="min-w-0 bg-white">{children}</section>
          <aside className="hidden border-l border-[#ececec] bg-[#fafaf9] p-5 xl:block">
            <div className="border border-[#e7dcc0] bg-white p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">Your saved path</p>{canResume ? <button type="button" onClick={onResume} className="text-xs font-semibold text-black">Resume</button> : null}</div>
              {savedPath.vehicleImage ? <img src={savedPath.vehicleImage} alt="" className="mx-auto mt-3 h-24 w-full object-contain" /> : null}
              {savedPath.vehicleName ? <p className="mt-2 text-sm font-semibold leading-5">{savedPath.vehicleName}</p> : <p className="mt-3 text-sm text-gray-500">Choose a vehicle to start your path.</p>}
              <div className="mt-4 grid gap-2 border-t border-[#eeeeee] pt-3 text-xs text-gray-600">
                {savedPath.intent ? <p><strong className="text-black">Path</strong> · {savedPath.intent === "rental" ? "Renting" : "Buying"}</p> : null}
                {timelineLabel(savedPath.timeline) ? <p><strong className="text-black">Timing</strong> · {timelineLabel(savedPath.timeline)}</p> : null}
                {savedPath.nextStep ? <p><strong className="text-black">Next</strong> · {savedPath.nextStep}</p> : null}
              </div>
              {isAuthenticated ? <button type="button" onClick={onAccount} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-black">My dashboard <ArrowRight size={13} /></button> : <button type="button" onClick={onAccount} className="mt-4 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">Create your dashboard</button>}
            </div>
            <div className="mt-4 border border-[#ececec] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8832d]">Keep going</p><p className="mt-2 text-sm font-semibold">Your Concierge stays with you.</p><p className="mt-1 text-xs leading-5 text-gray-500">Ask anything, then continue with your saved step.</p></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
