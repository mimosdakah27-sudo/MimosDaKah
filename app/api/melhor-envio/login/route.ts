import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { canManageShipping } from "@/lib/actions/melhor-envio";
import { melhorEnvioUrl, oauthConfig, requestOrigin } from "@/lib/melhor-envio-config";

export async function GET(request: Request) {
  if (!(await canManageShipping())) return new NextResponse(null, { status: 403 });
  const { clientId, missing, callback } = oauthConfig(request);
  if (!clientId || missing.length) {
    return NextResponse.redirect(new URL("/configuracoes?conexao=config", requestOrigin(request)));
  }
  // OAuth must return to the same origin that created the state cookie.
  const loginUrl = new URL("/api/melhor-envio/login", callback);
  if (loginUrl.origin !== requestOrigin(request)) {
    return NextResponse.redirect(new URL("/configuracoes?conexao=url", requestOrigin(request)));
  }

  const state = randomUUID();
  const url = new URL("/oauth/authorize", melhorEnvioUrl());
  url.search = new URLSearchParams({
    client_id: clientId, redirect_uri: callback, response_type: "code",
    scope: "shipping-calculate", state,
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("shipping-oauth-state", state, {
    httpOnly: true, secure: loginUrl.protocol === "https:", sameSite: "lax",
    path: "/api/melhor-envio/callback", maxAge: 600,
  });
  return response;
}
