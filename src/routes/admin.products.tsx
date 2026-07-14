import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Archive, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products · Admin" }, { name: "robots", content: "noindex" }] }),
  component: ProductsPage,
});

type Row = {
  id: string;
  name: string;
  sku: string | null;
  current_price: number;
  mrp: number;
  stock_status: string;
  featured: boolean;
  archived_at: string | null;
  updated_at: string;
  brands: { name: string } | null;
  categories: { name: string } | null;
};

const PAGE = 25;

function ProductsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("brands").select("id, name").order("name").then(({ data }) => setBrands(data ?? []));
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCats(data ?? []));
  }, []);

  async function load() {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("id, name, sku, current_price, mrp, stock_status, featured, archived_at, updated_at, brands(name), categories(name)", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
    if (brandFilter !== "all") query = query.eq("brand_id", brandFilter);
    if (catFilter !== "all") query = query.eq("category_id", catFilter);
    if (stockFilter !== "all") query = query.eq("stock_status", stockFilter);
    if (!showArchived) query = query.is("archived_at", null);
    const { data, count: c } = await query;
    setRows((data ?? []) as unknown as Row[]);
    setCount(c ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
     
  }, [page, q, brandFilter, catFilter, stockFilter, showArchived]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE));
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  }

  async function bulkArchive() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("products").update({ archived_at: new Date().toISOString() }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    await logAudit("archive", "products", null, { ids });
    toast.success(`Archived ${ids.length}`);
    setSelected(new Set()); load();
  }
  async function bulkRestore() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await supabase.from("products").update({ archived_at: null }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    await logAudit("restore", "products", null, { ids });
    toast.success(`Restored ${ids.length}`); setSelected(new Set()); load();
  }
  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0 || !confirm(`Permanently delete ${ids.length} products?`)) return;
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete", "products", null, { ids });
    toast.success(`Deleted ${ids.length}`); setSelected(new Set()); load();
  }
  async function duplicate(row: Row) {
    const { data: full } = await supabase.from("products").select("*").eq("id", row.id).single();
    if (!full) return;
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = full as Record<string, unknown> & { id: string; created_at: string; updated_at: string };
    void _id; void _c; void _u;
    const payload = { ...rest, name: `${row.name} (copy)`, slug: null, sku: null };
    const { data: created, error } = await supabase.from("products").insert(payload as never).select("id").single();
    if (error) { toast.error(error.message); return; }
    await logAudit("duplicate", "products", created.id);
    toast.success("Duplicated");
    navigate({ to: "/admin/products/$id" as never, params: { id: created.id } as never });
  }

  const range = useMemo(() => `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, count)} of ${count}`, [page, count]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${count} total`}
        actions={
          <Button size="sm" onClick={() => navigate({ to: "/admin/products/new" as never })}>
            <Plus className="h-4 w-4 mr-1" /> New product
          </Button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} placeholder="Search products…" className="pl-9" />
          </div>
          <Select value={brandFilter} onValueChange={(v) => { setPage(0); setBrandFilter(v); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={(v) => { setPage(0); setCatFilter(v); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(v) => { setPage(0); setStockFilter(v); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={showArchived} onCheckedChange={(v) => { setPage(0); setShowArchived(!!v); }} />
            Show archived
          </label>
        </div>

        {selected.size > 0 && (
          <div className="rounded-lg border bg-primary/5 px-4 py-2 flex items-center gap-2 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            {showArchived
              ? <Button size="sm" variant="outline" onClick={bulkRestore}><RotateCcw className="h-4 w-4 mr-1" />Restore</Button>
              : <Button size="sm" variant="outline" onClick={bulkArchive}><Archive className="h-4 w-4 mr-1" />Archive</Button>}
            <Button size="sm" variant="destructive" onClick={bulkDelete}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          </div>
        )}

        <div className="rounded-xl border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-3">Product</th>
                <th className="text-left px-3 py-3">Brand</th>
                <th className="text-left px-3 py-3">Category</th>
                <th className="text-right px-3 py-3">Price</th>
                <th className="text-left px-3 py-3">Stock</th>
                <th className="text-left px-3 py-3">Updated</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No products.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className={r.archived_at ? "opacity-60" : ""}>
                  <td className="px-3 py-3"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} /></td>
                  <td className="px-3 py-3">
                    <Link to={"/admin/products/$id" as never} params={{ id: r.id } as never} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.sku ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3">{r.brands?.name ?? "—"}</td>
                  <td className="px-3 py-3">{r.categories?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-medium">₹{Number(r.current_price).toLocaleString()}</div>
                    {r.mrp > r.current_price && <div className="text-xs text-muted-foreground line-through">₹{Number(r.mrp).toLocaleString()}</div>}
                  </td>
                  <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded-full bg-muted">{r.stock_status.replace("_", " ")}</span></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3 text-right">
                    <button title="Duplicate" onClick={() => duplicate(r)} className="p-1.5 rounded hover:bg-muted">
                      <Copy className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{count > 0 ? range : "No results"}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
