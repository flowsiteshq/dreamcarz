/**
 * DreamCarz — Vehicle Detail Page
 * Full stats for a selected vehicle: specs, performance, DCP earning by tier,
 * program fees, Credit Free eligibility, and booking inquiry.
 */
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  ChevronLeft, Zap, Users, Settings, Fuel, Shield, Star, Award,
  CheckCircle2, Calendar, Phone, ArrowRight, Gauge, DollarSign,
  BarChart3, Crown, Info,
} from "lucide-react";
import { useState } from "react";

// ── Full vehicle catalog with extended stats ──────────────────────────────
export const allVehicles = [
  // Value Tier
  {
    id: 101, name: "Honda Civic 2023", make: "Honda", model: "Civic", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-1_ab248f67.png",
    price: 16000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 158, torque: 138, seats: 5, doors: 4, fuel: "Gasoline", transmission: "CVT", drivetrain: "FWD", mpg: "32 city / 42 hwy", engine: "1.5L Turbocharged 4-Cyl" },
    performance: { zeroToSixty: "7.4s", topSpeed: "137 mph" },
    dcpEarn: 32000, available: true, badge: "Best Value",
    creditFreeEligible: true, creditFreeThreshold: 2400,
    colors: ["Sonic Gray Pearl", "Rallye Red", "Lunar Silver Metallic", "Aegean Blue Metallic"],
    features: ["Apple CarPlay & Android Auto", "Honda Sensing Safety Suite", "Heated Front Seats", "Wireless Phone Charging", "8-inch Touchscreen", "Backup Camera"],
    description: "The Honda Civic is the perfect everyday companion — fuel-efficient, reliable, and packed with technology. Ideal for members who want dependable transportation while building DCP.",
  },
  {
    id: 102, name: "Toyota Corolla 2023", make: "Toyota", model: "Corolla", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-8_9abf3a26.png",
    price: 15500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 169, torque: 151, seats: 5, doors: 4, fuel: "Gasoline", transmission: "CVT", drivetrain: "FWD", mpg: "31 city / 40 hwy", engine: "2.0L Dynamic-Force 4-Cyl" },
    performance: { zeroToSixty: "7.2s", topSpeed: "124 mph" },
    dcpEarn: 31000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 2325,
    colors: ["Midnight Black Metallic", "Ice Cap White", "Celestite Gray Metallic", "Blueprint"],
    features: ["Toyota Safety Sense 3.0", "Apple CarPlay & Android Auto", "8-inch Touchscreen", "Adaptive Cruise Control", "Lane Departure Alert", "Backup Camera"],
    description: "Toyota's legendary reliability in a sleek modern package. The Corolla is one of the best-selling cars in the world for a reason — and now it earns you DCP.",
  },
  {
    id: 103, name: "Toyota Camry 2023", make: "Toyota", model: "Camry", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-2_9d827670.png",
    price: 18500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 203, torque: 184, seats: 5, doors: 4, fuel: "Gasoline", transmission: "8-Speed Auto", drivetrain: "FWD", mpg: "28 city / 39 hwy", engine: "2.5L 4-Cyl" },
    performance: { zeroToSixty: "7.0s", topSpeed: "130 mph" },
    dcpEarn: 37000, available: true, badge: "Popular",
    creditFreeEligible: true, creditFreeThreshold: 2775,
    colors: ["Midnight Black Metallic", "Wind Chill Pearl", "Cavalry Blue", "Supersonic Red"],
    features: ["Toyota Safety Sense 2.5+", "Apple CarPlay & Android Auto", "9-inch Touchscreen", "Wireless Charging", "Heated & Ventilated Seats", "JBL Premium Audio"],
    description: "The Camry strikes the perfect balance between comfort, performance, and value. A midsize sedan that delivers a premium feel without the premium price tag.",
  },
  {
    id: 104, name: "Nissan Altima 2023", make: "Nissan", model: "Altima", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-5_ff412710.png",
    price: 17000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 182, torque: 178, seats: 5, doors: 4, fuel: "Gasoline", transmission: "CVT", drivetrain: "AWD", mpg: "27 city / 38 hwy", engine: "2.5L 4-Cyl" },
    performance: { zeroToSixty: "7.6s", topSpeed: "128 mph" },
    dcpEarn: 34000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 2550,
    colors: ["Brilliant Silver Metallic", "Gun Metallic", "Deep Blue Pearl", "Pearl White Tricoat"],
    features: ["ProPILOT Assist", "Apple CarPlay & Android Auto", "8-inch Touchscreen", "AWD All-Weather Capability", "Heated Front Seats", "Bose Audio System"],
    description: "The Altima offers AWD capability at a value price — perfect for members who need all-weather confidence while earning DCP through qualifying rental activity.",
  },
  {
    id: 105, name: "Chevrolet Malibu 2023", make: "Chevrolet", model: "Malibu", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-6_ad466653.png",
    price: 16500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 160, torque: 184, seats: 5, doors: 4, fuel: "Gasoline", transmission: "CVT", drivetrain: "FWD", mpg: "29 city / 36 hwy", engine: "1.5L Turbocharged 4-Cyl" },
    performance: { zeroToSixty: "7.8s", topSpeed: "125 mph" },
    dcpEarn: 33000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 2475,
    colors: ["Summit White", "Mosaic Black Metallic", "Silver Ice Metallic", "Cajun Red Tintcoat"],
    features: ["Chevy Safety Assist", "Apple CarPlay & Android Auto", "8-inch Infotainment", "Teen Driver Technology", "Rear Cross Traffic Alert", "Wireless Charging"],
    description: "Spacious, comfortable, and loaded with tech. The Malibu is Chevrolet's flagship midsize sedan — great for families and commuters alike.",
  },
  {
    id: 106, name: "Hyundai Tucson 2023", make: "Hyundai", model: "Tucson", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-3_cf351661.png",
    price: 19500, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 187, torque: 178, seats: 5, doors: 4, fuel: "Gasoline", transmission: "8-Speed Auto", drivetrain: "AWD", mpg: "26 city / 33 hwy", engine: "2.5L 4-Cyl" },
    performance: { zeroToSixty: "7.5s", topSpeed: "130 mph" },
    dcpEarn: 39000, available: true, badge: "SUV",
    creditFreeEligible: true, creditFreeThreshold: 2925,
    colors: ["Shimmering Silver", "Phantom Black", "Calypso Red", "Deep Sea Blue"],
    features: ["Hyundai SmartSense Safety", "Apple CarPlay & Android Auto", "10.25-inch Touchscreen", "Panoramic Sunroof", "Heated & Ventilated Seats", "Bose Premium Sound"],
    description: "A stylish compact SUV with bold design and a feature-packed interior. The Tucson gives you SUV versatility with sedan-like fuel efficiency.",
  },
  {
    id: 107, name: "Kia Sportage 2023", make: "Kia", model: "Sportage", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-4_f1bd50cc.png",
    price: 19000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 187, torque: 178, seats: 5, doors: 4, fuel: "Gasoline", transmission: "8-Speed Auto", drivetrain: "AWD", mpg: "25 city / 32 hwy", engine: "2.5L 4-Cyl" },
    performance: { zeroToSixty: "7.7s", topSpeed: "128 mph" },
    dcpEarn: 38000, available: false, badge: "SUV",
    creditFreeEligible: true, creditFreeThreshold: 2850,
    colors: ["Snow White Pearl", "Gravity Grey", "Aurora Black Pearl", "Dawning Red"],
    features: ["Kia Drive Wise Safety", "Apple CarPlay & Android Auto", "12.3-inch Curved Display", "Dual Panoramic Sunroof", "Heated Steering Wheel", "Harman Kardon Audio"],
    description: "Kia's award-winning compact SUV with a futuristic interior and advanced technology. The Sportage redefines what value means in the SUV segment.",
  },
  {
    id: 108, name: "Ford Escape 2023", make: "Ford", model: "Escape", year: 2023,
    category: "Value", image: "/manus-storage/car-budget-7_1b4d2b9c.png",
    price: 18000, weeklyFee: { freedom: 79, plus: 69, pro: 59, elite: 49 },
    specs: { hp: 181, torque: 190, seats: 5, doors: 4, fuel: "Gasoline", transmission: "8-Speed Auto", drivetrain: "AWD", mpg: "28 city / 34 hwy", engine: "1.5L EcoBoost Turbo" },
    performance: { zeroToSixty: "7.9s", topSpeed: "126 mph" },
    dcpEarn: 36000, available: true, badge: "SUV",
    creditFreeEligible: true, creditFreeThreshold: 2700,
    colors: ["Oxford White", "Carbonized Gray Metallic", "Rapid Red Metallic", "Atlas Blue Metallic"],
    features: ["Ford Co-Pilot360 Safety", "Apple CarPlay & Android Auto", "8-inch SYNC Touchscreen", "AWD Intelligent 4WD", "Heated Front Seats", "B&O Sound System"],
    description: "Ford's versatile compact SUV with EcoBoost efficiency and smart AWD. The Escape is built for adventure and everyday practicality.",
  },
  // Premium Tier
  {
    id: 1, name: "Porsche 911 Carrera 2025", make: "Porsche", model: "911 Carrera", year: 2025,
    category: "Sports", image: "/manus-storage/car-card-1_8dfc0a4a.png",
    price: 145000, weeklyFee: { freedom: 299, plus: 249, pro: 199, elite: 149 },
    specs: { hp: 640, torque: 590, seats: 2, doors: 2, fuel: "Gasoline", transmission: "8-Speed PDK", drivetrain: "RWD", mpg: "18 city / 24 hwy", engine: "3.0L Twin-Turbo Flat-6" },
    performance: { zeroToSixty: "2.7s", topSpeed: "205 mph" },
    dcpEarn: 290000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 21750,
    colors: ["Guards Red", "GT Silver Metallic", "Jet Black Metallic", "Gentian Blue Metallic", "Chalk"],
    features: ["Porsche Active Suspension Management", "Sport Chrono Package", "BOSE Surround Sound", "Porsche Communication Management", "Sport Exhaust System", "Carbon Ceramic Brakes"],
    description: "The icon. The Porsche 911 Carrera is the benchmark by which all sports cars are measured. Timeless design, exhilarating performance, and qualifying rental activity that can earn DCP.",
  },
  {
    id: 2, name: "Audi R8 V10 Performance", make: "Audi", model: "R8 V10", year: 2024,
    category: "Sports", image: "/manus-storage/car-card-2_d8411d99.png",
    price: 165000, weeklyFee: { freedom: 349, plus: 299, pro: 249, elite: 199 },
    specs: { hp: 562, torque: 406, seats: 2, doors: 2, fuel: "Gasoline", transmission: "7-Speed S tronic", drivetrain: "AWD", mpg: "14 city / 21 hwy", engine: "5.2L Naturally Aspirated V10" },
    performance: { zeroToSixty: "3.2s", topSpeed: "201 mph" },
    dcpEarn: 330000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 24750,
    colors: ["Daytona Gray Pearl", "Mythos Black Metallic", "Ibis White", "Ara Blue Crystal Effect"],
    features: ["Audi Magnetic Ride", "Virtual Cockpit Plus", "Bang & Olufsen 3D Sound", "Audi Drive Select", "Carbon Fiber Interior Inlays", "Sport Exhaust"],
    description: "The Audi R8 V10 is a naturally aspirated masterpiece. With a screaming V10 engine and Quattro AWD, it delivers supercar performance with everyday usability.",
  },
  {
    id: 3, name: "Ferrari Portofino M 2025", make: "Ferrari", model: "Portofino M", year: 2025,
    category: "Supercar", image: "/manus-storage/car-card-3_23f3c0ab.png",
    price: 245000, weeklyFee: { freedom: 499, plus: 429, pro: 359, elite: 299 },
    specs: { hp: 612, torque: 560, seats: 2, doors: 2, fuel: "Gasoline", transmission: "8-Speed DCT", drivetrain: "RWD", mpg: "14 city / 20 hwy", engine: "3.9L Twin-Turbo V8" },
    performance: { zeroToSixty: "3.45s", topSpeed: "199 mph" },
    dcpEarn: 490000, available: false, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 36750,
    colors: ["Rosso Corsa", "Giallo Modena", "Bianco Avus", "Blu Tour de France"],
    features: ["Ferrari Dynamic Enhancer+", "Manettino Drive Mode Selector", "Retractable Hardtop", "JBL Professional Audio", "Carbon Fiber Racing Seats", "Ferrari Telemetry"],
    description: "The Ferrari Portofino M is the perfect grand tourer — a retractable hardtop that transforms from open-air freedom to elegant coupe in 14 seconds.",
  },
  {
    id: 4, name: "Mercedes-Benz E-Class 2024", make: "Mercedes-Benz", model: "E-Class", year: 2024,
    category: "Luxury", image: "/manus-storage/car-card-4_6af95632.png",
    price: 68000, weeklyFee: { freedom: 179, plus: 149, pro: 119, elite: 89 },
    specs: { hp: 429, torque: 384, seats: 4, doors: 4, fuel: "Gasoline", transmission: "9-Speed Auto", drivetrain: "RWD", mpg: "21 city / 30 hwy", engine: "3.0L Inline-6 Turbo" },
    performance: { zeroToSixty: "4.9s", topSpeed: "155 mph" },
    dcpEarn: 136000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 10200,
    colors: ["Obsidian Black Metallic", "Selenite Grey Metallic", "Polar White", "Cavansite Blue Metallic"],
    features: ["MBUX Infotainment System", "Burmester 3D Surround Sound", "Active Distance Assist DISTRONIC", "Massage Front Seats", "64-Color Ambient Lighting", "Augmented Reality Navigation"],
    description: "The Mercedes E-Class defines executive luxury. Sophisticated, technologically advanced, and supremely comfortable — the benchmark for business-class travel.",
  },
  {
    id: 5, name: "BMW i8 Coupe 2024", make: "BMW", model: "i8 Coupe", year: 2024,
    category: "Electric", image: "/manus-storage/car-card-5_bd8a563d.png",
    price: 148000, weeklyFee: { freedom: 299, plus: 249, pro: 199, elite: 149 },
    specs: { hp: 369, torque: 420, seats: 2, doors: 2, fuel: "Hybrid", transmission: "6-Speed Auto", drivetrain: "AWD", mpg: "76 MPGe / 28 hwy", engine: "1.5L TwinPower Turbo + Electric Motor" },
    performance: { zeroToSixty: "4.2s", topSpeed: "155 mph" },
    dcpEarn: 296000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 22200,
    colors: ["Crystal White Pearl", "Sophisto Grey Metallic", "Protonic Dark Silver", "Frozen Black Metallic"],
    features: ["Laser Headlights", "Harman Kardon Surround Sound", "Scissor Doors", "Head-Up Display", "Gesture Control", "BMW Connected Drive"],
    description: "The BMW i8 is a vision of the future made real. Scissor doors, futuristic styling, and a hybrid powertrain that delivers both performance and efficiency.",
  },
  {
    id: 6, name: "Audi A6 Sedan 2024", make: "Audi", model: "A6 Sedan", year: 2024,
    category: "Luxury", image: "/manus-storage/car-card-6_4972fbf1.png",
    price: 62000, weeklyFee: { freedom: 159, plus: 129, pro: 99, elite: 79 },
    specs: { hp: 335, torque: 369, seats: 5, doors: 4, fuel: "Gasoline", transmission: "7-Speed S tronic", drivetrain: "AWD", mpg: "22 city / 31 hwy", engine: "3.0L TFSI V6" },
    performance: { zeroToSixty: "5.1s", topSpeed: "155 mph" },
    dcpEarn: 124000, available: true, badge: null,
    creditFreeEligible: true, creditFreeThreshold: 9300,
    colors: ["Florett Silver Metallic", "Mythos Black Metallic", "Navarra Blue Metallic", "Glacier White Metallic"],
    features: ["MMI Navigation Plus", "Bang & Olufsen 3D Sound", "Quattro AWD", "Virtual Cockpit Plus", "Massage Seats", "Matrix LED Headlights"],
    description: "The Audi A6 is the perfect blend of sportiness and luxury. Quattro AWD, a powerful V6, and Audi's signature interior craftsmanship make every journey exceptional.",
  },
];

