import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Admin" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

type Notif = { id: string; title: string; body: string | null; link: string | null; created_at: string };

function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<Notif[]>([]);

  async function load() {
    const { data } = await supabase.from("notifications").select("id, title, body, link, created_at").order("created_at", { ascending: false }).limit(100);
    setRows((data ?? []) as Notif[]);
  }
  useEffect(() => { load(); }, []);

  async function broadcast() {
    if (!title.trim()) { toast.error("Title required"); return; }
    setSending(true);
    const { data: profs } = await supabase.from("profiles").select("id");
    const ids = (profs ?? []).map((p) => p.id as string);
    const payload = ids.map((uid) => ({ user_id: uid, title, body: body || null, link: link || null }));
    const { error } = await supabase.from("notifications").insert(payload);
    if (error) toast.error(error.message);
    else {
      await logAudit("broadcast", "notifications", null, { count: ids.length, title });
      toast.success(`Sent to ${ids.length} user(s)`);
      setTitle(""); setBody(""); setLink(""); load();
    }
    setSending(false);
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Broadcast to all users, or view recent" />
      <div className="p-8 grid grid-cols-3 gap-6">
        <div className="col-span-1 rounded-xl border bg-background p-5 space-y-3 h-fit">
          <h2 className="font-semibold">Broadcast</h2>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <Input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <Button onClick={broadcast} disabled={sending} className="w-full">{sending ? "Sending…" : "Send to everyone"}</Button>
        </div>
        <div className="col-span-2 rounded-xl border bg-background overflow-hidden">
          <div className="px-5 py-3 border-b"><h2 className="font-semibold">Recent notifications</h2></div>
          <div className="divide-y max-h-[600px] overflow-auto">
            {rows.length === 0 && <p className="px-5 py-8 text-sm text-muted-foreground text-center">None yet.</p>}
            {rows.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <p className="font-medium text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
