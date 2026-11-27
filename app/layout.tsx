import type { Metadata } from "next";
import { Outfit, Public_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { CartDrawer } from "@/components/site/cart-drawer";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/auth-provider";
import QueryProvider from "@/providers/query-provider";

import "./styles/globals.css";
import { StoreProvider } from "@/providers/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip"

const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://mimosdakah.com.br"),

  title: {
    default: "Mimos da Kah — Lembrancinhas, Camisetas Personalizadas e Variedades",
    template: "%s | Mimos da Kah",
  },

  description:
    "Encontre lembrancinhas exclusivas, bolos deliciosos, crachás personalizados, camisetas estampadas e mimos especiais para todas as ocasiões.",

  keywords: [
    "Mimos da Kah",
    "lembrancinhas personalizadas",
    "camisetas estampadas",
    "crachás",
    "bolos",
    "presentes criativos",
    "variedades",
    "personalizados",
  ],

  authors: [{ name: "Mimos da Kah" }],
  creator: "Mimos da Kah",
  publisher: "Mimos da Kah",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Mimos da Kah",
    title: "Mimos da Kah — Lembrancinhas, Camisetas Personalizadas e Variedades",
    description:
      "Transforme momentos em lembranças inesquecíveis! Confira nossas opções de lembrancinhas, bolos, camisetas com estampas exclusivas e muito mais.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 800,
        alt: "Mimos da Kah - Presentes, Personalizados e Variedades",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mimos da Kah — Lembrancinhas e Personalizados",
    description:
      "Lembrancinhas, camisetas estampadas, crachás e mimos criativos para você ou para presentear.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/brand-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("system", "scroll-smooth", "font-sans", outfit.variable, publicSansHeading.variable)}>
      <head>
        {/* Otimização de LCP: Conecta antecipadamente ao Supabase para carregar imagens e dados mais rápido */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <StoreProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
              <CartDrawer />
              <WhatsAppFab />
              <Toaster richColors position="top-left" closeButton />
            </StoreProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}