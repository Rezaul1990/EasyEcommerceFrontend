export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status?: "active" | "inactive";
  isActive?: boolean;
  sortOrder?: number;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: Category;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  stockQuantity: number;
  imageUrls: string[];
  tags: string[];
  baseSku?: string;
  basePrice?: number;
  productType?: "simple" | "variant";
  discountType?: "none" | "fixed" | "percentage";
  discountValue?: number;
  finalPrice?: number;
  stock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  galleryImages?: string[];
  imageAssets?: ImageAsset[];
  status: "draft" | "active" | "inactive" | "archived";
  isFeatured: boolean;
};

export type ImageAsset = {
  url: string;
  secureUrl?: string;
  originalUrl?: string;
  publicId?: string;
  provider?: string;
  width?: number | null;
  height?: number | null;
  format?: string;
  bytes?: number | null;
  fileName?: string;
  size?: number;
  mimeType?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  details?: Array<{ path?: string; message?: string }> | null;
};

export type CartItem = Product & {
  quantity: number;
};

export type Role = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystemRole?: boolean;
  status?: "active" | "inactive";
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending" | "suspended";
  role: {
    id: string;
    name: string;
    slug: string;
    permissions: string[];
  } | null;
};

export type Permission = {
  key: string;
  module: string;
  action: string;
  label: string;
  description: string;
  group: string;
};

export type SidebarItem = {
  label: string;
  href: string;
  module: string;
};

export type EditablePage = {
  pageKey: string;
  label: string;
  path: string;
  status?: "draft" | "published";
  updatedAt?: string | null;
};

export type PageContent = {
  pageKey: string;
  content: Record<string, string>;
  status: "draft" | "published";
  updatedAt?: string | null;
  publishedAt?: string | null;
};

export type InviteResponse = {
  user: AdminUser;
  inviteLink: string;
  expiresInDays: number;
};

export type DashboardSummary = {
  cards: {
    totalOrders: number;
    totalSales: number;
    totalProducts: number;
    lowStockCount: number;
    todayOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    dueAmount: number;
    refundAmount: number;
  };
  paymentSummary: Array<{ status: string; amount: number; count: number }>;
  recentOrders: Array<{
    _id: string;
    orderNumber?: string;
    orderCode?: string;
    customer?: { name?: string; phone?: string; email?: string };
    grandTotal: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  lowStockList: Array<{
    _id: string;
    name: string;
    sku?: string;
    baseSku?: string;
    stockQuantity?: number;
    stock?: number;
    reservedStock?: number;
    lowStockThreshold?: number;
  }>;
  topSellingProducts: Array<{
    _id: string;
    name: string;
    sku?: string;
    baseSku?: string;
    bestSellingScore?: number;
    price?: number;
    finalPrice?: number;
  }>;
  activeProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  totalRevenue: number;
};

export type Coupon = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumOrderAmount: number;
  expiryDate: string;
  status: "active" | "inactive";
  products: Product[];
};

export type InventoryRow = {
  productId: string;
  productName: string;
  productType: "simple" | "variant";
  productStatus?: "draft" | "active" | "inactive" | "archived";
  variantId?: string | null;
  variantInfo?: string;
  sku: string;
  category?: Category;
  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  updatedAt: string;
};

export type InventoryMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  summary: {
    totalItems: number;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
    lowStock: number;
    outOfStock: number;
    reservedItems: number;
  };
};

export type InventoryMovement = {
  _id: string;
  product?: Product;
  variantSku?: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  previousReservedStock: number;
  newReservedStock: number;
  note?: string;
  createdBy?: AdminUser;
  createdAt: string;
};

export type MovementMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type StockImportHistory = {
  _id: string;
  fileName: string;
  importType: "low_stock" | "out_of_stock";
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{ row: number; sku: string; message: string }>;
  createdAt: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  customer: { name: string; email?: string; phone: string; address?: string; city?: string; area?: string; postalCode?: string };
  items: Array<{ name: string; sku: string; imageUrl?: string; variant?: string; quantity: number; unitPrice: number; discount?: number; subtotal: number }>;
  subtotal: number;
  shippingFee?: number;
  discountTotal?: number;
  couponDiscount?: number;
  courierCharge?: number;
  taxTotal?: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paidAmount?: number;
  dueAmount?: number;
  refundAmount?: number;
  courier?: CourierCompany | null;
  trackingNumber?: string;
  dispatchDate?: string | null;
  estimatedDeliveryDate?: string | null;
  fulfilmentNote?: string;
  source?: string;
  notes?: string;
  internalNote?: string;
  internalNotes?: Array<{ note: string; updatedBy?: AdminUser; updatedAt: string }>;
  paymentTransactions?: Array<{ _id?: string; type: "payment" | "refund"; method: string; amount: number; reference?: string; transactionId?: string; senderPhone?: string; note?: string; reason?: string; status?: string; processedBy?: AdminUser; updatedBy?: AdminUser; processedAt?: string; updatedAt: string }>;
  paymentHistory?: Array<{ type?: string; paymentStatus?: string; method?: string; amount?: number; paidAmount?: number; dueAmount?: number; refundAmount?: number; reference?: string; transactionId?: string; note?: string; updatedBy?: AdminUser; updatedAt: string }>;
  courierHistory?: Array<{ courierName?: string; trackingNumber?: string; courierCharge?: number; note?: string; updatedBy?: AdminUser; updatedAt: string }>;
  staffActivity?: Array<{ action: string; note?: string; updatedBy?: AdminUser; updatedAt: string }>;
  statusHistory?: Array<{ status: string; note?: string; updatedBy?: AdminUser; updatedAt: string }>;
  updatedBy?: AdminUser;
  createdAt: string;
  updatedAt?: string;
};

export type OrdersMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalDue: number;
  };
};

export type CourierCompany = {
  _id: string;
  name: string;
  phone?: string;
  contactPerson?: string;
  defaultCharge: number;
  status: "active" | "inactive";
};

export type StoreSetting = {
  _id?: string;
  shopName: string;
  logo?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; tiktok?: string };
};

export type PaymentMethodSetting = {
  _id?: string;
  name: string;
  key: string;
  instructions?: string;
  status: "active" | "inactive";
};

export type DeliveryArea = {
  _id: string;
  district: string;
  area: string;
  upazila?: string;
  charge: number;
  status: "active" | "inactive";
};

export type ReportSummary = {
  type: string;
  totals: Record<string, number>;
  filters?: Record<string, string>;
  breakdowns?: {
    orderStatuses?: Array<{ key: string; label: string; value: number }>;
    paymentStatuses?: Array<{ key: string; label: string; value: number }>;
    paymentMethods?: Array<{ key: string; label: string; value: number }>;
    couriers?: Array<{ key: string; label: string; value: number }>;
    categories?: Array<{ key: string; label: string; value: number }>;
  };
  rows?: {
    recentOrders?: Array<{
      id: string;
      orderNumber: string;
      customer: string;
      phone: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
      courier?: string;
      grandTotal: number;
      paidAmount: number;
      dueAmount: number;
      refundAmount: number;
      createdAt: string;
    }>;
    products?: Array<{
      id: string;
      name: string;
      sku: string;
      category?: string;
      status: string;
      stock: number;
      reservedStock: number;
      lowStockThreshold: number;
      price: number;
      bestSellingScore: number;
    }>;
    coupons?: Array<{
      id: string;
      code: string;
      title: string;
      status: string;
      discountType: string;
      discountValue: number;
      minimumOrderAmount: number;
      expiryDate: string;
    }>;
  };
  generatedAt: string;
};
