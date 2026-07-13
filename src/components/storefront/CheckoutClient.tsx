"use client";

import { createPublicOrder, getPublicStoreSettings, validatePublicCoupon } from "@/services/apiClient";
import { bdPostalCodes } from "@/constants/bdPostalCodes";
import { clearCart, getCart, getCartItemPrice, getVariantLabel } from "@/utils/guestStore";
import thanaData from "@bangladeshi/bangladesh-address/build/src/json/bd-thana.json";
import upazilaData from "@bangladeshi/bangladesh-address/build/src/json/bd-upazila.json";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { GuestCartItem } from "@/utils/guestStore";
import type { StoreSetting } from "@/types/ecommerce";

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

function fullAddressLine(houseDetails: string, area: string, district: string, postalCode: string) {
  return [houseDetails.trim(), locationLine(area, district, postalCode)].filter(Boolean).join("\n");
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function CheckoutClient() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSetting | null>(null);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [houseDetails, setHouseDetails] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0), [items]);
  const deliveryCharge = useMemo(() => {
    if (!selectedDistrict) return 0;
    const charges = storeSettings?.deliveryCharges || {};
    return normalizeLocation(selectedDistrict) === "dhaka" ? Number(charges.dhaka || 0) : Number(charges.outsideDhaka || 0);
  }, [selectedDistrict, storeSettings]);
  const orderTotal = Math.max(subtotal + deliveryCharge - couponDiscount, 0);
  const address = useMemo(() => fullAddressLine(houseDetails, selectedArea, selectedDistrict, postalCode), [houseDetails, postalCode, selectedArea, selectedDistrict]);
  const districts = useMemo(() => Array.from(new Set((upazilaData as UpazilaRow[]).map((item) => item.district))).sort((a, b) => a.localeCompare(b)), []);
  const areas = useMemo(() => {
    if (!selectedDistrict) return [];
    const upazilas = (upazilaData as UpazilaRow[]).filter((item) => item.district === selectedDistrict).map((item) => item.upazila);
    const thanas = (thanaData as ThanaRow[]).filter((item) => item.district === selectedDistrict).map((item) => item.thana);
    return Array.from(new Set([...upazilas, ...thanas])).sort((a, b) => a.localeCompare(b));
  }, [selectedDistrict]);

  function changeDistrict(district: string) {
    setSelectedDistrict(district);
    setSelectedArea("");
    setPostalCode("");
    setCouponDiscount(0);
    setCouponMessage("");
  }

  function changeArea(area: string) {
    const nextPostalCode = area ? postalCodeFor(selectedDistrict, area) : "";
    setSelectedArea(area);
    setPostalCode(nextPostalCode);
  }

  function changePostalCode(nextPostalCode: string) {
    setPostalCode(nextPostalCode);
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
    getPublicStoreSettings().then(setStoreSettings).catch(() => setStoreSettings(null));
  }, []);

  async function applyCoupon() {
    const code = couponCode.trim();
    setCouponMessage("");
    setCouponDiscount(0);
    if (!code) {
      setCouponMessage("Enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const result = await validatePublicCoupon({ code, subtotal, productIds: items.map((item) => item._id) });
      setCouponDiscount(result.discountAmount);
      setCouponCode(result.coupon.code);
      setCouponMessage(`${result.coupon.code} applied`);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Coupon could not be applied");
    } finally {
      setCouponLoading(false);
    }
  }

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
          address,
          city: String(form.get("district") || ""),
          area: String(form.get("area") || ""),
          postalCode: postalCode,
        },
        items: items.map((item) => ({ productId: item._id, variantId: item.selectedVariant?._id, variantSku: item.selectedVariant?.sku, quantity: item.quantity })),
        paymentMethod: String(form.get("paymentMethod") || "cod") as "cod" | "manual" | "bkash" | "nagad" | "card",
        couponCode: couponDiscount > 0 ? couponCode : "",
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
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/track-order?order=${orderNumber}`} className="inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Track order</Link>
          <Link href="/products" className="inline-flex rounded-md border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800">Back to shop</Link>
        </div>
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
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Upazila / Thana</span>
          <select name="area" value={selectedArea} onChange={(event) => changeArea(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 disabled:bg-slate-100" required disabled={!selectedDistrict}>
            <option value="">{selectedDistrict ? "Select upazila or thana" : "Select district first"}</option>
            {areas.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Postal code</span><input name="postalCode" value={postalCode} onChange={(event) => changePostalCode(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Payment</span><select name="paymentMethod" className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950"><option value="cod">Cash on delivery</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="card">Card</option><option value="manual">Manual payment</option></select></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <span>House / block / road details</span>
          <input value={houseDetails} onChange={(event) => setHouseDetails(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950" placeholder="House 12, Road 4, Block B, test area" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <span>Delivery address</span>
          <textarea name="address" value={address} readOnly className="min-h-28 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><span>Note</span><textarea name="notes" className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <Link href="/products" className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Back to shop</Link>
          <button disabled={loading || !items.length} className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400">{loading ? "Placing order..." : "Place order"}</button>
        </div>
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
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Delivery charge</span><span className="font-semibold">{selectedDistrict ? money(deliveryCharge) : "Select district"}</span></div>
          {couponDiscount > 0 ? <div className="flex justify-between text-teal-700"><span>Coupon discount</span><span className="font-semibold">-{money(couponDiscount)}</span></div> : null}
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold"><span>Total</span><span>{money(orderTotal)}</span></div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">
            <span>Coupon</span>
            <div className="mt-2 flex gap-2">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-950" placeholder="Enter code" />
              <button type="button" onClick={applyCoupon} disabled={couponLoading || !items.length} className="rounded-md bg-teal-600 px-3 text-sm font-semibold text-white disabled:bg-slate-400">{couponLoading ? "..." : "Apply"}</button>
            </div>
          </label>
          {couponMessage ? <p className={`mt-2 text-xs font-semibold ${couponDiscount > 0 ? "text-teal-700" : "text-rose-600"}`}>{couponMessage}</p> : null}
        </div>
        <Link href="/products" className="mt-5 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800">Back to shop</Link>
      </aside>
    </div>
  );
}
