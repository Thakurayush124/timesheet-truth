import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exceptionBadgeLabel, formatDay, hrs, pct } from "@/lib/rv/aggregate";
import { shiftDisplay } from "@/lib/rv/shifts";
import type { EmployeeSummary } from "@/lib/rv/types";
import { StatusBadge } from "./ExceptionBadges";
import { cn } from "@/lib/utils";

/** Day-level drill-down: Month -> Week -> Day -> Employee -> Exception details. */
export function EmployeeDrawer({
  summary,
  onClose,
}: {
  summary: EmployeeSummary | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!summary} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-3xl sm:max-w-3xl">
        {summary && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {summary.employeeName}
                <StatusBadge status={summary.status} />
              </SheetTitle>
              <SheetDescription>
                {summary.olm} · {summary.functionName || "No team"} · {summary.periodLabel}
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2 px-4 md:grid-cols-4">
              <Stat label="Attendance %" value={pct(summary.attendancePct)} />
              <Stat label="Compliance %" value={pct(summary.compliancePct)} />
              <Stat label="Exception Days" value={String(summary.exceptionDays)} />
              <Stat label="Mismatch Days" value={String(summary.mismatchDays)} />
              <Stat label="Planned Days" value={String(summary.plannedDays)} />
              <Stat label="Present Days" value={String(summary.presentDays)} />
              <Stat label="Planned Hours" value={hrs(summary.plannedHours)} />
              <Stat label="Actual Hours" value={hrs(summary.actualHours)} />
            </div>

            <div className="px-4">
              <p className="text-sm font-semibold">
                {summary.exceptionDays > 0 ? "⚠" : "✓"} {summary.exceptionDetails.length} Exception
                {summary.exceptionDetails.length === 1 ? "" : "s"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(summary.exceptionCounts).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {exceptionBadgeLabel(type)}: {count}
                  </Badge>
                ))}
                {summary.exceptionDetails.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Fully compliant for this period.
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="mt-2 h-[calc(100vh-24rem)] px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Roster</TableHead>
                    <TableHead>AMS</TableHead>
                    <TableHead>Exp In</TableHead>
                    <TableHead>Act In</TableHead>
                    <TableHead>Exp Out</TableHead>
                    <TableHead>Act Out</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Hrs</TableHead>
                    <TableHead>Exception Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.days.map((day) => (
                    <TableRow
                      key={day.date}
                      className={cn(day.exceptions.length > 0 && "bg-destructive/5")}
                    >
                      <TableCell className="num whitespace-nowrap text-xs">
                        {formatDay(day.date)}
                      </TableCell>
                      <TableCell className="num text-xs">{shiftDisplay(day.rosterShift)}</TableCell>
                      <TableCell className="num text-xs">{shiftDisplay(day.amsShift)}</TableCell>
                      <TableCell className="num text-xs">{day.expectedIn ?? "—"}</TableCell>
                      <TableCell className="num text-xs">{day.actualIn ?? "—"}</TableCell>
                      <TableCell className="num text-xs">{day.expectedOut ?? "—"}</TableCell>
                      <TableCell className="num text-xs">{day.actualOut ?? "—"}</TableCell>
                      <TableCell className="text-xs">{day.status}</TableCell>
                      <TableCell className="num text-right text-xs">
                        {day.actualHours.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-xs">{day.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="num text-lg font-semibold">{value}</p>
    </div>
  );
}
