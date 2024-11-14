import fs from "fs";
const blogDirPath = "./Blog/Blogs/";
const portfolioDirPath = "./Portfolio/Portfolios/";
const fileBlogNames = fs.readdirSync(blogDirPath);
const filePortfolioNames = fs.readdirSync(portfolioDirPath);

for (var i = 0; i < 3; i++) {
  if (!fileBlogNames[i].endsWith(".md")) {
    // .md以外のファイルをはじいて再選定
    i--;
    continue;
  }

  const fileName = fileBlogNames[i];
  const file = fs.readFileSync([dirPath, fileBlogNames[i]].join("/"), "utf8");
}

for (var i = 0; i < 3; i++) {
  if (!filePortfolioNames[i].endsWith(".md")) {
    // .md以外のファイルをはじいて再選定
    i--;
    continue;
  }

  const fileName = filePortfolioNames[i];
  const file = fs.readFileSync(
    [dirPath, filePortfolioNames[i]].join("/"),
    "utf8"
  );
}
