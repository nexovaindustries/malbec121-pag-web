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

/* ---------- Hero: scroll-driven cinematic video ---------- */
(function () {
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const video = document.getElementById("heroVideo");
  const heroBgVideo = document.querySelector(".hero-bg-video");
  const heroContent = document.querySelector("[data-hero-content]");
  const heroOverlay = document.querySelector("[data-hero-overlay]");
  const heroTransition = document.querySelector("[data-hero-transition]");
  const heroCue = document.querySelector("[data-hero-cue]");
  if (!heroScroll || !video) return;

  function applyChoreography(progress) {
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
  }

  const isCompact = window.matchMedia("(max-width: 860px)").matches;
  const scrubMode = !prefersReducedMotion && !isCompact && "IntersectionObserver" in window;

  if (!scrubMode) {
    // Mobile / reduced-motion fallback: the video just loops normally and a
    // gentle parallax + fade plays out over one screen height of scroll.
    // This is the reliable path — no currentTime seeking involved.
    video.loop = true;
    video.autoplay = true;
    video.play().catch(() => {});

    if (!("IntersectionObserver" in window)) return;

    let active = false;
    let rafId = null;

    function fallbackFrame() {
      if (!active) {
        rafId = null;
        return;
      }
      const rect = heroScroll.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / rect.height));

      if (heroBgVideo) {
        heroBgVideo.style.transform = `translate3d(0, ${progress * 70}px, 0)`;
      }
      applyChoreography(progress);
      rafId = requestAnimationFrame(fallbackFrame);
    }

    const fallbackIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          active = entry.isIntersecting;
          if (active && rafId === null) rafId = requestAnimationFrame(fallbackFrame);
        });
      },
      { threshold: 0 }
    );
    fallbackIo.observe(heroScroll);
    return;
  }

  // Desktop scrub mode: the hero pins for ~300vh (see .hero-scroll/.hero-pin
  // in CSS) and video.currentTime is driven by scroll progress, smoothed
  // with a lerp so it never feels choppy. Autoplay stays off the whole time.
  video.autoplay = false;
  video.loop = false;
  video.pause();

  let duration = video.duration || 0;
  let smoothedTime = 0;
  let targetProgress = 0;
  let active = false;
  let rafId = null;
  let primed = false;
  let scrubBroken = false;

  // If the browser blocks even a muted play() (some privacy extensions do),
  // or metadata never arrives, seeking would leave the video frozen/broken.
  // Degrade to the always-reliable looping video instead of a dead frame.
  function fallBackToLoop() {
    if (scrubBroken) return;
    scrubBroken = true;
    video.loop = true;
    video.autoplay = true;
    video.play().catch(() => {});
  }

  function primeFrame() {
    if (primed) return;
    primed = true;
    video.play().then(() => video.pause()).catch(fallBackToLoop);
  }

  const metadataTimeout = setTimeout(() => {
    if (!primed) fallBackToLoop();
  }, 3000);

  video.addEventListener("loadedmetadata", () => {
    clearTimeout(metadataTimeout);
    duration = video.duration || 0;
    primeFrame();
  });

  function scrubFrame() {
    if (!active) {
      rafId = null;
      return;
    }

    const rect = heroScroll.getBoundingClientRect();
    const scrollable = heroScroll.offsetHeight - window.innerHeight;
    targetProgress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

    if (duration > 0 && !scrubBroken) {
      const targetTime = targetProgress * duration;
      smoothedTime += (targetTime - smoothedTime) * 0.18;
      if (Math.abs(smoothedTime - video.currentTime) > 0.01) {
        try {
          video.currentTime = smoothedTime;
        } catch (e) {
          /* seeking can throw before metadata is fully ready */
        }
      }
    }

    applyChoreography(targetProgress);
    rafId = requestAnimationFrame(scrubFrame);
  }

  const scrubIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        active = entry.isIntersecting;
        if (active) {
          primeFrame();
          if (rafId === null) rafId = requestAnimationFrame(scrubFrame);
        }
      });
    },
    { threshold: 0 }
  );
  scrubIo.observe(heroScroll);
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
