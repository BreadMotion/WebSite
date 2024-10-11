function getform() {
  mailAddress = document.contentForm.address.value;
  var URL = "https://breadmotion.github.io/WebSite/Contact/contact.html";
  var param = "address=" + mailAddress;

  alert("send " + URL + param);
  location.href = URL = param;
}
