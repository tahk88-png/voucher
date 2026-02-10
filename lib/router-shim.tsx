'use client';

import type React from 'react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';
import { createContext, useContext, useEffect, useMemo } from 'react';

type To = string;

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
  to?: To;
  href?: To;
  replace?: boolean;
  className?: string;
};

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function Route({
  element,
  children,
}: {
  element: React.ReactNode;
  path?: string;
  index?: boolean;
  children?: React.ReactNode;
}) {
  return <>{children ?? element}</>;
}

export function Outlet({ children }: { children?: React.ReactNode }) {
  return <>{children ?? null}</>;
}

export function Navigate({ to, replace = true }: { to: To; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [replace, router, to]);
  return null;
}

export function useNavigate() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  return (to: To | number) => {
    if (typeof to === 'number') {
      router.back();
      return;
    }
    const target = prefixFigmaPath(to, pathname);
    router.push(target);
  };
}

export function useLocation() {
  const current = usePathname() ?? '';
  const pathname = stripFigmaPrefix(current);
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString();
  return {
    pathname,
    search: search ? `?${search}` : '',
    hash: '',
    state: null as unknown,
    key: 'next',
  };
}

export function useParamsShim<T extends Record<string, string> = Record<string, string>>() {
  const ctx = useContext(RouterShimParamsContext);
  const nextParams = useNextParams() as Record<string, string | string[] | undefined>;
  const normalizedNextParams = normalizeParams(nextParams);
  return ((ctx ?? normalizedNextParams) as unknown) as T;
}

export const useParams = useParamsShim;

type RouterParams = Record<string, string>;

const RouterShimParamsContext = createContext<RouterParams | null>(null);

export function RouterShimProvider({
  params,
  children,
}: {
  params: RouterParams;
  children: React.ReactNode;
}) {
  const value = useMemo(() => params, [params]);
  return (
    <RouterShimParamsContext.Provider value={value}>
      {children}
    </RouterShimParamsContext.Provider>
  );
}

export function useSearchParamsShim(): [URLSearchParams, (next: URLSearchParams) => void] {
  const params = useNextSearchParams();
  const router = useRouter();
  const current = new URLSearchParams(params?.toString());
  const setParams = (next: URLSearchParams) => {
    const query = next.toString();
    router.push(query ? `?${query}` : '?');
  };
  return [current, setParams];
}

export const useSearchParams = useSearchParamsShim;

export function NavLink({
  to,
  href,
  className,
  ...rest
}: Omit<LinkProps, 'className'> & {
  className?: string | ((opts: { isActive: boolean }) => string);
}) {
  const rawPathname = usePathname() ?? '';
  const pathname = stripFigmaPrefix(rawPathname);
  const target = prefixFigmaPath(href ?? to ?? '#', rawPathname);
  const activeTarget = stripFigmaPrefix(target);
  const isActive = pathname === activeTarget || (activeTarget !== '/' && pathname.startsWith(`${activeTarget}/`));
  const resolvedClassName =
    typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link href={target} className={resolvedClassName} {...rest} />
  );
}

export function LinkShim({ to, href, ...rest }: LinkProps) {
  const pathname = usePathname() ?? '';
  const target = prefixFigmaPath(href ?? to ?? '#', pathname);
  return <Link href={target} {...rest} />;
}

export { LinkShim as Link };

function stripFigmaPrefix(pathname: string) {
  if (!pathname.startsWith('/figma')) return pathname;
  const nextPath = pathname.slice('/figma'.length);
  return nextPath.length ? nextPath : '/';
}

function prefixFigmaPath(target: string, pathname: string) {
  if (!pathname.startsWith('/figma')) return target;
  if (target.startsWith('/figma') || target.startsWith('http')) return target;
  if (!target.startsWith('/')) return `/figma/${target}`;
  return `/figma${target}`;
}

function normalizeParams(params: Record<string, string | string[] | undefined>) {
  const normalized: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      normalized[key] = value[0] ?? '';
      return;
    }
    if (typeof value === 'string') {
      normalized[key] = value;
    }
  });
  return normalized;
}
