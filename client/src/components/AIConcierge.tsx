/**
 * DreamCarz Concierge — private, account-scoped guidance.
 * Conversation exists only in the current browser view; the server does not persist chat content.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  actions?: { label: string; href: string }[];
}

const suggestions = [
  "Show my current journey",
  "How do I extend my rental?",
  "How do I swap my vehicle?",
  "Report a vehicle issue",
  "What inventory is confirmed?",
  "Where is the office?",
];

function renderText(text: string) {
  return text.split("\n").map((line, index) => <p key={index} className="mb-1 last:mb-0">{line}</p>);
}

export default function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "I can use your authorized DreamCarz membership and journey status, plus confirmed inventory, to guide you to the right next step. I do not store this chat or make availability, eligibility, price, payment, legal, or release decisions.",
      actions: [
        { label: "My Records", href: "/dashboard/transactions" },
        { label: "Support", href: "/dashboard/support" },
      ],
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const guidance = trpc.concierge.guide.useMutation();

  useEffect(() => {
    if (open && !minimized) {
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      window.setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [open, minimized, messages, guidance.isPending]);

  const sendMessage = async (question: string) => {
    const text = question.trim();
    if (!text || guidance.isPending) return;
    setMessages(previous => [...previous, { id: `${Date.now()}-user`, role: "user", text }]);
    setInput("");
    try {
      const response = await guidance.mutateAsync({ question: text });
      setMessages(previous => [...previous, { id: `${Date.now()}-guide`, role: "ai", text: response.answer, actions: response.actions }]);
    } catch {
      setMessages(previous => [...previous, {
        id: `${Date.now()}-unavailable`,
        role: "ai",
        text: "DreamCarz guidance is temporarily unavailable. For an urgent vehicle issue or a decision that requires staff review, please use Support or the Safety & Incident Center.",
        actions: [{ label: "Support", href: "/dashboard/support" }, { label: "Safety & Incident Center", href: "/dashboard/incidents" }],
      }]);
    }
  };

  const handleAction = (href: string) => {
    if (href.startsWith("tel:") || href.startsWith("mailto:")) {
      window.location.href = href;
      return;
    }
    navigate(href);
    setMinimized(true);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-black px-4 py-3 text-white shadow-lg transition-transform duration-200 active:scale-95"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
        >
          <Sparkles size={15} className="text-[#d0a73a]" />
          <span className="text-[13px] font-semibold">Ask DreamCarz</span>
        </button>
      )}

      {open && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-3xl bg-white shadow-2xl transition-all duration-300 ${minimized ? "w-auto" : "w-[340px] sm:w-[380px]"}`} style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: minimized ? "auto" : "70vh" }}>
          {minimized ? (
            <button type="button" onClick={() => setMinimized(false)} className="flex items-center gap-2 rounded-full bg-black px-4 py-3 text-white transition-transform duration-200 active:scale-95">
              <Sparkles size={15} className="text-[#d0a73a]" />
              <span className="text-[13px] font-semibold">Ask DreamCarz</span>
            </button>
          ) : (
            <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
              <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black"><Sparkles size={13} className="text-[#d0a73a]" /></div>
                  <div>
                    <p className="text-[13px] font-bold text-black">DreamCarz Concierge</p>
                    <p className="text-[10px] font-medium text-gray-500">Private live-record guidance</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Minimize DreamCarz Concierge" onClick={() => setMinimized(true)} className="rounded-full p-1.5 transition-colors hover:bg-gray-100"><Minimize2 size={14} className="text-gray-400" /></button>
                  <button type="button" aria-label="Close DreamCarz Concierge" onClick={() => setOpen(false)} className="rounded-full p-1.5 transition-colors hover:bg-gray-100"><X size={14} className="text-gray-400" /></button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 text-[12px] leading-relaxed ${message.role === "user" ? "rounded-2xl rounded-br-sm bg-black text-white" : "rounded-2xl rounded-bl-sm border border-gray-100 bg-[#faf9f6] text-black"}`}>
                      {renderText(message.text)}
                      {message.actions?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{message.actions.map(action => <button key={action.href} type="button" onClick={() => handleAction(action.href)} className="flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-gray-800">{action.label} <ChevronRight size={9} /></button>)}</div> : null}
                    </div>
                  </div>
                ))}
                {guidance.isPending ? <div className="flex justify-start"><div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-100 bg-[#faf9f6] px-4 py-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" /></div></div> : null}
                <div ref={bottomRef} />
              </div>

              {messages.length <= 2 ? <div className="flex-shrink-0 px-4 pb-2"><div className="flex gap-1.5 overflow-x-auto pb-1">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={guidance.isPending} className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-medium text-black transition-colors hover:bg-gray-200 disabled:opacity-50">{suggestion}</button>)}</div></div> : null}

              <div className="flex-shrink-0 px-4 pb-4"><p className="mb-2 text-[10px] leading-4 text-gray-400">Guidance only. Staff review controls availability, eligibility, pricing, payment, agreements, and vehicle release.</p><div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#faf9f6] px-3 py-2 focus-within:border-gray-300"><input ref={inputRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void sendMessage(input); }} placeholder="Ask about your DreamCarz journey..." className="flex-1 bg-transparent text-[13px] text-black outline-none placeholder:text-gray-300" maxLength={800} /><button type="button" aria-label="Send DreamCarz question" onClick={() => void sendMessage(input)} disabled={!input.trim() || guidance.isPending} className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${input.trim() && !guidance.isPending ? "bg-black hover:bg-gray-800" : "bg-gray-200"}`}><Send size={12} className={input.trim() && !guidance.isPending ? "text-white" : "text-gray-400"} /></button></div></div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