type Tier = "freedom" | "plus" | "pro" | "elite";

export default function VehicleDetail() {
  const [, navigate] = useLocation();
  const [selectedTier, setSelectedTier] = useState<Tier>("pro");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", date: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  // Get vehicle ID from URL
  const params = new URLSearchParams(window.location.search);
  const vehicleId = parseInt(params.get("id") || "1");
  const vehicle = allVehicles.find(v => v.id === vehicleId) || allVehicles[0];

  const dcpValue = vehicle.dcpEarn * 0.01;
  const creditFreeValue = vehicle.creditFreeThreshold;
  const memberDcp = 285000;
  const memberDcpValue = memberDcp * 0.01;
  const progressPct = Math.min((memberDcpValue / creditFreeValue) * 100, 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-24 pb-16">
        <div className="container max-w-6xl">

          {/* Back button */}
          <button
            onClick={() => navigate("/fleet")}
            className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-black transition-colors mb-6"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <ChevronLeft size={16} /> Back to Fleet
          </button>

          {/* Hero section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Car image */}
            <div className="bg-gray-50 rounded-3xl p-8 flex items-center justify-center relative" style={{ minHeight: 320 }}>
              <img src={vehicle.image} alt={vehicle.name} className="w-full object-contain" style={{ maxHeight: 280 }} />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="text-[11px] font-bold bg-black text-white px-3 py-1 rounded-full uppercase tracking-wider">
                  {vehicle.category}
                </span>
                {vehicle.badge && (
                  <span className="text-[11px] font-bold bg-white border border-gray-200 text-black px-3 py-1 rounded-full">
                    {vehicle.badge}
                  </span>
                )}
              </div>
              {!vehicle.available && (
                <div className="absolute top-4 right-4">
                  <span className="text-[11px] font-bold bg-gray-200 text-gray-500 px-3 py-1 rounded-full">Reserved</span>
                </div>
              )}
            </div>

            {/* Key info */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                {vehicle.year} · {vehicle.make}
              </p>
              <h1 className="text-4xl font-bold text-black mb-2 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {vehicle.model}
              </h1>
              <p className="text-gray-500 text-[14px] mb-6 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
                {vehicle.description}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Horsepower", value: `${vehicle.specs.hp} HP`, icon: Gauge },
                  { label: "0–60 mph", value: vehicle.performance.zeroToSixty, icon: Zap },
                  { label: "Top Speed", value: vehicle.performance.topSpeed, icon: BarChart3 },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                    <s.icon size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-[15px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tier selector + pricing */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold text-black uppercase tracking-wider">Program Fee by Tier</p>
                  <div className="flex gap-1">
                    {(["freedom", "plus", "pro", "elite"] as Tier[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTier(t)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors ${selectedTier === t ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>
                      ${vehicle.weeklyFee[selectedTier]}<span className="text-lg font-normal text-gray-400">/wk</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} tier program fee</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-gray-400">Vehicle value</p>
                    <p className="text-lg font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>${vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => vehicle.available && setShowBooking(true)}
                  disabled={!vehicle.available}
                  className={`flex-1 py-3 rounded-2xl text-[14px] font-bold transition-all active:scale-[0.97] ${vehicle.available ? "bg-black text-white hover:bg-gray-900" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {vehicle.available ? "Book This Vehicle" : "Join Waitlist"}
                </button>
                <a
                  href="tel:3017722500"
                  className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-2xl text-[14px] font-bold text-black hover:border-gray-400 transition-colors"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <Phone size={15} /> Call
                </a>
              </div>
            </div>
          </div>

          {/* Full specs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Technical Specifications */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <h2 className="text-[15px] font-bold text-black mb-4 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" /> Technical Specifications
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Engine", value: vehicle.specs.engine },
                  { label: "Horsepower", value: `${vehicle.specs.hp} HP` },
                  { label: "Torque", value: `${vehicle.specs.torque} lb-ft` },
                  { label: "Transmission", value: vehicle.specs.transmission },
                  { label: "Drivetrain", value: vehicle.specs.drivetrain },
                  { label: "Fuel Type", value: vehicle.specs.fuel },
                  { label: "Fuel Economy", value: vehicle.specs.mpg },
                  { label: "Seating", value: `${vehicle.specs.seats} passengers` },
                  { label: "Doors", value: `${vehicle.specs.doors} doors` },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <p className="text-[12px] text-gray-400" style={{ fontFamily: "var(--font-sans)" }}>{row.label}</p>
                    <p className="text-[13px] font-semibold text-black" style={{ fontFamily: "var(--font-sans)" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DCP & Program Details */}
            <div className="space-y-4">
              <div className="bg-black rounded-3xl p-6">
                <h2 className="text-[15px] font-bold text-white mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" /> DCP Earning Breakdown
                </h2>
                <div className="space-y-3 mb-4">
                  {[
                    { label: "DCP on Acquisition", value: `${vehicle.dcpEarn.toLocaleString()} DCP` },
                    { label: "DCP Dollar Value", value: `$${dcpValue.toLocaleString()}` },
                    { label: "Credit Free Threshold", value: `$${creditFreeValue.toLocaleString()}` },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-[12px] text-gray-400">{row.label}</p>
                      <p className="text-[13px] font-bold text-white font-mono">{row.value}</p>
                    </div>
                  ))}
                </div>
                {/* Credit Free progress */}
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-gray-400">Your Credit Free Progress</p>
                    <p className="text-[11px] font-bold text-white">{progressPct.toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#B8860B,#FFD700)" }} />
                  </div>
                  <p className="text-[10px] text-gray-500">${memberDcpValue.toLocaleString()} of ${creditFreeValue.toLocaleString()} required</p>
                </div>
              </div>

              {/* Program fees by all tiers */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6">
                <h2 className="text-[15px] font-bold text-black mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-400" /> All Tier Program Fees
                </h2>
                <div className="space-y-2">
                  {(["freedom", "plus", "pro", "elite"] as Tier[]).map(t => (
                    <div key={t} className={`flex items-center justify-between p-3 rounded-xl ${selectedTier === t ? "bg-black" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        {t === "elite" ? <Crown size={13} className={selectedTier === t ? "text-yellow-400" : "text-gray-400"} /> :
                         t === "pro" ? <Star size={13} className={selectedTier === t ? "text-yellow-400" : "text-gray-400"} /> :
                         t === "plus" ? <Award size={13} className={selectedTier === t ? "text-yellow-400" : "text-gray-400"} /> :
                         <Shield size={13} className={selectedTier === t ? "text-yellow-400" : "text-gray-400"} />}
                        <p className={`text-[13px] font-semibold capitalize ${selectedTier === t ? "text-white" : "text-black"}`}>{t}</p>
                      </div>
                      <p className={`text-[14px] font-bold font-mono ${selectedTier === t ? "text-white" : "text-black"}`}>
                        ${vehicle.weeklyFee[t]}/wk
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features + Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <h2 className="text-[15px] font-bold text-black mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gray-400" /> Key Features
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {vehicle.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                    <p className="text-[13px] text-gray-700" style={{ fontFamily: "var(--font-sans)" }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <h2 className="text-[15px] font-bold text-black mb-4">Available Colors</h2>
              <div className="space-y-2">
                {vehicle.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-100 flex-shrink-0" />
                    <p className="text-[13px] text-gray-700" style={{ fontFamily: "var(--font-sans)" }}>{c}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                  <Info size={11} className="flex-shrink-0 mt-0.5" />
                  Color availability may vary. Contact our concierge team to confirm your preferred color.
                </p>
              </div>
            </div>
          </div>

          {/* Booking modal */}
          {showBooking && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowBooking(false)}>
              <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                {!submitted ? (
                  <>
                    <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Book the {vehicle.model}</h3>
                    <p className="text-[12px] text-gray-400 mb-5">Fill out the form and our team will confirm within 2 hours.</p>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input required value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})} placeholder="Your full name" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-gray-100 focus:border-gray-300" />
                      <input required type="email" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})} placeholder="Email address" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-gray-100 focus:border-gray-300" />
                      <input required value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} placeholder="Phone number" className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-gray-100 focus:border-gray-300" />
                      <input required type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-gray-100 focus:border-gray-300" />
                      <textarea value={bookingForm.message} onChange={e => setBookingForm({...bookingForm, message: e.target.value})} placeholder="Any special requests or questions?" rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-gray-100 focus:border-gray-300 resize-none" />
                      <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-2xl hover:bg-gray-900 transition-colors">
                        Submit Booking Request
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Request Submitted!</h3>
                    <p className="text-[13px] text-gray-400 mb-5">Our team will confirm your {vehicle.model} booking within 2 hours. We'll reach out at the contact info you provided.</p>
                    <button onClick={() => { setShowBooking(false); setSubmitted(false); }} className="w-full py-3 bg-black text-white font-bold rounded-2xl">Done</button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
