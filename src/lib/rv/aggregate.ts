import type {
  DailyRecord,
  EmployeeSummary,
  ExceptionDetail,
  ExceptionType,
  PeriodMode,
  ShiftCode,
} from "./types";

export const EXCEPTION_TYPES: ExceptionType[] = [
  "Shift Timing Mismatch",
  "Absent on Planned Working Day",
  "Missing Attendance Record",
  "Worked on Week-Off",
];

export const COMPLIANCE_STATUSES = ["Compliant", "Attention Required", "Non-Compliant"] as const;

export interface FilterState {
  periodMode: PeriodMode;
  /** day: YYYY-MM-DD | week: monday YYYY-MM-DD | month: YYYY-MM */
  periodAnchor: string;
  search: string;
  employees: string[]; // OLM ids selected via employee dropdown
  olmIds: string[];
  functions: string[];
  domains: string[];
  managers: string[];
  rosterShifts: string[];
  amsShifts: string[];
  statuses: string[];
  exceptionTypes: string[];
  complianceStatuses: string[];
  exceptionsOnly: boolean;
  exceptionDaysOnly: boolean;
  compare: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  periodMode: "month",
  periodAnchor: "",
  search: "",
  employees: [],
  olmIds: [],
  functions: [],
  domains: [],
  managers: [],
  rosterShifts: [],
  amsShifts: [],
  statuses: [],
  exceptionTypes: [],
  complianceStatuses: [],
  exceptionsOnly: false,
  exceptionDaysOnly: false,
  compare: false,
};

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.search.trim()) n += 1;
  for (const list of [
    f.employees,
    f.olmIds,
    f.functions,
    f.domains,
    f.managers,
    f.rosterShifts,
    f.amsShifts,
    f.statuses,
    f.exceptionTypes,
    f.complianceStatuses,
  ]) {
    if (list.length) n += 1;
  }
  if (f.exceptionsOnly) n += 1;
  if (f.exceptionDaysOnly) n += 1;
  return n;
}

/* ---------------------------- period helpers ---------------------------- */

export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${MONTH_NAMES[+m! - 1]!.slice(0, 3)}-${y}`;
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[+m! - 1]} ${y}`;
}

export function formatWeek(monday: string): string {
  return `${formatDay(monday)} to ${formatDay(addDays(monday, 6))}`;
}

export function periodLabel(mode: PeriodMode, anchor: string): string {
  if (!anchor) return "All data";
  if (mode === "day") return formatDay(anchor);
  if (mode === "week") return formatWeek(anchor);
  return formatMonth(anchor);
}

