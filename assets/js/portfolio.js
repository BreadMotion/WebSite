document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("portfolioList");
  const emptyEl = document.getElementById(
    "portfolioEmptyMessage",
  );
  const searchInput = document.getElementById(
    "portfolioSearch",
  );
  const categorySelect = document.getElementById(
    "portfolioCategoryFilter",
  );

  if (!listEl) return;

  /** @type {Array<any>} */
  let allWorks = [];

  // -----------------------------
  // JSON 読み込み
  // -----------------------------
  async function loadWorks() {
    try {
      const res = await fetch(
        "assets/data/portfolioList.json",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allWorks = await res.json();
      render();
    } catch (err) {
      console.error("Failed to load portfolio list:", err);
      if (emptyEl) {
        emptyEl.textContent =
          "作品一覧の読み込みに失敗しました。";
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

    const filtered = allWorks.filter((work) => {
      // カテゴリフィルタ（空文字ならスキップ）
      if (
        categoryFilter &&
        work.category !== categoryFilter
      )
        return false;

      // キーワードフィルタ
      if (keyword) {
        const tags = Array.isArray(work.tags)
          ? work.tags
          : String(work.tags || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

        const haystack = [
          work.title || "",
          work.description || "",
          work.category || "",
          work.role || "",
          work.tech || "",
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

    filtered.forEach((work) => {
      const card = document.createElement("article");
      card.className =
        "card card--clickable portfolio-card";

      // サムネイル
      if (work.thumbnail) {
        const thumb = document.createElement("div");
        thumb.className = "card__thumb";
        const img = document.createElement("img");
        img.src = work.thumbnail;
        img.alt = work.title || "";
        thumb.appendChild(img);
        card.appendChild(thumb);
      }

      const body = document.createElement("div");
      body.className = "card__body";

      // メタ（カテゴリ / 年）
      const meta = document.createElement("p");
      meta.className = "card__meta";
      const dateText = work.date || "";
      const categoryText = work.category || "";
      meta.textContent = [dateText, categoryText]
        .filter(Boolean)
        .join(" / ");
      body.appendChild(meta);

      // タイトル行
      const titleRow = document.createElement("div");
      titleRow.className = "card__title-row";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = work.title || "";
      titleRow.appendChild(title);

      body.appendChild(titleRow);

      // ロール / 担当
      if (work.role) {
        const role = document.createElement("p");
        role.className = "card__meta card__meta--role";
        role.textContent = `Role: ${work.role}`;
        body.appendChild(role);
      }

      // 概要
      if (work.description) {
        const desc = document.createElement("p");
        desc.className = "card__description";
        desc.textContent = work.description;
        body.appendChild(desc);
      }

      // タグ
      if (work.tags && work.tags.length) {
        const tagRow = document.createElement("div");
        tagRow.className = "card__tags";
        work.tags.forEach((t) => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = t;
          tagRow.appendChild(tag);
        });
        body.appendChild(tagRow);
      }

      // 外部リンク（ストア・リポジトリなど）があるなら表示
      if (work.links && work.links.length) {
        const actions = document.createElement("div");
        actions.className = "card__actions";
        work.links.forEach((link) => {
          const a = document.createElement("a");
          a.href = link.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = link.label || "Link";
          actions.appendChild(a);
        });
        body.appendChild(actions);
      }

      card.appendChild(body);

      // カード全体クリックで作品詳細ページへ
      card.addEventListener("click", () => {
        if (work.contentPath) {
          window.location.href = work.contentPath;
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

  loadWorks();
});
