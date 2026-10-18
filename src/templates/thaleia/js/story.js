function buildCouple() {
  document.querySelectorAll("[data-person]").forEach((person) => {
    const isEnd = person.classList.contains("person--end");
    const side = isEnd ? 1 : -1;
    const visual = person.querySelector(".person__visual");
    const photo = person.querySelector(".person__photo");
    const image = person.querySelector(".person__photo img");
    const flora = person.querySelector(".person__flora");
    const role = person.querySelector(".person__role");
    const nick = person.querySelector(".person__nick");
    const line = person.querySelector(".person__line");
    const rest = person.querySelectorAll(".person__full, .person__parents, .ig");
    if (prefersReducedMotion) return;
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(visual, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease: "power2.out", force3D: true, clearProps: "transform,opacity" }, 0)
      .add(curtainReveal(photo, 1.8), .15);
    if (image) timeline.fromTo(image, { scale: 1.16 }, { scale: 1, duration: 2.6, ease: "power2.out", force3D: true, clearProps: "transform" }, .15);
    timeline.fromTo(flora, { scale: .7, rotation: side * -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, transformOrigin: isEnd ? "100% 100%" : "0% 100%", duration: 1.6, ease: "power3.out", clearProps: "transform,opacity" }, .9);
    if (role) timeline.fromTo(role, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power2.inOut", clearProps: "clipPath" }, .6);
    timeline
      .add(inkIn(nick, { y: 10, blur: 12 }), .9)
      .from(line, { scaleX: 0, transformOrigin: isEnd ? "100% 50%" : "0% 50%", duration: 1.2, ease: "expo.out" }, 1.2);
    if (rest.length) timeline.from(rest, { x: side * 26, opacity: 0, duration: .9, stagger: .12, clearProps: "transform,opacity" }, 1.25);
    onceInView(person, () => timeline.play(), "top 76%");
  });
}

function buildStory() {
  const timeline = document.getElementById("timeline");
  const fill = document.getElementById("timelineFill");
  if (!timeline || prefersReducedMotion) return;
  if (fill) gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: { trigger: timeline, start: "top 72%", end: "bottom 62%", scrub: .5 } });
  timeline.querySelectorAll("[data-milestone]").forEach((milestone, index) => {
    const dot = milestone.querySelector(".milestone__dot");
    const year = milestone.querySelector(".milestone__year");
    const stamp = milestone.querySelector(".stamp-wrap");
    const image = milestone.querySelector(".stamp__media img");
    const words = milestone.querySelectorAll(".milestone__title, .milestone__text");
    const tilt = index % 2 ? -4 : 4;
    const reveal = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .from(dot, { scale: 0, rotation: -120, duration: 1, ease: "back.out(2.2)" }, 0)
      .from(year, { opacity: 0, x: -16, duration: .9 }, .15);
    if (stamp) reveal.add(settleCard(stamp, { tilt: tilt * .5, y: 48 }), .2);
    if (words.length) reveal.from(words, { y: 18, opacity: 0, duration: .9, stagger: .12, clearProps: "transform,opacity" }, .7);
    onceInView(milestone, () => reveal.play(), "top 74%");
    if (image) gsap.fromTo(image, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: milestone, start: "top bottom", end: "bottom 35%", scrub: true } });
  });
}

function buildEvents() {
  document.querySelectorAll("[data-ticket]").forEach((ticket, index) => {
    const tear = ticket.querySelector(".ticket__tear");
    const day = ticket.querySelector(".ticket__day");
    const items = ticket.querySelectorAll(".ticket__icon, .ticket__kind, .ticket__title, .ticket__date, .ticket__bottom > *");
    if (prefersReducedMotion) return;
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .add(settleCard(ticket, { tilt: index % 2 ? 2 : -2, y: 64, cascade: items }), 0);
    if (tear) timeline.from(tear, { scaleX: 0, duration: 1.1, ease: "power2.inOut" }, .7);
    const target = day ? parseInt(day.dataset.day || day.textContent, 10) : NaN;
    if (day && !Number.isNaN(target)) timeline.add(() => scrambleNumber(day, target, 1.1), .9);
    onceInView(ticket, () => timeline.play(), "top 82%");
  });
}

