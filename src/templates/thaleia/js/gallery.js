function setupDeck(openLightbox) {
  const stage = document.getElementById("deckStage");
  if (!stage) return;
  const cards = [...stage.querySelectorAll(".deck__card")];
  const counter = document.getElementById("deckCount");
  const total = cards.length;
  const tilts = [0, -5, 4, -8, 7, -3];
  let order = cards.map((card, index) => index);
  let busy = false;
  const poseOf = (depth) => ({ x: 0, xPercent: 0, y: depth * 7, rotation: tilts[depth % tilts.length], scale: 1 - Math.min(depth, 5) * .035, zIndex: 50 - depth, opacity: depth > 4 ? 0 : 1 });
  const updateMeta = () => {
    if (counter) counter.innerHTML = `<b>${order[0] + 1}</b> / ${total}`;
    cards.forEach((card, index) => {
      const isTop = index === order[0];
      card.tabIndex = isTop ? 0 : -1;
      card.setAttribute("aria-hidden", String(!isTop));
    });
  };
  const layout = (instant, skip) => {
    order.forEach((cardIndex, depth) => {
      if (cardIndex === skip) return;
      const pose = poseOf(depth);
      if (instant || prefersReducedMotion) gsap.set(cards[cardIndex], pose);
      else gsap.to(cards[cardIndex], { ...pose, duration: .7, ease: "power3.out", overwrite: "auto" });
    });
    updateMeta();
  };
  const sendBack = (direction) => {
    if (busy || total < 2) return;
    busy = true;
    const top = order.shift();
    order.push(top);
    const card = cards[top];
    layout(false, top);
    if (prefersReducedMotion) {
      gsap.set(card, poseOf(total - 1));
      busy = false;
      return;
    }
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to(card, { x: 0, xPercent: direction * 125, rotation: direction * 18, duration: .42, ease: "power2.in" })
      .set(card, { zIndex: 1 })
      .to(card, { ...poseOf(total - 1), duration: .6, ease: "power3.out" });
  };
  const bringFront = () => {
    if (busy || total < 2) return;
    busy = true;
    const last = order.pop();
    order.unshift(last);
    const card = cards[last];
    layout(false, last);
    if (prefersReducedMotion) {
      gsap.set(card, poseOf(0));
      busy = false;
      return;
    }
    gsap.timeline({ onComplete: () => { busy = false; } })
      .set(card, { zIndex: 60, opacity: 1 })
      .fromTo(card, { xPercent: -125, rotation: -18 }, { ...poseOf(0), duration: .7, ease: "power3.out" });
  };
  document.getElementById("deckNext").addEventListener("click", () => sendBack(1));
  document.getElementById("deckPrev").addEventListener("click", () => bringFront());
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let moved = 0;
  stage.addEventListener("pointerdown", (event) => {
    if (busy || event.target.closest(".deck__card") !== cards[order[0]]) return;
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
    gsap.set(cards[order[0]], { x: deltaX, rotation: deltaX * .06 });
  });
  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    const card = cards[order[0]];
    if (Math.abs(moved) > 70) {
      sendBack(Math.sign(moved));
      return;
    }
    gsap.to(card, { ...poseOf(0), duration: .5, ease: "back.out(2)" });
    if (Math.abs(moved) < 6 && event.type === "pointerup") openLightbox(order[0]);
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", (event) => { if (dragging) release(event); });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") bringFront();
    if (event.key === "ArrowRight") sendBack(1);
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(order[0]); }
  });
  layout(true);
  if (prefersReducedMotion) return;
  gsap.set(stage, { opacity: 0 });
  const waitForImages = (list) => Promise.race([
    Promise.all(list.map((image) => (image.complete && image.naturalWidth ? Promise.resolve() : image.decode().catch(() => {})))),
    new Promise((resolve) => setTimeout(resolve, 1600))
  ]);
  const deal = () => {
    busy = true;
    const visible = order.slice(0, 5);
    visible.forEach((cardIndex, depth) => gsap.set(cards[cardIndex], { ...poseOf(0), zIndex: 50 - depth, opacity: 1 }));
    const timeline = gsap.timeline({ onComplete: () => { busy = false; } })
      .fromTo(stage, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity" }, 0)
      .fromTo(cards[order[0]].querySelector("img"), { scale: 1.14 }, { scale: 1, duration: 1.8, ease: "power2.out", clearProps: "transform" }, 0);
    visible.slice(1).forEach((cardIndex, step) => {
      timeline.to(cards[cardIndex], { ...poseOf(step + 1), duration: 1, ease: "back.out(1.5)" }, .5 + step * .09);
    });
  };
  stage.querySelectorAll(".deck__card img").forEach((image, index) => { if (index < 5) image.loading = "eager"; });
  onceInView(stage, () => {
    busy = true;
    waitForImages(order.slice(0, 5).map((index) => cards[index].querySelector("img"))).then(deal);
  }, "top 80%");
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
    if (!prefersReducedMotion) gsap.fromTo(image, { x: direction * 60, rotation: direction * 4, opacity: 0, filter: "blur(6px)" }, { x: 0, rotation: 0, opacity: 1, filter: BLUR_CLEAR, duration: .7, ease: "power3.out", clearProps: "transform,filter" });
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
