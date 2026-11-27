import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Configurações", "Gerencie as configurações da loja.", "/configuracoes", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
