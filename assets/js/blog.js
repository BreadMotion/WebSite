// assets/js/blog.js
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("blogList");
  const emptyEl = document.getElementById(
    "blogEmptyMessage",
  );
  const searchInput = document.getElementById("blogSearch");
  const categorySelect = document.getElementById(
    "blogCategoryFilter",
  );

  if (!listEl) return;

  /** @type {Array<any>} */
  let allPosts = [];

  // -----------------------------
  // JSON 読み込み
  // -----------------------------
  async function loadPosts() {
    try {
      const res = await fetch("assets/data/blogList.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allPosts = await res.json();
      render();
    } catch (err) {
      console.error("Failed to load blog list:", err);
      if (emptyEl) {
        emptyEl.textContent =
          "記事一覧の読み込みに失敗しました。";
        emptyEl.style.display = "block";
      }
    }
  }

  // -----------------------------
  // 描画
  // -----------------------------
  function render() {
    const keyword = (searchInput?.value || "")
      .trim()
      .toLowerCase();
    const categoryFilter = (
      categorySelect?.value || ""
    ).trim();

    const filtered = allPosts.filter((post) => {
      // カテゴリフィルタ
      if (
        categoryFilter &&
        post.category !== categoryFilter
      )
        return false;

      // キーワードフィルタ
      if (keyword) {
        const tags = Array.isArray(post.tags)
          ? post.tags
          : String(post.tags || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

        const haystack = [
          post.title || "",
          post.description || "",
          post.category || "",
          ...tags,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });

    listEl.innerHTML = "";

    if (!filtered.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    filtered.forEach((post) => {
      const card = document.createElement("article");
      card.className = "card card--clickable blog-card";

      // サムネイル
      if (post.thumbnail) {
        const thumb = document.createElement("div");
        thumb.className = "card__thumb";
        const img = document.createElement("img");
        img.src = post.thumbnail;
        img.alt = post.title || "";
        thumb.appendChild(img);
        card.appendChild(thumb);
      }

      const body = document.createElement("div");
      body.className = "card__body";

      // メタ（カテゴリ / 日付）
      const meta = document.createElement("p");
      meta.className = "card__meta";
      const dateText = post.date || "";
      const categoryText = post.category || "";
      meta.textContent = [dateText, categoryText]
        .filter(Boolean)
        .join(" / ");
      body.appendChild(meta);

      // タイトル
      const titleRow = document.createElement("div");
      titleRow.className = "card__title-row";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = post.title || "";
      titleRow.appendChild(title);

      body.appendChild(titleRow);

      // 概要
      if (post.description) {
        const desc = document.createElement("p");
        desc.className = "card__description";
        desc.textContent = post.description;
        body.appendChild(desc);
      }

      // タグ
      if (post.tags && post.tags.length) {
        const tagRow = document.createElement("div");
        tagRow.className = "card__tags";
        post.tags.forEach((t) => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = t;
          tagRow.appendChild(tag);
        });
        body.appendChild(tagRow);
      }

      card.appendChild(body);

      // カード全体クリックで記事ページへ
      card.addEventListener("click", () => {
        if (post.contentPath) {
          window.location.href = post.contentPath;
        }
      });

      listEl.appendChild(card);
    });
  }

  // -----------------------------
  // イベント
  // -----------------------------
  if (searchInput) {
    searchInput.addEventListener("input", render);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", render);
  }

  loadPosts();
});
