import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ExceptionBadges, ExceptionSummaryText, StatusBadge } from "./ExceptionBadges";
import { EmployeeDrawer } from "./EmployeeDrawer";
import { useRv } from "@/state/rv-store";
import { formatDay, hrs, pct } from "@/lib/rv/aggregate";
import { shiftDisplay } from "@/lib/rv/shifts";
import { exportSummary } from "@/lib/rv/exportXlsx";
import type { EmployeeSummary } from "@/lib/rv/types";

type SortKey =
  | "employeeName"
  | "attendancePct"
  | "compliancePct"
  | "exceptionDays"
  | "mismatchDays"
  | "plannedDays"
  | "presentDays"
  | "plannedHours"
  | "actualHours"
  | "avgHoursPerDay";

const PAGE_SIZE = 25;

export function EmployeeTable() {
  const { summaries, filters, update, anchor } = useRv();
  const [sortKey, setSortKey] = useState<SortKey>("compliancePct");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<EmployeeSummary | null>(null);

  const sorted = useMemo(() => {
    const copy = summaries.slice();
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" || typeof bv === "string")
        return String(av).localeCompare(String(bv)) * (asc ? 1 : -1);
      const an = av === null ? (asc ? 1e9 : -1e9) : (av as number);
      const bn = bv === null ? (asc ? 1e9 : -1e9) : (bv as number);
      return (an - bn) * (asc ? 1 : -1);
    });
    return copy;
  }, [summaries, sortKey, asc]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const head = (key: SortKey, label: string, numeric = true) => (
    <TableHead
      className={numeric ? "cursor-pointer text-right" : "cursor-pointer"}
      onClick={() => {
        if (sortKey === key) setAsc(!asc);
        else {
          setSortKey(key);
          setAsc(true);
        }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === key &&
          (asc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </span>
    </TableHead>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 className="text-base font-semibold">Employee summary</h3>
          <p className="text-xs text-muted-foreground">
            {sorted.length} employees · {filters.periodMode === "day" ? "daily" : filters.periodMode}{" "}
            aggregation of the daily reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={filters.exceptionsOnly ? "exceptions" : "all"}
            onValueChange={(value) => value && update({ exceptionsOnly: value === "exceptions" })}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All Employees</ToggleGroupItem>
            <ToggleGroupItem value="exceptions">Exceptions Only</ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportSummary(sorted, filters.periodMode, anchor)}
          >
            <Download className="size-3.5" />
            Export Summary
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {head("employeeName", "Employee Name", false)}
              <TableHead>OLMID</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Manager Email</TableHead>
              <TableHead>{filters.periodMode === "day" ? "Date" : "Period"}</TableHead>
              <TableHead>Shift (Roster)</TableHead>
              <TableHead>Shift (AMS)</TableHead>
              {head("mismatchDays", "Mismatch Days")}
              {head("plannedDays", "Planned Days")}
              {head("presentDays", "Present Days")}
              {head("attendancePct", "Attendance %")}
              {head("plannedHours", "Planned Hrs")}
              {head("actualHours", "Actual Hrs")}
              {head("avgHoursPerDay", "Avg Hrs / Day")}
              {head("compliancePct", "Compliance %")}
              {head("exceptionDays", "Exception Days")}
              <TableHead>Exception Type</TableHead>
              <TableHead>Exception Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow>
                <TableCell colSpan={20} className="py-10 text-center text-muted-foreground">
                  No employees match the current filters.
                </TableCell>
              </TableRow>
            )}
            {slice.map((s) => (
              <TableRow key={s.olm} className="align-top">
                <TableCell className="font-medium">{s.employeeName}</TableCell>
                <TableCell className="num text-xs">{s.olm}</TableCell>
                <TableCell className="text-xs">{s.functionName || "—"}</TableCell>
                <TableCell className="max-w-40 truncate text-xs">{s.managerEmail || "—"}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {filters.periodMode === "day" && anchor ? formatDay(anchor) : s.periodLabel}
                </TableCell>
                <TableCell className="num text-xs">{s.rosterShifts.join(", ") || "—"}</TableCell>
                <TableCell className="num text-xs">{s.amsShifts.join(", ") || "—"}</TableCell>
                <TableCell className="num text-right">{s.mismatchDays}</TableCell>
                <TableCell className="num text-right">{s.plannedDays}</TableCell>
                <TableCell className="num text-right">{s.presentDays}</TableCell>
                <TableCell className="num text-right">{pct(s.attendancePct)}</TableCell>
                <TableCell className="num text-right">{hrs(s.plannedHours)}</TableCell>
                <TableCell className="num text-right">{hrs(s.actualHours)}</TableCell>
                <TableCell className="num text-right">{hrs(s.avgHoursPerDay)}</TableCell>
                <TableCell className="num text-right font-semibold">
                  {pct(s.compliancePct)}
                </TableCell>
                <TableCell className="num text-right">{s.exceptionDays}</TableCell>
                <TableCell>
                  <ExceptionBadges summary={s} />
                </TableCell>
                <TableCell className="max-w-48">
                  <ExceptionSummaryText summary={s} />
                  {s.exceptionDays > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="mt-1 block text-xs font-medium text-primary underline"
                    >
                      View Details
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setSelected(s)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-3 text-xs text-muted-foreground">
        <span>
          Page {current + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <EmployeeDrawer summary={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
