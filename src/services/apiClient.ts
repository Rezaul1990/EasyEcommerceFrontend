import type { AdminUser, ApiResponse, Category, Coupon, CourierCompany, DashboardSummary, DeliveryArea, ImageAsset, InventoryMovement, InventoryRow, InviteResponse, Order, PaymentMethodSetting, Permission, Product, ReportSummary, Role, SidebarItem, StockImportHistory, StoreSetting } from "@/types/ecommerce";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const sampleCategories: Category[] = [
  { _id: "cat-1", name: "Workspace", slug: "workspace", description: "Desk and office essentials" },
  { _id: "cat-2", name: "Travel", slug: "travel", description: "Useful everyday carry products" },
  { _id: "cat-3", name: "Home", slug: "home", description: "Smart pieces for modern homes" },
];

const sampleProducts: Product[] = [
  {
    _id: "prd-1",
    name: "Modular Desk Organizer",
    slug: "modular-desk-organizer",
    description: "A compact organizer with movable trays, cable slots, and a weighted phone stand for focused work.",
    shortDescription: "Organize daily tools without clutter.",
    categoryId: sampleCategories[0],
    price: 48,
    compareAtPrice: 64,
    sku: "EE-DESK-001",
    stockQuantity: 34,
    imageUrls: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"],
    tags: ["workspace", "featured"],
    status: "active",
    isFeatured: true,
  },
  {
    _id: "prd-2",
    name: "Minimal Travel Pack",
    slug: "minimal-travel-pack",
    description: "A weather-resistant everyday pack with padded laptop storage and fast-access side pockets.",
    shortDescription: "A clean carry system for commutes.",
    categoryId: sampleCategories[1],
    price: 92,
    compareAtPrice: null,
    sku: "EE-BAG-014",
    stockQuantity: 19,
    imageUrls: ["https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80"],
    tags: ["travel"],
    status: "active",
    isFeatured: true,
  },
  {
    _id: "prd-3",
    name: "Ceramic Smart Diffuser",
    slug: "ceramic-smart-diffuser",
    description: "A quiet ceramic diffuser with timer modes, soft lighting, and app-ready manual controls.",
    shortDescription: "Make any room calmer in minutes.",
    categoryId: sampleCategories[2],
    price: 59,
    compareAtPrice: 79,
    sku: "EE-HOME-227",
    stockQuantity: 7,
    imageUrls: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80"],
    tags: ["home"],
    status: "active",
    isFeatured: false,
  },
];

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text) {
    return {
      success: response.ok,
      message: response.ok ? "Success" : `Request failed with status ${response.status}`,
      data: null as T,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: response.ok ? "Invalid API response" : text,
      data: null as T,
    };
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    next: { revalidate: 30 },
  });

  const payload = await parseApiResponse<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(formatApiError(payload, "Request failed"));
  }
  return payload.data;
}

function formatApiError<T>(payload: ApiResponse<T>, fallback: string) {
  const detailMessage = payload.details?.map((detail) => {
    const path = detail.path ? `${detail.path}: ` : "";
    return `${path}${detail.message || ""}`.trim();
  }).filter(Boolean).join("; ");
  return detailMessage ? `${payload.message || fallback}: ${detailMessage}` : payload.message || fallback;
}

function getAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("easy_ecommerce_admin_token") || "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("easy_ecommerce_admin_token", token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("easy_ecommerce_admin_token");
}

export async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const payload = await parseApiResponse<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(formatApiError(payload, "Request failed"));
  }
  return payload.data;
}

