import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadPanel } from "@/components/rv/UploadPanel";
import { FilterBar } from "@/components/rv/FilterBar";
import { KpiCards } from "@/components/rv/KpiCards";
import { EmployeeTable } from "@/components/rv/EmployeeTable";
import { DailyTable } from "@/components/rv/DailyTable";
import { ExceptionsPanel } from "@/components/rv/ExceptionsPanel";
import { DataQualityPanel } from "@/components/rv/DataQualityPanel";
import { RvProvider, useRv } from "@/state/rv-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roster Validator — Attendance vs Roster Compliance" },
      {
        name: "description",
        content:
          "Upload AMS attendance and roster files to reconcile shifts daily, weekly and monthly with exception-level compliance reporting.",
      },
      { property: "og:title", content: "Roster Validator — Attendance vs Roster Compliance" },
      {
        property: "og:description",
        content:
          "Daily reconciliation of AMS attendance against the planned roster: exceptions, compliance %, filters and Excel exports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RvProvider>
      <ValidatorApp />
      <Toaster />
    </RvProvider>
  ),
});

function ValidatorApp() {
  const { dataset, label } = useRv();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[1800px] items-center gap-3 px-6 py-4">
          <ShieldCheck className="size-6 text-sidebar-primary" />
          <div>
            <h1 className="text-lg font-semibold">Attendance vs Roster Compliance</h1>
            <p className="text-xs opacity-80">
              Roster validator · daily reconciliation drives every metric
            </p>
          </div>
          {dataset && (
            <span className="num ml-auto text-xs opacity-80">
              {label} · {dataset.daily.length.toLocaleString()} reconciled records
            </span>
          )}
        </div>
      </header>

      {dataset && <FilterBar />}

      <div className="mx-auto max-w-[1800px] space-y-4 px-6 py-5">
        {!dataset ? (
          <>
            <UploadPanel />
            <p className="text-sm text-muted-foreground">
              Attendance columns expected: Date, Employee - Name, Reporting Manager, Employee OLM,
              Domain, Vertical, Attendance Status, Shift Type, Company, CheckIn/CheckOut Time, Total
              Hours, Meeting Time, TrainingTime, Remark, Premises. Roster: Function, OLMID, Employee
              Name and one column per date. Shift codes A / G / LG / B / N / WO (plus L, H, OFF).
            </p>
          </>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="employees">Employee Analysis</TabsTrigger>
              <TabsTrigger value="daily">Daily Reconciliation</TabsTrigger>
              <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
              <TabsTrigger value="data">Data & Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <KpiCards />
              <ExceptionsPanel />
            </TabsContent>
            <TabsContent value="employees" className="space-y-4">
              <KpiCards />
              <EmployeeTable />
            </TabsContent>
            <TabsContent value="daily">
              <DailyTable />
            </TabsContent>
            <TabsContent value="exceptions" className="space-y-4">
              <ExceptionsPanel />
              <EmployeeTable />
            </TabsContent>
            <TabsContent value="data" className="space-y-4">
              <DataQualityPanel />
              <UploadPanel compact />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
