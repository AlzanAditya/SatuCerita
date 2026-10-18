const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHero = Boolean(document.querySelector(".hero"));
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

function readGuestName() {
  if (INVITATION.guestName) return String(INVITATION.guestName).trim().slice(0, 60);
  const guest = new URLSearchParams(location.search).get("to");
  return guest ? guest.trim().slice(0, 60) : "";
}

function applyGuestName() {
  const guest = readGuestName();
  if (guest) document.getElementById("guestName").textContent = guest;
}

function splitChars(element) {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.textContent = "";
  const chars = [];
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) { element.appendChild(document.createTextNode(" ")); return; }
    const word = document.createElement("span");
    word.setAttribute("aria-hidden", "true");
    word.style.cssText = "display:inline-block;white-space:nowrap";
    [...part].forEach((character) => {
      const char = document.createElement("span");
      char.className = "ch";
      char.textContent = character;
      word.appendChild(char);
      chars.push(char);
    });
    element.appendChild(word);
  });
  return chars;
}

function splitWords(element, maskClass, innerClass) {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.textContent = "";
  return text.split(/\s+/).filter(Boolean).map((part, index) => {
    if (index) element.appendChild(document.createTextNode(" "));
    const outer = document.createElement("span");
    outer.className = maskClass;
    outer.setAttribute("aria-hidden", "true");
    if (!innerClass) {
      outer.textContent = part;
      element.appendChild(outer);
      return outer;
    }
    const inner = document.createElement("span");
    inner.className = innerClass;
    inner.textContent = part;
    outer.appendChild(inner);
    element.appendChild(outer);
    return inner;
  });
}

function onceInView(element, callback, start = "top 86%") {
  ScrollTrigger.create({ trigger: element, start, once: true, onEnter: callback });
}

function present(target) {
  if (!target) return false;
  if (typeof target === "string") return Boolean(document.querySelector(target));
  return target.length === undefined || target.length > 0;
}

function ownChildren(element) {
  return [...element.children].filter((child) => !child.matches("[data-reveal], [data-words]") && !child.querySelector("[data-reveal], [data-words]"));
}
