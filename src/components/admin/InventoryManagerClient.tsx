"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { Drawer } from "@/components/admin/ui/Drawer";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { adjustInventoryStock, downloadInventoryDemo, getAdminCategories, getInventory, getInventoryMovements, getStockImportHistory, importRestockCsv } from "@/services/apiClient";
import type { Category, InventoryMeta, InventoryMovement, InventoryRow, MovementMeta, StockImportHistory } from "@/types/ecommerce";
import { Activity, AlertTriangle, Archive, ChevronLeft, ChevronRight, Download, Edit3, Layers3, PackageCheck, RefreshCcw, Search, Upload, Warehouse } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

const defaultInventoryMeta: InventoryMeta = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 1,
  summary: { totalItems: 0, totalStock: 0, reservedStock: 0, availableStock: 0, lowStock: 0, outOfStock: 0, reservedItems: 0 },
};

const defaultMovementMeta: MovementMeta = { page: 1, limit: 50, total: 0, pages: 1 };
const stockStatuses = [["all", "All stock"], ["in_stock", "In stock"], ["low_stock", "Low stock"], ["out_of_stock", "Out of stock"], ["reserved", "Reserved"]];
const sortOptions = [["updated_desc", "Recently updated"], ["name_asc", "Product A-Z"], ["name_desc", "Product Z-A"], ["stock_asc", "Lowest stock"], ["stock_desc", "Highest stock"], ["available_asc", "Lowest available"], ["available_desc", "Highest available"], ["reserved_desc", "Most reserved"]];
const movementTypes = ["reserve", "release_reserve", "confirm_reduce", "cancel_return", "manual_restock", "import_restock", "adjustment"];

