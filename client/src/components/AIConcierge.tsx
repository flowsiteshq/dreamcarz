/**
 * DreamCarz AI Concierge — persistent floating prompt bar
 * Lives at the bottom of every dashboard page.
 * Answers FAQs, routes to any feature, acts as the source of truth.
 */
import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ChevronRight, Send, Minimize2 } from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  actions?: { label: string; href: string }[];
}

// ── Knowledge base ──────────────────────────────────────────────────────────
const knowledgeBase: { patterns: RegExp[]; answer: string; actions?: { label: string; href: string }[] }[] = [
  {
    patterns: [/dcp|dream carz point|loyalty point|point balance|how many point/i],
    answer: "DCP (Dream Carz Points) are earned on every dollar you spend with DreamCarz. Your current balance is **285,000 DCP** worth **$2,850** in transportation purchasing power. Pro members earn at a **1.2x multiplier**.",
    actions: [{ label: "View Rewards", href: "/dashboard/rewards" }],
  },
  {
    patterns: [/extend|more day|longer|keep the car/i],
    answer: "You can extend your current Porsche 911 rental directly from My Vehicles. Select the car, tap **Extend**, choose your additional days, and we'll confirm within 1 hour.",
    actions: [{ label: "Extend Rental", href: "/dashboard/vehicles" }],
  },
  {
    patterns: [/swap|different car|change vehicle|switch car/i],
    answer: "You can request a vehicle swap from My Vehicles. Tap **Manage → Swap Vehicle** and our concierge team will contact you within 2 hours to arrange the swap.",
    actions: [{ label: "My Vehicles", href: "/dashboard/vehicles" }],
  },
  {
    patterns: [/upgrade|elite|pro|plus|freedom|tier|membership level/i],
    answer: "DreamCarz has 4 membership tiers:\n• **Freedom** — $199/mo, 1x DCP, up to $20K vehicles\n• **Plus** — $299/mo, 1.1x DCP, up to $50K vehicles\n• **Pro** — $499/mo, 1.2x DCP, up to $80K vehicles\n• **Elite** — $999/mo, 1.5x DCP, unlimited fleet\n\nYou're currently on **Pro**. Contact us to upgrade to Elite.",
    actions: [{ label: "View Membership", href: "/dashboard/membership" }, { label: "Call Us", href: "tel:3017722500" }],
  },
  {
    patterns: [/payment|bill|charge|invoice|how much|cost|price/i],
    answer: "Your current plan is **Pro Member at $499/month**, renewing Jun 28, 2026. You can view all past payments, invoices, and your payment method on the Payments page.",
    actions: [{ label: "View Payments", href: "/dashboard/payments" }],
  },
  {
    patterns: [/reservation|book|reserve|upcoming|schedule/i],
    answer: "You have **1 active rental** (Porsche 911 Carrera S, 18 days remaining) and **1 upcoming reservation** (Range Rover Sport SE, starting May 24). View all reservations for full details.",
    actions: [{ label: "View Reservations", href: "/dashboard/reservations" }],
  },
  {
    patterns: [/report|issue|problem|broken|damage|crash|accident|service|repair|maintenance/i],
    answer: "You can report any vehicle issue — from a flat tire to an accident — through our Tesla-style Service Center. Choose the issue type, describe the problem, attach photos, and we'll respond within 2 hours.",
    actions: [{ label: "Report an Issue", href: "/dashboard/report" }],
  },
  {
    patterns: [/location|address|office|where|hours|open|close/i],
    answer: "DreamCarz is located at **10001 Derekwood Ln, Suite 204, Lanham, MD 20706**.\n\n📅 Mon–Fri: 9am–6pm\n📅 Saturday: 9am–3pm\n📅 Sunday: Closed\n\n📞 (301) 772-2500",
    actions: [{ label: "Get Directions", href: "/dashboard/locations" }, { label: "Call Us", href: "tel:3017722500" }],
  },
  {
    patterns: [/contact|call|phone|speak|talk|help|support/i],
    answer: "Our concierge team is available Mon–Fri 9am–6pm and Sat 9am–3pm. Call us at **(301) 772-2500** or submit a support message and we'll respond within 2 hours.",
    actions: [{ label: "Support Center", href: "/dashboard/support" }, { label: "Call Now", href: "tel:3017722500" }],
  },
  {
    patterns: [/credit free|credit.free|free car|no credit|without credit/i],
    answer: "The **Credit Free** program lets qualifying members access vehicles without a traditional credit check. Eligibility is based on your DCP balance, membership tenure, and payment history. Ask our team for your current eligibility status.",
    actions: [{ label: "Contact Concierge", href: "/dashboard/support" }],
  },
  {
    patterns: [/host|list my car|earn with my car|my car on platform/i],
    answer: "The **DreamCarz Host Program** lets you list your personal vehicle on our platform. You keep ownership, we handle bookings, insurance, and payments. Hosts earn competitive per-day rates plus DCP.",
    actions: [{ label: "Learn About Hosting", href: "/dashboard/support" }],
  },
  {
    patterns: [/sign out|log out|logout|signout/i],
    answer: "You can sign out from the **Settings** page or by tapping the sign-out icon at the bottom of the sidebar.",
    actions: [{ label: "Settings", href: "/dashboard/settings" }],
  },
  {
    patterns: [/dashboard|home|main/i],
    answer: "Taking you back to your main dashboard overview.",
    actions: [{ label: "Go to Dashboard", href: "/dashboard" }],
  },
  {
    patterns: [/vehicle|car|fleet|garage|my car/i],
    answer: "Your garage currently has **1 active rental** (Porsche 911 Carrera S), **1 upcoming reservation** (Range Rover Sport SE), and **1 wishlist vehicle** (Porsche 911 Turbo S). Browse the full fleet to add more.",
    actions: [{ label: "My Vehicles", href: "/dashboard/vehicles" }],
  },
  {
    patterns: [/reward|redeem|cashback|gift|perk/i],
    answer: "Your **285,000 DCP** can be redeemed for rental credits, membership discounts, vehicle upgrades, and exclusive experiences. At your Pro 1.2x multiplier, that's **$3,420 in transportation power**.",
    actions: [{ label: "View Rewards", href: "/dashboard/rewards" }],
  },
];

