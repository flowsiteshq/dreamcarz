export const HOMEPAGE_CONCIERGE_PROMPT_KEY = "dreamcarz-home-concierge-prompt";

export function saveHomepageConciergePrompt(rawPrompt: string) {
  const prompt = rawPrompt.trim().slice(0, 1_000);
  if (!prompt) return false;
  sessionStorage.setItem(HOMEPAGE_CONCIERGE_PROMPT_KEY, prompt);
  return true;
}

export function takeHomepageConciergePrompt() {
  const prompt = sessionStorage.getItem(HOMEPAGE_CONCIERGE_PROMPT_KEY);
  sessionStorage.removeItem(HOMEPAGE_CONCIERGE_PROMPT_KEY);
  return prompt?.trim().slice(0, 1_000) || null;
}
