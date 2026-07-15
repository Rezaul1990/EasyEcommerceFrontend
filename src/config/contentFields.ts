export type ContentField = {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
};

export type ContentSectionDefinition = {
  id: string;
  label: string;
  description: string;
  fieldKeys: string[];
};

export type EditablePageDefinition = {
  pageKey: string;
  label: string;
  path: string;
  fields: ContentField[];
  sections: ContentSectionDefinition[];
};

export const editablePageDefinitions: EditablePageDefinition[] = [
  {
    pageKey: "home",
    label: "Home",
    path: "/",
    fields: [
      { key: "eyebrow", label: "Hero eyebrow", fallback: "Modern ecommerce operations" },
      { key: "title", label: "Hero title", fallback: "EasyEcommerce" },
      { key: "subtitle", label: "Hero subtitle", fallback: "A complete storefront and admin foundation for selling products, managing catalog data, processing orders, and controlling staff access.", multiline: true },
      { key: "primaryButton", label: "Primary button", fallback: "Browse products" },
      { key: "secondaryButton", label: "Secondary button", fallback: "Open admin" },
      { key: "featuredEyebrow", label: "Featured eyebrow", fallback: "Featured catalog" },
      { key: "featuredTitle", label: "Featured title", fallback: "Products ready to sell" },
      { key: "featuredLink", label: "Featured link", fallback: "View all" },
    ],
    sections: [
      { id: "hero", label: "Hero", description: "Main storefront headline, supporting copy, and buttons.", fieldKeys: ["eyebrow", "title", "subtitle", "primaryButton", "secondaryButton"] },
      { id: "featured-products", label: "Featured products", description: "Featured catalog heading and link text.", fieldKeys: ["featuredEyebrow", "featuredTitle", "featuredLink"] },
    ],
  },
  {
    pageKey: "products",
    label: "Products",
    path: "/products",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Shop" },
      { key: "title", label: "Title", fallback: "Products" },
      { key: "subtitle", label: "Subtitle", fallback: "Browse the active catalog and use eligible coupons for instant checkout savings.", multiline: true },
    ],
    sections: [{ id: "page-header", label: "Page header", description: "Products page headline and introduction.", fieldKeys: ["eyebrow", "title", "subtitle"] }],
  },
  {
    pageKey: "checkout",
    label: "Checkout",
    path: "/checkout",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Place order" },
      { key: "title", label: "Title", fallback: "Checkout" },
    ],
    sections: [{ id: "page-header", label: "Page header", description: "Checkout page heading text.", fieldKeys: ["eyebrow", "title"] }],
  },
  {
    pageKey: "track-order",
    label: "Track Order",
    path: "/track-order",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Order status" },
      { key: "title", label: "Title", fallback: "Track order" },
    ],
    sections: [{ id: "page-header", label: "Page header", description: "Track order page heading text.", fieldKeys: ["eyebrow", "title"] }],
  },
  {
    pageKey: "cart",
    label: "Cart",
    path: "/cart",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Review" },
      { key: "title", label: "Title", fallback: "Cart" },
    ],
    sections: [{ id: "page-header", label: "Page header", description: "Cart page heading text.", fieldKeys: ["eyebrow", "title"] }],
  },
  {
    pageKey: "wishlist",
    label: "Wishlist",
    path: "/wishlist",
    fields: [
      { key: "eyebrow", label: "Eyebrow", fallback: "Saved products" },
      { key: "title", label: "Title", fallback: "Wishlist" },
    ],
    sections: [{ id: "page-header", label: "Page header", description: "Wishlist page heading text.", fieldKeys: ["eyebrow", "title"] }],
  },
];

export function pageDefinitionFor(pageKey: string) {
  return editablePageDefinitions.find((page) => page.pageKey === pageKey) || editablePageDefinitions[0];
}

export function contentValue(content: Record<string, string> | undefined, key: string, fallback: string) {
  const value = content?.[key];
  return value && value.trim() ? value : fallback;
}

export function contentFieldFor(pageKey: string, fieldKey: string) {
  return pageDefinitionFor(pageKey).fields.find((field) => field.key === fieldKey);
}

export function sectionFields(page: EditablePageDefinition, section: ContentSectionDefinition) {
  return section.fieldKeys.map((fieldKey) => page.fields.find((field) => field.key === fieldKey)).filter((field): field is ContentField => Boolean(field));
}
