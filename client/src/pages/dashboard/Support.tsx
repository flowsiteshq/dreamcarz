import DashboardShell from "@/components/DashboardShell";
import { Headphones, Phone, Mail, MessageSquare, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const faqs = [
  { q: "How do I extend my current rental?", a: "Call us at (301) 772-2500 or use the 'Extend Rental' button on your dashboard. Extensions are subject to vehicle availability." },
  { q: "How do I earn DCP points?", a: "You earn DCP on every membership payment, vehicle transaction, and rental activity. Pro members earn at a 1.2x multiplier." },
  { q: "What is Transportation Power?", a: "Transportation Power is your DCP balance multiplied by your tier multiplier — it represents the real-dollar value you can apply toward vehicle purchases or rentals." },
  { q: "How does Credit Free work?", a: "Elite members who accumulate sufficient DCP can apply their Transportation Power toward a vehicle purchase, potentially reducing or eliminating financing needs." },
  { q: "Can I swap my vehicle mid-rental?", a: "Pro and Elite members can request a vehicle swap. Contact our concierge team to check availability and process the swap." },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  return (
    <DashboardShell title="Support">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Support</h2>
          <p className="text-sm text-gray-400 mt-0.5">We're here to help — 24/7 concierge for Pro & Elite members</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Phone, label: "Call Us", value: "(301) 772-2500", action: "tel:3017722500", cta: "Call Now" },
            { icon: Mail, label: "Email Us", value: "support@dreamcarz.com", action: "mailto:support@dreamcarz.com", cta: "Send Email" },
            { icon: MessageSquare, label: "Live Chat", value: "Available Mon–Sat", action: "#", cta: "Start Chat" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mb-3">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">{c.label}</p>
                <p className="text-[13px] font-semibold text-black mb-3">{c.value}</p>
                <a href={c.action} className="block w-full text-center py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">{c.cta}</a>
              </div>
            );
          })}
        </div>

        {/* Quick message */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-[14px] font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Send a Message</h3>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            className="w-full h-28 p-3 bg-gray-50 rounded-xl text-[13px] text-black placeholder-gray-300 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={11} /> Typical response: under 2 hours</p>
            <button disabled={!message.trim()} className={`px-5 py-2 text-[12px] font-semibold rounded-full transition-colors ${message.trim() ? "bg-black text-white hover:bg-gray-900" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Send Message
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-[13px] font-medium text-black pr-4">{faq.q}</span>
                  <ChevronRight size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-[12px] text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

