import { Outlet } from "react-router-dom";
import { PublicCatalogShell } from "@/figma/app/components/PublicCatalogShell";

export function PublicCatalogLayout() {
  return (
    <PublicCatalogShell>
      <Outlet />
    </PublicCatalogShell>
  );
}
