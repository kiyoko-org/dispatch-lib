import type { User, SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getDispatchClient } from "../..";

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const supabaseClient = getDispatchClient();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // use the consumer's supabase client
      const { data, error } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      if (error) {
        setState({ user: null, isLoading: false, error: error.message });
      } else {
        setState({ user: data.user, isLoading: false, error: null });
      }
    };

    init();

    const { data: sub } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        // optionally update the state when auth changes
        if (!mounted) return;
        if (!session) {
          setState({ user: null, isLoading: false, error: null });
        } else {
          console.info("User signed in:", session.user);

          // fetch user or rely on session data depending on your needs
          supabaseClient.auth.getUser().then(({ data, error }) => {
            if (!mounted) return;
            if (error)
              setState({ user: null, isLoading: false, error: error.message });
            else setState({ user: data.user, isLoading: false, error: null });
          });
        }
      },
    );

    return () => {
      mounted = false;
      if (
        sub &&
        sub.subscription &&
        typeof sub.subscription.unsubscribe === "function"
      ) {
        sub.subscription.unsubscribe();
      }
    };
  }, [supabaseClient]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) return { error: error.message };
    return {};
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

export { AuthContext, useAuthContext };