function buildAttire() {
  const line = document.getElementById("clothesline");
  const source = document.getElementById("swatches");
  if (!line || !source) return;
  const chipsLayer = line.querySelector(".line__chips");
  const entries = [...source.querySelectorAll("[data-color]")];
  const total = entries.length;
  const chips = entries.map((entry, index) => {
    const t = (index + 1) / (total + 1);
    const x = (1 - t) * (1 - t) * -4 + 2 * (1 - t) * t * 220 + t * t * 444;
    const y = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 74 + t * t * 10;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.setProperty("--x", `${(x / 440 * 100).toFixed(2)}%`);
    chip.style.setProperty("--y", `${(y - 8).toFixed(1)}px`);
    chip.style.setProperty("--d", `${(-index * .7).toFixed(1)}s`);
    chip.style.setProperty("--c", entry.dataset.color);
    chip.innerHTML = '<div class="chip__swing"><span class="chip__peg"></span><span class="chip__card"><span class="chip__fill"></span><span class="chip__name"></span></span></div>';
    chip.querySelector(".chip__name").textContent = entry.textContent.trim();
    chipsLayer.appendChild(chip);
    return chip;
  });
  if (prefersReducedMotion) return;
  const cord = line.querySelector(".line__cord path");
  cord.setAttribute("pathLength", "1");
  gsap.set(cord, { strokeDasharray: 1, strokeDashoffset: 1 });
  const timeline = gsap.timeline({ paused: true })
    .to(cord, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 0)
    .from(chips, { y: -170, rotation: () => gsap.utils.random(-35, 35), opacity: 0, duration: 1.8, ease: "elastic.out(1, .42)", stagger: .13 }, .5);
  onceInView(line, () => timeline.play(), "top 84%");
}

function buildQuote() {
  const lens = document.querySelector("[data-lens]");
  const words = [...document.querySelectorAll("[data-quote-words]")].flatMap((element) => splitWords(element));
  if (prefersReducedMotion) return;
  if (lens) {
    gsap.fromTo(lens, { clipPath: "polygon(40% 34%, 60% 34%, 66% 38%, 66% 62%, 60% 66%, 40% 66%, 34% 62%, 34% 38%)" }, { clipPath: "polygon(10% 0%, 90% 0%, 100% 8%, 100% 92%, 90% 100%, 10% 100%, 0% 92%, 0% 8%)", ease: "none", scrollTrigger: { trigger: lens, start: "top 88%", end: "center 42%", scrub: .6 } });
    gsap.fromTo(lens.querySelector("img"), { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: lens, start: "top bottom", end: "bottom top", scrub: true } });
  }
  if (words.length) {
    const tween = gsap.from(words, { opacity: 0, rotationX: -85, y: -8, transformOrigin: "50% 0%", duration: 1, ease: "power3.out", stagger: .05, paused: true });
    onceInView(words[0].parentElement, () => tween.play(), "top 84%");
  }
}

function buildFarewell() {
  const stage = document.querySelector("[data-farewell]");
  if (stage && !prefersReducedMotion) {
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .add(settleCard(stage.querySelector(".farewell__frame"), { tilt: -3, y: 40, duration: 1.6 }), 0)
      .add(irisReveal(stage.querySelector(".farewell__photo"), 2), .3)
      .from(stage.querySelector(".farewell__photo img"), { scale: 1.3, duration: 2.6 }, .3)
      .from(stage.querySelectorAll(".farewell__tree img"), { scaleY: .2, opacity: 0, duration: 2.2, stagger: .2 }, .5);
    onceInView(stage, () => timeline.play(), "top 76%");
  }
}
