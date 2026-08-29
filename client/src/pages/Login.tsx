import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type AuthMode = "signin" | "create";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const requestedNext = new URLSearchParams(location.split("?")[1] ?? "").get("next");
  const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const isSubmitting = login.isPending || register.isPending;

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(safeNext);
  }, [isAuthenticated, loading, navigate, safeNext]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const user = mode === "signin"
        ? await login.mutateAsync({ email, password })
        : await register.mutateAsync({ name, email, password, acceptedTerms: true });
      utils.auth.me.setData(undefined, user);
      await utils.auth.me.invalidate();
      navigate(safeNext);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not complete your request. Please try again.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>;
  }

  const isCreate = mode === "create";
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-[68px]">
        <div className="max-w-6xl mx-auto px-5 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-68px)]">
          <section>
            <div className="section-label mb-4">DreamCarz Member Access</div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-black leading-[0.97] mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Every drive is<br />part of your future.
            </h1>
            <p className="text-gray-500 leading-relaxed max-w-md mb-9" style={{ fontFamily: "var(--font-sans)" }}>
              Create your DreamCarz account to manage reservations, track DCP, set your dream-car roadmap, and complete rental readiness.
            </p>
            <div className="space-y-3 mb-9">
              {[
                "Securely manage your member account and rental profile",
                "Track DCP and transportation purchasing power",
                "Access the fleet, service, rewards, and Dream Journey",
              ].map(item => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-black mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-black rounded-2xl p-6 text-white max-w-sm">
              <div className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">Built for members</div>
              <div className="font-display text-2xl font-bold">Your account. Your journey. Your dream car.</div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                  <LockKeyhole size={13} /> Secure DreamCarz Access
                </div>
                <h2 className="font-display text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                  {isCreate ? "Create your account" : "Welcome back"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-7" role="tablist" aria-label="Account access">
              <button type="button" onClick={() => switchMode("signin")} className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${!isCreate ? "bg-white text-black shadow-sm" : "text-gray-500"}`} aria-selected={!isCreate}>Sign in</button>
              <button type="button" onClick={() => switchMode("create")} className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${isCreate ? "bg-white text-black shadow-sm" : "text-gray-500"}`} aria-selected={isCreate}>Create account</button>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {isCreate && (
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Full name</span>
                  <span className="mt-2 flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-12 focus-within:border-black transition-colors">
                    <UserRound size={17} className="text-gray-400" />
                    <input value={name} onChange={event => setName(event.target.value)} required minLength={2} autoComplete="name" placeholder="Your name" className="w-full outline-none text-sm text-black placeholder:text-gray-400" />
                  </span>
                </label>
              )}
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Email address</span>
                <span className="mt-2 flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-12 focus-within:border-black transition-colors">
                  <Mail size={17} className="text-gray-400" />
                  <input value={email} onChange={event => setEmail(event.target.value)} required type="email" autoComplete="email" placeholder="you@example.com" className="w-full outline-none text-sm text-black placeholder:text-gray-400" />
                </span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Password</span>
                <span className="mt-2 flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-12 focus-within:border-black transition-colors">
                  <LockKeyhole size={17} className="text-gray-400" />
                  <input value={password} onChange={event => setPassword(event.target.value)} required minLength={isCreate ? 10 : 1} type={showPassword ? "text" : "password"} autoComplete={isCreate ? "new-password" : "current-password"} placeholder={isCreate ? "At least 10 characters" : "Your password"} className="w-full outline-none text-sm text-black placeholder:text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(value => !value)} className="text-gray-400 hover:text-black" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </span>
              </label>

              {formError && <div role="alert" className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{formError}</div>}

              <button disabled={isSubmitting} type="submit" className="w-full h-13 min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 active:scale-[0.98] transition-all">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>{isCreate ? "Create secure account" : "Sign in to DreamCarz"} <ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="mt-5 text-xs text-gray-400 leading-relaxed text-center">
              By continuing, you agree to the <Link href="/terms" className="text-black underline">Terms &amp; Conditions</Link> and <Link href="/privacy-policy" className="text-black underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
