document.addEventListener("DOMContentLoaded", async () => {
  const blogListEl = document.getElementById(
    "homeLatestBlog",
  );
  const portListEl = document.getElementById(
    "homeLatestPortfolio",
  );

  if (!blogListEl && !portListEl) return;

  // Blog: 日付降順で3件
  if (blogListEl) {
    try {
      const res = await fetch("assets/data/blogList.json");
      if (!res.ok) throw new Error(res.statusText);
      const posts = await res.json();

      posts.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db = b.date ? new Date(b.date) : new Date(0);
        return db - da;
      });

      const latest = posts.slice(0, 3);

      if (latest.length === 0) {
        blogListEl.innerHTML =
          "<li>まだ記事がありません。</li>";
      } else {
        latest.forEach((post) => {
          const li = document.createElement("li");
          li.className = "home-latest-item";

          const a = document.createElement("a");
          a.className = "home-latest-link";
          a.href = `blog.html?id=${encodeURIComponent(post.id)}`;

          const titleSpan = document.createElement("span");
          titleSpan.className = "home-latest-link-title";
          titleSpan.textContent = post.title;

          const metaSpan = document.createElement("span");
          metaSpan.className = "home-latest-link-meta";
          const categoryText = post.category
            ? ` / ${post.category}`
            : "";
          metaSpan.textContent = `${post.date || ""}${categoryText}`;

          a.appendChild(titleSpan);
          a.appendChild(metaSpan);
          li.appendChild(a);
          blogListEl.appendChild(li);
        });
      }
    } catch (err) {
      console.error("home latest blog error:", err);
      blogListEl.innerHTML =
        "<li>ブログ一覧を読み込めませんでした。</li>";
    }
  }

  // Portfolio: pagelist.json の先頭3件（今は「ピックアップ」扱いでOK）
  if (portListEl) {
    try {
      const res = await fetch(
        "assets/data/portfolioList.json",
      );
      if (!res.ok) throw new Error(res.statusText);
      const works = await res.json();

      const latest = works.slice(0, 3);

      if (latest.length === 0) {
        portListEl.innerHTML =
          "<li>まだ作品がありません。</li>";
      } else {
        latest.forEach((work) => {
          const li = document.createElement("li");
          li.className = "home-latest-item";

          const a = document.createElement("a");
          a.className = "home-latest-link";
          a.href = `portfolio.html?id=${encodeURIComponent(work.id)}`;

          const titleSpan = document.createElement("span");
          titleSpan.className = "home-latest-link-title";
          titleSpan.textContent = work.title;

          const metaSpan = document.createElement("span");
          metaSpan.className = "home-latest-link-meta";
          const parts = [];
          if (work.tech) parts.push(work.tech);
          if (work.platform) parts.push(work.platform);
          metaSpan.textContent = parts.join(" / ");

          a.appendChild(titleSpan);
          a.appendChild(metaSpan);
          li.appendChild(a);
          portListEl.appendChild(li);
        });
      }
    } catch (err) {
      console.error("home latest portfolio error:", err);
      portListEl.innerHTML =
        "<li>作品一覧を読み込めませんでした。</li>";
    }
  }
});
