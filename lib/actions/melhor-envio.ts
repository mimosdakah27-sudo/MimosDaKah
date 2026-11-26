import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export async function canManageShipping() {
  const client = await supabaseServer();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const { data } = await client.from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return Boolean(data);
}
