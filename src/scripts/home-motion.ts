/** 홈 스크롤 리빌·히어로 패럴랙스 (GSAP 없이 IO + CSS) */

export type HomeMotionOptions = {
  onVisible?: (el: Element) => void;
};

export type RevealRoot = Document | Element;

export type HomeMotionController = {
  /** 동적 삽입된 .reveal 요소를 관찰 */
  observe: (root?: RevealRoot) => void;
  disconnect: () => void;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function assignStaggerIndex(el: Element) {
  if (!el.classList.contains("reveal-stagger")) return;
  Array.from(el.children).forEach((child, i) => {
    if (child instanceof HTMLElement) {
      child.style.setProperty("--stagger-i", String(i));
    }
  });
}

export function initHomeMotion(
  options: HomeMotionOptions = {},
): HomeMotionController {
  const reduced = prefersReducedMotion();
  let observer: IntersectionObserver | null = null;
  const pending = new Set<Element>();
  let scrollFlushBound = false;
  let flushRaf = 0;

  function revealNow(el: Element) {
    pending.delete(el);
    observer?.unobserve(el);
    assignStaggerIndex(el);
    el.classList.add("is-visible");
    options.onVisible?.(el);
  }

  function shouldRevealNow(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // 뷰포트 안이거나 이미 위로 지나간 경우
    return rect.bottom <= 0 || (rect.top < vh * 0.92 && rect.bottom > 0);
  }

  function flushPending() {
    flushRaf = 0;
    for (const el of [...pending]) {
      if (shouldRevealNow(el)) revealNow(el);
    }
  }

  function scheduleFlush() {
    if (flushRaf) return;
    flushRaf = requestAnimationFrame(flushPending);
  }

  function ensureScrollFlush() {
    if (scrollFlushBound || reduced) return;
    scrollFlushBound = true;
    window.addEventListener("scroll", scheduleFlush, { passive: true });
    window.addEventListener("resize", scheduleFlush, { passive: true });
  }

  function collect(root: RevealRoot): Element[] {
    const list: Element[] = [];
    if (
      root instanceof Element &&
      root.classList.contains("reveal") &&
      !root.classList.contains("is-visible")
    ) {
      list.push(root);
    }
    list.push(
      ...Array.from(root.querySelectorAll(".reveal:not(.is-visible)")),
    );
    return list;
  }

  function observe(root: RevealRoot = document) {
    const els = collect(root);

    if (reduced) {
      els.forEach(revealNow);
      return;
    }

    ensureScrollFlush();

    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rect = entry.boundingClientRect;
            const rootTop = entry.rootBounds?.top ?? 0;
            const passedAbove = !entry.isIntersecting && rect.bottom < rootTop;
            if (!entry.isIntersecting && !passedAbove) continue;
            revealNow(entry.target);
          }
        },
        { threshold: 0, rootMargin: "0px 0px -8% 0px" },
      );
    }

    for (const el of els) {
      assignStaggerIndex(el);
      if (shouldRevealNow(el)) {
        revealNow(el);
      } else {
        pending.add(el);
        observer.observe(el);
      }
    }
  }

  observe(document);
  initHeroParallax(reduced);
  initHeroScrollCue(reduced);

  return {
    observe,
    disconnect() {
      observer?.disconnect();
      observer = null;
      pending.clear();
    },
  };
}

function initHeroParallax(reduced: boolean) {
  const layer = document.getElementById("hero-bg-slides");
  const hero = document.querySelector(".hero-section");
  if (!layer || !hero || reduced) return;

  let ticking = false;

  function update() {
    ticking = false;
    const rect = (hero as HTMLElement).getBoundingClientRect();
    const heroH = rect.height || 1;
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
      (layer as HTMLElement).style.transform = "";
      return;
    }
    const progress = Math.min(1, Math.max(0, -rect.top / heroH));
    const y = progress * 48;
    (layer as HTMLElement).style.transform = `translate3d(0, ${y}px, 0)`;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

function initHeroScrollCue(reduced: boolean) {
  const cue = document.getElementById("hero-scroll-cue");
  const hero = document.querySelector(".hero-section");
  if (!cue || !hero) return;

  if (reduced) {
    cue.classList.add("is-hidden");
    return;
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      cue.classList.toggle("is-hidden", !entry.isIntersecting);
    },
    { threshold: 0.55 },
  );
  io.observe(hero);

  cue.addEventListener("click", () => {
    const next = document.querySelector(".home-body");
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
