import type { ShiftCode, ShiftDef } from "./types";

/**
 * Shift catalogue. Expected in/out drive the "Shift Timing Mismatch" check.
 * Night shift end crosses midnight (endMin > 1440).
 */
export const SHIFT_DEFS: Record<ShiftCode, ShiftDef> = {
  A: { code: "A", label: "Morning (A)", working: true, startMin: 6 * 60, endMin: 14 * 60 + 30, plannedHours: 8.5 },
  G: { code: "G", label: "General (G)", working: true, startMin: 9 * 60 + 30, endMin: 18 * 60 + 30, plannedHours: 9 },
  LG: { code: "LG", label: "Late General (LG)", working: true, startMin: 13 * 60, endMin: 22 * 60, plannedHours: 9 },
  B: { code: "B", label: "Evening (B)", working: true, startMin: 14 * 60, endMin: 22 * 60 + 30, plannedHours: 8.5 },
  N: { code: "N", label: "Night (N)", working: true, startMin: 22 * 60, endMin: 30 * 60 + 30, plannedHours: 8.5 },
  WO: { code: "WO", label: "Week-Off (WO)", working: false, startMin: 0, endMin: 0, plannedHours: 0 },
  L: { code: "L", label: "Leave (L)", working: false, startMin: 0, endMin: 0, plannedHours: 0 },
  H: { code: "H", label: "Holiday (H)", working: false, startMin: 0, endMin: 0, plannedHours: 0 },
  OFF: { code: "OFF", label: "Off (OFF)", working: false, startMin: 0, endMin: 0, plannedHours: 0 },
  UNKNOWN: { code: "UNKNOWN", label: "Unknown Shift", working: false, startMin: 0, endMin: 0, plannedHours: 0 },
};

export const SHIFT_FILTER_CODES: ShiftCode[] = ["A", "G", "LG", "B", "N", "WO"];

const SHIFT_ALIASES: Record<string, ShiftCode> = {
  a: "A",
  morning: "A",
  "morning shift": "A",
  g: "G",
  general: "G",
  gen: "G",
  lg: "LG",
  "late general": "LG",
  "late-general": "LG",
  "late gen": "LG",
  b: "B",
  evening: "B",
  "evening shift": "B",
  n: "N",
  night: "N",
  "night shift": "N",
  wo: "WO",
  "week-off": "WO",
  "week off": "WO",
  weekoff: "WO",
  wof: "WO",
  l: "L",
  leave: "L",
  "on leave": "L",
  h: "H",
  holiday: "H",
  ph: "H",
  off: "OFF",
  "no-show": "UNKNOWN",
  noshow: "UNKNOWN",
  "-": "UNKNOWN",
  "": "UNKNOWN",
};

export function cleanCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/^["'\s]+|["'\s]+$/g, "").trim();
}

/** Normalize any AMS / roster shift text into a canonical code. */
export function normalizeShift(raw: unknown): { code: ShiftCode; raw: string; unknown: boolean } {
  const text = cleanCell(raw);
  const key = text.toLowerCase().replace(/\s+/g, " ");
  const code = SHIFT_ALIASES[key];
  if (code && code !== "UNKNOWN") return { code, raw: text, unknown: false };
  return { code: "UNKNOWN", raw: text, unknown: text.length > 0 };
}

export function isWorkingShift(code: ShiftCode): boolean {
  return SHIFT_DEFS[code]?.working ?? false;
}

const STATUS_ALIASES: Record<string, string> = {
  present: "Present",
  p: "Present",
  absent: "Absent",
  "no-show": "Absent",
  noshow: "Absent",
  "no show": "Absent",
  a: "Absent",
  "week-off": "Week-Off",
  "week off": "Week-Off",
  weekoff: "Week-Off",
  wo: "Week-Off",
  leave: "Leave",
  l: "Leave",
  holiday: "Holiday",
  h: "Holiday",
  missing: "Missing",
  "-": "Missing",
  "": "Missing",
};

export const STATUS_FILTER_VALUES = ["Present", "Absent", "Week-Off", "Leave", "Holiday", "Missing"];

/** Normalize attendance status while tolerating unseen values. */
export function normalizeStatus(raw: unknown): string {
  const text = cleanCell(raw);
  const key = text.toLowerCase();
  return STATUS_ALIASES[key] ?? (text || "Missing");
}

export function minutesToHHMM(min: number | null): string | null {
  if (min === null || Number.isNaN(min)) return null;
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Smallest circular distance in hours between two clock minutes. */
export function circularDeltaHours(a: number, b: number): number {
  const raw = Math.abs(((a - b) % 1440 + 1440) % 1440);
  return Math.min(raw, 1440 - raw) / 60;
}
