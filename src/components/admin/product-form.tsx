import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { logAudit, slugify } from "@/lib/audit";
import { uploadProductImage } from "@/lib/storage";
import { Trash2, Upload, X } from "lucide-react";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string | null;
  description: string;
  brand_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  gender: string | null;
  product_type: string | null;
  ingredients: string;
  benefits: string;
  how_to_use: string;
  current_price: number;
  mrp: number;
  sku: string;
  barcode: string;
  weight: string;
  size: string;
  stock_status: string;
  availability: string;
  image_url: string;
  thumbnail_url: string;
  image_gallery: string[];
  tags: string[];
  featured: boolean;
  trending: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  product_url: string;
};

const empty: ProductFormValues = {
  name: "", slug: null, description: "", brand_id: null, category_id: null, sub_category_id: null,
  gender: null, product_type: null, ingredients: "", benefits: "", how_to_use: "",
  current_price: 0, mrp: 0, sku: "", barcode: "", weight: "", size: "",
  stock_status: "in_stock", availability: "online",
  image_url: "", thumbnail_url: "", image_gallery: [], tags: [],
  featured: false, trending: false, new_arrival: false, best_seller: false, product_url: "",
};

export function ProductForm({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const [v, setV] = useState<ProductFormValues>(empty);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [subs, setSubs] = useState<{ id: string; name: string; category_id: string }[]>([]);

  useEffect(() => {
    supabase.from("brands").select("id, name").order("name").then(({ data }) => setBrands(data ?? []));
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCats(data ?? []));
    supabase.from("subcategories").select("id, name, category_id").order("name").then(({ data }) => setSubs(data ?? []));
  }, []);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
      if (data) {
        setV({
          ...empty,
          ...data,
          description: data.description ?? "",
          ingredients: data.ingredients ?? "",
          benefits: data.benefits ?? "",
          how_to_use: data.how_to_use ?? "",
          sku: data.sku ?? "",
          barcode: data.barcode ?? "",
          weight: data.weight ?? "",
          size: data.size ?? "",
          image_url: data.image_url ?? "",
          thumbnail_url: data.thumbnail_url ?? "",
          product_url: data.product_url ?? "",
          image_gallery: data.image_gallery ?? [],
          tags: data.tags ?? [],
        });
      }
      setLoading(false);
    })();
  }, [productId]);

  function set<K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      for (const f of files) {
        const { url } = await uploadProductImage(f);
        if (target === "main") set("image_url", url);
        else set("image_gallery", [...v.image_gallery, url]);
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  async function save() {
    if (!v.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: v.name.trim(),
      slug: v.slug || slugify(v.name),
      description: v.description || null,
      brand_id: v.brand_id, category_id: v.category_id, sub_category_id: v.sub_category_id,
      gender: v.gender, product_type: v.product_type,
      ingredients: v.ingredients || null, benefits: v.benefits || null, how_to_use: v.how_to_use || null,
      current_price: Number(v.current_price) || 0, mrp: Number(v.mrp) || 0,
      sku: v.sku || null, barcode: v.barcode || null, weight: v.weight || null, size: v.size || null,
      stock_status: v.stock_status, availability: v.availability,
      image_url: v.image_url || null, thumbnail_url: v.thumbnail_url || v.image_url || null,
      image_gallery: v.image_gallery, tags: v.tags,
      featured: v.featured, trending: v.trending, new_arrival: v.new_arrival, best_seller: v.best_seller,
      product_url: v.product_url || null,
    };
    if (productId) {
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAudit("update", "products", productId);
      toast.success("Saved");
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAudit("create", "products", data.id);
      toast.success("Created");
      navigate({ to: "/admin/products/$id" as never, params: { id: data.id } as never });
    }
    setSaving(false);
  }

  async function remove() {
    if (!productId || !confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete", "products", productId);
    toast.success("Deleted");
    navigate({ to: "/admin/products" as never });
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  const filteredSubs = subs.filter((s) => !v.category_id || s.category_id === v.category_id);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{productId ? "Edit product" : "New product"}</h1>
          <p className="text-sm text-muted-foreground">{v.name || "Untitled"}</p>
        </div>
        <div className="flex gap-2">
          {productId && <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>}
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/admin/products" as never })}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *"><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Slug"><Input value={v.slug ?? ""} onChange={(e) => set("slug", e.target.value || null)} placeholder="auto from name" /></Field>
            <Field label="Brand">
              <Select value={v.brand_id ?? "none"} onValueChange={(x) => set("brand_id", x === "none" ? null : x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={v.category_id ?? "none"} onValueChange={(x) => { set("category_id", x === "none" ? null : x); set("sub_category_id", null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Sub-category">
              <Select value={v.sub_category_id ?? "none"} onValueChange={(x) => set("sub_category_id", x === "none" ? null : x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>
                  {filteredSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={v.gender ?? "unisex"} onValueChange={(x) => set("gender", x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unisex">Unisex</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Product type"><Input value={v.product_type ?? ""} onChange={(e) => set("product_type", e.target.value || null)} /></Field>
            <Field label="Tags (comma separated)">
              <Input value={v.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </TabsContent>

        <TabsContent value="media" className="space-y-6 mt-6">
          <div>
            <Label className="mb-2 block">Main image</Label>
            <div className="flex items-center gap-4">
              {v.image_url ? (
                <div className="relative">
                  <img src={v.image_url} alt="" className="h-32 w-32 rounded-lg object-cover border" />
                  <button onClick={() => set("image_url", "")} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="h-32 w-32 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "main")} />
                </label>
              )}
              <Input value={v.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="or paste URL" />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Gallery ({v.image_gallery.length})</Label>
            <div className="grid grid-cols-6 gap-3">
              {v.image_gallery.map((u, i) => (
                <div key={i} className="relative">
                  <img src={u} alt="" className="h-24 w-24 rounded-lg object-cover border" />
                  <button onClick={() => set("image_gallery", v.image_gallery.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-24 w-24 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e, "gallery")} />
              </label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Current price"><Input type="number" value={v.current_price} onChange={(e) => set("current_price", Number(e.target.value))} /></Field>
            <Field label="MRP"><Input type="number" value={v.mrp} onChange={(e) => set("mrp", Number(e.target.value))} /></Field>
            <Field label="Stock">
              <Select value={v.stock_status} onValueChange={(x) => set("stock_status", x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In stock</SelectItem>
                  <SelectItem value="low_stock">Low stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Availability">
              <Select value={v.availability} onValueChange={(x) => set("availability", x)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_store">In-store</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU"><Input value={v.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
            <Field label="Barcode"><Input value={v.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
            <Field label="Weight"><Input value={v.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 100g" /></Field>
            <Field label="Size"><Input value={v.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 50ml" /></Field>
            <Field label="Product URL"><Input value={v.product_url} onChange={(e) => set("product_url", e.target.value)} /></Field>
          </div>
          <Field label="Ingredients"><Textarea rows={3} value={v.ingredients} onChange={(e) => set("ingredients", e.target.value)} /></Field>
          <Field label="Benefits"><Textarea rows={3} value={v.benefits} onChange={(e) => set("benefits", e.target.value)} /></Field>
          <Field label="How to use"><Textarea rows={3} value={v.how_to_use} onChange={(e) => set("how_to_use", e.target.value)} /></Field>
        </TabsContent>

        <TabsContent value="flags" className="space-y-4 mt-6">
          {(["featured", "trending", "new_arrival", "best_seller"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium capitalize">{k.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">Show in {k.replace("_", " ")} sections</p>
              </div>
              <Switch checked={v[k]} onCheckedChange={(x) => set(k, x)} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}
