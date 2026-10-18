import ErrorBoundary from "@/components/ErrorBoundary";
import { matchPath, ParamsProvider, useLocation, type Params } from "@/lib/router";
import ComingSoon from "@/screens/ComingSoon";
import StartPage from "@/screens/StartPage";
import { bare, type Page } from "./pageHelpers";
import { pages as featurePages } from "./routes";

const SHARED_PAGES: Page[] = [bare("/", StartPage)];

const PAGES: Page[] = [...SHARED_PAGES, ...featurePages];
const COMING_SOON: Page = bare("/*", ComingSoon);

function specificity(pattern: string): number {
  const parts = pattern.split("/").filter(Boolean);
  const fixed = parts.filter((part) => !part.startsWith(":")).length;
  return fixed * 10 + parts.length;
}

function find(pathname: string): { page: Page; params: Params } {
  let best: { page: Page; params: Params; score: number } | null = null;
  for (const page of PAGES) {
    const params = matchPath(page.path, pathname);
    if (!params) continue;
    const score = specificity(page.path);
    if (!best || score > best.score) best = { page, params, score };
  }
  return best ?? { page: COMING_SOON, params: {} };
}

export function hasPage(address: string): boolean {
  const pathname = address.split("?")[0].replace(/\/$/, "") || "/";
  return PAGES.some((page) => matchPath(page.path, pathname) !== null);
}

export default function TestApp() {
  const { pathname } = useLocation();
  const { page, params } = find(pathname.replace(/\/$/, "") || "/");
  const Layout = page.layout;
  const content = <ParamsProvider params={params}>{page.render()}</ParamsProvider>;
  return (
    <ErrorBoundary key={pathname}>{Layout ? <Layout>{content}</Layout> : content}</ErrorBoundary>
  );
}
