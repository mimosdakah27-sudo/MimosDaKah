import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "checkout_receipt";
const lifetime = 60 * 60 * 24;

function sign(value: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Configuração do pedido indisponível.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

// A fresh, private browser nonce identifies a single attempt, including after a lost response.
export function orderIdForAttempt(nonce: string, owner: string | null, payload: unknown) {
  const hash = sign(JSON.stringify(["checkout-attempt", nonce, owner, payload]));
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function setOrderReceipt(orderId: string) {
  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const value = `${orderId}.${expires}`;
  (await cookies()).set(`${cookieName}_${orderId}`, `${value}.${sign("checkout-receipt:" + value)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/sucesso", maxAge: lifetime,
  });
}

export async function hasOrderReceipt(orderId: string) {
  const store = await cookies();
  const token = store.get(`${cookieName}_${orderId}`)?.value ?? store.get(cookieName)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expiry, signature] = parts;
  if (id !== orderId || !/^\d+$/.test(expiry) || Number(expiry) <= Date.now() / 1000 ||
      !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const expected = sign(`checkout-receipt:${id}.${expiry}`);
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
