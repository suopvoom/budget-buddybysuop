import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import type { AppRole } from "@/hooks/use-role";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users · Admin" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

type Profile = { id: string; display_name: string | null; email: string | null; created_at: string };
type RoleRow = { user_id: string; role: AppRole };
const ROLES: AppRole[] = ["admin", "editor", "moderator", "viewer", "user"];

function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Map<string, Set<AppRole>>>(new Map());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    const m = new Map<string, Set<AppRole>>();
    ((r ?? []) as RoleRow[]).forEach((x) => {
      const s = m.get(x.user_id) ?? new Set(); s.add(x.role); m.set(x.user_id, s);
    });
    setRoles(m);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(userId: string, role: AppRole) {
    const has = roles.get(userId)?.has(role);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast.error(error.message); return; }
      await logAudit("revoke_role", "user_roles", userId, { role });
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast.error(error.message); return; }
      await logAudit("grant_role", "user_roles", userId, { role });
    }
    load();
  }

  return (
    <>
      <PageHeader title="Users" subtitle={`${profiles.length} total — assign roles`} />
      <div className="p-8">
        <div className="rounded-xl border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map((r) => {
                        const on = roles.get(p.id)?.has(r);
                        return (
                          <Button key={r} size="sm" variant={on ? "default" : "outline"} className="h-7 text-xs" onClick={() => toggle(p.id, r)}>
                            {r}
                          </Button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
