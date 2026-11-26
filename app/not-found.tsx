import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[75vh] max-w-lg content-center justify-items-center gap-5 px-6 text-center">
      <h1 className="page-title">Página não encontrada</h1>
      <p className="text-brand-muted">Você pode voltar ao catálogo para encontrar seu mimo.</p>
      <Link href="/" className={buttonVariants()}>Ver catálogo</Link>
    </main>
  );
}
