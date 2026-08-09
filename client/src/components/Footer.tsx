/* DreamCarz Network — Footer (Dream Drive style)
 * Dark footer with logo, links, newsletter signup
 */
import { Link } from "wouter";
import { Instagram, Twitter, Facebook, ArrowRight, MapPin, Phone, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container py-16">
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
            <p className="text-sm text-gray-400 leading-relaxed mb-6" style={{ fontFamily: "var(--font-sans)" }}>
              Your trusted partner for premium automotive membership. The longer you stay, the more valuable your transportation relationship becomes.
            </p>
            <div className="flex items-center gap-3">
              {[<Facebook size={16} />, <Twitter size={16} />, <Instagram size={16} />].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/50 transition-colors">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Quick Links</h4>
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
                  <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                  10001 Derekwood Ln, Suite 204<br />Lanham, MD 20706
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-gray-500 flex-shrink-0" />
                <a href="tel:+13017722500" className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                  (301) 772-2500
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                  Mon – Fri: 9:00 am – 6:00 pm<br />
                  Saturday: 9:00 am – 3:00 pm<br />
                  Sunday: Closed
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Enter Your Email Address</h4>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-white/50 transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              />
              <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-100 transition-colors flex-shrink-0">
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3" style={{ fontFamily: "var(--font-sans)" }}>Subscribe to our newsletter for updates.</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
            © {new Date().getFullYear()} DreamCarz Network. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms & Conditions", "Cookie Policy", "FAQ"].map((item) => (
              <a
                key={item}
                href={item === "Privacy Policy" ? "/privacy-policy" : item === "Terms & Conditions" ? "/terms" : item === "FAQ" ? "/faq" : "/cookie-policy"}
                className="text-xs text-gray-500 hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
