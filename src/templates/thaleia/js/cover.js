function setupMonogram() {
  const names = [...document.querySelectorAll("[data-cover-name]")].map((name) => name.textContent.trim());
  document.querySelectorAll("[data-mono]").forEach((slot, index) => {
    const initial = (names[index % 2] || "").charAt(0);
    if (initial) slot.textContent = initial.toUpperCase();
  });
}

function playCoverIntro() {
  if (prefersReducedMotion || !document.getElementById("cover")) return;
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (present(".cover__bg img")) timeline.fromTo(".cover__bg img", { scale: 1.2, opacity: 0, filter: "blur(14px)" }, { scale: 1, opacity: .5, filter: BLUR_CLEAR, duration: 2.6, ease: "power2.out", clearProps: "filter,transform,opacity" }, 0);
  timeline
    .from(".cover__corner--l", { xPercent: -40, yPercent: 30, rotation: -12, opacity: 0, duration: 1.9 }, .35)
    .from(".cover__corner--r", { xPercent: 40, yPercent: 30, rotation: 12, opacity: 0, duration: 1.9 }, .45);
  const photo = document.querySelector(".cover__photo");
  if (photo) {
    timeline
      .from("[data-cover-frame]", { scale: .82, rotation: -7, opacity: 0, duration: 1.6 }, .7)
      .add(irisReveal(photo, 1.8), .85)
      .from(".cover__photo img", { scale: 1.3, duration: 2.4 }, .85);
  }
  timeline
    .add(inkIn("[data-cover-name]", { stagger: .3, y: -14 }), 1.25)
    .from(".cover__names .amp", { scale: 2.4, opacity: 0, duration: 1.1 }, 1.6);
  if (present("[data-cover]")) timeline.from("[data-cover]", { opacity: 0, letterSpacing: "0.9em", duration: 1.6, stagger: .15, clearProps: "letterSpacing,opacity" }, 1.35);
  timeline
    .fromTo("#guestCard", { opacity: 0, y: 26, scale: .9, filter: "blur(10px)" }, { opacity: 1, y: 0, scale: 1, filter: BLUR_CLEAR, duration: 1.7, ease: "expo.out", clearProps: "filter,transform,opacity" }, 1.7)
    .fromTo("#guestCard .cover__to, #guestCard .cover__guest", { opacity: 0, y: 10, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: BLUR_CLEAR, duration: 1.1, stagger: .16, ease: "power3.out", clearProps: "transform,opacity,filter" }, 2.05)
    .from("#openInvitation", { y: 18, opacity: 0, duration: .9 }, 2.55);
  return timeline;
}
