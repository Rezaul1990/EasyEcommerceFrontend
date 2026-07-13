"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { createDeliveryArea, getDeliveryAreas, getPaymentMethods, getStoreSettings, updatePaymentMethods, updateStoreSettings } from "@/services/apiClient";
import type { DeliveryArea, PaymentMethodSetting, StoreSetting } from "@/types/ecommerce";
import { FormEvent, useEffect, useState } from "react";

export function SettingsManagerClient() {
  const [store, setStore] = useState<StoreSetting | null>(null);
  const [methods, setMethods] = useState<PaymentMethodSetting[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getStoreSettings(), getPaymentMethods(), getDeliveryAreas()])
      .then(([storeData, methodData, areaData]) => {
        if (ignore) return;
        setStore(storeData);
        setMethods(methodData);
        setAreas(areaData);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Settings could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setSuccess("");
    try {
      const data = await updateStoreSettings({
        shopName: String(form.get("shopName") || ""),
        contactPhone: String(form.get("contactPhone") || ""),
        email: String(form.get("email") || ""),
        address: String(form.get("address") || ""),
        deliveryCharges: {
          dhaka: Number(form.get("dhakaDeliveryCharge") || 0),
          outsideDhaka: Number(form.get("outsideDhakaDeliveryCharge") || 0),
        },
        logo: store?.logo || "",
        socialLinks: {
          facebook: String(form.get("facebook") || ""),
          instagram: String(form.get("instagram") || ""),
          youtube: String(form.get("youtube") || ""),
          tiktok: String(form.get("tiktok") || ""),
        },
      });
      setStore(data);
      setSuccess("Store settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store settings could not be saved");
    }
  }

  async function savePaymentMethods() {
    setError("");
    setSuccess("");
    try {
      setMethods(await updatePaymentMethods(methods));
      setSuccess("Payment methods saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment methods could not be saved");
    }
  }

  async function handleDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setSuccess("");
    try {
      const area = await createDeliveryArea({
        district: String(form.get("district") || ""),
        area: String(form.get("area") || ""),
        upazila: String(form.get("upazila") || ""),
        charge: Number(form.get("charge") || 0),
        status: "active",
      });
      setAreas((current) => [...current, area]);
      event.currentTarget.reset();
      setSuccess("Delivery area created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery area could not be created");
    }
  }

  if (loading) return <LoadingState label="Loading settings..." />;

  return (
    <div className="space-y-5">
      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
      <form onSubmit={handleStore} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Store name</span><input name="shopName" defaultValue={store?.shopName} className="h-11 w-full rounded-md border border-slate-300 px-3" required /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Email</span><input name="email" defaultValue={store?.email} className="h-11 w-full rounded-md border border-slate-300 px-3" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Contact phone</span><input name="contactPhone" defaultValue={store?.contactPhone} className="h-11 w-full rounded-md border border-slate-300 px-3" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Facebook</span><input name="facebook" defaultValue={store?.socialLinks?.facebook} className="h-11 w-full rounded-md border border-slate-300 px-3" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Dhaka delivery charge</span><input name="dhakaDeliveryCharge" type="number" min="0" defaultValue={store?.deliveryCharges?.dhaka ?? 0} className="h-11 w-full rounded-md border border-slate-300 px-3" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Outside Dhaka delivery charge</span><input name="outsideDhakaDeliveryCharge" type="number" min="0" defaultValue={store?.deliveryCharges?.outsideDhaka ?? 0} className="h-11 w-full rounded-md border border-slate-300 px-3" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"><span>Address</span><textarea name="address" defaultValue={store?.address} className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <input name="instagram" defaultValue={store?.socialLinks?.instagram} className="hidden" />
        <input name="youtube" defaultValue={store?.socialLinks?.youtube} className="hidden" />
        <input name="tiktok" defaultValue={store?.socialLinks?.tiktok} className="hidden" />
        <button className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white md:col-span-2">Save store settings</button>
      </form>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Payment methods</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {methods.map((method, index) => (
            <label key={method.key} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-700">
              <span>{method.name}</span>
              <select value={method.status} onChange={(event) => setMethods((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value as "active" | "inactive" } : item))} className="h-9 rounded-md border border-slate-300 px-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          ))}
        </div>
        <button onClick={savePaymentMethods} className="mt-4 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">Save payment methods</button>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Delivery areas</h2>
        <form onSubmit={handleDelivery} className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="district" placeholder="District" className="h-10 rounded-md border border-slate-300 px-3 text-sm" required />
          <input name="area" placeholder="Area" className="h-10 rounded-md border border-slate-300 px-3 text-sm" required />
          <input name="upazila" placeholder="Upazila" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          <input name="charge" type="number" placeholder="Charge" className="h-10 rounded-md border border-slate-300 px-3 text-sm" required />
          <button className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white md:col-span-4">Create delivery area</button>
        </form>
        <div className="mt-5">
          <DataTable rows={areas} getRowKey={(row) => row._id} columns={[
            { key: "district", header: "District", render: (row) => row.district },
            { key: "area", header: "Area", render: (row) => row.area },
            { key: "upazila", header: "Upazila", render: (row) => row.upazila || "-" },
            { key: "charge", header: "Charge", render: (row) => `$${row.charge}` },
          ]} />
        </div>
      </section>
    </div>
  );
}
