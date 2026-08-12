import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ChevronDown, Search, Phone, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";

const categories = [
  {
    id: "membership",
    label: "Membership & Tiers",
    questions: [
      {
        q: "What membership tiers does DreamCarz offer?",
        a: "DreamCarz offers four membership tiers:\n\n• **Freedom** ($39.95/mo) — cancel anytime, DCP on qualifying activity, Credit Free access starts day 1 for qualifying members, roadside assistance\n• **Plus** ($69.95/mo) — enhanced access and DCP benefits\n• **Pro** ($99.95/mo) — enhanced DCP benefits, Interest Free and Drive Free eligibility\n• **Elite** ($149.95/mo) — maximum benefits and Be Free ownership-pathway eligibility\n\nProgram eligibility is subject to applicable terms.",
      },
      {
        q: "Can I upgrade or downgrade my membership?",
        a: "Yes. You can request a tier change at any time by contacting our concierge team at (301) 772-2500 or visiting our office. Upgrades take effect immediately. Downgrades take effect at your next billing cycle.",
      },
      {
        q: "Is there a contract or long-term commitment?",
        a: "Freedom membership starts at $39.95 per month and can be cancelled anytime. Any additional program terms, promotional offers, and eligibility requirements are provided during enrollment.",
      },
      {
        q: "What is the Founding Member benefit?",
        a: "Founding Members who join during our launch period receive a locked-in rate for life, a 2x DCP bonus on their first 6 months, priority vehicle access, and exclusive invitations to DreamCarz events.",
      },
      {
        q: "How do I cancel my membership?",
        a: "To cancel, contact our team at (301) 772-2500 or visit 10001 Derekwood Ln, Suite 204, Lanham, MD 20706. Please provide 30 days' notice. Your DCP balance is retained for 12 months after cancellation.",
      },
    ],
  },
  {
    id: "dcp",
    label: "DCP (Dream Carz Points)",
    questions: [
      {
        q: "What are DCP (Dream Carz Points)?",
        a: "DCP (Dream Carz Points) are DreamCarz's proprietary loyalty currency. You earn DCP on every dollar you spend — monthly membership fees, vehicle upgrades, and add-on services. DCP accumulates over time and converts into real transportation purchasing power.",
      },
      {
        q: "How do I earn DCP?",
        a: "You can earn DCP on qualifying activity including:\n\n• Membership payments\n• Vehicle rentals\n• RTO/LTO payments\n• Vehicle purchases\n• Referrals once a referral becomes a member\n• Anniversary activity\n\nAvailability and amounts are subject to program terms.",
      },
      {
        q: "How do I redeem DCP?",
        a: "Eligible DCP can be redeemed for:\n\n• Free rental days\n• Lease and interest credits\n• Down-payment assistance\n• Vehicle-purchase credits\n• Service and maintenance savings\n• Exclusive member perks\n\nContact our concierge team to review your eligible redemption options.",
      },
      {
        q: "What is the DCP multiplier?",
        a: "The DCP multiplier increases the value of your accumulated points. A 1.2x multiplier (Pro tier) means every 1,000 DCP is worth $12 in transportation power instead of $10. Elite members at 1.5x get $15 per 1,000 DCP.",
      },
      {
        q: "Do DCP points expire?",
        a: "DCP points remain active as long as your membership is active. If you cancel, your DCP balance is retained for 12 months. After 12 months of inactivity, points may expire. Founding Members receive lifetime DCP retention.",
      },
    ],
  },
  {
    id: "vehicles",
    label: "Vehicles & Rentals",
    questions: [
      {
        q: "What types of vehicles are available?",
        a: "DreamCarz offers a diverse fleet including:\n\n• **Value** — Honda Civic, Toyota Camry, Nissan Altima, and more (under $20K)\n• **Luxury** — BMW 5 Series, Mercedes E-Class, Audi A6\n• **Sports** — Porsche 911, Chevrolet Corvette, Ford Mustang GT500\n• **Supercar** — Lamborghini Huracán, Ferrari 488, McLaren 720S\n• **Electric** — Tesla Model S, Rivian R1T\n• **SUV** — Range Rover, Cadillac Escalade, BMW X7\n\nVehicle access depends on your membership tier.",
      },
      {
        q: "How long can I keep a vehicle?",
        a: "Standard rentals are monthly (30 days). You can extend your rental in increments of 1–30 additional days through the app or by contacting our concierge. Extensions are subject to vehicle availability.",
      },
      {
        q: "Can I swap my vehicle mid-rental?",
        a: "Yes. Pro and Elite members can request a vehicle swap at any time. Contact our concierge at (301) 772-2500 or use the Manage → Swap Vehicle option in the app. Swaps are subject to availability and may incur a swap fee.",
      },
      {
        q: "Is insurance included?",
        a: "Yes. All DreamCarz rentals include comprehensive insurance coverage. Members are responsible for a deductible in the event of at-fault damage. Full insurance details are provided at enrollment and in your membership agreement.",
      },
      {
        q: "What is the mileage policy?",
        a: "Standard rentals include 1,500 miles per month. Additional miles are available at a per-mile rate depending on your tier. Elite members receive unlimited mileage. Contact our team for details on your specific plan.",
      },
    ],
  },
  {
    id: "creditfree",
    label: "Credit Free Program",
    questions: [
      {
        q: "What is the Credit Free program?",
        a: "Credit Free access starts day 1 for qualifying members and may allow vehicle access without traditional credit-score requirements. Approval is based on ability to pay and other applicable factors.",
      },
      {
        q: "How do I qualify for Credit Free?",
        a: "Credit Free eligibility is evaluated based on:\n\n• Minimum DCP balance threshold (varies by vehicle value)\n• Membership tenure (minimum 6 months)\n• Consistent on-time payment history\n• Active membership in good standing\n\nContact our team to check your current eligibility.",
      },
      {
        q: "What vehicles are available through Credit Free?",
        a: "Credit Free access is available across all vehicle tiers, with the required DCP balance scaling with the vehicle value. Higher-value vehicles require a larger DCP balance. Our concierge can walk you through the specific requirements for any vehicle.",
      },
    ],
  },
  {
    id: "service",
    label: "Service & Support",
    questions: [
      {
        q: "What do I do if my vehicle breaks down?",
        a: "If you experience a breakdown:\n\n1. Ensure your safety first — pull over to a safe location\n2. Call our Emergency Roadside line: **(301) 772-2500**\n3. Use the Service tab in the app to submit an emergency report\n\nWe provide 24/7 roadside assistance for all active rentals.",
      },
      {
        q: "How do I report vehicle damage or an accident?",
        a: "Use the **Report an Issue** section in your dashboard app:\n\n1. Select 'Collision & Glass' or 'Body Damage'\n2. Describe what happened\n3. Attach photos of the damage and scene\n4. Submit — our team responds within 15 minutes for emergencies\n\nFor accidents involving other vehicles, call 911 first, then contact us.",
      },
      {
        q: "How do I schedule a service appointment?",
        a: "Use the **Service** tab in your dashboard, select the issue category (e.g., Maintenance, Tires & Wheels), describe the concern, and submit. Our service coordinator will contact you within 2 hours to schedule an appointment at our Lanham, MD location.",
      },
      {
        q: "What are your office hours?",
        a: "DreamCarz office hours:\n\n• Monday – Friday: 9:00 AM – 6:00 PM\n• Saturday: 9:00 AM – 3:00 PM\n• Sunday: Closed\n\nAddress: 10001 Derekwood Ln, Suite 204, Lanham, MD 20706\nPhone: (301) 772-2500",
      },
    ],
  },
  {
    id: "host",
    label: "Host & Agent Programs",
    questions: [
      {
        q: "How does the DreamCarz Host Program work?",
        a: "The Host Program lets you list your personal vehicle on the DreamCarz platform. You retain full ownership — we handle bookings, insurance, vetting of renters, and payments. Hosts earn a competitive per-day rate plus DCP on every booking.",
      },
      {
        q: "What vehicles qualify for the Host Program?",
        a: "Vehicles must be in excellent condition, pass a DreamCarz inspection, and meet our minimum value and age requirements. Most vehicles under 5 years old with clean titles qualify. Contact our team for a vehicle assessment.",
      },
      {
        q: "What is the DreamCarz Agent/Associate program?",
        a: "The Agent program allows individuals to earn income by referring new members and hosts to DreamCarz. Agents earn cash commissions plus DCP on every successful referral. Contact our team to learn about current commission structures.",
      },
    ],
  },
];

