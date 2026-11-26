import { NextRequest, NextResponse } from "next/server";
import { canManageShipping } from "@/lib/actions/melhor-envio";
import { melhorEnvioUrl, oauthConfig, requestOrigin } from "@/lib/melhor-envio-config";
import { readTokenPair } from "@/lib/melhor-envio-oauth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  if (!(await canManageShipping())) return new NextResponse(null, { status: 403 });
  const { searchParams } = request.nextUrl;
  const expected = request.cookies.get("shipping-oauth-state")?.value;
  function finish(result: string) {
    const redirect = NextResponse.redirect(new URL("/configuracoes?conexao=" + result, requestOrigin(request)));
    redirect.cookies.set("shipping-oauth-state", "", { path: "/api/melhor-envio/callback", maxAge: 0 });
    return redirect;
  }
  if (!expected || searchParams.get("state") !== expected) return finish("sessao");
  const code = searchParams.get("code");
  if (!code) return finish("cancelada");
  const { clientId, secret, missing, callback } = oauthConfig(request);
  if (missing.length) return finish("config");
  try {
    const response = await fetch(melhorEnvioUrl() + "/oauth/token", {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code", client_id: clientId,
        client_secret: secret, redirect_uri: callback, code }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return finish("falha");
    const pair = readTokenPair(await response.json());
    const { error } = await supabaseAdmin.from("integrations").upsert({
      singleton_id: true, provider: "melhor_envio", created_at: new Date().toISOString(), ...pair,
    }, { onConflict: "singleton_id" });
    return finish(error ? "banco" : "sucesso");
  } catch {
    return finish("falha");
  }
}
