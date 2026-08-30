import { BookOpenCheck, FileCheck2, ShieldCheck } from "lucide-react";

const modules = [
  { icon: ShieldCheck, title: "Consent-first outreach", detail: "Use referral links and lead capture only when contacts have agreed to be contacted." },
  { icon: FileCheck2, title: "Accurate program communication", detail: "Share approved program information and avoid promises about earnings, vehicle access, credit, or customer outcomes." },
  { icon: BookOpenCheck, title: "Referral workflow", detail: "Understand attribution, recorded referral activity, and the difference between a lead, an application, and a completed transaction." },
];

export default function AssociateTrainingHub() {
  return <section className="border border-gray-200 bg-[#f7f5f0] p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Associate learning</p><h3 className="mt-2 font-display text-2xl font-bold text-black">Operate with clarity.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">These operational guides apply to the private Associate workspace. They are educational controls, not a certification, employment relationship, earnings statement, or eligibility guarantee.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{modules.map(module => <article key={module.title} className="border border-[#ded8cf] bg-white p-4"><module.icon className="h-5 w-5 text-[#a8832d]" /><h4 className="mt-3 text-sm font-bold text-black">{module.title}</h4><p className="mt-2 text-xs leading-5 text-gray-600">{module.detail}</p></article>)}</div></section>;
}
