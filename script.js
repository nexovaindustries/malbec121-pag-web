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

/* ---------- Hero: scroll-driven video scrub ---------- */
(function () {
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const video = document.getElementById("heroVideo");
  const heroContent = document.querySelector("[data-hero-content]");
  const heroOverlay = document.querySelector("[data-hero-overlay]");
  const heroTransition = document.querySelector("[data-hero-transition]");
  const heroCue = document.querySelector("[data-hero-cue]");
  if (!heroScroll || !video) return;

  const isCompact = window.matchMedia("(max-width: 860px)").matches;
  const scrubMode = !prefersReducedMotion && !isCompact && "IntersectionObserver" in window;

  if (scrubMode) {
    video.loop = false;
    video.autoplay = false;
    video.pause();
  } else {
    video.loop = true;
    video.autoplay = true;
    video.play().catch(() => {});
    return; // fallback mode: normal loop, no scrub/pin loop needed
  }

  let active = false;
  let rafId = null;
  let lerpTime = 0;

  function frame() {
    if (!active) {
      rafId = null;
      return;
    }

    const rect = heroScroll.getBoundingClientRect();
    const total = Math.max(heroScroll.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const progress = scrolled / total;

    if (video.readyState >= 1 && video.duration) {
      const targetTime = progress * video.duration;
      lerpTime += (targetTime - lerpTime) * 0.15;
      if (Math.abs(video.currentTime - lerpTime) > 0.03) {
        try {
          video.currentTime = lerpTime;
        } catch (e) {
          /* ignore seek errors while metadata is still loading */
        }
      }
    }

    const fade = Math.min(1, progress / 0.35);
    if (heroContent) {
      heroContent.style.opacity = String(1 - fade);
      heroContent.style.transform = `translateY(${fade * -36}px) scale(${1 - fade * 0.06})`;
    }

    if (heroTransition) {
      const inStart = 0.32;
      const inEnd = 0.5;
      const outStart = 0.74;
      const outEnd = 0.94;
      let tOpacity = 0;
      if (progress >= inStart && progress < inEnd) {
        tOpacity = (progress - inStart) / (inEnd - inStart);
      } else if (progress >= inEnd && progress < outStart) {
        tOpacity = 1;
      } else if (progress >= outStart && progress < outEnd) {
        tOpacity = 1 - (progress - outStart) / (outEnd - outStart);
      }
      tOpacity = Math.max(0, Math.min(1, tOpacity));
      heroTransition.style.opacity = String(tOpacity);
      heroTransition.style.transform = `translate(-50%, ${(1 - tOpacity) * 16}px)`;
    }

    if (heroCue) {
      heroCue.style.opacity = String(Math.max(0, 1 - progress * 6));
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
