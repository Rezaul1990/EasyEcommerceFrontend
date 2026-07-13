"use client";

import { createPublicOrder } from "@/services/apiClient";
import { bdPostalCodes } from "@/constants/bdPostalCodes";
import { clearCart, getCart, getCartItemPrice, getVariantLabel } from "@/utils/guestStore";
import thanaData from "@bangladeshi/bangladesh-address/build/src/json/bd-thana.json";
import upazilaData from "@bangladeshi/bangladesh-address/build/src/json/bd-upazila.json";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { GuestCartItem } from "@/utils/guestStore";

const mongoIdPattern = /^[a-f\d]{24}$/i;
type UpazilaRow = { upazila: string; district: string };
type ThanaRow = { thana: string; district: string };

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function postalCodeFor(district: string, area: string) {
  const districtKey = normalizeLocation(district);
  const areaKey = normalizeLocation(area);
  const districtRows = bdPostalCodes.filter((row) => normalizeLocation(row.district) === districtKey);
  const exact = districtRows.find((row) => normalizeLocation(row.area) === areaKey);
  if (exact) return exact.code;
  const close = districtRows.find((row) => {
    const rowArea = normalizeLocation(row.area);
    return rowArea.includes(areaKey) || areaKey.includes(rowArea);
  });
  return close?.code || "";
}

function locationLine(area: string, district: string, postalCode: string) {
  return [area, district, postalCode].filter(Boolean).join(", ");
}

export function CheckoutClient() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [autoAddressLine, setAutoAddressLine] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0), [items]);
  const districts = useMemo(() => Array.from(new Set((upazilaData as UpazilaRow[]).map((item) => item.district))).sort((a, b) => a.localeCompare(b)), []);
  const areas = useMemo(() => {
    if (!selectedDistrict) return [];
    const upazilas = (upazilaData as UpazilaRow[]).filter((item) => item.district === selectedDistrict).map((item) => item.upazila);
    const thanas = (thanaData as ThanaRow[]).filter((item) => item.district === selectedDistrict).map((item) => item.thana);
    return Array.from(new Set([...upazilas, ...thanas])).sort((a, b) => a.localeCompare(b));
  }, [selectedDistrict]);

  function syncAddressLocation(nextArea: string, nextDistrict: string, nextPostalCode: string) {
    const nextLine = locationLine(nextArea, nextDistrict, nextPostalCode);
    setAutoAddressLine(nextLine);
    setAddress((current) => {
      const trimmed = current.trim();
      if (!nextLine) return trimmed === autoAddressLine ? "" : current;
      if (!trimmed || trimmed === autoAddressLine) return nextLine;
      if (autoAddressLine && current.includes(autoAddressLine)) return current.replace(autoAddressLine, nextLine);
      return `${trimmed}\n${nextLine}`;
    });
  }

  function changeDistrict(district: string) {
    setSelectedDistrict(district);
    setSelectedArea("");
    setPostalCode("");
    syncAddressLocation("", district, "");
  }

  function changeArea(area: string) {
    const nextPostalCode = area ? postalCodeFor(selectedDistrict, area) : "";
    setSelectedArea(area);
    setPostalCode(nextPostalCode);
    syncAddressLocation(area, selectedDistrict, nextPostalCode);
  }

  function changePostalCode(nextPostalCode: string) {
    setPostalCode(nextPostalCode);
    syncAddressLocation(selectedArea, selectedDistrict, nextPostalCode);
  }

  useEffect(() => {
    queueMicrotask(() => {
      const cartItems = getCart();
      const validItems = cartItems.filter((item) => mongoIdPattern.test(item._id));
      if (validItems.length !== cartItems.length) {
        clearCart();
        setItems([]);
        setError("Your cart had old product data. Please add the product again and place the order.");
        return;
      }
      setItems(validItems);
    });
  }, []);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (items.some((item) => !mongoIdPattern.test(item._id))) {
        clearCart();
        setItems([]);
        setError("Your cart had old product data. Please add the product again and place the order.");
        return;
      }
      const order = await createPublicOrder({
        customer: {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          address: address,
          city: String(form.get("district") || ""),
          area: String(form.get("area") || ""),
          postalCode: postalCode,
        },
        items: items.map((item) => ({ productId: item._id, variantId: item.selectedVariant?._id, variantSku: item.selectedVariant?.sku, quantity: item.quantity })),
        paymentMethod: String(form.get("paymentMethod") || "cod") as "cod" | "manual" | "bkash" | "nagad" | "card",
        notes: String(form.get("notes") || ""),
      });
      setOrderNumber(order.orderNumber);
      clearCart();
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be placed");
    } finally {
      setLoading(false);
    }
  }

  if (orderNumber) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-semibold text-emerald-950">Order placed</h2>
        <p className="mt-2 text-sm text-emerald-800">Order ID: {orderNumber}</p>
        <Link href={`/track-order?order=${orderNumber}`} className="mt-5 inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Track order</Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submitOrder} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
        {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Full name</span><input name="name" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Email <span className="text-slate-400">(optional)</span></span><input name="email" type="email" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Phone</span><input name="phone" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>District</span>
          <select name="district" value={selectedDistrict} onChange={(event) => changeDistrict(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950" required>
            <option value="">Select district</option>
            {districts.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Postal code</span><input name="postalCode" value={postalCode} onChange={(event) => changePostalCode(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Upazila / Thana</span>
          <select name="area" value={selectedArea} onChange={(event) => changeArea(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 disabled:bg-slate-100" required disabled={!selectedDistrict}>
            <option value="">{selectedDistrict ? "Select upazila or thana" : "Select district first"}</option>
            {areas.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Payment</span><select name="paymentMethod" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950"><option value="cod">Cash on delivery</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="card">Card</option><option value="manual">Manual payment</option></select></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Delivery address</span><textarea name="address" value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Note</span><textarea name="notes" className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <button disabled={loading || !items.length} className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400 sm:col-span-2">{loading ? "Placing order..." : "Place order"}</button>
      </form>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Order summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item) => {
            const variantLabel = getVariantLabel(item.selectedVariant);
            const price = getCartItemPrice(item);
            return (
              <div key={item.cartLineId} className="flex justify-between gap-3">
                <span className="text-slate-600">
                  {item.name} x {item.quantity}
                  {variantLabel ? <span className="block text-xs font-semibold text-teal-700">{variantLabel}</span> : null}
                </span>
                <span className="font-semibold">${(price * item.quantity).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 font-semibold"><span>Total</span><span>${subtotal.toFixed(2)}</span></div>
      </aside>
    </div>
  );
}
