import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_FILTERS,
  computeKpis,
  defaultAnchor,
  exceptionStats,
  filterRows,
  filterSummaries,
  periodLabel,
  previousAnchor,
  summarize,
  weeklyTrend,
  type FilterState,
} from "@/lib/rv/aggregate";
import type { DailyRecord, Dataset, EmployeeSummary, PeriodMode } from "@/lib/rv/types";

interface RvContextValue {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  filters: FilterState;
  update: (patch: Partial<FilterState>) => void;
  clearFilters: () => void;
  setPeriodMode: (mode: PeriodMode) => void;
  anchor: string;
  label: string;
  rows: DailyRecord[]; // period + row filters applied
  dailyRows: DailyRecord[]; // rows for the daily reconciliation view
  summaries: EmployeeSummary[]; // employee filters applied
  kpis: ReturnType<typeof computeKpis>;
  previousKpis: ReturnType<typeof computeKpis> | null;
  exceptions: ReturnType<typeof exceptionStats>;
  trend: ReturnType<typeof weeklyTrend>;
  options: {
    employees: { value: string; label: string }[];
    functions: string[];
    domains: string[];
    managers: string[];
  };
}

const RvContext = createContext<RvContextValue | null>(null);

export function RvProvider({ children }: { children: ReactNode }) {
  const [dataset, setDatasetRaw] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const setDataset = useCallback((next: Dataset | null) => {
    setDatasetRaw(next);
    setFilters({
      ...EMPTY_FILTERS,
      periodMode: "month",
      periodAnchor: next ? defaultAnchor(next.dates, "month") : "",
    });
  }, []);

  const update = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...EMPTY_FILTERS,
      periodMode: prev.periodMode,
      periodAnchor: prev.periodAnchor,
    }));
  }, []);

  const setPeriodMode = useCallback(
    (mode: PeriodMode) => {
      setFilters((prev) => ({
        ...prev,
        periodMode: mode,
        periodAnchor: dataset ? defaultAnchor(dataset.dates, mode) : "",
      }));
    },
    [dataset],
  );

  const value = useMemo<RvContextValue>(() => {
    const daily = dataset?.daily ?? [];
    const anchor = filters.periodAnchor;
    const label = periodLabel(filters.periodMode, anchor);

    const periodRows = filterRows(daily, filters, anchor);
    const allSummaries = summarize(periodRows, label);
    const summaries = filterSummaries(allSummaries, filters);
    const visible = new Set(summaries.map((s) => s.olm));
    const rows = periodRows.filter((r) => visible.has(r.olm));

    let dailyRows = rows;
    if (filters.exceptionTypes.length) {
      const wantsNone = filters.exceptionTypes.includes("No Exception");
      dailyRows = dailyRows.filter((r) =>
        r.exceptions.length
          ? r.exceptions.some((e) => filters.exceptionTypes.includes(e))
          : wantsNone,
      );
    }
    if (filters.exceptionDaysOnly) dailyRows = dailyRows.filter((r) => r.exceptions.length > 0);

    let previousKpis: ReturnType<typeof computeKpis> | null = null;
    if (filters.compare && anchor) {
      const prevAnchor = previousAnchor(filters.periodMode, anchor);
      const prevRows = filterRows(daily, filters, prevAnchor);
      const prevSummaries = filterSummaries(summarize(prevRows, prevAnchor), filters);
      previousKpis = computeKpis(prevSummaries);
    }

    const employeeMap = new Map<string, string>();
    const functions = new Set<string>();
    const domains = new Set<string>();
    const managers = new Set<string>();
    for (const row of daily) {
      if (!employeeMap.has(row.olm)) employeeMap.set(row.olm, row.employeeName);
      if (row.functionName) functions.add(row.functionName);
      if (row.domain) domains.add(row.domain);
      if (row.managerName) managers.add(row.managerName);
    }

    return {
      dataset,
      setDataset,
      filters,
      update,
      clearFilters,
      setPeriodMode,
      anchor,
      label,
      rows,
      dailyRows,
      summaries,
      kpis: computeKpis(summaries),
      previousKpis,
      exceptions: exceptionStats(rows),
      trend: weeklyTrend(rows),
      options: {
        employees: Array.from(employeeMap.entries())
          .map(([olm, name]) => ({ value: olm, label: `${name} (${olm})` }))
          .sort((a, b) => a.label.localeCompare(b.label)),
        functions: Array.from(functions).sort(),
        domains: Array.from(domains).sort(),
        managers: Array.from(managers).sort(),
      },
    };
  }, [dataset, filters, setDataset, update, clearFilters, setPeriodMode]);

  return <RvContext.Provider value={value}>{children}</RvContext.Provider>;
}

export function useRv(): RvContextValue {
  const ctx = useContext(RvContext);
  if (!ctx) throw new Error("useRv must be used inside RvProvider");
  return ctx;
}
