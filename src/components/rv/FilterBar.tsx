import { CalendarRange, Filter, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "./MultiSelect";
import { useRv } from "@/state/rv-store";
import {
  COMPLIANCE_STATUSES,
  EXCEPTION_TYPES,
  countActiveFilters,
  periodOptions,
} from "@/lib/rv/aggregate";
import { SHIFT_FILTER_CODES, STATUS_FILTER_VALUES } from "@/lib/rv/shifts";
import type { PeriodMode } from "@/lib/rv/types";

export function FilterBar() {
  const { dataset, filters, update, clearFilters, setPeriodMode, options } = useRv();
  if (!dataset) return null;

  const active = countActiveFilters(filters);
  const periods = periodOptions(dataset.dates, filters.periodMode);

  return (
    <Card className="sticky top-0 z-30 space-y-3 rounded-none border-x-0 border-t-0 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 text-primary" />
          <span className="text-sm font-medium">Calculation Period</span>
        </div>
        <Select
          value={filters.periodMode}
          onValueChange={(value) => setPeriodMode(value as PeriodMode)}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.periodAnchor}
          onValueChange={(value) => update({ periodAnchor: value })}
        >
          <SelectTrigger className="h-8 w-60">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {periods.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 pl-2">
          <Switch
            id="compare"
            checked={filters.compare}
            onCheckedChange={(checked) => update({ compare: checked })}
          />
          <Label htmlFor="compare" className="text-xs text-muted-foreground">
            Compare with previous period
          </Label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Filter className="size-3" />
            Active Filters: {active}
          </Badge>
          <Button variant="outline" size="sm" onClick={clearFilters} disabled={active === 0}>
            <RotateCcw className="size-3.5" />
            Clear All Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search name, OLMID or manager…"
            className="h-8 pl-8"
          />
        </div>
        <MultiSelect
          label="Employee"
          searchable
          options={options.employees}
          selected={filters.employees}
          onChange={(next) => update({ employees: next })}
        />
        <MultiSelect
          label="OLMID"
          searchable
          options={options.employees.map((e) => ({ value: e.value, label: e.value }))}
          selected={filters.olmIds}
          onChange={(next) => update({ olmIds: next })}
          width="w-44"
        />
        <MultiSelect
          label="Team"
          searchable
          options={options.functions}
          selected={filters.functions}
          onChange={(next) => update({ functions: next })}
        />
        <MultiSelect
          label="Domain"
          searchable
          options={options.domains}
          selected={filters.domains}
          onChange={(next) => update({ domains: next })}
        />
        <MultiSelect
          label="Manager"
          searchable
          options={options.managers}
          selected={filters.managers}
          onChange={(next) => update({ managers: next })}
        />
        <MultiSelect
          label="Roster Shift"
          options={SHIFT_FILTER_CODES}
          selected={filters.rosterShifts}
          onChange={(next) => update({ rosterShifts: next })}
          width="w-40"
        />
        <MultiSelect
          label="AMS Shift"
          options={SHIFT_FILTER_CODES}
          selected={filters.amsShifts}
          onChange={(next) => update({ amsShifts: next })}
          width="w-40"
        />
        <MultiSelect
          label="Attendance"
          options={STATUS_FILTER_VALUES}
          selected={filters.statuses}
          onChange={(next) => update({ statuses: next })}
          width="w-44"
        />
        <MultiSelect
          label="Exception"
          options={[...EXCEPTION_TYPES, "No Exception"]}
          selected={filters.exceptionTypes}
          onChange={(next) => update({ exceptionTypes: next })}
          width="w-52"
        />
        <MultiSelect
          label="Status"
          options={[...COMPLIANCE_STATUSES]}
          selected={filters.complianceStatuses}
          onChange={(next) => update({ complianceStatuses: next })}
          width="w-48"
        />
      </div>
    </Card>
  );
}
