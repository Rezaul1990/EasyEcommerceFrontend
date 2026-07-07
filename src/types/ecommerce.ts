export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
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
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type CartItem = Product & {
  quantity: number;
};
