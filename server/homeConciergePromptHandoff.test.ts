import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(resolve(import.meta.dirname, "../client/src", relativePath), "utf8");

describe("homepage Concierge prompt handoff", () => {
  it("renders an editable homepage input and submits its text without using a URL query", () => {
    const home = readClientFile("pages/Home.tsx");
    const handoff = readClientFile("lib/conciergePromptHandoff.ts");

    expect(home).toContain('onSubmit={submitHeroPrompt}');
    expect(home).toContain('id="dreamcarz-home-concierge-prompt"');
    expect(home).toContain('type="submit"');
    expect(home).toContain('navigate("/concierge")');
    expect(home).toContain("saveHomepageConciergePrompt(heroPrompt)");
    expect(handoff).toContain("sessionStorage.setItem(HOMEPAGE_CONCIERGE_PROMPT_KEY, prompt)");
    expect(handoff).toContain("sessionStorage.removeItem(HOMEPAGE_CONCIERGE_PROMPT_KEY)");
    expect(home).toContain("isPromptTransitioning");
    expect(home).toContain('Opening your conversation…');
    expect(home).toContain('prefers-reduced-motion: reduce');
    expect(home).toContain('window.setTimeout(() => navigate("/concierge"), 340)');
  });

  it("consumes the temporary prompt once and sends it through the existing Concierge ask flow", () => {
    const concierge = readClientFile("pages/Concierge.tsx");

    expect(concierge).toContain("takeHomepageConciergePrompt");
    expect(concierge).toContain("homepagePromptConsumedRef");
    expect(concierge).toContain("if (prompt) void ask(prompt)");
  });
});
