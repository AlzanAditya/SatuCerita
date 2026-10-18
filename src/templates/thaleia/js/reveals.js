function buildReveals() {
  if (prefersReducedMotion) return;
  const presets = {
    kicker: (element) => gsap.timeline()
      .from(element, { opacity: 0, letterSpacing: "0.9em", duration: 1.6, ease: "power3.out", clearProps: "letterSpacing,opacity" }, 0)
      .fromTo(element, { filter: "blur(4px)" }, { filter: BLUR_CLEAR, duration: 1.2, ease: "power2.out", clearProps: "filter" }, 0),
    title: (element) => inkIn(element, { y: 24, scale: .95, blur: 12, duration: 1.7 }),
    divider: (element) => gsap.fromTo(element, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut", clearProps: "clipPath" }),
    lead: (element) => inkIn(element, { y: 22, scale: 1, blur: 6, duration: 1.3 }),
    rise: (element) => gsap.from(element, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", clearProps: "transform,opacity" }),
    card: (element) => settleCard(element, { cascade: element.children }),
    drop: (element) => gsap.from(element, { yPercent: -70, rotation: 14, opacity: 0, transformOrigin: "50% 0%", duration: 2, ease: "elastic.out(1, .5)", clearProps: "transform,opacity" }),
    stream: (element) => {
      const timeline = gsap.timeline().add(settleCard(element, { y: 50, duration: 1.4 }), 0);
      const image = element.querySelector(".stream__image");
      if (image) timeline.fromTo(image, { scale: 1.28, filter: "blur(14px) brightness(.7)" }, { scale: 1, filter: "blur(0px) brightness(1)", duration: 2.2, ease: "power2.out", clearProps: "transform,filter" }, 0);
      const parts = element.querySelectorAll(".stream__badge, .stream__play, .stream__info");
      if (parts.length) timeline.from(parts, { opacity: 0, y: 16, duration: .9, stagger: .14, ease: "power2.out", clearProps: "transform,opacity" }, .9);
      return timeline;
    }
  };
  document.querySelectorAll("[data-fx]").forEach((element) => {
    const factory = presets[element.dataset.fx] || presets.rise;
    const tween = factory(element);
    tween.pause(0);
    onceInView(element, () => tween.play());
  });
  document.querySelectorAll("[data-edge]").forEach((edge) => {
    const image = edge.querySelector("img");
    const side = edge.classList.contains("edge--tr") ? 1 : -1;
    gsap.fromTo(image, { rotation: side * 3, scale: .94 }, { rotation: side * -2, scale: 1, ease: "none", scrollTrigger: { trigger: edge.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
  });
}

function buildVerse() {
  document.querySelectorAll("[data-verse]").forEach((element) => {
    const words = splitWords(element);
    if (prefersReducedMotion) return;
    gsap.to(words, { opacity: 1, ease: "none", stagger: .1, scrollTrigger: { trigger: element, start: "top 82%", end: "bottom 48%", scrub: .6 } });
  });
}