function renderAnswer(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const bullet = bold.startsWith("•") ? `<span class="inline-block w-4 flex-shrink-0">•</span>${bold.slice(1)}` : bold;
    return (
      <p key={i} className={`text-[14px] text-gray-600 leading-relaxed ${line.startsWith("•") ? "flex gap-1 ml-2" : ""}`}
        dangerouslySetInnerHTML={{ __html: bullet }} />
    );
  });
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("membership");
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentCategory = categories.find(c => c.id === activeCategory)!;

  const filteredQuestions = search.trim()
    ? categories.flatMap(c => c.questions.map(q => ({ ...q, category: c.label }))).filter(
        q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
      )
    : currentCategory.questions.map(q => ({ ...q, category: currentCategory.label }));

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-sans)" }}>
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-14 px-6 text-center bg-white border-b border-gray-100">
        <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-3">Help Center</p>
        <h1 className="text-4xl sm:text-5xl font-black text-black mb-4" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 text-base max-w-lg mx-auto mb-8">
          Everything you need to know about DreamCarz memberships, DCP, vehicles, and more.
        </p>
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-full text-sm text-black placeholder-gray-400 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {!search.trim() && (
          /* Category tabs */
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map(c => (
              <button key={c.id} onClick={() => { setActiveCategory(c.id); setOpenQ(null); }}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${activeCategory === c.id ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {search.trim() && (
          <p className="text-sm text-gray-400 mb-6">{filteredQuestions.length} result{filteredQuestions.length !== 1 ? "s" : ""} for "<strong className="text-black">{search}</strong>"</p>
        )}

        {/* Questions */}
        <div className="space-y-2">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-base mb-2">No results found for "{search}"</p>
              <p className="text-sm text-gray-400">Try a different search term or <button onClick={() => setSearch("")} className="text-black underline">browse all categories</button>.</p>
            </div>
          ) : filteredQuestions.map((item, i) => {
            const key = `${item.q}-${i}`;
            const isOpen = openQ === key;
            return (
              <div key={key} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "border-gray-200 shadow-sm" : "border-gray-100"}`}>
                <button onClick={() => setOpenQ(isOpen ? null : key)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                  <div className="flex-1 pr-4">
                    {search.trim() && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{(item as any).category}</p>}
                    <p className="text-[15px] font-semibold text-black">{item.q}</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 space-y-1 border-t border-gray-50">
                    <div className="pt-3 space-y-1">
                      {renderAnswer(item.a)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div className="mt-16 bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
          <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Still have questions?</h3>
          <p className="text-gray-500 text-sm mb-6">Our concierge team is available Mon–Fri 9am–6pm and Sat 9am–3pm.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:3017722500" className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors">
              <Phone size={14} /> (301) 772-2500
            </a>
            <Link href="/contact" className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-black text-sm font-semibold rounded-full hover:border-gray-400 transition-colors">
              <MessageSquare size={14} /> Send a Message
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
