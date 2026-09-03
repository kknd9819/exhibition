export type TimeRange = { startAt: string; endAt: string; participantA: string; participantB: string; locationText?: string; id?: string };

export function rangesOverlap(a: TimeRange, b: TimeRange) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export function conflictReasons(candidate: TimeRange, existing: TimeRange[]) {
  const people = [candidate.participantA, candidate.participantB];
  return existing.filter((item) => rangesOverlap(candidate, item)).flatMap((item) => {
    const shared = people.filter((name) => [item.participantA, item.participantB].includes(name));
    const reasons = shared.map((name) => `${name}在该时段已有安排`);
    if (candidate.locationText && item.locationText === candidate.locationText) reasons.push(`${candidate.locationText}在该时段已占用`);
    return reasons.map((reason) => ({ conflictWith: item.id ?? '', reason }));
  });
}
