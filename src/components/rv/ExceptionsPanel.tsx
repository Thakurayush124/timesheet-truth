import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRv } from "@/state/rv-store";
import { exceptionBadgeLabel, formatWeek } from "@/lib/rv/aggregate";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export function ExceptionsPanel() {
  const { exceptions, summaries, rows } = useRv();
  const distribution = exceptions.map((e) => ({ ...e, name: exceptionBadgeLabel(e.type) }));
  const worst = summaries.filter((s) => s.exceptionDays > 0).slice(0, 10);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-base font-semibold">Exception distribution</h3>
        <p className="text-xs text-muted-foreground">
          Exception days and impacted employees for the current filters
        </p>
        <div className="mt-4 h-56">
          {distribution.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No exceptions in the selected period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="days" name="Exception days" radius={[4, 4, 0, 0]}>
                  {distribution.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <Table className="mt-2">
          <TableHeader>
            <TableRow>
              <TableHead>Exception</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distribution.map((row) => (
              <TableRow key={row.type}>
                <TableCell className="text-xs">{row.type}</TableCell>
                <TableCell className="num text-right">{row.days}</TableCell>
                <TableCell className="num text-right">{row.employees}</TableCell>
              </TableRow>
            ))}
            {distribution.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                  Nothing to show
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h3 className="text-base font-semibold">Employees needing attention</h3>
        <p className="text-xs text-muted-foreground">
          Ranked by compliance (lowest first) · {rows.length.toLocaleString()} reconciled days
        </p>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Exception Days</TableHead>
              <TableHead>Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {worst.map((s) => (
              <TableRow key={s.olm}>
                <TableCell className="text-xs font-medium">{s.employeeName}</TableCell>
                <TableCell className="text-xs">{s.functionName || "—"}</TableCell>
                <TableCell className="num text-right">{s.exceptionDays}</TableCell>
                <TableCell className="text-xs">
                  {Object.entries(s.exceptionCounts)
                    .map(([type, count]) => `${exceptionBadgeLabel(type)}: ${count}`)
                    .join(" · ")}
                </TableCell>
              </TableRow>
            ))}
            {worst.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  All filtered employees are compliant.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 xl:col-span-2">
        <h3 className="text-base font-semibold">Weekly trend</h3>
        <p className="text-xs text-muted-foreground">
          Compliance %, attendance % and exception days per week, aggregated from daily records
        </p>
        <TrendChart />
      </Card>
    </div>
  );
}

function TrendChart() {
  const { trend } = useRv();
  if (trend.length === 0)
    return <p className="py-12 text-center text-sm text-muted-foreground">No data in period.</p>;
  const data = trend.map((t) => ({
    label: `${t.label} (${formatWeek(t.weekStart).slice(0, 6)})`,
    Compliance: t.compliance === null ? null : +t.compliance.toFixed(1),
    Attendance: t.attendance === null ? null : +t.attendance.toFixed(1),
    Exceptions: t.exceptionDays,
  }));
  return (
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="label" fontSize={11} tickLine={false} />
          <YAxis fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="Compliance" stroke="var(--color-chart-1)" strokeWidth={2} />
          <Line type="monotone" dataKey="Attendance" stroke="var(--color-chart-3)" strokeWidth={2} />
          <Line type="monotone" dataKey="Exceptions" stroke="var(--color-chart-4)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
