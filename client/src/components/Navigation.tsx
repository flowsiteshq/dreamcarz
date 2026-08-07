/* DreamCarz Network — Navigation Component
 * Midnight Prestige design: transparent → dark blur on scroll, gold accents
 * Logo: diamond mark + DREAMCARZ wordmark
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/membership", label: "Membership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/host", label: "Host Program" },
  { href: "/agent", label: "Agents" },
  { href: "/calculator", label: "Calculator" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(0.085_0.005_280/0.92)] backdrop-blur-xl border-b border-[oklch(0.72_0.12_75/0.1)]"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M18 2L32 9V20C32 27.2 25.8 33.2 18 35C10.2 33.2 4 27.2 4 20V9L18 2Z"
                  fill="oklch(0.72 0.12 75)"
                  fillOpacity="0.15"
                  stroke="oklch(0.72 0.12 75)"
                  strokeWidth="1.5"
                />
                <path
                  d="M13 12H19C22.3 12 25 14.7 25 18C25 21.3 22.3 24 19 24H13V12Z"
                  fill="oklch(0.72 0.12 75)"
                />
                <path
                  d="M10 22L26 14"
                  stroke="oklch(0.085 0.005 280)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.12em" }}
                className="text-sm font-700 text-[oklch(0.72_0.12_75)] uppercase tracking-widest"
              >
                DREAMCARZ
              </span>
              <span
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.08em" }}
                className="text-[9px] font-400 text-[oklch(0.52_0.01_75)] uppercase tracking-widest"
              >
                NETWORK
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-sm ${
                  location === link.href
                    ? "text-[oklch(0.72_0.12_75)]"
                    : "text-[oklch(0.65_0.008_75)] hover:text-[oklch(0.94_0.008_75)]"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[oklch(0.65_0.008_75)] hover:text-[oklch(0.94_0.008_75)] transition-colors px-3 py-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Sign In
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] text-sm font-600 rounded-sm hover:bg-[oklch(0.82_0.14_78)] transition-all duration-150 active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}
            >
              Join Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[oklch(0.72_0.12_75)]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[oklch(0.085_0.005_280/0.97)] backdrop-blur-xl border-t border-[oklch(0.72_0.12_75/0.1)]">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                  location === link.href
                    ? "text-[oklch(0.72_0.12_75)] bg-[oklch(0.72_0.12_75/0.08)]"
                    : "text-[oklch(0.65_0.008_75)] hover:text-[oklch(0.94_0.008_75)]"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[oklch(0.72_0.12_75/0.1)] flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-3 text-sm font-medium text-[oklch(0.65_0.008_75)] hover:text-[oklch(0.94_0.008_75)] transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Sign In
              </Link>
              <Link
                href="/membership"
                className="mx-4 py-3 bg-[oklch(0.72_0.12_75)] text-[oklch(0.085_0.005_280)] text-sm font-600 rounded-sm text-center hover:bg-[oklch(0.82_0.14_78)] transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
