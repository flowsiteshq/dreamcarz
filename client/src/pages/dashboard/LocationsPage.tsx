/**
 * DreamCarz — Locations Hub
 * Interactive map showing: DreamCarz HQ, member incident spots,
 * EV charging stations, in-network repair shops, dealerships,
 * car washes, and parking garages.
 */
import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Zap, Wrench, AlertTriangle, Car, Star, Phone,
  Clock, Navigation, ChevronRight, Shield, Droplets, ParkingCircle,
  Building2, Filter, ExternalLink,
} from "lucide-react";
import { useState } from "react";

type LocationCategory =
  | "all"
  | "dreamcarz"
  | "repair"
  | "charging"
  | "incident"
  | "dealership"
  | "carwash"
  | "parking";

interface Location {
  id: number;
  name: string;
  category: LocationCategory;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  hours?: string;
  distance: string;
  rating?: number;
  inNetwork: boolean;
  description: string;
  tags: string[];
  lat: number;
  lng: number;
  userIncident?: boolean;
}

const locations: Location[] = [
  // ── DreamCarz HQ ──────────────────────────────────────────────────────
  {
    id: 1,
    name: "DreamCarz Network — HQ",
    category: "dreamcarz",
    address: "10001 Derekwood Ln, Suite 204",
    city: "Lanham",
    state: "MD",
    zip: "20706",
    phone: "(301) 772-2500",
    hours: "Mon–Fri 9am–6pm · Sat 9am–3pm · Sun Closed",
    distance: "2.4 mi",
    rating: 5,
    inNetwork: true,
    description: "DreamCarz Network headquarters. Vehicle pickup, membership consultations, and concierge services.",
    tags: ["Headquarters", "Pickup", "Membership", "Concierge"],
    lat: 38.9407,
    lng: -76.8610,
  },
  // ── In-Network Repair Shops ───────────────────────────────────────────
  {
    id: 2,
    name: "Capital Auto Body & Repair",
    category: "repair",
    address: "4521 Kenilworth Ave",
    city: "Bladensburg",
    state: "MD",
    zip: "20710",
    phone: "(301) 864-2200",
    hours: "Mon–Fri 7:30am–5:30pm",
    distance: "3.1 mi",
    rating: 4.8,
    inNetwork: true,
    description: "Certified collision and mechanical repair. DreamCarz preferred partner for all vehicle repairs.",
    tags: ["Collision", "Mechanical", "Certified", "Preferred"],
    lat: 38.9421,
    lng: -76.9312,
  },
  {
    id: 3,
    name: "Precision Auto Works",
    category: "repair",
    address: "7890 Annapolis Rd",
    city: "Landover",
    state: "MD",
    zip: "20785",
    phone: "(301) 773-5500",
    hours: "Mon–Sat 8am–6pm",
    distance: "4.7 mi",
    rating: 4.6,
    inNetwork: true,
    description: "Full-service mechanical repair and diagnostics. Specializes in European and luxury vehicles.",
    tags: ["Mechanical", "Diagnostics", "Luxury", "European"],
    lat: 38.9318,
    lng: -76.8892,
  },
  {
    id: 4,
    name: "Elite Collision Center",
    category: "repair",
    address: "2200 Brightseat Rd",
    city: "Landover",
    state: "MD",
    zip: "20785",
    phone: "(301) 386-4400",
    hours: "Mon–Fri 8am–5pm",
    distance: "5.2 mi",
    rating: 4.7,
    inNetwork: true,
    description: "State-of-the-art collision repair facility. OEM-certified for Porsche, BMW, Mercedes, and Audi.",
    tags: ["Collision", "OEM Certified", "Porsche", "BMW", "Mercedes"],
    lat: 38.9198,
    lng: -76.8734,
  },
  {
    id: 5,
    name: "Metro Tire & Service",
    category: "repair",
    address: "6100 Sheriff Rd",
    city: "Cheverly",
    state: "MD",
    zip: "20785",
    phone: "(301) 322-1800",
    hours: "Mon–Sat 7am–7pm",
    distance: "6.0 mi",
    rating: 4.5,
    inNetwork: true,
    description: "Tire replacement, rotation, alignment, and brake service. Emergency tire service available.",
    tags: ["Tires", "Alignment", "Brakes", "Emergency"],
    lat: 38.9267,
    lng: -76.9156,
  },
  // ── EV Charging Stations ──────────────────────────────────────────────
  {
    id: 6,
    name: "Tesla Supercharger — Lanham",
    category: "charging",
    address: "9200 Basil Court",
    city: "Largo",
    state: "MD",
    zip: "20774",
    hours: "24/7",
    distance: "1.8 mi",
    rating: 4.4,
    inNetwork: false,
    description: "8 Tesla Supercharger stalls. Up to 250kW charging speed. Ideal for Tesla fleet vehicles.",
    tags: ["Tesla", "Supercharger", "250kW", "24/7"],
    lat: 38.9089,
    lng: -76.8423,
  },
  {
    id: 7,
    name: "ChargePoint — Bowie Town Center",
    category: "charging",
    address: "15606 Emerald Way",
    city: "Bowie",
    state: "MD",
    zip: "20716",
    hours: "24/7",
    distance: "8.3 mi",
    rating: 4.2,
    inNetwork: false,
    description: "12 Level 2 ChargePoint stations. Free parking while charging. Covered garage.",
    tags: ["ChargePoint", "Level 2", "Free Parking", "Covered"],
    lat: 38.9612,
    lng: -76.7342,
  },
  {
    id: 8,
    name: "EVgo Fast Charger — Greenbelt",
    category: "charging",
    address: "7500 Greenbelt Rd",
    city: "Greenbelt",
    state: "MD",
    zip: "20770",
    hours: "24/7",
    distance: "5.9 mi",
    rating: 4.3,
    inNetwork: false,
    description: "DC fast charging up to 100kW. Compatible with CCS and CHAdeMO. Accepts all major cards.",
    tags: ["EVgo", "DC Fast", "100kW", "CCS", "CHAdeMO"],
    lat: 38.9954,
    lng: -76.8754,
  },
  {
    id: 9,
    name: "Blink Charging — Largo Town Center",
    category: "charging",
    address: "10100 Campus Way S",
    city: "Largo",
    state: "MD",
    zip: "20774",
    hours: "24/7",
    distance: "3.4 mi",
    rating: 4.0,
    inNetwork: false,
    description: "4 Level 2 Blink charging stations in the Largo Town Center parking garage.",
    tags: ["Blink", "Level 2", "Parking Garage"],
    lat: 38.9001,
    lng: -76.8312,
  },
  // ── Incident Locations (user-specific) ───────────────────────────────
  {
    id: 10,
    name: "Reported Incident — Ref #DC-2024-0312",
    category: "incident",
    address: "I-495 Exit 22A",
    city: "Lanham",
    state: "MD",
    zip: "20706",
    distance: "1.2 mi",
    inNetwork: false,
    userIncident: true,
    description: "Minor fender bender reported on 03/12/2024. Case resolved. Repair completed at Capital Auto Body.",
    tags: ["Resolved", "Fender Bender", "Insurance Filed"],
    lat: 38.9512,
    lng: -76.8734,
  },
  // ── Dealerships ───────────────────────────────────────────────────────
  {
    id: 11,
    name: "Porsche of Annapolis",
    category: "dealership",
    address: "1 Compromise St",
    city: "Annapolis",
    state: "MD",
    zip: "21401",
    phone: "(410) 263-7100",
    hours: "Mon–Fri 9am–7pm · Sat 9am–5pm",
    distance: "24.1 mi",
    rating: 4.9,
    inNetwork: true,
    description: "Authorized Porsche dealership. DreamCarz Credit Free program accepted. New and certified pre-owned inventory.",
    tags: ["Porsche", "Credit Free", "New", "CPO"],
    lat: 38.9784,
    lng: -76.4912,
  },
  {
    id: 12,
    name: "Mercedes-Benz of Rockville",
    category: "dealership",
    address: "1526 Rockville Pike",
    city: "Rockville",
    state: "MD",
    zip: "20852",
    phone: "(301) 881-6600",
    hours: "Mon–Fri 9am–8pm · Sat 9am–6pm",
    distance: "18.7 mi",
    rating: 4.7,
    inNetwork: true,
    description: "Authorized Mercedes-Benz dealership. DreamCarz Credit Free program accepted.",
    tags: ["Mercedes-Benz", "Credit Free", "New", "CPO"],
    lat: 39.0812,
    lng: -77.1234,
  },
  // ── Car Washes ────────────────────────────────────────────────────────
  {
    id: 13,
    name: "Mister Car Wash — Lanham",
    category: "carwash",
    address: "8900 Annapolis Rd",
    city: "Lanham",
    state: "MD",
    zip: "20706",
    phone: "(301) 459-5200",
    hours: "Mon–Sun 7am–8pm",
    distance: "0.8 mi",
    rating: 4.3,
    inNetwork: true,
    description: "Full-service car wash and detailing. DreamCarz members receive 15% discount with membership card.",
    tags: ["Full Service", "Detailing", "15% Discount", "Member Perk"],
    lat: 38.9389,
    lng: -76.8523,
  },
  {
    id: 14,
    name: "DetailPro Auto Spa",
    category: "carwash",
    address: "3400 Pennsy Dr",
    city: "Landover",
    state: "MD",
    zip: "20785",
    phone: "(301) 322-9900",
    hours: "Mon–Sat 8am–6pm",
    distance: "4.1 mi",
    rating: 4.8,
    inNetwork: true,
    description: "Premium hand-wash and full detail service. Ceramic coating and paint protection film available.",
    tags: ["Hand Wash", "Ceramic Coating", "PPF", "Premium"],
    lat: 38.9267,
    lng: -76.8912,
  },
  // ── Parking ───────────────────────────────────────────────────────────
  {
    id: 15,
    name: "Largo Town Center Parking",
    category: "parking",
    address: "10100 Campus Way S",
    city: "Largo",
    state: "MD",
    zip: "20774",
    hours: "24/7",
    distance: "3.4 mi",
    rating: 4.1,
    inNetwork: false,
    description: "Covered parking garage with 1,200 spaces. EV charging available. Validated parking with DreamCarz.",
    tags: ["Covered", "EV Charging", "Validated", "1,200 Spaces"],
    lat: 38.9001,
    lng: -76.8312,
  },
];

