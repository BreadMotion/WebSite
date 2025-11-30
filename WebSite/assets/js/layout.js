document.addEventListener("DOMContentLoaded", () => {
  const shell =
    document.querySelector(".page-shell") || document.body;

  // 'WebSite' ディレクトリを基準とした相対パスを取得する
  const getCurrentRelativePath = () => {
    const pathname = location.pathname;
    let relativePath = pathname;

    // パスから '/WebSite/' より前の部分を削除
    const webSiteIndex = pathname.indexOf("/WebSite/");
    if (webSiteIndex !== -1) {
      // '/WebSite/' の後の部分を取得 (例: en/blog/blog_00018.html)
      relativePath = pathname.substring(
        webSiteIndex + "/WebSite/".length,
      );
    } else if (pathname.startsWith("/")) {
      // 'WebSite' がない場合は、先頭の '/' を削除
      relativePath = pathname.substring(1);
    }

    // パスが空またはディレクトリの場合は 'index.html' (ルートページと仮定)
    if (relativePath === "" || relativePath.endsWith("/")) {
      relativePath += "index.html";
    }

    return relativePath; // 例: index.html, blog/blog_00001.html, en/blog/blog_00001.html
  };

  const currentPath = getCurrentRelativePath();

  // layout.js の読み込みパスから相対パスを特定する
  const getPartialsPath = () => {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src");
      if (src && src.endsWith("layout.js")) {
        // "assets/js/layout.js" の前の部分を取得
        const prefix = src.replace(
          "assets/js/layout.js",
          "",
        );
        return prefix + "partials/";
      }
    }
    return "partials/";
  };

  const pathToPartials = getPartialsPath();
  const lang = document.documentElement.lang;
  const headerFile =
    lang === "en" ? "header_en.html" : "header.html";

  Promise.all([
    fetch(`${pathToPartials}${headerFile}`).then((r) =>
      r.text(),
    ),
    fetch(`${pathToPartials}footer.html`).then((r) =>
      r.text(),
    ),
  ])
    .then(([headerHtml, footerHtml]) => {
      shell.insertAdjacentHTML("afterbegin", headerHtml);
      // 修正: shell の直後にフッターを挿入（shell自体が body の場合、body の末尾になる）
      shell.insertAdjacentHTML("beforeend", footerHtml);

      // 現在のページの階層レベルを計算
      const pathSegments = location.pathname
        .split("/")
        .filter((segment) => segment.length > 0);
      let depth = 0;
      const webSiteIndex = pathSegments.indexOf("WebSite");

      if (webSiteIndex !== -1) {
        // 'WebSite' ディレクトリを基準として、それより下の階層数を計算
        // depthはWebSite以下のセグメント数から1(ファイル名)を引いたもの
        depth = pathSegments.length - (webSiteIndex + 1);
        // 例: /WebSite/a/b/c.html -> depth = 3
      }
      // ... (WebSiteがない場合のロジックは前回と同様でOK) ...

      // ベースURLのプレフィックスを生成 (例: "../../" for depth 2)
      const relativeRootPrefix = "../".repeat(depth);

      // ナビゲーションリンクのパスを修正し、アクティブクラスを適用
      const navLinks =
        document.querySelectorAll(".site-nav a");
      navLinks.forEach((link) => {
        let originalHref = link.getAttribute("href");
        if (
          originalHref &&
          !originalHref.startsWith("http") &&
          !originalHref.startsWith("#")
        ) {
          // 'WebSite/' からの相対パスを想定しているため、現在のページの深さに応じて調整
          const adjustedHref = `${relativeRootPrefix}${originalHref}`;
          link.setAttribute("href", adjustedHref);
        }

        const target =
          link.getAttribute("data-nav") ||
          link.getAttribute("href") ||
          "";

        // 修正: href がファイル名でない場合を考慮
        const targetFilename =
          target.split("/").pop().split(/[?#]/)[0] ||
          "index.html";
        const currentFilename =
          currentPath.split("/").pop().split(/[?#]/)[0] ||
          "index.html";

        if (targetFilename === currentFilename) {
          link.classList.add("active");
        }
      });

      // 言語切り替え
      const langSwitch =
        document.querySelector(".lang-switch");
      if (langSwitch) {
        const isEn = document.documentElement.lang === "en";
        const search = window.location.search || "";

        // 現在のURLパス (例: /WebSite/blog/en/blog_00018.html)
        const pathname = location.pathname;

        // ファイル名のみを取得 (例: blog_00018.html)
        const currentFilename = getFilename(pathname);

        let targetPath = currentFilename; // ターゲットの基本はファイル名

        // 1. ターゲットとなるディレクトリ構造を決定
        if (pathname.includes("/blog/")) {
          // ブログページの場合
          if (isEn) {
            // 英語 -> 日本語へ切り替え: /WebSite/blog/ + ファイル名
            targetPath = `blog/${targetPath}`;
          } else {
            // 日本語 -> 英語へ切り替え: /WebSite/blog/en/ + ファイル名
            targetPath = `blog/en/${targetPath}`;
          }
        } else {
          // ブログ以外のページの場合 (index.htmlなど)
          if (isEn) {
            // 英語 -> 日本語へ切り替え: /WebSite/ + ファイル名
            // targetPathはそのまま
          } else {
            // 日本語 -> 英語へ切り替え: /WebSite/en/ + ファイル名
            targetPath = `en/${targetPath}`;
          }
        }

        // 2. ターゲットURLを生成:
        // relativeRootPrefix: 現在のページから WebSite/ の直下にアクセスするための相対パス
        // targetPath: WebSite/ からのターゲット相対パス (例: blog/en/blog_00018.html)
        const targetUrl = `${relativeRootPrefix}${targetPath}${search}`;

        // index.htmlの特殊処理: targetPathがindex.htmlでrelativeRootPrefixがない場合、ルートを指す
        if (
          targetPath === "index.html" &&
          relativeRootPrefix === ""
        ) {
          targetUrl = `./${targetPath}${search}`;
        } else if (
          targetPath === "index.html" &&
          relativeRootPrefix.length > 0
        ) {
          // blog/ から /index.html に戻る場合など
          targetUrl = `${relativeRootPrefix}${targetPath}${search}`;
        }

        langSwitch.setAttribute("href", targetUrl);
      }
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
