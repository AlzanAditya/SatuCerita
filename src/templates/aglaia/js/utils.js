const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHero = Boolean(document.querySelector(".hero"));

function readGuestName() {
  if (INVITATION.guestName) return String(INVITATION.guestName).trim().slice(0, 60);
  const guest = new URLSearchParams(location.search).get("to");
  return guest ? guest.trim().slice(0, 60) : "";
}

function applyGuestName() {
  const guest = readGuestName();
  const target = document.getElementById("guestName");
  if (guest && target) target.textContent = guest;
}

function splitWords(element) {
  if (element.dataset.split) return [...element.querySelectorAll(".split-word")];
  element.dataset.split = "true";
  const label = element.textContent.replace(/\s+/g, " ").trim();
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(" "));
            return;
          }
          const word = document.createElement("span");
          word.className = "split-word";
          word.textContent = part;
          fragment.appendChild(word);
          words.push(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("sr-only")) {
        walk(child);
      }
    });
  };
  walk(element);
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  visual.append(...element.childNodes);
  const reader = document.createElement("span");
  reader.className = "sr-only";
  reader.textContent = label;
  element.append(reader, visual);
  return words;
}

function applyAccents() {
  document.querySelectorAll(".heading").forEach((heading) => {
    if (!heading.textContent.includes("*")) return;
    heading.innerHTML = heading.innerHTML.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  });
}

function fitNames() {
  document.querySelectorAll(".cover__names, .hero__names, .showcase__names, .envelope__card-names").forEach((element) => {
    element.style.fontSize = "";
    let size = parseFloat(getComputedStyle(element).fontSize);
    let guard = 0;
    while (element.scrollWidth > element.clientWidth + 1 && size > 18 && guard < 40) {
      size -= 2;
      element.style.fontSize = `${size}px`;
      guard += 1;
    }
  });
}

function countdownTarget() {
  const countdown = document.getElementById("countdown");
  return (countdown && countdown.dataset.target) || INVITATION.eventStart;
}

function onceInView(element, callback, start = "top 86%") {
  ScrollTrigger.create({ trigger: element, start, once: true, onEnter: callback });
}

function ownChildren(element) {
  return [...element.children].filter((child) => !child.matches("[data-reveal]") && !child.querySelector("[data-reveal]"));
}
