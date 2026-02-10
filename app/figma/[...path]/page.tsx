'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useNavigate } from '@/lib/router-shim';
import { DashboardLayout } from '@/figma/app/components/DashboardLayout';
import { GlobalNavigation } from '@/figma/app/components/GlobalNavigation';
import { PublicCatalogShell } from '@/figma/app/components/PublicCatalogShell';
import { useAuth } from '@/figma/app/contexts/AuthContext';
import { RouterShimProvider } from '@/lib/router-shim';
import { FIGMA_ROUTES, matchFigmaRoute } from '../route-map';

export default function FigmaCatchAllPage() {
  const navigate = useNavigate();
  const { canAccess, isAuthenticated, isHydrated, getHomeRoute } = useAuth();
  const params = useParams();
  const path = Array.isArray(params.path) ? params.path.join('/') : '';
  const pathname = `/${path}`;

  const match = useMemo(() => matchFigmaRoute(pathname), [pathname]);
  const route = match?.route ?? FIGMA_ROUTES.find((item) => item.path === '*');
  const Component = route?.component;
  const routeParams = match?.params ?? {};
  const requiredAccess = route?.access ?? (route?.layout === 'dashboard' ? 'merchant' : 'public');
  const isAllowed = isHydrated ? canAccess(requiredAccess) : false;

  useEffect(() => {
    if (!Component) {
      return;
    }
    if (!isHydrated || isAllowed) {
      return;
    }
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname);
      navigate(`/login?next=${next}`);
      return;
    }
    navigate(getHomeRoute());
  }, [Component, getHomeRoute, isAllowed, isAuthenticated, isHydrated, navigate, pathname]);

  if (!Component) {
    return null;
  }

  if (!isHydrated || !isAllowed) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] grid place-items-center px-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2D2721]">Loading workspace...</div>
          <div className="text-sm text-[#8B7355] mt-1">Redirecting to the correct dashboard.</div>
        </div>
      </div>
    );
  }

  const page = <Component />;

  const content =
    route?.layout === 'dashboard' ? (
      <><DashboardLayout />{page}</>
    ) : route?.layout === 'public-catalog' ? (
      <PublicCatalogShell>{page}</PublicCatalogShell>
    ) : (
      <>
        <GlobalNavigation />
        {page}
      </>
    );

  return (
    <RouterShimProvider params={routeParams}>
      <div key={pathname} className="animate-fade-up">
        {content}
      </div>
    </RouterShimProvider>
  );
}
