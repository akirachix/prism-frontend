import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function modulesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file) && !/^index\.tsx?$/.test(file))
    .map((file) => file.replace(/\.tsx?$/, ""))
    .sort();
}

const asName = (file) => file.replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase());

function writeIndex(dir, exportName, type) {
  const files = modulesIn(join(root, dir));
  const imports = files
    .map((f) => `import { ${exportName} as ${asName(f)} } from "./${f}";\n`)
    .join("");
  const list = files.map((f) => `  ...${asName(f)},\n`).join("");
  const content = `${type.import}${imports}\nexport const ${exportName}${type.annotation} = [\n${list}];\n`;
  mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, dir, "index.ts"), content);
  return files.length;
}

const handlers = writeIndex("src/mocks/handlers", "handlers", {
  import: 'import type { HttpHandler } from "msw";\n',
  annotation: ": HttpHandler[]",
});
const pages = writeIndex("tests/routes", "pages", {
  import: 'import type { Page } from "../pageHelpers";\n',
  annotation: ": Page[]",
});
console.log(`Registered ${handlers} mock endpoint files and ${pages} test page files.`);
