"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

export type NavState = Record<string, unknown> | null;

export interface Location {
  pathname: string;
  search: string;
  hash: string;

  state: NavState;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: NavState;
}

export type NavigateFunction = (to: string, options?: NavigateOptions) => void;
export type Params = Record<string, string>;

interface Engine {
  kind: "next" | "memory";
  location: Location;
  navigate: NavigateFunction;
}

const RouterContext = createContext<Engine | null>(null);

const ParamsContext = createContext<Params>({});

function useEngine(): Engine {
  const engine = useContext(RouterContext);
  if (!engine) throw new Error("Use router hooks inside <NextRouterProvider> or <MemoryRouter>.");
  return engine;
}

export function splitPath(to: string): Pick<Location, "pathname" | "search" | "hash"> {
  const url = new URL(to, "http://local");
  return { pathname: url.pathname, search: url.search, hash: url.hash };
}

const STATE_KEY = "mirai.navState";
let stateMemory: { key: string; state: NavState } | null = null;

function rememberState(to: string, state: NavState | undefined) {
  const { pathname, search } = splitPath(to);
  stateMemory = state ? { key: pathname + search, state } : null;
  try {
    if (stateMemory) sessionStorage.setItem(STATE_KEY, JSON.stringify(stateMemory));
    else sessionStorage.removeItem(STATE_KEY);
  } catch {}
}

function stateFor(pathname: string, search: string): NavState {
  if (!stateMemory) {
    try {
      const stored = sessionStorage.getItem(STATE_KEY);
      stateMemory = stored ? JSON.parse(stored) : null;
    } catch {
      stateMemory = null;
    }
  }
  return stateMemory && stateMemory.key === pathname + search ? stateMemory.state : null;
}

export function NextRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useNextSearchParams();
  const query = searchParams ? searchParams.toString() : "";
  const search = query ? `?${query}` : "";

  const navigate = useCallback<NavigateFunction>(
    (to, options = {}) => {
      rememberState(to, options.state);
      if (options.replace) router.replace(to);
      else router.push(to);
    },
    [router],
  );

  const engine = useMemo<Engine>(
    () => ({
      kind: "next",
      location: { pathname, search, hash: "", state: stateFor(pathname, search) },
      navigate,
    }),
    [pathname, search, navigate],
  );

  return <RouterContext.Provider value={engine}>{children}</RouterContext.Provider>;
}

type Entry = string | { pathname: string; search?: string; state?: NavState };

export function MemoryRouter({
  initialEntries = ["/"],
  children,
}: {
  initialEntries?: Entry[];
  children: ReactNode;
}) {
  const toLocation = (entry: Entry): Location =>
    typeof entry === "string"
      ? { ...splitPath(entry), state: null }
      : { ...splitPath(entry.pathname + (entry.search || "")), state: entry.state ?? null };

  const [location, setLocation] = useState<Location>(() =>
    toLocation(initialEntries[initialEntries.length - 1]),
  );

  const navigate = useCallback<NavigateFunction>((to, options = {}) => {
    setLocation({ ...splitPath(to), state: options.state ?? null });
  }, []);

  const engine = useMemo<Engine>(
    () => ({ kind: "memory", location, navigate }),
    [location, navigate],
  );
  return <RouterContext.Provider value={engine}>{children}</RouterContext.Provider>;
}

export function ParamsProvider({ params, children }: { params: Params; children: ReactNode }) {
  return <ParamsContext.Provider value={params}>{children}</ParamsContext.Provider>;
}

export function matchPath(pattern: string, pathname: string): Params | null {
  const parts = pattern.split("/").filter(Boolean);
  const actual = pathname.split("/").filter(Boolean);
  const params: Params = {};
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === "*") return params;
    if (i >= actual.length) return null;
    if (parts[i].startsWith(":")) params[parts[i].slice(1)] = decodeURIComponent(actual[i]);
    else if (parts[i] !== actual[i]) return null;
  }
  return parts.length === actual.length ? params : null;
}

export function useLocation<S extends object = Record<string, unknown>>(): Omit<
  Location,
  "state"
> & {
  state: Partial<S> | null;
} {
  return useEngine().location as Omit<Location, "state"> & { state: Partial<S> | null };
}

export function useNavigate(): NavigateFunction {
  return useEngine().navigate;
}

export function useParams<T extends Params = Params>(): T {
  const engine = useContext(RouterContext);
  const testParams = useContext(ParamsContext);

  const nextParams = useNextParamsSafe();
  if (engine?.kind === "memory") return testParams as T;
  const flat: Params = {};
  for (const [key, value] of Object.entries(nextParams || {})) {
    if (value === undefined) continue;
    flat[key] = Array.isArray(value) ? value.join("/") : String(value);
  }
  return flat as T;
}

function useNextParamsSafe(): Record<string, string | string[] | undefined> | null {
  try {
    return useNextParams();
  } catch {
    return null;
  }
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: NavigateOptions) => void,
] {
  const { location, navigate } = useEngine();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const pathname = location.pathname;
  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>, options: NavigateOptions = {}) => {
      const query = new URLSearchParams(next).toString();
      navigate(`${pathname}${query ? `?${query}` : ""}`, options);
    },
    [navigate, pathname],
  );
  return [params, setParams];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  state?: NavState;
};

export function Link({ to, replace, state, onClick, children, ...rest }: LinkProps) {
  const engine = useEngine();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (engine.kind === "next") {
      rememberState(to, state);
      return;
    }
    event.preventDefault();
    engine.navigate(to, { replace, state });
  }

  if (engine.kind === "next") {
    return (
      <NextLink href={to} replace={replace} onClick={handleClick} {...rest}>
        {children}
      </NextLink>
    );
  }
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

type NavLinkProps = Omit<LinkProps, "className"> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
};

export function NavLink({ to, end = false, className, ...rest }: NavLinkProps) {
  const { pathname } = useLocation();
  const target = splitPath(to).pathname.replace(/\/$/, "") || "/";
  const isActive = end
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link
      to={to}
      aria-current={isActive ? "page" : undefined}
      className={typeof className === "function" ? className({ isActive }) : className}
      {...rest}
    />
  );
}

export function Navigate({
  to,
  replace = false,
  state,
}: {
  to: string;
  replace?: boolean;
  state?: NavState;
}) {
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    navigate(to, { replace, state });
  }, [navigate, to, replace, state]);
  return null;
}
