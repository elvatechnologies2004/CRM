import type { CrmTask, CrmMeeting, CallRecord } from "@/lib/types";

const TASKS_KEY = "relvo.tasks";
const MEETINGS_KEY = "relvo.meetings";
const CALLS_KEY = "relvo.calls";

function safeRead<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be unavailable; ignore
  }
}

export function readStoredTasks(): CrmTask[] {
  return safeRead<CrmTask>(TASKS_KEY, []);
}

export function upsertTask(task: CrmTask): void {
  const stored = readStoredTasks();
  const next = [...stored.filter((t) => t.id !== task.id), task];
  safeWrite(TASKS_KEY, next);
}

export function removeTask(id: string): void {
  const stored = readStoredTasks();
  safeWrite(TASKS_KEY, stored.filter((t) => t.id !== id));
}

export function readStoredMeetings(): CrmMeeting[] {
  return safeRead<CrmMeeting>(MEETINGS_KEY, []);
}

export function upsertMeeting(meeting: CrmMeeting): void {
  const stored = readStoredMeetings();
  safeWrite(MEETINGS_KEY, [...stored.filter((m) => m.id !== meeting.id), meeting]);
}

export function readStoredCalls(): CallRecord[] {
  return safeRead<CallRecord>(CALLS_KEY, []);
}

export function upsertCall(call: CallRecord): void {
  const stored = readStoredCalls();
  safeWrite(CALLS_KEY, [...stored.filter((c) => c.id !== call.id), call]);
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}