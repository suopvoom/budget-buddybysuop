import { supabase } from "@/integrations/supabase/client";

export async function logAudit(action: string, entity: string, entityId?: string | null, diff?: Record<string, unknown> | null) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    actor_id: u.user?.id ?? null,
    action,
    entity,
    entity_id: entityId ?? null,
    diff: (diff as never) ?? null,
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
