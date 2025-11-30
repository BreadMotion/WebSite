document.addEventListener("DOMContentLoaded", () => {
  const shell =
    document.querySelector(".page-shell") || document.body;

  // 修正: 'WebSite' ディレクトリを基準とした相対パスを取得する
  const getCurrentRelativePath = () => {
    const pathname = location.pathname;
    // 'WebSite' ディレクトリより前の部分を削除
    const webSiteIndex = pathname.indexOf("/WebSite/");
    let relativePath = pathname;

    if (webSiteIndex !== -1) {
      // '/WebSite/' の後の部分を取得 (先頭の '/' も含む)
      relativePath = pathname.substring(
        webSiteIndex + "/WebSite".length,
      );
    } else {
      // 'WebSite' がない場合は、先頭の '/' を削除したパス
      relativePath = pathname.startsWith("/")
        ? pathname.substring(1)
        : pathname;
    }

    // パスが空またはディレクトリの場合は 'index.html' (仮定)
    if (relativePath === "" || relativePath.endsWith("/")) {
      relativePath += "index.html";
    }

    return relativePath;
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
        // 'WebSite' ディレクトリが基準
        depth = pathSegments.length - (webSiteIndex + 1); // WebSite より下の階層数
      } else {
        // 'WebSite' がない場合の階層深さを計算 (例: /page.html なら 0, /dir/page.html なら 1)
        // ファイル名を除いたパスセグメントの数とする
        const isFile =
          pathSegments.length > 0 &&
          pathSegments[pathSegments.length - 1].includes(
            ".",
          );
        depth = isFile
          ? pathSegments.length - 1
          : pathSegments.length;
      }

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

        // 言語プレフィックスを削除したクリーンなパスを取得
        // 'en/' ディレクトリ構成を仮定し、現在のパスから言語プレフィックスを取り除く
        let cleanPath = currentPath;
        if (cleanPath.startsWith("en/")) {
          cleanPath = cleanPath.slice(3); // 'en/' の 3 文字を削除
        }

        // 切り替え先の言語のプレフィックスを設定
        const targetLangPrefix = isEn ? "" : "en/"; // en -> (なし), その他 -> en/

        // ターゲットURLを生成: 相対ルート + ターゲット言語プレフィックス + クリーンなパス + クエリ
        const targetUrl = `${relativeRootPrefix}${targetLangPrefix}${cleanPath}${search}`;
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
