// Video latar lokal pada bagian countdown: <video class="countdown__video" data-start data-end>.
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
