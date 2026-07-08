"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { archiveAdminProduct, createAdminCategory, createAdminCoupon, createAdminProduct, deleteAdminCategory, deleteAdminCoupon, deleteAdminProductImage, getAdminCategories, getAdminCoupons, getAdminProducts, uploadAdminProductImages } from "@/services/apiClient";
import type { Category, Coupon, ImageAsset, Product } from "@/types/ecommerce";
import { resolveImageUrl } from "@/utils/imageUrl";
import { Archive, FolderPlus, ImageIcon, Loader2, Plus, TicketPercent, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CatalogManagerClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "coupons">("products");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImageAssets, setUploadedImageAssets] = useState<ImageAsset[]>([]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminCategories(), getAdminProducts(), getAdminCoupons()])
      .then(([categoryData, productData, couponData]) => {
        if (ignore) return;
        setCategories(categoryData);
        setProducts(productData);
        setCoupons(couponData);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Catalog data could not load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(value) || product.sku.toLowerCase().includes(value));
  }, [products, search]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    try {
      const category = await createAdminCategory({
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        status: String(form.get("status") || "active") as "active" | "inactive",
        sortOrder: Number(form.get("sortOrder") || 0),
      });
      setCategories((current) => [...current, category].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      formElement.reset();
      setSuccess("Category created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category could not be created");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    try {
      const product = await createAdminProduct({
        name: String(form.get("name") || ""),
        categoryId: String(form.get("categoryId") || ""),
        sku: String(form.get("sku") || ""),
        price: Number(form.get("price") || 0),
        stockQuantity: Number(form.get("stockQuantity") || 0),
        lowStockThreshold: Number(form.get("lowStockThreshold") || 5),
        shortDescription: String(form.get("shortDescription") || ""),
        description: String(form.get("description") || ""),
        status: String(form.get("status") || "draft") as "draft" | "active" | "inactive",
        isFeatured: form.get("isFeatured") === "on",
        discountType: String(form.get("discountType") || "none") as "none" | "fixed" | "percentage",
        discountValue: Number(form.get("discountValue") || 0),
        imageUrls: uploadedImageAssets.map((asset) => asset.url),
        galleryImages: uploadedImageAssets.map((asset) => asset.url),
        imageAssets: uploadedImageAssets,
      });
      setProducts((current) => [product, ...current]);
      formElement.reset();
      setUploadedImageAssets([]);
      setSuccess("Product created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be created");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setUploadingImages(true);
    setError("");
    setSuccess("");
    try {
      const assets = await uploadAdminProductImages(files);
      setUploadedImageAssets((current) => [...current, ...assets].slice(0, 10));
      setSuccess("Product image uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product image could not be uploaded");
    } finally {
      setUploadingImages(false);
    }
  }

  async function removeUploadedProductImage(asset: ImageAsset) {
    setError("");
    setSuccess("");
    setUploadedImageAssets((current) => current.filter((item) => item.url !== asset.url));
    try {
      if (asset.publicId) await deleteAdminProductImage(asset);
      setSuccess("Product image removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image was removed from the form, but storage cleanup failed");
    }
  }

  async function handleCreateCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    try {
      const coupon = await createAdminCoupon({
        code: String(form.get("code") || ""),
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        discountType: String(form.get("discountType") || "fixed") as "fixed" | "percentage",
        discountValue: Number(form.get("discountValue") || 0),
        minimumOrderAmount: Number(form.get("minimumOrderAmount") || 0),
        expiryDate: String(form.get("expiryDate") || ""),
        status: String(form.get("status") || "active") as "active" | "inactive",
        products: [],
      });
      setCoupons((current) => [coupon, ...current]);
      formElement.reset();
      setSuccess("Coupon created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coupon could not be created");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id: string) {
    setError("");
    setSuccess("");
    try {
      await deleteAdminCategory(id);
      setCategories((current) => current.filter((category) => category._id !== id));
      setSuccess("Category deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category could not be deleted");
    }
  }

  async function archiveProduct(id: string) {
    setError("");
    setSuccess("");
    try {
      const product = await archiveAdminProduct(id);
      setProducts((current) => current.map((item) => (item._id === id ? product : item)));
      setSuccess("Product archived");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be archived");
    }
  }

  async function removeCoupon(id: string) {
    setError("");
    setSuccess("");
    try {
      await deleteAdminCoupon(id);
      setCoupons((current) => current.filter((coupon) => coupon._id !== id));
      setSuccess("Coupon deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coupon could not be deleted");
    }
  }

  if (loading) return <LoadingState label="Loading catalog..." />;

  return (
    <div className="space-y-5">
      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(["products", "categories", "coupons"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${activeTab === tab ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "products" ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <Plus size={18} />
              Add product
            </h2>
            <form onSubmit={handleCreateProduct} className="mt-4 grid gap-3">
              <input name="name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Product name" required />
              <select name="categoryId" className="h-10 rounded-md border border-slate-300 px-3 text-sm" required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input name="sku" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="SKU" required />
                <input name="price" type="number" min="0" step="0.01" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Price" required />
                <input name="stockQuantity" type="number" min="0" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Stock" required />
                <input name="lowStockThreshold" type="number" min="0" defaultValue="5" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Low stock" />
              </div>
              <textarea name="shortDescription" className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Short description" />
              <textarea name="description" className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Description" required />
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {uploadingImages ? "Uploading..." : "Select product images"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={handleProductImageUpload} disabled={uploadingImages || uploadedImageAssets.length >= 10} />
                </label>
                {uploadedImageAssets.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {uploadedImageAssets.map((asset) => (
                      <div key={`${asset.provider || "image"}-${asset.publicId || asset.url}`} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white">
                        <Image src={resolveImageUrl(asset.url)} alt="Uploaded product" fill sizes="120px" className="object-cover" />
                        <button type="button" onClick={() => removeUploadedProductImage(asset)} className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:text-rose-600">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">JPG, PNG, WEBP, GIF. Max 5MB each, up to 10 images.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="discountType" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                  <option value="none">No discount</option>
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
                <input name="discountValue" type="number" min="0" defaultValue="0" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Discount" />
              </div>
              <select name="status" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="isFeatured" className="size-4 rounded border-slate-300 text-teal-600" />
                Featured product
              </label>
              <button disabled={saving || uploadingImages} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Create product</button>
            </form>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm" placeholder="Search name or SKU" />
            </div>
            <DataTable
              rows={filteredProducts}
              getRowKey={(row) => row._id}
              columns={[
                {
                  key: "name",
                  header: "Product",
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        {row.imageUrls?.[0] ? <Image src={resolveImageUrl(row.imageUrls[0])} alt={row.name} fill sizes="44px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ImageIcon size={16} /></div>}
                      </div>
                      <span className="font-medium text-slate-950">{row.name}</span>
                    </div>
                  ),
                },
                { key: "sku", header: "SKU", render: (row) => <span className="text-slate-600">{row.sku}</span> },
                { key: "stock", header: "Stock", render: (row) => <span>{row.stockQuantity ?? row.stock ?? 0}</span> },
                { key: "price", header: "Price", render: (row) => <span>{moneyFormatter.format(row.finalPrice || row.price)}</span> },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status}</span> },
                { key: "actions", header: "Actions", align: "right", render: (row) => <button onClick={() => archiveProduct(row._id)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"><Archive size={15} />Archive</button> },
              ]}
            />
          </section>
        </div>
      ) : null}
      {activeTab === "categories" ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <FolderPlus size={18} />
              Add category
            </h2>
            <form onSubmit={handleCreateCategory} className="mt-4 grid gap-3">
              <input name="name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Category name" required />
              <textarea name="description" className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <input name="sortOrder" type="number" defaultValue="0" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <select name="status" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button disabled={saving} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Create category</button>
            </form>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white">
            <DataTable
              rows={categories}
              getRowKey={(row) => row._id}
              columns={[
                { key: "name", header: "Category", render: (row) => <span className="font-medium text-slate-950">{row.name}</span> },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status || (row.isActive ? "active" : "inactive")}</span> },
                { key: "sort", header: "Sort", render: (row) => <span>{row.sortOrder || 0}</span> },
                { key: "actions", header: "Actions", align: "right", render: (row) => <button onClick={() => removeCategory(row._id)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-600"><Trash2 size={15} />Delete</button> },
              ]}
            />
          </section>
        </div>
      ) : null}
      {activeTab === "coupons" ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <TicketPercent size={18} />
              Add coupon
            </h2>
            <form onSubmit={handleCreateCoupon} className="mt-4 grid gap-3">
              <input name="code" className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase" placeholder="SAVE10" required />
              <input name="title" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Coupon title" required />
              <textarea name="description" className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <select name="discountType" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
                <input name="discountValue" type="number" min="0" step="0.01" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Discount" required />
                <input name="minimumOrderAmount" type="number" min="0" defaultValue="0" className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Minimum order" />
                <input name="expiryDate" type="date" className="h-10 rounded-md border border-slate-300 px-3 text-sm" required />
              </div>
              <select name="status" className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button disabled={saving} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">Create coupon</button>
            </form>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white">
            <DataTable
              rows={coupons}
              getRowKey={(row) => row._id}
              columns={[
                { key: "code", header: "Code", render: (row) => <span className="font-semibold text-slate-950">{row.code}</span> },
                { key: "discount", header: "Discount", render: (row) => <span>{row.discountType === "fixed" ? moneyFormatter.format(row.discountValue) : `${row.discountValue}%`}</span> },
                { key: "expiry", header: "Expiry", render: (row) => <span>{new Date(row.expiryDate).toLocaleDateString()}</span> },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status}</span> },
                { key: "actions", header: "Actions", align: "right", render: (row) => <button onClick={() => removeCoupon(row._id)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-600"><Trash2 size={15} />Delete</button> },
              ]}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
