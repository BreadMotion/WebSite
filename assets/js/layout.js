document.addEventListener("DOMContentLoaded", () => {
  // 今のページのファイル名を取得（クエリは無視されるので blog.html?id=xxx でも blog.html になる）
  const currentPath = (() => {
    const name = location.pathname.split("/").pop();
    return name && name.length > 0 ? name : "index.html";
  })();

  // header と footer をまとめて読み込む
  Promise.all([
    fetch("partials/header.html").then((r) => r.text()),
    fetch("partials/footer.html").then((r) => r.text()),
  ])
    .then(([headerHtml, footerHtml]) => {
      // body の先頭に header、末尾に footer を挿入
      document.body.insertAdjacentHTML(
        "afterbegin",
        headerHtml,
      );
      document.body.insertAdjacentHTML(
        "beforeend",
        footerHtml,
      );

      // ★ ヘッダー挿入後にナビの active を設定
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
    })
    .catch((err) => {
      console.error(
        "共通ヘッダー/フッター読み込みエラー:",
        err,
      );
    });
});
