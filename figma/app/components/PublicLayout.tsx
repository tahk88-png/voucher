import { Outlet } from "react-router-dom";
import { GlobalNavigation } from "@/figma/app/components/GlobalNavigation";

export function PublicLayout() {
  return (
    <>
      <GlobalNavigation />
      <Outlet />
    </>
  );
}
