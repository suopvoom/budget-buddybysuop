import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export type SimpleField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "date";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};

export type SimpleColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

export function SimpleCrud<T extends { id: string }>({
  title, subtitle, table, fields, columns, orderBy = "created_at", ascending = false, initial = {},
}: {
  title: string;
  subtitle?: string;
  table: string;
  fields: SimpleField[];
  columns: SimpleColumn<T>[];
  orderBy?: string;
  ascending?: boolean;
  initial?: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from(table as never) as unknown as { select: (s: string) => { order: (k: string, o: { ascending: boolean }) => Promise<{ data: T[] | null }> } })
      .select("*").order(orderBy, { ascending });
    setRows((data ?? []) as T[]);
    setLoading(false);
  }
  useEffect(() => { load();  }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...initial });
    setOpen(true);
  }
  function openEdit(row: T) {
    setEditing(row);
    setForm({ ...(row as unknown as Record<string, unknown>) });
    setOpen(true);
  }

  async function save() {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let val: unknown = form[f.key];
      if (f.type === "number") val = val === "" || val == null ? null : Number(val);
      if (f.type === "checkbox") val = !!val;
      if (val === "") val = null;
      if (f.required && (val == null || val === "")) { toast.error(`${f.label} is required`); return; }
      payload[f.key] = val;
    }
    const client = supabase.from(table as never) as unknown as {
      insert: (p: Record<string, unknown>) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
      update: (p: Record<string, unknown>) => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> };
    };
    if (editing) {
      const { error } = await client.update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await logAudit("update", table, editing.id);
      toast.success("Updated");
    } else {
      const { data, error } = await client.insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      await logAudit("create", table, data?.id ?? null);
      toast.success("Created");
    }
    setOpen(false); load();
  }

  async function remove(row: T) {
    if (!confirm("Delete this row?")) return;
    const client = supabase.from(table as never) as unknown as {
      delete: () => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> };
    };
    const { error } = await client.delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete", table, row.id);
    toast.success("Deleted"); load();
  }

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New</Button>
      } />
      <div className="p-8">
        <div className="rounded-xl border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {columns.map((c) => <th key={c.key} className="text-left px-4 py-3">{c.label}</th>)}
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">Nothing yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.render ? c.render(r) : String((r as unknown as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{f.label}{f.required && " *"}</label>
                {f.type === "textarea" ? (
                  <textarea rows={3} value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background" />
                ) : f.type === "select" ? (
                  <select value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">—</option>
                    {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "checkbox" ? (
                  <div className="mt-2"><input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} /></div>
                ) : (
                  <Input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={String(form[f.key] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1" />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
