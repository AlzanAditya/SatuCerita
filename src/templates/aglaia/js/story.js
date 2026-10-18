function buildLetter() {
  const letter = document.querySelector("[data-letter]");
  if (!letter || prefersReducedMotion) return;
  const verse = letter.querySelector("[data-letter-verse]");
  const lines = letter.querySelectorAll("[data-letter-line]");
  const words = verse ? splitWords(verse) : [];
  const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .from(letter.querySelectorAll(":scope > :not([data-seal])"), { y: 30, opacity: 0, duration: 1.4, stagger: .06 }, 0);
  if (lines.length) timeline.add(tideIn(lines, { duration: 1.3, stagger: .16 }), .9);
  if (words.length) timeline.from(words, { y: 8, opacity: 0, duration: .9, stagger: .025 }, 1.1);
  onceInView(letter, () => timeline.play(), "top 80%");
}

function buildCouple() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-mate]").forEach((mate) => {
    const image = mate.querySelector(".mate__photo img");
    const role = mate.querySelector(".mate__role");
    const name = mate.querySelector(".mate__name");
    const line = mate.querySelector(".mate__line");
    const rest = mate.querySelectorAll(".mate__parents, .mate__ig");
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    const holder = mate.querySelector(".mate__frame");
    if (holder) timeline.fromTo(holder, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 2, ease: "power3.out", force3D: true, clearProps: "transform,opacity" }, 0);
    if (image) timeline.fromTo(image, { scale: 1.06 }, { scale: 1, duration: 2.6, ease: "power2.out", force3D: true, clearProps: "transform" }, 0);
    if (role) timeline.add(spacedIn(role, { duration: 1.5 }), .9);
    if (name) timeline.add(tideIn(name, { duration: 1.8 }), 1);
    if (line) timeline.from(line, { scaleX: 0, duration: 1.3 }, 1.4);
    if (rest.length) timeline.from(rest, { y: 14, opacity: 0, duration: 1.1, stagger: .12 }, 1.5);
    onceInView(mate, () => timeline.play(), "top 78%");
  });
  const joiner = document.querySelector("[data-joiner]");
  if (joiner) {
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
      .from(joiner.querySelector("img"), { y: 40, opacity: 0, duration: 1.6 })
      .from(joiner.querySelector("span"), { y: -12, opacity: 0, duration: 1.2 }, .5);
    onceInView(joiner, () => timeline.play());
  }
}

function buildStickers() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".closing__lantern").forEach((lantern, index) => {
    gsap.fromTo(lantern, { y: 26, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: "#closing", start: "top 95%", end: "top 50%", scrub: 1 } });
    gsap.to(lantern, { "--glow": 1, duration: 1.4, delay: .3 + index * .4, ease: "power1.inOut", scrollTrigger: { trigger: "#closing", start: "top 55%", once: true } });
  });
}

function buildLanes() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-lane]").forEach((lane) => {
    const boat = lane.querySelector(".lane__boat");
    if (!boat) return;
    const toRight = lane.dataset.lane === "right";
    gsap.fromTo(boat, { x: () => (toRight ? -boat.offsetWidth : lane.clientWidth) }, { x: () => (toRight ? lane.clientWidth : -boat.offsetWidth), ease: "none", scrollTrigger: { trigger: lane, start: "top bottom", end: "bottom top", scrub: 1.4, invalidateOnRefresh: true } });
  });
}

