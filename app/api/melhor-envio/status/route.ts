import { NextResponse } from "next/server";
import { canManageShipping } from "@/lib/actions/melhor-envio";
import { oauthConfig } from "@/lib/melhor-envio-config";
import { calculateMelhorEnvioShipment, ShippingAuthorizationExpired } from "@/lib/melhor-envio-oauth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await canManageShipping())) return new NextResponse(null, { status: 403 });
  const { missing, callback } = oauthConfig(request);
  const staticToken = process.env.MELHOR_ENVIO_ACCESS_TOKEN?.trim();
  const reply = (status: "connected" | "disconnected" | "unknown") =>
    NextResponse.json({ status, missing, callback, staticToken: Boolean(staticToken) },
      { headers: { "Cache-Control": "no-store" } });
  try {
    // Uma cotação de referência verifica a permissão efetivamente usada pela loja.
    const { data: store } = await supabaseAdmin.from("store_config").select("email,zip_code").eq("id", true).maybeSingle();
    if (!store?.email || !store.zip_code) return reply("unknown");
    const zip = store.zip_code.replace(/\D/g, "");
    const response = await calculateMelhorEnvioShipment(store.email, {
      from: { postal_code: zip }, to: { postal_code: zip },
      products: [{ id: "verificacao", width: 16, height: 10, length: 20, weight: 1, quantity: 1, insurance_value: 0 }],
    });
    if (response.status === 401) return reply("disconnected");
    if (!response.ok) return reply("unknown");
    return reply(Array.isArray(await response.json()) ? "connected" : "unknown");
  } catch (error) {
    return reply(error instanceof ShippingAuthorizationExpired ? "disconnected" : "unknown");
  }
}
