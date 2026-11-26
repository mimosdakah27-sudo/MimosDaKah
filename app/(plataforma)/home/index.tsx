import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FeaturedCarousel } from "@/components/site/featured-carousel";
import { ProductCard } from "@/components/site/product-card";
import { StorefrontHero } from "./components/storefront-hero";
import { getHomeContent, parseCatalogPage } from "./hooks/use-home-data";
import { PAGE_SIZE } from "./services/get-home-data";
import styles from "./storefront.module.css";

const grid = "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-6";
const pageHref = (page: number) => page === 1 ? "/#produtos" : `/?pagina=${page}#produtos`;

function CatalogLoading() {
  return (
    <div role="status" aria-label="Carregando catálogo">
      <section className={styles.section} id="produtos" aria-hidden="true">
        <div className={styles.sectionHead}><h2 className={styles.sectionTitle}>Catálogo de presentes</h2></div>
        <div className={grid}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-square rounded-xl bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pagination({ page, total }: { page: number; total: number }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages < 2) return null;

  const button = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-brand-control px-3.5 text-sm font-semibold hover:bg-brand-tint";

  return (
    <nav aria-label="Paginação do catálogo" className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-5">
      {page > 1 && (
        <Link href={pageHref(page - 1)} rel="prev" prefetch={false} className={button}>
          <ChevronLeft size={16} aria-hidden="true" /> Anterior
        </Link>
      )}
      <span aria-current="page" className={styles.count}>Página {page} de {pages}</span>
      {page < pages && (
        <Link href={pageHref(page + 1)} rel="next" prefetch={false} className={button}>
          Próxima <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

type HomeContent = ReturnType<typeof getHomeContent>;

async function Highlights({ catalog, featured }: HomeContent) {
  const products = await featured;
  const cover = products.find((product) => product.imagem_url)
    ?? (await catalog)?.products.find((product) => product.imagem_url);
  const highlights = products.filter((product) => product.id !== cover?.id);

  return (
    <>
      <StorefrontHero product={cover} />

      {highlights.length > 0 && (
        <section className={styles.section} aria-labelledby="destaques-title">
          <div className={styles.sectionHead}>
            <h2 id="destaques-title" className={styles.sectionTitle}>Escolhas da Kah</h2>
          </div>
          <FeaturedCarousel products={highlights} />
        </section>
      )}
    </>
  );
}

async function CatalogContent({ page, pending }: { page: number; pending: HomeContent["catalog"] }) {
  const catalog = await pending;
  if (page > 1 && catalog && !catalog.products.length) redirect(pageHref(1));
  const total = catalog?.total ?? 0;

  return (
    <section id="produtos" className={styles.section} aria-labelledby="catalogo-title">
      <div className={styles.sectionHead}>
        <h2 id="catalogo-title" className={styles.sectionTitle}>Catálogo de presentes</h2>
        {total > 0 && <span className={styles.count}>{total} {total === 1 ? "produto" : "produtos"}</span>}
      </div>

      {!catalog ? (
        <div className="space-y-3 rounded-2xl bg-brand-surface px-6 py-12 text-center">
          <p>O catálogo está temporariamente indisponível.</p>
          <a href={pageHref(page)} className="inline-block font-medium text-brand-action underline underline-offset-4">Tentar novamente</a>
        </div>
      ) : catalog.products.length === 0 ? (
        <p className="rounded-2xl bg-brand-surface px-6 py-12 text-center">Ainda não há produtos disponíveis no catálogo.</p>
      ) : (
        <>
          <ul className={grid}>
            {catalog.products.map((product) => <li key={product.id}><ProductCard product={product} /></li>)}
          </ul>
          <Pagination page={page} total={total} />
        </>
      )}
    </section>
  );
}

export async function HomePage({ searchParams }: { searchParams?: Promise<{ pagina?: string | string[] }> }) {
  const page = parseCatalogPage((await searchParams)?.pagina);

  const content = getHomeContent(page);

  return (
    <div className={styles.storefront}>
      <Suspense fallback={<StorefrontHero loading />}>
        <Highlights {...content} />
      </Suspense>
      <Suspense key={page} fallback={<CatalogLoading />}>
        <CatalogContent page={page} pending={content.catalog} />
      </Suspense>
    </div>
  );
}
