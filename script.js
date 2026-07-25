document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen);
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const animatedEls = document.querySelectorAll("[data-animate]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

animatedEls.forEach((el) => {
  const delay = el.getAttribute("data-delay");
  if (delay) el.style.setProperty("--reveal-delay", delay);
});

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  animatedEls.forEach((el) => el.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  animatedEls.forEach((el) => revealObserver.observe(el));
}

/* ---------- Header: transparent over hero, solid after ---------- */
(function () {
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const header = document.querySelector(".site-header");
  if (!heroScroll || !header) return;

  header.classList.add("header-over-hero");

  let ticking = false;

  function update() {
    const heroBottom = heroScroll.getBoundingClientRect().bottom;
    header.classList.toggle("is-solid", heroBottom <= 0);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
})();

/* ---------- Hero: scroll-driven content over a looping video ---------- */
(function () {
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const video = document.getElementById("heroVideo");
  const heroContent = document.querySelector("[data-hero-content]");
  const heroOverlay = document.querySelector("[data-hero-overlay]");
  const heroTransition = document.querySelector("[data-hero-transition]");
  const heroCue = document.querySelector("[data-hero-cue]");
  if (!heroScroll || !video) return;

  // The video always just plays on a simple loop — this is reliable across
  // every browser. Seeking currentTime to match scroll position turned out
  // to be unreliable in some real-world browsers/extensions, so the scroll
  // instead drives the content choreography layered on top of the video.
  video.loop = true;
  video.autoplay = true;
  video.play().catch(() => {});

  const isCompact = window.matchMedia("(max-width: 860px)").matches;
  const scrubMode = !prefersReducedMotion && !isCompact && "IntersectionObserver" in window;
  if (!scrubMode) return; // fallback: plain looping video, no pin/choreography loop

  let active = false;
  let rafId = null;

  function frame() {
    if (!active) {
      rafId = null;
      return;
    }

    // The hero is a single normal 100vh section (no pin) — progress simply
    // tracks how far it has scrolled past the top of the viewport, so all
    // the choreography below plays out over one screen height of scroll.
    const rect = heroScroll.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));

    const fade = Math.min(1, progress / 0.5);
    if (heroContent) {
      heroContent.style.opacity = String(1 - fade);
      heroContent.style.transform = `translateY(${fade * -36}px) scale(${1 - fade * 0.06})`;
    }

    if (heroTransition) {
      const inStart = 0.45;
      const inEnd = 0.7;
      let tOpacity = 0;
      if (progress >= inStart && progress < inEnd) {
        tOpacity = (progress - inStart) / (inEnd - inStart);
      } else if (progress >= inEnd) {
        tOpacity = 1;
      }
      tOpacity = Math.max(0, Math.min(1, tOpacity));
      heroTransition.style.opacity = String(tOpacity);
      heroTransition.style.transform = `translate(-50%, ${(1 - tOpacity) * 16}px)`;
    }

    if (heroCue) {
      heroCue.style.opacity = String(Math.max(0, 1 - progress * 8));
    }

    if (heroOverlay) {
      heroOverlay.style.opacity = String(0.7 + progress * 0.25);
    }

    rafId = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        active = entry.isIntersecting;
        if (active && rafId === null) rafId = requestAnimationFrame(frame);
      });
    },
    { threshold: 0 }
  );
  io.observe(heroScroll);
})();

/* ---------- Gallery: subtle scroll parallax ---------- */
(function () {
  const gallery = document.getElementById("galeria");
  const photos = document.querySelectorAll(".gallery-photo img");
  if (!gallery || !photos.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  let visible = false;
  let ticking = false;

  const speeds = [0.06, 0.1, 0.05, 0.08, 0.06, 0.11, 0.05, 0.08, 0.06];

  function update() {
    photos.forEach((img, i) => {
      const rect = img.parentElement.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      const speed = speeds[i % speeds.length];
      const offset = Math.max(-45, Math.min(45, -centerOffset * speed));
      img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.14)`;
    });
    ticking = false;
  }

  function onScroll() {
    if (visible && !ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  const galleryObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
    },
    { threshold: 0, rootMargin: "200px 0px 200px 0px" }
  );
  galleryObserver.observe(gallery);

  window.addEventListener("scroll", onScroll, { passive: true });
})();
