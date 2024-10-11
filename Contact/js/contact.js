function paraValue(paraName) {
  var str = location.search.split("?");
  if (str.length < 2) {
    // =1:?の後の文字列がない=パラメタがない
    return ""; // パラメタがないのでnullを戻す。
  }

  //  str[1]= "e=abc&j=日本語"
  var params = str[1].split("&");
  for (var i = 0; i < params.length; i++) {
    var paraPair = params[i].split("=");
    // paraPair[0]はパラメタの名称、 paraPair[1]はパラメタの値
    if (
      paraPair[0] == paraName && // パラメタの名称が指定した名称paraNameと一致
      paraPair.length == 2
    ) {
      // paraPairに名称と値がある
      return decodeURIComponent(paraPair[1]); // UTF-8にエンコードする（日本語の場合必要）
    }
  }
  return ""; // for文が最後まで到達しても一致しなかったのでnullを戻す。
}

function init() {
  var param = paraValue("address");
  if (param == "") {
  } else {
    var result = "<input " + "type=" + param + " />";
    document.getElementById("address").innerHTML = result;
  }
}
