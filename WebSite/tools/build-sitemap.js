const fs = require("fs");
const path = require("path");

const BASE_URL = "https://breadmotion.github.io";
// プロジェクトのルート (breadmotion.github.io)
const ROOT = path.join(__dirname, "..", "..");
const OUTPUT = path.join(ROOT, "sitemap.xml");

// サイトコンテンツのルート (breadmotion.github.io/WebSite)
const WEBSITE_ROOT = path.join(ROOT, "WebSite");

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

// 収集の開始点を WebSite ディレクトリに変更
const htmlFiles = collectHtmlFiles(WEBSITE_ROOT);

// プロジェクトルートにある index.html も手動で追加する
if (fs.existsSync(path.join(ROOT, "index.html"))) {
  // WebSite/index.html と区別するために特別な名前を付けてリストに追加
  htmlFiles.push("ROOT_INDEX.html");
}

function toUrl(relPath) {
  // プロジェクトルートの index.html を処理
  if (relPath === "ROOT_INDEX.html") {
    return `${BASE_URL}/`;
  }
  // WebSite ディレクトリ直下の index.html を処理
  if (relPath === "index.html") {
    return `${BASE_URL}/`;
  }
  // サブディレクトリ内の index.html を処理 (例: en/index.html -> /en/)
  if (relPath.endsWith("/index.html")) {
    return `${BASE_URL}/${relPath.substring(0, relPath.length - "index.html".length)}`;
  }
  // その他のHTMLファイル
  return `${BASE_URL}/${relPath.replace(/\\/g, "/")}`;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

const uniqueUrls = new Set();

const urlEntries = htmlFiles
  .map((relPath) => {
    const filePath =
      relPath === "ROOT_INDEX.html"
        ? path.join(ROOT, "index.html")
        : path.join(WEBSITE_ROOT, relPath);

    const stat = fs.statSync(filePath);
    const lastmod = formatDate(stat.mtime);
    const loc = escapeXml(toUrl(relPath));

    // 重複するURLは追加しない (ルートURLなど)
    if (uniqueUrls.has(loc)) {
      return null;
    }
    uniqueUrls.add(loc);

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .filter((entry) => entry !== null); // null (重複エントリ) を除去

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

fs.writeFileSync(OUTPUT, xml.trim(), "utf8");
console.log(`Sitemap generated: ${OUTPUT}`);
console.log("Included URLs:");
uniqueUrls.forEach((url) => console.log(" -", url));
