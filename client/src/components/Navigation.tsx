import { Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const links = [
  { href: "/fleet", label: "Vehicles" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/membership", label: "Membership" },
] as const;

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => setMobileOpen(false), [location]);

  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111111]/95 text-white backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
      <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="DreamCarz home">
        <img src="/manus-storage/logo-light-mark-crop_649262e4.png" alt="DC" className="h-9 w-auto" />
        <span className="border-l border-white/35 pl-3 text-[15px] font-semibold tracking-[0.28em] text-white">DREAMCARZ</span>
      </Link>
      <nav className="hidden items-center gap-10 lg:flex" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-[#e0bb65] ${location === link.href ? "text-[#e0bb65]" : "text-white/85"}`}>{link.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-8 lg:flex">
        {loading ? <span className="h-9 w-20 animate-pulse rounded bg-white/10" /> : isAuthenticated ? <><Link href="/dashboard" className="text-sm font-medium text-white/85 hover:text-white">My Account</Link><button type="button" onClick={() => logout()} className="text-sm font-medium text-white/65 hover:text-white">Sign Out</button></> : <Link href="/login" className="text-sm font-medium text-white/90 hover:text-[#e0bb65]">Sign In</Link>}
        <Link href="/admin" className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55 hover:text-[#e0bb65]">Admin Login</Link>
        <Link href="/fleet" className="rounded-md bg-[#d7ad52] px-5 py-2.5 text-sm font-bold text-[#171512] transition hover:bg-[#e6c36d]">Browse Vehicles</Link>
      </div>
      <button type="button" onClick={() => setMobileOpen((current) => !current)} className="rounded-md p-2 text-white lg:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"}>{mobileOpen ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
    {mobileOpen && <div className="border-t border-white/10 bg-[#111111] px-5 py-5 lg:hidden"><nav className="grid gap-1" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} className="rounded-md px-3 py-3 text-sm font-medium text-white/85 hover:bg-white/10">{link.label}</Link>)}<Link href="/concierge" className="rounded-md px-3 py-3 text-sm font-medium text-white/85 hover:bg-white/10">Concierge</Link><div className="mt-3 grid gap-2 border-t border-white/10 pt-4">{isAuthenticated ? <><Link href="/dashboard" className="rounded-md bg-white/10 px-3 py-3 text-center text-sm font-semibold">My Account</Link><button type="button" onClick={() => logout()} className="px-3 py-2 text-sm text-white/65">Sign Out</button></> : <Link href="/login" className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-semibold text-black"><User size={15} /> Sign In</Link>}<Link href="/admin" className="rounded-md border border-white/15 px-3 py-3 text-center text-sm font-semibold text-white/75 hover:border-[#d7ad52] hover:text-[#e0bb65]">Admin Login</Link><Link href="/fleet" className="rounded-md bg-[#d7ad52] px-3 py-3 text-center text-sm font-bold text-[#171512]">Browse Vehicles</Link></div></nav></div>}
  </header>;
}