function label(value?: string) {
  if (!value) return "None";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function badgeClass(status: string) {
  if (status === "out_of_stock") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "low_stock") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function InventoryManagerClient() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [meta, setMeta] = useState<InventoryMeta>(defaultInventoryMeta);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementMeta, setMovementMeta] = useState<MovementMeta>(defaultMovementMeta);
  const [history, setHistory] = useState<StockImportHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [tab, setTab] = useState<"inventory" | "movements">("inventory");
  const [filters, setFilters] = useState({ search: "", stockStatus: "all", productType: "all", categoryId: "", sortBy: "updated_desc", page: "1", limit: "20" });
  const [movementFilters, setMovementFilters] = useState({ type: "", productId: "", page: "1", limit: "50" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedMovements = useMemo(() => movements.filter((movement) => movement.product?._id === selected?.productId), [movements, selected]);

  async function loadInventory(nextFilters = filters) {
    setError("");
    const result = await getInventory(nextFilters);
    setRows(result.data);
    setMeta({ ...defaultInventoryMeta, ...result.meta, summary: { ...defaultInventoryMeta.summary, ...(result.meta?.summary || {}) } });
  }

  async function loadMovements(nextFilters = movementFilters) {
    const result = await getInventoryMovements(nextFilters);
    setMovements(result.data);
    setMovementMeta({ ...defaultMovementMeta, ...result.meta });
  }

  async function loadPage() {
    setLoading(true);
    setError("");
    try {
      const [inventoryResult, movementResult, historyData, categoryData] = await Promise.all([getInventory(filters), getInventoryMovements(movementFilters), getStockImportHistory(), getAdminCategories()]);
      setRows(inventoryResult.data);
      setMeta({ ...defaultInventoryMeta, ...inventoryResult.meta, summary: { ...defaultInventoryMeta.summary, ...(inventoryResult.meta?.summary || {}) } });
      setMovements(movementResult.data);
      setMovementMeta({ ...defaultMovementMeta, ...movementResult.meta });
      setHistory(historyData);
      setCategories(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inventory could not load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    Promise.all([getInventory(filters), getInventoryMovements(movementFilters), getStockImportHistory(), getAdminCategories()])
      .then(([inventoryResult, movementResult, historyData, categoryData]) => {
        if (ignore) return;
        setRows(inventoryResult.data);
        setMeta({ ...defaultInventoryMeta, ...inventoryResult.meta, summary: { ...defaultInventoryMeta.summary, ...(inventoryResult.meta?.summary || {}) } });
        setMovements(movementResult.data);
        setMovementMeta({ ...defaultMovementMeta, ...movementResult.meta });
        setHistory(historyData);
        setCategories(categoryData);
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
    // Initial load only. Subsequent filter changes are handled by explicit filter actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateFilters(next: Partial<typeof filters>) {
    const nextFilters = { ...filters, ...next, page: next.page || "1" };
    setFilters(nextFilters);
    setLoading(true);
    try {
      await loadInventory(nextFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inventory could not load");
    } finally {
      setLoading(false);
    }
  }

  async function updateMovementFilters(next: Partial<typeof movementFilters>) {
    const nextFilters = { ...movementFilters, ...next, page: next.page || "1" };
    setMovementFilters(nextFilters);
    setLoading(true);
    try {
      await loadMovements(nextFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Movement log could not load");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    try {
      const data = await importRestockCsv(file, filters.stockStatus === "out_of_stock" ? "out_of_stock" : "low_stock");
      setSuccess(`Import complete: ${data.history.successfulRows} successful, ${data.history.failedRows} failed`);
      await Promise.all([loadInventory(filters), loadMovements(movementFilters), getStockImportHistory().then(setHistory)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      event.target.value = "";
    }
  }

  async function handleDemoDownload() {
    setError("");
    try {
      const type = filters.stockStatus === "out_of_stock" ? "out_of_stock" : "low_stock";
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

  async function handleAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await adjustInventoryStock({
        productId: selected.productId,
        variantId: selected.variantId || "",
        adjustmentType: String(form.get("adjustmentType") || "set") as "set" | "increase" | "decrease",
        quantity: Number(form.get("quantity") || 0),
        lowStockThreshold: Number(form.get("lowStockThreshold") || selected.lowStockThreshold),
        note: String(form.get("note") || ""),
      });
      setSelected(result.row);
      setSuccess("Stock adjusted");
      await Promise.all([loadInventory(filters), loadMovements(movementFilters)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !rows.length) return <LoadingState label="Loading inventory..." />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Stock control</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Filter products, inspect reserved stock, adjust quantities, import restocks, and review stock movement history.</p>
        </div>
        <button onClick={loadPage} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCcw size={16} /> Refresh
        </button>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Stat title="Items" value={meta.summary.totalItems} icon={Warehouse} />
        <Stat title="Total stock" value={meta.summary.totalStock} icon={Archive} />
        <Stat title="Available" value={meta.summary.availableStock} icon={PackageCheck} />
        <Stat title="Reserved" value={meta.summary.reservedStock} icon={Layers3} />
        <Stat title="Low stock" value={meta.summary.lowStock} icon={AlertTriangle} tone="amber" />
        <Stat title="Out of stock" value={meta.summary.outOfStock} icon={AlertTriangle} tone="rose" />
        <Stat title="Reserved SKUs" value={meta.summary.reservedItems} icon={Activity} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab("inventory")} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "inventory" ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-700"}`}>Inventory list</button>
          <button onClick={() => setTab("movements")} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === "movements" ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-700"}`}>Movement log</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDemoDownload} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <Download size={16} /> Demo CSV
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white">
            <Upload size={16} /> Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {tab === "inventory" ? (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" placeholder="Search product, SKU, variant" />
            </div>
            <select value={filters.stockStatus} onChange={(event) => updateFilters({ stockStatus: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              {stockStatuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
            <select value={filters.categoryId} onChange={(event) => updateFilters({ categoryId: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select value={filters.productType} onChange={(event) => updateFilters({ productType: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="all">All product types</option>
              <option value="simple">Simple</option>
              <option value="variant">Variant</option>
            </select>
            <select value={filters.sortBy} onChange={(event) => updateFilters({ sortBy: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              {sortOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </div>
          <DataTable
            rows={rows}
            getRowKey={(row) => `${row.productId}-${row.variantId || row.sku}`}
            emptyText="No inventory items match the active filters"
            columns={[
              { key: "product", header: "Product", render: (row) => <div><button onClick={() => setSelected(row)} className="font-semibold text-teal-700">{row.productName}</button><p className="mt-1 text-xs text-slate-500">{row.category?.name || "No category"} / {label(row.productType)}</p></div> },
              { key: "sku", header: "SKU", render: (row) => <span className="font-medium text-slate-700">{row.sku}</span> },
              { key: "variant", header: "Variant", render: (row) => <span className="text-slate-600">{row.variantInfo || "-"}</span> },
              { key: "stock", header: "Stock", render: (row) => <span className="font-semibold text-slate-950">{row.stock}</span> },
              { key: "reserved", header: "Reserved", render: (row) => <span>{row.reservedStock}</span> },
              { key: "available", header: "Available", render: (row) => <span>{row.availableStock}</span> },
              { key: "threshold", header: "Threshold", render: (row) => <span>{row.lowStockThreshold}</span> },
              { key: "status", header: "Status", render: (row) => <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${badgeClass(row.status)}`}>{label(row.status)}</span> },
              { key: "updated", header: "Updated", render: (row) => <span className="text-xs text-slate-500">{formatDate(row.updatedAt)}</span> },
              { key: "actions", header: "Action", render: (row) => <button onClick={() => setSelected(row)} className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700" aria-label={`Adjust ${row.productName}`}><Edit3 size={16} /></button> },
            ]}
          />
          <Pagination page={meta.page} pages={meta.pages} total={meta.total} limit={filters.limit} onLimit={(limit) => updateFilters({ limit })} onPage={(page) => updateFilters({ page: String(page) })} />
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-3">
            <select value={movementFilters.type} onChange={(event) => updateMovementFilters({ type: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="">All movement types</option>
              {movementTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}
            </select>
            <button onClick={() => updateMovementFilters({ type: "", productId: "", page: "1" })} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 md:w-fit">Clear movement filters</button>
          </div>
          <DataTable
            rows={movements}
            getRowKey={(row) => row._id}
            emptyText="No inventory movements yet"
            columns={[
              { key: "product", header: "Product", render: (row) => <span className="font-medium text-slate-950">{row.product?.name || "Product"}</span> },
              { key: "type", header: "Type", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{label(row.type)}</span> },
              { key: "quantity", header: "Qty", render: (row) => <span>{row.quantity}</span> },
              { key: "stock", header: "Stock", render: (row) => <span>{`${row.previousStock} -> ${row.newStock}`}</span> },
              { key: "reserved", header: "Reserved", render: (row) => <span>{`${row.previousReservedStock} -> ${row.newReservedStock}`}</span> },
              { key: "note", header: "Note", render: (row) => <span className="text-slate-600">{row.note || "-"}</span> },
              { key: "actor", header: "Actor", render: (row) => <span>{row.createdBy?.name || "-"}</span> },
              { key: "date", header: "Date", render: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span> },
            ]}
          />
          <Pagination page={movementMeta.page} pages={movementMeta.pages} total={movementMeta.total} limit={movementFilters.limit} onLimit={(limit) => updateMovementFilters({ limit })} onPage={(page) => updateMovementFilters({ page: String(page) })} />
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
            { key: "type", header: "Type", render: (row) => <span>{label(row.importType)}</span> },
            { key: "success", header: "Success", render: (row) => <span>{row.successfulRows}</span> },
            { key: "failed", header: "Failed", render: (row) => <span>{row.failedRows}</span> },
          ]}
        />
      </section>

      <Drawer open={Boolean(selected)} title={selected?.productName || "Inventory item"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2">
              <Info label="SKU" value={selected.sku} />
              <Info label="Variant" value={selected.variantInfo || "Default"} />
              <Info label="Current stock" value={String(selected.stock)} />
              <Info label="Reserved" value={String(selected.reservedStock)} />
              <Info label="Available" value={String(selected.availableStock)} />
              <Info label="Low stock threshold" value={String(selected.lowStockThreshold)} />
            </section>
            <form onSubmit={handleAdjust} className="space-y-3 rounded-md border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-950">Adjust stock</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700"><span>Adjustment</span><select name="adjustmentType" className="h-10 w-full rounded-md border border-slate-300 px-3"><option value="set">Set stock to</option><option value="increase">Increase by</option><option value="decrease">Decrease by</option></select></label>
                <label className="space-y-2 text-sm font-medium text-slate-700"><span>Quantity</span><input name="quantity" type="number" min="0" defaultValue={selected.stock} className="h-10 w-full rounded-md border border-slate-300 px-3" required /></label>
                <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Low stock threshold</span><input name="lowStockThreshold" type="number" min="0" defaultValue={selected.lowStockThreshold} className="h-10 w-full rounded-md border border-slate-300 px-3" /></label>
              </div>
              <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Internal note</span><textarea name="note" className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Reason for this stock adjustment" /></label>
              <button disabled={saving} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save adjustment</button>
            </form>
            <section className="space-y-3">
              <h3 className="font-semibold text-slate-950">Recent movement for this product</h3>
              {selectedMovements.length ? selectedMovements.slice(0, 8).map((movement) => <div key={movement._id} className="border-b border-slate-100 pb-3 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold text-slate-950">{label(movement.type)}</span><span className="text-xs text-slate-500">{formatDate(movement.createdAt)}</span></div><p className="mt-1 text-slate-600">Stock {movement.previousStock} to {movement.newStock}, qty {movement.quantity}</p>{movement.note ? <p className="mt-1 text-xs text-slate-500">{movement.note}</p> : null}</div>) : <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No recent movement loaded for this product.</p>}
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Stat({ title, value, icon: Icon, tone = "slate" }: { title: string; value: number; icon: typeof Warehouse; tone?: "slate" | "amber" | "rose" }) {
  const tones = { slate: "text-slate-400", amber: "text-amber-500", rose: "text-rose-500" };
  return <section className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-slate-500">{title}</p><Icon className={tones[tone]} size={16} /></div><p className="mt-2 text-xl font-semibold text-slate-950">{value}</p></section>;
}

function Info({ label: title, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 p-3 text-sm"><p className="font-semibold text-slate-500">{title}</p><p className="mt-1 font-semibold text-slate-950">{value}</p></div>;
}

function Pagination({ page, pages, total, limit, onLimit, onPage }: { page: number; pages: number; total: number; limit: string; onLimit: (limit: string) => void; onPage: (page: number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>{total} records. Page {page} of {pages}</p>
      <div className="flex items-center gap-2">
        <select value={limit} onChange={(event) => onLimit(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
          {["10", "20", "50", "100"].map((value) => <option key={value} value={value}>{value} rows</option>)}
        </select>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold disabled:opacity-40">Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
