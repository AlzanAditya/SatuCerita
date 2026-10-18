if ("scrollRestoration" in history) history.scrollRestoration = "manual";

function resetScrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

resetScrollToTop();
window.addEventListener("load", () => { if (document.getElementById("cover")) resetScrollToTop(); });
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
  else if (document.getElementById("cover")) resetScrollToTop();
});

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const lenis = new Lenis({ lerp: .09, smoothWheel: !prefersReducedMotion });
lenis.on("scroll", ScrollTrigger.update);
let scrollBeforeRefresh = null;
ScrollTrigger.addEventListener("refreshInit", () => { scrollBeforeRefresh = lenis.scroll; });
ScrollTrigger.addEventListener("refresh", () => {
  if (scrollBeforeRefresh === null) return;
  const target = scrollBeforeRefresh;
  scrollBeforeRefresh = null;
  lenis.resize();
  if (Math.abs(window.scrollY - target) > 1) lenis.scrollTo(target, { immediate: true, force: true });
});
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();
