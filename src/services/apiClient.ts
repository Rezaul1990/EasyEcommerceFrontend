import type { ApiResponse, Category, Product } from "@/types/ecommerce";

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    next: { revalidate: 30 },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data;
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

export async function getAdminSummary() {
  return {
    activeProducts: sampleProducts.length,
    pendingOrders: 8,
    lowStockProducts: sampleProducts.filter((product) => product.stockQuantity <= 10).length,
    totalRevenue: 18420,
  };
}

export { API_URL, sampleProducts };
