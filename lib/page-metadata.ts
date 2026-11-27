import type { Metadata } from "next";

export function pageMetadata(title: string, description: string, path: string, image = "/og-image.jpg", index = true): Metadata {
  const images = [{ url: image, alt: title }];
  const socialTitle = `${title} | Mimos da Kah`;
  return {
    title, description,
    robots: index ? undefined : { index: false, follow: false },
    openGraph: { type: "website", locale: "pt_BR", siteName: "Mimos da Kah", url: path, title: socialTitle, description, images },
    twitter: { card: "summary_large_image", title: socialTitle, description, images },
  };
}
