import { getFeaturedProducts, getProductPage, PAGE_SIZE } from "../services/get-home-data";

export function parseCatalogPage(value?: string | string[]) {
  const page = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : 1;
  return page >= 1 && page <= Math.floor(2147483647 / PAGE_SIZE) ? page : 1;
}

export function getHomeContent(page: number) {
  return {
    catalog: getProductPage(page).catch(() => {
      console.error("Falha ao carregar o catálogo.");
      return null;
    }),
    featured: getFeaturedProducts().catch(() => {
      console.error("Falha ao carregar os destaques.");
      return [];
    }),
  };
}
