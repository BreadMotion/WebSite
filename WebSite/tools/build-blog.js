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

// サイトのベースURL（末尾スラッシュなし）
const BASE_URL = "https://breadmotion.github.io/WebSite";

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

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const da = ("0" + d.getDate()).slice(-2);
  return `${y}/${m}/${da}`;
}

function createHtml({
  id,
  title,
  description,
  date,
  category,
  tags = [],
  bodyHtml,
  thumbnail,
  adScript = "",
}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || "");
  const safeDate = escapeHtml(formatDate(date));
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

  // URL関連の構築
  const canonicalUrl = `${BASE_URL}/blog/${id}.html`;

  // 画像URLの構築（thumbnailがあればそれを優先、なければデフォルトOGP）
  // 外部URL(httpから始まる)の場合はそのまま、そうでなければサイト内パスとして結合
  let imageUrl = thumbnail;
  if (imageUrl) {
    if (!imageUrl.startsWith("http")) {
      // サイト内パスの場合、絶対パス(URL)に変換する
      // ../assets/... や assets/... などを考慮して正規化
      const cleanPath = imageUrl
        .replace(/^(\.\.\/)+/, "")
        .replace(/^\/+/, "");
      imageUrl = `${BASE_URL}/${cleanPath}`;
    }
  } else {
    imageUrl = `${BASE_URL}/assets/img/ogp.png`;
  }

  // 構造化データ (JSON-LD)
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
    dateModified: date, // 更新日があればそれを使うが、現状データにはないので公開日と同じ
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
  <head prefix="og: https://ogp.me/ns#">
    <meta charset="UTF-8" />
    <title>${safeTitle} | PanKUN Blog</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${safeDesc}" />

    <!-- Canonical -->
    <link rel="canonical" href="${canonicalUrl}" />

    ${adScript}

    <!-- JSON-LD -->
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
    </script>

    <meta property="og:title" content="${safeTitle} | PanKUN Blog" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="PanKUN" />
    <meta property="og:email" content="pankun.dev@gmail.com" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${imageUrl}" />

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

          <section class="section section--recommend">
            <h2 class="section__title">おすすめ記事</h2>
            <div id="recommendList" class="recommend-grid"></div>
          </section>
        </article>
      </main>
    </div>

    <script src="../assets/js/layout.js" defer></script>
    <script src="../assets/js/ui.js"></script>

    <canvas id="menuAnimationCanvas"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>
    <script src="../assets/js/particles.js"></script>
    <script src="../assets/js/recommend.js" defer></script>
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

  // サムネイル出力先ディレクトリが無ければ作る
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }

  // 広告スクリプトの読み込み
  let adScript = "";
  if (fs.existsSync(AD_SCRIPT_PATH)) {
    adScript = fs.readFileSync(AD_SCRIPT_PATH, "utf8");
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
    let thumbnail = data.thumbnail || "";

    // Base64画像の場合はファイルとして保存してパスを差し替える
    if (thumbnail.startsWith("data:image")) {
      try {
        const matches = thumbnail.match(
          /^data:image\/([a-zA-Z0-9]+);base64,(.+)$/,
        );
        if (matches) {
          const ext =
            matches[1] === "jpeg" ? "jpg" : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const filename = `${id}.${ext}`;
          const outPath = path.join(
            THUMBNAIL_DIR,
            filename,
          );

          fs.writeFileSync(outPath, buffer);
          console.log(`Saved thumbnail: ${filename}`);

          // JSONやOGP用にルート相対パス(assets/...)で保持する
          thumbnail = `assets/img/thumbnails/${filename}`;
        }
      } catch (e) {
        console.error(
          `Failed to process thumbnail for ${id}:`,
          e,
        );
      }
    }

    const recommended = data.recommended || false;
    const tagsRaw = data.tags || [];
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw
      : String(tagsRaw)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    const relPath = `blog/${id}.html`;

    // 個別記事 HTML を書き出し（tags, thumbnail を渡す）
    const html = createHtml({
      id,
      title,
      description,
      date,
      category,
      tags,
      bodyHtml: htmlBody,
      thumbnail,
      adScript,
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
      recommended,
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
