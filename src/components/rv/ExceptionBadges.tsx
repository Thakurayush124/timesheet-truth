import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exceptionBadgeLabel, formatDay } from "@/lib/rv/aggregate";
import { shiftDisplay } from "@/lib/rv/shifts";
import type { EmployeeSummary, ExceptionType } from "@/lib/rv/types";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  "Shift Timing Mismatch": "bg-warning/20 text-warning-foreground border-warning/40",
  "Absent on Planned Working Day": "bg-destructive/15 text-destructive border-destructive/40",
  "Missing Attendance Record": "bg-info/15 text-info border-info/40",
  "Worked on Week-Off": "bg-accent/20 text-accent-foreground border-accent/40",
};

/** Exception badges with a hover/click popover explaining every occurrence. */
export function ExceptionBadges({ summary }: { summary: EmployeeSummary }) {
  const entries = Object.entries(summary.exceptionCounts);
  if (!entries.length) {
    return (
      <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
        No Exception
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([type, count]) => (
        <Popover key={type}>
          <PopoverTrigger asChild>
            <button type="button">
              <Badge
                variant="outline"
                className={cn("cursor-pointer gap-1", TONE[type] ?? "bg-muted")}
              >
                <AlertTriangle className="size-3" />
                {exceptionBadgeLabel(type)} ({count})
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">Exception: {type}</p>
              <p className="text-xs text-muted-foreground">
                {summary.employeeName} · {summary.periodLabel}
              </p>
            </div>
            <ScrollArea className="max-h-64">
              <ul className="divide-y">
                {summary.exceptionDetails
                  .filter((detail) => detail.type === (type as ExceptionType))
                  .map((detail, idx) => (
                    <li key={`${detail.date}-${idx}`} className="px-3 py-2 text-xs">
                      <p className="num font-semibold">{formatDay(detail.date)}</p>
                      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                        <Row label="Roster Shift" value={detail.rosterShift} />
                        <Row label="AMS Shift" value={detail.amsShift ?? "—"} />
                        <Row label="Expected Check-In" value={detail.expectedIn ?? "—"} />
                        <Row label="Actual Check-In" value={detail.actualIn ?? "—"} />
                        <Row label="Expected Check-Out" value={detail.expectedOut ?? "—"} />
                        <Row label="Actual Check-Out" value={detail.actualOut ?? "—"} />
                      </dl>
                    </li>
                  ))}
              </ul>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="num text-foreground">{value}</dd>
    </div>
  );
}

export function ExceptionSummaryText({ summary }: { summary: EmployeeSummary }) {
  const entries = Object.entries(summary.exceptionCounts);
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-xs">
      {entries.map(([type, count]) => `${count} ${exceptionBadgeLabel(type)}`).join(", ")}
    </span>
  );
}

export function StatusBadge({ status }: { status: EmployeeSummary["status"] }) {
  const tone =
    status === "Compliant"
      ? "border-success/40 bg-success/10 text-success"
      : status === "Attention Required"
        ? "border-warning/50 bg-warning/20 text-warning-foreground"
        : "border-destructive/40 bg-destructive/15 text-destructive";
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", tone)}>
      {status}
    </Badge>
  );
}
