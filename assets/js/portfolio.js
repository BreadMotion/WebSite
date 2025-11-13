// assets/js/portfolio.js

function getQueryParam(name) {
  const params = new URLSearchParams(
    window.location.search,
  );
  return params.get(name);
}

function stripFrontMatter(md) {
  if (!md) return md;

  if (md.startsWith("---")) {
    const endIndex = md.indexOf("\n---", 3);
    if (endIndex !== -1) {
      return md.slice(endIndex + 4).trimStart();
    }
  }

  const lines = md.split("\n");
  if (lines[0].startsWith("title:")) {
    let i = 0;
    while (i < lines.length && lines[i].trim() !== "") {
      i++;
    }
    return lines
      .slice(i + 1)
      .join("\n")
      .trimStart();
  }

  return md;
}

document.addEventListener("DOMContentLoaded", async () => {
  const listSection = document.getElementById(
    "portfolioListSection",
  );
  const listElement =
    document.getElementById("portfolioList");
  const detailSection = document.getElementById(
    "portfolioDetailSection",
  );
  const detailTitle = document.getElementById(
    "portfolioDetailTitle",
  );
  const detailMeta = document.getElementById(
    "portfolioDetailMeta",
  );
  const detailBody = document.getElementById(
    "portfolioDetailBody",
  );
  const detailLinks = document.getElementById(
    "portfolioDetailLinks",
  );
  const techSelect = document.getElementById(
    "portfolioTechFilter",
  );
  const searchInput = document.getElementById(
    "portfolioSearchInput",
  );
  const tagListElement = document.getElementById(
    "portfolioTagList",
  );

  if (!listSection || !listElement || !detailSection) {
    console.error(
      "portfolio.html の要素取得に失敗しました。",
    );
    return;
  }

  let works = [];
  try {
    const res = await fetch(
      "content/portfolio/pagelist.json",
    );
    if (!res.ok) throw new Error(res.statusText);
    works = await res.json();
  } catch (err) {
    console.error(
      "portfolio pagelist.json の読み込みに失敗:",
      err,
    );
    listElement.innerHTML =
      "<li>作品一覧を読み込めませんでした。</li>";
    return;
  }

  works.sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", "ja"),
  );

  let selectedTag = null;

  function renderList(
    filterTech = "all",
    searchText = "",
    tag = null,
  ) {
    const q = (searchText || "").toLowerCase();
    listElement.innerHTML = "";

    const filtered = works.filter((work) => {
      // Tech
      if (filterTech !== "all") {
        if (!work.tech || work.tech !== filterTech)
          return false;
      }

      // Tag
      if (tag) {
        const tags = Array.isArray(work.tags)
          ? work.tags
          : [];
        if (!tags.includes(tag)) return false;
      }

      // Search
      if (q) {
        const haystack = [
          work.title || "",
          work.description || "",
          work.role || "",
          work.tech || "",
          work.platform || "",
          ...(Array.isArray(work.tags) ? work.tags : []),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      listElement.innerHTML =
        "<li>該当する作品がありません。</li>";
      return;
    }

    filtered.forEach((work) => {
      const li = document.createElement("li");
      li.className = "portfolio-item";

      const thumb = document.createElement("div");
      thumb.className = "portfolio-thumb";
      if (work.thumbnail) {
        const img = document.createElement("img");
        img.src = post.thumbnail;
        img.alt = post.title;
        thumb.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "portfolio-body";

      const h3 = document.createElement("h3");
      h3.textContent = work.title;

      const meta = document.createElement("p");
      meta.className = "portfolio-meta";
      const parts = [];
      if (work.role) parts.push(`Role: ${work.role}`);
      if (work.tech) parts.push(`Tech: ${work.tech}`);
      if (work.platform)
        parts.push(`Platform: ${work.platform}`);
      meta.textContent = parts.join(" / ");

      const desc = document.createElement("p");
      desc.className = "portfolio-desc";
      desc.textContent = work.description || "";

      const linksP = document.createElement("p");
      linksP.className = "portfolio-links";
      const detailLink = document.createElement("a");
      detailLink.href = `portfolio.html?id=${encodeURIComponent(work.id)}`;
      detailLink.textContent = "詳細";
      linksP.appendChild(detailLink);

      body.appendChild(h3);
      body.appendChild(meta);
      body.appendChild(desc);
      body.appendChild(linksP);

      li.appendChild(thumb);
      li.appendChild(body);

      li.addEventListener("click", (e) => {
        if (e.target.closest("a")) {
          return;
        }
        window.location.href = detailLink.href;
      });

      listElement.appendChild(li);
    });
  }

  function setupTagChips() {
    if (!tagListElement) return;

    const allTags = new Set();
    works.forEach((w) => {
      (Array.isArray(w.tags) ? w.tags : []).forEach((t) => {
        if (t && t.trim() !== "") allTags.add(t);
      });
    });

    tagListElement.innerHTML = "";

    Array.from(allTags)
      .sort()
      .forEach((tag) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.textContent = tag;
        chip.className = "portfolio-tag-chip";

        chip.addEventListener("click", () => {
          if (selectedTag === tag) {
            selectedTag = null;
          } else {
            selectedTag = tag;
          }
          updateTagChipActive();
          renderList(
            techSelect ? techSelect.value : "all",
            searchInput ? searchInput.value : "",
            selectedTag,
          );
        });

        tagListElement.appendChild(chip);
      });
  }

  function updateTagChipActive() {
    if (!tagListElement) return;
    const chips = tagListElement.querySelectorAll(
      ".portfolio-tag-chip",
    );
    chips.forEach((chip) => {
      if (chip.textContent === selectedTag) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  // Tech
  if (techSelect) {
    const techs = Array.from(
      new Set(
        works
          .map((w) => w.tech)
          .filter((t) => t && t.trim() !== ""),
      ),
    );

    techs.forEach((tech) => {
      const option = document.createElement("option");
      option.value = tech;
      option.textContent = tech;
      techSelect.appendChild(option);
    });

    techSelect.addEventListener("change", () => {
      renderList(
        techSelect.value,
        searchInput ? searchInput.value : "",
        selectedTag,
      );
    });
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderList(
        techSelect ? techSelect.value : "all",
        searchInput.value,
        selectedTag,
      );
    });
  }

  setupTagChips();

  const id = getQueryParam("id");

  if (!id) {
    listSection.style.display = "";
    detailSection.style.display = "none";
    renderList(
      techSelect ? techSelect.value : "all",
      searchInput ? searchInput.value : "",
      selectedTag,
    );
  } else {
    listSection.style.display = "none";
    detailSection.style.display = "";

    const work = works.find((w) => w.id === id);

    if (!work) {
      detailTitle.textContent =
        "作品が見つかりませんでした";
      detailMeta.textContent = "";
      detailBody.textContent =
        "指定された作品 ID は存在しません。";
      return;
    }

    detailTitle.textContent = work.title;

    const metaParts = [];
    if (work.role) metaParts.push(`Role: ${work.role}`);
    if (work.tech) metaParts.push(`Tech: ${work.tech}`);
    if (work.platform)
      metaParts.push(`Platform: ${work.platform}`);
    detailMeta.textContent = metaParts.join(" / ");

    if (!work.contentPath) {
      detailBody.textContent =
        "この作品の本文ファイルが設定されていません。";
    } else {
      try {
        const res = await fetch(work.contentPath);
        if (!res.ok) throw new Error(res.statusText);
        const md = await res.text();

        if (typeof marked === "undefined") {
          detailBody.textContent =
            "Markdown パーサが読み込めていません。";
          return;
        }
        const bodyOnly = stripFrontMatter(md);
        detailBody.innerHTML = marked.parse(bodyOnly);
      } catch (err) {
        console.error("作品詳細の読み込みに失敗:", err);
        detailBody.textContent =
          "作品詳細を読み込めませんでした。";
      }
    }

    detailLinks.innerHTML = "";
    if (work.links) {
      const linkParts = [];
      if (work.links.detail) {
        const a = document.createElement("a");
        a.href = work.links.detail;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "詳細ページ";
        linkParts.push(a);
      }
      if (work.links.github) {
        const a = document.createElement("a");
        a.href = work.links.github;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "GitHub";
        linkParts.push(a);
      }

      linkParts.forEach((a, index) => {
        if (index > 0) {
          detailLinks.appendChild(
            document.createTextNode(" / "),
          );
        }
        detailLinks.appendChild(a);
      });
    }
  }
});
