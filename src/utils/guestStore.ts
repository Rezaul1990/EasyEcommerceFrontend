import type { Product } from "@/types/ecommerce";

export type GuestCartItem = Product & { quantity: number };

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
  return read<GuestCartItem[]>(cartKey, []);
}

export function saveCart(items: GuestCartItem[]) {
  write(cartKey, items);
}

export function addToCart(product: Product, quantity = 1) {
  const items = getCart();
  const existing = items.find((item) => item._id === product._id);
  const stock = product.stockQuantity ?? product.stock ?? 999;
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, stock);
  else items.push({ ...product, quantity: Math.min(quantity, stock) });
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
