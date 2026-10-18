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
  const show = (index, direction = 0) => {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = fullSource(photo);
    image.alt = photo.alt;
    counter.textContent = `${current + 1} / ${photos.length}`;
    thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle("is-active", thumbIndex === current));
    thumbs[current].scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion ? "auto" : "smooth" });
    if (prefersReducedMotion) return;
    const from = direction > 0 ? "inset(0% 0% 0% 100%)" : direction < 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 50% 0% 50%)";
    gsap.fromTo(image, { clipPath: from, scale: 1.04 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: .9, ease: "power3.out", clearProps: "clipPath,transform" });
  };
  const thumbs = photos.map((photo, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "lightbox__thumb";
    thumb.setAttribute("aria-label", `${I18N.viewPhoto} ${index + 1}`);
    const thumbImage = document.createElement("img");
    thumbImage.alt = "";
    thumbImage.loading = "lazy";
    thumbImage.decoding = "async";
    thumbImage.dataset.src = photo.getAttribute("src");
    thumb.appendChild(thumbImage);
    thumb.addEventListener("click", () => show(index, index > current ? 1 : -1));
    thumbsContainer.appendChild(thumb);
    return thumb;
  });
  const open = (index) => {
    thumbs.forEach((thumb) => {
      const thumbImage = thumb.querySelector("img");
      if (thumbImage && !thumbImage.getAttribute("src")) thumbImage.src = thumbImage.dataset.src;
    });
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

function setupReel(openLightbox) {
  const pin = document.getElementById("galleryPin");
  const reel = document.getElementById("reel");
  const track = document.getElementById("reelTrack");
  if (!pin || !reel || !track) return;
  const items = [...track.querySelectorAll(".reel__item")];
  const fill = document.getElementById("reelFill");
  const boat = document.getElementById("reelBoat");
  const count = document.getElementById("reelCount");
  const total = items.length;
  const pad = (value) => String(value).padStart(2, "0");
  const update = (progress) => {
    if (fill) fill.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (boat) boat.style.transform = `translateX(${((boat.parentElement.clientWidth - boat.offsetWidth) * progress).toFixed(1)}px)`;
    if (count && total) count.textContent = `${pad(Math.min(total, Math.round(progress * (total - 1)) + 1))} / ${pad(total)}`;
  };
  const rope = document.getElementById("reelRope");
  const drawRope = () => {
    if (!rope || !items.length) return;
    const width = track.scrollWidth;
    const clipY = Math.max(12, items[0].offsetTop - 12);
    const sag = 16;
    rope.setAttribute("viewBox", `0 0 ${width} 70`);
    rope.style.width = `${width}px`;
    let previous = 0;
    let path = `M0 ${clipY - 10}`;
    items.forEach((item) => {
      const x = item.offsetLeft + item.offsetWidth / 2;
      path += ` Q${((previous + x) / 2).toFixed(1)} ${clipY + sag} ${x.toFixed(1)} ${clipY}`;
      previous = x;
    });
    path += ` Q${((previous + width) / 2).toFixed(1)} ${clipY + sag} ${width} ${clipY - 10}`;
    rope.querySelectorAll("path").forEach((line) => line.setAttribute("d", path));
  };
  drawRope();
  ScrollTrigger.addEventListener("refresh", drawRope);
  items.forEach((item, index) => item.addEventListener("click", () => openLightbox(index)));
  pin.addEventListener("scroll", () => { if (pin.scrollLeft) pin.scrollLeft = 0; });
  update(0);
  if (prefersReducedMotion || total < 2) {
    pin.classList.add("is-static");
    reel.addEventListener("scroll", () => {
      const max = reel.scrollWidth - reel.clientWidth;
      update(max > 0 ? reel.scrollLeft / max : 0);
    }, { passive: true });
    return;
  }
  const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
  const reelTween = gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => `+=${Math.max(1, distance())}`,
      pin: true,
      scrub: .8,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: (self) => update(self.progress)
    }
  });
  gsap.from(items, { y: 70, opacity: 0, duration: 1.4, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: reel, start: "top 88%", once: true } });
  if (rope) gsap.from(rope, { opacity: 0, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: reel, start: "top 88%", once: true } });
}
