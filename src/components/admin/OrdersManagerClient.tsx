"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { Drawer } from "@/components/admin/ui/Drawer";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { getAdminCouriers, getAdminOrder, getAdminOrders, getPaymentMethods, updateAdminOrderCourier, updateAdminOrderNote, updateAdminOrderPayment, updateAdminOrderStatus } from "@/services/apiClient";
import type { CourierCompany, Order, OrdersMeta, PaymentMethodSetting } from "@/types/ecommerce";
import { Banknote, ChevronLeft, ChevronRight, ClipboardList, Copy, CreditCard, Edit3, FileText, PackageCheck, Printer, RefreshCcw, Search, Truck, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const defaultMeta: OrdersMeta = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 1,
  summary: { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalDue: 0 },
};

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT" });
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const dateOptions = [
  ["today", "Today"],
  ["tomorrow", "Tomorrow"],
  ["yesterday", "Yesterday"],
  ["this-week", "This week"],
  ["last-week", "Last week"],
  ["this-month", "This month"],
  ["last-month", "Last month"],
  ["last-7-days", "Last 7 days"],
  ["last-30-days", "Last 30 days"],
  ["custom", "Custom range"],
  ["all-time", "All time"],
];

const orderStatuses = ["pending", "confirmed", "processing", "packed", "courier_assigned", "shipped", "delivered", "cancelled", "returned", "refunded"];
const paymentStatuses = ["unpaid", "partial_paid", "paid", "pending_payment", "failed", "refunded", "partial_refunded"];
const fallbackPaymentMethods = ["cash", "cod", "cash_on_delivery", "bkash", "nagad", "card", "bank_transfer", "manual_payment"];
const sources = ["website", "admin", "staff", "pos", "phone_order", "manual_order"];
const paymentStates = [["fully_paid", "Fully paid"], ["has_due", "Has due"], ["no_payment", "No payment"], ["refunded", "Refunded"], ["high_value", "High-value orders"]];
const sorts = [["newest", "Newest first"], ["oldest", "Oldest first"], ["highest_total", "Highest total"], ["lowest_total", "Lowest total"], ["highest_due", "Highest due"], ["recently_updated", "Recently updated"]];
const tabs = ["overview", "status", "payment", "courier", "notes", "activity"] as const;
const summaryCards: Array<{ title: string; key: keyof OrdersMeta["summary"]; icon: LucideIcon; format?: "money" }> = [
  { title: "Today's orders", key: "total", icon: ClipboardList },
  { title: "Pending", key: "pending", icon: FileText },
  { title: "Confirmed", key: "confirmed", icon: PackageCheck },
  { title: "Processing", key: "processing", icon: RefreshCcw },
  { title: "Shipped", key: "shipped", icon: Truck },
  { title: "Delivered", key: "delivered", icon: PackageCheck },
  { title: "Cancelled", key: "cancelled", icon: XCircle },
  { title: "Total due", key: "totalDue", icon: Banknote, format: "money" },
];

const nextStatuses: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "packed", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["courier_assigned", "shipped", "cancelled"],
  courier_assigned: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: ["refunded"],
  refunded: [],
  cancelled: [],
};

type Tab = (typeof tabs)[number];

function label(value?: string) {
  if (!value) return "None";
  if (value === "cod") return "Cash on Delivery";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value?: number) {
  return moneyFormatter.format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return dateFormatter.format(new Date(value));
}

function getStaffName(value: unknown) {
  if (!value || typeof value !== "object") return "System";
  const record = value as { name?: string; email?: string };
  return record.name || record.email || "Staff";
}

function paymentRows(order: Order) {
  return (order.paymentTransactions || order.paymentHistory || []).map((item) => {
    const row = item as {
      type?: string;
      amount?: number;
      paidAmount?: number;
      reference?: string;
      transactionId?: string;
      note?: string;
      reason?: string;
      updatedBy?: unknown;
      processedBy?: unknown;
      updatedAt?: string;
      processedAt?: string;
    };
    return {
      action: `${label(row.type || "payment")} ${money(row.amount ?? row.paidAmount ?? 0)}`,
      note: row.reference || row.transactionId || row.note || row.reason,
      staff: getStaffName(row.updatedBy || row.processedBy),
      date: row.updatedAt || row.processedAt || "",
    };
  });
}

