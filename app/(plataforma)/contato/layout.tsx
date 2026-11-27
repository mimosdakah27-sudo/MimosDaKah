import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Contato", "Fale com a Mimos da Kah sobre produtos personalizados, pedidos e entregas.", "/contato");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
