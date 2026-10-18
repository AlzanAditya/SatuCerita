function finishOpening() {
  const cover = document.getElementById("cover");
  if (cover) cover.remove();
  document.documentElement.classList.remove("is-locked");
  document.body.classList.remove("is-locked");
  resetScrollToTop();
  lenis.scrollTo(0, { immediate: true, force: true });
  lenis.start();
  ScrollTrigger.refresh();
}

function openInvitation() {
  const button = document.getElementById("openInvitation");
  if (button.disabled) return;
  button.disabled = true;
  resetScrollToTop();
  lenis.scrollTo(0, { immediate: true, force: true });
  if (prefersReducedMotion) {
    document.body.classList.add("is-open");
    finishOpening();
    return;
  }
  const cover = document.getElementById("cover");
  gsap.killTweensOf(["#openInvitation", "#guestCard"]);
  gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: finishOpening })
    .to("#openInvitation", { y: 10, opacity: 0, duration: .4, ease: "power2.in" }, 0)
    .to(".cover__content", { scale: .95, opacity: 0, filter: "blur(4px)", duration: .7, ease: "power2.in" }, .05)
    .set(".env", { visibility: "visible" }, .15)
    .fromTo(".env__backdrop", { opacity: 0 }, { opacity: 1, duration: .75, ease: "power1.out" }, .15)
    .fromTo(".env__stage", { yPercent: 80, rotation: -8, scale: .84, opacity: 0 }, { yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" }, .3)
    .set([".cover__bg", ".cover__corner"], { opacity: 0 }, .95)
    .set(cover, { background: "transparent" }, .95)
    
    .to(".env__seal", { keyframes: { scale: [1, .92, 1.08, 1] }, duration: .5, ease: "power1.inOut" }, 1.2)
    .fromTo(".env__ring", { scale: .7, opacity: .95 }, { scale: 2.6, opacity: 0, duration: 1, ease: "power2.out" }, 1.45)
    .fromTo(".env__sheen", { opacity: 1, backgroundPosition: "150% 0" }, { backgroundPosition: "-50% 0", duration: 1, ease: "power1.inOut" }, 1.4)
    .set(".env__sheen", { opacity: 0 }, 2.45)
    .to(".env__seal", { y: -12, scale: 1.12, rotation: -6, duration: .3, ease: "power2.out" }, 1.6)
    .to(".env__seal", { y: -70, scale: .7, rotation: 8, opacity: 0, filter: "blur(2px)", duration: .45, ease: "power2.in" }, 1.9)
    .to(".env__fold", { opacity: 0, duration: .3 }, 1.95)
    .fromTo(".env__flap", { rotationX: 0, transformPerspective: 1000 }, { rotationX: 180, duration: .95, ease: "power2.inOut" }, 1.95)
    .set(".env__flap", { zIndex: 1 }, 2.42)
    .set(".env__face--front", { opacity: 0 }, 2.42)
    .set(".env__face--back", { opacity: 1 }, 2.42)
    .to(".env__letter", { yPercent: -52, duration: 1, ease: "power3.out" }, 2.5)
    .to([".env__shadow", ".env__inner", ".env__rim", ".env__pocket", ".env__flap"], { y: 460, opacity: 0, duration: .85, ease: "power3.in" }, 3.25)
    .to(".env__letter", { scale: 2.6, opacity: 0, filter: "blur(5px)", duration: 1.05, ease: "power2.in" }, 3.4)
    .to(".env__backdrop", { opacity: 0, duration: 1, ease: "power1.inOut" }, 3.45)
    .add(() => {
      document.body.classList.add("is-open");
      playHeroIntro();
    }, 3.4)
    .set(cover, { pointerEvents: "none" }, 3.5);
}

function setupMenu() {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menuToggle");
  if (!menu || !toggle) return;
  const links = menu.querySelectorAll("a");
  const isOpen = () => menu.classList.contains("is-open");
  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? I18N.menuClose : I18N.menuOpen);
    toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
    links.forEach((link, index) => { link.style.transitionDelay = open ? `${.18 + index * .05}s` : "0s"; });
    open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener("click", () => setOpen(!isOpen()));
  const panel = menu.querySelector(".menu__panel");
  menu.addEventListener("touchmove", (event) => { if (panel.scrollHeight <= panel.clientHeight + 1) event.preventDefault(); }, { passive: false });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && isOpen()) setOpen(false); });
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(false);
      lenis.scrollTo(link.getAttribute("href"), { duration: 1.8, offset: -10 });
    });
  });
}

function setupGuestQR() {
  const dialog = document.getElementById("guestQrDialog");
  const open = document.getElementById("guestQrOpen");
  const close = document.getElementById("guestQrClose");
  if (!dialog || !open || !close) return;
  let resumeLenis = true;
  open.addEventListener("click", () => {
    resumeLenis = !document.documentElement.classList.contains("is-locked");
    dialog.showModal();
    lenis.stop();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { if (resumeLenis) lenis.start(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}
