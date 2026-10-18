function buildQuote() {
  if (prefersReducedMotion) return;
  const quoteWindow = document.getElementById("quoteWindow");
  const text = document.getElementById("quoteText");
  if (quoteWindow) {
    gsap.from(quoteWindow, { y: 70, opacity: 0, duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: quoteWindow, start: "top 88%", once: true } });
    const image = quoteWindow.querySelector("img");
    if (image) gsap.fromTo(image, { xPercent: -4 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: quoteWindow, start: "top bottom", end: "bottom top", scrub: true } });
  }
  if (text) {
    const words = splitWords(text);
    text.style.willChange = "transform";
    gsap.fromTo(words, { opacity: .24 }, { opacity: 1, ease: "none", stagger: .1, scrollTrigger: { trigger: text, start: "top 82%", end: "bottom 52%", scrub: true } });
  }
}

function buildClosing() {
  if (prefersReducedMotion) return;
  const horizon = document.getElementById("horizon");
  const boat = document.getElementById("horizonBoat");
  if (horizon && boat) {
    gsap.fromTo(boat, { xPercent: 120, y: 40, scale: 1 }, { xPercent: -70, y: -6, scale: .42, ease: "none", scrollTrigger: { trigger: horizon, start: "top bottom", end: "bottom bottom", scrub: 1.2 } });
  }
}
