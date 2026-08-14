import * as XLSX from "xlsx";
import type { AttendanceRow, RosterRow } from "./types";
import { cleanCell, normalizeShift, normalizeStatus } from "./shifts";

/* ------------------------------------------------------------------ *
 * Primitive value coercion — Excel dates, times and durations
 * ------------------------------------------------------------------ */

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Excel serial (days since 1899-12-30) -> Date */
function serialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

/**
 * Parse any date representation into YYYY-MM-DD.
 * Day-first is assumed for ambiguous slash/dot formats (01/05/2026 -> 2026-05-01).
 */
export function parseDateValue(value: unknown, fallbackYear?: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return dateToISO(value);
  if (typeof value === "number") {
    if (value > 20000 && value < 80000) return dateToISO(serialToDate(value));
    return null;
  }
  const text = cleanCell(value);
  if (!text) return null;

  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2]!)}-${pad(+m[3]!)}`;

  m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const day = +m[1]!;
    const month = +m[2]!;
    let year = +m[3]!;
    if (year < 100) year += 2000;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  // "1 May", "1-May", "1 May 2026", "May 1"
  m = text.match(/^(\d{1,2})[\s-]*([A-Za-z]{3,})[\s,-]*(\d{4})?$/);
  if (m) {
    const idx = MONTHS.indexOf(m[2]!.slice(0, 3).toLowerCase());
    if (idx >= 0) {
      const year = m[3] ? +m[3] : fallbackYear;
      if (year) return `${year}-${pad(idx + 1)}-${pad(+m[1]!)}`;
    }
  }
  m = text.match(/^([A-Za-z]{3,})[\s-]*(\d{1,2})[\s,-]*(\d{4})?$/);
  if (m) {
    const idx = MONTHS.indexOf(m[1]!.slice(0, 3).toLowerCase());
    if (idx >= 0) {
      const year = m[3] ? +m[3] : fallbackYear;
      if (year) return `${year}-${pad(idx + 1)}-${pad(+m[2]!)}`;
    }
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return dateToISO(parsed);
  return null;
}

/** Parse any clock value into minutes from midnight. Returns null when absent/invalid. */
export function parseTimeValue(value: unknown): { minutes: number | null; invalid: boolean } {
  if (value === null || value === undefined || value === "") return { minutes: null, invalid: false };
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { minutes: null, invalid: true };
    return { minutes: value.getHours() * 60 + value.getMinutes(), invalid: false };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { minutes: null, invalid: true };
    const frac = value - Math.floor(value);
    return { minutes: Math.round(frac * 1440), invalid: false };
  }
  const text = cleanCell(value);
  if (!text || text === "-" || text === "--") return { minutes: null, invalid: false };

  const dt = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?/);
  if (dt) {
    let h = +dt[1]!;
    const min = +dt[2]!;
    const ap = dt[4]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h > 47 || min > 59) return { minutes: null, invalid: true };
    return { minutes: (h % 24) * 60 + min, invalid: false };
  }
  return { minutes: null, invalid: true };
}

/** Parse duration ("09:30", 9.5, Excel fraction) into decimal hours. */
export function parseDurationHours(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return 0;
    return value.getHours() + value.getMinutes() / 60 + value.getSeconds() / 3600;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    // Excel time fractions are < 1 day; treat small values as day fractions.
    return value <= 2 ? value * 24 : value;
  }
  const text = cleanCell(value);
  if (!text || text === "-") return 0;
  const hm = text.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);
  if (hm) return +hm[1]! + +hm[2]! / 60 + (hm[3] ? +hm[3] / 3600 : 0);
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

/* ------------------------------------------------------------------ *
 * Workbook reading
 * ------------------------------------------------------------------ */

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { cellDates: true, raw: false, dateNF: "yyyy-mm-dd" });
}

type Row = Record<string, unknown>;

function sheetRows(wb: XLSX.WorkBook, name: string): Row[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: null, raw: true });
}

function pick(row: Row, keys: string[]): unknown {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (k) => k.trim().toLowerCase().replace(/\s+/g, " ") === key.toLowerCase(),
    );
    if (found !== undefined && row[found] !== null && row[found] !== "") return row[found];
  }
  return null;
}

function hasHeader(row: Row, keys: string[]): boolean {
  const normalized = Object.keys(row).map((k) => k.trim().toLowerCase().replace(/\s+/g, " "));
  return keys.some((key) => normalized.includes(key.toLowerCase()));
}

/* ------------------------------------------------------------------ *
 * Attendance normalization (monthly XLSX + daily CSV formats)
 * ------------------------------------------------------------------ */

const MONTHLY_MAP = {
  date: ["date", "attendance date"],
  name: ["employee - name", "employee name", "name"],
  email: ["employee - email", "employee email", "email", "upn"],
  manager: ["reporting manager", "rm", "manager"],
  olm: ["employee olm", "user olm", "olm", "olmid"],
  domain: ["domain"],
  vertical: ["vertical", "vertical_add"],
  status: ["attendance status", "attendance"],
  shift: ["shift type", "shift"],
  company: ["company"],
  checkIn: ["checkin time", "check in time", "checkin"],
  checkOut: ["checkout time", "check out time", "checkout"],
  total: ["total hours", "total hour"],
  meeting: ["meeting time", "meeting"],
  training: ["trainingtime", "training time", "training", "taining"],
  remark: ["remark", "remarks"],
  premises: ["premises", "premise"],
  managerOlm: ["reportingmanager olm", "rm upn", "manager olm"],
  managerEmail: ["manageremail", "manager email", "reportingmanager olm"],
};

function normalizeAttendanceRow(row: Row, dateKeys: string[]): AttendanceRow | null {
  const date = parseDateValue(pick(row, dateKeys));
  const name = cleanCell(pick(row, MONTHLY_MAP.name));
  const olm = cleanCell(pick(row, MONTHLY_MAP.olm)).toUpperCase();
  if (!date || (!name && !olm)) return null;

  const shift = normalizeShift(pick(row, MONTHLY_MAP.shift));
  const status = normalizeStatus(pick(row, MONTHLY_MAP.status));
  const rawIn = pick(row, MONTHLY_MAP.checkIn);
  const rawOut = pick(row, MONTHLY_MAP.checkOut);
  const inTime = parseTimeValue(rawIn);
  const outTime = parseTimeValue(rawOut);
  const totalHours = parseDurationHours(pick(row, MONTHLY_MAP.total));

  return {
    date,
    employeeName: name,
    employeeEmail: cleanCell(pick(row, MONTHLY_MAP.email)),
    olm,
    managerName: cleanCell(pick(row, MONTHLY_MAP.manager)),
    managerOlm: cleanCell(pick(row, MONTHLY_MAP.managerOlm)),
    managerEmail: cleanCell(pick(row, MONTHLY_MAP.managerEmail)),
    domain: cleanCell(pick(row, MONTHLY_MAP.domain)),
    vertical: cleanCell(pick(row, MONTHLY_MAP.vertical)),
    company: cleanCell(pick(row, MONTHLY_MAP.company)),
    premises: cleanCell(pick(row, MONTHLY_MAP.premises)),
    status,
    amsShift: shift.code,
    amsShiftRaw: shift.raw,
    checkIn: inTime.minutes === null ? null : formatMinutes(inTime.minutes),
    checkOut: outTime.minutes === null ? null : formatMinutes(outTime.minutes),
    checkInMin: inTime.minutes,
    checkOutMin: outTime.minutes,
    totalHours,
    meetingHours: parseDurationHours(pick(row, MONTHLY_MAP.meeting)),
    trainingHours: parseDurationHours(pick(row, MONTHLY_MAP.training)),
    remark: cleanCell(pick(row, MONTHLY_MAP.remark)),
    invalidTimestamp:
      inTime.invalid || outTime.invalid || (status === "Present" && inTime.minutes === null),
    unknownShift: shift.unknown,
  };
}

function formatMinutes(min: number) {
  return `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
}

