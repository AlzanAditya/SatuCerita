function setupMenu() {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menuToggle");
  const scrim = document.getElementById("menuScrim");
  if (!menu || !toggle) return;
  const links = menu.querySelectorAll("a");
  const isOpen = () => menu.classList.contains("is-open");
  let menuTimer = 0;
  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? I18N.menuClose : I18N.menuOpen);
    toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
    links.forEach((link, index) => { link.style.transitionDelay = open ? `${.28 + index * .045}s` : "0s"; });
    open ? lenis.stop() : lenis.start();
    const main = document.querySelector("main");
    clearTimeout(menuTimer);
    menuTimer = setTimeout(() => {
      if (main) main.inert = isOpen();
      if (isOpen() && links[0]) links[0].focus({ preventScroll: true });
    }, open ? 780 : 0);
  };
  toggle.addEventListener("click", () => {
    const willOpen = !isOpen();
    setOpen(willOpen);
    if (!willOpen) toggle.focus({ preventScroll: true });
  });
  if (scrim) scrim.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus({ preventScroll: true });
      return;
    }
    if (event.key !== "Tab") return;
    const stops = [toggle, ...links];
    const position = stops.indexOf(document.activeElement);
    event.preventDefault();
    const next = (position + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
    stops[next].focus({ preventScroll: true });
  });
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(false);
      lenis.scrollTo(link.getAttribute("href"), { duration: 1.8, offset: -10, immediate: prefersReducedMotion });
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
