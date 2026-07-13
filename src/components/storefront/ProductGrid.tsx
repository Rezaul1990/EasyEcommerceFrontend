"use client";

import type { Category, Product } from "@/types/ecommerce";
import { ProductCard } from "./ProductCard";
import { useMemo, useState } from "react";

function categoryIdForProduct(product: Product) {
  if (!product.categoryId) return "";
  if (typeof product.categoryId === "string") return product.categoryId;
  return product.categoryId._id;
}

export function ProductGrid({ products, categories = [] }: { products: Product[]; categories?: Category[] }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((product) => categoryIdForProduct(product) === selectedCategoryId);
  }, [products, selectedCategoryId]);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-950">No products found</h2>
        <p className="mt-2 text-sm text-slate-600">Add active products from the admin catalog to populate the storefront.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {categories.length ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${selectedCategoryId === "" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700"}`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => setSelectedCategoryId(category._id)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${selectedCategoryId === category._id ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-700"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      {filteredProducts.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No products in this category</h2>
          <p className="mt-2 text-sm text-slate-600">Choose another category or view all products.</p>
        </div>
      )}
    </div>
  );
}
