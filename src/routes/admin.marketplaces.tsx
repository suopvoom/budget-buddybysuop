import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/admin/simple-crud";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/marketplaces")({
  head: () => ({ meta: [{ title: "Marketplaces · Admin" }, { name: "robots", content: "noindex" }] }),
  component: MarketplacesPage,
});

function MarketplacesPage() {
  // no-op subscribe to satisfy React
  useEffect(() => { void supabase; }, []);
  const [_, setKey] = useState(0);
  void _; void setKey;
  return (
    <SimpleCrud
      title="Marketplaces"
      table="marketplaces"
      orderBy="name"
      ascending
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "slug", label: "Slug" },
        { key: "logo_url", label: "Logo URL" },
        { key: "website", label: "Website" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
        { key: "website", label: "Website" },
      ]}
    />
  );
}
