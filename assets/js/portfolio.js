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

  function readInitialParams() {
    const params = new URLSearchParams(location.search);
    const tag = params.get("tag") || "";
    const q = params.get("q") || "";
    const category = params.get("category") || "";

    const initial = tag || q;
    if (searchInput && initial) searchInput.value = initial;
    if (categorySelect && category)
      categorySelect.value = category;
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

  async function loadWorks() {
    try {
      const res = await fetch(
        "assets/data/portfolioList.json",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allWorks = await res.json();
      readInitialParams();
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

  function render() {
    const keyword = (searchInput?.value || "")
      .trim()
      .toLowerCase();
    const categoryFilter = (
      categorySelect?.value || ""
    ).trim();

    const filtered = allWorks.filter((work) => {
      if (
        categoryFilter &&
        work.category !== categoryFilter
      )
        return false;

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

    updateUrlParams(keyword, categoryFilter);

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

      const meta = document.createElement("p");
      meta.className = "card__meta";
      const dateText = work.date || "";
      const categoryText = work.category || "";
      meta.textContent = [dateText, categoryText]
        .filter(Boolean)
        .join(" / ");
      body.appendChild(meta);

      const titleRow = document.createElement("div");
      titleRow.className = "card__title-row";

      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = work.title || "";
      titleRow.appendChild(title);

      body.appendChild(titleRow);

      if (work.role) {
        const role = document.createElement("p");
        role.className = "card__meta card__meta--role";
        role.textContent = `Role: ${work.role}`;
        body.appendChild(role);
      }

      if (work.description) {
        const desc = document.createElement("p");
        desc.className = "card__description";
        desc.textContent = work.description;
        body.appendChild(desc);
      }

      const tagsArr = Array.isArray(work.tags)
        ? work.tags
        : String(work.tags || "")
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
      card.addEventListener("click", () => {
        if (work.contentPath) {
          const params = new URLSearchParams();
          const q = (searchInput?.value || "").trim();
          const category = (
            categorySelect?.value || ""
          ).trim();
          if (q) params.set("q", q);
          if (category) params.set("category", category);
          const target =
            work.contentPath +
            (params.toString()
              ? "?" + params.toString()
              : "");
          window.location.href = target;
        }
      });

      listEl.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", render);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", render);
  }

  loadWorks();
});
