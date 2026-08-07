/* DreamCarz Network — Navigation (Dream Drive style)
 * White background, minimal links, black pill CTA button
 * Matches reference: Dream Drive nav with logo left, links center, contact right
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "About Us" },
  { href: "/fleet", label: "Our Fleet" },
  { href: "/membership", label: "Car Brands" },
  { href: "/host", label: "Our Services" },
  { href: "/agent", label: "Lease To Own" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-[70px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-display text-xl font-bold text-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Dream<span className="text-black">Carz</span>
            </span>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 text-sm transition-colors duration-150 rounded-full ${
                  location === link.href
                    ? "text-black font-semibold"
                    : "text-gray-500 hover:text-black font-medium"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: search + CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-black transition-colors" aria-label="Search">
              <Search size={18} />
            </button>
            {loading ? (
              <div className="w-24 h-9 rounded-full bg-gray-100 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="btn-outline text-sm px-4 py-2">
                  Dashboard
                </Link>
                <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-black transition-colors font-medium" style={{ fontFamily: "var(--font-sans)" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => startLogin()} className="btn-primary text-sm">
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
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 text-sm rounded-lg transition-colors ${
                  location === link.href
                    ? "text-black font-semibold bg-gray-50"
                    : "text-gray-500 hover:text-black hover:bg-gray-50 font-medium"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
          <div className="pt-3 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" className="btn-outline w-full justify-center text-sm">Dashboard</Link>
                  <button onClick={() => logout()} className="text-sm text-gray-500 text-center py-2" style={{ fontFamily: "var(--font-sans)" }}>Sign Out</button>
                </div>
              ) : (
                <button onClick={() => startLogin()} className="btn-primary w-full justify-center text-sm">
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
