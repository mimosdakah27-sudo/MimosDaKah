"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

type Connection = {
  status: "connected" | "disconnected" | "unknown";
  missing: string[];
  callback: string;
  staticToken: boolean;
};

const feedback: Record<string, string> = {
  sucesso: "Autorização recebida e salva.",
  config: "Complete a configuração do aplicativo no servidor.",
  cancelada: "Autorização cancelada. Você pode conectar a loja novamente.",
  sessao: "A sessão de autorização expirou. Inicie uma nova conexão.",
  falha: "O Melhor Envio não concluiu a autorização. Confira as credenciais e a URL de retorno na Área Dev.",
  banco: "A autorização foi recebida, mas não foi possível salvá-la. Confira o acesso do servidor ao Supabase.",
  url: "A URL pública configurada é diferente deste site. Atualize NEXT_PUBLIC_BASE_URL para o endereço público atual e cadastre a mesma URL de retorno no aplicativo do Melhor Envio.",
};

export function MelhorEnvioConnection() {
  const [connection, setConnection] = useState<Connection>();
  const [message, setMessage] = useState("");
  const [attempt, retry] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setMessage(feedback[new URLSearchParams(location.search).get("conexao") || ""] || "");
    setFailed(false);
    setConnection(undefined);
    fetch("/api/melhor-envio/status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (!controller.signal.aborted) setConnection(result);
      }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  const connected = connection?.status === "connected";
  const unknown = failed || connection?.status === "unknown";
  const callbackOrigin = connection ? new URL(connection.callback).origin : "";
  const wrongOrigin = Boolean(connection && callbackOrigin !== window.location.origin);
  return (
    <section className="space-y-3 rounded-[var(--panel-radius)] border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><Package size={20} /> Melhor Envio</h2>
          <p role="status" className="mt-1 text-sm">{unknown ? "Não foi possível verificar a conexão." :
            !connection ? "Verificando conexão…" : connected ? "Loja conectada para calcular fretes." : "Loja desconectada."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unknown && <Button variant="outline" onClick={() => retry(attempt + 1)}>Verificar novamente</Button>}
          {connection && !connection.staticToken && !connection.missing.length && !wrongOrigin &&
            <Button nativeButton={false} render={<a href="/api/melhor-envio/login" />}>
              {connected ? "Reconectar" : "Conectar ao Melhor Envio"}
            </Button>}
        </div>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {wrongOrigin && <p role="alert" className="rounded-lg bg-muted p-3 text-sm">
        A conexão usa {callbackOrigin}, mas você está acessando {window.location.origin}. Atualize NEXT_PUBLIC_BASE_URL no servidor e cadastre a URL de retorno exibida abaixo no aplicativo do Melhor Envio.
      </p>}
      {connection?.staticToken ? <p className="text-sm text-muted-foreground">A cotação usa o token configurado no servidor em MELHOR_ENVIO_ACCESS_TOKEN.</p> :
        connection && <>
          {connection.missing.length > 0 && <p className="rounded-lg bg-muted p-3 text-sm">
            Para habilitar a conexão, cadastre no servidor as credenciais da Área Dev do Melhor Envio: <strong>{connection.missing.join(" e ")}</strong>.
          </p>}
          <p className="break-all text-xs text-muted-foreground">URL de retorno para cadastrar no aplicativo: <code>{connection.callback}</code></p>
        </>}
    </section>
  );
}
