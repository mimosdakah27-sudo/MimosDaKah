"use server";

import { revalidateTag } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { ReviewInsert } from "../types/review-type";

export async function upsertReview(data: ReviewInsert) {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("reviews")
    .upsert(data, { onConflict: "product_id,user_id" });

  if (error) throw new Error(error.message);

  // Revalida apenas as tags específicas no cache sem forçar um re-render completo do path síncrono
  try {
    revalidateTag(`reviews-${data.product_id}`);
    revalidateTag(`product-${data.product_id}`);
  } catch (err) {
    console.error("Erro ao revalidar cache:", err);
  }
}

export async function deleteReview(id: string, product_id: string) {
  const supabase = await supabaseServer();

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);

  try {
    revalidateTag(`reviews-${product_id}`);
    revalidateTag(`product-${product_id}`);
  } catch (err) {
    console.error("Erro ao revalidar cache:", err);
  }
}