function buildStory() {
  const route = document.getElementById("route");
  if (!route) return;
  const svg = route.querySelector(".route__svg");
  const base = svg.querySelector(".route__base");
  const ink = route.querySelector(".route__ink");
  const inkSvg = ink.ownerSVGElement;
  const reveal = route.querySelector(".route__reveal");
  const revealIn = route.querySelector(".route__reveal-in");
  
  
  const STEPS = 24;
  let table = { x: [0], y: [0], length: [0] };
  let boatWidth = 0;
  let boatHeight = 0;
  let routeHeight = 0;
  const pointAt = (length) => {
    const lengths = table.length;
    const last = lengths.length - 1;
    if (length <= 0 || last < 1) return { x: table.x[0], y: table.y[0] };
    if (length >= lengths[last]) return { x: table.x[last], y: table.y[last] };
    let low = 0;
    let high = last;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (lengths[middle] < length) low = middle;
      else high = middle;
    }
    const f = (length - lengths[low]) / (lengths[high] - lengths[low] || 1);
    return { x: table.x[low] + (table.x[high] - table.x[low]) * f, y: table.y[low] + (table.y[high] - table.y[low]) * f };
  };
  const boat = document.getElementById("routeBoat");
  const stops = [...route.querySelectorAll(".stop")];
  const pins = stops.map((stop) => stop.querySelector(".stop__pin"));
  const bodyReveals = [];
  const revealed = [];
  const state = { length: 0, marks: [], progress: prefersReducedMotion ? 1 : 0 };
  const paint = () => {
    if (!state.length) return;
    const reach = state.length * state.progress;
    const point = pointAt(reach);
    const edge = state.progress >= 1 ? routeHeight + 12 : point.y;
    reveal.style.transform = `translate3d(0, ${(edge - routeHeight).toFixed(1)}px, 0)`;
    revealIn.style.transform = `translate3d(0, ${(routeHeight - edge).toFixed(1)}px, 0)`;
    pins.forEach((pin, index) => {
      const reached = reach >= state.marks[index] - 2;
      if (pin) pin.classList.toggle("is-reached", reached);
      if (reached && bodyReveals[index] && !revealed[index]) {
        revealed[index] = true;
        bodyReveals[index].play();
      }
    });
    if (boat && !prefersReducedMotion) {
      boat.style.transform = `translate3d(${(point.x - boatWidth / 2).toFixed(1)}px, ${(point.y - boatHeight * .82).toFixed(1)}px, 0)`;
    }
  };
  const draw = () => {
    const width = route.clientWidth;
    const height = route.clientHeight;
    if (!width || !height) return;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    inkSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    routeHeight = height;
    if (boat) {
      boatWidth = boat.offsetWidth;
      boatHeight = boat.offsetHeight;
    }
    const middle = width / 2;
    const bend = Math.min(22, width * .06);
    const points = [0, ...stops.map((stop) => stop.offsetTop + stop.offsetHeight / 2), height];
    let path = `M${middle} 0`;
    const next = { x: [middle], y: [0], length: [0] };
    const marks = [];
    for (let index = 1; index < points.length; index++) {
      const from = points[index - 1];
      const to = points[index];
      const span = to - from;
      const sign = index % 2 ? 1 : -1;
      const c1x = +(middle + bend * sign).toFixed(1);
      const c1y = +(from + span * .35).toFixed(1);
      const c2x = +(middle - bend * sign).toFixed(1);
      const c2y = +(from + span * .65).toFixed(1);
      const endY = +to.toFixed(1);
      path += ` C${c1x} ${c1y} ${c2x} ${c2y} ${middle} ${endY}`;
      const startY = next.y[next.y.length - 1];
      for (let step = 1; step <= STEPS; step++) {
        const t = step / STEPS;
        const u = 1 - t;
        const x = u * u * u * middle + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * middle;
        const y = u * u * u * startY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * endY;
        const previous = next.length.length - 1;
        next.length.push(next.length[previous] + Math.hypot(x - next.x[previous], y - next.y[previous]));
        next.x.push(x);
        next.y.push(y);
      }
      if (index < points.length - 1) marks.push(next.length[next.length.length - 1]);
    }
    base.setAttribute("d", path);
    ink.setAttribute("d", path);
    table = next;
    state.length = next.length[next.length.length - 1];
    state.marks = marks;
    paint();
  };
  draw();
  ScrollTrigger.addEventListener("refresh", draw);
  if (prefersReducedMotion) return;
  gsap.to(state, { progress: 1, ease: "none", onUpdate: paint, scrollTrigger: { trigger: route, start: "top 62%", end: "bottom 62%", scrub: .8 } });
  stops.forEach((stop, index) => {
    const polaroid = stop.querySelector(".polaroid");
    const develop = stop.querySelector(".polaroid__develop");
    const year = stop.querySelector(".stop__year");
    const title = stop.querySelector(".stop__title");
    const text = stop.querySelector(".stop__text");
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    if (polaroid) timeline.from(polaroid, { y: 60, opacity: 0, duration: 1.5 }, 0);
    if (develop) timeline.to(develop, { opacity: 0, duration: 2.2, ease: "power1.inOut" }, .5);
    onceInView(stop, () => timeline.play(), "top 80%");
    const body = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    if (year) body.from(year, { scale: .7, opacity: 0, duration: .7, ease: "power2.out" }, 0);
    if (title) body.from(splitWords(title), { yPercent: 70, opacity: 0, duration: 1.1, stagger: .06 }, .1);
    if (text) body.add(tideIn(text, { duration: 1.4 }), .3);
    bodyReveals[index] = body;
  });
  paint();
}
