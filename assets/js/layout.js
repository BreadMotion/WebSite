document.addEventListener("DOMContentLoaded", () => {
  // header/footer を挿入する先：page-shell があればそこ、なければ body
  const shell =
    document.querySelector(".page-shell") || document.body;

  // 今のページのファイル名を取得（クエリは無視されるので blog.html?id=xxx でも blog.html になる）
  const currentPath = (() => {
    const name = location.pathname.split("/").pop();
    return name && name.length > 0 ? name : "index.html";
  })();

  // header と footer をまとめて読み込む
  Promise.all([
    fetch(
      "https://breadmotion.github.io/WebSite/partials/header.html",
    ).then((r) => r.text()),
    fetch(
      "https://breadmotion.github.io/WebSite/partials/footer.html",
    ).then((r) => r.text()),
  ])
    .then(([headerHtml, footerHtml]) => {
      // body の先頭に header、末尾に footer を挿入
      shell.insertAdjacentHTML("afterbegin", headerHtml);
      shell.insertAdjacentHTML("beforeend", footerHtml);

      // ヘッダー挿入後にナビの active を設定
      const navLinks =
        document.querySelectorAll(".site-nav a");
      navLinks.forEach((link) => {
        // data-nav があればそれを優先、なければ href を使う
        const target =
          link.getAttribute("data-nav") ||
          link.getAttribute("href") ||
          "";

        // 相対パスだけを取り出す（念のため # や ? 以前で切る）
        const cleanTarget = target.split(/[?#]/)[0];

        if (cleanTarget === currentPath) {
          link.classList.add("active");
        }
      });

      // ヘッダー挿入後にハンバーガーメニューのロジックを設定
      const navToggle =
        document.querySelector(".nav-toggle");
      const siteNav = document.querySelector(".site-nav");

      if (navToggle && siteNav) {
        navToggle.addEventListener("click", () => {
          navToggle.classList.toggle("is-active");
          siteNav.classList.toggle("is-open");
          // メニューが開いているときにbodyのスクロールを無効にする
          document.body.classList.toggle(
            "no-scroll",
            siteNav.classList.contains("is-open"),
          );
        });

        // メニュー内のリンクをクリックしたらメニューを閉じる
        siteNav.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            navToggle.classList.remove("is-active");
            siteNav.classList.remove("is-open");
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
