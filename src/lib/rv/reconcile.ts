import type {
  AttendanceRow,
  DailyRecord,
  Dataset,
  DataQuality,
  ExceptionType,
  RosterRow,
} from "./types";
import { SHIFT_DEFS, circularDeltaHours, isWorkingShift, minutesToHHMM, shiftDisplay } from "./shifts";

/** A check-in this far (hours) from the rostered start is a timing mismatch. */
export const CHECKIN_TOLERANCE_HOURS = 10;

const key = (olm: string, date: string) => `${olm}|${date}`;

/**
 * Build the daily reconciliation table — the single source of truth.
 * Every employee/date pair present in roster OR attendance produces one record.
 */
export function buildDataset(attendance: AttendanceRow[], roster: RosterRow[]): Dataset {
  const attByKey = new Map<string, AttendanceRow>();
  for (const row of attendance) {
    const k = key(row.olm, row.date);
    const existing = attByKey.get(k);
    // Keep the richest record when duplicates exist.
    if (!existing || (existing.checkInMin === null && row.checkInMin !== null)) attByKey.set(k, row);
  }

  const attMeta = new Map<string, AttendanceRow>();
  for (const row of attendance) if (!attMeta.has(row.olm)) attMeta.set(row.olm, row);

  const rosterMeta = new Map<string, RosterRow>();
  for (const row of roster) if (!rosterMeta.has(row.olm)) rosterMeta.set(row.olm, row);

  const daily: DailyRecord[] = [];
  const seen = new Set<string>();

  for (const r of roster) {
    const k = key(r.olm, r.date);
    seen.add(k);
    daily.push(makeRecord(r, attByKey.get(k) ?? null, attMeta.get(r.olm) ?? null));
  }

  // Attendance rows outside the roster date grid still surface (as un-planned days),
  // but ONLY for employees that exist in the uploaded roster.
  for (const a of attendance) {
    const k = key(a.olm, a.date);
    if (seen.has(k)) continue;
    const meta = rosterMeta.get(a.olm);
    if (!meta) continue;
    seen.add(k);
    daily.push(
      makeRecord(
        {
          date: a.date,
          olm: a.olm,
          employeeName: a.employeeName,
          functionName: meta?.functionName ?? "",
          shift: "UNKNOWN",
          shiftRaw: "",
          unknownShift: false,
        },
        a,
        a,
      ),
    );
  }

  daily.sort((x, y) => x.date.localeCompare(y.date) || x.employeeName.localeCompare(y.employeeName));

  const quality = buildQuality(attendance, roster, attMeta, rosterMeta);
  const dates = Array.from(new Set(daily.map((d) => d.date))).sort();

  return { attendance, roster, daily, quality, dates };
}

