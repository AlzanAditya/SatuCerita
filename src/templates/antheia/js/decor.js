const BLOSSOM_TONES = [["#1f2e5c", "#e9d6a0"], ["#86a7d2", "#f6edd0"], ["#c9d8ec", "#d8b867"], ["#faf9f4", "#86a7d2"], ["#4b679e", "#f3e2b0"]];

function buildBlossoms() {
  const layer = document.getElementById("blossoms");
  if (!layer || prefersReducedMotion) return;
  const count = isTouch ? 7 : 13;
  for (let index = 0; index < count; index++) {
    const blossom = document.createElement("span");
    blossom.className = "blossom";
    blossom.style.setProperty("--size", `${9 + (index % 4) * 4}px`);
    const [petal, heart] = BLOSSOM_TONES[index % BLOSSOM_TONES.length];
    blossom.innerHTML = `<svg viewBox="0 0 24 24"><g fill="${petal}" opacity=".92"><circle cx="12" cy="6.6" r="4.4"/><circle cx="17.1" cy="10.3" r="4.4"/><circle cx="15.2" cy="16.4" r="4.4"/><circle cx="8.8" cy="16.4" r="4.4"/><circle cx="6.9" cy="10.3" r="4.4"/></g><circle cx="12" cy="12" r="2.4" fill="${heart}"/></svg>`;
    layer.appendChild(blossom);
    const drift = () => {
      const width = layer.clientWidth;
      const height = layer.clientHeight;
      const startX = Math.random() * width * 1.1 - width * .3;
      const travel = width * (.25 + Math.random() * .35);
      const duration = 13 + Math.random() * 8;
      gsap.set(blossom, { x: startX, y: -30, rotation: Math.random() * 360, scale: .8 + Math.random() * .4, opacity: 0 });
      gsap.timeline({ onComplete: drift })
        .to(blossom, { opacity: .85, duration: 1.5 }, 0)
        .to(blossom, { y: height + 30, duration, ease: "none" }, 0)
        .to(blossom, { x: startX + travel, duration, ease: "sine.inOut" }, 0)
        .to(blossom, { rotation: `+=${120 + Math.random() * 240}`, duration, ease: "none" }, 0)
        .to(blossom, { opacity: 0, duration: 1.5 }, duration - 1.5);
    };
    gsap.delayedCall(index * 1.3, drift);
  }
}

function buildPanImages() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-pan-image]").forEach((image) => {
    gsap.fromTo(image, { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: image.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
  });
}

function buildSceneBackdrop() {
  const images = [...document.querySelectorAll("#backdrop img")];
  const sections = [...document.querySelectorAll("section[data-scene]")];
  const load = (name) => images.forEach((image) => { if (image.dataset.scene === name && !image.src && image.dataset.src) image.src = image.dataset.src; });
  const setScene = (name) => images.forEach((image) => image.classList.toggle("is-active", image.dataset.scene === name));
  if (sections[0]) load(sections[0].dataset.scene);
  sections.forEach((section, index) => {
    const next = sections[index + 1];
    ScrollTrigger.create({ trigger: section, start: "top 180%", once: true, onEnter: () => load(section.dataset.scene) });
    ScrollTrigger.create({ trigger: section, start: "top 65%", end: "bottom 65%", onToggle: (self) => {
      if (!self.isActive) return;
      load(section.dataset.scene);
      if (next) load(next.dataset.scene);
      setScene(section.dataset.scene);
    } });
  });
}

function pauseOffscreenDecor() {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-offscreen", !entry.isIntersecting));
  }, { rootMargin: "120px 0px" });
  document.querySelectorAll(".hero__stage, .accent, .person__media, .opening__drop, .lantern, .stream, .farewell__stage, .vista, .gift__tag").forEach((element) => observer.observe(element));
}
