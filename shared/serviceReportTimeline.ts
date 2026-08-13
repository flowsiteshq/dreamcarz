export type ServiceReportTimelineEvent = {
  id: number;
  createdAt: Date;
};

export function orderServiceReportTimeline<T extends ServiceReportTimelineEvent>(events: T[]): T[] {
  return [...events].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id - left.id);
}
