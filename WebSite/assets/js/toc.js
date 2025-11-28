document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length === 0) {
    return;
  }

  const headings = Array.from(tocLinks)
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      return document.getElementById(href.substring(1));
    })
    .filter(Boolean);

  if (headings.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let activeHeading = null;

      // Find the heading that is intersecting and closest to the top trigger margin
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (
            !activeHeading ||
            entry.boundingClientRect.top <
              activeHeading.boundingClientRect.top
          ) {
            activeHeading = entry.target;
          }
        }
      }

      // If no heading is currently intersecting within the rootMargin,
      // find the last one that scrolled past the top of the viewport.
      if (!activeHeading) {
        for (let i = headings.length - 1; i >= 0; i--) {
          if (headings[i].getBoundingClientRect().top < 0) {
            activeHeading = headings[i];
            break;
          }
        }
      }

      // Update the active class on all links
      tocLinks.forEach((link) => {
        if (
          activeHeading &&
          link.getAttribute("href") ===
            `#${activeHeading.id}`
        ) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    },
    {
      // This creates a "trigger zone". An observation entry is created when a
      // heading enters the area between 20% from the top and 20% from the bottom.
      rootMargin: "-20% 0px -80% 0px",
      threshold: 0,
    },
  );

  headings.forEach((heading) => observer.observe(heading));
});
