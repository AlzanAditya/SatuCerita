function buildCouple() {
  document.querySelectorAll("[data-person]").forEach((person) => {
    const visual = person.querySelector(".person__visual");
    const image = person.querySelector(".person__photo img");
    const tag = person.querySelector(".person__tag");
    const nick = person.querySelector(".person__nick");
    const full = person.querySelector(".person__full");
    const letters = full ? splitChars(full) : [];
    const rest = person.querySelectorAll(".person__parents, .ig");
    if (prefersReducedMotion) return;
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(visual, { clipPath: "inset(100% -20% 0% -20%)" }, { clipPath: "inset(-20% -20% -20% -20%)", duration: 1.6, ease: "power3.inOut", clearProps: "clipPath" }, 0)
      .from(image, { scale: 1.3, yPercent: 10, duration: 2.3 }, 0);
    if (tag) timeline.from(tag, { opacity: 0, letterSpacing: "0em", duration: 1.5, clearProps: "letterSpacing,opacity" }, .7);
    timeline
      .fromTo(nick, { clipPath: "inset(-30% 100% -40% -12%)" }, { clipPath: "inset(-30% -12% -40% -12%)", duration: 1.4, ease: "power2.inOut", clearProps: "clipPath" }, 1)
      .from(letters, { rotationX: -90, opacity: 0, transformOrigin: "50% 100%", duration: .7, stagger: .028 }, 1.35)
      .from(rest, { y: 18, opacity: 0, duration: .9, stagger: .12, clearProps: "transform,opacity" }, 1.6);
    onceInView(person, () => timeline.play(), "top 75%");
  });
}

function buildStory() {
  const cards = [...document.querySelectorAll("[data-story-card]")];
  if (!cards.length || prefersReducedMotion) return;
  cards.forEach((card, index) => {
    const inner = card.querySelector(".story-card__inner");
    const image = card.querySelector(".story-card__media img");
    const shade = card.querySelector(".story-card__shade");
    gsap.fromTo(inner, { rotation: index % 2 ? 4 : -4, y: 70 }, { rotation: 0, y: 0, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 55%", scrub: true } });
    if (image) gsap.fromTo(image, { scale: 1.28 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 25%", scrub: true } });
    const next = cards[index + 1];
    if (!next) return;
    gsap.timeline({ scrollTrigger: { trigger: next, start: "top 88%", end: () => `top ${parseFloat(getComputedStyle(next).top) + 12}px`, scrub: true } })
      .to(inner, { scale: .9, ease: "none" }, 0)
      .to(shade, { opacity: 1, ease: "none" }, 0);
  });
}

function buildEvents() {
  document.querySelectorAll("[data-event]").forEach((card) => {
    const count = card.querySelector("[data-count]");
    const items = [...card.children];
    if (prefersReducedMotion) return;
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(card, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power3.inOut", clearProps: "clipPath" }, 0)
      .from(items, { y: -16, opacity: 0, duration: .85, stagger: .08, clearProps: "transform,opacity" }, .6);
    const target = count ? parseInt(count.dataset.count, 10) : NaN;
    if (count && target > 1) {
      const width = count.textContent.trim().length;
      const counter = { value: 1 };
      timeline.to(counter, { value: target, duration: 1.3, ease: "power2.out", onStart: () => { counter.value = 1; }, onUpdate: () => { count.textContent = String(Math.round(counter.value)).padStart(width, "0"); } }, .9);
    }
    onceInView(card, () => timeline.play(), "top 82%");
  });
}

function buildAttire() {
  if (prefersReducedMotion) return;
  const swatches = document.querySelectorAll("#swatches .swatch");
  if (swatches.length) {
    const timeline = gsap.timeline({ paused: true })
      .from("#swatches .swatch__chip", { scale: 0, duration: .8, ease: "back.out(2)", stagger: .1 })
      .fromTo("#swatches .swatch__fill", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.inOut", stagger: .13 }, .4)
      .from("#swatches .swatch__name", { y: 10, opacity: 0, duration: .6, stagger: .08 }, .9);
    onceInView("#swatches", () => timeline.play());
  }
}

function setupInstagramHandles() {
  document.querySelectorAll("[data-ig]").forEach((link) => {
    const label = link.querySelector("span");
    const path = (link.getAttribute("href") || "").split(/[?#]/)[0].replace(/\/+$/, "");
    const handle = path.split("/").pop().replace(/^@/, "");
    if (label && handle && !/instagram\.com$/i.test(handle)) label.textContent = `@${handle}`;
  });
}
