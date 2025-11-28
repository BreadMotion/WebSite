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
const AD_SCRIPT_PATH = path.join(
  ROOT,
  "partials",
  "ad-script.html",
);

const THUMBNAIL_DIR = path.join(
  ROOT,
  "assets",
  "img",
  "thumbnails",
);

const BASE_URL = "https://breadmotion.github.io/WebSite";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"]/g, (c) => {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      }[c] || c
    );
  });
}

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const da = ("0" + d.getDate()).slice(-2);
  return `${y}/${m}/${da}`;
}

function createTocHtml(headings) {
  if (!headings || headings.length === 0) return "";
  const filteredHeadings = headings.filter(
    (h) => h.level === 2 || h.level === 3,
  );
  if (filteredHeadings.length === 0) return "";

  let tocHtml = '<ul class="toc-list">';
  for (const heading of filteredHeadings) {
    tocHtml += `<li class="toc-item toc-item--level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`;
  }
  tocHtml += "</ul>";
  return tocHtml;
}

function createHtml({
  id,
  title,
  description,
  date,
  category,
  tags = [],
  bodyHtml,
  tocHtml,
  thumbnail,
  adScript = "",
}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || "");
  const safeDate = escapeHtml(formatDate(date));
  const safeCategory = escapeHtml(category || "");
  const safeTagsArr = (
    Array.isArray(tags)
      ? tags
      : String(tags || "").split(",")
  )
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => escapeHtml(t));

  const tagsHtml = safeTagsArr.length
    ? `<p class="post-detail__tags">${safeTagsArr.map((t) => `<a class="tag" href="../blog.html?tag=${encodeURIComponent(t)}">${t}</a>`).join(" ")}</p>`
    : "";

  const canonicalUrl = `${BASE_URL}/blog/${id}.html`;

  let imageUrl = thumbnail;
  if (imageUrl && !imageUrl.startsWith("http")) {
    const cleanPath = imageUrl
      .replace(/^(\.\.\/)+/, "")
      .replace(/^\/+/, "");
    imageUrl = `${BASE_URL}/${cleanPath}`;
  } else if (!imageUrl) {
    imageUrl = `${BASE_URL}/assets/img/ogp.png`;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    headline: title,
    description: description || "",
    image: [imageUrl],
    datePublished: date,
    dateModified: date,
    author: {
      "@type": "Person",
      name: "PanKUN",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "PanKUN",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/assets/img/favicon-192.png`,
      },
    },
  };

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle} | PanKUN Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${canonicalUrl}" />
    ${adScript}
    <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
    <meta property="og:title" content="${safeTitle} | PanKUN Blog" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="PanKUN" />
    <link rel="stylesheet" href="../assets/css/base.css" />
    <link rel="stylesheet" href="../assets/css/layout.css" />
    <link rel="stylesheet" href="../assets/css/blog.css" />
  </head>
  <body data-page="blog">
    <div class="page-shell">
      <main class="main-container">
        <div class="post-layout">
          <div class="post-content">
            <article class="post-detail">
              <nav aria-label="breadcrumb" class="breadcrumb">
                <ol class="breadcrumb__list">
                  <li class="breadcrumb__item"><a href="../index.html">ホーム</a></li>
                  <li class="breadcrumb__item"><a href="../blog.html">ブログ</a></li>
                  <li class="breadcrumb__item" aria-current="page">${safeTitle}</li>
                </ol>
              </nav>
              <header class="post-detail__header">
                <p class="post-detail__meta">${safeDate}${safeCategory ? " / " + safeCategory : ""}</p>
                <h1 class="post-detail__title">${safeTitle}</h1>
                ${safeDesc ? `<p class="post-detail__description">${safeDesc}</p>` : ""}
                ${tagsHtml}
              </header>
              <section class="post-detail__body markdown-body">${bodyHtml}</section>
              <section class="section section--recommend">
                <h2 class="section__title">おすすめ記事</h2>
                <div id="recommendList" class="recommend-grid"></div>
              </section>
              <div class="post-detail__nav post-detail__nav--bottom">
                <a href="../blog.html" class="btn btn--back">← ブログ一覧へ戻る</a>
              </div>
            </article>
          </div>
          <aside class="post-sidebar">
            <div class="toc-sticky-container">
              <nav class="toc">
                <h2 class="toc__title">目次</h2>
                ${tocHtml}
              </nav>
            </div>
          </aside>
        </div>
      </main>
    </div>
    <script src="../assets/js/layout.js" defer></script>
    <script src="../assets/js/ui.js"></script>
    <canvas id="menuAnimationCanvas"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
    <script src="../assets/js/particles.js"></script>
    <script src="../assets/js/toc.js" defer></script>
    <script src="../assets/js/recommend.js" defer></script>
  </body>
</html>`;
}

(async () => {
  const { marked } = await import("marked");

  if (!fs.existsSync(OUTPUT_DIR))
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(THUMBNAIL_DIR))
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

  const adScript = fs.existsSync(AD_SCRIPT_PATH)
    ? fs.readFileSync(AD_SCRIPT_PATH, "utf8")
    : "";

  const posts = [];
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const id = path.basename(file, ".md");
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);

    const headings = [];
    const slugger = new marked.Slugger();
    const renderer = new marked.Renderer();
    renderer.heading = (text, level) => {
      const id = slugger.slug(text);
      headings.push({ level, text, id });
      return `<h${level} id="${id}">${text}</h${level}>`;
    };

    const htmlBody = marked.parse(content, { renderer });
    const tocHtml = createTocHtml(headings);

    const { title, description, date, category } = data;
    let { thumbnail } = data;

    if (thumbnail && thumbnail.startsWith("data:image")) {
      try {
        const matches = thumbnail.match(
          /^data:image\/([a-zA-Z0-9]+);base64,(.+)$/,
        );
        if (matches) {
          const ext =
            matches[1] === "jpeg" ? "jpg" : matches[1];
          const filename = `${id}.${ext}`;
          fs.writeFileSync(
            path.join(THUMBNAIL_DIR, filename),
            Buffer.from(matches[2], "base64"),
          );
          thumbnail = `assets/img/thumbnails/${filename}`;
        }
      } catch (e) {
        console.error(
          `Failed to process thumbnail for ${id}:`,
          e,
        );
      }
    }

    const tagsRaw = data.tags || [];
    const tags = (
      Array.isArray(tagsRaw)
        ? tagsRaw
        : String(tagsRaw).split(",")
    )
      .map((t) => String(t).trim())
      .filter(Boolean);

    const html = createHtml({
      id,
      title: title || id,
      description: description || "",
      date: date || "",
      category: category || "",
      tags,
      bodyHtml: htmlBody,
      tocHtml,
      thumbnail,
      adScript,
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${id}.html`),
      html,
      "utf8",
    );
    console.log(`generated: blog/${id}.html`);

    posts.push({
      id,
      title: title || id,
      date: date || "",
      category: category || "",
      description: description || "",
      tags,
      thumbnail,
      contentPath: `blog/${id}.html`,
      recommended: data.recommended || false,
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
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
