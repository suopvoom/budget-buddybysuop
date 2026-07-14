import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleCrud } from "@/components/admin/simple-crud";

export const Route = createFileRoute("/admin/subcategories")({
  head: () => ({ meta: [{ title: "Sub-categories · Admin" }, { name: "robots", content: "noindex" }] }),
  component: SubCatsPage,
});

function SubCatsPage() {
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { supabase.from("categories").select("id, name").order("name").then(({ data }) => setCats(data ?? [])); }, []);
  return (
    <SimpleCrud
      title="Sub-categories"
      table="subcategories"
      orderBy="name"
      ascending
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "slug", label: "Slug", required: true },
        { key: "category_id", label: "Category", type: "select", required: true, options: cats.map((c) => ({ value: c.id, label: c.name })) },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
      ]}
    />
  );
}
