import DashboardShell from "@/components/DashboardShell";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

export default function LocationsPage() {
  return (
    <DashboardShell title="Locations">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Locations</h2>
          <p className="text-sm text-gray-400 mt-0.5">Find us and get directions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-black" style={{ fontFamily: "var(--font-display)" }}>DreamCarz Network HQ</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">Main Office & Vehicle Center</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-black">10001 Derekwood Ln, Suite 204</p>
                  <p className="text-[13px] text-gray-500">Lanham, MD 20706</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <a href="tel:3017722500" className="text-[13px] font-medium text-black hover:underline">(301) 772-2500</a>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-[12px] text-gray-500 space-y-0.5">
                  <p><span className="text-black font-medium">Mon–Fri</span> 9:00 AM – 6:00 PM</p>
                  <p><span className="text-black font-medium">Saturday</span> 9:00 AM – 3:00 PM</p>
                  <p><span className="text-black font-medium">Sunday</span> Closed</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <a href="https://maps.google.com/?q=10001+Derekwood+Ln+Suite+204+Lanham+MD+20706" target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white text-[12px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
                <Navigation size={13} /> Get Directions
              </a>
              <a href="tel:3017722500" className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-black text-[12px] font-medium rounded-full hover:border-gray-400 transition-colors">
                <Phone size={13} /> Call Now
              </a>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: "280px" }}>
            <div className="text-center p-8">
              <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[13px] font-medium text-gray-400">10001 Derekwood Ln, Suite 204</p>
              <p className="text-[12px] text-gray-400">Lanham, MD 20706</p>
              <a href="https://maps.google.com/?q=10001+Derekwood+Ln+Suite+204+Lanham+MD+20706" target="_blank" rel="noreferrer"
                className="inline-block mt-4 px-4 py-2 bg-black text-white text-[11px] font-semibold rounded-full hover:bg-gray-900 transition-colors">
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

