#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.PORT || 4173);
const root = path.resolve(String(args.root || "app"));

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(String(req.url || "/").split("?")[0]);
  const relative = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(relative).replace(/^([.][.][/\\])+/, "");
  let filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log("Serving", root, "at http://localhost:" + port);
  console.log("Press Ctrl+C to stop.");
});
