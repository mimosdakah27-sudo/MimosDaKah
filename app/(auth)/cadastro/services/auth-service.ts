import { supabaseBrowser } from "@/lib/supabase/client";
import { SignupFormData } from "../types/auth";

export async function signupUser(data: SignupFormData) {
  const supabase = supabaseBrowser();
  
  // Como a confirmação de e-mail foi desativada no Supabase, 
  // o signUp já cria a conta e retorna a sessão ativa de imediato.
  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { 
      data: { 
        display_name: data.name,
        phone: data.phone
      },
    },
  });

  if (error) throw error;
  return authData;
}