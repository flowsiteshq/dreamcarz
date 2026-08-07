/* DreamCarz Network — Contact Page
 * Address, phone, hours of operation, and contact form
 */
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { MapPin, Phone, Clock, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

const hours = [
  { day: "Monday – Friday", time: "9:00 am – 6:00 pm", open: true },
  { day: "Saturday", time: "9:00 am – 3:00 pm", open: true },
  { day: "Sunday", time: "Closed", open: false },
];

export default function Contact() {
  useScrollReveal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-section">
        <div className="container">
          <div className="section-label mb-3 reveal">Get In Touch</div>
          <h1 className="font-display text-5xl font-bold text-black mb-4 reveal delay-100" style={{ fontFamily: "var(--font-display)" }}>
            Contact DreamCarz
          </h1>
          <p className="text-gray-500 max-w-xl reveal delay-200" style={{ fontFamily: "var(--font-sans)" }}>
            Have questions about membership, vehicles, or the DCP program? Our team is here to help.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left: Info cards */}
            <div className="space-y-5">
              {/* Address */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-4 reveal">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Our Location</h3>
                  <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                    10001 Derekwood Ln, Suite 204<br />
                    Lanham, MD 20706
                  </p>
                  <a
                    href="https://maps.google.com/?q=10001+Derekwood+Ln+Suite+204+Lanham+MD+20706"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-black mt-2 hover:underline"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Get Directions <ArrowRight size={12} />
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-4 reveal delay-100">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Call Us</h3>
                  <a
                    href="tel:+13017722500"
                    className="text-2xl font-display font-bold text-black hover:underline"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    (301) 772-2500
                  </a>
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-sans)" }}>
                    Click to call during business hours
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 reveal delay-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-black" />
                  </div>
                  <h3 className="font-display text-base font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Hours of Operation</h3>
                </div>
                <div className="space-y-3">
                  {hours.map((h, i) => (
                    <div key={i} className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0`}>
                      <span className="text-sm font-medium text-black" style={{ fontFamily: "var(--font-sans)" }}>{h.day}</span>
                      <span className={`text-sm font-semibold ${h.open ? "text-black" : "text-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>
                        {h.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="bg-black rounded-2xl p-6 flex gap-4 reveal delay-300">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>Email Us</h3>
                  <a href="mailto:info@dreamcarz.com" className="text-sm text-gray-300 hover:text-white transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    info@dreamcarz.com
                  </a>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "var(--font-sans)" }}>We respond within 1 business day</p>
                </div>
              </div>
            </div>

            {/* Right: Contact form */}
            <div className="reveal delay-100">
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="font-display text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Send Us a Message</h2>
                <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-sans)" }}>
                  Fill out the form below and a member of our team will get back to you shortly.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-4">
                      <ArrowRight size={22} className="text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Message Sent!</h3>
                    <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                      Thank you for reaching out. We'll be in touch within 1 business day.
                    </p>
                    <button onClick={() => setSubmitted(false)} className="btn-outline mt-6 text-sm">Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>Full Name *</label>
                        <input
                          required
                          type="text"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="John Smith"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
                          style={{ fontFamily: "var(--font-sans)" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="(301) 555-0000"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
                          style={{ fontFamily: "var(--font-sans)" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>Email Address *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
                        style={{ fontFamily: "var(--font-sans)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>Message *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your membership interest, vehicle questions, or anything else..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 outline-none focus:border-black transition-colors resize-none"
                        style={{ fontFamily: "var(--font-sans)" }}
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full justify-center py-3">
                      Send Message <ArrowRight size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
