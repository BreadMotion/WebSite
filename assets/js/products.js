// assets/js/products.js
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("productList");
  const emptyEl = document.getElementById("productEmptyMessage");
  const searchInput = document.getElementById("productSearch");
  const typeSelect = document.getElementById("productTypeFilter");

  if (!listEl) return;

  let allProducts = [];

  async function loadProducts() {
    try {
      const res = await fetch("assets/data/products.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProducts = await res.json();
      render();
    } catch (err) {
      console.error("Failed to load products:", err);
      if (emptyEl) {
        emptyEl.textContent = "プロダクト一覧の読み込みに失敗しました。";
        emptyEl.style.display = "block";
      }
    }
  }

  function render() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const typeFilter = typeSelect?.value || "";

    const filtered = allProducts.filter((p) => {
      // 種類フィルタ
      if (typeFilter && p.type !== typeFilter) return false;

      // キーワードフィルタ
      if (keyword) {
        const haystack = [
          p.title,
          p.description,
          p.type || "",
          ...(p.platform || []),
          ...(p.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });

    listEl.innerHTML = "";

    if (filtered.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    } else if (emptyEl) {
      emptyEl.style.display = "none";
    }

    filtered.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card card--clickable product-card";

      // サムネ
      if (p.thumbnail) {
        const thumb = document.createElement("div");
        thumb.className = "card__thumb";
        const img = document.createElement("img");
        img.src = p.thumbnail;
        img.alt = p.title;
        thumb.appendChild(img);
        card.appendChild(thumb);
      }

      const body = document.createElement("div");
      body.className = "card__body";

      const titleRow = document.createElement("div");
      titleRow.className = "card__title-row";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = p.title;

      if (p.type) {
        const pill = document.createElement("span");
        pill.className = "pill pill--accent";
        pill.textContent = p.type;
        titleRow.appendChild(pill);
      }

      titleRow.appendChild(title);
      body.appendChild(titleRow);

      if (p.platform && p.platform.length > 0) {
        const plat = document.createElement("p");
        plat.className = "card__meta";
        plat.textContent = `Platform: ${p.platform.join(", ")}`;
        body.appendChild(plat);
      }

      if (p.description) {
        const desc = document.createElement("p");
        desc.className = "card__description";
        desc.textContent = p.description;
        body.appendChild(desc);
      }

      // タグ
      if (p.tags && p.tags.length > 0) {
        const tagRow = document.createElement("div");
        tagRow.className = "card__tags";
        p.tags.forEach((t) => {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = t;
          tagRow.appendChild(tag);
        });
        body.appendChild(tagRow);
      }

      // リンク群
      const linkRow = document.createElement("div");
      linkRow.className = "card__actions";

      if (p.storeLinks && p.storeLinks.length > 0) {
        p.storeLinks.forEach((link) => {
          const a = document.createElement("a");
          a.href = link.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "btn btn--sm btn--outline";
          a.textContent = link.label || "Store";
          linkRow.appendChild(a);
        });
      }

      if (p.downloadLinks && p.downloadLinks.length > 0) {
        p.downloadLinks.forEach((link) => {
          const a = document.createElement("a");
          a.href = link.url;
          a.className = "btn btn--sm btn--primary";
          a.textContent = link.label || "Download";
          linkRow.appendChild(a);
        });
      }

      if (linkRow.children.length > 0) {
        body.appendChild(linkRow);
      }

      card.appendChild(body);
      listEl.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      render();
    });
  }
  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      render();
    });
  }

  loadProducts();
});
