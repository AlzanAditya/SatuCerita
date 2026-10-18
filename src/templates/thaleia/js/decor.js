const FLORET_TONES = ["#fbf9f3", "#f4efe0", "#ffffff", "#eef2e8"];

function buildFlorets() {
  const layer = document.getElementById("florets");
  if (!layer || prefersReducedMotion) return;
  for (let index = 0; index < 12; index++) {
    const floret = document.createElement("span");
    floret.className = "floret";
    floret.style.setProperty("--size", `${10 + (index % 4) * 3}px`);
    const tone = FLORET_TONES[index % FLORET_TONES.length];
    const petals = [0, 72, 144, 216, 288].map((angle) => `<ellipse cx="12" cy="6" rx="2.6" ry="5.4" transform="rotate(${angle} 12 12)"/>`).join("");
    floret.innerHTML = `<svg viewBox="0 0 24 24"><g fill="${tone}" stroke="rgba(143,161,130,.55)" stroke-width=".4">${petals}</g><circle cx="12" cy="12" r="1.7" fill="#d9cf9a"/></svg>`;
    layer.appendChild(floret);
    const svg = floret.querySelector("svg");
    gsap.to(svg, { rotationY: 180, duration: 1.6 + Math.random() * 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    const fall = () => {
      const width = layer.clientWidth;
      const height = layer.clientHeight;
      const startX = Math.random() * width;
      const sway = 30 + Math.random() * 50;
      const duration = 14 + Math.random() * 9;
      gsap.set(floret, { x: startX, y: -30, rotation: Math.random() * 360, scale: .8 + Math.random() * .45, opacity: 0 });
      gsap.timeline({ onComplete: fall })
        .to(floret, { opacity: .9, duration: 1.6 }, 0)
        .to(floret, { y: height + 30, duration, ease: "none" }, 0)
        .to(floret, { x: `+=${sway}`, duration: duration / 4, ease: "sine.inOut", repeat: 3, yoyo: true }, 0)
        .to(floret, { rotation: `+=${160 + Math.random() * 200}`, duration, ease: "none" }, 0)
        .to(floret, { opacity: 0, duration: 1.6 }, duration - 1.6);
    };
    gsap.delayedCall(index * 1.4, fall);
  }
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
  document.querySelectorAll(".hero__stage, .edge, .person__media, .opening__tassel, .watch, .tickets, .line, .stream, .quote, .envelope, .gift__parcel, .farewell__stage, .vista").forEach((element) => observer.observe(element));
}
