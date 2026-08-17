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

/* ---------- AR "plato estrella": iOS Quick Look / Android Scene Viewer ---------- */
(function () {
  const iosLink = document.getElementById("arLinkIos");
  const androidLink = document.getElementById("arLinkAndroid");
  if (!iosLink || !androidLink) return;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    iosLink.style.display = "inline-block";
  } else if (isAndroid) {
    const glbUrl = new URL("plato-estrella-ar.glb", window.location.href).href;
    const intentUrl =
      "intent://arvr.google.com/scene-viewer/1.0?file=" +
      encodeURIComponent(glbUrl) +
      "&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=" +
      encodeURIComponent(glbUrl) +
      ";end;";
    androidLink.href = intentUrl;
    androidLink.style.display = "inline-block";
  }
})();

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

/* ---------- Hero: scroll-driven cinematic video ---------- */
(function () {
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const video = document.getElementById("heroVideo");
  const siteBgVideo = document.querySelector(".site-bg-video");
  const heroContent = document.querySelector("[data-hero-content]");
  const heroOverlay = document.querySelector("[data-hero-overlay]");
  const heroCue = document.querySelector("[data-hero-cue]");
  if (!heroScroll || !video) return;

  function applyChoreography(progress) {
    const fade = Math.min(1, progress / 0.85);
    if (heroContent) {
      heroContent.style.opacity = String(1 - fade);
      heroContent.style.transform = `translateY(${fade * -36}px) scale(${1 - fade * 0.06})`;
    }

    if (heroCue) {
      heroCue.style.opacity = String(Math.max(0, 1 - progress * 8));
    }

    if (heroOverlay) {
      heroOverlay.style.opacity = String(0.7 + progress * 0.25);
    }
  }

  // The video always plays on a simple loop from page load, independent of
  // scroll — the client wants it active immediately, not gated behind a
  // scroll-driven scrub. Scroll only drives the content fade/parallax below.
  video.loop = true;
  video.autoplay = true;
  video.play().catch(() => {});

  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  let active = false;
  let rafId = null;

  function frame() {
    if (!active) {
      rafId = null;
      return;
    }
    const rect = heroScroll.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));

    if (siteBgVideo) {
      siteBgVideo.style.transform = `translate3d(0, ${progress * 70}px, 0)`;
    }
    applyChoreography(progress);
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