export async function loginAdmin(email: string, password: string) {
  return request<{ token: string; user: AdminUser }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentAdmin() {
  return adminRequest<AdminUser>("/admin/auth/me");
}

export async function getAdminSidebar() {
  return adminRequest<SidebarItem[]>("/admin/me/sidebar");
}

export async function getPermissionRegistry() {
  return adminRequest<Permission[]>("/admin/permissions");
}

export async function getRoles() {
  return adminRequest<Role[]>("/admin/roles");
}

export async function createRole(payload: { name: string; slug: string; description: string; permissions: string[] }) {
  return adminRequest<Role>("/admin/roles", { method: "POST", body: JSON.stringify(payload) });
}

export async function getUsers() {
  return adminRequest<AdminUser[]>("/admin/users");
}

export async function createUserInvite(payload: { name: string; email: string; roleId: string }) {
  return adminRequest<InviteResponse>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function resendUserInvite(userId: string) {
  return adminRequest<{ inviteLink: string; expiresInDays: number }>(`/admin/users/${userId}/resend-invite`, { method: "POST" });
}

export async function verifyInviteToken(token: string) {
  return request<{ email: string; name: string; role: { name: string; slug: string } | null; expiresAt: string }>(`/admin/invites/verify/${token}`);
}

export async function acceptInvite(token: string, password: string) {
  return request<AdminUser>("/admin/invites/accept", { method: "POST", body: JSON.stringify({ token, password }) });
}

export async function getProducts(): Promise<Product[]> {
  try {
    return await request<Product[]>("/store/products");
  } catch {
    return sampleProducts;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await request<Category[]>("/store/categories");
  } catch {
    return sampleCategories;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await request<Product>(`/products/${slug}`);
  } catch {
    return sampleProducts.find((product) => product.slug === slug) || null;
  }
}

export async function getAdminCategories(): Promise<Category[]> {
  return adminRequest<Category[]>("/admin/categories");
}

export async function createAdminCategory(payload: { name: string; description: string; status: "active" | "inactive"; sortOrder: number }) {
  return adminRequest<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify({ ...payload, isActive: payload.status === "active" }),
  });
}

export async function deleteAdminCategory(id: string) {
  return adminRequest<Category>(`/admin/categories/${id}`, { method: "DELETE" });
}

export async function getAdminProducts(): Promise<Product[]> {
  return adminRequest<Product[]>("/admin/products");
}

export async function createAdminProduct(payload: {
  name: string;
  categoryId: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  shortDescription: string;
  description: string;
  status: "draft" | "active" | "inactive";
  isFeatured: boolean;
  discountType: "none" | "fixed" | "percentage";
  discountValue: number;
  imageUrls?: string[];
  galleryImages?: string[];
  imageAssets?: ImageAsset[];
}) {
  return adminRequest<Product>("/admin/products", { method: "POST", body: JSON.stringify(payload) });
}

export async function uploadAdminProductImages(files: File[]) {
  const token = getAdminToken();
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_URL}/admin/uploads/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const payload = await parseApiResponse<ImageAsset[]>(response);
  if (!response.ok || !payload.success) throw new Error(formatApiError(payload, "Image upload failed"));
  return payload.data;
}

export async function deleteAdminProductImage(asset: Pick<ImageAsset, "publicId" | "provider">) {
  return adminRequest<{ deleted: boolean }>("/admin/uploads/images", {
    method: "DELETE",
    body: JSON.stringify({ publicId: asset.publicId, provider: asset.provider }),
  });
}

export async function archiveAdminProduct(id: string) {
  return adminRequest<Product>(`/admin/products/${id}`, { method: "DELETE" });
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  return adminRequest<Coupon[]>("/admin/coupons");
}

