import { MapView } from "@/components/Map";
import { useCallback } from "react";

const HOUSTON_MARKET_CENTER = { lat: 29.7604, lng: -95.3698 } as const;

export default function HoustonInvestorMap() {
  const addHoustonMarker = useCallback((map: google.maps.Map) => {
    new google.maps.marker.AdvancedMarkerElement({
      map,
      position: HOUSTON_MARKET_CENTER,
      title: "Houston, Texas",
    });
  }, []);

  return (
    <section aria-labelledby="houston-market-map-title" className="overflow-hidden border border-[#d7ad4c]/35 bg-[#11110f]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7ad4c]">Market focus</p>
          <h2 id="houston-market-map-title" className="mt-2 font-display text-2xl font-bold text-white">Houston, Texas</h2>
        </div>
        <p className="max-w-sm text-xs leading-5 text-white/55">A geographic reference for the Houston market. It does not represent a property, vehicle location, service-area guarantee, or investment offer.</p>
      </div>
      <MapView
        className="h-[300px] sm:h-[380px]"
        initialCenter={HOUSTON_MARKET_CENTER}
        initialZoom={10}
        onMapReady={addHoustonMarker}
      />
    </section>
  );
}
