import { createFileRoute } from "@tanstack/react-router";
import { SimpleCrud } from "@/components/admin/simple-crud";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories · Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <SimpleCrud
      title="Categories"
      table="categories"
      orderBy="name"
      ascending
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "slug", label: "Slug", required: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
      ]}
    />
  ),
});
