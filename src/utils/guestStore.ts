import type { Product, ProductVariant } from "@/types/ecommerce";

export type GuestCartVariant = Pick<ProductVariant, "_id" | "variantName" | "options" | "sku" | "price" | "finalPrice" | "compareAtPrice" | "stock" | "reservedStock" | "image">;
export type GuestCartItem = Product & { quantity: number; cartLineId: string; selectedVariant?: GuestCartVariant };

const cartKey = "easy_ecommerce_cart";
const wishlistKey = "easy_ecommerce_wishlist";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("easy-ecommerce-store-change"));
}

export function getCart() {
  return read<GuestCartItem[]>(cartKey, []).map((item) => ({
    ...item,
    cartLineId: item.cartLineId || getCartLineId(item, item.selectedVariant),
  }));
}

export function saveCart(items: GuestCartItem[]) {
  write(cartKey, items);
}

export function getVariantLabel(variant?: Pick<ProductVariant, "variantName" | "options">) {
  if (!variant) return "";
  const optionValues = Object.values(variant.options || {}).filter(Boolean);
  return optionValues.length ? optionValues.join(" / ") : variant.variantName;
}

export function getCartLineId(product: Product, variant?: Pick<ProductVariant, "_id" | "sku">) {
  return `${product._id}:${variant?._id || variant?.sku || "default"}`;
}

export function getCartItemPrice(item: GuestCartItem) {
  return item.selectedVariant?.finalPrice || item.selectedVariant?.price || item.finalPrice || item.price;
}

export function getCartItemStock(item: GuestCartItem) {
  if (item.selectedVariant) return Math.max((item.selectedVariant.stock || 0) - (item.selectedVariant.reservedStock || 0), 0);
  return item.stockQuantity ?? item.stock ?? 999;
}

export function addToCart(product: Product, quantity = 1, variant?: ProductVariant) {
  const items = getCart();
  const cartLineId = getCartLineId(product, variant);
  const existing = items.find((item) => (item.cartLineId || getCartLineId(item, item.selectedVariant)) === cartLineId);
  const stock = variant ? Math.max((variant.stock || 0) - (variant.reservedStock || 0), 0) : product.stockQuantity ?? product.stock ?? 999;
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, stock);
  else {
    const selectedVariant = variant ? {
      _id: variant._id,
      variantName: variant.variantName,
      options: variant.options,
      sku: variant.sku,
      price: variant.price,
      finalPrice: variant.finalPrice,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      image: variant.image,
    } : undefined;
    items.push({ ...product, cartLineId, selectedVariant, quantity: Math.min(quantity, stock) });
  }
  saveCart(items);
}

export function getWishlist() {
  return read<Product[]>(wishlistKey, []);
}

export function toggleWishlist(product: Product) {
  const items = getWishlist();
  const exists = items.some((item) => item._id === product._id);
  write(wishlistKey, exists ? items.filter((item) => item._id !== product._id) : [...items, product]);
}

export function clearCart() {
  saveCart([]);
}