function Badge({ value, tone = "slate" }: { value: string; tone?: "slate" | "teal" | "emerald" | "amber" | "rose" | "sky" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{label(value)}</span>;
}

function statusTone(status: string) {
  if (["delivered", "paid"].includes(status)) return "emerald";
  if (["cancelled", "returned", "refunded", "failed"].includes(status)) return "rose";
  if (["shipped", "courier_assigned"].includes(status)) return "sky";
  if (["pending", "partial_paid", "pending_payment"].includes(status)) return "amber";
  return "teal";
}

export function OrdersManagerClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrdersMeta>(defaultMeta);
  const [couriers, setCouriers] = useState<CourierCompany[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(fallbackPaymentMethods);
  const [selected, setSelected] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(() => {
    const data: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (value) data[key] = value;
    });
    if (!data.date) data.date = "today";
    if (!data.page) data.page = "1";
    if (!data.limit) data.limit = "20";
    if (!data.sortBy) data.sortBy = "newest";
    return data;
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get("date")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", "today");
      params.set("page", params.get("page") || "1");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminOrders(filters), getAdminCouriers(), getPaymentMethods().catch(() => [] as PaymentMethodSetting[])])
      .then(([orderResult, courierData, methods]) => {
        if (ignore) return;
        setOrders(orderResult.data);
        setMeta({ ...defaultMeta, ...orderResult.meta, summary: { ...defaultMeta.summary, ...(orderResult.meta?.summary || {}) } });
        setCouriers(courierData);
        const enabled = methods.filter((method) => method.status === "active").map((method) => method.key);
        if (enabled.length) setPaymentMethods(Array.from(new Set([...enabled, ...fallbackPaymentMethods])));
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Orders could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [filters]);

  function updateFilters(next: Record<string, string | null>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (resetPage) params.set("page", "1");
    if (!params.get("date")) params.set("date", "today");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function openOrder(order: Order) {
    setSelected(order);
    setActiveTab("overview");
    setDrawerLoading(true);
    try {
      setSelected(await getAdminOrder(order._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order details could not load");
    } finally {
      setDrawerLoading(false);
    }
  }

  function replaceOrder(order: Order) {
    setOrders((current) => current.map((item) => (item._id === order._id ? order : item)));
    setSelected(order);
  }

  async function saveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      replaceOrder(await updateAdminOrderStatus(selected._id, String(form.get("status")), String(form.get("note") || "")));
      setSuccess("Order status saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order status could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function savePayment(event: FormEvent<HTMLFormElement>, type: "payment" | "refund") {
    event.preventDefault();
    if (!selected) return;
    if (type === "refund" && !window.confirm("Issue this refund?")) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      replaceOrder(await updateAdminOrderPayment(selected._id, {
        type,
        method: String(form.get("method") || selected.paymentMethod || "manual_payment"),
        amount: Number(form.get("amount") || 0),
        reference: String(form.get("reference") || ""),
        transactionId: String(form.get("transactionId") || ""),
        senderPhone: String(form.get("senderPhone") || ""),
        reason: String(form.get("reason") || ""),
        note: String(form.get("note") || ""),
        processedAt: String(form.get("processedAt") || ""),
      }));
      event.currentTarget.reset();
      setSuccess(type === "refund" ? "Refund saved" : "Payment saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function saveCourier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      replaceOrder(await updateAdminOrderCourier(selected._id, {
        courier: String(form.get("courier") || ""),
        courierCharge: Number(form.get("courierCharge") || 0),
        trackingNumber: String(form.get("trackingNumber") || ""),
        dispatchDate: String(form.get("dispatchDate") || ""),
        estimatedDeliveryDate: String(form.get("estimatedDeliveryDate") || ""),
        fulfilmentNote: String(form.get("fulfilmentNote") || ""),
      }));
      setSuccess("Courier saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Courier could not be saved");
    } finally {
      setSaving(false);
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      replaceOrder(await updateAdminOrderNote(selected._id, String(form.get("internalNote") || "")));
      event.currentTarget.reset();
      setSuccess("Internal note saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note could not be saved");
    } finally {
      setSaving(false);
    }
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => !["date", "page", "limit", "sortBy"].includes(key) && Boolean(value)).length;
  const selectedNextStatuses = selected ? nextStatuses[selected.status] || [] : [];
  const refundableAmount = Math.max((selected?.paidAmount || 0) - (selected?.refundAmount || 0), 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage, process, collect payment, dispatch, refund and track customer orders.</p>
        </div>
        <button onClick={() => updateFilters({ date: "today", search: null, status: null, paymentStatus: null, paymentMethod: null, courier: null, source: null, paymentState: null, sortBy: "newest", startDate: null, endDate: null })} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCcw size={16} /> Clear filters
        </button>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {summaryCards.map(({ title, key, icon: Icon, format }) => (
          <section key={title} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
              <Icon className="text-slate-400" size={16} />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-950">{format === "money" ? money(meta.summary[key]) : meta.summary[key]}</p>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-6">
          <select value={filters.date} onChange={(event) => updateFilters({ date: event.target.value, startDate: null, endDate: null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            {dateOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input id="orders-search" defaultValue={filters.search || ""} onChange={(event) => updateFilters({ search: event.target.value || null })} className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" placeholder="Search order, customer, product, tracking, reference" />
          </div>
          <select value={filters.status || ""} onChange={(event) => updateFilters({ status: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All statuses</option>
            {orderStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <select value={filters.paymentStatus || ""} onChange={(event) => updateFilters({ paymentStatus: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All payment statuses</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <select value={filters.paymentMethod || ""} onChange={(event) => updateFilters({ paymentMethod: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All methods</option>
            {paymentMethods.map((method) => <option key={method} value={method}>{label(method)}</option>)}
          </select>
          <select value={filters.courier || ""} onChange={(event) => updateFilters({ courier: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All couriers</option>
            <option value="unassigned">Unassigned</option>
            {couriers.filter((courier) => courier.status === "active").map((courier) => <option key={courier._id} value={courier._id}>{courier.name}</option>)}
          </select>
          <select value={filters.source || ""} onChange={(event) => updateFilters({ source: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{label(source)}</option>)}
          </select>
          <select value={filters.paymentState || ""} onChange={(event) => updateFilters({ paymentState: event.target.value || null })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="">All amounts</option>
            {paymentStates.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
          <select value={filters.sortBy || "newest"} onChange={(event) => updateFilters({ sortBy: event.target.value })} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            {sorts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </div>
        {filters.date === "custom" ? (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row">
            <input type="date" value={filters.startDate || ""} onChange={(event) => updateFilters({ startDate: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="date" value={filters.endDate || ""} onChange={(event) => updateFilters({ endDate: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <button onClick={() => updateFilters({ date: "today", startDate: null, endDate: null })} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">Clear range</button>
          </div>
        ) : null}
        {activeFilterCount ? <p className="mt-3 text-xs font-medium text-slate-500">{activeFilterCount} advanced filter{activeFilterCount > 1 ? "s" : ""} active</p> : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        {loading || isPending ? <LoadingState label="Loading orders..." /> : (
          <DataTable
            rows={orders}
            getRowKey={(row) => row._id}
            emptyText="No orders match the active filters"
            columns={[
              { key: "order", header: "Order", render: (row) => <div><button onClick={() => openOrder(row)} className="font-semibold text-teal-700">{row.orderNumber}</button><p className="mt-1 text-xs text-slate-500">{formatDate(row.createdAt)}</p><p className="text-xs text-slate-500">{label(row.source || "website")}</p></div> },
              { key: "customer", header: "Customer", render: (row) => <div><p className="font-medium text-slate-900">{row.customer.name}</p><p className="text-xs text-slate-500">{row.customer.phone}</p><p className="text-xs text-slate-500">{row.customer.area || row.customer.city || "No area"}</p></div> },
              { key: "items", header: "Items", render: (row) => <div><p className="font-medium text-slate-900">{row.items[0]?.name || "No items"}</p><p className="text-xs text-slate-500">{row.items.length} product{row.items.length === 1 ? "" : "s"} / {row.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</p>{row.items.length > 1 ? <p className="text-xs text-slate-500">+{row.items.length - 1} more</p> : null}</div> },
              { key: "total", header: "Total", align: "right", render: (row) => <div><p className="font-semibold text-slate-950">{money(row.grandTotal)}</p><p className="text-xs text-slate-500">Ship {money(row.shippingFee)}</p>{row.discountTotal ? <p className="text-xs text-slate-500">Discount {money(row.discountTotal)}</p> : null}</div> },
              { key: "payment", header: "Payment", render: (row) => <div className="space-y-1"><Badge value={row.paymentStatus} tone={statusTone(row.paymentStatus)} /><p className="text-xs text-slate-500">{label(row.paymentMethod)}</p><p className="text-xs text-slate-500">Paid {money(row.paidAmount)} / Due {money(row.dueAmount)}</p></div> },
              { key: "status", header: "Order Status", render: (row) => <div className="space-y-1"><Badge value={row.status} tone={statusTone(row.status)} /><p className="text-xs text-slate-500">{formatDate(row.updatedAt || row.createdAt)}</p></div> },
              { key: "courier", header: "Courier", render: (row) => <div><p className="font-medium text-slate-900">{row.courier?.name || "Unassigned"}</p><p className="text-xs text-slate-500">{row.trackingNumber || "No tracking"}</p></div> },
              { key: "staff", header: "Staff", render: (row) => <div><p className="font-medium text-slate-900">{getStaffName(row.updatedBy)}</p><p className="text-xs text-slate-500">{formatDate(row.updatedAt || row.createdAt)}</p></div> },
              { key: "actions", header: "Actions", render: (row) => <button onClick={() => openOrder(row)} className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label={`Edit ${row.orderNumber}`}><Edit3 size={16} /></button> },
            ]}
          />
        )}
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {orders.length} of {meta.total} orders. Page {meta.page} of {meta.pages}</p>
          <div className="flex items-center gap-2">
            <select value={filters.limit || "20"} onChange={(event) => updateFilters({ limit: event.target.value })} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
              {["10", "20", "50"].map((limit) => <option key={limit} value={limit}>{limit} rows</option>)}
            </select>
            <button disabled={meta.page <= 1} onClick={() => updateFilters({ page: String(meta.page - 1) }, false)} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
            <button disabled={meta.page >= meta.pages} onClick={() => updateFilters({ page: String(meta.page + 1) }, false)} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 font-semibold disabled:opacity-40">Next <ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      <Drawer open={Boolean(selected)} title={selected?.orderNumber || "Order"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">{formatDate(selected.createdAt)}</p>
                  <h2 className="text-xl font-semibold text-slate-950">{selected.orderNumber}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigator.clipboard?.writeText(selected.orderNumber)} className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700" aria-label="Copy order number"><Copy size={16} /></button>
                  <button onClick={() => window.print()} className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700" aria-label="Print invoice"><Printer size={16} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2"><Badge value={selected.status} tone={statusTone(selected.status)} /><Badge value={selected.paymentStatus} tone={statusTone(selected.paymentStatus)} /></div>
              <nav className="flex gap-2 overflow-x-auto border-b border-slate-200">
                {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-2 py-2 text-sm font-semibold ${activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"}`}>{label(tab)}</button>)}
              </nav>
            </header>
            {drawerLoading ? <LoadingState label="Loading order details..." /> : null}
            {activeTab === "overview" ? <OverviewTab order={selected} /> : null}
            {activeTab === "status" ? (
              <form onSubmit={saveStatus} className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Next status</span><select name="status" required className="h-10 w-full rounded-md border border-slate-300 px-3"><option value="">Choose next status</option>{selectedNextStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
                <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Reason or note</span><textarea name="note" className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Required for cancellation, return and refund" /></label>
                <button disabled={saving || !selectedNextStatuses.length} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save status</button>
                <HistoryList rows={selected.statusHistory?.map((item) => ({ action: label(item.status), note: item.note, staff: getStaffName(item.updatedBy), date: item.updatedAt })) || []} />
              </form>
            ) : null}
            {activeTab === "payment" ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryItem label="Grand total" value={money(selected.grandTotal)} />
                  <SummaryItem label="Total paid" value={money(selected.paidAmount)} />
                  <SummaryItem label="Refunded" value={money(selected.refundAmount)} />
                  <SummaryItem label="Remaining due" value={money(selected.dueAmount)} />
                </div>
                <PaymentForm title="Add payment" type="payment" methods={paymentMethods} saving={saving} defaultAmount={selected.dueAmount || selected.grandTotal} onSubmit={savePayment} />
                <PaymentForm title={`Issue refund - max ${money(refundableAmount)}`} type="refund" methods={paymentMethods} saving={saving} defaultAmount={refundableAmount} onSubmit={savePayment} />
                <HistoryList rows={paymentRows(selected)} />
              </div>
            ) : null}
            {activeTab === "courier" ? (
              <form onSubmit={saveCourier} className="space-y-3">
                <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Courier company</span><select name="courier" defaultValue={selected.courier?._id || ""} className="h-10 w-full rounded-md border border-slate-300 px-3"><option value="">No courier</option>{couriers.filter((courier) => courier.status === "active").map((courier) => <option key={courier._id} value={courier._id}>{courier.name}</option>)}</select></label>
                <div className="grid gap-3 sm:grid-cols-2"><Input name="courierCharge" type="number" label="Courier charge" defaultValue={selected.courierCharge || 0} /><Input name="trackingNumber" label="Tracking number" defaultValue={selected.trackingNumber || ""} /><Input name="dispatchDate" type="date" label="Dispatch date" defaultValue={selected.dispatchDate?.slice(0, 10) || ""} /><Input name="estimatedDeliveryDate" type="date" label="Estimated delivery" defaultValue={selected.estimatedDeliveryDate?.slice(0, 10) || ""} /></div>
                <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Fulfilment note</span><textarea name="fulfilmentNote" defaultValue={selected.fulfilmentNote || ""} className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <button disabled={saving} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save courier</button>
                <HistoryList rows={selected.courierHistory?.map((item) => ({ action: item.courierName || "Courier update", note: item.trackingNumber || item.note, staff: getStaffName(item.updatedBy), date: item.updatedAt })) || []} />
              </form>
            ) : null}
            {activeTab === "notes" ? (
              <div className="space-y-4">
                <SummaryItem label="Customer note" value={selected.notes || "No customer note"} />
                <form onSubmit={saveNote} className="space-y-3"><label className="block space-y-2 text-sm font-medium text-slate-700"><span>Internal staff note</span><textarea name="internalNote" className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" required /></label><button disabled={saving} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add note</button></form>
                <HistoryList rows={(selected.internalNotes || []).map((item) => ({ action: "Internal note", note: item.note, staff: getStaffName(item.updatedBy), date: item.updatedAt }))} />
              </div>
            ) : null}
            {activeTab === "activity" ? <HistoryList rows={(selected.staffActivity || []).map((item) => ({ action: label(item.action), note: item.note, staff: getStaffName(item.updatedBy), date: item.updatedAt }))} /> : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function OverviewTab({ order }: { order: Order }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Customer" value={order.customer.name} helper={order.customer.phone} copy={order.customer.phone} />
        <SummaryItem label="Email" value={order.customer.email || "No email"} copy={order.customer.email} />
        <SummaryItem label="Delivery address" value={order.customer.address || "No address"} helper={[order.customer.area, order.customer.city, order.customer.postalCode].filter(Boolean).join(", ")} copy={order.customer.address} />
        <SummaryItem label="Source" value={label(order.source || "website")} helper={`Created ${formatDate(order.createdAt)}`} />
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-950">Order items</h3>
        {order.items.map((item) => <div key={`${item.sku}-${item.name}`} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.variant || "Default"} / SKU {item.sku}</p><p className="text-xs text-slate-500">Qty {item.quantity} x {money(item.unitPrice)}</p></div><p className="font-semibold text-slate-950">{money(item.subtotal)}</p></div>)}
      </section>
      <section className="grid gap-2 text-sm">
        {[
          ["Subtotal", order.subtotal],
          ["Discount", order.discountTotal || 0],
          ["Coupon", order.couponDiscount || 0],
          ["Shipping", order.shippingFee || 0],
          ["Courier charge", order.courierCharge || 0],
          ["Tax", order.taxTotal || 0],
          ["Grand total", order.grandTotal],
          ["Paid", order.paidAmount || 0],
          ["Refunded", order.refundAmount || 0],
          ["Due", order.dueAmount || 0],
        ].map(([name, value]) => <div key={String(name)} className="flex justify-between border-b border-slate-100 py-2"><span className="text-slate-500">{String(name)}</span><span className="font-semibold text-slate-950">{money(Number(value))}</span></div>)}
      </section>
    </div>
  );
}

function SummaryItem({ label: title, value, helper, copy }: { label: string; value: string; helper?: string; copy?: string }) {
  return <div className="rounded-md border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-500">{title}</p>{copy ? <button onClick={() => navigator.clipboard?.writeText(copy)} className="text-slate-400" aria-label={`Copy ${title}`}><Copy size={14} /></button> : null}</div><p className="mt-1 font-semibold text-slate-950">{value}</p>{helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}</div>;
}

function Input({ label: title, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string | number; type?: string }) {
  return <label className="block space-y-2 text-sm font-medium text-slate-700"><span>{title}</span><input name={name} type={type} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-slate-300 px-3" /></label>;
}

function PaymentForm({ title, type, methods, saving, defaultAmount, onSubmit }: { title: string; type: "payment" | "refund"; methods: string[]; saving: boolean; defaultAmount?: number; onSubmit: (event: FormEvent<HTMLFormElement>, type: "payment" | "refund") => void }) {
  return (
    <form onSubmit={(event) => onSubmit(event, type)} className="space-y-3 rounded-md border border-slate-200 p-3">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Method</span><select name="method" className="h-10 w-full rounded-md border border-slate-300 px-3">{methods.map((method) => <option key={method} value={method}>{label(method)}</option>)}</select></label>
        <Input name="amount" type="number" label={type === "refund" ? "Refund amount" : "Amount received"} defaultValue={defaultAmount || ""} />
        <Input name="transactionId" label="Transaction/reference ID" />
        <Input name="senderPhone" label="Sender phone" />
        <Input name="reference" label="Reference" />
        <Input name="processedAt" type="date" label={type === "refund" ? "Refund date" : "Payment date"} />
      </div>
      {type === "refund" ? <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Refund reason</span><textarea name="reason" className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2" required /></label> : null}
      <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Note</span><textarea name="note" className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CreditCard size={16} /> Save {type}</button>
    </form>
  );
}

function HistoryList({ rows }: { rows: Array<{ action: string; note?: string; staff?: string; date?: string }> }) {
  if (!rows.length) return <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">No history yet.</p>;
  return <div className="space-y-3">{rows.slice().reverse().map((row, index) => <div key={`${row.action}-${row.date}-${index}`} className="border-b border-slate-100 pb-3 text-sm"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-950">{row.action}</p><p className="text-xs text-slate-500">{formatDate(row.date)}</p></div>{row.note ? <p className="mt-1 text-slate-600">{row.note}</p> : null}<p className="mt-1 text-xs text-slate-500">{row.staff || "System"}</p></div>)}</div>;
}
