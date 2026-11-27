import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Redefinir senha", "Escolha uma nova senha para sua conta.", "/reset-password", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