const categories: { id: LocationCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: "all", label: "All", icon: MapPin, color: "bg-black text-white" },
  { id: "dreamcarz", label: "DreamCarz", icon: Building2, color: "bg-amber-500 text-white" },
  { id: "repair", label: "Repair Shops", icon: Wrench, color: "bg-blue-600 text-white" },
  { id: "charging", label: "EV Charging", icon: Zap, color: "bg-green-600 text-white" },
  { id: "incident", label: "My Incidents", icon: AlertTriangle, color: "bg-red-500 text-white" },
  { id: "dealership", label: "Dealerships", icon: Car, color: "bg-purple-600 text-white" },
  { id: "carwash", label: "Car Wash", icon: Droplets, color: "bg-cyan-500 text-white" },
  { id: "parking", label: "Parking", icon: ParkingCircle, color: "bg-gray-600 text-white" },
];

const categoryColors: Record<LocationCategory, string> = {
  all: "bg-black",
  dreamcarz: "bg-amber-500",
  repair: "bg-blue-600",
  charging: "bg-green-600",
  incident: "bg-red-500",
  dealership: "bg-purple-600",
  carwash: "bg-cyan-500",
  parking: "bg-gray-500",
};

const categoryIcons: Record<LocationCategory, React.ElementType> = {
  all: MapPin,
  dreamcarz: Building2,
  repair: Wrench,
  charging: Zap,
  incident: AlertTriangle,
  dealership: Car,
  carwash: Droplets,
  parking: ParkingCircle,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
      <span className="text-[11px] text-gray-400 ml-1">{rating}</span>
    </div>
  );
}

