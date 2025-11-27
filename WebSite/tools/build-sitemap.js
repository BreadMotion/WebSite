const fs = require("fs");
const path = require("path");

// あなたのサイトのベースURL（末尾スラッシュなし）
const BASE_URL = "https://breadmotion.github.io/WebSite";

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "sitemap.xml");

// 除外したいディレクトリ
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "partials",
  "content",
]);
// 除外したいファイル名
const IGNORE_FILES = new Set(["sitemap.xml"]);

// XMLエスケープ関数
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
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

function collectHtmlFiles(dir, list, baseDir) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const topDirName = entry.name;
      if (IGNORE_DIRS.has(topDirName)) continue;
      collectHtmlFiles(fullPath, list, baseDir);
    } else if (entry.isFile()) {
      if (!entry.name.endsWith(".html")) continue;
      if (IGNORE_FILES.has(entry.name)) continue;

      // Windows 対応: バックスラッシュ → スラッシュ
      const relUnix = relPath.split(path.sep).join("/");

      list.push(relUnix);
    }
  }
}

// .html の一覧を集める
const htmlFiles = [];
collectHtmlFiles(ROOT, htmlFiles, ROOT);

// index.html は /WebSite/ として、それ以外はそのまま
function toUrl(relPath) {
  // パスセグメントごとにURLエンコード（スペースや日本語対応）
  const encodedPath = relPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  if (encodedPath === "index.html") {
    return `${BASE_URL}/`;
  }
  return `${BASE_URL}/${encodedPath}`;
}

// ISO8601 日付（lastmod 用）
function formatDate(d) {
  return d.toISOString().split("T")[0];
}

// URL 要素を組み立て
const urlEntries = htmlFiles.map((relPath) => {
  const filePath = path.join(ROOT, relPath);
  const stat = fs.statSync(filePath);
  const lastmod = formatDate(stat.mtime);

  // XMLとして不正な文字をエスケープ
  const loc = escapeXml(toUrl(relPath));

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
});

// sitemap.xml 全体
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

// 書き出し（前後の余計な空白を削除）
fs.writeFileSync(OUTPUT, xml.trim(), "utf8");
console.log(`sitemap generated: ${OUTPUT}`);
console.log("URLs:");
for (const rel of htmlFiles) {
  // コンソール表示用はデコードしたままでも見やすいが、
  // 実際のXMLに入る値を確認するためURL生成関数を通す
  console.log(" -", toUrl(rel));
}
