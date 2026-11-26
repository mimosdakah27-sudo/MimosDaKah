import "server-only";
import type { Database } from "@/types/database";
import { melhorEnvioUrl } from "@/lib/melhor-envio-config";

type Credential = Pick<Database["public"]["Tables"]["integrations"]["Row"],
  "refresh_token" | "expires_at" | "created_at"> & { access_token: string };

export class ShippingAuthorizationExpired extends Error {
  constructor() {
    super("É necessário reconectar o Melhor Envio.");
  }
}

function unavailable() {
  return new Error("Não foi possível verificar a autorização do Melhor Envio.");
}

export function readTokenPair(value: unknown) {
  if (!value || typeof value !== "object") throw unavailable();
  const token = value as Record<string, unknown>;
  const seconds = typeof token.expires_in === "number" || typeof token.expires_in === "string"
    ? Number(token.expires_in) : NaN;
  const expiration = new Date(Date.now() + seconds * 1000);
  if (typeof token.access_token !== "string" || !token.access_token.trim() ||
      typeof token.refresh_token !== "string" || !token.refresh_token.trim() ||
      !Number.isSafeInteger(seconds) || !Number.isFinite(expiration.getTime()) || seconds <= 0) {
    throw unavailable();
  }
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: expiration.toISOString(),
  };
}

async function readCredential(): Promise<Credential> {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  const { data, error } = await supabaseAdmin.from("integrations")
    .select("access_token,refresh_token,expires_at,created_at")
    .eq("provider", "melhor_envio")
    .abortSignal(AbortSignal.timeout(8_000))
    .maybeSingle();
  if (error) throw unavailable();
  if (!data?.access_token) throw new ShippingAuthorizationExpired();
  return data;
}

function isExpired(credential: Credential) {
  // Autorizações legadas sem data ainda podem ser testadas na API.
  return credential.expires_at !== null && !(Date.parse(credential.expires_at) > Date.now());
}

async function readReplacement(original: Credential, waitForRotation: boolean) {
  // Outra instância pode ter consumido o refresh token e ainda estar gravando o novo par.
  for (const delay of waitForRotation ? [0, 250, 750, 1500] : [0]) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const current = await readCredential();
    if (current.access_token !== original.access_token && !isExpired(current)) {
      return current.access_token;
    }
  }
  throw new ShippingAuthorizationExpired();
}

async function rotateCredential(original: Credential, email: string) {
  if (!original.refresh_token) throw new ShippingAuthorizationExpired();
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID?.trim();
  const secret = process.env.MELHOR_ENVIO_CLIENT_SECRET?.trim();
  if (!clientId || !secret) throw unavailable();
  const response = await fetch(melhorEnvioUrl() + "/oauth/token", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `Mimos da Kah (${email})`,
    },
    body: JSON.stringify({
      grant_type: "refresh_token", client_id: clientId,
      client_secret: secret, refresh_token: original.refresh_token,
    }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    if (details?.error === "invalid_grant" ||
        (response.status === 401 && details?.error !== "invalid_client")) {
      return readReplacement(original, true);
    }
    throw unavailable();
  }

  const pair = readTokenPair(await response.json());
  const { supabaseAdmin } = await import("@/lib/supabase/admin");
  // Compara apenas metadados: filtros PostgREST fazem parte da URL da requisição.
  // Uma reautorização administrativa ou renovação concorrente tem precedência.
  for (let attempt = 0; attempt < 2; attempt++) {
    let update = supabaseAdmin.from("integrations").update(pair).eq("provider", "melhor_envio");
    update = original.created_at === null
      ? update.is("created_at", null) : update.eq("created_at", original.created_at);
    update = original.expires_at === null
      ? update.is("expires_at", null) : update.eq("expires_at", original.expires_at);
    const { data, error } = await update.select("singleton_id")
      .abortSignal(AbortSignal.timeout(8_000)).maybeSingle();
    if (!error) return data ? pair.access_token : readReplacement(original, false);
    // Repete somente a gravação: o provedor pode já ter consumido o refresh token.
  }
  throw unavailable();
}

const rotations = new Map<string, Promise<string>>();

async function renew(credential: Credential, email: string) {
  if (!credential.refresh_token) throw new ShippingAuthorizationExpired();
  const key = credential.refresh_token;
  const pending = rotations.get(key);
  if (pending) return pending;
  const rotation = rotateCredential(credential, email).finally(() => rotations.delete(key));
  rotations.set(key, rotation);
  return rotation;
}

export async function calculateMelhorEnvioShipment(email: string, shipment: object) {
  const body = JSON.stringify(shipment);
  function calculate(accessToken: string) {
    return fetch(melhorEnvioUrl() + "/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`, Accept: "application/json",
        "Content-Type": "application/json", "User-Agent": `Mimos da Kah (${email})`,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  }
  // O token manual pertence ao operador e não participa do ciclo OAuth.
  const manualToken = process.env.MELHOR_ENVIO_ACCESS_TOKEN?.trim();
  if (manualToken) return calculate(manualToken);

  const credential = await readCredential();
  if (isExpired(credential)) return calculate(await renew(credential, email));
  const response = await calculate(credential.access_token);
  if (response.status !== 401) return response;
  await response.body?.cancel();
  const latest = await readCredential();
  if (latest.access_token !== credential.access_token && !isExpired(latest)) {
    return calculate(latest.access_token);
  }
  return calculate(await renew(latest, email));
}
