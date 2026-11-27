import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Meus endereços", "Gerencie os endereços de entrega da sua conta.", "/endereco", undefined, false);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
