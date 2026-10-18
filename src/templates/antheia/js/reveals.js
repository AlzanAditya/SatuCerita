function buildReveals() {
  if (prefersReducedMotion) return;
  const clip = (element, from, to, duration, ease) => gsap.fromTo(element, { clipPath: from }, { clipPath: to, duration, ease, clearProps: "clipPath" });
  const presets = {
    rise: (element) => gsap.from(element, { y: 34, opacity: 0, duration: 1.15, ease: "power3.out", clearProps: "transform,opacity" }),
    widen: (element) => gsap.from(element, { letterSpacing: "0em", opacity: 0, y: 10, duration: 1.5, ease: "power3.out", clearProps: "letterSpacing,transform,opacity" }),
    write: (element) => gsap.timeline()
      .add(clip(element, "inset(-30% 100% -40% -12%)", "inset(-30% -12% -40% -12%)", 1.5, "power2.inOut"), 0)
      .from(element, { x: -10, duration: 1.5, ease: "power2.out", clearProps: "transform" }, 0),
    split: (element) => clip(element, "inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)", 1.3, "expo.inOut"),
    bloom: (element) => gsap.from(element, { scale: .45, rotation: -16, opacity: 0, duration: 1.5, ease: "back.out(1.7)", clearProps: "transform,opacity" }),
    drop: (element) => gsap.from(element, { yPercent: -70, opacity: 0, duration: 1.7, ease: "bounce.out", clearProps: "transform,opacity" }),
    lift: (element) => gsap.timeline()
      .add(clip(element, "inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)", 1.4, "power3.inOut"), 0)
      .from(element, { y: 30, duration: 1.4, ease: "power3.out", clearProps: "transform" }, 0),
    eyelid: (element) => gsap.timeline()
      .add(clip(element, "inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)", 1.5, "power3.inOut"), 0)
      .from(element.querySelector("img"), { scale: 1.3, duration: 2, ease: "power2.out" }, 0),
    cinema: (element) => {
      const timeline = gsap.timeline()
        .fromTo(element, { clipPath: "inset(42% 0% 42% 0% round 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "power3.inOut", clearProps: "clipPath" }, 0);
      const image = element.querySelector(".stream__image");
      if (image) timeline.from(image, { scale: 1.35, duration: 2.2, ease: "power2.out", clearProps: "transform" }, 0);
      const parts = element.querySelectorAll(".stream__badge, .stream__play, .stream__info");
      if (parts.length) timeline.from(parts, { opacity: 0, y: 18, duration: .9, stagger: .15, ease: "power2.out", clearProps: "transform,opacity" }, 1);
      return timeline;
    },
    unfurl: (element) => gsap.timeline()
      .from(element, { scaleY: .5, opacity: 0, transformOrigin: "50% 0%", duration: 1.4, ease: "power4.out", clearProps: "transform,opacity" }, 0)
      .from(element.querySelector(".verse__ornament"), { scaleX: 0, opacity: 0, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity" }, .6),
    union: (element) => gsap.timeline()
      .add(clip(element, "inset(-40% 50% -40% 50%)", "inset(-40% 0% -40% 0%)", 1.3, "expo.inOut"), 0)
      .from(element.querySelector(".union__amp"), { scale: .3, rotation: -25, opacity: 0, duration: 1.3, ease: "back.out(1.8)", clearProps: "transform,opacity" }, .35),
    form: (element) => {
      const timeline = gsap.timeline()
        .add(clip(element, "inset(100% 0% 0% 0% round 12px)", "inset(0% 0% 0% 0% round 12px)", 1.5, "power3.inOut"), 0);
      const children = ownChildren(element);
      if (children.length) timeline.from(children, { opacity: 0, x: -14, duration: .8, stagger: .07, ease: "power2.out", clearProps: "transform,opacity" }, .7);
      return timeline;
    },
    frame: (element) => gsap.timeline()
      .from(element.querySelector(".farewell__visual"), { scale: .72, rotation: -8, opacity: 0, duration: 1.6, ease: "back.out(1.4)", clearProps: "transform,opacity" }, 0)
      .from(element.querySelector(".farewell__photo img"), { scale: 1.35, duration: 2.4, ease: "power2.out", clearProps: "transform" }, 0)
      .from(element.querySelectorAll(".farewell__lantern"), { yPercent: -90, opacity: 0, duration: 1.8, ease: "bounce.out", stagger: .18, clearProps: "transform,opacity" }, .4)
  };
  document.querySelectorAll("[data-reveal]").forEach((element) => {
    const factory = presets[element.dataset.reveal] || presets.rise;
    const tween = factory(element);
    tween.pause();
    onceInView(element, () => tween.play());
  });
  document.querySelectorAll("[data-accent]").forEach((accent) => {
    gsap.fromTo(accent, { yPercent: 25 }, { yPercent: -25, ease: "none", scrollTrigger: { trigger: accent.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
  });
}

function buildWordReveals() {
  document.querySelectorAll("[data-words]").forEach((element) => {
    const words = splitWords(element, "mw", "mw__in");
    if (prefersReducedMotion) return;
    const tween = gsap.from(words, { yPercent: 115, rotation: 5, duration: 1, ease: "power3.out", stagger: .035, paused: true });
    onceInView(element, () => tween.play(), "top 84%");
  });
  document.querySelectorAll("[data-blur-words]").forEach((element) => {
    const words = splitWords(element, "bw");
    if (prefersReducedMotion) return;
    const tween = isTouch
      ? gsap.from(words, { opacity: 0, y: 8, duration: 1.1, ease: "power2.out", stagger: .06, paused: true })
      : gsap.from(words, { opacity: 0, filter: "blur(10px)", y: 8, duration: 1.1, ease: "power2.out", stagger: .06, paused: true, clearProps: "filter" });
    onceInView(element, () => tween.play(), "top 85%");
  });
}
