"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { downloadInventoryDemo, getInventory, getInventoryMovements, getStockImportHistory, importRestockCsv } from "@/services/apiClient";
import type { InventoryMovement, InventoryRow, StockImportHistory } from "@/types/ecommerce";
import { Download, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

export function InventoryManagerClient() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [history, setHistory] = useState<StockImportHistory[]>([]);
  const [tab, setTab] = useState<"all" | "low_stock" | "out_of_stock" | "movements">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadInventory(nextTab = tab) {
    setLoading(true);
    setError("");
    try {
      const status = nextTab === "low_stock" || nextTab === "out_of_stock" ? nextTab : undefined;
      const [inventoryData, movementData, historyData] = await Promise.all([getInventory(status), getInventoryMovements(), getStockImportHistory()]);
      setRows(inventoryData);
      setMovements(movementData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inventory could not load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    Promise.all([getInventory(), getInventoryMovements(), getStockImportHistory()])
      .then(([inventoryData, movementData, historyData]) => {
        if (ignore) return;
        setRows(inventoryData);
        setMovements(movementData);
        setHistory(historyData);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Inventory could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const value = search.toLowerCase();
    return rows.filter((row) => row.productName.toLowerCase().includes(value) || row.sku.toLowerCase().includes(value));
  }, [rows, search]);

  async function switchTab(nextTab: typeof tab) {
    setTab(nextTab);
    if (nextTab !== "movements") await loadInventory(nextTab);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    try {
      const data = await importRestockCsv(file, tab === "out_of_stock" ? "out_of_stock" : "low_stock");
      setSuccess(`Import complete: ${data.history.successfulRows} successful, ${data.history.failedRows} failed`);
      await loadInventory(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      event.target.value = "";
    }
  }

  async function handleDemoDownload() {
    setError("");
    try {
      const type = tab === "out_of_stock" ? "out_of_stock" : "low_stock";
      const blob = await downloadInventoryDemo(type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type.replace("_", "-")}-restock-demo.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo download failed");
    }
  }

  if (loading) return <LoadingState label="Loading inventory..." />;

  return (
    <div className="space-y-5">
      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All inventory"],
            ["low_stock", "Low stock"],
            ["out_of_stock", "Out of stock"],
            ["movements", "Movement log"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => switchTab(key as typeof tab)} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === key ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDemoDownload} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <Download size={16} />
            Demo CSV
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>
      {tab !== "movements" ? (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm" placeholder="Search product or SKU" />
          </div>
          <DataTable
            rows={filteredRows}
            getRowKey={(row) => `${row.productId}-${row.sku}`}
            columns={[
              { key: "product", header: "Product", render: (row) => <span className="font-medium text-slate-950">{row.productName}</span> },
              { key: "sku", header: "SKU", render: (row) => <span className="text-slate-600">{row.sku}</span> },
              { key: "variant", header: "Variant", render: (row) => <span className="text-slate-600">{row.variantInfo || "-"}</span> },
              { key: "stock", header: "Stock", render: (row) => <span>{row.stock}</span> },
              { key: "reserved", header: "Reserved", render: (row) => <span>{row.reservedStock}</span> },
              { key: "available", header: "Available", render: (row) => <span>{row.availableStock}</span> },
              { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status.replace(/_/g, " ")}</span> },
            ]}
          />
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white">
          <DataTable
            rows={movements}
            getRowKey={(row) => row._id}
            columns={[
              { key: "product", header: "Product", render: (row) => <span className="font-medium text-slate-950">{row.product?.name || "Product"}</span> },
              { key: "type", header: "Type", render: (row) => <span className="text-slate-600">{row.type}</span> },
              { key: "quantity", header: "Qty", render: (row) => <span>{row.quantity}</span> },
              { key: "stock", header: "Stock", render: (row) => <span>{`${row.previousStock} -> ${row.newStock}`}</span> },
              { key: "actor", header: "Actor", render: (row) => <span>{row.createdBy?.name || "-"}</span> },
            ]}
          />
        </section>
      )}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">Import history</h2>
        </div>
        <DataTable
          rows={history}
          getRowKey={(row) => row._id}
          emptyText="No import history yet"
          columns={[
            { key: "file", header: "File", render: (row) => <span className="font-medium text-slate-950">{row.fileName}</span> },
            { key: "type", header: "Type", render: (row) => <span>{row.importType}</span> },
            { key: "success", header: "Success", render: (row) => <span>{row.successfulRows}</span> },
            { key: "failed", header: "Failed", render: (row) => <span>{row.failedRows}</span> },
          ]}
        />
      </section>
    </div>
  );
}