export default function LocationsPage() {
  const [activeCategory, setActiveCategory] = useState<LocationCategory>("all");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(locations[0]);
  const [search, setSearch] = useState("");
  const livePartners = trpc.partners.list.useQuery({ query: search || undefined, category: activeCategory }, { refetchOnWindowFocus: false });

  const filtered: Location[] = (livePartners.data?.length ? livePartners.data.map(item => ({ id: item.id, name: item.name, category: item.category as LocationCategory, address: item.address, city: item.city, state: item.state, zip: item.postalCode, phone: item.phone || undefined, hours: item.hours || undefined, distance: "Partner", rating: undefined, inNetwork: true, description: item.description || "DreamCarz approved partner.", tags: item.tags?.split(",").map(tag => tag.trim()).filter(Boolean) || [], lat: Number(item.latitude || 0), lng: Number(item.longitude || 0), userIncident: false })) : locations).filter(l => {
    const matchCat = activeCategory === "all" || l.category === activeCategory;
    const matchSearch = search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase()) ||
      l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const counts: Record<LocationCategory, number> = {
    all: locations.length,
    dreamcarz: locations.filter(l => l.category === "dreamcarz").length,
    repair: locations.filter(l => l.category === "repair").length,
    charging: locations.filter(l => l.category === "charging").length,
    incident: locations.filter(l => l.category === "incident").length,
    dealership: locations.filter(l => l.category === "dealership").length,
    carwash: locations.filter(l => l.category === "carwash").length,
    parking: locations.filter(l => l.category === "parking").length,
  };

  const IconComp = selectedLocation ? categoryIcons[selectedLocation.category] : MapPin;

  return (
    <DashboardShell title="Locations">
      <div className="space-y-4">

        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  isActive ? cat.color : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Icon size={12} />
                {cat.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-200 text-gray-400"}`}>
                  {counts[cat.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search locations, services, or tags..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] outline-none focus:border-gray-300 transition-colors"
          />
        </div>

        {/* Map + List layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Map embed */}
          <div className="lg:col-span-3 bg-gray-50 rounded-3xl overflow-hidden relative" style={{ minHeight: 420 }}>
            <iframe
              title="DreamCarz Locations Map"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 420 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyD-placeholder&q=${encodeURIComponent(
                selectedLocation
                  ? `${selectedLocation.address}, ${selectedLocation.city}, ${selectedLocation.state}`
                  : "10001 Derekwood Ln, Lanham, MD 20706"
              )}`}
            />
            {/* Map overlay with selected location info */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[selectedLocation.category]}`}>
                    <IconComp size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-black truncate">{selectedLocation.name}</p>
                    <p className="text-[11px] text-gray-400">{selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedLocation.address}, ${selectedLocation.city}, ${selectedLocation.state}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[11px] font-bold rounded-xl flex-shrink-0"
                  >
                    <Navigation size={10} /> Go
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Location list */}
          <div className="lg:col-span-2 space-y-2 overflow-y-auto" style={{ maxHeight: 500 }}>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">No locations found</p>
              </div>
            ) : (
              filtered.map(loc => {
                const Icon = categoryIcons[loc.category];
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-black bg-black/5"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[loc.category]}`}>
                        <Icon size={13} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="text-[13px] font-bold text-black leading-tight truncate">{loc.name}</p>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{loc.distance}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-1 truncate">{loc.address}, {loc.city}</p>
                        {loc.rating && <StarRating rating={loc.rating} />}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {loc.inNetwork && (
                            <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                              ✓ In Network
                            </span>
                          )}
                          {loc.userIncident && (
                            <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                              ⚠ Your Incident
                            </span>
                          )}
                          {loc.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected location detail card */}
        {selectedLocation && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${categoryColors[selectedLocation.category]}`}>
                <IconComp size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-[16px] font-bold text-black">{selectedLocation.name}</h3>
                    <p className="text-[12px] text-gray-400">{selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state} {selectedLocation.zip}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {selectedLocation.inNetwork && (
                      <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Shield size={9} /> In Network
                      </span>
                    )}
                    {selectedLocation.userIncident && (
                      <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={9} /> Your Incident
                      </span>
                    )}
                  </div>
                </div>
                {selectedLocation.rating && <StarRating rating={selectedLocation.rating} />}
              </div>
            </div>

            <p className="text-[13px] text-gray-500 mb-4">{selectedLocation.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {selectedLocation.phone && (
                <a href={`tel:${selectedLocation.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <Phone size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="text-[13px] font-bold text-black">{selectedLocation.phone}</p>
                  </div>
                </a>
              )}
              {selectedLocation.hours && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <Clock size={14} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Hours</p>
                    <p className="text-[12px] font-semibold text-black">{selectedLocation.hours}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedLocation.tags.map(tag => (
                <span key={tag} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedLocation.address}, ${selectedLocation.city}, ${selectedLocation.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white font-bold text-[13px] rounded-2xl hover:bg-gray-900 transition-colors"
              >
                <Navigation size={14} /> Get Directions
              </a>
              {selectedLocation.phone && (
                <a
                  href={`tel:${selectedLocation.phone}`}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-2xl text-[13px] font-bold text-black hover:border-gray-400 transition-colors"
                >
                  <Phone size={14} /> Call
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedLocation.name}, ${selectedLocation.city}, ${selectedLocation.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-2xl text-[13px] font-bold text-black hover:border-gray-400 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Report new incident location */}
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-black">Report an Incident Location</p>
            <p className="text-[12px] text-gray-400">Had an accident or issue? Report it and we'll add it to your incident history.</p>
          </div>
          <a
            href="/dashboard/report"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-gray-900 transition-colors flex-shrink-0"
          >
            Report <ChevronRight size={12} />
          </a>
        </div>

      </div>
    </DashboardShell>
  );
}
