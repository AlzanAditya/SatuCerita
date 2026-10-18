// Video latar lokal (opsional): beri atribut data-video="url.mp4" (+ data-start / data-end dalam detik)
// pada sebuah elemen, dan video akan diputar hanya saat elemen terlihat di layar.
function createMediaController(slot) {
  const url = slot.dataset.video || "";
  const start = Math.max(0, Number(slot.dataset.start) || 0);
  const end = Math.max(0, Number(slot.dataset.end) || 0);
  let wants = false;
  const video = document.createElement("video");
  video.className = "media-video";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = !(end > start);
  video.preload = "none";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-hidden", "true");
  slot.appendChild(video);
  let loaded = false;
  video.addEventListener("playing", () => video.classList.add("is-loaded"));
  video.addEventListener("timeupdate", () => { if (end > start && video.currentTime >= end) video.currentTime = start; });
  video.addEventListener("ended", () => { if (wants) { video.currentTime = start; video.play().catch(() => {}); } });
  const begin = () => {
    if (!wants) return;
    if (start > 0 && video.currentTime < start) video.currentTime = start;
    video.play().catch(() => {});
  };
  return {
    fit() {},
    play() {
      wants = true;
      if (!loaded) {
        loaded = true;
        video.src = url;
        video.addEventListener("loadedmetadata", begin, { once: true });
        video.load();
        return;
      }
      begin();
    },
    pause() {
      wants = false;
      video.pause();
    }
  };
}

function setupMediaSlots() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
  const slots = [...document.querySelectorAll("[data-video]")];
  if (!slots.length) return;
  const controllers = new Map(slots.map((slot) => [slot, createMediaController(slot)]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const controller = controllers.get(entry.target);
      if (!controller) return;
      if (entry.isIntersecting) controller.play();
      else controller.pause();
    });
  }, { rootMargin: "35% 0px" });
  slots.forEach((slot) => observer.observe(slot));
  window.addEventListener("resize", () => controllers.forEach((controller) => controller.fit()));
}

// Video latar pada bagian countdown: <video class="countdown__video" data-start data-end>.
function setupCountdownVideo() {
  const section = document.getElementById("save-date");
  const video = section && section.querySelector("video.countdown__video");
  if (!section || !video || prefersReducedMotion) return;
  const start = Math.max(0, Number(video.dataset.start) || 0);
  const end = Math.max(0, Number(video.dataset.end) || 0);
  let wantsPlay = false;

  const play = () => {
    wantsPlay = true;
    if (!video._rangeReady) {
      video._rangeReady = true;
      video.addEventListener("timeupdate", () => { if (wantsPlay && end > start && video.currentTime >= end) video.currentTime = start; });
      video.addEventListener("ended", () => {
        if (!wantsPlay) return;
        video.currentTime = start;
        video.play().catch(() => {});
      });
      video.addEventListener("playing", () => video.classList.add("is-loaded"));
    }
    const startPlayback = () => {
      if (!wantsPlay) return;
      if (start > 0 && video.currentTime < start) video.currentTime = start;
      video.play().catch(() => {});
    };
    if (video.readyState >= 1) startPlayback();
    else {
      video.addEventListener("loadedmetadata", startPlayback, { once: true });
      if (video.preload === "none") {
        video.preload = "auto";
        video.load();
      }
    }
  };

  const pause = () => {
    wantsPlay = false;
    video.pause();
    video.classList.remove("is-loaded");
  };

  ScrollTrigger.create({ trigger: section, start: "top 62%", end: "bottom 38%", onEnter: play, onEnterBack: play, onLeave: pause, onLeaveBack: pause });
}
