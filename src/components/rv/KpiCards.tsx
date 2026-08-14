import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRv } from "@/state/rv-store";
import { hrs, pct } from "@/lib/rv/aggregate";
import { cn } from "@/lib/utils";

export function KpiCards() {
  const { kpis, previousKpis, label, filters } = useRv();

  const items: { title: string; value: string; delta?: number | null; sub?: string }[] = [
    { title: "Employees", value: String(kpis.employees), sub: label },
    { title: "Planned Days", value: String(kpis.plannedDays), sub: "Roster-defined working days" },
    { title: "Present Days", value: String(kpis.presentDays), sub: "Present on planned days" },
    {
      title: "Attendance %",
      value: pct(kpis.attendancePct),
      delta:
        previousKpis && kpis.attendancePct !== null && previousKpis.attendancePct !== null
          ? kpis.attendancePct - previousKpis.attendancePct
          : null,
      sub: "Present Days / Planned Days",
    },
    {
      title: "Compliance %",
      value: pct(kpis.compliancePct),
      delta:
        previousKpis && kpis.compliancePct !== null && previousKpis.compliancePct !== null
          ? kpis.compliancePct - previousKpis.compliancePct
          : null,
      sub: "(Planned - Exception) / Planned",
    },
    { title: "Planned Hours", value: hrs(kpis.plannedHours), sub: "From rostered shifts" },
    { title: "Actual Hours", value: hrs(kpis.actualHours), sub: "From AMS attendance" },
    { title: "Avg Hours / Day", value: hrs(kpis.avgHoursPerDay), sub: "Actual / Present Days" },
    { title: "Mismatch Days", value: String(kpis.mismatchDays), sub: "Roster vs AMS shift" },
    { title: "Exception Days", value: String(kpis.exceptionDays), sub: "Unique planned days" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.title}
          </p>
          <p className="num mt-2 text-2xl font-semibold">{item.value}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {item.delta !== undefined && item.delta !== null ? (
              <Delta value={item.delta} />
            ) : (
              <span className="truncate">{item.sub}</span>
            )}
          </div>
        </Card>
      ))}
      {filters.compare && !previousKpis && (
        <Card className="p-4 text-xs text-muted-foreground">No previous period available.</Card>
      )}
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const rounded = Math.abs(value) < 0.05;
  const Icon = rounded ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        rounded ? "text-muted-foreground" : value > 0 ? "text-success" : "text-destructive",
      )}
    >
      <Icon className="size-3.5" />
      {rounded ? "No change" : `${value > 0 ? "+" : ""}${value.toFixed(2)} pts vs prev.`}
    </span>
  );
}
