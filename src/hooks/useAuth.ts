import { useEffect } from "react";
import { Alert, AppState } from "react-native";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (!data.session && !data.user?.identities?.length) {
      throw new Error(
        "An account with this email already exists.",
      );
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error signing out", error.message);
  },
}));

/**
 * Initialize auth listener — call once in root layout.
 * Subscribes to onAuthStateChange and hydrates session from storage.
 */
export function useInitializeAuth() {
  const setSession = useAuth((s) => s.setSession);

  useEffect(() => {
    // Hydrate from persisted session on cold start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [setSession]);
}

// Register AppState listener once at module scope to pause/resume token refresh
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
