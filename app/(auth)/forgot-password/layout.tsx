import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Recuperar senha", "Solicite a recuperação de acesso à sua conta.", "/forgot-password", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
