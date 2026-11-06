// A minimal static server for trying the page locally: npm run serve, then open http://localhost:8080
// The page also works from GitHub Pages or any static host; this exists so you don't need one to test.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT) || 8080;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".md": "text/plain; charset=utf-8" };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = normalize(join(root, path.endsWith("/") ? path + "index.html" : path));
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  if (file.includes(`${sep}node_modules${sep}`) || file.includes(`${sep}.git${sep}`)) { res.writeHead(404).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`CEA trainer at http://localhost:${port}`));
