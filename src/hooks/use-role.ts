import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type AppRole = "admin" | "editor" | "moderator" | "viewer" | "user";

const ORDER: AppRole[] = ["admin", "editor", "moderator", "viewer", "user"];

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setLoading(false);
      });
  }, [user, authLoading]);

  const has = (r: AppRole) => roles.includes(r);
  const hasAny = (r: AppRole[]) => r.some((x) => roles.includes(x));
  const highest: AppRole = ORDER.find((r) => roles.includes(r)) ?? "user";
  const canManage = hasAny(["admin", "editor"]);
  const isAdmin = has("admin");

  return { roles, highest, has, hasAny, canManage, isAdmin, loading, user };
}
