import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function toPosixPath(p: string) {
  return p.split(sep).join("/");
}

function nextRouteFromAppPage(filePath: string) {
  // filePath like app/(user)/app/referrals/page.tsx -> /app/referrals
  const rel = toPosixPath(relative(process.cwd(), filePath));
  const parts = rel.split("/");
  if (parts[0] !== "app") return null;
  if (!rel.endsWith("/page.tsx")) return null;

  const routeParts: string[] = [];
  for (const part of parts.slice(1, -1)) {
    // ignore route groups e.g. (user)
    if (part.startsWith("(") && part.endsWith(")")) continue;
    routeParts.push(part);
  }
  return "/" + routeParts.join("/");
}

function extractDesignRoutes(appTsx: string) {
  const content = readFileSync(appTsx, "utf8");
  const routes = new Set<string>();
  const re = /path\s*=\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    routes.add(m[1]);
  }
  return [...routes].sort();
}

function extractNextRoutes(appDir: string) {
  const all = walk(appDir);
  const routes = new Set<string>();
  for (const f of all) {
    const rel = toPosixPath(relative(process.cwd(), f));
    if (rel.startsWith("app/api/")) continue;
    const r = nextRouteFromAppPage(f);
    if (r) routes.add(r);
  }
  return [...routes].sort();
}

function main() {
  const designApp = join(process.cwd(), "Voucherreferralplatform", "src", "app", "App.tsx");
  const nextAppDir = join(process.cwd(), "app");

  const designRoutes = extractDesignRoutes(designApp);
  const nextRoutes = extractNextRoutes(nextAppDir);

  const nextSet = new Set(nextRoutes);
  const designSet = new Set(designRoutes);

  const missingInNext = designRoutes.filter((r) => !nextSet.has(r));
  const missingInDesign = nextRoutes.filter((r) => !designSet.has(r));

  // Minimal mapping hints for common patterns used in this codebase.
  const normalize = (r: string) =>
    r
      .replace(/^\/voucher\/(.+)$/, "/v/$1")
      .replace(/^\/event\/(.+)$/, "/e/$1")
      .replace(/^\/gift-card\/(.+)$/, "/g/$1");

  const normalizedNext = new Set(nextRoutes.map(normalize));
  const missingAfterNormalize = designRoutes.filter((r) => !normalizedNext.has(r));

  const out = [
    "# Design Route Audit",
    "",
    `Design source: \`Voucherreferralplatform/src/app/App.tsx\``,
    `Next.js routes source: \`app/**/page.tsx\` (excluding \`app/api\`)`,
    "",
    `Design routes: ${designRoutes.length}`,
    `Next.js routes: ${nextRoutes.length}`,
    "",
    "## Missing In Next (raw compare)",
    "",
    ...missingInNext.map((r) => `- ${r}`),
    "",
    "## Missing In Next (after normalizing /voucher->/v, /event->/e, /gift-card->/g)",
    "",
    ...missingAfterNormalize.map((r) => `- ${r}`),
    "",
    "## Next Routes Not In Design (raw compare)",
    "",
    ...missingInDesign.map((r) => `- ${r}`),
    "",
  ].join("\n");

  process.stdout.write(out);
}

main();
