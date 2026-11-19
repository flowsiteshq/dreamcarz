/* DreamCarz Network — Footer (Dream Drive style)
 * Dark footer with logo, links, newsletter signup
 */
import { Link } from "wouter";
import { Instagram, Twitter, Facebook, ArrowRight, MapPin, Phone, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#302d27] bg-[#1f1e1b] text-white">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/manus-storage/logo-light-mark-crop_649262e4.png"
                alt="DreamCarz DC Mark"
                className="h-9 w-auto object-contain"
              />
              <img
                src="/manus-storage/logo-light-wordmark-crop_9e0a8d00.png"
                alt="DREAMCARZ"
                className="h-4 w-auto object-contain"
              />
            </div>
            <p className="max-w-xs text-sm leading-7 text-[#c4c0b8]" style={{ fontFamily: "var(--font-sans)" }}>
              Freedom. Drive. Earn. Dream Carz is a complete automotive ecosystem that helps members save, earn, and build freedom through vehicles, rewards, and relationships.
            </p>
            <div className="flex items-center gap-3">
              {[<Facebook size={16} />, <Twitter size={16} />, <Instagram size={16} />].map((icon, i) => (
                <a key={i} href="#" aria-label={["Facebook", "Twitter", "Instagram"][i]} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-[#aaa59b] transition-colors hover:border-[#d5b464] hover:text-[#f0d58b]">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="eyebrow mb-5 text-[#d5b464]">Explore</h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/how-it-works", label: "About Us" },
                { href: "/fleet", label: "Our Fleet" },
                { href: "/membership", label: "Membership" },
                { href: "/host", label: "Host Program" },
                { href: "/agent", label: "Agent Opportunity" },
                { href: "/opportunity", label: "Drive Network" },
              { href: "/calculator", label: "Value Calculator" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact Us" },
            ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#aaa59b] transition-colors hover:text-white" style={{ fontFamily: "var(--font-sans)" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="eyebrow mb-5 text-[#d5b464]">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed text-[#aaa59b]" style={{ fontFamily: "var(--font-sans)" }}>
                  10001 Derekwood Ln, Suite 204<br />Lanham, MD 20706
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-gray-500 flex-shrink-0" />
                  <a href="tel:+13017722500" className="text-sm text-[#aaa59b] transition-colors hover:text-white" style={{ fontFamily: "var(--font-sans)" }}>
                  (301) 772-2500
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed text-[#aaa59b]" style={{ fontFamily: "var(--font-sans)" }}>
                  Mon – Fri: 9:00 am – 6:00 pm<br />
                  Saturday: 9:00 am – 3:00 pm<br />
                  Sunday: Closed
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="eyebrow mb-5 text-[#d5b464]">Stay in the loop</h4>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#77736b] focus:border-[#d5b464]"
                style={{ fontFamily: "var(--font-sans)" }}
              />
              <button aria-label="Subscribe" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#d5b464] text-[#1f1e1b] transition-colors hover:bg-[#e7c978]">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#77736b]" style={{ fontFamily: "var(--font-sans)" }}>Occasional updates on vehicles, membership, and the DreamCarz network.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-[#77736b]" style={{ fontFamily: "var(--font-sans)" }}>
            © {new Date().getFullYear()} DreamCarz Network. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            {["Privacy Policy", "Terms & Conditions", "Cookie Policy", "FAQ"].map((item) => (
              <a
                key={item}
                href={item === "Privacy Policy" ? "/privacy-policy" : item === "Terms & Conditions" ? "/terms" : item === "FAQ" ? "/faq" : "/cookie-policy"}
                className="text-xs text-[#77736b] transition-colors hover:text-white"
                style={{ fontFamily: "var(--font-sans)" }}
              >{item}</a>
            ))}
            <Link href="/admin" className="text-[10px] text-[#5f5b54] transition-colors hover:text-[#aaa59b]" aria-label="Administrator login">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
