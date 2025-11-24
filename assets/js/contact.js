function paraValue(paraName) {
  var str = location.search.split("?");
  if (str.length < 2) {
    return "";
  }

  var params = str[1].split("&");
  for (var i = 0; i < params.length; i++) {
    var paraPair = params[i].split("=");
    if (paraPair[0] === paraName && paraPair.length === 2) {
      return decodeURIComponent(paraPair[1]);
    }
  }
  return "";
}

function init() {
  var param = paraValue("address");
  if (param) {
    var emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.value = param;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const result = document.getElementById("contactResult");
  if (!form || !result) return;
  const endpoint = window.CONTACT_API_ENDPOINT || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message || !phone) {
      result.textContent = "未入力の項目があります。";
      result.style.color = "red";
      return;
    }

    if (!endpoint) {
      console.error("CONTACT_API_ENDPOINT is not set.");
      result.textContent =
        "送信先の設定に問題があります。時間をおいてお試しください。";
      result.style.color = "red";
      return;
    }

    result.textContent = "送信中…";
    result.style.color = "";
    const submitButton = form.querySelector(
      "button[type='submit']",
    );
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "送信中…";
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok || (data && data.ok === false)) {
        const msg =
          (data && data.error) ||
          `サーバーエラーが発生しました (HTTP ${res.status})`;
        throw new Error(msg);
      }

      result.textContent =
        "送信しました。ご連絡ありがとうございます！";
      result.style.color = "green";
      form.reset();
    } catch (err) {
      console.error("Contact API error:", err);
      result.textContent =
        "送信に失敗しました。時間をおいて再度お試しください。";
      result.style.color = "red";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "送信（ダミー）";
      }
    }
  });
});
