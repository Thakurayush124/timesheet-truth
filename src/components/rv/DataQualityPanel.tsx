import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRv } from "@/state/rv-store";

export function DataQualityPanel() {
  const { dataset } = useRv();
  const [open, setOpen] = useState<string | null>(null);
  if (!dataset) return null;
  const q = dataset.quality;

  const items = [
    { key: "att", ok: true, text: `Attendance records loaded: ${q.attendanceRecords.toLocaleString()}`, rows: [] as string[] },
    { key: "ros", ok: true, text: `Roster records loaded: ${q.rosterRecords.toLocaleString()}`, rows: [] as string[] },
    { key: "match", ok: true, text: `Employees matched: ${q.matchedEmployees}`, rows: [] as string[] },
    {
      key: "onlyAtt",
      ok: q.onlyInAttendance.length === 0,
      text: `In Attendance but not in Roster — excluded from validation: ${q.onlyInAttendance.length}`,
      rows: q.onlyInAttendance.map((e) => `${e.name} (${e.olm})`),
    },
    {
      key: "onlyRos",
      ok: q.onlyInRoster.length === 0,
      text: `Employees only in Roster: ${q.onlyInRoster.length}`,
      rows: q.onlyInRoster.map((e) => `${e.name} (${e.olm})`),
    },
    {
      key: "shift",
      ok: q.unknownShiftCodes.length === 0,
      text: `Unknown shift codes: ${q.unknownShiftCodes.length}`,
      rows: q.unknownShiftCodes.map((c) => `${c.source}: "${c.code}" × ${c.count}`),
    },
    {
      key: "time",
      ok: q.invalidTimestamps.length === 0,
      text: `Invalid / missing attendance timestamps: ${q.invalidTimestamps.length}`,
      rows: q.invalidTimestamps
        .slice(0, 500)
        .map((r) => `${r.date} — ${r.employeeName} (${r.olm}) · ${r.status}`),
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold">Data validation</h3>
      <p className="text-xs text-muted-foreground">
        {q.attendanceFileNames.join(", ")} + {q.rosterFileNames.join(", ")}
      </p>
      <ul className="mt-3 space-y-1">
        {items.map((item) => (
          <li key={item.key} className="rounded-md border px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              {item.ok ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <AlertTriangle className="size-4 text-warning" />
              )}
              <span>{item.text}</span>
              {item.rows.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => setOpen(open === item.key ? null : item.key)}
                >
                  {open === item.key ? "Hide records" : "Show records"}
                </Button>
              )}
            </div>
            {open === item.key && (
              <ScrollArea className="mt-2 max-h-48 rounded-md bg-muted p-2">
                <ul className="space-y-0.5 text-xs">
                  {item.rows.map((row, idx) => (
                    <li key={idx} className="num">
                      {row}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
