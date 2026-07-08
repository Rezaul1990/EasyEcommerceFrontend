"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { getAdminCategories, getAdminCouriers, getReport } from "@/services/apiClient";
import type { Category, CourierCompany, ReportSummary } from "@/types/ecommerce";
import { Activity, Banknote, Boxes, CalendarDays, ClipboardList, CreditCard, PackageSearch, RefreshCcw, RotateCcw, Truck, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const reportTabs = [
  { key: "sales", label: "Sales", icon: Banknote },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "products", label: "Products", icon: Boxes },
  { key: "inventory", label: "Inventory", icon: PackageSearch },
  { key: "coupons", label: "Coupons", icon: WalletCards },
  { key: "refunds", label: "Refunds", icon: RotateCcw },
  { key: "couriers", label: "Couriers", icon: Truck },
] as const;

const quickRanges = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this_week", label: "This week" },
  { key: "this_month", label: "This month" },
  { key: "custom", label: "Custom" },
];

const orderStatuses = ["pending", "confirmed", "packed", "courier_assigned", "shipped", "delivered", "cancelled", "returned", "refunded"];
const paymentStatuses = ["unpaid", "paid", "partial_paid", "due", "refunded", "cancelled_payment"];
const paymentMethods = ["cod", "bkash", "nagad", "card", "manual"];

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const numberFormatter = new Intl.NumberFormat("en-US");

function money(value = 0) {
  return moneyFormatter.format(value || 0);
}

