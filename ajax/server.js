const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let file = pathname === "/" ? "/index.html" : pathname;
  file = path.join(ROOT, file);

  if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
    json(res, 404, { error: "Not found." });
    return;
  }

  const ext = path.extname(file);
  fs.readFile(file, (err, content) => {
    if (err) return json(res, 500, { error: "Could not read file." });
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Weather app running at http://localhost:${PORT}`);
  console.log(`API data served from weather-data.json`);
});
