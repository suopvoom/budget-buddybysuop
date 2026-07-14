import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

type Log = { id: string; actor_id: string | null; action: string; entity: string; entity_id: string | null; diff: unknown; created_at: string };

function AuditPage() {
  const [rows, setRows] = useState<Log[]>([]);
  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => setRows((data ?? []) as Log[]));
  }, []);
  return (
    <>
      <PageHeader title="Audit Logs" subtitle={`${rows.length} recent events`} />
      <div className="p-8">
        <div className="rounded-xl border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.actor_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.action}</td>
                  <td className="px-4 py-3">{r.entity}{r.entity_id ? <span className="text-xs text-muted-foreground"> · {r.entity_id.slice(0, 8)}</span> : null}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">{r.diff ? JSON.stringify(r.diff) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
