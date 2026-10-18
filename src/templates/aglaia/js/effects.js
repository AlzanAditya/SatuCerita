function pauseOffscreenLoops() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".hero, .content > section, .lane, .footer").forEach((element) => {
    element.classList.add("is-idle");
    ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        element.classList.toggle("is-idle", !self.isActive);
        if (element.classList.contains("hero") && vesselDrift) self.isActive ? vesselDrift.resume() : vesselDrift.pause();
      }
    });
  });
}

function watchContentHeight() {
  const content = document.querySelector(".content");
  if (!content || !("ResizeObserver" in window)) return;
  let lastHeight = 0;
  let timer = 0;
  ScrollTrigger.addEventListener("refresh", () => { lastHeight = content.offsetHeight; });
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Math.abs(content.offsetHeight - lastHeight) > 2) ScrollTrigger.refresh();
    }, 220);
  }).observe(content);
}

function buildSceneBackdrop() {
  const images = [...document.querySelectorAll("#backdrop .scene")];
  if (!images.length) return;
  const load = (name) => images.forEach((scene) => {
    const image = scene.querySelector("img");
    if (scene.dataset.scene === name && image && !image.getAttribute("src") && image.dataset.src) image.src = image.dataset.src;
  });
  let active = null;
  let timer = 0;
  const setScene = (name) => {
    load(name);
    const next = images.find((image) => image.dataset.scene === name);
    if (!next || next === active) return;
    images.forEach((image) => { if (image !== active) image.classList.remove("is-prev"); });
    const previous = active;
    if (previous) {
      previous.classList.remove("is-active");
      previous.classList.add("is-prev");
    }
    next.classList.remove("is-prev");
    next.classList.add("is-active");
    active = next;
    clearTimeout(timer);
    timer = setTimeout(() => { if (previous && previous !== active) previous.classList.remove("is-prev"); }, 2100);
  };
  const sections = [...document.querySelectorAll("section[data-scene]")];
  if (sections[0]) setScene(sections[0].dataset.scene);
  sections.forEach((section, index) => {
    const next = sections[index + 1];
    ScrollTrigger.create({ trigger: section, start: "top 180%", once: true, onEnter: () => load(section.dataset.scene) });
    ScrollTrigger.create({ trigger: section, start: "top 62%", end: "bottom 62%", onToggle: (self) => {
      if (!self.isActive) return;
      setScene(section.dataset.scene);
      if (next) load(next.dataset.scene);
    } });
  });
}
