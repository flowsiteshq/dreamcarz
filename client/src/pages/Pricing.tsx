import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  ArrowRight,
  BadgeDollarSign,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

type Plan = {
  id: string;
  name: string;
  enrollment: string;
  monthly: string;
  vehicleAccess: string;
  description: string;
  inventoryPath: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    enrollment: "$0",
    monthly: "No monthly fee",
    vehicleAccess: "Available rentals",
    description: "Explore available DreamCarz rental paths before selecting a paid membership.",
    inventoryPath: "/fleet?access=entry",
  },
  {
    id: "freedom",
    name: "Freedom",
    enrollment: "$199",
    monthly: "$39 monthly",
    vehicleAccess: "Rental access",
    description: "A membership path for qualifying rental access and the next stage of your transportation plan.",
    inventoryPath: "/fleet?access=entry",
  },
  {
    id: "plus",
    name: "Plus",
    enrollment: "$499",
    monthly: "$99 monthly",
    vehicleAccess: "Plus Subscribe & Save",
    description: "A membership path designed for members exploring eligible subscription and rental options.",
    inventoryPath: "/fleet?access=mid-range",
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    enrollment: "$1,499",
    monthly: "$149 monthly",
    vehicleAccess: "Pro Subscribe & Save",
    description: "A membership path for qualifying members seeking broader program-level vehicle options.",
    inventoryPath: "/fleet?access=mid-range",
  },
  {
    id: "elite",
    name: "Elite",
    enrollment: "$2,965",
    monthly: "$249 monthly",
    vehicleAccess: "Elite Lease to Own",
    description: "A membership path for qualifying Elite-level vehicle programs and lease-to-own exploration.",
    inventoryPath: "/fleet?access=elite",
  },
  {
    id: "silver",
    name: "Silver",
    enrollment: "$4,785",
    monthly: "$399 monthly",
    vehicleAccess: "Silver vehicles & below",
    description: "A premium membership path for qualifying members exploring Silver-level and lower programs.",
    inventoryPath: "/fleet?access=elite",
  },
  {
    id: "gold",
    name: "Gold",
    enrollment: "$9,985",
    monthly: "$699 monthly",
    vehicleAccess: "Gold vehicles & below",
    description: "A premium membership path for qualifying vehicle, host, and fleet participation programs.",
    inventoryPath: "/fleet?access=elite",
  },
  {
    id: "black",
    name: "Black",
    enrollment: "$24,950",
    monthly: "$1,250 monthly",
    vehicleAccess: "Black & exotic access",
    description: "An application-led membership path for qualifying Black-level and exotic vehicle programs.",
    inventoryPath: "/fleet?access=elite",
  },
];

const vehiclePaths = [
  {
    title: "Entry vehicle access",
    description: "Start with the current inventory that is aligned to everyday, lower-tier vehicle options.",
    route: "/fleet?access=entry",
    label: "Explore entry vehicles",
  },
  {
    title: "Mid-range vehicle access",
    description: "Explore mid-range vehicles after choosing the membership path that fits your transportation plan.",
    route: "/fleet?access=mid-range",
    label: "Explore mid-range vehicles",
  },
  {
    title: "Elite vehicle access",
    description: "Explore the highest access group in the current confirmed inventory. Availability is confirmed vehicle by vehicle.",
    route: "/fleet?access=elite",
    label: "Explore elite access",
  },
];