export function previousAnchor(mode: PeriodMode, anchor: string): string {
  if (mode === "day") return addDays(anchor, -1);
  if (mode === "week") return addDays(anchor, -7);
  const [y, m] = anchor.split("-").map(Number);
  const d = new Date(y!, m! - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function inPeriod(date: string, mode: PeriodMode, anchor: string): boolean {
  if (!anchor) return true;
  if (mode === "day") return date === anchor;
  if (mode === "month") return monthOf(date) === anchor;
  return date >= anchor && date <= addDays(anchor, 6);
}

/** Available period options derived from the uploaded data (never hardcoded). */
export function periodOptions(dates: string[], mode: PeriodMode): { value: string; label: string }[] {
  if (mode === "day")
    return dates.map((d) => ({ value: d, label: formatDay(d) }));
  if (mode === "week") {
    const weeks = Array.from(new Set(dates.map(mondayOf))).sort();
    return weeks.map((w) => ({ value: w, label: formatWeek(w) }));
  }
  const months = Array.from(new Set(dates.map(monthOf))).sort();
  return months.map((m) => ({ value: m, label: formatMonth(m) }));
}

export function defaultAnchor(dates: string[], mode: PeriodMode): string {
  const options = periodOptions(dates, mode);
  return options.length ? options[options.length - 1]!.value : "";
}

/* ---------------------------- filtering ---------------------------- */

function matchesSearch(row: DailyRecord, term: string): boolean {
  if (!term) return true;
  const q = term.trim().toLowerCase();
  return (
    row.employeeName.toLowerCase().includes(q) ||
    row.olm.toLowerCase().includes(q) ||
    row.managerName.toLowerCase().includes(q) ||
    row.managerEmail.toLowerCase().includes(q)
  );
}

function some(list: string[], value: string): boolean {
  return list.length === 0 || list.includes(value);
}

/** Row-level filters (AND across categories, OR inside a multi-select). */
export function filterRows(daily: DailyRecord[], f: FilterState, anchor: string): DailyRecord[] {
  return daily.filter(
    (row) =>
      inPeriod(row.date, f.periodMode, anchor) &&
      matchesSearch(row, f.search) &&
      some(f.employees, row.olm) &&
      some(f.olmIds, row.olm) &&
      some(f.functions, row.functionName) &&
      some(f.domains, row.domain) &&
      some(f.managers, row.managerName) &&
      some(f.rosterShifts, row.rosterShift) &&
      (f.amsShifts.length === 0 || (row.amsShift !== null && f.amsShifts.includes(row.amsShift))) &&
      some(f.statuses, row.status),
  );
}

/* ---------------------------- aggregation ---------------------------- */

export function summarize(rows: DailyRecord[], label: string): EmployeeSummary[] {
  const groups = new Map<string, DailyRecord[]>();
  for (const row of rows) {
    const list = groups.get(row.olm);
    if (list) list.push(row);
    else groups.set(row.olm, [row]);
  }

  const summaries: EmployeeSummary[] = [];
  for (const [olm, days] of groups) {
    const first = days[0]!;
    const plannedDaysList = days.filter((d) => d.plannedDay);
    const plannedDays = plannedDaysList.length;
    const presentDays = plannedDaysList.filter((d) => d.present).length;
    const plannedHours = plannedDaysList.reduce((s, d) => s + d.plannedHours, 0);
    const actualHours = days.reduce((s, d) => s + d.actualHours, 0);
    const exceptionDayRecords = days.filter((d) => d.countableException);
    const exceptionDays = new Set(exceptionDayRecords.map((d) => d.date)).size;
    const mismatchDays = new Set(days.filter((d) => d.mismatch).map((d) => d.date)).size;

    const exceptionCounts: Record<string, number> = {};
    const exceptionDetails: ExceptionDetail[] = [];
    for (const d of days) {
      for (const type of d.exceptions) {
        exceptionCounts[type] = (exceptionCounts[type] ?? 0) + 1;
        exceptionDetails.push({
          date: d.date,
          type,
          rosterShift: d.rosterShift,
          amsShift: d.amsShift,
          expectedIn: d.expectedIn,
          actualIn: d.actualIn,
          expectedOut: d.expectedOut,
          actualOut: d.actualOut,
          note: d.reason,
        });
      }
    }

    const attendancePct = plannedDays ? (presentDays / plannedDays) * 100 : null;
    const compliancePct = plannedDays ? ((plannedDays - exceptionDays) / plannedDays) * 100 : null;

    summaries.push({
      olm,
      employeeName: first.employeeName,
      functionName: first.functionName,
      domain: first.domain,
      vertical: first.vertical,
      managerName: first.managerName,
      managerEmail: first.managerEmail,
      periodLabel: label,
      rosterShifts: uniqueShifts(days.map((d) => d.rosterShift)),
      amsShifts: uniqueShifts(days.map((d) => d.amsShift).filter(Boolean) as ShiftCode[]),
      plannedDays,
      presentDays,
      attendancePct,
      plannedHours,
      actualHours,
      avgHoursPerDay: presentDays ? actualHours / presentDays : 0,
      mismatchDays,
      exceptionDays,
      compliancePct,
      exceptionCounts,
      exceptionDetails: exceptionDetails.sort((a, b) => a.date.localeCompare(b.date)),
      status: statusFor(compliancePct, exceptionDays),
      days: days.slice().sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  return summaries.sort(
    (a, b) => (a.compliancePct ?? 101) - (b.compliancePct ?? 101) || a.employeeName.localeCompare(b.employeeName),
  );
}

function uniqueShifts(codes: ShiftCode[]): ShiftCode[] {
  return Array.from(new Set(codes.filter((c) => c !== "UNKNOWN")));
}

export function statusFor(
  compliancePct: number | null,
  exceptionDays: number,
): EmployeeSummary["status"] {
  if (compliancePct === null) return exceptionDays > 0 ? "Attention Required" : "Compliant";
  if (compliancePct >= 100) return "Compliant";
  if (compliancePct >= 85) return "Attention Required";
  return "Non-Compliant";
}

/** Employee-level filters that depend on aggregates. */
export function filterSummaries(summaries: EmployeeSummary[], f: FilterState): EmployeeSummary[] {
  return summaries.filter((s) => {
    if (f.exceptionsOnly && s.exceptionDays === 0) return false;
    if (f.complianceStatuses.length && !f.complianceStatuses.includes(s.status)) return false;
    if (f.exceptionTypes.length) {
      const wantsNone = f.exceptionTypes.includes("No Exception");
      const types = Object.keys(s.exceptionCounts);
      const hasAny = f.exceptionTypes.some((t) => t !== "No Exception" && types.includes(t));
      if (!(hasAny || (wantsNone && types.length === 0))) return false;
    }
    return true;
  });
}

export interface Kpis {
  employees: number;
  plannedDays: number;
  presentDays: number;
  attendancePct: number | null;
  plannedHours: number;
  actualHours: number;
  avgHoursPerDay: number;
  mismatchDays: number;
  exceptionDays: number;
  compliancePct: number | null;
  compliantEmployees: number;
  nonCompliantEmployees: number;
}

export function computeKpis(summaries: EmployeeSummary[]): Kpis {
  const plannedDays = sum(summaries, (s) => s.plannedDays);
  const presentDays = sum(summaries, (s) => s.presentDays);
  const exceptionDays = sum(summaries, (s) => s.exceptionDays);
  const actualHours = sum(summaries, (s) => s.actualHours);
  return {
    employees: summaries.length,
    plannedDays,
    presentDays,
    attendancePct: plannedDays ? (presentDays / plannedDays) * 100 : null,
    plannedHours: sum(summaries, (s) => s.plannedHours),
    actualHours,
    avgHoursPerDay: presentDays ? actualHours / presentDays : 0,
    mismatchDays: sum(summaries, (s) => s.mismatchDays),
    exceptionDays,
    compliancePct: plannedDays ? ((plannedDays - exceptionDays) / plannedDays) * 100 : null,
    compliantEmployees: summaries.filter((s) => s.status === "Compliant").length,
    nonCompliantEmployees: summaries.filter((s) => s.status === "Non-Compliant").length,
  };
}

function sum<T>(list: T[], fn: (item: T) => number): number {
  return list.reduce((acc, item) => acc + fn(item), 0);
}

export interface ExceptionStat {
  type: string;
  days: number;
  employees: number;
}

export function exceptionStats(rows: DailyRecord[]): ExceptionStat[] {
  const map = new Map<string, { days: Set<string>; employees: Set<string> }>();
  for (const row of rows) {
    for (const type of row.exceptions) {
      let entry = map.get(type);
      if (!entry) {
        entry = { days: new Set(), employees: new Set() };
        map.set(type, entry);
      }
      entry.days.add(`${row.olm}|${row.date}`);
      entry.employees.add(row.olm);
    }
  }
  return EXCEPTION_TYPES.filter((t) => map.has(t))
    .map((t) => ({ type: t, days: map.get(t)!.days.size, employees: map.get(t)!.employees.size }))
    .sort((a, b) => b.days - a.days);
}

export interface TrendPoint {
  label: string;
  weekStart: string;
  compliance: number | null;
  attendance: number | null;
  exceptionDays: number;
}

/** Weekly trend built from the same daily reconciliation records. */
export function weeklyTrend(rows: DailyRecord[]): TrendPoint[] {
  const weeks = new Map<string, DailyRecord[]>();
  for (const row of rows) {
    const w = mondayOf(row.date);
    const list = weeks.get(w);
    if (list) list.push(row);
    else weeks.set(w, [row]);
  }
  return Array.from(weeks.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, list], idx) => {
      const kpis = computeKpis(summarize(list, weekStart));
      return {
        label: `W${idx + 1}`,
        weekStart,
        compliance: kpis.compliancePct,
        attendance: kpis.attendancePct,
        exceptionDays: kpis.exceptionDays,
      };
    });
}

export function pct(value: number | null, digits = 2): string {
  return value === null ? "N/A" : `${value.toFixed(digits)}%`;
}

export function hrs(value: number): string {
  return value.toFixed(1);
}

export function exceptionBadgeLabel(type: string): string {
  switch (type) {
    case "Shift Timing Mismatch":
      return "Shift Mismatch";
    case "Absent on Planned Working Day":
      return "Absent";
    case "Missing Attendance Record":
      return "Missing";
    case "Worked on Week-Off":
      return "Worked WO";
    default:
      return type;
  }
}
