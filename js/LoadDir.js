const blogDirPath = "./Blog/Blogs/";
const portfolioDirPath = "./Portfolio/Portfolios/";
const blogFilesPathListYAML = blogDirPath + "data/pagelist.yaml";
const portfolioFilesPathListYAML = portfolioDirPath + "data/pagelist.yaml";

let request = new XMLHttpRequest();
request.open('GET', blogFilesPathListYAML);
request.open('GET', portfolioFilesPathListYAML);
request.responseType = 'yaml';
request.send();

request.onload = function(){
  let list = request.response;
  list = JSON.parse(JSON.stringify(list));
  console.log();
};