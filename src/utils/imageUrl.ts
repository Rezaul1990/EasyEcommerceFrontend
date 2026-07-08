import type { Product } from "@/types/ecommerce";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const FALLBACK_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function apiOrigin() {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
}

export function resolveImageUrl(url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE) {
  if (!url) return fallback;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${apiOrigin()}${url}`;
  return url;
}

export function shouldBypassImageOptimizer(url: string) {
  return url.startsWith("http://localhost:") || url.startsWith("http://127.0.0.1:");
}

export function getProductImageUrl(product: Product, fallback = FALLBACK_PRODUCT_IMAGE) {
  const image =
    product.imageUrls?.find(Boolean) ||
    product.galleryImages?.find(Boolean) ||
    product.imageAssets?.map((asset) => asset.url || asset.secureUrl || asset.originalUrl).find(Boolean);

  return resolveImageUrl(image, fallback);
}

export { FALLBACK_PRODUCT_IMAGE };
