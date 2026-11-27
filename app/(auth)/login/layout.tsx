import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Entrar", "Acesse sua conta na Mimos da Kah.", "/login", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
