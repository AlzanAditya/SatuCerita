const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHero = Boolean(document.querySelector(".hero"));
const BLUR_CLEAR = "blur(0px)";

function readGuestName() {
  if (INVITATION.guestName) return String(INVITATION.guestName).trim().slice(0, 60);
  const guest = new URLSearchParams(location.search).get("to");
  return guest ? guest.trim().slice(0, 60) : "";
}

function applyGuestName() {
  const guest = readGuestName();
  const slot = document.getElementById("guestName");
  if (guest && slot) slot.textContent = guest;
}

function splitWords(element) {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.textContent = "";
  return text.split(/\s+/).filter(Boolean).map((part, index) => {
    if (index) element.appendChild(document.createTextNode(" "));
    const word = document.createElement("span");
    word.className = "vw";
    word.setAttribute("aria-hidden", "true");
    word.textContent = part;
    element.appendChild(word);
    return word;
  });
}

function present(target) {
  if (!target) return false;
  if (typeof target === "string") return Boolean(document.querySelector(target));
  return target.length === undefined || target.length > 0;
}

function onceInView(element, callback, start = "top 86%") {
  ScrollTrigger.create({ trigger: element, start, once: true, onEnter: callback });
}

function inkIn(targets, vars = {}) {
  return gsap.fromTo(targets, { opacity: 0, y: vars.y ?? 18, scale: vars.scale ?? 1.06, filter: `blur(${vars.blur ?? 12}px)` }, { opacity: 1, y: 0, scale: 1, filter: BLUR_CLEAR, duration: vars.duration ?? 1.5, ease: "power3.out", stagger: vars.stagger ?? 0, clearProps: "filter,transform" });
}

function irisReveal(element, duration = 1.7, ease = "expo.out") {
  const target = getComputedStyle(element).clipPath;
  if (!target || target === "none") return gsap.timeline();
  const points = target.startsWith("polygon") ? target.slice(8, -1).split(",").length : 0;
  const start = points ? `polygon(${Array(points).fill("50% 50%").join(", ")})` : "inset(50% 50% 50% 50%)";
  return gsap.fromTo(element, { clipPath: start }, { clipPath: target, duration, ease, clearProps: "clipPath" });
}

function curtainReveal(element, duration = 1.8) {
  const match = /^inset\(([^)]*)\)$/.exec(getComputedStyle(element).clipPath || "");
  const values = match ? match[1].trim().split(/\s+/) : [];
  if (!values.length || values.length > 4 || values.some((value) => !value.endsWith("%"))) return irisReveal(element, duration);
  const [top, right = top, bottom = top, left = right] = values.map(parseFloat);
  const inset = (t, r, b, l) => `inset(${t}% ${r}% ${b}% ${l}%)`;
  return gsap.fromTo(element, { clipPath: inset(top, right, 100 - top, left) }, { clipPath: inset(top, right, bottom, left), duration, ease: "power2.inOut", clearProps: "clipPath" });
}

function settleCard(element, options = {}) {
  const tilt = options.tilt ?? 0;
  const timeline = gsap.timeline()
    .fromTo(element, { y: options.y ?? 56, rotation: tilt, scale: .965, opacity: 0 }, { y: 0, rotation: 0, scale: 1, opacity: 1, duration: options.duration ?? 1.3, ease: "expo.out", clearProps: "transform,opacity" }, 0);
  const cascade = options.cascade ? [...options.cascade] : [];
  if (cascade.length) timeline.fromTo(cascade, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: "power3.out", stagger: .07, clearProps: "transform,opacity" }, .3);
  return timeline;
}

function scrambleNumber(element, target, duration) {
  const width = Math.max(String(target).length, element.textContent.trim().length);
  const state = { progress: 0 };
  return gsap.to(state, {
    progress: 1,
    duration,
    ease: "power1.out",
    onUpdate: () => {
      element.textContent = state.progress < 1 ? String(1 + Math.floor(Math.random() * 31)).padStart(width, "0") : String(target).padStart(width, "0");
    },
    onComplete: () => { element.textContent = String(target).padStart(width, "0"); }
  });
}
