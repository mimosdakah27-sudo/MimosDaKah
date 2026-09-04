"use client";

import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { maskPhone } from "@/lib/utils";

import { signupUser } from "./services/auth-service";
import {
  SignupFormData,
  signupSchema,
} from "./types/auth";

function getSafeRedirect(value: string | null): string {
  if (!value) {
    return "/";
  }

  // Permite somente rotas internas.
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default function SignupForm() {
  const [showPassword, setShowPassword] =
    useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = getSafeRedirect(
    searchParams.get("redirect")
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: signupUser,

    onSuccess: () => {
      toast.success(
        "Conta criada e sessão iniciada com sucesso!"
      );

      // Retorna exatamente para o local de onde
      // o cadastro foi iniciado.
      router.replace(redirectTo);
      router.refresh();
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const maskedValue = maskPhone(
      e.target.value
    );

    setValue("phone", maskedValue, {
      shouldValidate: true,
    });
  };

  const loginUrl =
    redirectTo !== "/"
      ? `/login?redirect=${encodeURIComponent(
          redirectTo
        )}`
      : "/login";

  return (
    <div className="w-full max-w-sm mx-auto space-y-10 py-10">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Criar conta
        </h1>

        <p className="text-muted-foreground">
          Cadastre-se para gerenciar seus pedidos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) =>
          mutation.mutate(data)
        )}
        className="space-y-6"
      >
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome Completo
          </Label>

          <Input
            id="name"
            placeholder="Gabriel Lingnau"
            {...register("name")}
          />

          {errors.name && (
            <p className="text-xs font-bold text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="exemplo@email.com"
            {...register("email")}
          />

          {errors.email && (
            <p className="text-xs font-bold text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Telefone
          </Label>

          <Input
            id="phone"
            type="tel"
            placeholder="(00) 99999-9999"
            {...register("phone", {
              onChange: handlePhoneChange,
            })}
          />

          {errors.phone && (
            <p className="text-xs font-bold text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Senha
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="••••••••"
              className="pr-10"
              {...register("password")}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              aria-label={
                showPassword
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs font-bold text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            "Criar conta agora"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Já possui uma conta?{" "}

        <Link
          href={loginUrl}
          className="font-bold text-primary hover:underline"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}