import { sectionDefinitionFor, sectionFieldKey, type ManagedSection } from "@/config/contentFields";
import { mergeVisualStyle, visualCmsFieldAttrs, visualCmsFieldStyle, visualCmsSectionAttrs, visualCmsSectionStyle } from "@/config/visualCms";
import type { Product, Category } from "@/types/ecommerce";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "./ProductGrid";

type SectionMaps = {
  content: Record<string, string>;
  styles?: Record<string, Record<string, string>>;
  layout?: Record<string, Record<string, string>>;
};

function value(content: Record<string, string>, key: string, fallback: string) {
  const text = content[key];
  return text && text.trim() ? text : fallback;
}

export function activeSections(pageKey: string, sections: ManagedSection[] | undefined, fallback: ManagedSection[]) {
  const source = sections?.length ? sections : fallback;
  return source.filter((section) => section.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function HomeManagedSection({ section, maps, visualPreview, products, categories }: { section: ManagedSection; maps: SectionMaps; visualPreview: boolean; products: Product[]; categories: Category[] }) {
  const definition = sectionDefinitionFor("home", section);
  const sectionStyles = maps.styles?.[section.id];
  const sectionLayout = maps.layout?.[section.id];

  if (section.type === "featured-products") {
    const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 3);
    const eyebrowKey = sectionFieldKey(section, "featuredEyebrow");
    const titleKey = sectionFieldKey(section, "featuredTitle");
    const linkKey = sectionFieldKey(section, "featuredLink");
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" style={visualCmsSectionStyle(sectionStyles, sectionLayout)} {...visualCmsSectionAttrs(visualPreview, "home", section.id)}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" style={visualCmsFieldStyle(sectionStyles, "text")} {...visualCmsFieldAttrs(visualPreview, eyebrowKey, "text")}>{value(maps.content, eyebrowKey, "Featured catalog")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950" style={visualCmsFieldStyle(sectionStyles, "heading")} {...visualCmsFieldAttrs(visualPreview, titleKey, "heading")}>{value(maps.content, titleKey, definition.label === "Featured products" ? "Products ready to sell" : definition.label)}</h2>
          </div>
          <Link href="/products" className="hidden text-sm font-semibold text-teal-700 sm:inline" style={visualCmsFieldStyle(sectionStyles, "button")}>
            <span {...visualCmsFieldAttrs(visualPreview, linkKey, "button")}>{value(maps.content, linkKey, "View all")}</span>
          </Link>
        </div>
        <ProductGrid products={featuredProducts.length ? featuredProducts : products.slice(0, 3)} categories={categories} />
      </section>
    );
  }

  const eyebrowKey = sectionFieldKey(section, "eyebrow");
  const titleKey = sectionFieldKey(section, "title");
  const subtitleKey = sectionFieldKey(section, "subtitle");
  const primaryButtonKey = sectionFieldKey(section, "primaryButton");
  const secondaryButtonKey = sectionFieldKey(section, "secondaryButton");
  return (
    <section className="bg-white" style={visualCmsSectionStyle(sectionStyles, sectionLayout)} {...visualCmsSectionAttrs(visualPreview, "home", section.id)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" style={visualCmsFieldStyle(sectionStyles, "text")} {...visualCmsFieldAttrs(visualPreview, eyebrowKey, "text")}>{value(maps.content, eyebrowKey, "Modern ecommerce operations")}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            <span style={visualCmsFieldStyle(sectionStyles, "heading")} {...visualCmsFieldAttrs(visualPreview, titleKey, "heading")}>{value(maps.content, titleKey, "EasyEcommerce")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600" style={visualCmsFieldStyle(sectionStyles, "text")} {...visualCmsFieldAttrs(visualPreview, subtitleKey, "text")}>{value(maps.content, subtitleKey, "A complete storefront and admin foundation for selling products, managing catalog data, processing orders, and controlling staff access.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white" style={visualCmsFieldStyle(sectionStyles, "button")}>
              <span {...visualCmsFieldAttrs(visualPreview, primaryButtonKey, "button")}>{value(maps.content, primaryButtonKey, "Browse products")}</span>
              <ArrowRight size={17} />
            </Link>
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800" style={mergeVisualStyle(undefined, { color: sectionStyles?.buttonBackgroundColor })}>
              <span {...visualCmsFieldAttrs(visualPreview, secondaryButtonKey, "button")}>{value(maps.content, secondaryButtonKey, "Open admin")}</span>
            </Link>
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-slate-100">
          <Image src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80" alt="Packed ecommerce orders on a fulfillment table" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

export function PageHeaderManagedSection({ pageKey, section, maps, visualPreview, fallbackEyebrow, fallbackTitle, fallbackSubtitle }: { pageKey: string; section: ManagedSection; maps: SectionMaps; visualPreview: boolean; fallbackEyebrow: string; fallbackTitle: string; fallbackSubtitle?: string }) {
  const sectionStyles = maps.styles?.[section.id];
  const sectionLayout = maps.layout?.[section.id];
  const eyebrowKey = sectionFieldKey(section, "eyebrow");
  const titleKey = sectionFieldKey(section, "title");
  const subtitleKey = sectionFieldKey(section, "subtitle");
  return (
    <div className="mb-6" style={visualCmsSectionStyle(sectionStyles, sectionLayout)} {...visualCmsSectionAttrs(visualPreview, pageKey, section.id)}>
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700" style={visualCmsFieldStyle(sectionStyles, "text")} {...visualCmsFieldAttrs(visualPreview, eyebrowKey, "text")}>{value(maps.content, eyebrowKey, fallbackEyebrow)}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950" style={visualCmsFieldStyle(sectionStyles, "heading")} {...visualCmsFieldAttrs(visualPreview, titleKey, "heading")}>{value(maps.content, titleKey, fallbackTitle)}</h1>
      {fallbackSubtitle !== undefined ? <p className="mt-2 max-w-2xl text-slate-600" style={visualCmsFieldStyle(sectionStyles, "text")} {...visualCmsFieldAttrs(visualPreview, subtitleKey, "text")}>{value(maps.content, subtitleKey, fallbackSubtitle)}</p> : null}
    </div>
  );
}
