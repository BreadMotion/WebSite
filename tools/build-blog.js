const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const OUTPUT_DIR = path.join(ROOT, "blog");
const LIST_JSON = path.join(
  ROOT,
  "assets",
  "data",
  "blogList.json",
);

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, (c) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c];
  });
}

function createHtml({
  id,
  title,
  description,
  date,
  category,
  tags = [],
  bodyHtml,
}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || "");
  const safeDate = escapeHtml(date || "");
  const safeCategory = escapeHtml(category || "");
  // tags は配列として受け取り、それぞれエスケープする
  const safeTagsArr = Array.isArray(tags)
    ? tags
        .map((t) => String(t).trim())
        .filter(Boolean)
        .map((t) => escapeHtml(t))
    : String(tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => escapeHtml(t));

  // タグ群の HTML（存在する場合）
  const tagsHtml = safeTagsArr.length
    ? `<p class="post-detail__tags">${safeTagsArr
        .map(
          (t) =>
            `<a class="tag" href="../blog.html?tag=${encodeURIComponent(
              t,
            )}">${t}</a>`,
        )
        .join(" ")}</p>`
    : "";

  return `<!doctype html>
<html lang="ja">
  <head prefix="og: https://ogp.me/ns#">
    <meta charset="UTF-8" />
    <title>${safeTitle} | PanKUN Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${safeDesc}" />

    <meta property="og:title" content="${safeTitle} | PanKUN Blog" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="blog" />
    <meta property="og:image" content="../assets/img/ogp.png" />
    <meta property="og:site_name" content="PanKUN" />

    <link rel="stylesheet" href="../assets/css/base.css" />
    <link rel="stylesheet" href="../assets/css/layout.css" />
    <link rel="stylesheet" href="../assets/css/blog.css" />
  </head>
  <body data-page="blog">
    <div class="page-shell">
      <main class="main-container">
        <article class="post-detail reveal-on-scroll">
          <header class="post-detail__header">
            <p class="post-detail__meta">${safeDate}${
              safeCategory ? " / " + safeCategory : ""
            }</p>
            <h1 class="post-detail__title">${safeTitle}</h1>
            ${
              safeDesc
                ? `<p class="post-detail__description">${safeDesc}</p>`
                : ""
            }
            ${tagsHtml}
          </header>

          <section class="post-detail__body markdown-body">
${bodyHtml}
          </section>
        </article>
      </main>
    </div>

    <script src="../assets/js/layout.js" defer></script>
    <script src="../assets/js/ui.js"></script>
  </body>
</html>`;
}

// メイン処理を async でラップして marked を import() する
(async () => {
  const { marked } = await import("marked");

  // 出力先ディレクトリが無ければ作る
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const posts = [];
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const id = path.basename(file, ".md"); // blog_00001 など
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");

    const { data, content } = matter(raw);
    const htmlBody = marked.parse(content);

    const title = data.title || id;
    const description = data.description || "";
    const date = data.date || "";
    const category = data.category || "";
    const thumbnail = data.thumbnail || "";
    const tagsRaw = data.tags || [];
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw
      : String(tagsRaw)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    const relPath = `blog/${id}.html`;

    // 個別記事 HTML を書き出し（tags を渡す）
    const html = createHtml({
      id,
      title,
      description,
      date,
      category,
      tags,
      bodyHtml: htmlBody,
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${id}.html`),
      html,
      "utf8",
    );
    console.log(`generated: blog/${id}.html`);

    // 一覧用データ
    posts.push({
      id,
      title,
      date,
      category,
      description,
      tags,
      thumbnail,
      contentPath: relPath,
    });
  }

  // 日付降順
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  fs.writeFileSync(
    LIST_JSON,
    JSON.stringify(posts, null, 2),
    "utf8",
  );
  console.log(`updated: assets/data/blogList.json`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
