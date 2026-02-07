'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/figma/app/components/DashboardLayout';
import { GlobalNavigation } from '@/figma/app/components/GlobalNavigation';
import { RouterShimProvider } from '@/lib/router-shim';
import { FIGMA_ROUTES, matchFigmaRoute } from '../route-map';

export default function FigmaCatchAllPage() {
  const params = useParams();
  const path = Array.isArray(params.path) ? params.path.join('/') : '';
  const pathname = `/${path}`;

  const match = useMemo(() => matchFigmaRoute(pathname), [pathname]);
  const route = match?.route ?? FIGMA_ROUTES.find((item) => item.path === '*');
  const Component = route?.component;
  const routeParams = match?.params ?? {};

  if (!Component) {
    return null;
  }

  const page = <Component />;

  const content =
    route?.layout === 'dashboard' ? (
      <DashboardLayout>{page}</DashboardLayout>
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
