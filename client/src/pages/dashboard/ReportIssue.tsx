import { useState, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  AlertTriangle, Wrench, Car, Camera, MapPin, Phone,
  CheckCircle, Upload, X, ChevronRight, Zap, Shield,
  FileText, Clock
} from "lucide-react";

type IncidentType = "crash" | "mechanical" | "service" | "damage" | "other" | null;

const incidentTypes = [
  {
    id: "crash" as const,
    icon: AlertTriangle,
    label: "Crash / Accident",
    desc: "Vehicle was involved in a collision",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    selectedBg: "bg-red-600",
    urgent: true,
  },
  {
    id: "mechanical" as const,
    icon: Wrench,
    label: "Mechanical Issue",
    desc: "Engine, brakes, transmission, or other mechanical problem",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    selectedBg: "bg-orange-600",
    urgent: false,
  },
  {
    id: "service" as const,
    icon: Car,
    label: "Service Needed",
    desc: "Oil change, tire rotation, scheduled maintenance",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    selectedBg: "bg-blue-600",
    urgent: false,
  },
  {
    id: "damage" as const,
    icon: Shield,
    label: "Body Damage",
    desc: "Scratches, dents, broken glass, or cosmetic damage",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    selectedBg: "bg-purple-600",
    urgent: false,
  },
  {
    id: "other" as const,
    icon: FileText,
    label: "Other Issue",
    desc: "Electrical, interior, or any other concern",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    selectedBg: "bg-gray-700",
    urgent: false,
  },
];

interface PhotoFile {
  id: string;
  url: string;
  name: string;
}

