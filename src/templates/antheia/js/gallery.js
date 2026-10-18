function setupFlow(openLightbox) {
  const stage = document.getElementById("flowStage");
  if (!stage) return;
  const cards = [...stage.querySelectorAll(".flow__card")];
  const count = document.getElementById("flowCount");
  const progress = document.getElementById("flowProgress");
  const total = cards.length;
  let current = 0;
  let busy = false;
  const pad = (value) => String(value).padStart(2, "0");
  const wrapOffset = (offset) => {
    let value = offset;
    while (value > total / 2) value -= total;
    while (value < -total / 2) value += total;
    return value;
  };
  const poseOf = (offset) => {
    const distance = Math.abs(offset);
    const lane = Math.max(-2.6, Math.min(2.6, offset));
    const turn = Math.max(-1, Math.min(1, offset));
    return { xPercent: lane * 56, rotationY: -turn * 40, z: -Math.min(distance, 3) * 120, opacity: distance > 2.5 ? 0 : 1, zIndex: Math.round(100 - distance * 10), "--dim": Math.min(distance * .25, .6) };
  };
  const updateMeta = (position) => {
    const index = ((Math.round(position) % total) + total) % total;
    if (count) count.textContent = `${pad(index + 1)} / ${pad(total)}`;
    if (progress) progress.style.setProperty("--p", ((index + 1) / total).toFixed(3));
  };
  const layout = (position, instant) => {
    cards.forEach((card, index) => {
      const offset = wrapOffset(index - position);
      card.setAttribute("aria-hidden", String(Math.round(offset) !== 0));
      card.tabIndex = Math.round(offset) === 0 ? 0 : -1;
      const pose = poseOf(offset);
      if (instant || prefersReducedMotion) gsap.set(card, pose);
      else gsap.to(card, { ...pose, duration: .85, ease: "power3.out", overwrite: "auto" });
    });
    updateMeta(position);
  };
  const go = (index) => {
    current = ((index % total) + total) % total;
    layout(current);
  };
  document.getElementById("flowPrev").addEventListener("click", () => go(current - 1));
  document.getElementById("flowNext").addEventListener("click", () => go(current + 1));
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let moved = 0;
  stage.addEventListener("pointerdown", (event) => {
    if (busy) return;
    dragging = true;
    moved = 0;
    startX = event.clientX;
    startY = event.clientY;
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 8) return;
    moved = deltaX;
    layout(current - deltaX / 130, true);
  });
  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(moved) > 40) {
      const target = Math.round(current - moved / 130);
      go(target === current ? current - Math.sign(moved) : target);
      return;
    }
    layout(current);
    if (Math.abs(moved) < 6 && event.type === "pointerup") {
      const card = event.target.closest(".flow__card");
      const index = cards.indexOf(card);
      if (index === current) openLightbox(current);
      else if (index >= 0) go(index);
    }
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", (event) => { if (dragging) release(event); });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") go(current - 1);
    if (event.key === "ArrowRight") go(current + 1);
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(current); }
  });
  if (prefersReducedMotion) {
    layout(current, true);
    return;
  }
  gsap.set(cards, { xPercent: 190, rotationY: -65, z: -220, opacity: 0 });
  updateMeta(current);
  onceInView(stage, () => {
    busy = true;
    cards.forEach((card, index) => {
      const offset = wrapOffset(index - current);
      gsap.to(card, { ...poseOf(offset), duration: 1.5, ease: "power4.out", delay: (offset + total / 2) * .07 });
    });
    gsap.delayedCall(1.8, () => { busy = false; });
  });
}

function setupGallery() {
  const lightbox = document.getElementById("lightbox");
  const items = [...document.querySelectorAll("[data-frame]")];
  if (!lightbox || !items.length) return () => {};
  const photos = items.map((item) => item.querySelector("img"));
  const image = document.getElementById("lightboxImage");
  const counter = document.getElementById("lightboxCounter");
  const thumbsContainer = document.getElementById("lightboxThumbs");
  const stage = document.getElementById("lightboxStage");
  const fullSource = (photo) => photo.dataset.full || photo.getAttribute("src");
  let current = 0;
  const thumbs = photos.map((photo, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "lightbox__thumb";
    thumb.setAttribute("aria-label", `${I18N.viewPhoto} ${index + 1}`);
    const thumbImage = document.createElement("img");
    thumbImage.src = photo.getAttribute("src");
    thumbImage.alt = "";
    thumbImage.loading = "lazy";
    thumb.appendChild(thumbImage);
    thumb.addEventListener("click", () => show(index, index > current ? 1 : -1));
    thumbsContainer.appendChild(thumb);
    return thumb;
  });
  const show = (index, direction = 0) => {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = fullSource(photo);
    image.alt = photo.alt;
    counter.textContent = `${current + 1} / ${photos.length}`;
    thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle("is-active", thumbIndex === current));
    thumbs[current].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (!prefersReducedMotion) gsap.fromTo(image, { xPercent: direction * 22, scale: direction ? .97 : .9, opacity: 0 }, { xPercent: 0, scale: 1, opacity: 1, duration: .75, ease: "power3.out", clearProps: "transform" });
  };
  const open = (index) => {
    lightbox.showModal();
    lenis.stop();
    show(index);
  };
  document.getElementById("lightboxPrev").addEventListener("click", () => show(current - 1, -1));
  document.getElementById("lightboxNext").addEventListener("click", () => show(current + 1, 1));
  document.getElementById("lightboxClose").addEventListener("click", () => lightbox.close());
  stage.addEventListener("click", (event) => { if (event.target === stage) lightbox.close(); });
  lightbox.addEventListener("close", () => lenis.start());
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1, -1);
    if (event.key === "ArrowRight") show(current + 1, 1);
  });
  let touchStartX = 0;
  let touchStartY = 0;
  stage.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) deltaX < 0 ? show(current + 1, 1) : show(current - 1, -1);
  });
  return open;
}
