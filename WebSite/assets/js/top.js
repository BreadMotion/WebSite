function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const da = ("0" + d.getDate()).slice(-2);
  return `${y}/${m}/${da}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const blogListEl = document.getElementById(
    "homeLatestBlog",
  );
  const portListEl = document.getElementById(
    "homeLatestPortfolio",
  );
  const slideshowEl =
    document.getElementById("heroSlideshow");

  if (!blogListEl && !portListEl && !slideshowEl) return;

  if (slideshowEl) {
    try {
      const res = await fetch(
        "assets/data/portfolioList.json",
      );
      if (res.ok) {
        let items = await res.json();
        items = items.filter((item) => item.thumbnail);

        if (items.length > 0) {
          // Fisher-Yates shuffle
          for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
          }

          let currentIndex = 0;
          const showNextSlide = () => {
            const item = items[currentIndex];
            const slide = document.createElement("div");
            slide.className = "hero-slide";
            slide.style.backgroundImage = `url('${item.thumbnail}')`;

            slideshowEl.appendChild(slide);

            // Reflow
            void slide.offsetWidth;

            slide.classList.add("active");

            // 古いスライドを削除
            setTimeout(() => {
              while (slideshowEl.children.length > 1) {
                slideshowEl.removeChild(
                  slideshowEl.firstElementChild,
                );
              }
            }, 2500);

            currentIndex =
              (currentIndex + 1) % items.length;
          };

          showNextSlide();
          setInterval(showNextSlide, 6000);
        }
      }
    } catch (err) {
      console.error("Hero slideshow error:", err);
    }
  }

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
          const dateText = formatDate(post.date);
          metaSpan.textContent = `${dateText}${categoryText}`;

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
