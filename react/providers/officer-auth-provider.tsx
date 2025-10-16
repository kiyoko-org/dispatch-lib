import type { User, SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getDispatchClient } from "../..";

export type OfficerAuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isOfficer: boolean;
};

export type OfficerAuthContextType = OfficerAuthState & {
  signIn: (badgeNumber: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
};

const OfficerAuthContext = createContext<OfficerAuthContextType | null>(null);

export type OfficerAuthProviderProps = {
  children: React.ReactNode;
};

export function OfficerAuthProvider({ children }: OfficerAuthProviderProps) {
  const [state, setState] = useState<OfficerAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isOfficer: false,
  });

  const dispatchClient = getDispatchClient();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Check if user is authenticated and has officer role
      const { data, error } = await dispatchClient.auth.getUser();
      if (!mounted) return;
      
      if (error) {
        setState({ user: null, isLoading: false, error: error.message, isOfficer: false });
      } else {
        const isOfficer = data.user?.user_metadata?.role === "officer";
        setState({ 
          user: data.user, 
          isLoading: false, 
          error: null, 
          isOfficer 
        });
      }
    };

    init();

    const { data: sub } = dispatchClient.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        
        if (!session) {
          setState({ user: null, isLoading: false, error: null, isOfficer: false });
        } else {
          console.info("Officer auth state changed:", session.user);

          // Check if the user has officer role
          const isOfficer = session.user?.user_metadata?.role === "officer";
          
          if (!isOfficer) {
            // If user is not an officer, sign them out
            dispatchClient.auth.signOut();
            setState({ 
              user: null, 
              isLoading: false, 
              error: "Access denied: User is not an officer", 
              isOfficer: false 
            });
            return;
          }

          // Fetch user details
          dispatchClient.auth.getUser().then(({ data, error }) => {
            if (!mounted) return;
            if (error) {
              setState({ 
                user: null, 
                isLoading: false, 
                error: error.message, 
                isOfficer: false 
              });
            } else {
              const isOfficer = data.user?.user_metadata?.role === "officer";
              setState({ 
                user: data.user, 
                isLoading: false, 
                error: null, 
                isOfficer 
              });
            }
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
  }, [dispatchClient]);

  const signIn = async (badgeNumber: string, password: string) => {
    // Use the officerLogin method from DispatchClient
    const result = await dispatchClient.officerLogin(badgeNumber, password);
    if (result.error) return { error: result.error };
    return {};
  };

  const signOut = async () => {
    const { error } = await dispatchClient.auth.signOut();
    if (error) return { error: error.message };
    return {};
  };

  const value: OfficerAuthContextType = {
    ...state,
    signIn,
    signOut,
  };

  return <OfficerAuthContext.Provider value={value}>{children}</OfficerAuthContext.Provider>;
}

function useOfficerAuthContext() {
  const ctx = useContext(OfficerAuthContext);
  if (!ctx) throw new Error("useOfficerAuthContext must be used within OfficerAuthProvider");
  return ctx;
}

export { OfficerAuthContext, useOfficerAuthContext };
