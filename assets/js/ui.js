document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(
    ".reveal-on-scroll",
  );

  if (
    !("IntersectionObserver" in window) ||
    targets.length === 0
  ) {
    // 古いブラウザは即表示
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // 一度きりでOK
        }
      });
    },
    {
      threshold: 0.12,
    },
  );

  targets.forEach((el) => observer.observe(el));
});
