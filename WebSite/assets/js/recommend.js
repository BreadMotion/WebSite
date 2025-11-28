document.addEventListener("DOMContentLoaded", async () => {
  const recommendListEl =
    document.getElementById("recommendList");
  if (!recommendListEl) return;

  const lang = document.documentElement.lang;
  const isEn = lang === "en";

  // 現在のパスが /blog/ ディレクトリ内か判定してパスを調整
  const isBlogDir =
    window.location.pathname.includes("/blog/") &&
    !window.location.pathname.endsWith("blog.html");

  let basePath = "";
  if (isBlogDir) {
    // ブログ詳細ページなど (/blog/xxx.html)
    // 日本語: /WebSite/blog/xxx.html -> ../assets/...
    // 英語: /WebSite/en/blog/xxx.html -> ../../assets/...
    basePath = isEn ? "../../" : "../";
  } else {
    // 一覧ページやトップページ
    // 日本語: /WebSite/index.html -> assets/...
    // 英語: /WebSite/en/index.html -> ../assets/...
    basePath = isEn ? "../" : "";
  }

  // データパス
  const blogListPath = isEn
    ? `${basePath}assets/data/blogList_en.json`
    : `${basePath}assets/data/blogList.json`;
  // GSC等から生成する人気記事リスト（IDの配列を想定: ["blog_0001", "blog_0003"]）
  const popularDataPath = `${basePath}assets/data/popular.json`;

  try {
    // 並行して取得（popular.json は無い場合もあるので失敗を許容）
    const [blogListRes, popularRes] =
      await Promise.allSettled([
        fetch(blogListPath),
        fetch(popularDataPath),
      ]);

    if (
      blogListRes.status !== "fulfilled" ||
      !blogListRes.value.ok
    ) {
      throw new Error("Failed to load blog list");
    }
    const posts = await blogListRes.value.json();

    // 現在の記事IDを特定（詳細ページの場合）
    let currentId = null;
    // HTMLファイル名からIDを抽出 (例: .../blog/blog_00001.html)
    const match = window.location.pathname.match(
      /(blog_\d+)\.html$/,
    );
    if (match) {
      currentId = match[1];
    }

    let targetPosts = [];
    let sectionTitle = isEn
      ? "Recommended"
      : "おすすめ記事";

    if (currentId) {
      // ==========================================
      // 記事詳細ページ: タグベースの「関連記事」
      // ==========================================
      sectionTitle = isEn ? "Related Posts" : "関連記事";
      const currentPost = posts.find(
        (p) => p.id === currentId,
      );

      if (currentPost) {
        // 関連度スコアリング
        const scoredPosts = posts
          .filter((p) => p.id !== currentId) // 自分自身を除外
          .map((p) => {
            let score = 0;
            // タグの一致数
            if (currentPost.tags && p.tags) {
              const currentTags = new Set(currentPost.tags);
              const targetTags = new Set(p.tags);
              for (const tag of targetTags) {
                if (currentTags.has(tag)) score++;
              }
            }
            // カテゴリ一致（微加点）
            if (
              currentPost.category &&
              p.category &&
              currentPost.category === p.category
            ) {
              score += 0.5;
            }
            return { post: p, score };
          });

        // スコア降順 > 日付降順
        scoredPosts.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const dateA = a.post.date
            ? new Date(a.post.date)
            : new Date(0);
          const dateB = b.post.date
            ? new Date(b.post.date)
            : new Date(0);
          return dateB - dateA;
        });

        // 上位3件を取得（スコア0でもリストには入るので、関連なしなら最新順になる）
        targetPosts = scoredPosts
          .slice(0, 3)
          .map((item) => item.post);
      } else {
        // 現在の記事が見つからない場合は最新記事を表示
        targetPosts = posts.slice(0, 3);
      }
    } else {
      // ==========================================
      // トップページ等: 「人気記事」 or 「おすすめ記事」
      // ==========================================

      let popularIds = [];
      // popular.json が取得できていればパース
      if (
        popularRes.status === "fulfilled" &&
        popularRes.value.ok
      ) {
        try {
          popularIds = await popularRes.value.json();
        } catch (e) {
          console.warn("Invalid popular.json", e);
        }
      }

      if (popularIds.length > 0) {
        // GSCデータがある場合 -> 「人気記事」
        sectionTitle = isEn ? "Popular Posts" : "人気記事";
        targetPosts = popularIds
          .map((id) => posts.find((p) => p.id === id))
          .filter((p) => p !== undefined)
          .slice(0, 3);
      }

      // 人気記事がない、または数が足りない場合 -> 「おすすめ記事」(recommended: true) で埋める
      if (targetPosts.length < 3) {
        const recommended = posts
          .filter((p) => p.recommended === true)
          .filter((p) => !targetPosts.includes(p)) // 重複除外
          .sort((a, b) => {
            const dateA = a.date
              ? new Date(a.date)
              : new Date(0);
            const dateB = b.date
              ? new Date(b.date)
              : new Date(0);
            return dateB - dateA;
          });

        const needed = 3 - targetPosts.length;
        targetPosts = [
          ...targetPosts,
          ...recommended.slice(0, needed),
        ];

        // それでも足りなければ最新記事で埋める
        if (targetPosts.length < 3) {
          const latest = posts
            .filter((p) => !targetPosts.includes(p))
            .slice(0, 3 - targetPosts.length);
          targetPosts = [...targetPosts, ...latest];
        }

        // 人気記事データが全くなかった場合はタイトルをデフォルトに戻す
        if (popularIds.length === 0) {
          sectionTitle = isEn
            ? "Recommended"
            : "おすすめ記事";
        }
      }
    }

    // HTML描画
    if (targetPosts.length > 0) {
      renderPosts(recommendListEl, targetPosts, basePath);

      // セクションタイトルの更新 (HTML側はデフォルトで「おすすめ記事」となっている想定)
      const sectionEl = recommendListEl.closest(".section");
      if (sectionEl) {
        const titleEl = sectionEl.querySelector(
          ".section__title",
        );
        if (titleEl) {
          titleEl.textContent = sectionTitle;
        }
      }
    } else {
      // 表示するものがない場合はセクションごと隠すなどの処理も検討可能
      recommendListEl.innerHTML = isEn
        ? "<p>No articles found.</p>"
        : "<p>記事がありません。</p>";
    }
  } catch (err) {
    console.error("Failed to load recommended posts:", err);
  }
});

