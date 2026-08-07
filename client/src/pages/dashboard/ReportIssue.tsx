import { useState, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  ChevronRight, ExternalLink, Clock, Disc, Play, Wrench, BookOpen,
  Battery, Zap, Car, Volume2, AlertTriangle, ClipboardCheck,
  Phone, Camera, X, CheckCircle, MapPin, Sparkles,
  ShieldAlert, Settings, HelpCircle
} from "lucide-react";

type Tab = "request" | "resources";

const requestCategories = [
  { icon: Car, label: "Exterior", desc: "Body, paint, trim, glass" },
  { icon: Settings, label: "Interior", desc: "Seats, dashboard, controls" },
  { icon: ShieldAlert, label: "Collision & Glass", desc: "Accident damage, windshield" },
  { icon: Volume2, label: "Noise & Vibration", desc: "Unusual sounds while driving" },
  { icon: Disc, label: "Tires & Wheels", desc: "Flat, wear, alignment" },
  { icon: ClipboardCheck, label: "Inspection", desc: "Including post third party or inspection repairs" },
  { icon: Battery, label: "Battery & Charging", desc: "Power, range, charging issues" },
  { icon: Zap, label: "Electrical", desc: "Lights, sensors, electronics" },
  { icon: Wrench, label: "Maintenance", desc: "Oil, filters, scheduled service" },
  { icon: AlertTriangle, label: "Alerts", desc: "Warning lights, dashboard alerts" },
  { icon: HelpCircle, label: "Other", desc: "Any other concern" },
];

const resourceItems = [
  { icon: Clock, label: "History", desc: "Past service records", arrow: true },
  { icon: Disc, label: "Tire Center", desc: "Tire specs and service", arrow: true },
  { icon: Play, label: "Video Guides", desc: "How-to tutorials for your vehicle", arrow: true },
  { icon: Wrench, label: "Parts Shop", desc: "Order replacement parts", external: true },
  { icon: BookOpen, label: "Owner's Manual", desc: "Full vehicle documentation", external: true },
  { icon: Battery, label: "Vehicle Health", desc: "Diagnostics and status", arrow: true },
];

interface PhotoFile { id: string; url: string; }

