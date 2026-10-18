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
  gsap.killTweensOf(["#openInvitation", ".place"]);
  gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: finishOpening })
    .to("#openInvitation", { scale: .9, opacity: 0, duration: .4, ease: "power2.in" }, 0)
    .to(".place", { scale: .94, duration: .5, ease: "power2.in" }, 0)
    .set(".gate__door", { visibility: "visible" }, .15)
    .fromTo(".gate__door--l", { xPercent: -101 }, { xPercent: 0, duration: .95, ease: "power3.inOut" }, .15)
    .fromTo(".gate__door--r", { xPercent: 101 }, { xPercent: 0, duration: .95, ease: "power3.inOut" }, .15)
    .to([".cover__content", ".cover__corner"], { opacity: 0, duration: .5, ease: "power1.in" }, .6)
    .fromTo(".gate__mono", { scale: .4, opacity: 0, rotationY: -180 }, { scale: 1, opacity: 1, rotationY: 0, transformPerspective: 600, duration: .8, ease: "back.out(1.6)" }, 1)
    .set(".cover__bg", { opacity: 0 }, 1.6)
    .set(cover, { background: "transparent" }, 1.6)
    .to(".gate__mono", { scale: .4, opacity: 0, duration: .45, ease: "power2.in" }, 2.05)
    .add(() => {
      document.body.classList.add("is-open");
      playHeroIntro();
    }, 2.2)
    .to(".gate__door--l", { rotationY: 104, duration: 1.5, ease: "power2.inOut" }, 2.2)
    .to(".gate__door--r", { rotationY: -104, duration: 1.5, ease: "power2.inOut" }, 2.2)
    .to(".gate__door", { opacity: 0, duration: .5, ease: "power1.in" }, 3.1)
    .set(cover, { pointerEvents: "none" }, 2.3);
}

function setupMenu() {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menuToggle");
  const links = menu.querySelectorAll("a");
  const isOpen = () => menu.classList.contains("is-open");
  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? I18N.menuClose : I18N.menuOpen);
    toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
    links.forEach((link, index) => { link.style.transitionDelay = open ? `${.3 + index * .06}s` : "0s"; });
    open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener("click", () => setOpen(!isOpen()));
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
