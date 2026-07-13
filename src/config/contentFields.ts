export type ContentField = {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
};

export type EditablePageDefinition = {
  pageKey: string;
  label: string;
  path: string;
  fields: ContentField[];
};

export const editablePageDefinitions: EditablePageDefinition[] = [
  {
    pageKey: "products",
    label: "Products",
    path: "/products",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Shop" },
      { key: "title", label: "Title", fallback: "Products" },
      { key: "subtitle", label: "Subtitle", fallback: "Browse the active catalog and use eligible coupons for instant checkout savings.", multiline: true },
    ],
  },
  {
    pageKey: "checkout",
    label: "Checkout",
    path: "/checkout",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Place order" },
      { key: "title", label: "Title", fallback: "Checkout" },
    ],
  },
  {
    pageKey: "track-order",
    label: "Track Order",
    path: "/track-order",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Order status" },
      { key: "title", label: "Title", fallback: "Track order" },
    ],
  },
  {
    pageKey: "cart",
    label: "Cart",
    path: "/cart",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Review" },
      { key: "title", label: "Title", fallback: "Cart" },
    ],
  },
  {
    pageKey: "wishlist",
    label: "Wishlist",
    path: "/wishlist",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Saved products" },
      { key: "title", label: "Title", fallback: "Wishlist" },
    ],
  },
];

export function pageDefinitionFor(pageKey: string) {
  return editablePageDefinitions.find((page) => page.pageKey === pageKey) || editablePageDefinitions[0];
}

export function contentValue(content: Record<string, string> | undefined, key: string, fallback: string) {
  const value = content?.[key];
  return value && value.trim() ? value : fallback;
}
