const blogDirPath = "./Blog/Blogs/";
const blogFilesPathListYAML = blogDirPath + "data/pagelist.yaml";

let request = new XMLHttpRequest();
request.open('GET', blogFilesPathListYAML);
request.responseType = 'yaml';
request.send();

request.onload = function(){
  let list = request.response;
  list = JSON.parse(JSON.stringify(list));
  console.log();
};