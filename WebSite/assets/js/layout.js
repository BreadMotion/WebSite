document.addEventListener("DOMContentLoaded", () => {
  const shell =
    document.querySelector(".page-shell") || document.body;

  const currentPath = (() => {
    const name = location.pathname.split("/").pop();
    return name && name.length > 0 ? name : "index.html";
  })();

  Promise.all([
    fetch(
      "https://breadmotion.github.io/WebSite/partials/header.html",
    ).then((r) => r.text()),
    fetch(
      "https://breadmotion.github.io/WebSite/partials/footer.html",
    ).then((r) => r.text()),
  ])
    .then(([headerHtml, footerHtml]) => {
      shell.insertAdjacentHTML("afterbegin", headerHtml);
      shell.insertAdjacentHTML("beforeend", footerHtml);

      const navLinks =
        document.querySelectorAll(".site-nav a");
      navLinks.forEach((link) => {
        const target =
          link.getAttribute("data-nav") ||
          link.getAttribute("href") ||
          "";

        const cleanTarget = target.split(/[?#]/)[0];

        if (cleanTarget === currentPath) {
          link.classList.add("active");
        }
      });

      const navToggle =
        document.querySelector(".nav-toggle");
      const siteNav = document.querySelector(".site-nav");

      if (navToggle && siteNav) {
        navToggle.addEventListener("click", () => {
          navToggle.classList.toggle("is-active");
          siteNav.classList.toggle("is-open");
          document.documentElement.classList.toggle(
            "no-scroll",
            siteNav.classList.contains("is-open"),
          );
          document.body.classList.toggle(
            "no-scroll",
            siteNav.classList.contains("is-open"),
          );
        });

        siteNav.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            navToggle.classList.remove("is-active");
            siteNav.classList.remove("is-open");
            document.documentElement.classList.remove(
              "no-scroll",
            );
            document.body.classList.remove("no-scroll");
          });
        });
      }
    })
    .catch((err) => {
      console.error(
        "共通ヘッダー/フッター読み込みエラー:",
        err,
      );
    });
});
