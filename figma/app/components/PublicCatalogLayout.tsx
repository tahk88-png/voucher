import { Outlet } from "@/lib/router-shim";
import { PublicCatalogShell } from "@/figma/app/components/PublicCatalogShell";

export function PublicCatalogLayout() {
  return (
    <PublicCatalogShell>
      <Outlet />
    </PublicCatalogShell>
  );
}

