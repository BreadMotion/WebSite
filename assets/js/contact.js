// assets/js/contact.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const result = document.getElementById("contactResult");

  if (!form || !result) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // 実際の送信は行わない（ダミー）

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      result.textContent = "未入力の項目があります。";
      result.style.color = "red";
      return;
    }

    // ここで本来はAPIやメール送信処理を呼ぶ
    // 今はダミーで完結
    result.textContent =
      "送信が完了しました（ダミー）。内容を確認のうえ、必要であればご連絡いたします。";
    result.style.color = "green";

    // 入力内容を一旦クリア
    form.reset();
  });
});
