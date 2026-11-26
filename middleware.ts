import { NextRequest, NextResponse } from "next/server";
import { createClientForMiddleware } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // Visitantes do catálogo não precisam aguardar uma verificação remota de sessão.
  const protectedRoute = ["/admin", "/configuracoes", "/endereco"].some(
    route => path === route || path.startsWith(route + "/")
  );
  if (!protectedRoute && !req.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))) {
    return response;
  }

  const supabase = createClientForMiddleware(req, response);

  // 1. VERIFICAÇÃO DE SESSÃO
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. USUÁRIO LOGADO NÃO PODE ACESSAR PÁGINAS DE AUTENTICAÇÃO
  const authRoutes = [
    "/login",
    "/cadastro",
    "/forgot-password",
  ];

  if (
    user &&
    authRoutes.some((route) => path.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. ROTAS PÚBLICAS
  // Podem ser acessadas sem login.
  const publicRoutes = [
    "/callback",
    "/produto",
    "/checkout",
    "/sucesso",
    "/perfil",
  ];

  if (
    publicRoutes.some((route) => path.startsWith(route))
  ) {
    return response;
  }

  // 4. ROTAS PRIVADAS
  // Tudo que estiver aqui exige autenticação.
  if (!user) {
    if (
      path.startsWith("/admin") ||
      path.startsWith("/configuracoes") ||
      path.startsWith("/endereco")
    ) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};