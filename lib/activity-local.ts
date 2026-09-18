import type { CrmTask, CrmMeeting, CallRecord } from "@/lib/types";

const TASKS_KEY = "finlonexa.tasks";
const DELETED_TASKS_KEY = "finlonexa.deletedTasks";
const MEETINGS_KEY = "finlonexa.meetings";
const CALLS_KEY = "finlonexa.calls";

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

export function readDeletedTaskIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_TASKS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function rememberDeletedTask(id: string): void {
  const deleted = readDeletedTaskIds();
  deleted.add(id);
  safeWrite(DELETED_TASKS_KEY, [...deleted]);
}

export function clearDeletedTask(id: string): void {
  const deleted = readDeletedTaskIds();
  if (!deleted.delete(id)) return;
  safeWrite(DELETED_TASKS_KEY, [...deleted]);
}

export function removeTask(id: string): void {
  const stored = readStoredTasks();
  safeWrite(TASKS_KEY, stored.filter((t) => t.id !== id));
  rememberDeletedTask(id);
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