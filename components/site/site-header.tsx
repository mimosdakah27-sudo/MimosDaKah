"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Phone,
  Settings,
  Shield,
  ShoppingBag,
  User as UserIcon,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useCart, useCartCount } from "@/lib/store/cart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "./notificatio-bell";

export function SiteHeader() {
  const setOpen = useCart((s) => s.setOpen);
  const count = useCartCount();

  const { user, isAdmin, loading } = useAuth();
  const { config } = useStore();

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    const supabase = supabaseBrowser() as any;

    await supabase.auth.signOut();

    queryClient.clear();

    toast.success("Sessão encerrada");

    setShowLogoutDialog(false);

    router.push("/");
    router.refresh();
  };

  const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="px-3 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between gap-2">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center relative border border-border/40">
              <Image
                src="/logo.png"
                alt={config?.name || "Logo"}
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>

            <span className="font-bold text-sm sm:text-xl tracking-tight block truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
              {config?.name || "MimosDaKah"}
            </span>
          </Link>

          {/* AÇÕES DO HEADER */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* CONTATO - TODOS PODEM VER */}
            <Link
              href="/contato"
              aria-label="Contato"
              className="h-9 sm:h-10 w-9 sm:w-auto sm:px-4 rounded-xl hover:bg-secondary transition-smooth flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
            >
              <Phone className="h-4 w-4" />

              <span className="hidden sm:inline">
                Contato
              </span>
            </Link>

            {/* 
              NOTIFICAÇÕES
              Só aparecem para usuários autenticados.
            */}
            {user && <NotificationBell userId={user.id} />}

            {/* CARREGAMENTO DA AUTENTICAÇÃO */}
            {loading ? (
              <div className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl bg-secondary/50 animate-pulse" />
            ) : user ? (
              <>
                {/* =========================
                    DESKTOP (LOGADO)
                ========================= */}
                <div className="hidden md:flex items-center gap-2">
                  {/* ÁREA EXCLUSIVA DO ADMIN */}
                  {isAdmin && (
                    <>
                      <Link
                        href="/configuracoes"
                        aria-label="Configurações"
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                          pathname === "/configuracoes"
                            ? "bg-accent"
                            : "hover:bg-accent"
                        }`}
                      >
                        <Settings className="h-5 w-5" />
                      </Link>

                      <Link
                        href="/admin"
                        className={`h-10 px-4 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors ${
                          pathname === "/admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        <Shield className="h-4 w-4" />

                        <span>Admin</span>
                      </Link>
                    </>
                  )}

                  {/* PERFIL - USUÁRIO LOGADO */}
                  <Link
                    href="/perfil"
                    aria-label="Meu Perfil"
                    className={`h-10 w-10 rounded-xl transition-colors flex items-center justify-center ${
                      pathname === "/perfil"
                        ? "bg-accent"
                        : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Link>

                  {/* SAIR */}
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    aria-label="Encerrar sessão"
                    className="h-10 w-10 rounded-xl bg-secondary hover:bg-accent transition-colors flex items-center justify-center"
                  >
                    <LogOut className="h-5 w-5 text-destructive" />
                  </button>
                </div>

                {/* =========================
                    MOBILE (LOGADO)
                ========================= */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Menu do usuário"
                      className="h-9 w-auto px-2 rounded-xl bg-secondary hover:bg-accent transition-smooth flex items-center justify-center gap-1"
                    >
                      <UserIcon className="h-4 w-4" />

                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-56"
                    >
                      {/* ADMIN */}
                      {isAdmin && (
                        <>
                          <DropdownMenuItem
                            onClick={() => router.push("/admin")}
                          >
                            <Shield className="mr-2 h-4 w-4" />

                            Admin
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              router.push("/configuracoes")
                            }
                          >
                            <Settings className="mr-2 h-4 w-4" />

                            Configurações
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* PERFIL */}
                      <DropdownMenuItem
                        onClick={() => router.push("/perfil")}
                      >
                        <UserIcon className="mr-2 h-4 w-4" />

                        Perfil
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* SAIR */}
                      <DropdownMenuItem
                        onClick={() =>
                          setShowLogoutDialog(true)
                        }
                        className="text-destructive focus:text-destructive font-medium"
                      >
                        <LogOut className="mr-2 h-4 w-4" />

                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                {/* =========================
                    DESKTOP (NÃO LOGADO) - Botões Perfil e Entrar separados
                ========================= */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/perfil"
                    aria-label="Meu Perfil"
                    className={`h-10 w-10 rounded-xl transition-colors flex items-center justify-center ${
                      pathname === "/perfil"
                        ? "bg-accent"
                        : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Link>

                  <Link
                    href={loginUrl}
                    className="h-10 px-4 rounded-xl bg-secondary hover:bg-accent transition-colors flex items-center font-medium text-sm gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Link>
                </div>

                {/* =========================
                    MOBILE (NÃO LOGADO)
                ========================= */}
                <div className="md:hidden flex items-center gap-1">
                  <Link
                    href="/perfil"
                    aria-label="Meu Perfil"
                    className={`h-9 w-9 rounded-xl transition-colors flex items-center justify-center ${
                      pathname === "/perfil"
                        ? "bg-accent"
                        : "bg-secondary hover:bg-accent"
                    }`}
                  >
                    <UserIcon className="h-4 w-4" />
                  </Link>

                  <Link
                    href={loginUrl}
                    className="h-9 px-3 rounded-xl bg-secondary hover:bg-accent transition-colors flex items-center font-medium text-xs"
                  >
                    Entrar
                  </Link>
                </div>
              </>
            )}

            {/* CARRINHO - TODOS PODEM USAR */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir carrinho de compras"
              className="relative h-9 sm:h-10 w-9 sm:w-10 rounded-xl bg-secondary hover:bg-accent transition-smooth flex items-center justify-center"
            >
              <ShoppingBag className="h-4 sm:h-5 w-4 sm:w-5" />

              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          MODAL DE LOGOUT
      ========================= */}
      <Dialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
      >
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <LogOut className="h-6 w-6" />
            </div>

            <DialogTitle>
              Deseja realmente sair?
            </DialogTitle>

            <DialogDescription>
              Você precisará fazer login novamente para acessar
              os recursos da sua conta.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setShowLogoutDialog(false)
              }
              className="flex-1"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              Sim, sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}