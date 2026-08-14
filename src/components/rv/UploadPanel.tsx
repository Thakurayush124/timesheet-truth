import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseAttendanceFile, parseRosterFile } from "@/lib/rv/parse";
import { buildDataset } from "@/lib/rv/reconcile";
import { useRv } from "@/state/rv-store";

type Kind = "attendance" | "roster";

export function UploadPanel({ compact = false }: { compact?: boolean }) {
  const { setDataset, dataset } = useRv();
  const [attendanceFiles, setAttendanceFiles] = useState<File[]>([]);
  const [rosterFiles, setRosterFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const attendanceRef = useRef<HTMLInputElement>(null);
  const rosterRef = useRef<HTMLInputElement>(null);

  const add = (kind: Kind, files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    if (kind === "attendance") setAttendanceFiles((prev) => [...prev, ...list]);
    else setRosterFiles((prev) => [...prev, ...list]);
  };

  const process = async () => {
    if (!attendanceFiles.length || !rosterFiles.length) {
      toast.error("Upload at least one attendance file and one roster file.");
      return;
    }
    setBusy(true);
    try {
      const attendance = (await Promise.all(attendanceFiles.map(parseAttendanceFile))).flat();
      const roster = (await Promise.all(rosterFiles.map(parseRosterFile))).flat();
      if (!attendance.length) throw new Error("No attendance rows recognised in the uploaded file.");
      if (!roster.length) throw new Error("No roster rows recognised — check the OLMID header row.");
      const next = buildDataset(attendance, roster);
      next.quality.attendanceFileNames = attendanceFiles.map((f) => f.name);
      next.quality.rosterFileNames = rosterFiles.map((f) => f.name);
      setDataset(next);
      toast.success(
        `Reconciled ${next.daily.length.toLocaleString()} employee-day records across ${next.dates.length} dates.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not parse the uploaded files.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Upload data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Attendance (AMS monthly .xlsx or daily .csv) plus roster (.xlsx, wide format with date
            columns).
          </p>
        </div>
        {dataset && !compact && (
          <Button variant="ghost" size="sm" onClick={() => setDataset(null)}>
            Reset dataset
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <DropZone
          title="Attendance (AMS)"
          hint=".xlsx / .csv — monthly or daily export"
          files={attendanceFiles}
          onPick={() => attendanceRef.current?.click()}
          onRemove={(idx) => setAttendanceFiles((p) => p.filter((_, i) => i !== idx))}
        />
        <DropZone
          title="Roster"
          hint=".xlsx — Function / OLMID / Employee Name + date columns"
          files={rosterFiles}
          onPick={() => rosterRef.current?.click()}
          onRemove={(idx) => setRosterFiles((p) => p.filter((_, i) => i !== idx))}
        />
      </div>

      <input
        ref={attendanceRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => add("attendance", e.target.files)}
      />
      <input
        ref={rosterRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => add("roster", e.target.files)}
      />

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={process} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Reconciling…" : "Validate roster vs attendance"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Files are parsed in your browser — nothing is uploaded to a server.
        </p>
      </div>
    </Card>
  );
}

function DropZone({
  title,
  hint,
  files,
  onPick,
  onRemove,
}: {
  title: string;
  hint: string;
  files: File[];
  onPick: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onPick}>
          Choose files
        </Button>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <FileSpreadsheet className="size-3.5 text-primary" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="ml-auto text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
