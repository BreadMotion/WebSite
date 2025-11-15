// tools/generate-pagelists.mjs
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();

async function readDirMd(dir) {
  const files = await fs.readdir(dir);
  return files.filter((f) => f.toLowerCase().endsWith(".md"));
}

// --- フロントマターをパース（超シンプル実装） ---
function parseFrontMatter(mdText) {
  if (!mdText.startsWith("---")) return { meta: {}, body: mdText };

  const endIndex = mdText.indexOf("\n---", 3);
  if (endIndex === -1) return { meta: {}, body: mdText };

  const header = mdText.slice(3, endIndex).trim();
  const body = mdText.slice(endIndex + 4).trim(); // \n--- の後ろから

  const meta = {};
  header.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  });

  return { meta, body };
}

// 文字列 "a, b, c" → ["a","b","c"]
function parseTags(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// Blog 用 pagelist.json 生成
async function generateBlog() {
  const blogDir = path.join(ROOT, "content", "blog");
  const outPath = path.join(blogDir, "pagelist.json");

  const mdFiles = await readDirMd(blogDir);
  const entries = [];

  for (const file of mdFiles) {
    const fullPath = path.join(blogDir, file);
    const text = await fs.readFile(fullPath, "utf8");
    const { meta } = parseFrontMatter(text);

    const id = path.basename(file, path.extname(file));
    const title = meta.title || id;
    const date = meta.date || "";
    const category = meta.category || "";
    const description = meta.description || "";
    const thumbnail = meta.thumbnail || "";
    const tags = parseTags(meta.tags);

    entries.push({
      id,
      title,
      date,
      category,
      description,
      thumbnail,
      tags,
      contentPath: `content/blog/${file}`,
    });
  }

  entries.sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return db - da;
  });

  await fs.writeFile(outPath, JSON.stringify(entries, null, 2), "utf8");
  console.log(`Blog pagelist.json を更新しました: ${outPath}`);
}

// Portfolio 用 pagelist.json 生成
async function generatePortfolio() {
  const portDir = path.join(ROOT, "content", "portfolio");
  const outPath = path.join(portDir, "pagelist.json");

  const mdFiles = await readDirMd(portDir);
  const entries = [];

  for (const file of mdFiles) {
    const fullPath = path.join(portDir, file);
    const text = await fs.readFile(fullPath, "utf8");
    const { meta } = parseFrontMatter(text);

    const id = path.basename(file, path.extname(file));
    const title = meta.title || id;
    const role = meta.role || "";
    const tech = meta.tech || "";
    const platform = meta.platform || "";
    const description = meta.description || "";
    const tags = parseTags(meta.tags);
    const thumbnail = meta.thumbnail;

    const links = {};
    if (meta.storepage) links.storepage = meta.storepage;
    if (meta.GameCreatorsCamp) links.GameCreatorsCamp = meta.GameCreatorsCamp;
    if (meta.X) links.X = meta.X;
    if (meta.Youtube) links.Youtube = meta.Youtube;

    entries.push({
      id,
      title,
      role,
      tech,
      platform,
      description,
      tags,
      contentPath: `content/portfolio/${file}`,
      thumbnail,
      links,
    });
  }

  entries.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ja"));

  await fs.writeFile(outPath, JSON.stringify(entries, null, 2), "utf8");
  console.log(`Portfolio pagelist.json を更新しました: ${outPath}`);
}

async function main() {
  await generateBlog();
  await generatePortfolio();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
