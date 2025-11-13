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
  const initialTag = getQueryParam("tag");

  const listSection = document.getElementById(
    "blogListSection",
  );
  const listElement = document.getElementById("blogList");
  const detailSection = document.getElementById(
    "blogDetailSection",
  );
  const detailTitle = document.getElementById(
    "blogDetailTitle",
  );
  const detailMeta = document.getElementById(
    "blogDetailMeta",
  );
  const detailBody = document.getElementById(
    "blogDetailBody",
  );
  const detailTags = document.getElementById(
    "blogDetailTags",
  );
  const categorySelect = document.getElementById(
    "blogCategoryFilter",
  );
  const searchInput = document.getElementById(
    "blogSearchInput",
  );
  const tagListElement =
    document.getElementById("blogTagList");

  if (!listSection || !listElement || !detailSection) {
    console.error("blog.html の要素取得に失敗しました。");
    return;
  }

  let posts = [];
  try {
    const res = await fetch("content/blog/pagelist.json");
    if (!res.ok) throw new Error(res.statusText);
    posts = await res.json();
  } catch (err) {
    console.error(
      "pagelist.json の読み込みに失敗しました:",
      err,
    );
    listElement.innerHTML =
      "<li>記事一覧を読み込めませんでした。</li>";
    return;
  }

  posts.sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return db - da;
  });

  // 選択中タグ（null = すべて）
  let selectedTag = null;

  if (initialTag) {
    selectedTag = initialTag;
  }

  // 一覧描画
  function renderList(
    filterCategory = "all",
    searchText = "",
    tag = null,
  ) {
    const q = (searchText || "").toLowerCase();
    listElement.innerHTML = "";

    const filtered = posts.filter((post) => {
      // カテゴリ
      if (filterCategory !== "all") {
        if (
          !post.category ||
          post.category !== filterCategory
        )
          return false;
      }

      // タグ
      if (tag) {
        const tags = Array.isArray(post.tags)
          ? post.tags
          : [];
        if (!tags.includes(tag)) return false;
      }

      // 検索
      if (q) {
        const haystack = [
          post.title || "",
          post.description || "",
          post.category || "",
          ...(Array.isArray(post.tags) ? post.tags : []),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      listElement.innerHTML =
        "<li>該当する記事がありません。</li>";
      return;
    }

    filtered.forEach((post) => {
      const li = document.createElement("li");
      li.className = "blog-item";

      const thumb = document.createElement("div");
      thumb.className = "blog-thumb";
      if (post.thumbnail) {
        const img = document.createElement("img");
        img.src = post.thumbnail;
        img.alt = post.title;
        thumb.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "blog-body";

      const a = document.createElement("a");
      a.href = `blog.html?id=${encodeURIComponent(post.id)}`;

      const h3 = document.createElement("h3");
      h3.textContent = post.title;

      const meta = document.createElement("p");
      meta.className = "blog-meta";
      const categoryText = post.category
        ? ` / カテゴリ: ${post.category}`
        : "";
      meta.textContent = `${post.date || ""}${categoryText}`;

      const desc = document.createElement("p");
      desc.className = "blog-desc";
      desc.textContent = post.description || "";

      a.appendChild(h3);
      a.appendChild(meta);
      a.appendChild(desc);

      body.appendChild(a);

      li.appendChild(thumb);
      li.appendChild(body);

      li.addEventListener("click", (e) => {
        if (e.target.closest("a")) {
          // テキスト上のクリックは既存のリンク動作を使う
          return;
        }
        window.location.href = a.href;
      });

      listElement.appendChild(li);
    });
  }

  // タグ一覧を生成
  function setupTagChips() {
    if (!tagListElement) return;

    const allTags = new Set();
    posts.forEach((p) => {
      (Array.isArray(p.tags) ? p.tags : []).forEach((t) => {
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
        chip.className = "blog-tag-chip";

        chip.addEventListener("click", () => {
          // 同じタグをもう一度押したら解除
          if (selectedTag === tag) {
            selectedTag = null;
          } else {
            selectedTag = tag;
          }
          updateTagChipActive();
          renderList(
            categorySelect ? categorySelect.value : "all",
            searchInput ? searchInput.value : "",
            selectedTag,
          );
        });

        tagListElement.appendChild(chip);
      });

    updateTagChipActive();
  }

  function updateTagChipActive() {
    if (!tagListElement) return;
    const chips = tagListElement.querySelectorAll(
      ".blog-tag-chip",
    );
    chips.forEach((chip) => {
      if (chip.textContent === selectedTag) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  // カテゴリ
  if (categorySelect) {
    const categories = Array.from(
      new Set(
        posts
          .map((p) => p.category)
          .filter((c) => c && c.trim() !== ""),
      ),
    );

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });

    categorySelect.addEventListener("change", () => {
      renderList(
        categorySelect.value,
        searchInput ? searchInput.value : "",
        selectedTag,
      );
    });
  }

  // 検索
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderList(
        categorySelect ? categorySelect.value : "all",
        searchInput.value,
        selectedTag,
      );
    });
  }

  // タグ生成
  setupTagChips();

  const id = getQueryParam("id");

  if (!id) {
    // 一覧
    listSection.style.display = "";
    detailSection.style.display = "none";
    renderList(
      categorySelect ? categorySelect.value : "all",
      searchInput ? searchInput.value : "",
      selectedTag,
    );
  } else {
    // 詳細
    listSection.style.display = "none";
    detailSection.style.display = "";

    const post = posts.find((p) => p.id === id);

    if (!post) {
      detailTitle.textContent =
        "記事が見つかりませんでした";
      detailMeta.textContent = "";
      detailBody.textContent =
        "指定された記事 ID は存在しません。";
      return;
    }

    detailTitle.textContent = post.title;
    const categoryText = post.category
      ? ` / カテゴリ: ${post.category}`
      : "";
    detailMeta.textContent = `${post.date || ""}${categoryText}`;

    if (detailTags) {
      detailTags.innerHTML = "";
      const tags = Array.isArray(post.tags)
        ? post.tags
        : [];
      if (tags.length > 0) {
        const label = document.createTextNode("タグ:");
        detailTags.appendChild(label);

        tags.forEach((tag) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = tag;
          btn.addEventListener("click", () => {
            window.location.href = `blog.html?tag=${encodeURIComponent(tag)}`;
          });
          detailTags.appendChild(btn);
        });
      }
    }

    if (!post.contentPath) {
      detailBody.textContent =
        "この記事の本文ファイルが設定されていません。";
      return;
    }

    try {
      const res = await fetch(post.contentPath);
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
      console.error(
        "記事本文の読み込みに失敗しました:",
        err,
      );
      detailBody.textContent =
        "記事本文を読み込めませんでした。";
    }
  }
});
