import Link from "next/link";
import { ShoppingBag, Sparkles, HeartHandshake } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[55%_45%]">
      {/* Lado Esquerdo: Branding e Diferenciais */}
      <div className="relative hidden flex-col items-center justify-center bg-brand-action p-12 text-brand-action-foreground lg:flex">
        {/* Grid decorativo de fundo */}
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl">
          <Link href="/" className="mb-12 inline-flex items-center gap-3 rounded-lg">
            <div className="rounded-xl bg-card p-2.5">
              <ShoppingBag className="h-9 w-9 text-primary" />
            </div>
            <span className="text-4xl font-extrabold tracking-tight">Mimos da Kah</span>
          </Link>

          <h2 className="mb-8 text-3xl font-semibold leading-tight">
            Personalizando com amor cada momento especial da sua vida.
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/5 p-6">
              <Sparkles className="h-10 w-10 shrink-0 text-primary-foreground" />
              <div>
                <h3 className="text-lg font-bold">Feito Sob Medida</h3>
                <p className="text-sm text-primary-foreground">Lembrancinhas, bolos, camisetas estampadas e crachás únicos criados especialmente para você.</p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/5 p-6">
              <HeartHandshake className="h-10 w-10 shrink-0 text-primary-foreground" />
              <div>
                <h3 className="text-lg font-bold">Atendimento Dedicado</h3>
                <p className="text-sm text-primary-foreground">Cuidado em cada detalhe e carinho na entrega de todas as nossas variedades e mimos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background flex flex-col justify-center px-6 sm:px-12 lg:px-16">
        {children}
      </div>
    </div>
  )
}