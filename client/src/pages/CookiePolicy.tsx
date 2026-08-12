/* DreamCarz Network — Cookie Policy Page */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";

const cookieTypes = [
  {
    name: "Strictly Necessary Cookies",
    required: true,
    description: "These cookies are essential for the website to function properly. They enable core features such as security, network management, and account authentication. You cannot opt out of these cookies.",
    examples: [
      { name: "dreamcarz_session", purpose: "Maintains the secure DreamCarz member session", duration: "30 days" },
      { name: "app_session_id", purpose: "Supports compatible legacy sessions during the account transition", duration: "Session" },
    ],
  },
  {
    name: "Performance & Analytics Cookies",
    required: false,
    description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.",
    examples: [
      { name: "_umami", purpose: "Anonymous usage analytics (Umami)", duration: "1 year" },
      { name: "_session", purpose: "Tracks page views within a session", duration: "Session" },
    ],
  },
  {
    name: "Functional Cookies",
    required: false,
    description: "These cookies enable enhanced functionality and personalization, such as remembering your membership tier preference, vehicle filter settings, and calculator inputs.",
    examples: [
      { name: "dc_tier_pref", purpose: "Remembers your selected membership tier on the fleet page", duration: "90 days" },
      { name: "dc_calc_state", purpose: "Saves your last calculator inputs", duration: "30 days" },
    ],
  },
  {
    name: "Marketing Cookies",
    required: false,
    description: "These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant advertisements on other sites. We do not currently use third-party advertising cookies.",
    examples: [],
  },
];

export default function CookiePolicy() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-5">
          {/* Header */}
          <div className="mb-12">
            <div className="section-label mb-3">Legal</div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Cookie Policy
            </h1>
            <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>
              Last Updated: August 7, 2026
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                This Cookie Policy explains how DreamCarz Network uses cookies and similar tracking technologies when you visit our website. It explains what these technologies are, why we use them, and your rights to control their use.
              </p>
            </div>
          </div>

          {/* What are cookies */}
          <div className="border-b border-gray-100 pb-10 mb-10">
            <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>What Are Cookies?</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3" style={{ fontFamily: "var(--font-sans)" }}>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is being used.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain on your device for a set period or until you delete them). We use both types on the DreamCarz Network website.
            </p>
          </div>

          {/* Cookie types */}
          <div className="mb-10">
            <h2 className="font-display text-xl font-bold text-black mb-6" style={{ fontFamily: "var(--font-display)" }}>Cookies We Use</h2>
            <div className="space-y-3">
              {cookieTypes.map((type, i) => (
                <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${type.required ? "bg-black" : "bg-gray-300"}`}></div>
                      <span className="font-semibold text-sm text-black" style={{ fontFamily: "var(--font-sans)" }}>{type.name}</span>
                      {type.required && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full" style={{ fontFamily: "var(--font-sans)" }}>Always On</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-lg leading-none">{expanded === i ? "−" : "+"}</span>
                  </button>
                  {expanded === i && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-4" style={{ fontFamily: "var(--font-sans)" }}>{type.description}</p>
                      {type.examples.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Cookie Name</th>
                                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Purpose</th>
                                <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {type.examples.map((ex, j) => (
                                <tr key={j} className="border-b border-gray-50 last:border-0">
                                  <td className="py-2 pr-4 font-mono text-black">{ex.name}</td>
                                  <td className="py-2 pr-4 text-gray-500">{ex.purpose}</td>
                                  <td className="py-2 text-gray-500">{ex.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {type.examples.length === 0 && (
                        <p className="text-xs text-gray-400 italic" style={{ fontFamily: "var(--font-sans)" }}>No cookies of this type are currently in use.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Managing cookies */}
          <div className="border-b border-gray-100 pb-10 mb-10">
            <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>How to Manage Cookies</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4" style={{ fontFamily: "var(--font-sans)" }}>
              Most web browsers allow you to control cookies through their settings. You can set your browser to refuse all cookies or to indicate when a cookie is being set. However, if you disable cookies, some features of our website may not function properly, including your ability to log in to your member account.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { browser: "Chrome", url: "https://support.google.com/chrome/answer/95647" },
                { browser: "Firefox", url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" },
                { browser: "Safari", url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
                { browser: "Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              ].map((b, i) => (
                <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-3 border border-gray-200 rounded-xl text-sm font-medium text-black hover:bg-gray-50 transition-colors text-center" style={{ fontFamily: "var(--font-sans)" }}>
                  {b.browser}
                </a>
              ))}
            </div>
          </div>

          {/* Updates */}
          <div className="border-b border-gray-100 pb-10 mb-10">
            <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Updates to This Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make changes, we will update the "Last Updated" date at the top of this page. We encourage you to review this policy periodically.
            </p>
          </div>

          {/* Contact */}
          <div className="border-b border-gray-100 pb-10 mb-10">
            <h2 className="font-display text-xl font-bold text-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Contact Us</h2>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              If you have questions about our use of cookies, please contact us at:<br /><br />
              DreamCarz Network<br />
              10001 Derekwood Ln, Suite 204, Lanham, MD 20706<br />
              Phone: (301) 772-2500<br />
              Email: info@dreamcarz.com
            </p>
          </div>

          <div className="p-6 bg-black rounded-2xl text-white text-center">
            <h3 className="font-display text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Cookie Questions?</h3>
            <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>We're committed to transparency about how we use your data.</p>
            <a href="mailto:info@dreamcarz.com" className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
              Email Us
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
