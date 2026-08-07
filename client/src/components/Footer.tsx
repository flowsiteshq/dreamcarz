/* DreamCarz Network — Footer Component
 * Midnight Prestige: dark surface, gold accents, editorial layout
 */
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.07_0.004_280)] border-t border-[oklch(0.72_0.12_75/0.12)]">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                <path d="M18 2L32 9V20C32 27.2 25.8 33.2 18 35C10.2 33.2 4 27.2 4 20V9L18 2Z" fill="oklch(0.72 0.12 75)" fillOpacity="0.15" stroke="oklch(0.72 0.12 75)" strokeWidth="1.5"/>
                <path d="M13 12H19C22.3 12 25 14.7 25 18C25 21.3 22.3 24 19 24H13V12Z" fill="oklch(0.72 0.12 75)"/>
                <path d="M10 22L26 14" stroke="oklch(0.07 0.004 280)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>
                <div className="text-sm font-semibold text-[oklch(0.72_0.12_75)] tracking-widest uppercase" style={{ fontFamily: "var(--font-sans)" }}>DREAMCARZ</div>
                <div className="text-[9px] text-[oklch(0.52_0.01_75)] tracking-widest uppercase" style={{ fontFamily: "var(--font-sans)" }}>NETWORK</div>
              </div>
            </div>
            <p className="text-sm text-[oklch(0.52_0.01_75)] leading-relaxed max-w-xs" style={{ fontFamily: "var(--font-sans)" }}>
              The only automotive ecosystem where loyalty literally pays. The longer you stay, the more valuable your transportation relationship becomes.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.12_75)] animate-pulse-gold"></div>
              <span className="text-xs text-[oklch(0.52_0.01_75)]" style={{ fontFamily: "var(--font-sans)" }}>Founding Member enrollment open</span>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="overline mb-4">Programs</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/membership", label: "Membership Tiers" },
                { href: "/how-it-works", label: "How DCP Works" },
                { href: "/fleet", label: "Vehicle Fleet" },
                { href: "/host", label: "Host Program" },
                { href: "/agent", label: "Agent Opportunity" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[oklch(0.52_0.01_75)] hover:text-[oklch(0.72_0.12_75)] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="overline mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/calculator", label: "Value Calculator" },
                { href: "/dashboard", label: "Member Dashboard" },
                { href: "/calculator", label: "Credit Calculator" },
                { href: "/fleet", label: "Browse Fleet" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-[oklch(0.52_0.01_75)] hover:text-[oklch(0.72_0.12_75)] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="overline mb-4">Company</h4>
            <ul className="space-y-2.5">
              {["About", "Terms of Service", "Privacy Policy", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-[oklch(0.52_0.01_75)] hover:text-[oklch(0.72_0.12_75)] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="gold-rule mt-12 mb-6"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.38_0.006_75)]" style={{ fontFamily: "var(--font-sans)" }}>
            © {new Date().getFullYear()} DreamCarz Network. All rights reserved. DCP is not cash and has no cash value.
          </p>
          <p className="text-xs text-[oklch(0.38_0.006_75)]" style={{ fontFamily: "var(--font-sans)" }}>
            Transportation Purchasing Power subject to program rules and financial validation.
          </p>
        </div>
      </div>
    </footer>
  );
}
