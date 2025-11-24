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
      if (
        categoryFilter &&
        post.category !== categoryFilter
      )
        return false;

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

      const meta = document.createElement("p");
      meta.className = "card__meta";
      const dateText = post.date || "";
      const categoryText = post.category || "";
      meta.textContent = [dateText, categoryText]
        .filter(Boolean)
        .join(" / ");
      body.appendChild(meta);

      const titleRow = document.createElement("div");
      titleRow.className = "card__title-row";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = post.title || "";
      titleRow.appendChild(title);

      body.appendChild(titleRow);

      if (post.description) {
        const desc = document.createElement("p");
        desc.className = "card__description";
        desc.textContent = post.description;
        body.appendChild(desc);
      }

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

          tag.addEventListener("click", (e) => {
            e.stopPropagation();
            if (searchInput) searchInput.value = t;
            if (categorySelect) categorySelect.value = "";
            render();
            const params = new URLSearchParams();
            params.set("q", t);
            const newUrl =
              location.pathname + "?" + params.toString();
            history.replaceState(null, "", newUrl);
          });

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
      card.addEventListener("click", () => {
        if (post.contentPath) {
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
      render();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", render);
  }

  loadPosts();
});