export default function ReportIssue() {
  const [tab, setTab] = useState<Tab>("request");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId] = useState(() => `DC-${Date.now().toString().slice(-6)}`);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoFile[] = files.map(f => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 8));
  };

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocationLoading(false);
      },
      () => { setLocation("Unable to get location — please enter manually"); setLocationLoading(false); }
    );
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <DashboardShell title="Service">
        <div className="max-w-md mx-auto text-center py-14">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={30} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Request Submitted</h2>
          <p className="text-sm text-gray-400 mb-1">Reference: <span className="font-mono font-semibold text-black">{referenceId}</span></p>
          <p className="text-sm text-gray-400 mb-6">Our service team will contact you within 2 hours during business hours (Mon–Fri 9am–6pm, Sat 9am–3pm).</p>
          <a href="tel:3017722500" className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white text-sm font-semibold rounded-full mb-3 hover:bg-gray-900 transition-colors">
            <Phone size={14} /> Call (301) 772-2500
          </a>
          <button onClick={() => { setSubmitted(false); setSelectedCategory(null); setDescription(""); setPhotos([]); setLocation(""); setAiQuery(""); }}
            className="w-full py-3 border border-gray-200 text-black text-sm font-medium rounded-full hover:border-gray-400 transition-colors">
            Submit Another Request
          </button>
        </div>
      </DashboardShell>
    );
  }

  // ── Category detail form ──
  if (selectedCategory) {
    const cat = requestCategories.find(c => c.label === selectedCategory)!;
    const Icon = cat.icon;
    const isUrgent = selectedCategory === "Collision & Glass";
    return (
      <DashboardShell title="Service">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Vehicle header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">How Can We Help?</p>
              <h2 className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>2024 Porsche 911 Carrera S</h2>
            </div>
            <img src="/manus-storage/dash-car-current_6e167bf1.png" alt="Porsche" className="h-16 object-contain" />
          </div>

          {/* Back + category */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedCategory(null)} className="text-sm text-gray-400 hover:text-black transition-colors">← Back</button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <Icon size={13} className="text-gray-600" />
              <span className="text-[12px] font-semibold text-black">{cat.label}</span>
            </div>
            {isUrgent && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">URGENT</span>}
          </div>

          {/* AI describe box */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[12px] font-semibold text-black mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-gray-400" /> Describe the issue
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe your ${cat.label.toLowerCase()} concern in detail...`}
              className="w-full h-24 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-[12px] font-semibold text-black block mb-2">Current Location</label>
            <div className="flex gap-2">
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Enter address or use GPS..."
                className="flex-1 p-3 bg-gray-50 rounded-xl text-[13px] text-black placeholder-gray-300 outline-none border border-gray-100 focus:border-gray-300 transition-colors" />
              <button onClick={getLocation} disabled={locationLoading}
                className="px-4 py-3 bg-black text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-gray-900 transition-colors">
                {locationLoading ? <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" /> : <MapPin size={13} />}
                GPS
              </button>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[12px] font-semibold text-black block mb-2">Photos <span className="text-gray-400 font-normal">(optional, up to 8)</span></label>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoAdd} className="hidden" />
            <div className="grid grid-cols-4 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-gray-400 transition-colors bg-gray-50">
                  <Camera size={18} className="text-gray-400" />
                  <span className="text-[9px] text-gray-400 font-medium">Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!description.trim() || submitting}
            className={`w-full py-3.5 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${description.trim() ? (isUrgent ? "bg-red-600 text-white hover:bg-red-700" : "bg-black text-white hover:bg-gray-900") : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            {submitting ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
            {submitting ? "Submitting..." : isUrgent ? "Submit Emergency Request" : "Submit Service Request"}
          </button>

          {/* Emergency roadside */}
          <a href="tel:3017722500"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-100 text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
            <Phone size={14} /> Emergency Roadside Help
          </a>
        </div>
      </DashboardShell>
    );
  }

  // ── Main service page ──
  return (
    <DashboardShell title="Service">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Vehicle header — Tesla style */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-[12px] text-gray-400 mb-0.5">How Can We Help?</p>
            <h2 className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>2024 Porsche 911 Carrera S</h2>
          </div>
          <img src="/manus-storage/dash-car-current_6e167bf1.png" alt="Porsche 911" className="h-20 object-contain -mb-2" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(["request", "resources"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-sm font-semibold capitalize transition-colors relative ${tab === t ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
            </button>
          ))}
        </div>

        {/* REQUEST TAB */}
        {tab === "request" && (
          <div className="space-y-3">
            {/* AI describe box */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[12px] font-semibold text-black mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-gray-400" /> Describe Question or Concern
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder='"Why is my check engine light on?"'
                  className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none"
                  onKeyDown={e => { if (e.key === "Enter" && aiQuery.trim()) { setSelectedCategory("Other"); setDescription(aiQuery); } }}
                />
                <button onClick={() => { if (aiQuery.trim()) { setSelectedCategory("Other"); setDescription(aiQuery); } }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={14} className="text-black" />
                </button>
              </div>
            </div>

            {/* Category list */}
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {requestCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <button key={i} onClick={() => setSelectedCategory(cat.label)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-black">{cat.label}</p>
                      {cat.desc && <p className="text-[11px] text-gray-400 truncate">{cat.desc}</p>}
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Emergency roadside */}
            <a href="tel:3017722500"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-100 text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
              <Phone size={14} /> Emergency Roadside Help
            </a>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              By submitting a service request, you allow DreamCarz to access vehicle diagnostic data to determine service needs.{" "}
              <button className="underline hover:text-black transition-colors">Learn More</button>
            </p>
          </div>
        )}

        {/* RESOURCES TAB */}
        {tab === "resources" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {resourceItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button key={i}
                    className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-black">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.desc}</p>
                    </div>
                    {item.external
                      ? <ExternalLink size={14} className="text-gray-300 flex-shrink-0" />
                      : <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Contact card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[12px] font-semibold text-black mb-3">DreamCarz Service Center</p>
              <p className="text-[12px] text-gray-500 mb-1">10001 Derekwood Ln, Suite 204, Lanham, MD 20706</p>
              <p className="text-[12px] text-gray-500 mb-3">Mon–Fri 9am–6pm · Sat 9am–3pm · Sun Closed</p>
              <a href="tel:3017722500"
                className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
                <Phone size={13} /> (301) 772-2500
              </a>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
