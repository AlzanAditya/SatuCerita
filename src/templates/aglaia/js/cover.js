const COVER_TWEEN_TARGETS = ".bed__bloom, .cover__frame, .cover__photo, .cover__photo img, .cover__ring, .cover__posy, .cover__word, .cover__names .amp, .cover__kicker, .cover__date, .cover__hint, #envelope, .cover__seal, .seal__img, [data-envelope-flap], [data-envelope-card]";

let coverIntro = null;

function playCoverIntro() {
  if (prefersReducedMotion) return;
  const words = document.querySelectorAll(".cover__word");
  const coverPhoto = document.querySelector(".cover__photo img");
  coverIntro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .fromTo(".bed__bloom", { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 2.2, ease: "power3.out" }, .15)
    .from(".cover__photo, .cover__monogram", { opacity: 0, scale: .94, duration: 1.8 }, .15)
    .from(".cover__ring", { opacity: 0, scale: .96, duration: 1.8, transformOrigin: "50% 50%" }, .15)
    .from(".cover__posy--cradle", { yPercent: 18, opacity: 0, duration: 1.8, ease: "power3.out" }, .15)
    .fromTo(words, { clipPath: "inset(100% -20% -30% -20%)", y: 18 }, { clipPath: "inset(-30% -20% -30% -20%)", y: 0, duration: 1.6, stagger: .22, ease: "power3.out", clearProps: "clipPath" }, 1.2)
    .from(".cover__names .amp", { opacity: 0, scale: .4, duration: 1.2, ease: "back.out(1.6)" }, 1.45)
    .add(spacedIn(".cover__kicker, .cover__date", { scaleX: 1.32, duration: 1.9 }), 1.3)
    .from("#envelope", { y: 80, opacity: 0, duration: 1.7 }, 1.5)
    .fromTo(".cover__seal", { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: .55, ease: "power3.in" }, 2.3)
    .add(spacedIn(".cover__hint", { duration: 1.7 }), 2.5);
  if (coverPhoto) coverIntro.from(coverPhoto, { yPercent: 6, duration: 2.8, ease: "power2.out" }, .3);
}

function startCoverIntro() {
  if (!coverIntro) return;
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const photo = document.querySelector(".cover__photo img");
  const decoded = photo && photo.decode ? photo.decode().catch(() => {}) : Promise.resolve();
  Promise.race([Promise.all([fonts, decoded]), new Promise((resolve) => setTimeout(resolve, 1800))]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => { if (coverIntro && !opened) coverIntro.play(); }));
  });
}