/** Parse an attendance file: monthly XLSX or daily CSV. Both map to one shape. */
export async function parseAttendanceFile(file: File): Promise<AttendanceRow[]> {
  const wb = await readWorkbook(file);
  const out: AttendanceRow[] = [];
  for (const sheetName of wb.SheetNames) {
    const rows = sheetRows(wb, sheetName);
    if (!rows.length) continue;
    const first = rows[0]!;
    const isDaily = hasHeader(first, ["dates", "user olm"]);
    const dateKeys = isDaily ? ["dates", "date"] : MONTHLY_MAP.date;
    if (!hasHeader(first, dateKeys)) continue;
    for (const row of rows) {
      const normalized = normalizeAttendanceRow(row, dateKeys);
      if (normalized) out.push(normalized);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Roster normalization (wide -> long)
 * ------------------------------------------------------------------ */

export async function parseRosterFile(file: File): Promise<RosterRow[]> {
  const wb = await readWorkbook(file);
  const out: RosterRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
    if (!grid.length) continue;

    // Fallback year/month from a title cell such as "MAY 2026".
    let fallbackYear: number | undefined;
    for (const row of grid.slice(0, 6)) {
      for (const cell of row ?? []) {
        const text = cleanCell(cell);
        const m = text.match(/(19|20)\d{2}/);
        if (m) {
          fallbackYear = +m[0];
          break;
        }
      }
      if (fallbackYear) break;
    }

    const headerIdx = grid.findIndex((row) =>
      (row ?? []).some((cell) => /^olm\s*id$|^olmid$|^employee olm$/i.test(cleanCell(cell))),
    );
    if (headerIdx < 0) continue;
    const header = grid[headerIdx]!;

    const findCol = (re: RegExp) => header.findIndex((cell) => re.test(cleanCell(cell)));
    const olmCol = findCol(/^olm\s*id$|^olmid$|^employee olm$/i);
    const nameCol = findCol(/employee name|^name$/i);
    const funcCol = findCol(/^function$|team|department/i);

    const dateCols: { col: number; date: string }[] = [];
    header.forEach((cell, col) => {
      if (col === olmCol || col === nameCol || col === funcCol) return;
      const date = parseDateValue(cell, fallbackYear);
      if (date) dateCols.push({ col, date });
    });
    if (!dateCols.length || olmCol < 0) continue;

    for (const row of grid.slice(headerIdx + 1)) {
      if (!row) continue;
      const olm = cleanCell(row[olmCol]).toUpperCase();
      const name = nameCol >= 0 ? cleanCell(row[nameCol]) : "";
      if (!olm && !name) continue;
      const functionName = funcCol >= 0 ? cleanCell(row[funcCol]) : "";
      for (const { col, date } of dateCols) {
        const raw = row[col];
        if (raw === null || raw === undefined || cleanCell(raw) === "") continue;
        const shift = normalizeShift(raw);
        out.push({
          date,
          olm,
          employeeName: name,
          functionName,
          shift: shift.code,
          shiftRaw: shift.raw,
          unknownShift: shift.unknown,
        });
      }
    }
  }
  return out;
}
