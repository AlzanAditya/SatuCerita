function buildTickets() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-ticket]").forEach((ticket) => {
    const top = ticket.querySelector(".ticket__top");
    const bottom = ticket.querySelector(".ticket__bottom");
    const tear = ticket.querySelector(".ticket__tear");
    const shadow = ticket.querySelector(".ticket__shadow");
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
      .from([top, shadow].filter(Boolean), { y: 60, opacity: 0, duration: 1.5 }, 0)
      .from(bottom, { y: 84, opacity: 0, duration: 1.6 }, .12)
      .from(top.children, { y: 14, opacity: 0, duration: 1.1, stagger: .08 }, .35)
      .from(bottom.querySelectorAll(":scope > :not(.ticket__tear)"), { y: 12, opacity: 0, duration: 1, stagger: .08 }, .75);
    if (tear) timeline.from(tear, { scaleX: 0, duration: 1.2, ease: "power3.inOut" }, .6);
    onceInView(ticket, () => timeline.play(), "top 84%");
  });
}

function buildBunting() {
  const bunting = document.getElementById("bunting");
  if (!bunting) return;
  const rope = bunting.querySelector(".bunting__rope");
  const path = rope && rope.querySelector("path");
  const flags = [...bunting.querySelectorAll(".flag")];
  if (!path || !flags.length) return;
  const layout = () => {
    const width = bunting.clientWidth;
    if (!width) return;
    const top = 8;
    const sag = 26;
    const gap = width / flags.length;
    rope.setAttribute("viewBox", `0 0 ${width} 60`);
    path.setAttribute("d", `M0 ${top}Q${width / 2} ${top + sag * 2} ${width} ${top}`);
    flags.forEach((flag, index) => {
      const x = gap * (index + .5);
      const t = x / width;
      flag.style.left = `${x.toFixed(1)}px`;
      flag.style.top = `${(top + 4 * sag * t * (1 - t) - 2).toFixed(1)}px`;
      flag.style.width = `${Math.min(64, gap - 4).toFixed(1)}px`;
    });
  };
  layout();
  ScrollTrigger.addEventListener("refresh", layout);
  if (prefersReducedMotion) return;
  path.setAttribute("pathLength", "1");
  gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
  const timeline = gsap.timeline({ paused: true })
    .to(path, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" })
    .from(flags, { y: -36, opacity: 0, duration: 1.2, ease: "expo.out", stagger: .12 }, .5);
  onceInView(bunting, () => timeline.play());
}

function buildLive() {
  const screen = document.querySelector("[data-live]");
  if (!screen || prefersReducedMotion) return;
  const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .from(screen, { y: 50, opacity: 0, duration: 1.5 })
    .from(screen.querySelector(".screen__frame img"), { yPercent: 5, duration: 2.2, ease: "power2.out" }, 0)
    .from(screen.querySelector(".screen__badge"), { y: -10, opacity: 0, duration: 1 }, .6)
    .from(screen.querySelector(".screen__play"), { scale: .7, opacity: 0, duration: 1.1 }, .7);
  onceInView(screen, () => timeline.play());
}
