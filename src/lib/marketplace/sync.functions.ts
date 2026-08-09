import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff, listAdapterStatuses, runMarketplaceSync } from "./sync.server";

export const getAdapterStatuses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    return listAdapterStatuses();
  });

export const triggerSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { adapterKey: string }) => {
    if (!input?.adapterKey || typeof input.adapterKey !== "string" || input.adapterKey.length > 64) {
      throw new Error("adapterKey is required");
    }
    return { adapterKey: input.adapterKey };
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, true);
    return runMarketplaceSync(data.adapterKey);
  });
