import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({ meta: [{ title: "New product · Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => <ProductForm />,
});
