import "server-only";

export function melhorEnvioUrl() {
  return (process.env.MELHOR_ENVIO_URL?.trim() || "https://melhorenvio.com.br").replace(/\/+$/, "");
}

export function requestOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const host = request.headers.get("host");
  if (configured && host && host === new URL(configured).host) {
    return new URL(configured).origin;
  }
  return new URL(request.url).origin;
}

export function oauthConfig(request: Request) {
  const origin = requestOrigin(request);
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim() || origin;
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID?.trim();
  const secret = process.env.MELHOR_ENVIO_CLIENT_SECRET?.trim();
  const missing = [
    ...(!clientId ? ["MELHOR_ENVIO_CLIENT_ID"] : []),
    ...(!secret ? ["MELHOR_ENVIO_CLIENT_SECRET"] : []),
  ];
  return {
    clientId, secret, missing,
    callback: new URL("/api/melhor-envio/callback", base).href,
  };
}
