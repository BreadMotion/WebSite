const fs = require("fs");
const path = require("path");

const BASE_URL = "https://breadmotion.github.io";
const ROOT = path.join(__dirname, "..", "..");
const OUTPUT = path.join(ROOT, "sitemap.xml");

// スキャンから完全に除外するディレクトリ名
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  "tools",
  "partials",
  "content",
]);

// スキャンから除外するファイル名
const IGNORE_FILES = new Set([
  "sitemap.xml",
  "package.json",
  "package-lock.json",
  ".gitignore",
  "serve.js",
  "README.md",
]);

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
  });
}

function collectHtmlFiles(
  dir,
  allFiles = [],
  baseDir = dir,
) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    // 除外リストにあるディレクトリ名またはファイル名はスキップ
    if (
      IGNORE_DIRS.has(entry.name) ||
      IGNORE_FILES.has(entry.name)
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, allFiles, baseDir);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".html")
    ) {
      const relPath = path
        .relative(baseDir, fullPath)
        .split(path.sep)
        .join("/");
      allFiles.push(relPath);
    }
  }
  return allFiles;
}

const htmlFiles = collectHtmlFiles(ROOT);

function toUrl(relPath) {
  if (relPath === "index.html") {
    return `${BASE_URL}/`;
  }
  if (relPath.endsWith("/index.html")) {
    return `${BASE_URL}/${relPath.substring(0, relPath.length - "index.html".length)}`;
  }
  return `${BASE_URL}/${relPath.replace(/\\/g, "/")}`;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

const urlEntries = htmlFiles.map((relPath) => {
  const filePath = path.join(ROOT, relPath);
  const stat = fs.statSync(filePath);
  const lastmod = formatDate(stat.mtime);
  const loc = escapeXml(toUrl(relPath));

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

fs.writeFileSync(OUTPUT, xml.trim(), "utf8");
console.log(`Sitemap generated: ${OUTPUT}`);
console.log("Included URLs:");
htmlFiles.forEach((rel) => console.log(" -", toUrl(rel)));