function title(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BreakdownPanel({ title: heading, rows, emptyText = "No data for this filter" }: { title: string; rows?: Array<{ key: string; label: string; value: number }>; emptyText?: string }) {
  const max = Math.max(...(rows || []).map((row) => row.value), 1);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-950">{heading}</h2>
      <div className="mt-4 space-y-3">
        {rows?.length ? rows.slice(0, 6).map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="capitalize text-slate-600">{row.label}</span>
              <span className="font-semibold text-slate-950">{numberFormatter.format(row.value)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max((row.value / max) * 100, 6)}%` }} />
            </div>
          </div>
        )) : <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>}
      </div>
    </section>
  );
}

function KpiCard({ label, value, helper, icon: Icon, tone = "teal" }: { label: string; value: string; helper: string; icon: typeof Activity; tone?: "teal" | "emerald" | "amber" | "rose" | "slate" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-md ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{helper}</p>
    </section>
  );
}

export function ReportsClient() {
  const [activeType, setActiveType] = useState("sales");
  const [quickDate, setQuickDate] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [courier, setCourier] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [couriers, setCouriers] = useState<CourierCompany[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const activeFilterCount = [status, paymentStatus, paymentMethod, categoryId, courier, quickDate === "custom" ? startDate : "", quickDate === "custom" ? endDate : ""].filter(Boolean).length;

  const filters = useMemo(() => ({
    quickDate: quickDate === "custom" ? "" : quickDate,
    startDate: quickDate === "custom" ? startDate : "",
    endDate: quickDate === "custom" ? endDate : "",
    status,
    paymentStatus,
    paymentMethod,
    categoryId,
    courier,
  }), [quickDate, startDate, endDate, status, paymentStatus, paymentMethod, categoryId, courier]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminCategories(), getAdminCouriers()])
      .then(([categoryData, courierData]) => {
        if (ignore) return;
        setCategories(categoryData);
        setCouriers(courierData);
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
          setCouriers([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        setLoading(true);
        setError("");
      }
    });
    getReport(activeType, filters)
      .then((data) => {
        if (!ignore) setReport(data);
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
  }, [activeType, filters, refreshIndex]);

  function resetFilters() {
    setQuickDate("today");
    setStartDate("");
    setEndDate("");
    setStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setCategoryId("");
    setCourier("");
  }

  const totals = report?.totals || {};
  const activeTab = reportTabs.find((tab) => tab.key === activeType) || reportTabs[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <CalendarDays size={17} />
              Report controls
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Owner shop overview</h2>
            <p className="mt-1 text-sm text-slate-500">Filter the whole shop view by date, order status, payment status, and payment method.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <button key={range.key} onClick={() => setQuickDate(range.key)} className={`h-10 rounded-md px-3 text-sm font-semibold ${quickDate === range.key ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
            <option value="">All order statuses</option>
            {orderStatuses.map((item) => <option key={item} value={item}>{title(item)}</option>)}
          </select>
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
            <option value="">All payment statuses</option>
            {paymentStatuses.map((item) => <option key={item} value={item}>{title(item)}</option>)}
          </select>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
            <option value="">All payment methods</option>
            {paymentMethods.map((item) => <option key={item} value={item}>{title(item)}</option>)}
          </select>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          <select value={courier} onChange={(event) => setCourier(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
            <option value="">All couriers</option>
            {couriers.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
          <input disabled={quickDate !== "custom"} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
          <input disabled={quickDate !== "custom"} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}` : "Showing full shop overview for the selected date range"}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRefreshIndex((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCcw size={16} />
              Refresh
            </button>
            <button onClick={resetFilters} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <X size={16} />
              Reset
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gross sales" value={money(totals.grossSales)} helper="All matched orders" icon={Banknote} tone="teal" />
        <KpiCard label="Paid amount" value={money(totals.paidAmount)} helper={`${numberFormatter.format(totals.orders || 0)} orders in filter`} icon={CreditCard} tone="emerald" />
        <KpiCard label="Due amount" value={money(totals.dueAmount)} helper="Money still receivable" icon={WalletCards} tone="amber" />
        <KpiCard label="Refund amount" value={money(totals.refundAmount)} helper={`${numberFormatter.format(totals.refundedOrders || 0)} refunded orders`} icon={RotateCcw} tone="rose" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Orders" value={numberFormatter.format(totals.orders || 0)} helper={`${numberFormatter.format(totals.deliveredOrders || 0)} delivered`} icon={ClipboardList} tone="slate" />
        <KpiCard label="Products" value={numberFormatter.format(totals.products || 0)} helper={`${numberFormatter.format(totals.lowStock || 0)} low stock`} icon={Boxes} tone="slate" />
        <KpiCard label="Available stock signal" value={numberFormatter.format((totals.totalStock || 0) - (totals.reservedStock || 0))} helper={`${numberFormatter.format(totals.outOfStock || 0)} out of stock`} icon={PackageSearch} tone="slate" />
        <KpiCard label="Average order" value={money(totals.averageOrderValue)} helper={`${numberFormatter.format(totals.activeCoupons || 0)} active coupons`} icon={Activity} tone="slate" />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-2">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeType === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveType(tab.key)} className={`flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold ${active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading report..." /> : null}

      {!loading && report ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
              <div className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-md bg-teal-50 text-teal-700"><ActiveIcon size={19} /></span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{activeTab.label} report</h2>
                  <p className="text-xs text-slate-500">Generated {formatDate(report.generatedAt)}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Matched orders</span><span className="font-semibold">{numberFormatter.format(totals.orders || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Matched products</span><span className="font-semibold">{numberFormatter.format(totals.products || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Matched coupons</span><span className="font-semibold">{numberFormatter.format(totals.coupons || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Delivered sales</span><span className="font-semibold">{money(totals.sales)}</span></div>
              </div>
            </div>
            <div className="grid gap-4 lg:col-span-3 lg:grid-cols-3">
              <BreakdownPanel title="Order status" rows={report.breakdowns?.orderStatuses} />
              <BreakdownPanel title="Payment status" rows={report.breakdowns?.paymentStatuses} />
              <BreakdownPanel title="Payment method" rows={report.breakdowns?.paymentMethods} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <BreakdownPanel title="Courier workload" rows={report.breakdowns?.couriers} />
            <BreakdownPanel title="Product categories" rows={report.breakdowns?.categories} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-950">Recent matched orders</h2>
              <p className="mt-1 text-sm text-slate-500">Order, customer, payment, courier and payable amount in one place.</p>
            </div>
            <DataTable rows={report.rows?.recentOrders || []} getRowKey={(row) => row.id} emptyText="No orders match this report filter" columns={[
              { key: "order", header: "Order", render: (row) => <span className="font-semibold text-teal-700">{row.orderNumber}</span> },
              { key: "customer", header: "Customer", render: (row) => <span>{row.customer}<br /><span className="text-xs text-slate-500">{row.phone}</span></span> },
              { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{title(row.status)}</span> },
              { key: "payment", header: "Payment", render: (row) => <span>{title(row.paymentStatus)}<br /><span className="text-xs text-slate-500">{title(row.paymentMethod)}</span></span> },
              { key: "courier", header: "Courier", render: (row) => row.courier || "-" },
              { key: "total", header: "Total", align: "right", render: (row) => <span className="font-semibold">{money(row.grandTotal)}</span> },
            ]} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-950">Product and stock signal</h2>
              </div>
              <DataTable rows={report.rows?.products || []} getRowKey={(row) => row.id} emptyText="No products match this report filter" columns={[
                { key: "product", header: "Product", render: (row) => <span className="font-semibold text-slate-950">{row.name}<br /><span className="text-xs font-normal text-slate-500">{row.sku}</span></span> },
                { key: "category", header: "Category", render: (row) => row.category || "-" },
                { key: "stock", header: "Stock", render: (row) => <span>{numberFormatter.format(row.stock)}<br /><span className="text-xs text-slate-500">Reserved {row.reservedStock}</span></span> },
                { key: "price", header: "Price", align: "right", render: (row) => money(row.price) },
              ]} />
            </section>
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-950">Coupon health</h2>
              </div>
              <DataTable rows={report.rows?.coupons || []} getRowKey={(row) => row.id} emptyText="No coupons match this report filter" columns={[
                { key: "code", header: "Code", render: (row) => <span className="font-semibold text-slate-950">{row.code}<br /><span className="text-xs font-normal text-slate-500">{row.title}</span></span> },
                { key: "discount", header: "Discount", render: (row) => row.discountType === "fixed" ? money(row.discountValue) : `${row.discountValue}%` },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{row.status}</span> },
                { key: "expiry", header: "Expiry", render: (row) => formatDate(row.expiryDate) },
              ]} />
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}
