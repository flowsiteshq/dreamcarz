/* DreamCarz Network — Navigation matching reference design
 * Light gray bg, DC mark + wordmark, minimal links, dark pill Sign In
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const navLinks = [
  { href: "/concierge", label: "Concierge" },
  { href: "/fleet", label: "Fleet" },
  { href: "/membership", label: "Members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Locations" },
  { href: "/opportunity", label: "Associate Path" },
  { href: "/opportunity#fleet-partner", label: "Fleet Partners" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();
  const isConciergeWorkspace = location === "/concierge";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isConciergeWorkspace ? "border-b border-white/10 bg-black text-white" : scrolled ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={isConciergeWorkspace ? "/manus-storage/logo-light-mark-crop_649262e4.png" : "/manus-storage/logo-dark-mark-crop_f052e278.png"} alt="DC" className="h-8 w-auto object-contain" />
            <img src={isConciergeWorkspace ? "/manus-storage/logo-light-wordmark-crop_9e0a8d00.png" : "/manus-storage/logo-dark-wordmark-crop_bb978492.png"} alt="DREAMCARZ" className="h-[13px] w-auto object-contain hidden sm:block" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-[13.5px] font-medium transition-colors duration-150 rounded-full ${
                  location === link.href ? (isConciergeWorkspace ? "text-[#d5b35b] font-semibold" : "text-black font-semibold") : (isConciergeWorkspace ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black")
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: auth */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? (
              <div className="w-24 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-full transition-colors ${isConciergeWorkspace ? "border border-white/20 bg-white/5 text-white hover:bg-white/10" : "bg-black text-white hover:bg-gray-900"}`} style={{ fontFamily: "var(--font-sans)" }}>
                  <User size={14} /> My Account
                </Link>
                <button onClick={() => logout()} className={`px-4 py-2 text-[13px] transition-colors font-medium ${isConciergeWorkspace ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`} style={{ fontFamily: "var(--font-sans)" }}>Sign Out</button>
              </div>
            ) : (
              <Link href="/login" className={`flex items-center gap-2 px-5 py-2 text-[13px] font-semibold rounded-full transition-colors active:scale-[0.97] ${isConciergeWorkspace ? "border border-white/20 bg-white/5 text-white hover:bg-white/10" : "bg-black text-white hover:bg-gray-900"}`} style={{ fontFamily: "var(--font-sans)" }}>
                <User size={14} /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 ${isConciergeWorkspace ? "text-white" : "text-black"}`} aria-label="Toggle menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`lg:hidden border-t ${isConciergeWorkspace ? "border-white/10 bg-black text-white" : "border-gray-100 bg-white"}`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`px-4 py-3 text-sm rounded-xl transition-colors ${location === link.href ? "text-black font-semibold bg-gray-50" : "text-gray-500 hover:text-black hover:bg-gray-50 font-medium"}`} style={{ fontFamily: "var(--font-sans)" }}>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 mt-1">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" className="w-full text-center py-2.5 text-sm font-semibold text-white bg-black rounded-full" style={{ fontFamily: "var(--font-sans)" }}>My Account</Link>
                  <button onClick={() => logout()} className="text-sm text-gray-400 text-center py-2" style={{ fontFamily: "var(--font-sans)" }}>Sign Out</button>
                </div>
              ) : (
                <Link href="/login" className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-black rounded-full" style={{ fontFamily: "var(--font-sans)" }}>
                  <User size={14} /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
