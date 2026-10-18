const heroParts = {
  sky: document.querySelector(".hero__sky img"),
  penjors: document.querySelectorAll(".hero__penjor img"),
  arch: document.querySelector("[data-hero-arch]"),
  photo: document.querySelector(".hero__photo img"),
  rule: document.querySelector("[data-hero-rule]"),
  amp: document.querySelector(".hero__names .amp"),
  fades: document.querySelectorAll("[data-hero-fade]"),
  left: document.querySelectorAll('[data-layer="side-l"] .bloom'),
  right: document.querySelectorAll('[data-layer="side-r"] .bloom'),
  center: document.querySelectorAll('[data-layer="side-c"] .bloom'),
  names: []
};

function prepareHeroIntro() {
  if (!hasHero || prefersReducedMotion) return;
  heroParts.names = [...document.querySelectorAll(".hero__names [data-name]")].flatMap((name) => splitChars(name));
  const set = (target, vars) => { if (present(target)) gsap.set(target, vars); };
  set(heroParts.sky, { clipPath: "circle(0% at 50% 40%)", scale: 1.18 });
  set(heroParts.penjors, { rotation: -26, yPercent: 12, opacity: 0 });
  set(heroParts.arch, { clipPath: "inset(100% -12% 0% -12%)" });
  set(heroParts.photo, { scale: 1.3 });
  set(heroParts.rule, { scaleX: 0, opacity: 0 });
  set(heroParts.names, { yPercent: 90, opacity: 0 });
  set(heroParts.amp, { scale: 0, opacity: 0 });
  set(heroParts.fades, { opacity: 0, y: 16 });
  set(heroParts.left, { xPercent: -80, opacity: 0 });
  set(heroParts.right, { xPercent: 80, opacity: 0 });
  set(heroParts.center, { yPercent: 70, opacity: 0 });
}

function playHeroIntro() {
  if (!hasHero || prefersReducedMotion) return null;
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  const add = (target, vars, position) => { if (present(target)) timeline.to(target, vars, position); };
  add(heroParts.sky, { clipPath: "circle(80% at 50% 40%)", scale: 1, duration: 2.2, ease: "power2.inOut", onComplete: () => gsap.set(heroParts.sky, { clearProps: "clipPath" }) }, 0);
  add(heroParts.left, { xPercent: 0, opacity: 1, duration: 1.7, stagger: .09 }, .2);
  add(heroParts.right, { xPercent: 0, opacity: 1, duration: 1.7, stagger: .09 }, .2);
  add(heroParts.center, { yPercent: 0, opacity: 1, duration: 1.5 }, .4);
  add(heroParts.penjors, { rotation: 0, yPercent: 0, opacity: 1, duration: 2.3, ease: "elastic.out(1, .6)", stagger: .15 }, .35);
  add(heroParts.arch, { clipPath: "inset(-12% -12% -12% -12%)", duration: 1.5, ease: "power3.inOut", onComplete: () => gsap.set(heroParts.arch, { clearProps: "clipPath" }) }, .5);
  add(heroParts.photo, { scale: 1, duration: 2.3 }, .5);
  add(heroParts.names, { yPercent: 0, opacity: 1, duration: .9, stagger: .05 }, 1.3);
  add(heroParts.rule, { scaleX: 1, opacity: 1, duration: 1.2, ease: "expo.out" }, 1.8);
  add(heroParts.amp, { scale: 1, opacity: 1, duration: .8, ease: "back.out(2.2)" }, 1.95);
  add(heroParts.fades, { opacity: 1, y: 0, duration: .9, stagger: .12 }, 1.9);
  return timeline;
}

function buildHeroScroll() {
  if (prefersReducedMotion || !hasHero) return;
  const timeline = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1.2 } });
  const add = (target, vars, position) => { if (present(target)) timeline.to(target, vars, position); };
  add('[data-layer="sky"]', { scale: 1.16, ease: "none", duration: 1 }, 0);
  add('[data-layer="top"]', { yPercent: -160, opacity: 0, ease: "none", duration: .5 }, 0);
  add('[data-layer="arch"]', { scale: 1.45, yPercent: -8, opacity: 0, ease: "power1.in", duration: .7 }, 0);
  add('[data-layer="title"]', { yPercent: -120, opacity: 0, ease: "power1.in", duration: .6 }, 0);
  add('[data-layer="meta"]', { yPercent: -140, opacity: 0, ease: "none", duration: .45 }, 0);
  add('[data-layer="penjor-l"]', { xPercent: -50, yPercent: -25, ease: "none", duration: 1 }, 0);
  add('[data-layer="penjor-r"]', { xPercent: 50, yPercent: -25, ease: "none", duration: 1 }, 0);
  add('[data-layer="side-l"]', { xPercent: -40, ease: "none", duration: 1 }, 0);
  add('[data-layer="side-r"]', { xPercent: 40, ease: "none", duration: 1 }, 0);
  add('[data-layer="side-c"]', { yPercent: 50, ease: "none", duration: 1 }, 0);
  add(['[data-layer="sky"]', '[data-layer="veil"]'], { opacity: 0, ease: "power1.in", duration: .55 }, .45);
  add(".hero__garden", { opacity: 0, ease: "power1.in", duration: .3 }, .7);
}
