import { ArrowDown, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CatalogProduct } from "../types/product-type";
import styles from "../storefront.module.css";
import { CatalogImage } from "@/components/site/catalog-image";

export function StorefrontHero({ product, loading }: { product?: CatalogProduct; loading?: boolean }) {
  return (
    <section aria-labelledby="vitrine-title" className={styles.hero}>
      <div className={styles.intro}>
        <h1 id="vitrine-title" className={styles.title}>Presentes com a cara de quem você ama.</h1>
        <p className={styles.description}>
          De lembrancinhas a peças personalizadas, encontre um mimo para celebrar quem faz parte da sua história.
        </p>
        <a href="#produtos" className={styles.catalogLink}>
          Explorar catálogo <ArrowDown size={17} aria-hidden="true" />
        </a>
      </div>

      <div className={styles.photoField}>
        {loading ? (
          <div className={styles.photoCard} aria-hidden="true">
            <div className={styles.heroImage} />
            <div className={styles.caption} />
          </div>
        ) : product ? (
          <Link href={`/produto/${product.id}`} prefetch={false} className={styles.photoCard}>
            <div className={styles.heroImage}>
              <CatalogImage
                src={product.imagem_url}
                alt=""
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 34vw, (min-width: 480px) 300px, 60vw"
                className="object-cover"
                priority
              />
            </div>
            <div className={styles.caption}>
              <span>{product.nome}</span><ArrowUpRight size={18} aria-hidden="true" />
            </div>
          </Link>
        ) : (
          <div className={styles.brandArt}>
            <Image src="/og-image.jpg" alt="Mimos da Kah" fill priority sizes="(min-width: 768px) 380px, 66vw" className="object-contain" />
          </div>
        )}
      </div>
    </section>
  );
}