function renderPosts(container, posts, basePath) {
  container.innerHTML = "";

  const fixPath = (path) => {
    if (!path) return path;
    if (path.startsWith("http") || path.startsWith("data:"))
      return path;
    return basePath + path;
  };

  posts.forEach((post) => {
    const card = document.createElement("a");
    card.className = "card card--recommend";
    card.href = `${basePath}${post.contentPath || `blog/${post.id}.html`}`;

    // サムネイル
    const img = document.createElement("img");
    img.className = "card--recommend__thumb";
    img.src =
      fixPath(post.thumbnail) ||
      fixPath("assets/img/ogp.png");
    img.alt = post.title;
    img.loading = "lazy";

    // コンテンツ
    const content = document.createElement("div");
    content.className = "card--recommend__content";

    const title = document.createElement("h3");
    title.className = "card--recommend__title";
    title.textContent = post.title;

    const desc = document.createElement("p");
    desc.className = "card--recommend__desc";
    desc.textContent = post.description || "";

    const meta = document.createElement("div");
    meta.className = "card--recommend__meta";

    // 日付
    const dateSpan = document.createElement("span");
    if (post.date) {
      const d = new Date(post.date);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = ("0" + (d.getMonth() + 1)).slice(-2);
        const da = ("0" + d.getDate()).slice(-2);
        dateSpan.textContent = `${y}/${m}/${da}`;
      } else {
        dateSpan.textContent = post.date;
      }
    }

    // カテゴリ
    const categorySpan = document.createElement("span");
    if (post.category) {
      categorySpan.className = "card--recommend__tag";
      categorySpan.textContent = post.category;
    }

    meta.appendChild(dateSpan);
    if (post.category) {
      meta.appendChild(categorySpan);
    }

    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(meta);

    card.appendChild(img);
    card.appendChild(content);

    container.appendChild(card);
  });
}
