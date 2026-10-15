import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "../client/src", path), "utf8");

describe("fleet hero background", () => {
  it("uses fleet media without replacing homepage calls to action", () => {
    const home = source("pages/Home.tsx");
    expect(home).toContain("<FleetHeroBackground {...FLEET_HERO_MEDIA} />");
    expect(home).toContain('href="/concierge?intent=rental"');
    expect(home).toContain('href="/concierge?intent=purchase"');
    expect(home).toContain("saveHomepageConciergePrompt(heroPrompt)");
  });

  it("provides silent inline looping playback and a standalone poster", () => {
    const component = source("components/FleetHeroBackground.tsx");
    for (const requirement of ["muted", "autoPlay", "loop", "playsInline", 'preload="metadata"', "<img src={poster}", "onError="]) {
      expect(component).toContain(requirement);
    }
    expect(component).not.toContain("Suspense");
  });

  it("avoids video loading for reduced motion and data-saver preferences", () => {
    const component = source("components/FleetHeroBackground.tsx");
    expect(component).toContain("prefers-reduced-motion: reduce");
    expect(component).toContain("connection?.saveData ? null");
    expect(component).toContain("mobile.matches ? mobileVideo : desktopVideo");
    expect(component).toContain("IntersectionObserver");
    expect(component).toContain("visibilitychange");
  });

  it("allows the visitor to pause motion and shows the entire lineup on mobile", () => {
    const component = source("components/FleetHeroBackground.tsx");
    expect(component).toContain("Pause fleet background video");
    expect(component).toContain("Play fleet background video");
    expect(component).toContain("setPaused(value => !value)");
    expect(component).toContain("bottom-28 aspect-video w-full");
  });
});
