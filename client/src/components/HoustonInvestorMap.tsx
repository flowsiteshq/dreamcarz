const HOUSTON_MAP_EMBED_URL = "https://www.google.com/maps?output=embed&q=Houston%2C%20Texas";

export default function HoustonInvestorMap() {
  return (
    <section aria-labelledby="houston-market-map-title" className="overflow-hidden border border-[#d7ad4c]/35 bg-[#11110f]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7ad4c]">Market focus</p>
          <h2 id="houston-market-map-title" className="mt-2 font-display text-2xl font-bold text-white">Houston, Texas</h2>
        </div>
        <p className="max-w-sm text-xs leading-5 text-white/55">A geographic reference for the Houston market. It does not represent a property, vehicle location, service-area guarantee, or investment offer.</p>
      </div>
      <iframe
        title="Houston, Texas market map"
        src={HOUSTON_MAP_EMBED_URL}
        className="h-[300px] w-full border-0 sm:h-[380px]"
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