export default function ReportIssue() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [incidentType, setIncidentType] = useState<IncidentType>(null);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referenceId] = useState(() => `DC-INC-${Date.now().toString().slice(-6)}`);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedType = incidentTypes.find(t => t.id === incidentType);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoFile[] = files.map(f => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 8));
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocationLoading(false);
      },
      () => {
        setLocation("Location unavailable — please enter manually");
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    const isUrgent = selectedType?.urgent;
    return (
      <DashboardShell title="Report an Issue">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isUrgent ? "bg-red-100" : "bg-green-100"}`}>
            <CheckCircle size={36} className={isUrgent ? "text-red-600" : "text-green-600"} />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {isUrgent ? "Emergency Report Submitted" : "Report Submitted"}
          </h2>
          <p className="text-gray-500 text-sm mb-2">Reference ID: <strong className="text-black font-mono">{referenceId}</strong></p>
          <p className="text-gray-500 text-sm mb-6">
            {isUrgent
              ? "Our team has been notified immediately. Someone will contact you within 15 minutes. If you are in immediate danger, call 911 first."
              : "Your report has been received. Our service team will review it and contact you within 2 hours during business hours."}
          </p>
          {isUrgent && (
            <a href="tel:3017722500" className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white text-[13px] font-semibold rounded-full hover:bg-red-700 transition-colors mb-3">
              <Phone size={15} /> Call DreamCarz Now: (301) 772-2500
            </a>
          )}
          <div className="bg-gray-50 rounded-2xl p-4 text-left mb-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">What happens next</p>
            <div className="space-y-2">
              {[
                isUrgent ? "Emergency team notified immediately" : "Report reviewed within 2 hours",
                "Service coordinator will call you",
                "Vehicle inspection scheduled",
                "Resolution tracked in your dashboard",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</div>
                  {step}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => { setSubmitted(false); setStep(1); setIncidentType(null); setPhotos([]); setDescription(""); setLocation(""); }}
            className="w-full py-3 border border-gray-200 text-black text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">
            Submit Another Report
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Report an Issue">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Report a Vehicle Issue</h2>
          <p className="text-sm text-gray-400 mt-0.5">Submit a service request, damage report, or emergency incident</p>
        </div>

        {/* Emergency banner */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-700">In an emergency or accident?</p>
            <p className="text-[11px] text-red-500 mt-0.5">Call 911 first, then contact DreamCarz immediately.</p>
          </div>
          <a href="tel:3017722500" className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white text-[11px] font-semibold rounded-full hover:bg-red-700 transition-colors flex items-center gap-1">
            <Phone size={11} /> Call Now
          </a>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${step >= s ? "bg-black text-white" : "bg-gray-100 text-gray-400"}`}>{s}</div>
              <span className={`text-[11px] font-medium hidden sm:block ${step >= s ? "text-black" : "text-gray-400"}`}>
                {s === 1 ? "Issue Type" : s === 2 ? "Details & Photos" : "Review & Submit"}
              </span>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-black" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Issue type */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-black">What type of issue are you reporting?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incidentTypes.map(t => {
                const Icon = t.icon;
                const selected = incidentType === t.id;
                return (
                  <button key={t.id} onClick={() => setIncidentType(t.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150 ${selected ? `${t.selectedBg} border-transparent text-white` : `bg-white ${t.border} hover:shadow-sm`}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? "bg-white/20" : t.bg}`}>
                      <Icon size={18} className={selected ? "text-white" : t.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-bold ${selected ? "text-white" : "text-black"}`}>{t.label}</p>
                        {t.urgent && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selected ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>URGENT</span>}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${selected ? "text-white/80" : "text-gray-400"}`}>{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => incidentType && setStep(2)} disabled={!incidentType}
              className={`w-full py-3 text-[13px] font-semibold rounded-full transition-colors ${incidentType ? "bg-black text-white hover:bg-gray-900" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Continue <ChevronRight size={14} className="inline" />
            </button>
          </div>
        )}

        {/* STEP 2: Details & Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {selectedType && <selectedType.icon size={16} className={selectedType.color} />}
              <p className="text-[13px] font-semibold text-black">{selectedType?.label}</p>
              <button onClick={() => setStep(1)} className="ml-auto text-[11px] text-gray-400 hover:text-black transition-colors">Change</button>
            </div>

            {/* Vehicle */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Vehicle</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 bg-gray-50 rounded-lg overflow-hidden">
                  <img src="/manus-storage/dash-car-current_6e167bf1.png" alt="Porsche" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-black">2024 Porsche 911 Carrera S</p>
                  <p className="text-[11px] text-gray-400">Reservation #DC654321 · Currently Active</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[12px] font-semibold text-black block mb-2">Describe the issue <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={incidentType === "crash"
                  ? "Describe what happened — direction of impact, speed, other vehicles involved, any injuries..."
                  : incidentType === "mechanical"
                  ? "Describe the problem — strange noises, warning lights, when it started..."
                  : "Describe the issue in as much detail as possible..."}
                className="w-full h-28 p-3 bg-gray-50 rounded-xl text-[13px] text-black placeholder-gray-300 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
              <p className="text-[10px] text-gray-400 mt-1">{description.length}/500 characters</p>
            </div>

            {/* Location */}
            <div>
              <label className="text-[12px] font-semibold text-black block mb-2">Current Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Enter address or use GPS..."
                  className="flex-1 p-3 bg-gray-50 rounded-xl text-[13px] text-black placeholder-gray-300 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
                />
                <button onClick={getLocation} disabled={locationLoading}
                  className="px-4 py-3 bg-black text-white rounded-xl text-[11px] font-semibold hover:bg-gray-900 transition-colors flex items-center gap-1.5 flex-shrink-0">
                  {locationLoading ? <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" /> : <MapPin size={13} />}
                  {locationLoading ? "..." : "GPS"}
                </button>
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-[12px] font-semibold text-black block mb-2">
                Photos <span className="text-gray-400 font-normal">(up to 8 — damage, scene, warning lights)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoAdd} className="hidden" />
              <div className="grid grid-cols-4 gap-2">
                {photos.map(p => (
                  <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(p.id)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
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
              {incidentType === "crash" && (
                <p className="text-[11px] text-orange-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> For crash reports, please photograph all damage, the scene, and any other vehicles involved.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-black text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">Back</button>
              <button onClick={() => description.trim() && setStep(3)} disabled={!description.trim()}
                className={`flex-1 py-3 text-[13px] font-semibold rounded-full transition-colors ${description.trim() ? "bg-black text-white hover:bg-gray-900" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                Review Report
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-[13px] font-semibold text-black">Review your report before submitting</p>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              <div className="p-4 flex items-center gap-3">
                {selectedType && <selectedType.icon size={16} className={selectedType.color} />}
                <div>
                  <p className="text-[11px] text-gray-400">Issue Type</p>
                  <p className="text-[13px] font-semibold text-black">{selectedType?.label}</p>
                </div>
                {selectedType?.urgent && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">URGENT</span>}
              </div>
              <div className="p-4">
                <p className="text-[11px] text-gray-400 mb-1">Vehicle</p>
                <p className="text-[13px] font-semibold text-black">2024 Porsche 911 Carrera S</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-gray-400 mb-1">Description</p>
                <p className="text-[12px] text-gray-700 leading-relaxed">{description}</p>
              </div>
              {location && (
                <div className="p-4 flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400">Location</p>
                    <p className="text-[12px] text-black">{location}</p>
                  </div>
                </div>
              )}
              {photos.length > 0 && (
                <div className="p-4">
                  <p className="text-[11px] text-gray-400 mb-2">{photos.length} Photo{photos.length > 1 ? "s" : ""} Attached</p>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map(p => (
                      <div key={p.id} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 flex items-center gap-2 text-[11px] text-gray-400">
                <Clock size={12} />
                {selectedType?.urgent
                  ? "DreamCarz will be notified immediately. Response within 15 minutes."
                  : "DreamCarz will review your report within 2 hours during business hours."}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 text-black text-[13px] font-medium rounded-full hover:border-gray-400 transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                className={`flex-1 py-3 text-[13px] font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${selectedType?.urgent ? "bg-red-600 text-white hover:bg-red-700" : "bg-black text-white hover:bg-gray-900"}`}>
                {submitting ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
                {submitting ? "Submitting..." : selectedType?.urgent ? "Submit Emergency Report" : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