const suggestions = [
  "How do I extend my rental?",
  "What's my DCP balance?",
  "How do I upgrade my membership?",
  "Report a vehicle issue",
  "Where is the DreamCarz office?",
  "How do I swap my car?",
];

function getAIResponse(query: string): { answer: string; actions?: { label: string; href: string }[] } {
  const q = query.toLowerCase().trim();
  for (const entry of knowledgeBase) {
    if (entry.patterns.some(p => p.test(q))) {
      return { answer: entry.answer, actions: entry.actions };
    }
  }
  return {
    answer: "I'm here to help with anything DreamCarz related — reservations, DCP balance, membership upgrades, vehicle service, payments, and more. Could you rephrase your question or choose a topic below?",
    actions: [
      { label: "My Vehicles", href: "/dashboard/vehicles" },
      { label: "Support", href: "/dashboard/support" },
    ],
  };
}

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} className="mb-0.5 last:mb-0" dangerouslySetInnerHTML={{ __html: bold }} />;
    });
}

export default function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi! I'm your DreamCarz AI Concierge. Ask me anything — reservations, DCP balance, membership, service requests, or anything else about your account.",
      actions: [
        { label: "My Vehicles", href: "/dashboard/vehicles" },
        { label: "Rewards", href: "/dashboard/rewards" },
        { label: "Support", href: "/dashboard/support" },
      ],
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized, messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.answer,
        actions: response.actions,
      };
      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);
    }, 700);
  };

  const handleAction = (href: string) => {
    if (href.startsWith("tel:") || href.startsWith("mailto:")) {
      window.location.href = href;
    } else {
      navigate(href);
      setMinimized(true);
    }
  };

  return (
    <>
      {/* Floating pill trigger */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-black text-white rounded-full shadow-lg hover:bg-gray-900 transition-all duration-200 active:scale-95"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
        >
          <Sparkles size={15} className="text-yellow-400" />
          <span className="text-[13px] font-semibold">Ask DreamCarz</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed z-50 bg-white rounded-3xl shadow-2xl transition-all duration-300 ${minimized ? "bottom-5 right-5 w-auto" : "bottom-5 right-5 w-[340px] sm:w-[380px]"}`}
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: minimized ? "auto" : "70vh" }}
        >
          {minimized ? (
            /* Minimized pill */
            <button
              onClick={() => setMinimized(false)}
              className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 transition-colors active:scale-95"
            >
              <Sparkles size={15} className="text-yellow-400" />
              <span className="text-[13px] font-semibold">Ask DreamCarz</span>
              <div className="w-2 h-2 rounded-full bg-green-400 ml-1" />
            </button>
          ) : (
            <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                    <Sparkles size={13} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-black">DreamCarz Concierge</p>
                    <p className="text-[10px] text-green-500 font-medium">● Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMinimized(true)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                    <Minimize2 size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${msg.role === "user" ? "bg-black text-white rounded-2xl rounded-br-sm" : "bg-gray-50 text-black rounded-2xl rounded-bl-sm border border-gray-100"} px-3.5 py-2.5`}>
                      <div className="text-[12px] leading-relaxed">
                        {renderMarkdown(msg.text)}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.actions.map((a, i) => (
                            <button key={i} onClick={() => handleAction(a.href)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[10px] font-semibold rounded-full hover:bg-gray-800 transition-colors">
                              {a.label} <ChevronRight size={9} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)}
                        className="flex-shrink-0 px-3 py-1.5 bg-gray-100 text-black text-[10px] font-medium rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100 focus-within:border-gray-300 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendMessage(input); }}
                    placeholder="Ask anything about DreamCarz..."
                    className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none"
                  />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${input.trim() ? "bg-black hover:bg-gray-800" : "bg-gray-200"}`}>
                    <Send size={12} className={input.trim() ? "text-white" : "text-gray-400"} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
