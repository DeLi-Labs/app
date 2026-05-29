import { INDUSTRIES } from "~~/utils/industryData";

export type PatentCategory = (typeof INDUSTRIES)[number]["parentCategory"];

export const PATENT_CATEGORY_COLORS = {
  Medicine: {
    start: "var(--deli-cat-medicine-from)",
    end: "var(--deli-cat-medicine-to)",
  },
  Engineering: {
    start: "var(--deli-cat-engineering-from)",
    end: "var(--deli-cat-engineering-to)",
  },
  Technology: {
    start: "var(--deli-cat-technology-from)",
    end: "var(--deli-cat-technology-to)",
  },
  Energy: {
    start: "var(--deli-cat-energy-from)",
    end: "var(--deli-cat-energy-to)",
  },
  Resources: {
    start: "var(--deli-cat-resources-from)",
    end: "var(--deli-cat-resources-to)",
  },
  Creative: {
    start: "var(--deli-cat-creative-from)",
    end: "var(--deli-cat-creative-to)",
  },
} satisfies Record<PatentCategory, { start: string; end: string }>;

export function getPatentCategoryColors(category: PatentCategory) {
  return PATENT_CATEGORY_COLORS[category] ?? PATENT_CATEGORY_COLORS.Technology;
}

export function getPatentCategoryStroke(category: PatentCategory): string {
  return `var(--deli-cat-stroke-${category.toLowerCase()})`;
}
