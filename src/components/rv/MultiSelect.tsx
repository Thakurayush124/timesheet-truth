import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  width = "w-56",
}: {
  label: string;
  options: (Option | string)[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalized: Option[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const visible = query
    ? normalized.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : normalized;

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("justify-between gap-2 font-normal", width)}
        >
          <span className="truncate">
            <span className="text-muted-foreground">{label}:</span>{" "}
            {selected.length === 0
              ? "All"
              : selected.length === 1
                ? (normalized.find((o) => o.value === selected[0])?.label ?? selected[0])
                : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {searchable && (
          <div className="relative border-b p-2">
            <Search className="absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-8 pl-7"
            />
          </div>
        )}
        <ScrollArea className="max-h-72">
          <div className="p-1">
            {visible.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No matches</p>
            )}
            {visible.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/15"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              Clear {label}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
