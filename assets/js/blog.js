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
  // URL パラメータ操作ヘルパ
  // -----------------------------
  function readInitialParams() {
    const params = new URLSearchParams(location.search);
    // 優先順: tag -> q
    const tag = params.get("tag") || "";
    const q = params.get("q") || "";
    const category = params.get("category") || "";

    const initial = tag || q;
    if (searchInput && initial) {
      searchInput.value = initial;
    }
    if (categorySelect && category) {
      categorySelect.value = category;
    }
  }

  // 現在の UI 状態を URL に反映（ページの再読み込みはしない）
  function updateUrlParams(keyword, category) {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (category) params.set("category", category);
    const newUrl =
      location.pathname +
      (params.toString() ? "?" + params.toString() : "");
    history.replaceState(null, "", newUrl);
  }

  // -----------------------------
  // JSON 読み込み
  // -----------------------------
  async function loadPosts() {
    try {
      const res = await fetch("assets/data/blogList.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allPosts = await res.json();
      // 初期パラメータを読み取ってフィルタをプリセット
      readInitialParams();
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

      // キーワードフィルタ (タイトル/説明/カテゴリ/タグ)
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

    // フィルタ状態を URL に反映
    updateUrlParams(keyword, categoryFilter);

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
      const tagsArr = Array.isArray(post.tags)
        ? post.tags
        : String(post.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

      if (tagsArr.length) {
        const tagRow = document.createElement("div");
        tagRow.className = "card__tags";
        tagsArr.forEach((t) => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = t;

          // タグはクリックでそのタグでフィルタ
          tag.addEventListener("click", (e) => {
            e.stopPropagation(); // カードクリックを阻止
            if (searchInput) searchInput.value = t;
            if (categorySelect) categorySelect.value = "";
            render();
            // URL に tag（または q）として反映（履歴は積まない）
            const params = new URLSearchParams();
            params.set("q", t);
            const newUrl =
              location.pathname + "?" + params.toString();
            history.replaceState(null, "", newUrl);
          });

          // キーボード対応
          tag.tabIndex = 0;
          tag.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              tag.click();
            }
          });

          tagRow.appendChild(tag);
        });
        body.appendChild(tagRow);
      }

      card.appendChild(body);

      // カード全体クリックで記事ページへ遷移
      card.addEventListener("click", () => {
        if (post.contentPath) {
          // 現在のフィルタ状態をクエリに付与して遷移（戻ってきたときに復元しやすくする）
          const params = new URLSearchParams();
          const q = (searchInput?.value || "").trim();
          const category = (
            categorySelect?.value || ""
          ).trim();
          if (q) params.set("q", q);
          if (category) params.set("category", category);
          const target =
            post.contentPath +
            (params.toString()
              ? "?" + params.toString()
              : "");
          window.location.href = target;
        }
      });

      listEl.appendChild(card);
    });
  }

  // -----------------------------
  // イベント登録
  // -----------------------------
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      // タイプ中は即時フィルタ（必要に応じてデバウンスを追加してください）
      render();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", render);
  }

  // 初回ロード
  loadPosts();
});
