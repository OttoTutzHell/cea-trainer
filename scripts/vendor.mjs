// Rebuilds vendor/ from the pinned devDependencies, so the page loads no third-party scripts.
//   npm install && npm run vendor
// Commit the result: GitHub Pages serves vendor/ as-is, with no build step.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const out = new URL("../vendor/", import.meta.url);
mkdirSync(out, { recursive: true });
const pkg = (name) => JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url)));

// SheetJS ships a browser build; copy it with its licence.
copyFileSync(new URL("../node_modules/xlsx/dist/xlsx.full.min.js", import.meta.url), new URL("xlsx.full.min.js", out));
copyFileSync(new URL("../node_modules/xlsx/LICENSE", import.meta.url), new URL("LICENSE-sheetjs.txt", out));

// The Anthropic SDK ships ES modules. Bundle it into one classic script that sets window.AnthropicSDK,
// so the page also works when opened straight from disk (file://), where module imports are blocked.
await build({
  stdin: { contents: 'export { default, Anthropic } from "@anthropic-ai/sdk";', resolveDir: new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") },
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "AnthropicSDK",
  platform: "browser",
  target: "es2020",
  outfile: new URL("anthropic-sdk.min.js", out).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  legalComments: "eof",
  logLevel: "warning",
});
copyFileSync(new URL("../node_modules/@anthropic-ai/sdk/LICENSE", import.meta.url), new URL("LICENSE-anthropic-sdk.txt", out));

writeFileSync(new URL("VERSIONS.txt", out),
  `Built by scripts/vendor.mjs from package.json's pinned devDependencies.\n` +
  `xlsx (SheetJS Community Edition) ${pkg("xlsx").version}  Apache-2.0  https://sheetjs.com\n` +
  `@anthropic-ai/sdk ${pkg("@anthropic-ai/sdk").version}  Apache-2.0  https://github.com/anthropics/anthropic-sdk-typescript\n`);
console.log("vendor/ rebuilt:", pkg("xlsx").version, pkg("@anthropic-ai/sdk").version);
