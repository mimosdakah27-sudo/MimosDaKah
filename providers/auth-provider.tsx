"use client";

import { ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/auth-context";
import { supabaseBrowser } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const supabase = supabaseBrowser();
  const userId = session?.user.id;

  useEffect(() => {
    // INITIAL_SESSION também é emitido quando o visitante está sem sessão.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, current) => {
      setSession(current);
      setInitializing(false);
      if (event === "USER_UPDATED" && current) {
        void queryClient.invalidateQueries({ queryKey: ["userProfile", current.user.id] });
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const profile = useQuery({
    queryKey: ["userProfile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const role = useQuery({
    queryKey: ["isAdminUser", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null, session, profile: profile.data ?? null, isAdmin: role.data === true,
      loading: initializing || (!!userId && (profile.isLoading || role.isLoading)),
    }}>
      {children}
    </AuthContext.Provider>
  );
}
