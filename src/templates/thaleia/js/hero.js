const heroParts = {
  sky: document.querySelector(".hero__sky img"),
  trees: document.querySelectorAll(".hero__tree img"),
  window: document.querySelector("[data-hero-window]"),
  frame: document.querySelector("[data-hero-frame]"),
  photo: document.querySelector(".hero__photo img"),
  names: document.querySelectorAll(".hero__names [data-name]"),
  amp: document.querySelector(".hero__names .amp"),
  rule: document.querySelector("[data-hero-rule]"),
  fades: document.querySelectorAll("[data-hero-fade]"),
  bed: document.querySelectorAll(".hero__bed .bloom")
};

function prepareHeroIntro() {
  if (!hasHero || prefersReducedMotion) return;
  const set = (target, vars) => { if (present(target)) gsap.set(target, vars); };
  set(heroParts.sky, { scale: 1.22, opacity: 0, filter: "blur(16px)" });
  set(heroParts.trees, { scaleY: .35, scaleX: .8, opacity: 0, transformOrigin: "50% 100%" });
  set(heroParts.window, { clipPath: "polygon(0% 0%, 0% 0%, 0% 0%)" });
  set(heroParts.frame, { scale: .86, opacity: 0 });
  set(heroParts.photo, { scale: 1.32 });
  set(heroParts.names, { opacity: 0, y: -16, scale: 1.08, filter: "blur(14px)" });
  set(heroParts.amp, { scale: 2.2, opacity: 0 });
  set(heroParts.rule, { scaleX: 0 });
  set(heroParts.fades, { opacity: 0, y: 14 });
  set(heroParts.bed, { yPercent: 70, opacity: 0 });
}

function playHeroIntro() {
  if (!hasHero || prefersReducedMotion) return null;
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  const add = (target, vars, position) => { if (present(target)) timeline.to(target, vars, position); };
  add(heroParts.sky, { scale: 1, opacity: 1, filter: BLUR_CLEAR, duration: 2.6, ease: "power2.out", onComplete: () => gsap.set(heroParts.sky, { clearProps: "filter" }) }, 0);
  add(heroParts.trees, { scaleY: 1, scaleX: 1, opacity: 1, duration: 2.3, stagger: .18 }, .15);
  add(heroParts.bed, { yPercent: 0, opacity: 1, duration: 1.8, stagger: .12 }, .35);
  add(heroParts.frame, { scale: 1, opacity: 1, duration: 1.5 }, .4);
  add(heroParts.window, { clipPath: "polygon(0% 0%, 220% 0%, 0% 220%)", duration: 1.7, ease: "power3.inOut", onComplete: () => gsap.set(heroParts.window, { clearProps: "clipPath" }) }, .5);
  add(heroParts.photo, { scale: 1, duration: 2.4 }, .5);
  add(heroParts.names, { opacity: 1, y: 0, scale: 1, filter: BLUR_CLEAR, duration: 1.5, stagger: .3, onComplete: () => gsap.set(heroParts.names, { clearProps: "filter" }) }, 1.2);
  add(heroParts.amp, { scale: 1, opacity: 1, duration: 1 }, 1.55);
  add(heroParts.rule, { scaleX: 1, duration: 1.3, ease: "expo.out" }, 1.75);
  add(heroParts.fades, { opacity: 1, y: 0, duration: 1, stagger: .12 }, 1.85);
  return timeline;
}

function buildHeroScroll() {
  if (prefersReducedMotion || !hasHero) return;
  const timeline = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1.1 } });
  const add = (target, vars, position) => { if (present(target)) timeline.to(target, vars, position); };
  add('[data-layer="sky"]', { scale: 1.22, yPercent: -6, ease: "none", duration: 1 }, 0);
  add('[data-layer="tree-l"]', { xPercent: -45, scale: 1.15, ease: "none", duration: 1 }, 0);
  add('[data-layer="tree-r"]', { xPercent: 45, scale: 1.15, ease: "none", duration: 1 }, 0);
  add('[data-layer="arch"]', { scale: .7, yPercent: -18, opacity: 0, filter: "blur(8px)", ease: "power1.in", duration: .7 }, 0);
  add('[data-layer="top"]', { yPercent: -220, opacity: 0, ease: "none", duration: .45 }, 0);
  add('[data-layer="title"]', { yPercent: -90, opacity: 0, ease: "power1.in", duration: .6 }, 0);
  add('[data-layer="meta"]', { yPercent: -120, opacity: 0, ease: "none", duration: .45 }, 0);
  add('[data-layer="bed"]', { yPercent: 35, scale: 1.12, ease: "none", duration: 1 }, 0);
  add(['[data-layer="sky"]', '[data-layer="veil"]', '[data-layer="tree-l"]', '[data-layer="tree-r"]'], { opacity: 0, ease: "power1.in", duration: .5 }, .5);
  add('[data-layer="bed"]', { opacity: 0, ease: "power1.in", duration: .25 }, .75);
}
