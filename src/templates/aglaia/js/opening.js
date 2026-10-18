let openingTimeline = null;
let opened = false;

function setCoverInert(locked) {
  document.querySelectorAll("main, .controls").forEach((element) => { element.inert = locked; });
}

function finishOpening() {
  if (opened) return;
  opened = true;
  setCoverInert(false);
  const cover = document.getElementById("cover");
  if (cover) cover.remove();
  document.documentElement.classList.remove("is-locked");
  document.body.classList.remove("is-locked");
  resetScrollToTop();
  lenis.scrollTo(0, { immediate: true, force: true });
  lenis.start();
  ScrollTrigger.refresh();
}

function openInvitation() {
  const button = document.getElementById("openInvitation");
  if (!button || button.disabled) return;
  button.disabled = true;
  resetScrollToTop();
  lenis.scrollTo(0, { immediate: true, force: true });
  if (prefersReducedMotion) {
    document.body.classList.add("is-open");
    finishOpening();
    return;
  }
  if (coverIntro) coverIntro.progress(1).kill();
  gsap.killTweensOf(COVER_TWEEN_TARGETS);
  const cover = document.getElementById("cover");
  const flap = cover.querySelector("[data-envelope-flap]");
  const shift = () => {
    const box = document.getElementById("envelope").getBoundingClientRect();
    return window.innerHeight * .58 - (box.top + box.height / 2);
  };
  openingTimeline = gsap.timeline({ onComplete: finishOpening })
    .to(".cover__seal", { y: -16, scale: 1.12, opacity: 0, duration: .6, ease: "power2.out" }, 0)
    .to(".cover__hint", { opacity: 0, duration: .4, ease: "power1.out" }, 0)
    .to([".cover__frame", ".cover__kicker", ".cover__names", ".cover__date"], { y: -24, opacity: 0, duration: .8, stagger: .05, ease: "power2.inOut" }, .1)
    .to("#envelope", { y: shift, duration: 1.1, ease: "power3.inOut" }, .25)
    .to(flap, { scaleY: 0, duration: .45, ease: "power2.in" }, .9)
    .set(flap, { zIndex: 0 }, 1.35)
    .to(flap, { scaleY: -1, duration: .55, ease: "power2.out" }, 1.35)
    .fromTo("[data-envelope-card]", { yPercent: 0 }, { yPercent: -58, duration: 1.3, ease: "power3.out" }, 1.55)
    .add(() => {
      document.body.classList.add("is-open");
      playHeroIntro();
    }, 2.6)
    .to(cover, { y: () => -(cover.offsetHeight + 90), duration: 1.8, ease: "power3.inOut" }, 2.55);
}
