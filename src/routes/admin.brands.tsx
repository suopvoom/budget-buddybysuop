import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/admin/simple-crud";

export const Route = createFileRoute("/admin/brands")({
  head: () => ({ meta: [{ title: "Brands · Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <SimpleCrud
      title="Brands"
      table="brands"
      orderBy="name"
      ascending
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "logo_url", label: "Logo URL" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        {
          key: "logo_url",
          label: "Logo",
          render: (r: { logo_url: string | null }) =>
            r.logo_url ? <img src={r.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : "—",
        },
      ]}
    />
  ),
});
