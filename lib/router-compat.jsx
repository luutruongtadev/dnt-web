"use client";

// Compatibility shim: exposes the subset of the react-router-dom API used by the
// migrated dnt-fe code, implemented on top of next/navigation. This lets the
// ported pages/components keep their call sites unchanged while the app runs on
// the Next.js App Router. Over time call sites can migrate to next/navigation
// directly and this shim can shrink.

import { createContext, useContext, useEffect } from "react";
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";

// --- navigation state (react-router's location.state / navigate(to,{state})) ---
// Next's router has no in-band navigation state, so we keep it in memory. It
// survives client-side route transitions and is intentionally lost on reload,
// matching how the original flows relied on it.
let pendingState = null;

export function useNavigate() {
  const router = useRouter();
  return (to, opts) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    pendingState = opts?.state ?? null;
    if (opts?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  const sp = useNextSearchParams();
  const search = sp?.toString() ? `?${sp.toString()}` : "";
  return { pathname, search, hash: "", state: pendingState, key: "default" };
}

export function useParams() {
  return useNextParams() ?? {};
}

// react-router's useSearchParams returns [URLSearchParams, setter].
export function useSearchParams() {
  const sp = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setSearchParams = (next) => {
    const current = new URLSearchParams(sp?.toString() ?? "");
    const resolved = typeof next === "function" ? next(current) : next;
    const params = new URLSearchParams(resolved);
    router.push(`${pathname}?${params.toString()}`);
  };
  return [sp ?? new URLSearchParams(), setSearchParams];
}

export function Link({ to, children, ...rest }) {
  return (
    <NextLink href={to ?? "#"} {...rest}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, className, style, children, end, ...rest }) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname?.startsWith(to);
  const cls = typeof className === "function" ? className({ isActive }) : className;
  const st = typeof style === "function" ? style({ isActive }) : style;
  return (
    <NextLink
      href={to ?? "#"}
      className={cls}
      style={st}
      aria-current={isActive ? "page" : undefined}
      {...rest}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </NextLink>
  );
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// --- <Outlet> / useOutletContext bridge ---
// The Next layout wrapping a flow provides its child route element via
// OutletChildrenContext; <Outlet context={...}/> renders those children and
// re-exposes `context` to step screens through useOutletContext().
/** @type {import('react').Context<import('react').ReactNode>} */
export const OutletChildrenContext = createContext(null);
const OutletValueContext = createContext(null);

export function Outlet({ context }) {
  const children = useContext(OutletChildrenContext);
  return (
    <OutletValueContext.Provider value={context}>
      {children}
    </OutletValueContext.Provider>
  );
}

export function useOutletContext() {
  return useContext(OutletValueContext);
}

// react-router v7 data() helper — passthrough (only imported, never used here).
export const data = (value) => value;
