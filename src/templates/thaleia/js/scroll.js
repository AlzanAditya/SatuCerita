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

const lenis = new Lenis({ lerp: .08, smoothWheel: true });

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => lenis.raf(time * 1000));

gsap.ticker.lagSmoothing(0);

lenis.stop();
