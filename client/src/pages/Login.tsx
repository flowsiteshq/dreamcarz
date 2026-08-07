/* DreamCarz Network — Login / Register Page
 * Clean white design matching the Dream Drive reference
 * Uses Manus OAuth via startLogin()
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Car, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-[70px] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto px-5 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Branding */}
          <div>
            <div className="section-label mb-4">Member Portal</div>
            <h1 className="font-display text-5xl font-bold text-black leading-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
              Your Loyalty<br />Has a Dollar Value
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8" style={{ fontFamily: "var(--font-sans)" }}>
              Sign in to access your member dashboard, track your DCP balance, view your transportation purchasing power, and manage your membership.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Track your DCP points and purchasing power",
                "View your member value ratio in real time",
                "Access exclusive fleet and booking features",
                "Monitor your journey toward Credit Free & Be Free",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-black mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{item}</span>
                </div>
              ))}
            </div>
            {/* DCP preview card */}
            <div className="bg-black rounded-2xl p-6 text-white max-w-xs">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>Member Value Ratio</div>
              <div className="font-mono text-4xl font-bold text-white">1.80x</div>
              <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-sans)" }}>Transportation value vs membership cost</div>
            </div>
          </div>

          {/* Right: Login card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <Car size={20} className="text-black" />
              <span className="font-display text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>DreamCarz Network</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Welcome Back</h2>
            <p className="text-sm text-gray-500 mb-8" style={{ fontFamily: "var(--font-sans)" }}>Sign in to your member account to access your dashboard and DCP balance.</p>

            {/* Primary sign in button */}
            <button
              onClick={() => startLogin()}
              className="w-full btn-primary justify-center text-base py-3.5 mb-4"
            >
              Sign In / Create Account <ArrowRight size={18} />
            </button>

            <div className="relative my-5">
              <div className="divider"></div>
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>
                Secure authentication
              </span>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              By signing in, you agree to our{" "}
              <a href="#" className="text-black underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-black underline">Privacy Policy</a>.
            </p>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                Not a member yet?{" "}
                <Link href="/membership" className="text-black font-semibold hover:underline">
                  View membership tiers
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
