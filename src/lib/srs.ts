import { addDays, today } from "./date";

export const SRS_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90];
export const NEW_CARDS_PER_DAY = 10;

export function nextIntervalDays(currentIntervalDays: number, correct: boolean): number {
  if (!correct) {
    return SRS_INTERVALS_DAYS[0];
  }
  const currentIndex = SRS_INTERVALS_DAYS.indexOf(currentIntervalDays);
  const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, SRS_INTERVALS_DAYS.length - 1);
  return SRS_INTERVALS_DAYS[nextIndex];
}

export function nextDueDate(intervalDays: number): string {
  return addDays(today(), intervalDays);
}
