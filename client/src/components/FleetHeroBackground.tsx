import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FleetHeroBackgroundProps = {
  poster: string;
  desktopVideo: string;
  mobileVideo: string;
};

// The poster renders independently of playback: Safari autoplay failures or a
// slow video request must never block the homepage or its Concierge input.
export default function FleetHeroBackground({ poster, desktopVideo, mobileVideo }: FleetHeroBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => {
      setPlaying(false);
      setFailed(false);
      setSource(motion.matches || connection?.saveData ? null : mobile.matches ? mobileVideo : desktopVideo);
    };
    update();
    motion.addEventListener("change", update);
    mobile.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      mobile.removeEventListener("change", update);
    };
  }, [desktopVideo, mobileVideo]);

  useEffect(() => {
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 }) : null;
    if (containerRef.current) observer?.observe(containerRef.current);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (paused || !inView || !pageVisible || failed) {
      video.pause();
      return;
    }
    video.muted = true;
    void video.play().catch(() => {
      // Keep the readable still poster when the browser disallows autoplay.
      setPlaying(false);
    });
  }, [source, paused, inView, pageVisible, failed]);

  const frameClass = "absolute inset-x-0 bottom-28 aspect-video w-full object-cover lg:inset-0 lg:h-full lg:aspect-auto";
  return <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#f8f3ea]" data-testid="fleet-hero-background">
    <img src={poster} alt="Illustrated lineup of DreamCarz sedans and SUVs" fetchPriority="high" className={frameClass} />
    {source && !failed ? <video
      key={source}
      ref={videoRef}
      src={source}
      poster={poster}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      onError={() => { setPlaying(false); setFailed(true); }}
      className={`${frameClass} transition-opacity duration-200 motion-reduce:transition-none ${playing ? "opacity-100" : "opacity-0"}`}
    /> : null}
    {source && !failed ? <button
      type="button"
      onClick={() => setPaused(value => !value)}
      aria-label={paused ? "Play fleet background video" : "Pause fleet background video"}
      aria-pressed={paused}
      className="absolute right-5 top-20 z-30 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-[11px] font-semibold text-[#3c3528] shadow-sm backdrop-blur-md hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a98331] sm:right-8 lg:top-24"
    >{paused ? <Play size={12} /> : <Pause size={12} />}<span className="hidden sm:inline">{paused ? "Play" : "Pause"}</span></button> : null}
  </div>;
}
