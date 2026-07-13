"use client";

import { DataTable } from "@/components/admin/ui/DataTable";
import { ErrorState, LoadingState } from "@/components/admin/ui/States";
import { archiveAdminProduct, createAdminCategory, createAdminCoupon, createAdminProduct, deleteAdminCategory, deleteAdminCoupon, deleteAdminProductImage, getAdminCategories, getAdminCoupons, getAdminProducts, getCurrentAdmin, updateAdminProduct, uploadAdminProductImages } from "@/services/apiClient";
import type { AdminUser, Category, Coupon, ImageAsset, Product, ProductVariant } from "@/types/ecommerce";
import { getProductImageUrl, resolveImageUrl, shouldBypassImageOptimizer } from "@/utils/imageUrl";
import { Archive, FolderPlus, ImageIcon, Loader2, Pencil, Plus, TicketPercent, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const catalogTabs = ["products", "categories", "coupons"] as const;
const productEditorTabs = ["Basics", "Media", "Categories", "Options & Variants", "Configurator", "SEO"] as const;
type CatalogTab = (typeof catalogTabs)[number];
type ProductEditorTab = (typeof productEditorTabs)[number];
type VariantDraft = ProductVariant & { id: string };
type OptionDraft = { id: string; name: string; values: string[]; input: string };

function makeSkuBase(value: string) {
  const base = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "PRODUCT";
}

function makeUniqueSku(value: string, products: Product[], excludeProductId?: string) {
  const base = makeSkuBase(value);
  const existingSkus = new Set(products.filter((product) => product._id !== excludeProductId).map((product) => product.sku.toUpperCase()));
  let candidate = base;
  let suffix = 2;

  while (existingSkus.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function variantDraft(values?: Partial<ProductVariant>, fallbackSku = "DEFAULT"): VariantDraft {
  return {
    id: values?._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variantName: values?.variantName || "Default",
    options: values?.options || {},
    sku: values?.sku || fallbackSku,
    price: values?.price ?? 0,
    discountType: values?.discountType || "none",
    discountValue: values?.discountValue ?? 0,
    finalPrice: values?.finalPrice ?? values?.price ?? 0,
    compareAtPrice: values?.compareAtPrice ?? null,
    stock: values?.stock ?? 0,
    reservedStock: values?.reservedStock ?? 0,
    lowStockThreshold: values?.lowStockThreshold ?? 5,
    image: values?.image || "",
    status: values?.status || "active",
  };
}

function productVariantDrafts(product: Product | null, fallbackSku: string) {
  if (product?.variants?.length) return product.variants.map((variant) => variantDraft(variant, fallbackSku));
  return [variantDraft({ variantName: "Default", sku: product?.sku || fallbackSku, price: product?.price || 0, stock: product?.stockQuantity ?? product?.stock ?? 0, reservedStock: product?.reservedStock || 0, image: product?.imageUrls?.[0] || "" }, fallbackSku)];
}

function optionDraft(name = "", values: string[] = []): OptionDraft {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, values, input: "" };
}

function optionDraftsFromVariants(variants: ProductVariant[] = []) {
  const optionValues = new Map<string, Set<string>>();
  variants.forEach((variant) => {
    Object.entries(variant.options || {}).forEach(([name, value]) => {
      if (!optionValues.has(name)) optionValues.set(name, new Set());
      if (value) optionValues.get(name)?.add(value);
    });
  });
  return Array.from(optionValues.entries()).map(([name, values]) => optionDraft(name, Array.from(values)));
}

function cartesianOptions(options: OptionDraft[]) {
  const validOptions = options.filter((option) => option.name.trim() && option.values.length);
  if (!validOptions.length) return [];
  return validOptions.reduce<Array<Record<string, string>>>((rows, option) => {
    const nextValues = option.values.map((value) => ({ [option.name.trim()]: value }));
    if (!rows.length) return nextValues;
    return rows.flatMap((row) => nextValues.map((value) => ({ ...row, ...value })));
  }, []);
}

function cleanVariantOptions(options: ProductVariant["options"] = {}) {
  return Object.fromEntries(
    Object.entries(options)
      .map(([name, value]) => [name.trim(), String(value || "").trim()])
      .filter(([name, value]) => name && value),
  );
}

function cleanVariantPayload(variant: VariantDraft, fallbackSku: string, index: number): ProductVariant {
  const options = cleanVariantOptions(variant.options);
  const optionLabel = Object.values(options).join(" / ");
  const variantName = (variant.variantName || optionLabel || `Variant ${index + 1}`).trim();
  const skuBase = (variant.sku || `${fallbackSku || "PRODUCT"}-${index + 1}`).trim().toUpperCase();
  const price = Number.isFinite(Number(variant.price)) ? Number(variant.price) : 0;
  const stock = Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0;
  const reservedStock = Number.isFinite(Number(variant.reservedStock)) ? Number(variant.reservedStock) : 0;
  const lowStockThreshold = Number.isFinite(Number(variant.lowStockThreshold)) ? Number(variant.lowStockThreshold) : 5;
  const discountValue = Number.isFinite(Number(variant.discountValue)) ? Number(variant.discountValue) : 0;
  const compareAtPrice = variant.compareAtPrice === null || variant.compareAtPrice === undefined || !Number.isFinite(Number(variant.compareAtPrice))
    ? null
    : Number(variant.compareAtPrice);

  return {
    variantName,
    options,
    sku: skuBase,
    price,
    compareAtPrice,
    discountType: variant.discountType || "none",
    discountValue,
    finalPrice: price,
    stock,
    reservedStock,
    lowStockThreshold,
    image: String(variant.image || ""),
    status: variant.status === "inactive" ? "inactive" : "active",
  };
}

export function CatalogManagerClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<CatalogTab>("products");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImageAssets, setUploadedImageAssets] = useState<ImageAsset[]>([]);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [productEditorTab, setProductEditorTab] = useState<ProductEditorTab>("Basics");
  const [productOptions, setProductOptions] = useState<OptionDraft[]>([optionDraft()]);
  const [productVariants, setProductVariants] = useState<VariantDraft[]>([variantDraft()]);
  const [productFormKey, setProductFormKey] = useState(0);

  const hasPermission = (permission: string) => Boolean(user?.role?.slug === "owner" || user?.role?.permissions.includes(permission));
  const canViewProducts = hasPermission("products.view");
  const canCreateProducts = hasPermission("products.create");
  const canUpdateProducts = hasPermission("products.update");
  const canDeleteProducts = hasPermission("products.delete");
  const canViewCategories = hasPermission("categories.view");
  const canCreateCategories = hasPermission("categories.create");
  const canDeleteCategories = hasPermission("categories.delete");
  const canViewCoupons = hasPermission("coupons.view");
  const canCreateCoupons = hasPermission("coupons.create");
  const canDeleteCoupons = hasPermission("coupons.delete");
  const visibleTabs = catalogTabs.filter((tab) => {
    if (tab === "products") return canViewProducts;
    if (tab === "categories") return canViewCategories;
    return canViewCoupons;
  });

  useEffect(() => {
    let ignore = false;
    getCurrentAdmin()
      .then(async (currentUser) => {
        const can = (permission: string) => Boolean(currentUser.role?.slug === "owner" || currentUser.role?.permissions.includes(permission));
        const nextTabs = catalogTabs.filter((tab) => {
          if (tab === "products") return can("products.view");
          if (tab === "categories") return can("categories.view");
          return can("coupons.view");
        });
        const [categoryData, productData, couponData] = await Promise.all([
          can("categories.view") || can("products.create") || can("products.update") ? getAdminCategories() : Promise.resolve([]),
          can("products.view") ? getAdminProducts() : Promise.resolve([]),
          can("coupons.view") ? getAdminCoupons() : Promise.resolve([]),
        ]);
        return { currentUser, nextTabs, categoryData, productData, couponData };
      })
      .then(({ currentUser, nextTabs, categoryData, productData, couponData }) => {
        if (ignore) return;
        setUser(currentUser);
        setCategories(categoryData);
        setProducts(productData);
        setCoupons(couponData);
        setActiveTab(nextTabs[0] || "products");
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
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(value) || product.sku.toLowerCase().includes(value) || product.slug.toLowerCase().includes(value);
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const categoryId = productCategoryId(product);
      const matchesCategory = categoryFilter === "all" || categoryId === categoryFilter;
      const stock = product.stockQuantity ?? product.stock ?? 0;
      const threshold = product.lowStockThreshold ?? 5;
      const matchesStock = stockFilter === "all" || (stockFilter === "in" && stock > threshold) || (stockFilter === "low" && stock > 0 && stock <= threshold) || (stockFilter === "out" && stock <= 0);
      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    });
  }, [categoryFilter, products, search, statusFilter, stockFilter]);

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
      const hasGeneratedVariants = productVariants.length > 1 || productVariants.some((variant) => Object.keys(variant.options || {}).length > 0);
      const productPayload = {
        name: productName,
        categoryId: String(form.get("categoryId") || ""),
        sku: productSku,
        price: Number(form.get("price") || productVariants[0]?.price || 0),
        basePrice: Number(form.get("price") || productVariants[0]?.price || 0),
        stock: Number(form.get("stockQuantity") || productVariants[0]?.stock || 0),
        stockQuantity: Number(form.get("stockQuantity") || productVariants[0]?.stock || 0),
        reservedStock: Number(productVariants[0]?.reservedStock || 0),
        lowStockThreshold: Number(form.get("lowStockThreshold") || 5),
        shortDescription: String(form.get("shortDescription") || ""),
        description: String(form.get("description") || ""),
        status: String(form.get("status") || "draft") as "draft" | "active" | "inactive",
        isFeatured: form.get("isFeatured") === "on",
        discountType: String(form.get("discountType") || "none") as "none" | "fixed" | "percentage",
        discountValue: Number(form.get("discountValue") || 0),
        productType: hasGeneratedVariants ? "variant" as const : "simple" as const,
        baseSku: productSku,
        variants: hasGeneratedVariants ? productVariants.map((variant, index) => cleanVariantPayload(variant, productSku, index)) : [],
        imageUrls: uploadedImageAssets.map((asset) => asset.url),
        galleryImages: uploadedImageAssets.map((asset) => asset.url),
        imageAssets: uploadedImageAssets,
      };
      const product = editingProduct ? await updateAdminProduct(editingProduct._id, productPayload) : await createAdminProduct(productPayload);
      setProducts((current) => (editingProduct ? current.map((item) => (item._id === product._id ? product : item)) : [product, ...current]));
      formElement.reset();
      setProductName("");
      setProductSku("");
      setEditingProduct(null);
      setProductDrawerOpen(false);
      setProductEditorTab("Basics");
      setUploadedImageAssets([]);
      setProductOptions([optionDraft()]);
      setProductVariants([variantDraft()]);
      setProductFormKey((value) => value + 1);
      setSuccess(editingProduct ? "Product updated" : "Product created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be created");
    } finally {
      setSaving(false);
    }
  }

  function updateProductName(value: string) {
    const nextSku = value ? makeUniqueSku(value, products, editingProduct?._id) : "";
    setProductName(value);
    setProductSku(nextSku);
    setProductVariants((current) => current.map((variant, index) => (index === 0 && (!variant.sku || variant.sku === "DEFAULT" || variant.sku === productSku) ? { ...variant, sku: nextSku } : variant)));
  }

  function productCategoryId(product: Product) {
    if (!product.categoryId) return "";
    if (typeof product.categoryId === "string") return product.categoryId;
    return product.categoryId._id;
  }

  function productImageAssets(product: Product): ImageAsset[] {
    if (product.imageAssets?.length) return product.imageAssets;
    return [...(product.imageUrls || []), ...(product.galleryImages || [])].filter(Boolean).map((url) => ({ url, provider: url.includes("res.cloudinary.com") ? "cloudinary" : "local" }));
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product);
    setProductName(product.name);
    setProductSku(product.sku);
    setUploadedImageAssets(productImageAssets(product));
    setProductOptions(optionDraftsFromVariants(product.variants || []));
    setProductVariants(productVariantDrafts(product, product.sku));
    setProductDrawerOpen(true);
    setProductEditorTab("Basics");
    setActiveTab("products");
    setError("");
    setSuccess("");
    setProductFormKey((value) => value + 1);
  }

  function cancelEditProduct() {
    setEditingProduct(null);
    setProductName("");
    setProductSku("");
    setProductDrawerOpen(false);
    setProductEditorTab("Basics");
    setUploadedImageAssets([]);
    setProductOptions([optionDraft()]);
    setProductVariants([variantDraft()]);
    setError("");
    setProductFormKey((value) => value + 1);
  }

  function openNewProduct() {
    setEditingProduct(null);
    setProductName("");
    setProductSku("");
    setUploadedImageAssets([]);
    setProductOptions([optionDraft()]);
    setProductVariants([variantDraft()]);
    setProductDrawerOpen(true);
    setProductEditorTab("Basics");
    setError("");
    setSuccess("");
    setProductFormKey((value) => value + 1);
  }

  function updateVariant(id: string, field: keyof ProductVariant, value: string | number | null) {
    setProductVariants((current) => current.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)));
  }

  function addOption() {
    setProductOptions((current) => [...current, optionDraft()]);
  }

  function updateOptionName(id: string, name: string) {
    setProductOptions((current) => current.map((option) => (option.id === id ? { ...option, name } : option)));
  }

  function updateOptionInput(id: string, input: string) {
    setProductOptions((current) => current.map((option) => (option.id === id ? { ...option, input } : option)));
  }

  function addOptionValue(id: string) {
    setProductOptions((current) => current.map((option) => {
      if (option.id !== id) return option;
      const value = option.input.trim();
      if (!value || option.values.some((item) => item.toLowerCase() === value.toLowerCase())) return { ...option, input: "" };
      return { ...option, values: [...option.values, value], input: "" };
    }));
  }

  function removeOptionValue(id: string, value: string) {
    setProductOptions((current) => current.map((option) => (option.id === id ? { ...option, values: option.values.filter((item) => item !== value) } : option)));
  }

  function removeOption(id: string) {
    setProductOptions((current) => (current.length > 1 ? current.filter((option) => option.id !== id) : [optionDraft()]));
  }

  function generateVariantsFromOptions() {
    const rows = cartesianOptions(productOptions);
    if (!rows.length) {
      setProductVariants((current) => (current.length ? current : [variantDraft({ sku: productSku }, productSku)]));
      return;
    }
    setProductVariants(rows.map((options, index) => {
      const variantName = Object.values(options).join(" / ");
      const existing = productVariants.find((variant) => variant.variantName.toLowerCase() === variantName.toLowerCase());
      return variantDraft({ ...existing, variantName, options, sku: existing?.sku || (productSku ? `${productSku}-${index + 1}` : ""), price: existing?.price ?? productVariants[0]?.price ?? 0 }, productSku);
    }));
  }

  function addVariant() {
    setProductVariants((current) => [...current, variantDraft({ variantName: `Variant ${current.length + 1}`, sku: productSku ? `${productSku}-${current.length + 1}` : "" }, productSku)]);
  }

  function removeVariant(id: string) {
    setProductVariants((current) => (current.length > 1 ? current.filter((variant) => variant.id !== id) : current));
  }

  function setVariantImage(id: string, image: string) {
    updateVariant(id, "image", image);
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
  if (!visibleTabs.length) return null;

  return (
    <div className="space-y-5">
      {error ? <ErrorState message={error} /> : null}
      {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${activeTab === tab ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "products" ? (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Products</h2>
              <p className="mt-1 text-sm text-slate-600">Search, price, publish, and organize catalog inventory.</p>
            </div>
            {canCreateProducts ? (
              <button onClick={openNewProduct} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
                <Plus size={16} />
                New Product
              </button>
            ) : null}
          </div>
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_160px_180px_150px]">
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm" placeholder="Search products, slugs, or SKUs." />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
                <option value="all">Stock: All</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
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
                      <div className="relative size-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {getProductImageUrl(row, "") ? <Image src={getProductImageUrl(row, "")} alt={row.name} fill sizes="48px" unoptimized={shouldBypassImageOptimizer(getProductImageUrl(row, ""))} className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ImageIcon size={16} /></div>}
                      </div>
                      <div>
                        <span className="font-medium text-slate-950">{row.name}</span>
                        <p className="mt-1 text-xs text-slate-500">/shop/{row.slug}</p>
                      </div>
                    </div>
                  ),
                },
                { key: "status", header: "Status", render: (row) => <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${row.status === "active" ? "bg-emerald-50 text-emerald-700" : row.status === "archived" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{row.status}</span> },
                { key: "category", header: "Categories", render: (row) => <span className="text-slate-600">{typeof row.categoryId === "object" ? row.categoryId?.name : "None"}</span> },
                { key: "stock", header: "Stock", render: (row) => <span>{row.stockQuantity ?? row.stock ?? 0} avail</span> },
                { key: "price", header: "Price", render: (row) => <span>{moneyFormatter.format(row.finalPrice || row.price)}</span> },
                ...(canUpdateProducts || canDeleteProducts
                  ? [
                      {
                        key: "actions",
                        header: "Actions",
                        align: "right" as const,
                        render: (row: Product) => (
                          <div className="flex justify-end gap-2">
                            {canUpdateProducts ? <button onClick={() => startEditProduct(row)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"><Pencil size={15} />Edit</button> : null}
                            {canDeleteProducts ? <button disabled={row.status === "archived"} onClick={() => archiveProduct(row._id)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><Archive size={15} />{row.status === "archived" ? "Archived" : "Archive"}</button> : null}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </section>
          {productDrawerOpen ? (
            <div className="fixed inset-0 z-50">
              <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Close product editor" onClick={cancelEditProduct} />
              <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col bg-white shadow-2xl">
                <header className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{editingProduct ? "Edit Product" : "New Product"}</h2>
                      <p className="mt-1 text-sm text-slate-500">Manage publishing, media, categories, options, variants, and SEO.</p>
                    </div>
                    <button onClick={cancelEditProduct} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600">Close</button>
                  </div>
                </header>
                <form key={productFormKey} onSubmit={handleCreateProduct} className="flex min-h-0 flex-1 flex-col">
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
                      {productEditorTabs.map((tab) => (
                        <button key={tab} type="button" onClick={() => setProductEditorTab(tab)} className={`rounded-md px-3 py-2 text-sm font-medium ${productEditorTab === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <div className={productEditorTab === "Basics" ? "space-y-4" : "hidden"}>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Title</span>
                        <input name="name" value={productName} onChange={(event) => updateProductName(event.target.value)} autoComplete="off" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Handmade Gift Box..." />
                      </label>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Slug / SKU</span>
                        <input name="sku" value={productSku} readOnly autoComplete="off" className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700" placeholder="Auto SKU" />
                      </label>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Status</span>
                        <select name="status" defaultValue={editingProduct?.status || "draft"} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                          <option value="draft">Draft</option>
                          <option value="active">Published</option>
                          <option value="inactive">Inactive</option>
                          <option value="archived">Archived</option>
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-5">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" name="isFeatured" defaultChecked={editingProduct?.isFeatured || false} className="size-4 rounded border-slate-300 text-teal-600" />
                          Featured Product
                        </label>
                      </div>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Short description</span>
                        <textarea name="shortDescription" defaultValue={editingProduct?.shortDescription || ""} className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Short product summary..." />
                      </label>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Description</span>
                        <textarea name="description" defaultValue={editingProduct?.description || ""} minLength={10} className="min-h-40 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Describe materials, sizing, care, and what is included..." />
                      </label>
                    </div>
                    <div className={productEditorTab === "Media" ? "space-y-4" : "hidden"}>
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
                          {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                          {uploadingImages ? "Uploading..." : "Select product images"}
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={handleProductImageUpload} disabled={uploadingImages || uploadedImageAssets.length >= 10} />
                        </label>
                        {uploadedImageAssets.length ? (
                          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {uploadedImageAssets.map((asset) => (
                              <div key={`${asset.provider || "image"}-${asset.publicId || asset.url}`} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white">
                                <Image src={resolveImageUrl(asset.url)} alt="Uploaded product" fill sizes="140px" unoptimized={shouldBypassImageOptimizer(resolveImageUrl(asset.url))} className="object-cover" />
                                <button type="button" onClick={() => removeUploadedProductImage(asset)} className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:text-rose-600">
                                  <X size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">JPG, PNG, WEBP, GIF. Max 5MB each, up to 10 images.</p>
                        )}
                      </div>
                    </div>
                    <div className={productEditorTab === "Categories" ? "space-y-4" : "hidden"}>
                      <label className="block space-y-1 text-sm font-medium text-slate-700">
                        <span>Category</span>
                        <select name="categoryId" defaultValue={editingProduct ? productCategoryId(editingProduct) : ""} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className={productEditorTab === "Options & Variants" ? "space-y-5" : "hidden"}>
                      <section className="rounded-lg border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-950">Options</h3>
                        <p className="mt-1 text-sm text-slate-500">Examples: Size, Color, Material. Values become variant rows.</p>
                        <div className="mt-4 space-y-3">
                          {productOptions.map((option) => (
                            <div key={option.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                              <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                                <input value={option.name} onChange={(event) => updateOptionName(option.id, event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" placeholder="size" />
                                <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white px-2">
                                  {option.values.map((value) => (
                                    <button key={value} type="button" onClick={() => removeOptionValue(option.id, value)} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                                      {value} x
                                    </button>
                                  ))}
                                  <input
                                    value={option.input}
                                    onChange={(event) => updateOptionInput(option.id, event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        addOptionValue(option.id);
                                      }
                                    }}
                                    className="h-8 min-w-28 flex-1 bg-transparent text-sm outline-none"
                                    placeholder="Add value..."
                                  />
                                </div>
                                <button type="button" onClick={() => removeOption(option.id)} className="h-10 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-600">Remove</button>
                              </div>
                              <button type="button" onClick={() => addOptionValue(option.id)} className="mt-3 h-10 w-full rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-500">Add Value</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={addOption} className="mt-4 h-10 w-full rounded-md border border-slate-200 text-sm font-semibold text-slate-700">Add Option</button>
                      </section>
                      <section className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-950">Variant Matrix</h3>
                            <p className="mt-1 text-sm text-slate-500">Tune SKU, stock, prices, status, and image per variant.</p>
                          </div>
                          <button type="button" onClick={generateVariantsFromOptions} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Generate Variants</button>
                        </div>
                        <div className="mt-4 space-y-4">
                          {productVariants.map((variant) => (
                            <div key={variant.id} className="rounded-lg border border-slate-200 bg-white p-4">
                              <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_110px_110px_auto] lg:items-end">
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>Variant Name</span>
                                  <input value={variant.variantName} onChange={(event) => updateVariant(variant.id, "variantName", event.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Default" />
                                  {Object.keys(variant.options || {}).length ? (
                                    <span className="mt-2 flex flex-wrap gap-1">
                                      {Object.entries(variant.options || {}).map(([name, value]) => (
                                        <span key={`${name}-${value}`} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">{name}: {value}</span>
                                      ))}
                                    </span>
                                  ) : null}
                                </label>
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>SKU</span>
                                  <input value={variant.sku} onChange={(event) => updateVariant(variant.id, "sku", event.target.value.toUpperCase())} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder={productSku || "SKU"} />
                                </label>
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>Stock</span>
                                  <input value={variant.stock} onChange={(event) => updateVariant(variant.id, "stock", Number(event.target.value || 0))} type="number" min="0" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
                                </label>
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>Reserved</span>
                                  <input value={variant.reservedStock || 0} onChange={(event) => updateVariant(variant.id, "reservedStock", Number(event.target.value || 0))} type="number" min="0" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
                                </label>
                                <label className="flex h-10 items-center gap-2 text-sm font-medium text-slate-700">
                                  <input checked={variant.status === "active"} onChange={(event) => updateVariant(variant.id, "status", event.target.checked ? "active" : "inactive")} type="checkbox" className="size-4 rounded border-slate-300 text-teal-600" />
                                  Active
                                </label>
                              </div>
                              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-700">Variant Image</p>
                                {variant.image ? (
                                  <div className="mt-2 flex items-center gap-3">
                                    <div className="relative size-16 overflow-hidden rounded-md border border-slate-200 bg-white">
                                      <Image src={resolveImageUrl(variant.image)} alt={variant.variantName} fill sizes="64px" unoptimized={shouldBypassImageOptimizer(resolveImageUrl(variant.image))} className="object-cover" />
                                    </div>
                                    <button type="button" onClick={() => setVariantImage(variant.id, "")} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Remove image</button>
                                  </div>
                                ) : null}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {uploadedImageAssets.length ? uploadedImageAssets.map((asset) => (
                                    <button key={`${variant.id}-${asset.url}`} type="button" onClick={() => setVariantImage(variant.id, asset.url)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                                      Pick image
                                    </button>
                                  )) : <span className="text-sm text-slate-500">Upload product images in the Media tab, then pick one here.</span>}
                                </div>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>BDT Price</span>
                                  <input value={variant.price} onChange={(event) => updateVariant(variant.id, "price", Number(event.target.value || 0))} type="number" min="0" step="0.01" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
                                </label>
                                <label className="block space-y-1 text-sm font-medium text-slate-700">
                                  <span>BDT Compare At</span>
                                  <input value={variant.compareAtPrice || ""} onChange={(event) => updateVariant(variant.id, "compareAtPrice", event.target.value ? Number(event.target.value) : null)} type="number" min="0" step="0.01" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Optional..." />
                                </label>
                              </div>
                              <button type="button" onClick={() => removeVariant(variant.id)} disabled={productVariants.length === 1} className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50">Remove Variant</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={addVariant} className="mt-5 h-10 w-full rounded-md border border-slate-200 text-sm font-semibold text-slate-700">Add Custom Variant</button>
                      </section>
                    </div>
                    <div className={productEditorTab === "Configurator" ? "space-y-4" : "hidden"}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1 text-sm font-medium text-slate-700">
                          <span>Discount type</span>
                          <select name="discountType" defaultValue={editingProduct?.discountType || "none"} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                            <option value="none">No discount</option>
                            <option value="fixed">Fixed</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </label>
                        <label className="block space-y-1 text-sm font-medium text-slate-700">
                          <span>Discount value</span>
                          <input name="discountValue" type="number" min="0" defaultValue={editingProduct?.discountValue ?? 0} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Discount" />
                        </label>
                      </div>
                    </div>
                    <div className={productEditorTab === "SEO" ? "space-y-4" : "hidden"}>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        SEO uses the product title, slug, and description for now. Dedicated metadata fields can be added without changing this product flow.
                      </div>
                    </div>
                  </div>
                  <footer className="flex justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <button type="button" onClick={cancelEditProduct} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                    <button disabled={saving || uploadingImages} className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">{editingProduct ? "Save Product" : "Save Product"}</button>
                  </footer>
                </form>
              </aside>
            </div>
          ) : null}
        </div>
      ) : null}
      {activeTab === "categories" ? (
        <div className={`grid gap-5 ${canCreateCategories ? "xl:grid-cols-[380px_1fr]" : ""}`}>
          {canCreateCategories ? (
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
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white">
            <DataTable
              rows={categories}
              getRowKey={(row) => row._id}
              columns={[
                { key: "name", header: "Category", render: (row) => <span className="font-medium text-slate-950">{row.name}</span> },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status || (row.isActive ? "active" : "inactive")}</span> },
                { key: "sort", header: "Sort", render: (row) => <span>{row.sortOrder || 0}</span> },
                ...(canDeleteCategories ? [{ key: "actions", header: "Actions", align: "right" as const, render: (row: Category) => <button onClick={() => removeCategory(row._id)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-600"><Trash2 size={15} />Delete</button> }] : []),
              ]}
            />
          </section>
        </div>
      ) : null}
      {activeTab === "coupons" ? (
        <div className={`grid gap-5 ${canCreateCoupons ? "xl:grid-cols-[380px_1fr]" : ""}`}>
          {canCreateCoupons ? (
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
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white">
            <DataTable
              rows={coupons}
              getRowKey={(row) => row._id}
              columns={[
                { key: "code", header: "Code", render: (row) => <span className="font-semibold text-slate-950">{row.code}</span> },
                { key: "discount", header: "Discount", render: (row) => <span>{row.discountType === "fixed" ? moneyFormatter.format(row.discountValue) : `${row.discountValue}%`}</span> },
                { key: "expiry", header: "Expiry", render: (row) => <span>{new Date(row.expiryDate).toLocaleDateString()}</span> },
                { key: "status", header: "Status", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.status}</span> },
                ...(canDeleteCoupons ? [{ key: "actions", header: "Actions", align: "right" as const, render: (row: Coupon) => <button onClick={() => removeCoupon(row._id)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-600"><Trash2 size={15} />Delete</button> }] : []),
              ]}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
