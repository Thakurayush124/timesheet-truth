import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useRv } from "@/state/rv-store";
import { formatDay } from "@/lib/rv/aggregate";
import { shiftDisplay } from "@/lib/rv/shifts";
import { exportDaily } from "@/lib/rv/exportXlsx";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export function DailyTable() {
  const { dailyRows, filters, update, anchor } = useRv();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(dailyRows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = dailyRows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 className="text-base font-semibold">Daily reconciliation</h3>
          <p className="text-xs text-muted-foreground">
            {dailyRows.length.toLocaleString()} employee-day records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filters.exceptionDaysOnly ? "exceptions" : "all"}
            onValueChange={(value) =>
              value && update({ exceptionDaysOnly: value === "exceptions" })
            }
          >
            <ToggleGroupItem value="all">All Days</ToggleGroupItem>
            <ToggleGroupItem value="exceptions">Exception Days Only</ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportDaily(dailyRows, filters.periodMode, anchor)}
          >
            <Download className="size-3.5" />
            Export Daily Details
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>OLMID</TableHead>
              <TableHead>Roster</TableHead>
              <TableHead>AMS</TableHead>
              <TableHead>Expected In</TableHead>
              <TableHead>Actual In</TableHead>
              <TableHead>Expected Out</TableHead>
              <TableHead>Actual Out</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="text-right">Hrs</TableHead>
              <TableHead>Exception</TableHead>
              <TableHead>Exception Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center text-muted-foreground">
                  No records match the current filters.
                </TableCell>
              </TableRow>
            )}
            {slice.map((row) => (
              <TableRow
                key={`${row.olm}-${row.date}`}
                className={cn(row.exceptions.length > 0 && "bg-destructive/5")}
              >
                <TableCell className="num whitespace-nowrap text-xs">
                  {formatDay(row.date)}
                </TableCell>
                <TableCell className="text-xs font-medium">{row.employeeName}</TableCell>
                <TableCell className="num text-xs">{row.olm}</TableCell>
                <TableCell className="num text-xs">{shiftDisplay(row.rosterShift)}</TableCell>
                <TableCell className="num text-xs">{shiftDisplay(row.amsShift)}</TableCell>
                <TableCell className="num text-xs">{row.expectedIn ?? "—"}</TableCell>
                <TableCell className="num text-xs">{row.actualIn ?? "—"}</TableCell>
                <TableCell className="num text-xs">{row.expectedOut ?? "—"}</TableCell>
                <TableCell className="num text-xs">{row.actualOut ?? "—"}</TableCell>
                <TableCell className="text-xs">{row.status}</TableCell>
                <TableCell className="num text-right text-xs">
                  {row.actualHours.toFixed(1)}
                </TableCell>
                <TableCell>
                  {row.exceptions.length ? (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-destructive/10 text-destructive"
                    >
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                      No
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">{row.reason || "—"}</TableCell>
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
    </Card>
  );
}