export default function Pricing() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main>
        <section className="bg-[#f8f8f5] pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="container">
            <div className="max-w-3xl reveal">
              <p className="section-label mb-4">Clear pricing, one transportation path</p>
              <h1 className="font-display max-w-3xl text-5xl font-bold tracking-[-0.055em] sm:text-6xl lg:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
                Membership is one cost. <span className="text-[#b08c2d]">Your vehicle is another.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg" style={{ fontFamily: "var(--font-sans)" }}>
                DreamCarz keeps the two decisions separate. First choose the membership that fits your path. Then choose a vehicle and review its rental, subscription, lease-to-own, or purchase terms before you move forward.
              </p>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 md:grid-cols-2 reveal delay-100">
              <div className="bg-white p-7 sm:p-9">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"><CircleDollarSign size={20} /></div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b08c2d]">Step 1</p>
                <h2 className="mt-2 font-display text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Choose monthly membership</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">Enrollment and monthly membership are shown together for every plan below. This is the program membership cost.</p>
              </div>
              <div className="bg-white p-7 sm:p-9">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#b08c2d] text-white"><CarFront size={20} /></div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b08c2d]">Step 2</p>
                <h2 className="mt-2 font-display text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Choose vehicle access</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">Rental, subscription, lease-to-own, purchase, insurance, taxes, and vehicle charges are vehicle-specific and are shown separately before a request is confirmed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-100 bg-white py-10">
          <div className="container grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6c18a] text-[#b08c2d]"><ShieldCheck size={20} /></div>
            <p className="max-w-5xl text-sm leading-6 text-gray-600">
              <strong className="text-black">Important:</strong> joining a membership does not include a vehicle. Vehicle availability, activation, rental, subscription, lease-to-own, insurance, taxes, purchase terms, and any other vehicle charge are reviewed separately for the vehicle you select.
            </p>
          </div>
        </section>

        <section className="py-20 sm:py-24" id="membership-plans">
          <div className="container">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl reveal">
                <p className="section-label mb-3">Monthly membership</p>
                <h2 className="font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>Choose the plan that opens your path.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-gray-500 reveal delay-100">The enrollment amount and recurring monthly amount are both visible on every card. No vehicle price is blended into these membership numbers.</p>
            </div>

            <div className="mt-11 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan, index) => (
                <article key={plan.id} className={`relative flex min-h-[390px] flex-col rounded-2xl border p-6 reveal ${plan.featured ? "border-black bg-black text-white" : "border-gray-200 bg-white"}`} style={{ transitionDelay: `${Math.min(index, 4) * 60}ms` }}>
                  {plan.featured && <span className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"><Sparkles size={12} /> Most selected</span>}
                  <p className={`text-xs font-bold uppercase tracking-[0.17em] ${plan.featured ? "text-[#d9bf73]" : "text-[#ad8c36]"}`}>{plan.name}</p>
                  <div className="mt-5 border-b border-current/10 pb-5">
                    <p className={`font-display text-4xl font-bold ${plan.featured ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)" }}>{plan.enrollment}</p>
                    <p className={`mt-1 text-xs uppercase tracking-[0.14em] ${plan.featured ? "text-gray-400" : "text-gray-500"}`}>one-time enrollment</p>
                    <p className={`mt-4 text-lg font-semibold ${plan.featured ? "text-white" : "text-black"}`}>{plan.monthly}</p>
                  </div>
                  <div className="mt-5 flex-1">
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${plan.featured ? "text-gray-400" : "text-gray-500"}`}>Vehicle program</p>
                    <h3 className={`mt-2 font-display text-xl font-bold ${plan.featured ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)" }}>{plan.vehicleAccess}</h3>
                    <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-gray-300" : "text-gray-600"}`}>{plan.description}</p>
                  </div>
                  <div className="mt-7 grid gap-2">
                    <Link href={`${plan.inventoryPath}&plan=${plan.id}`} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${plan.featured ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-800"}`}>Explore matching vehicles <ArrowRight size={15} /></Link>
                    <Link href={`/login?plan=${plan.id}`} className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${plan.featured ? "border-white/30 text-white hover:bg-white/10" : "border-gray-300 text-black hover:border-black"}`}>Start membership selection</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f8f5] py-20 sm:py-24" id="vehicle-access">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div className="reveal">
                <p className="section-label mb-3">Vehicle access comes next</p>
                <h2 className="font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>See the vehicle cost before you commit.</h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-gray-600">Choose your vehicle group, open a confirmed vehicle, then choose Rent or Buy. The vehicle request shows the path you selected; it does not fold an unknown vehicle cost into a monthly membership charge.</p>
              </div>
              <div className="grid gap-3 reveal delay-100">
                {vehiclePaths.map((path, index) => (
                  <Link key={path.title} href={path.route} className="group grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-black sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d6c18a] text-xs font-bold text-[#aa862a]">0{index + 1}</span>
                    <span>
                      <strong className="block font-display text-xl text-black" style={{ fontFamily: "var(--font-display)" }}>{path.title}</strong>
                      <span className="mt-1 block text-sm leading-6 text-gray-600">{path.description}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-black">{path.label} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container grid gap-8 rounded-3xl bg-black p-8 text-white sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="reveal">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9bf73]">A clearer way to move forward</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Pick your membership. Then pick your vehicle.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-300">You will always see which price belongs to membership and which cost belongs to vehicle access. Review terms before submitting a request.</p>
            </div>
            <div className="flex flex-wrap gap-3 reveal delay-100">
              <a href="#membership-plans" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Compare memberships <BadgeDollarSign size={16} /></a>
              <Link href="/fleet" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">View confirmed vehicles <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
