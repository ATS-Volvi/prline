import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "PLANT_ADMIN" | "HR_COORDINATOR" | "SUPERVISOR" | "PLANT_MANAGER";

export type AuthState = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  profile: { user_id: string; username: string; full_name: string | null; associate_id: number | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

async function loadRolesAndProfile(userId: string) {
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("user_id, username, full_name, associate_id").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    roles: ((roles ?? []) as { role: AppRole }[]).map((r) => r.role),
    profile: profile ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      const { roles, profile } = await loadRolesAndProfile(s.user.id);
      setRoles(roles);
      setProfile(profile);
    } else {
      setRoles([]);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // Defer DB reads to avoid deadlocks inside the listener
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          loadRolesAndProfile(s.user.id).then(({ roles, profile }) => {
            setRoles(roles);
            setProfile(profile);
          });
        }, 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    roles,
    profile,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await hydrate(data.session);
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function hasRole(roles: AppRole[], r: AppRole) {
  return roles.includes(r);
}
export function hasAnyRole(roles: AppRole[], rs: AppRole[]) {
  return rs.some((r) => roles.includes(r));
}

export const ROLE_LABELS: Record<AppRole, string> = {
  PLANT_ADMIN: "Plant Admin",
  HR_COORDINATOR: "HR Coordinator",
  SUPERVISOR: "Supervisor",
  PLANT_MANAGER: "Plant Manager",
};