function makeRecord(
  r: RosterRow,
  a: AttendanceRow | null,
  meta: AttendanceRow | null,
): DailyRecord {
  const def = SHIFT_DEFS[r.shift];
  const plannedDay = isWorkingShift(r.shift);
  const status = a ? a.status : "Missing";
  const present = status === "Present";
  const amsShift = a ? a.amsShift : null;

  const expectedIn = plannedDay ? minutesToHHMM(def.startMin) : null;
  const expectedOut = plannedDay ? minutesToHHMM(def.endMin) : null;
  const checkInDeltaHours =
    plannedDay && a?.checkInMin !== null && a?.checkInMin !== undefined
      ? circularDeltaHours(a.checkInMin, def.startMin)
      : null;

  const exceptions: ExceptionType[] = [];
  let mismatch = false;

  if (plannedDay) {
    if (!a) {
      exceptions.push("Missing Attendance Record");
    } else if (status === "Absent") {
      exceptions.push("Absent on Planned Working Day");
    } else if (status === "Missing") {
      exceptions.push("Missing Attendance Record");
    }

    if (a && (present || status === "Absent")) {
      const shiftDiffers = amsShift !== null && amsShift !== "UNKNOWN" && amsShift !== r.shift;
      const timingDiffers =
        checkInDeltaHours !== null && checkInDeltaHours >= CHECKIN_TOLERANCE_HOURS;
      if (shiftDiffers || timingDiffers) {
        mismatch = true;
        exceptions.push("Shift Timing Mismatch");
      }
    }
  } else if (r.shift === "WO" && present) {
    exceptions.push("Worked on Week-Off");
  }

  const countableException = exceptions.length > 0;

  return {
    date: r.date,
    olm: r.olm,
    employeeName: r.employeeName || a?.employeeName || meta?.employeeName || r.olm,
    functionName: r.functionName,
    domain: a?.domain || meta?.domain || "",
    vertical: a?.vertical || meta?.vertical || "",
    managerName: a?.managerName || meta?.managerName || "",
    managerEmail: a?.managerEmail || meta?.managerEmail || a?.managerOlm || meta?.managerOlm || "",
    company: a?.company || meta?.company || "",
    premises: a?.premises || "",
    rosterShift: r.shift,
    amsShift,
    status,
    plannedDay,
    present: plannedDay ? present : present,
    plannedHours: plannedDay ? def.plannedHours : 0,
    actualHours: a?.totalHours ?? 0,
    expectedIn,
    expectedOut,
    actualIn: a?.checkIn ?? null,
    actualOut: a?.checkOut ?? null,
    checkInDeltaHours,
    exceptions,
    countableException,
    mismatch,
    reason: buildReason(exceptions, r.shift, amsShift, expectedIn, a?.checkIn ?? null),
  };
}

function buildReason(
  exceptions: ExceptionType[],
  rosterShift: string,
  amsShift: string | null,
  expectedIn: string | null,
  actualIn: string | null,
): string {
  if (!exceptions.length) return "";
  return exceptions
    .map((e) => {
      if (e === "Shift Timing Mismatch") {
        if (amsShift && amsShift !== rosterShift)
          return `Shift Timing Mismatch (Roster ${shiftDisplay(rosterShift)} / AMS ${shiftDisplay(amsShift)})`;
        return `Shift Timing Mismatch (Expected In ${expectedIn ?? "-"} / Actual ${actualIn ?? "-"})`;
      }
      return e;
    })
    .join("; ");
}

function buildQuality(
  attendance: AttendanceRow[],
  roster: RosterRow[],
  attMeta: Map<string, AttendanceRow>,
  rosterMeta: Map<string, RosterRow>,
): DataQuality {
  const onlyInAttendance: DataQuality["onlyInAttendance"] = [];
  const onlyInRoster: DataQuality["onlyInRoster"] = [];
  let matched = 0;

  for (const [olm, row] of attMeta) {
    if (rosterMeta.has(olm)) matched += 1;
    else onlyInAttendance.push({ olm, name: row.employeeName });
  }
  for (const [olm, row] of rosterMeta) {
    if (!attMeta.has(olm)) onlyInRoster.push({ olm, name: row.employeeName });
  }

  const unknownMap = new Map<string, { code: string; source: string; count: number }>();
  const bump = (code: string, source: string) => {
    const k = `${source}|${code}`;
    const found = unknownMap.get(k);
    if (found) found.count += 1;
    else unknownMap.set(k, { code, source, count: 1 });
  };
  for (const a of attendance) if (a.unknownShift) bump(a.amsShiftRaw || "(blank)", "AMS");
  for (const r of roster) if (r.unknownShift) bump(r.shiftRaw || "(blank)", "Roster");

  return {
    attendanceRecords: attendance.length,
    rosterRecords: roster.length,
    matchedEmployees: matched,
    onlyInAttendance,
    onlyInRoster,
    unknownShiftCodes: Array.from(unknownMap.values()).sort((a, b) => b.count - a.count),
    invalidTimestamps: attendance.filter((a) => a.invalidTimestamp),
    attendanceFileNames: [],
    rosterFileNames: [],
  };
}
