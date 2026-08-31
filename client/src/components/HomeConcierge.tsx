import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, MessageCircleMore, Sparkles } from "lucide-react";
import { Link } from "wouter";

function firstName(name: string | null | undefined) { return name?.trim().split(/\s+/)[0] || "there"; }

export function HomeConcierge() {
  const { user, isAuthenticated } = useAuth();
  return <section aria-label="DreamCarz Concierge" className="mx-auto max-w-7xl pb-8 pt-8">
    <div className="grid overflow-hidden border border-[#e5ddce] bg-white md:grid-cols-[0.72fr_1.28fr]">
      <div className="bg-black px-6 py-7 text-white sm:px-8"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#d3b25d]/60"><Sparkles size={16} className="text-[#d3b25d]" /></span><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d3b25d]">DreamCarz Concierge</p></div><h2 className="mt-6 max-w-sm font-display text-3xl font-bold leading-[0.96] tracking-[-0.05em]">{isAuthenticated ? `Welcome back, ${firstName(user?.name)}.` : "Meet your personal vehicle concierge."}</h2></div>
      <div className="flex flex-col justify-center px-6 py-7 sm:px-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8832d]"><MessageCircleMore size={14} /> A dedicated guided experience</div><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Ask naturally, compare only confirmed vehicles as visual cards, and choose when to save your vehicle path. We keep required identity, document, and payment steps protected and separate.</p><Link href="/concierge" className="mt-6 inline-flex h-11 w-fit items-center gap-2 bg-black px-5 text-sm font-semibold text-white">Start a concierge conversation <ArrowRight size={15} /></Link></div>
    </div>
  </section>;
}
