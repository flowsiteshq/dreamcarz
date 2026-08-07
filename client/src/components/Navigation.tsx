/* DreamCarz Network — Simplified AI-First Navigation
 * Only: Fleet | Membership | Locations | About | Sign In
 * Everything else accessible through AI concierge
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const navLinks = [
  { href: "/fleet", label: "Fleet" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Locations" },
  { href: "/how-it-works", label: "About" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-white"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/manus-storage/logo-dark-mark-crop_f052e278.png"
              alt="DreamCarz DC Mark"
              className="h-7 w-auto object-contain"
            />
            <img
              src="/manus-storage/logo-dark-wordmark-crop_bb978492.png"
              alt="DREAMCARZ"
              className="h-[14px] w-auto object-contain hidden sm:block"
            />
          </Link>

          {/* Desktop nav — ultra minimal */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-[13px] tracking-wide transition-colors duration-150 rounded-full ${
                  location === link.href
                    ? "text-black font-semibold"
                    : "text-gray-400 hover:text-black font-medium"
                }`}
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: auth */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? (
              <div className="w-20 h-8 rounded-full bg-gray-100 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 text-[13px] font-semibold text-black border border-gray-200 rounded-full hover:border-gray-400 transition-colors"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-4 py-1.5 text-[13px] text-gray-400 hover:text-black transition-colors font-medium"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => startLogin()}
                className="px-5 py-1.5 text-[13px] font-semibold text-white bg-black rounded-full hover:bg-gray-900 transition-colors active:scale-[0.97]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-black"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm rounded-xl transition-colors ${
                  location === link.href
                    ? "text-black font-semibold bg-gray-50"
                    : "text-gray-500 hover:text-black hover:bg-gray-50 font-medium"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 mt-1">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" className="w-full text-center py-2.5 text-sm font-semibold text-black border border-gray-200 rounded-full" style={{ fontFamily: "var(--font-sans)" }}>Dashboard</Link>
                  <button onClick={() => logout()} className="text-sm text-gray-400 text-center py-2" style={{ fontFamily: "var(--font-sans)" }}>Sign Out</button>
                </div>
              ) : (
                <button onClick={() => startLogin()} className="w-full py-2.5 text-sm font-semibold text-white bg-black rounded-full" style={{ fontFamily: "var(--font-sans)" }}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
