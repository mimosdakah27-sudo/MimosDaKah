import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Minha conta", "Acompanhe os seus pedidos e orçamentos.", "/perfil", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
