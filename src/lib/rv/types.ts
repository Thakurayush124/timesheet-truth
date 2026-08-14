export type ShiftCode = "A" | "G" | "LG" | "B" | "N" | "WO" | "L" | "H" | "OFF" | "UNKNOWN";

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Week-Off"
  | "Leave"
  | "Holiday"
  | "Missing"
  | string;

export interface ShiftDef {
  code: ShiftCode;
  label: string;
  working: boolean;
  /** expected check-in as minutes from midnight */
  startMin: number;
  /** expected check-out as minutes from midnight (may exceed 1440 for night) */
  endMin: number;
  plannedHours: number;
}

/** One normalized attendance record (AMS). */
export interface AttendanceRow {
  date: string; // YYYY-MM-DD
  employeeName: string;
  employeeEmail: string;
  olm: string; // string, prefix + leading zeros preserved
  managerName: string;
  managerOlm: string;
  managerEmail: string;
  domain: string;
  vertical: string;
  company: string;
  premises: string;
  status: AttendanceStatus;
  amsShift: ShiftCode;
  amsShiftRaw: string;
  checkIn: string | null; // HH:MM
  checkOut: string | null; // HH:MM
  checkInMin: number | null;
  checkOutMin: number | null;
  totalHours: number; // decimal
  meetingHours: number;
  trainingHours: number;
  remark: string;
  invalidTimestamp: boolean;
  unknownShift: boolean;
}

/** One normalized roster record (long format). */
export interface RosterRow {
  date: string; // YYYY-MM-DD
  olm: string;
  employeeName: string;
  functionName: string;
  shift: ShiftCode;
  shiftRaw: string;
  unknownShift: boolean;
}

export type ExceptionType =
  | "Shift Timing Mismatch"
  | "Absent on Planned Working Day"
  | "Missing Attendance Record"
  | "Worked on Week-Off";

/** Daily reconciliation record — the single source of truth for all metrics. */
export interface DailyRecord {
  date: string;
  olm: string;
  employeeName: string;
  functionName: string;
  domain: string;
  vertical: string;
  managerName: string;
  managerEmail: string;
  company: string;
  premises: string;
  rosterShift: ShiftCode;
  amsShift: ShiftCode | null;
  status: AttendanceStatus;
  plannedDay: boolean;
  present: boolean;
  plannedHours: number;
  actualHours: number;
  expectedIn: string | null;
  expectedOut: string | null;
  actualIn: string | null;
  actualOut: string | null;
  checkInDeltaHours: number | null;
  exceptions: ExceptionType[];
  countableException: boolean; // exception that reduces compliance
  mismatch: boolean;
  reason: string;
}

export interface ExceptionDetail {
  date: string;
  type: ExceptionType;
  rosterShift: ShiftCode;
  amsShift: ShiftCode | null;
  expectedIn: string | null;
  actualIn: string | null;
  expectedOut: string | null;
  actualOut: string | null;
  note: string;
}

export interface EmployeeSummary {
  olm: string;
  employeeName: string;
  functionName: string;
  domain: string;
  vertical: string;
  managerName: string;
  managerEmail: string;
  periodLabel: string;
  rosterShifts: ShiftCode[];
  amsShifts: ShiftCode[];
  plannedDays: number;
  presentDays: number;
  attendancePct: number | null;
  plannedHours: number;
  actualHours: number;
  avgHoursPerDay: number;
  mismatchDays: number;
  exceptionDays: number;
  compliancePct: number | null;
  exceptionCounts: Record<string, number>;
  exceptionDetails: ExceptionDetail[];
  status: "Compliant" | "Attention Required" | "Non-Compliant";
  days: DailyRecord[];
}

export type PeriodMode = "day" | "week" | "month";

export interface DataQuality {
  attendanceRecords: number;
  rosterRecords: number;
  matchedEmployees: number;
  onlyInAttendance: { olm: string; name: string }[];
  onlyInRoster: { olm: string; name: string }[];
  unknownShiftCodes: { code: string; source: string; count: number }[];
  invalidTimestamps: AttendanceRow[];
  attendanceFileNames: string[];
  rosterFileNames: string[];
}

export interface Dataset {
  attendance: AttendanceRow[];
  roster: RosterRow[];
  daily: DailyRecord[];
  quality: DataQuality;
  dates: string[]; // sorted unique dates present in roster+attendance
}
