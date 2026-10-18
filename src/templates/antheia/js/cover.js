function setupMonogram() {
  const names = [...document.querySelectorAll("[data-cover-name]")].map((name) => name.textContent.trim());
  document.querySelectorAll("[data-mono]").forEach((slot, index) => {
    const initial = (names[index] || "").charAt(0);
    if (initial) slot.textContent = initial.toUpperCase();
  });
}

function playCoverIntro() {
  if (prefersReducedMotion) return;
  const chars = [...document.querySelectorAll("[data-cover-name]")].flatMap((name) => splitChars(name));
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
    .fromTo(".cover__bg", { clipPath: "circle(0% at 50% 52%)" }, { clipPath: "circle(85% at 50% 52%)", duration: 2.2, ease: "power2.inOut", clearProps: "clipPath" }, 0)
    .from(".cover__corner img", { xPercent: (index) => (index ? 70 : -70), opacity: 0, duration: 1.6, stagger: .1 }, .6)
    .from(chars, { yPercent: 70, rotationX: -85, opacity: 0, transformOrigin: "50% 100%", duration: 1, stagger: .055 }, 1.25)
    .from(".cover__names .amp", { scale: 0, rotation: -120, opacity: 0, duration: .9, ease: "back.out(2)" }, 1.55)
    .from(".place", { scale: .7, rotation: -5, opacity: 0, duration: 1.2, ease: "back.out(1.5)" }, 1.75)
    .from("#openInvitation", { y: 20, opacity: 0, duration: .8 }, 2.3);
  if (present(".cover__bg img")) timeline.from(".cover__bg img", { scale: 1.22, duration: 2.8, ease: "power2.out" }, 0);
  if (present("[data-cover-arch]")) {
    timeline
      .fromTo("[data-cover-arch]", { clipPath: "inset(100% -12% 0% -12%)" }, { clipPath: "inset(-12% -12% -12% -12%)", duration: 1.5, ease: "power3.inOut", clearProps: "clipPath" }, .75)
      .from(".cover__photo img", { scale: 1.25, duration: 2.3 }, .75);
  }
  if (present("[data-cover]")) timeline.from("[data-cover]", { y: 14, opacity: 0, duration: .9, stagger: .12 }, 1.5);
}
