export const marketerPaths = [
  { id: "associate", label: "Associate", description: "Learn the DreamCarz offer and share approved resources." },
  { id: "driver", label: "Driver", description: "Build consistent referral activity with documented support." },
  { id: "road_captain", label: "Road Captain", description: "Develop and coach an engaged personal network." },
  { id: "fleet_director", label: "Fleet Director", description: "Lead operating activity within approved program standards." },
  { id: "elite_executive", label: "Elite Executive", description: "Demonstrate sustained leadership and operational contribution." },
  { id: "dream_ambassador", label: "Dream Ambassador", description: "Represent the highest recognized leadership path." },
] as const;

export type MarketerPathId = (typeof marketerPaths)[number]["id"];

export function getMarketerPath(rank: string | null | undefined) {
  return marketerPaths.find(path => path.id === rank) ?? marketerPaths[0];
}

export function getNextMarketerPath(rank: string | null | undefined) {
  const currentIndex = marketerPaths.findIndex(path => path.id === rank);
  return marketerPaths[Math.min(Math.max(currentIndex, 0) + 1, marketerPaths.length - 1)];
}

export function isActiveTeamMember(status: string) {
  return status === "active";
}
