import { Outlet } from "@/lib/router-shim";
import { GlobalNavigation } from "@/figma/app/components/GlobalNavigation";

export function PublicLayout() {
  return (
    <>
      <GlobalNavigation />
      <Outlet />
    </>
  );
}

