"use client";

import {
  Building2,
  Globe,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCEP, maskPhone, unmask } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";

import { useStoreConfig } from "./hooks/use-store-config";
import { StoreConfig, storeConfigSchema } from "./types/store-settings";

export default function ConfiguracoesPage() {
  const { config, isLoading, save, isConfigured } = useStoreConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreConfig>({
    resolver: yupResolver(storeConfigSchema),
    mode: "onChange",
  });

  useEffect(() => {
    fetch("/api/melhor-envio/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setIsConnected(data.connected))
      .catch(() => setIsConnected(false));
  }, []);

  useEffect(() => {
    if (config) reset(config);
    if (!isLoading && !isConfigured) setIsEditing(true);
  }, [config, reset, isLoading, isConfigured]);

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  return (
    <div className="mx-auto space-y-6">
      {/* Status Melhor Envio */}
      {!isLoading && isConfigured && (
        <div
          className={`border p-5 rounded-xl shadow-sm ${isConnected ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Package size={20} /> Melhor Envio
              </h2>
              <p className="text-xs sm:text-sm mt-1 text-slate-600">
                {isConnected === null
                  ? "Verificando..."
                  : isConnected
                    ? "Loja conectada com sucesso."
                    : "Loja desconectada da API."}
              </p>
            </div>
            <Button
              render={
                <a href="/api/melhor-envio/login">
                  {isConnected ? "Reconectar" : "Conectar Agora"}
                </a>
              }
              nativeButton={false}
              className="w-full sm:w-auto"
            ></Button>
          </div>
        </div>
      )}

      {/* Título e Botão Editar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Configurações da Loja
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as informações públicas e logística.
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto gap-2"
          >
            <Pencil size={18} /> Editar Informações
          </Button>
        )}
      </div>

      {/* Card Principal */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 md:p-8 shadow-sm">
        {!isEditing ? (
          <div className="space-y-8 md:space-y-12">
            <div className="border-b border-border/50 pb-6">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight break-words">
                {config?.name}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-8 md:gap-12">
              <Section
                title="Informações de Contato"
                icon={<Phone size={18} />}
              >
                <InfoItem
                  label="Email"
                  value={config?.email}
                  icon={<Mail size={18} />}
                />
                <InfoItem
                  label="Telefone"
                  value={maskPhone(config?.phone || "")}
                  icon={<Phone size={18} />}
                />
              </Section>
              <Section title="Localização" icon={<MapPin size={18} />}>
                <InfoItem
                  label="Endereço"
                  value={config?.address}
                  icon={<Building2 size={18} />}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Cidade/UF"
                    value={
                      config?.city
                        ? `${config.city} / ${config.state}`
                        : undefined
                    }
                    icon={<Globe size={18} />}
                  />
                  <InfoItem
                    label="CEP"
                    value={maskCEP(config?.zip_code || "")}
                    icon={<Hash size={18} />}
                  />
                </div>
              </Section>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((d) => {
              save({
                ...d,
                phone: unmask(d.phone),
                zip_code: unmask(d.zip_code),
              });
              setIsEditing(false);
            })}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary text-sm uppercase tracking-wider">
                <Truck size={16} /> Métodos de Entrega
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-xl">
                <Controller
                  name="allow_local_pickup"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Retirada na Loja
                    </label>
                  )}
                />
                <Controller
                  name="allow_local_delivery"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Entrega Própria
                    </label>
                  )}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 space-y-6">
              <h3 className="font-semibold flex items-center gap-2 text-primary text-sm uppercase tracking-wider">
                <Building2 size={16} /> Dados de Identidade
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <ControlledInput
                  control={control}
                  name="name"
                  label="Nome da Loja"
                  errors={errors}
                />
                <ControlledInput
                  control={control}
                  name="email"
                  label="Email"
                  errors={errors}
                />
                <ControlledInput
                  control={control}
                  name="phone"
                  label="Telefone"
                  errors={errors}
                  mask={maskPhone}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 space-y-6">
              <h3 className="font-semibold flex items-center gap-2 text-primary text-sm uppercase tracking-wider">
                <MapPin size={16} /> Dados de Localização
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <ControlledInput
                  control={control}
                  name="city"
                  label="Cidade"
                  errors={errors}
                />
                <ControlledInput
                  control={control}
                  name="state"
                  label="UF"
                  errors={errors}
                  className="uppercase"
                />
                <ControlledInput
                  control={control}
                  name="zip_code"
                  label="CEP"
                  errors={errors}
                  mask={maskCEP}
                />
              </div>
              <ControlledInput
                control={control}
                name="address"
                label="Endereço Completo"
                errors={errors}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  setIsEditing(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}{" "}
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ControlledInput({
  control,
  name,
  label,
  errors,
  mask,
  className,
}: any) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <div className="space-y-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            value={mask ? mask(value || "") : value || ""}
            onChange={(e) =>
              onChange(mask ? unmask(e.target.value) : e.target.value)
            }
            className={className}
          />
          {errors[name] && (
            <p className="text-xs text-red-500 font-bold">
              {errors[name]?.message as string}
            </p>
          )}
        </div>
      )}
    />
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div className="flex gap-3 items-center">
      <div className="p-2 bg-secondary rounded-lg text-primary">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-semibold text-sm">{value || "Não informado"}</p>
      </div>
    </div>
  );
}
