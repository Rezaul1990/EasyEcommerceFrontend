"use client";

import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { getReport } from "@/services/apiClient";
import type { ReportSummary } from "@/types/ecommerce";
import { useEffect, useState } from "react";

const reportTypes = ["sales", "orders", "payments", "products", "inventory", "coupons", "refunds", "couriers"];

export function ReportsClient() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all(reportTypes.map((type) => getReport(type)))
      .then((data) => {
        if (!ignore) setReports(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Reports could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading reports..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {reports.map((report) => (
        <section key={report.type} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold capitalize text-slate-950">{report.type}</h2>
          <div className="mt-4 space-y-2 text-sm">
            {Object.entries(report.totals).slice(0, 5).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <span className="capitalize text-slate-600">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-semibold text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
