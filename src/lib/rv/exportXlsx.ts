import * as XLSX from "xlsx";
import type { DailyRecord, EmployeeSummary, PeriodMode } from "./types";
import { exceptionBadgeLabel, formatDay } from "./aggregate";

function fileSuffix(mode: PeriodMode, anchor: string): string {
  if (!anchor) return "All-Data";
  if (mode === "day") return formatDay(anchor);
  if (mode === "week") return `Week_${anchor}`;
  return anchor;
}

export function exportSummary(
  summaries: EmployeeSummary[],
  mode: PeriodMode,
  anchor: string,
): void {
  const rows = summaries.map((s) => ({
    "Employee Name": s.employeeName,
    OLMID: s.olm,
    Team: s.functionName,
    "Manager Email": s.managerEmail,
    Domain: s.domain,
    Period: s.periodLabel,
    "Shift (Roster)": s.rosterShifts.join(", "),
    "Shift (AMS)": s.amsShifts.join(", "),
    "Planned Days": s.plannedDays,
    "Present Days": s.presentDays,
    "Attendance %": s.attendancePct === null ? "N/A" : +s.attendancePct.toFixed(2),
    "Planned Hours": +s.plannedHours.toFixed(2),
    "Actual Hours": +s.actualHours.toFixed(2),
    "Avg Hours / Day": +s.avgHoursPerDay.toFixed(2),
    "Mismatch Days": s.mismatchDays,
    "Exception Days": s.exceptionDays,
    "Compliance %": s.compliancePct === null ? "N/A" : +s.compliancePct.toFixed(2),
    "Exception Type": Object.keys(s.exceptionCounts).join(", ") || "No Exception",
    "Exception Details": Object.entries(s.exceptionCounts)
      .map(([type, count]) => `${count} ${exceptionBadgeLabel(type)}`)
      .join(", "),
    Status: s.status,
  }));
  download(rows, "Summary", `Attendance_Compliance_${fileSuffix(mode, anchor)}.xlsx`);
}

export function exportDaily(rows: DailyRecord[], mode: PeriodMode, anchor: string): void {
  const data = rows.map((d) => ({
    Date: d.date,
    Employee: d.employeeName,
    OLMID: d.olm,
    Team: d.functionName,
    Domain: d.domain,
    Manager: d.managerName,
    "Roster Shift": d.rosterShift,
    "AMS Shift": d.amsShift ?? "-",
    "Expected In": d.expectedIn ?? "-",
    "Actual In": d.actualIn ?? "-",
    "Expected Out": d.expectedOut ?? "-",
    "Actual Out": d.actualOut ?? "-",
    Attendance: d.status,
    "Planned Day": d.plannedDay ? "Yes" : "No",
    "Planned Hours": +d.plannedHours.toFixed(2),
    "Actual Hours": +d.actualHours.toFixed(2),
    Exception: d.exceptions.length ? "Yes" : "No",
    "Exception Reason": d.reason || "-",
  }));
  download(data, "Daily", `Attendance_Compliance_Daily_${fileSuffix(mode, anchor)}.xlsx`);
}

function download(rows: Record<string, unknown>[], sheet: string, filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
  XLSX.writeFile(workbook, filename);
}
