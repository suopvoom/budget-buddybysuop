import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { logAudit, slugify } from "@/lib/audit";

export const Route = createFileRoute("/admin/import-export")({
  head: () => ({ meta: [{ title: "Import / Export · Admin" }, { name: "robots", content: "noindex" }] }),
  component: ImportExportPage,
});

type Report = { created: number; updated: number; skipped: number; errors: { row: number; msg: string }[] };

function ImportExportPage() {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [brands, setBrands] = useState<Map<string, string>>(new Map());
  const [cats, setCats] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    supabase.from("brands").select("id, name").then(({ data }) => {
      setBrands(new Map((data ?? []).map((b) => [b.name.toLowerCase(), b.id])));
    });
    supabase.from("categories").select("id, name").then(({ data }) => {
      setCats(new Map((data ?? []).map((c) => [c.name.toLowerCase(), c.id])));
    });
  }, []);

  async function exportProducts() {
    const { data } = await supabase
      .from("products")
      .select("name, slug, sku, brands(name), categories(name), current_price, mrp, stock_status, description, image_url")
      .limit(10000);
    const rows = (data ?? []).map((r: Record<string, unknown>) => ({
      name: r.name, slug: r.slug, sku: r.sku,
      brand: (r.brands as { name?: string } | null)?.name ?? "",
      category: (r.categories as { name?: string } | null)?.name ?? "",
      current_price: r.current_price, mrp: r.mrp, stock_status: r.stock_status,
      description: r.description ?? "", image_url: r.image_url ?? "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `products-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setReport(null);
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const r: Report = { created: 0, updated: 0, skipped: 0, errors: [] };
    let i = 1;
    for (const row of parsed.data) {
      i++;
      const name = (row.name ?? "").trim();
      if (!name) { r.skipped++; continue; }
      const payload = {
        name, slug: (row.slug || slugify(name)) || null,
        sku: row.sku || null,
        brand_id: brands.get((row.brand ?? "").trim().toLowerCase()) ?? null,
        category_id: cats.get((row.category ?? "").trim().toLowerCase()) ?? null,
        current_price: Number(row.current_price) || 0,
        mrp: Number(row.mrp) || 0,
        stock_status: row.stock_status || "in_stock",
        description: row.description || null,
        image_url: row.image_url || null,
      };
      // upsert by sku when present, else insert
      if (payload.sku) {
        const { data: existing } = await supabase.from("products").select("id").eq("sku", payload.sku).maybeSingle();
        if (existing) {
          const { error } = await supabase.from("products").update(payload).eq("id", existing.id);
          if (error) r.errors.push({ row: i, msg: error.message });
          else r.updated++;
          continue;
        }
      }
      const { error } = await supabase.from("products").insert(payload);
      if (error) r.errors.push({ row: i, msg: error.message });
      else r.created++;
    }
    await logAudit("import", "products", null, { created: r.created, updated: r.updated, errors: r.errors.length });
    setReport(r);
    setBusy(false);
    toast.success(`Imported ${r.created} · Updated ${r.updated} · Errors ${r.errors.length}`);
    e.target.value = "";
  }

  return (
    <>
      <PageHeader title="Import / Export" subtitle="Bulk manage products via CSV" />
      <div className="p-8 grid grid-cols-2 gap-6 max-w-4xl">
        <div className="rounded-xl border bg-background p-6">
          <Download className="h-5 w-5 mb-2 text-muted-foreground" />
          <h2 className="font-semibold">Export products</h2>
          <p className="text-sm text-muted-foreground mt-1">Download the current catalog as CSV.</p>
          <Button className="mt-4" onClick={exportProducts}>Export CSV</Button>
        </div>
        <div className="rounded-xl border bg-background p-6">
          <Upload className="h-5 w-5 mb-2 text-muted-foreground" />
          <h2 className="font-semibold">Import products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Columns: <code className="text-xs">name, slug, sku, brand, category, current_price, mrp, stock_status, description, image_url</code>. Existing SKUs are updated.
          </p>
          <label className="inline-flex mt-4">
            <Button asChild disabled={busy}><span>{busy ? "Importing…" : "Choose CSV"}</span></Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={busy} />
          </label>
        </div>
        {report && (
          <div className="col-span-2 rounded-xl border bg-background p-6">
            <h3 className="font-semibold mb-2">Report</h3>
            <p className="text-sm">Created {report.created} · Updated {report.updated} · Skipped {report.skipped} · Errors {report.errors.length}</p>
            {report.errors.length > 0 && (
              <pre className="mt-3 text-xs bg-muted p-3 rounded max-h-60 overflow-auto">{report.errors.map((e) => `Row ${e.row}: ${e.msg}`).join("\n")}</pre>
            )}
          </div>
        )}
      </div>
    </>
  );
}
