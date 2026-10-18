function tideIn(targets, vars = {}) {
  const list = gsap.utils.toArray(targets);
  list.forEach((element) => element.classList.add("tide"));
  return gsap.fromTo(list, { "--tide": "0%" }, {
    "--tide": "122%",
    duration: 1.6,
    ease: "power2.out",
    ...vars,
    onStart: () => list.forEach((element) => { element.style.willChange = "transform"; }),
    onComplete: () => list.forEach((element) => {
      element.classList.remove("tide");
      element.style.removeProperty("--tide");
      element.style.removeProperty("will-change");
    })
  });
}

const SPACED_ORIGIN = { left: "0% 50%", start: "0% 50%", right: "100% 50%", end: "100% 50%" };
const spacedOrigins = new WeakMap();

function spacedOrigin(element) {
  if (!spacedOrigins.has(element)) spacedOrigins.set(element, SPACED_ORIGIN[getComputedStyle(element).textAlign] || "50% 50%");
  return spacedOrigins.get(element);
}


function primeSpacedOrigins() {
  document.querySelectorAll(".eyebrow, .mate__role, .cover__kicker, .cover__date, .cover__hint").forEach(spacedOrigin);
}

function primeTransforms(elements) {
  elements.forEach((element) => gsap.getProperty(element, "x"));
}

function spacedIn(targets, vars = {}) {
  const list = gsap.utils.toArray(targets);
  return gsap.from(list, {
    scaleX: 1.3,
    opacity: 0,
    duration: 1.8,
    ease: "expo.out",
    force3D: true,
    transformOrigin: (index, element) => spacedOrigin(element),
    clearProps: "transform",
    ...vars
  });
}

const REVEAL_PRESETS = {
  fade: (element) => (element.classList.contains("eyebrow") ? spacedIn(element) : tideIn(element)),
  soft: (element) => gsap.from(element, { y: 40, opacity: 0, duration: 1.6, ease: "power3.out", clearProps: "transform,opacity" }),
  rise: (element) => gsap.from(splitWords(element), { yPercent: 70, opacity: 0, duration: 1.3, ease: "expo.out", stagger: .07 }),
  crest: (element) => gsap.from(element, { y: 34, opacity: 0, duration: 1.8, ease: "expo.out" }),
  rising: (element) => {
    const timeline = gsap.timeline().fromTo(element, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "power3.inOut", clearProps: "clipPath" });
    const image = element.querySelector("img");
    if (image) timeline.from(image, { yPercent: 6, duration: 2.3, ease: "power2.out" }, 0);
    return timeline;
  },
  card: (element) => {
    const timeline = gsap.timeline().from(element, { y: 56, opacity: 0, duration: 1.4, ease: "expo.out", clearProps: "transform" });
    const children = ownChildren(element);
    if (children.length) timeline.add(tideIn(children, { duration: 1.2, stagger: .08 }), .35);
    return timeline;
  }
};

function buildReveals() {
  if (prefersReducedMotion) return;
  const elements = [...document.querySelectorAll("[data-reveal]")];
  const words = elements.filter((element) => element.dataset.reveal === "rise").flatMap((element) => splitWords(element));
  primeTransforms(words);
  elements.forEach((element) => {
    const factory = REVEAL_PRESETS[element.dataset.reveal] || REVEAL_PRESETS.fade;
    const tween = factory(element);
    tween.pause();
    onceInView(element, () => tween.play());
  });
}
