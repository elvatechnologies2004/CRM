const DAY_MS = 24 * 60 * 60 * 1000;

export function iso(daysBack: number, time: string, addDays = 0): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() - daysBack + addDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function isoDaysFromNow(daysFromNow: number, time = "09:00"): string {
  return iso(-daysFromNow, time);
}

export function toShortTime(isodate: string): string {
  return new Date(isodate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function toDayLabel(isodate: string, relativeTo = Date.now()): string {
  const then = new Date(isodate).getTime();
  const diffDays = Math.round((startOfDay(relativeTo) - startOfDay(then)) / DAY_MS);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Tomorrow";
  return new Date(then).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toFullDate(isodate: string): string {
  return new Date(isodate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateUTC(isodate: string, style: Intl.DateTimeFormatOptions = {}): string {
  return new Date(isodate).toLocaleDateString("en-US", {
    ...style,
    timeZone: "UTC",
  });
}

export function formatTimeUTC(isodate: string): string {
  return new Date(isodate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function daysBetween(a: string, b = new Date().toISOString()): number {
  return Math.round((startOfDay(+new Date(b)) - startOfDay(+new Date(a))) / DAY_MS);
}

export function minutesToLabel(minutes?: number): string {
  if (minutes === undefined) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function monthKey(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function monthLabelShort(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}