export async function createAdminCoupon(payload: {
  code: string;
  title: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumOrderAmount: number;
  expiryDate: string;
  status: "active" | "inactive";
  products: string[];
}) {
  return adminRequest<Coupon>("/admin/coupons", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteAdminCoupon(id: string) {
  return adminRequest<Coupon>(`/admin/coupons/${id}`, { method: "DELETE" });
}

export async function getInventory(status?: "low_stock" | "out_of_stock") {
  if (status === "low_stock") return adminRequest<InventoryRow[]>("/admin/inventory/low-stock");
  if (status === "out_of_stock") return adminRequest<InventoryRow[]>("/admin/inventory/out-of-stock");
  return adminRequest<InventoryRow[]>("/admin/inventory");
}

export async function getInventoryMovements() {
  return adminRequest<InventoryMovement[]>("/admin/inventory/movements");
}

export async function getStockImportHistory() {
  return adminRequest<StockImportHistory[]>("/admin/inventory/import-history");
}

export async function importRestockCsv(file: File, importType: "low_stock" | "out_of_stock") {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("importType", importType);
  const response = await fetch(`${API_URL}/admin/inventory/restock-import`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const payload = await parseApiResponse<{ history: StockImportHistory; errors: StockImportHistory["errors"] }>(response);
  if (!response.ok || !payload.success) throw new Error(formatApiError(payload, "Import failed"));
  return payload.data;
}

export async function downloadInventoryDemo(type: "low_stock" | "out_of_stock") {
  const token = getAdminToken();
  const routeType = type.replace("_", "-");
  const response = await fetch(`${API_URL}/admin/inventory/${routeType}/demo-download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Demo download failed");
  return response.blob();
}

export async function createPublicOrder(payload: {
  customer: { name: string; email: string; phone: string; address: string; city: string; postalCode?: string };
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: "cod" | "manual" | "bkash" | "nagad" | "card";
  notes?: string;
}) {
  return request<{ orderNumber: string; grandTotal: number }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackPublicOrder(payload: { orderNumber: string; phone: string }) {
  return request<Order>("/orders/track", { method: "POST", body: JSON.stringify(payload) });
}

export async function getAdminOrders() {
  return adminRequest<Order[]>("/admin/orders");
}

export async function updateAdminOrderStatus(id: string, status: string) {
  return adminRequest<Order>(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

export async function updateAdminOrderPayment(id: string, payload: { paymentStatus: string; paidAmount: number; dueAmount: number; refundAmount: number; note?: string }) {
  return adminRequest<Order>(`/admin/orders/${id}/payment`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function updateAdminOrderCourier(id: string, payload: { courier: string; courierCharge: number; trackingNumber: string }) {
  return adminRequest<Order>(`/admin/orders/${id}/courier`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function getAdminCouriers() {
  return adminRequest<CourierCompany[]>("/admin/couriers");
}

export async function createAdminCourier(payload: { name: string; phone: string; contactPerson: string; defaultCharge: number; status: "active" | "inactive" }) {
  return adminRequest<CourierCompany>("/admin/couriers", { method: "POST", body: JSON.stringify(payload) });
}

export async function getStoreSettings() {
  return adminRequest<StoreSetting>("/admin/settings/store");
}

export async function updateStoreSettings(payload: StoreSetting) {
  return adminRequest<StoreSetting>("/admin/settings/store", { method: "PUT", body: JSON.stringify(payload) });
}

export async function getPaymentMethods() {
  return adminRequest<PaymentMethodSetting[]>("/admin/settings/payment-methods");
}

export async function updatePaymentMethods(methods: PaymentMethodSetting[]) {
  return adminRequest<PaymentMethodSetting[]>("/admin/settings/payment-methods", { method: "PUT", body: JSON.stringify({ methods }) });
}

export async function getDeliveryAreas() {
  return adminRequest<DeliveryArea[]>("/admin/settings/delivery-areas");
}

export async function createDeliveryArea(payload: Omit<DeliveryArea, "_id">) {
  return adminRequest<DeliveryArea>("/admin/settings/delivery-areas", { method: "POST", body: JSON.stringify(payload) });
}

export async function getReport(type: string, filters?: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return adminRequest<ReportSummary>(`/admin/reports/${type}${query ? `?${query}` : ""}`);
}

export async function getAdminSummary() {
  return adminRequest<DashboardSummary>("/admin/dashboard/summary");
}

export { API_URL, sampleProducts };
