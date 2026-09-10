/* DreamCarz Network — Navigation matching reference design
 * Light gray bg, DC mark + wordmark, minimal links, dark pill Sign In
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Menu, Sparkles, User, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type MegaMenuKey = "fleet" | "members" | "network";

const fleetPreview = [
  { href: "/vehicle?id=2024-chevrolet-malibu-gray", label: "2024 Chevrolet Malibu", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ogLykrxMFWpmsTbU.png" },
  { href: "/vehicle?id=2022-chevrolet-traverse-white", label: "2022 Chevrolet Traverse", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uLwJSHBxRyWslZQQ.png" },
  { href: "/vehicle?id=2024-ford-fusion-gray", label: "2024 Ford Fusion", type: "Sedan", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qRKjtXjkrFUfxMqh.png" },
  { href: "/vehicle?id=2020-chevrolet-equinox-black", label: "2020 Chevrolet Equinox", type: "SUV", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TAiKEadRDaSWeYcf.png" },
] as const;

const mobileLinks = [
  { href: "/concierge", label: "Concierge" },
  { href: "/fleet", label: "Fleet" },
  { href: "/membership", label: "Members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Locations" },
  { href: "/associates", label: "Associate Path" },
  { href: "/opportunity#fleet-partner", label: "Fleet Partners" },
] as const;

const menuTriggerBase = "inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors duration-150";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFleetOpen, setMobileFleetOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [location] = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();
  const isConciergeWorkspace = location === "/concierge";
  const isLightHeader = !isConciergeWorkspace;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMobileFleetOpen(false); setActiveMegaMenu(null); }, [location]);

  const triggerClassName = (key: MegaMenuKey) => `${menuTriggerBase} ${activeMegaMenu === key || location === `/${key}` ? "text-black" : isConciergeWorkspace ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`;
  const closeWhenFocusLeaves = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActiveMegaMenu(null);
  };
  const toggleMegaMenu = (key: MegaMenuKey) => setActiveMegaMenu(current => current === key ? null : key);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isConciergeWorkspace ? "border-b border-white/10 bg-black text-white" : scrolled || activeMegaMenu ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={isConciergeWorkspace ? "/manus-storage/logo-light-mark-crop_649262e4.png" : "/manus-storage/logo-dark-mark-crop_f052e278.png"} alt="DC" className="h-8 w-auto object-contain" />
            <img src={isConciergeWorkspace ? "/manus-storage/logo-light-wordmark-crop_9e0a8d00.png" : "/manus-storage/logo-dark-wordmark-crop_bb978492.png"} alt="DREAMCARZ" className="h-[13px] w-auto object-contain hidden sm:block" />
          </Link>

          {/* Desktop mega navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation" onMouseLeave={() => setActiveMegaMenu(null)} onBlur={closeWhenFocusLeaves}>
            <Link href="/concierge" className={`${menuTriggerBase} ${location === "/concierge" ? "font-semibold text-[#a8832d]" : isConciergeWorkspace ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`}>Concierge</Link>
            <button type="button" aria-expanded={activeMegaMenu === "fleet"} aria-controls="dreamcarz-fleet-menu" onMouseEnter={() => setActiveMegaMenu("fleet")} onFocus={() => setActiveMegaMenu("fleet")} onClick={() => toggleMegaMenu("fleet")} onKeyDown={event => { if (event.key === "Escape") setActiveMegaMenu(null); }} className={triggerClassName("fleet")}>Fleet <ChevronDown size={14} className={`transition-transform ${activeMegaMenu === "fleet" ? "rotate-180" : ""}`} /></button>
            <button type="button" aria-expanded={activeMegaMenu === "members"} aria-controls="dreamcarz-members-menu" onMouseEnter={() => setActiveMegaMenu("members")} onFocus={() => setActiveMegaMenu("members")} onClick={() => toggleMegaMenu("members")} onKeyDown={event => { if (event.key === "Escape") setActiveMegaMenu(null); }} className={triggerClassName("members")}>Members <ChevronDown size={14} className={`transition-transform ${activeMegaMenu === "members" ? "rotate-180" : ""}`} /></button>
            <Link href="/pricing" className={`${menuTriggerBase} ${location === "/pricing" ? "font-semibold text-[#a8832d]" : isConciergeWorkspace ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`}>Pricing</Link>
            <button type="button" aria-expanded={activeMegaMenu === "network"} aria-controls="dreamcarz-network-menu" onMouseEnter={() => setActiveMegaMenu("network")} onFocus={() => setActiveMegaMenu("network")} onClick={() => toggleMegaMenu("network")} onKeyDown={event => { if (event.key === "Escape") setActiveMegaMenu(null); }} className={triggerClassName("network")}>More <ChevronDown size={14} className={`transition-transform ${activeMegaMenu === "network" ? "rotate-180" : ""}`} /></button>
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

      {activeMegaMenu === "fleet" ? <div id="dreamcarz-fleet-menu" className="absolute left-0 right-0 top-full hidden border-t border-[#ece6da] bg-white shadow-[0_22px_44px_rgba(0,0,0,0.12)] lg:block" onMouseEnter={() => setActiveMegaMenu("fleet")} onMouseLeave={() => setActiveMegaMenu(null)}>
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_260px] gap-10 px-10 py-8">
          <div><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Confirmed inventory</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-black">Find the vehicle that fits.</h2></div><Link href="/fleet" className="text-sm font-semibold text-[#8e6c20] underline underline-offset-4">View all inventory</Link></div><div className="mt-6 grid grid-cols-4 gap-4">{fleetPreview.map(vehicle => <Link key={vehicle.href} href={vehicle.href} className="group rounded-xl p-2 transition-colors hover:bg-[#f8f5ef]"><div className="flex h-20 items-center justify-center rounded-lg bg-[#f7f4ee]"><img src={vehicle.image} alt={vehicle.label} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /></div><p className="mt-3 text-xs font-semibold text-black">{vehicle.label}</p><p className="mt-1 text-[11px] text-gray-500">{vehicle.type}</p></Link>)}</div></div>
          <div className="border-l border-[#ece6da] pl-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Start here</p><div className="mt-4 grid gap-3 text-sm"><Link href="/concierge?intent=rental" className="font-semibold text-black hover:text-[#9b7726]">Rent a vehicle</Link><Link href="/concierge?intent=purchase" className="font-semibold text-black hover:text-[#9b7726]">Buy a vehicle</Link><Link href="/concierge" className="font-semibold text-black hover:text-[#9b7726]">Ask Concierge</Link></div><p className="mt-7 text-xs leading-5 text-gray-500">Vehicle availability and final terms are reviewed before a reservation or purchase step.</p></div>
        </div>
      </div> : null}

      {activeMegaMenu === "members" ? <div id="dreamcarz-members-menu" className="absolute left-0 right-0 top-full hidden border-t border-[#ece6da] bg-white shadow-[0_22px_44px_rgba(0,0,0,0.12)] lg:block" onMouseEnter={() => setActiveMegaMenu("members")} onMouseLeave={() => setActiveMegaMenu(null)}>
        <div className="mx-auto grid max-w-7xl grid-cols-[0.9fr_1.1fr] gap-12 px-10 py-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">Drive with context</p><h2 className="mt-2 max-w-sm text-2xl font-semibold tracking-[-0.04em] text-black">Compare membership and vehicle access without mixing the two.</h2><Link href="/membership" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-black underline decoration-[#b08b35] decoration-2 underline-offset-4">Explore membership <ChevronDown className="-rotate-90" size={16} /></Link></div><div className="grid grid-cols-3 gap-4"><Link href="/membership" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Membership</p><p className="mt-3 text-sm font-semibold text-black">Understand the path</p><p className="mt-2 text-xs leading-5 text-gray-500">See membership context and program rules.</p></Link><Link href="/pricing" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Pricing</p><p className="mt-3 text-sm font-semibold text-black">Compare with clarity</p><p className="mt-2 text-xs leading-5 text-gray-500">Keep recurring plans separate from vehicle access.</p></Link><Link href="/concierge" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Concierge</p><p className="mt-3 text-sm font-semibold text-black">Ask naturally</p><p className="mt-2 text-xs leading-5 text-gray-500">Get guided into the right next step.</p></Link></div></div>
      </div> : null}

      {activeMegaMenu === "network" ? <div id="dreamcarz-network-menu" className="absolute left-0 right-0 top-full hidden border-t border-[#ece6da] bg-white shadow-[0_22px_44px_rgba(0,0,0,0.12)] lg:block" onMouseEnter={() => setActiveMegaMenu("network")} onMouseLeave={() => setActiveMegaMenu(null)}>
        <div className="mx-auto grid max-w-7xl grid-cols-[0.8fr_1.2fr] gap-12 px-10 py-8"><div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-[#d4b15e]"><Sparkles size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">DreamCarz network</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">Choose the path that matches your role.</h2></div></div><div className="grid grid-cols-3 gap-4"><Link href="/contact" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-sm font-semibold text-black">Locations &amp; support</p><p className="mt-2 text-xs leading-5 text-gray-500">Find local guidance and reach DreamCarz.</p></Link><Link href="/associates" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-sm font-semibold text-black">Associate Path</p><p className="mt-2 text-xs leading-5 text-gray-500">Access your authorized associate workspace.</p></Link><Link href="/opportunity#fleet-partner" className="border border-[#ece6da] p-5 hover:border-[#bfa35d]"><p className="text-sm font-semibold text-black">Fleet Partners</p><p className="mt-2 text-xs leading-5 text-gray-500">Explore the vehicle-operations partnership path.</p></Link></div></div>
      </div> : null}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`lg:hidden border-t ${isConciergeWorkspace ? "border-white/10 bg-black text-white" : "border-gray-100 bg-white"}`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {mobileLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`px-4 py-3 text-sm rounded-xl transition-colors ${location === link.href ? "text-black font-semibold bg-gray-50" : "text-gray-500 hover:text-black hover:bg-gray-50 font-medium"}`} style={{ fontFamily: "var(--font-sans)" }}>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 rounded-xl border border-[#e7e0d4] px-4 py-1"><button type="button" onClick={() => setMobileFleetOpen(current => !current)} className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-black" aria-expanded={mobileFleetOpen}>Confirmed vehicle preview <ChevronDown size={16} className={`transition-transform ${mobileFleetOpen ? "rotate-180" : ""}`} /></button>{mobileFleetOpen ? <div className="grid grid-cols-2 gap-2 border-t border-[#ece6da] py-3">{fleetPreview.map(vehicle => <Link key={vehicle.href} href={vehicle.href} className="flex items-center gap-2 rounded-lg p-2 hover:bg-[#f8f5ef]"><img src={vehicle.image} alt="" className="h-8 w-12 object-contain" /><span className="text-[11px] font-medium text-black">{vehicle.label}</span></Link>)}</div> : null}</div>
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
