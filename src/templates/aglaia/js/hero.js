const heroLayers = {
  lake: document.querySelector('[data-layer="lake"]'),
  title: document.querySelector('[data-layer="title"]'),
  names: document.querySelectorAll(".hero__names .mask > span"),
  copy: document.querySelectorAll(".hero__title [data-hero-line]"),
  vessel: document.querySelector('[data-layer="vessel"]'),
  sail: document.getElementById("vesselSail"),
  trees: document.querySelectorAll(".tree__in"),
  shores: document.querySelectorAll(".shore__in"),
  cue: document.querySelector(".scroll-cue__in"),
  dawn: document.querySelector(".hero__dawn")
};

let vesselDrift = null;

function prepareHeroIntro() {
  if (!hasHero || prefersReducedMotion) return;
  gsap.set(heroLayers.dawn, { yPercent: 0 });
  gsap.set(heroLayers.names, { yPercent: 115 });
  gsap.set(heroLayers.copy, { opacity: 0, y: 12 });
  gsap.set(heroLayers.sail, { x: () => window.innerWidth * .75, opacity: 0 });
  gsap.set(heroLayers.trees, { x: (index, element) => Number(element.parentElement.dataset.side || 0) * window.innerWidth * .55, opacity: 0 });
  gsap.set(heroLayers.shores, { x: (index, element) => Number(element.parentElement.dataset.side || 0) * window.innerWidth * .45, y: (index, element) => (element.parentElement.dataset.side === "0" ? 60 : 0), opacity: 0 });
  gsap.set(heroLayers.cue, { opacity: 0 });
}

function startVesselDrift() {
  if (prefersReducedMotion || !heroLayers.sail || vesselDrift) return;
  vesselDrift = gsap.timeline({ repeat: -1 })
    .to(heroLayers.sail, { xPercent: 16, duration: 8, ease: "sine.inOut" })
    .to(heroLayers.sail, { xPercent: -14, duration: 15, ease: "sine.inOut" })
    .to(heroLayers.sail, { xPercent: 0, duration: 7, ease: "sine.inOut" });
  const hero = document.querySelector(".hero");
  if (hero && hero.classList.contains("is-idle")) vesselDrift.pause();
}

function playHeroIntro() {
  if (!hasHero || prefersReducedMotion) return null;
  return gsap.timeline({ defaults: { ease: "expo.out" } })
    .to(heroLayers.dawn, { yPercent: -112, duration: 2.6, ease: "power2.inOut" }, 0)
    .to(heroLayers.shores, { x: 0, y: 0, opacity: 1, duration: 2.2, ease: "power3.out" }, .3)
    .to(heroLayers.trees, { x: 0, opacity: 1, duration: 2.4, ease: "power3.out" }, .3)
    .to(heroLayers.sail, { x: 0, opacity: 1, duration: 3.8, ease: "power2.out" }, .3)
    .add(startVesselDrift, 4.1)
    .to(heroLayers.names, { yPercent: 0, duration: 1.5, stagger: .14 }, 1)
    .to(heroLayers.copy, { opacity: 1, y: 0, duration: 1.3, stagger: .12 }, 1.3)
    .to(heroLayers.cue, { opacity: 1, duration: 1 }, 2.2);
}

function cycleSlides(selector, interval, condition) {
  const slides = [...document.querySelectorAll(selector)];
  if (slides.length < 2 || prefersReducedMotion) return;
  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  setInterval(() => {
    if (condition && !condition.matches) return;
    const previous = slides[current];
    current = (current + 1) % slides.length;
    slides.forEach((slide) => slide.classList.remove("is-leaving"));
    previous.classList.remove("is-active");
    previous.classList.add("is-leaving");
    slides[current].classList.add("is-active");
  }, interval);
}

function buildHeroScroll() {
  if (prefersReducedMotion || !hasHero) return;
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1 } })
    .to(heroLayers.lake, { yPercent: -9, ease: "none" }, 0)
    .fromTo(heroLayers.title, { y: 0, clipPath: "inset(-20% -10% -20% -10%)" }, { y: () => window.innerHeight * .14, clipPath: "inset(-20% -10% 100% -10%)", ease: "none" }, 0)
    .to(heroLayers.title, { opacity: 0, ease: "power2.in" }, 0)
    .to(heroLayers.vessel, { xPercent: -34, yPercent: -55, scale: .5, ease: "none" }, 0)
    .to(heroLayers.vessel, { opacity: 0, ease: "power2.in" }, 0)
    .to('[data-layer="tree"][data-side="-1"]', { xPercent: -30, ease: "none" }, 0)
    .to('[data-layer="tree"][data-side="1"]', { xPercent: 30, ease: "none" }, 0)
    .to(".shore", { yPercent: 28, ease: "none" }, 0)
    .to('[data-layer="fog"]', { opacity: 1, ease: "power2.in" }, 0)
    .to(".scroll-cue", { yPercent: 60, opacity: 0, ease: "none", duration: .15 }, 0);
}
