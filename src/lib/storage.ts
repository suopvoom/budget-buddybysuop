import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

export async function uploadProductImage(file: File): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (signErr || !data) throw signErr ?? new Error("Signed URL failed");
  return { path, url: data.signedUrl };
}

export async function deleteProductImage(url: string) {
  // best-effort: only delete if url points to our bucket
  const marker = `/object/sign/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = url.slice(i + marker.length).split("?")[0];
  await supabase.storage.from(BUCKET).remove([path]);
}
