/* DreamCarz Network — Homepage
 * Reference: Dream Drive Dribbble design (white/clean/minimal)
 * Sections: Nav, Hero (centered, white bg, car image), Brand logos, About split,
 *   Stats, Fleet cards, Luxury Meets Reliability (arc), Top Picks carousel,
 *   How It Works steps, Testimonials, FAQ, Footer
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight, ChevronLeft, ChevronDown, Star, Users, Clock, Shield, Zap, Car,
  MapPin, Calendar, Settings, CheckCircle2, ArrowRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const brandLogos = ["BMW", "Rolls-Royce", "GMC", "Mercedes", "NISSAN", "Porsche"];

const fleetCars = [
  {
    name: "Porsche 911 Carrera 2025",
    category: "Sports Car",
    image: "/manus-storage/car-card-1_8dfc0a4a.png",
    seats: 2, doors: 2, bags: 1,
    transmission: "Automatic",
    price: 299,
  },
  {
    name: "Audi R8 V10 Performance",
    category: "Sports Car",
    image: "/manus-storage/car-card-2_d8411d99.png",
    seats: 2, doors: 2, bags: 1,
    transmission: "Automatic",
    price: 349,
  },
  {
    name: "Ferrari Portofino M 2025",
    category: "Sports Car",
    image: "/manus-storage/car-card-3_23f3c0ab.png",
    seats: 2, doors: 2, bags: 1,
    transmission: "Automatic",
    price: 399,
  },
];

const topPicks = [
  { name: "Benz E-Class", image: "/manus-storage/car-card-4_6af95632.png", category: "Sedan" },
  { name: "BMW i8 Coupe", image: "/manus-storage/car-card-5_bd8a563d.png", category: "Sports" },
  { name: "Audi A6", image: "/manus-storage/car-card-6_4972fbf1.png", category: "Sedan" },
];

const steps = [
  { icon: <Car size={22} />, title: "Browse Cars", desc: "Select from our premium collection" },
  { icon: <CheckCircle2 size={22} />, title: "Choose Ride", desc: "Pick the perfect car" },
  { icon: <Calendar size={22} />, title: "Set Your Date", desc: "Pick location and date" },
  { icon: <Settings size={22} />, title: "Add Preferences", desc: "Include extras you'd love" },
  { icon: <Shield size={22} />, title: "Confirm Booking", desc: "Secure your ride" },
  { icon: <MapPin size={22} />, title: "Pick Up & Drive", desc: "Collect your car and enjoy the road" },
];

const testimonials = [
  {
    text: "The entire booking experience was seamless. I picked up a BMW X7 for a weekend trip, and it felt brand new. Everything from the cleanliness to the pickup process was perfectly organized. Definitely the best rental experience I've had.",
    name: "Daniel Roberts",
    location: "London",
  },
  {
    text: "The entire booking experience was seamless. I picked up a BMW X7 for a weekend trip, and it felt brand new. Everything from the cleanliness to the pickup process was perfectly organized. Definitely the best rental experience I've had.",
    name: "Daniel Roberts",
    location: "London",
  },
  {
    text: "The entire booking experience was seamless. I picked up a BMW X7 for a weekend trip, and it felt brand new. Everything from the cleanliness to the pickup process was perfectly organized. Definitely the best rental experience I've had.",
    name: "Daniel Roberts",
    location: "London",
  },
];

const faqs = [
  "How do I book a car?",
  "Can the car be delivered to my location?",
  "What is the minimum rental period?",
  "Is insurance included in the rental price?",
  "What documents do I need to rent a car?",
  "Is there a security deposit required?",
];

function FAQItem({ question }: { question: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900" style={{ fontFamily: "var(--font-sans)" }}>{question}</span>
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-4">
          <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
            Our booking process is simple and fast. Browse our fleet, select your preferred vehicle, choose your dates and location, add any preferences, confirm your booking, and we'll have your car ready for pickup. You can also contact us for personalized assistance.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  useScrollReveal();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [activeService, setActiveService] = useState("Expert");

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const services = ["Expert", "Flexible", "Sanitised", "Booking", "Membership"];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ═══════════════════════════════════════
          HERO — centered, white bg, large car image
      ═══════════════════════════════════════ */}
      <section className="pt-[70px] bg-white overflow-hidden">
        <div className="container pt-16 pb-0 text-center">
          {/* Headline */}
          <h1
            className={`font-display text-5xl lg:text-7xl font-bold text-black leading-tight mb-4 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ fontFamily: "var(--font-display)", transitionDelay: "100ms" }}
          >
            Drive Your Dream Car,<br />Anytime Anywhere
          </h1>
          <p
            className={`text-base text-gray-500 max-w-md mx-auto mb-8 leading-relaxed transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ fontFamily: "var(--font-sans)", transitionDelay: "250ms" }}
          >
            DreamCarz offers curated luxury cars, quick booking, and seamless delivery for an unforgettable ride
          </p>
          <div
            className={`flex items-center justify-center gap-3 mb-10 transition-all duration-700 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "380ms" }}
          >
            <Link href="/membership" className="btn-primary">
              Book Your Ride
            </Link>
            <Link href="/fleet" className="btn-outline">
              Browse Our Fleet
            </Link>
          </div>
        </div>

        {/* Hero car image — large, centered */}
        <div
          className={`relative flex justify-center transition-all duration-1000 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: "500ms" }}
        >
          {/* Subtle arc/circle behind car */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gray-100 blur-3xl opacity-60"></div>
          <img
            src="/manus-storage/hero-white-car_2ce987bf.png"
            alt="DreamCarz luxury vehicle"
            className="relative w-full max-w-3xl object-contain"
            style={{ maxHeight: "420px" }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BRAND LOGOS
      ═══════════════════════════════════════ */}
      <section className="py-8 border-y border-gray-100 bg-white">
        <div className="container">
          <div className="flex items-center justify-between gap-6 overflow-x-auto">
            {brandLogos.map((brand, i) => (
              <div key={i} className="flex-shrink-0 text-gray-300 font-display font-bold text-lg tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ABOUT SPLIT — "Drive Luxury Live Freedom"
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Drive Luxury Live<br />Freedom
              </h2>
            </div>
            <div className="reveal delay-100">
              <p className="text-gray-500 leading-relaxed mb-8" style={{ fontFamily: "var(--font-sans)" }}>
                Experience premium car rentals crafted for comfort, performance, and style. Whether it's a quick business trip or a long weekend getaway, our fleet is designed to elevate your journey. With DreamCarz membership, every mile you drive builds transportation purchasing power.
              </p>
              {/* Stats row */}
              <div className="flex flex-wrap gap-4">
                {[
                  { value: "500+", label: "Luxury Cars" },
                  { value: "24/7", label: "Road Assistance" },
                  { value: "100%", label: "Security Guarantee" },
                  { value: "60+", label: "Pickup Locations" },
                  { value: "800+", label: "Satisfied Clients" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FLEET CARDS — "Find Your Perfect Ride"
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-section">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div className="reveal">
              <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Find Your Perfect Ride</h2>
              <p className="text-gray-500 mt-2 max-w-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Explore a handpicked collection of luxury and performance cars built for every journey.
              </p>
            </div>
            <Link href="/fleet" className="btn-outline hidden md:inline-flex reveal delay-100">
              View Full Fleet
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fleetCars.map((car, i) => (
              <div key={i} className="vehicle-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                {/* Car image */}
                <div className="bg-white p-6 flex items-center justify-center" style={{ minHeight: "200px" }}>
                  <img src={car.image} alt={car.name} className="w-full object-contain" style={{ maxHeight: "160px" }} />
                </div>
                {/* Info */}
                <div className="p-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag">{car.category}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-black mb-3" style={{ fontFamily: "var(--font-display)" }}>{car.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4" style={{ fontFamily: "var(--font-sans)" }}>
                    <span className="flex items-center gap-1"><Users size={12} /> {car.seats} Seats</span>
                    <span className="flex items-center gap-1"><Car size={12} /> {car.doors} Doors</span>
                    <span className="flex items-center gap-1"><Settings size={12} /> {car.transmission}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>${car.price}</span>
                      <span className="text-xs text-gray-400 ml-1" style={{ fontFamily: "var(--font-sans)" }}>/day</span>
                    </div>
                    <button className="btn-primary text-xs px-4 py-2">Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DCP MEMBERSHIP SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <div className="section-label mb-3">DreamCarz Points</div>
              <h2 className="font-display text-4xl font-bold text-black leading-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
                Every Drive Builds<br />Purchasing Power
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6" style={{ fontFamily: "var(--font-sans)" }}>
                100 DCP = $1 of Transportation Purchasing Power. Earn points on every membership payment, vehicle transaction, rental, and more. The longer you stay, the more powerful your DCP becomes.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Earn DCP on every qualifying activity",
                  "Tenure multipliers grow up to 1.50x after 5 years",
                  "Use DCP toward vehicles, rentals, fees, and protection",
                  "Elite members get +25% redemption enhancement",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-black mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-sans)" }}>{point}</span>
                  </div>
                ))}
              </div>
              <Link href="/how-it-works" className="btn-primary">
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
            {/* DCP visual card */}
            <div className="reveal delay-100">
              <div className="bg-black rounded-2xl p-8 text-white">
                <div className="section-label text-gray-400 mb-4">Six Stages to Freedom</div>
                <div className="space-y-3">
                  {[
                    { stage: "01", name: "Hassle Free™", desc: "Easy vehicle access" },
                    { stage: "02", name: "Credit Free™", desc: "No credit score required" },
                    { stage: "03", name: "Worry Free™", desc: "DCP toward protection" },
                    { stage: "04", name: "Fee Free™", desc: "DCP offsets fees" },
                    { stage: "05", name: "Drive Free™", desc: "DCP toward rentals" },
                    { stage: "06", name: "Be Free™", desc: "DCP toward ownership" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 py-2 border-b border-white/10 last:border-0">
                      <span className="font-mono text-xs text-gray-500 w-6">{item.stage}</span>
                      <span className="text-sm font-semibold text-white flex-1" style={{ fontFamily: "var(--font-sans)" }}>{item.name}</span>
                      <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LUXURY MEETS RELIABILITY — arc section
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-section overflow-hidden">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Luxury Meets Reliability</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
              We combine the elegance of luxury vehicles with a seamless, reliable experience and style appreciation.
            </p>
          </div>

          {/* Service tabs + arc visual */}
          <div className="relative">
            {/* Tab buttons */}
            <div className="flex items-center justify-center gap-2 mb-10 flex-wrap reveal delay-100">
              {services.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveService(s)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeService === s ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"}`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Arc + car visual */}
            <div className="relative flex items-center justify-center reveal delay-200" style={{ minHeight: "320px" }}>
              {/* Arc SVG */}
              <svg
                viewBox="0 0 600 320"
                className="absolute w-full max-w-2xl opacity-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M 50 310 A 250 250 0 0 1 550 310" stroke="black" strokeWidth="1" fill="none" />
                <path d="M 100 310 A 200 200 0 0 1 500 310" stroke="black" strokeWidth="1" fill="none" />
                <path d="M 150 310 A 150 150 0 0 1 450 310" stroke="black" strokeWidth="1" fill="none" />
              </svg>

              {/* Center content */}
              <div className="relative text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium mb-4" style={{ fontFamily: "var(--font-sans)" }}>
                  {activeService} Service
                </div>
                <img
                  src="/manus-storage/car-card-1_8dfc0a4a.png"
                  alt="Featured car"
                  className="w-80 object-contain mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: "var(--font-sans)" }}>Professional guidance for your perfect ride</p>
                <button className="btn-primary mt-4 text-sm">Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TOP PICKS THIS WEEK — carousel
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div className="reveal">
              <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Top Picks This Week</h2>
              <p className="text-gray-500 mt-2 max-w-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Explore our most rented vehicles handpicked for performance and elegance.
              </p>
            </div>
            <Link href="/fleet" className="btn-outline hidden md:inline-flex reveal delay-100">
              View All Cars
            </Link>
          </div>

          {/* Carousel */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal delay-200">
              {topPicks.map((car, i) => (
                <div key={i} className={`vehicle-card ${i === 1 ? "ring-2 ring-black" : ""}`}>
                  <div className="bg-gray-50 p-6 flex items-center justify-center" style={{ minHeight: "180px" }}>
                    <img src={car.image} alt={car.name} className="w-full object-contain" style={{ maxHeight: "140px" }} />
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <span className="tag mb-2 inline-flex">{car.category}</span>
                    <h3 className="font-display text-base font-bold text-black mt-1" style={{ fontFamily: "var(--font-display)" }}>{car.name}</h3>
                  </div>
                </div>
              ))}
            </div>
            {/* Carousel dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[0, 1].map((i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${carouselIdx === i ? "bg-black w-6" : "bg-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — 6 steps
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="reveal">
                <h2 className="font-display text-4xl font-bold text-black mb-3" style={{ fontFamily: "var(--font-display)" }}>Simple. Fast. Hassle-Free</h2>
                <p className="text-gray-500 mb-8" style={{ fontFamily: "var(--font-sans)" }}>
                  Experience a smooth rental process designed to get you on the road in minutes. From selecting your dream car to collecting your booking.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-black flex-shrink-0 shadow-sm">
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{step.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 reveal delay-400">
                <Link href="/how-it-works" className="btn-primary">Start Booking</Link>
              </div>
            </div>
            {/* Right: booking car image */}
            <div className="reveal delay-200">
              <div className="rounded-2xl overflow-hidden bg-gray-100" style={{ minHeight: "360px" }}>
                <img
                  src="/manus-storage/booking-car_eba5ee3e.jpg"
                  alt="Car pickup"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "360px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          MEMBERSHIP TIERS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-3">DCP Membership</div>
            <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Choose Your Level</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
              Every tier delivers real transportation value. A member who never recruits anyone should still see a compelling result.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { name: "Freedom", price: "$39.95", enrollment: "$139", perks: ["DCP on all activity", "Credit Free eligible", "Roadside included", "$79/week program fee"], featured: false },
              { name: "Plus", price: "$69.95", enrollment: "$199", perks: ["+5% redemption boost", "Reduced fees $69/wk", "Priority support", "Worry Free VSC"], featured: false },
              { name: "Pro", price: "$99.95", enrollment: "$249", perks: ["+15% redemption boost", "$59/week program fee", "Fee Free eligible", "Drive Free eligible"], featured: true },
              { name: "Elite", price: "$149.95", enrollment: "$299", perks: ["+25% redemption boost", "$49/week program fee", "Be Free eligible", "Founding Member access"], featured: false },
            ].map((tier, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 flex flex-col reveal ${tier.featured ? "bg-black text-white" : "bg-white border border-gray-200"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {tier.featured && <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3" style={{ fontFamily: "var(--font-sans)" }}>★ Most Popular</div>}
                <div className={`text-xs font-semibold tracking-wider uppercase mb-2 ${tier.featured ? "text-gray-400" : "text-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>{tier.name}</div>
                <div className={`font-display text-3xl font-bold mb-1 ${tier.featured ? "text-white" : "text-black"}`} style={{ fontFamily: "var(--font-display)" }}>{tier.price}</div>
                <div className={`text-xs mb-5 ${tier.featured ? "text-gray-400" : "text-gray-400"}`} style={{ fontFamily: "var(--font-sans)" }}>per month · Enrollment: {tier.enrollment}</div>
                <ul className="space-y-2 flex-1 mb-6">
                  {tier.perks.map((perk, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className={tier.featured ? "text-gray-400" : "text-black"} />
                      <span className={`text-xs ${tier.featured ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "var(--font-sans)" }}>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/membership"
                  className={`py-2.5 rounded-full text-sm font-semibold text-center transition-all ${tier.featured ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Join {tier.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-section">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div className="reveal">
              <h2 className="font-display text-4xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>Trusted by Thousands</h2>
              <p className="text-gray-500 mt-2 max-w-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Our members trust us for comfort, quality, and reliability every time they hit the road.
              </p>
            </div>
            <div className="flex items-center gap-2 reveal delay-100">
              <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-black fill-black" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5" style={{ fontFamily: "var(--font-sans)" }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{t.name}</div>
                    <div className="text-xs text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="reveal">
              <h2 className="font-display text-4xl font-bold text-black mb-3" style={{ fontFamily: "var(--font-display)" }}>Got questions? We've got answers!</h2>
              <p className="text-gray-500" style={{ fontFamily: "var(--font-sans)" }}>
                Find answers to some of the most common questions about our luxury car rental service.
              </p>
            </div>
            <div className="reveal delay-100">
              {faqs.map((q, i) => <FAQItem key={i} question={q} />)}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

