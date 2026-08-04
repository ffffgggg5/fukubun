import dayjs from "dayjs";

export function today(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function addDays(dateStr: string, days: number): string {
  return dayjs(dateStr).add(days, "day").format("YYYY-MM-DD");
}
