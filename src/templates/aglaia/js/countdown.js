function eventDateParts() {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(countdownTarget());
  return match ? match.slice(1).map(Number) : null;
}

function setupCalendar() {
  const grid = document.getElementById("calendarGrid");
  const parts = eventDateParts();
  if (!grid || !parts) return;
  const [year, month, day] = parts;
  WEEKDAY_SHORT.forEach((label) => {
    const cell = document.createElement("span");
    cell.className = "logbook__weekday";
    cell.textContent = label;
    grid.appendChild(cell);
  });
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPreviousMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  for (let index = 0; index < totalCells; index++) {
    const cell = document.createElement("span");
    cell.className = "logbook__day";
    const dayNumber = index - firstWeekday + 1;
    if (dayNumber < 1) {
      cell.textContent = daysInPreviousMonth + dayNumber;
      cell.classList.add("is-muted");
    } else if (dayNumber > daysInMonth) {
      cell.textContent = dayNumber - daysInMonth;
      cell.classList.add("is-muted");
    } else {
      cell.textContent = dayNumber;
      if (dayNumber === day) {
        cell.classList.add("is-event");
        const label = document.createElement("span");
        label.className = "sr-only";
        label.textContent = `, ${INVITATION.calendarEventLabel}`;
        cell.appendChild(label);
        cell.insertAdjacentHTML("beforeend", '<svg class="logbook__ring" viewBox="0 0 46 38" aria-hidden="true"><path pathLength="1" d="M31 5C21 1 7 5 4.5 16S12 35 25 34S43 25 41 15S30 1 17 5"/></svg><svg class="logbook__heart" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart"/></svg>');
      }
    }
    grid.appendChild(cell);
  }
  const logbook = document.getElementById("logbook");
  if (!logbook || prefersReducedMotion) return;
  const ring = grid.querySelector(".logbook__ring path");
  const heart = grid.querySelector(".logbook__heart");
  const timeline = gsap.timeline({ paused: true })
    .from(logbook, { y: 56, opacity: 0, duration: 1.4, ease: "expo.out", clearProps: "transform" })
    .from(grid.children, { opacity: 0, duration: .6, stagger: .012, ease: "power1.out" }, .3);
  if (ring) {
    gsap.set(ring, { strokeDasharray: 1, strokeDashoffset: 1 });
    timeline.to(ring, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 1);
  }
  if (heart) timeline.from(heart, { scale: 0, opacity: 0, duration: .7, ease: "back.out(2)" }, 2.1);
  onceInView(logbook, () => timeline.play());
}

function setupCountdown() {
  const countdown = document.getElementById("countdown");
  const target = new Date(countdownTarget()).getTime();
  if (!countdown || Number.isNaN(target)) return;
  const cells = {};
  countdown.querySelectorAll("[data-unit]").forEach((cell) => { cells[cell.dataset.unit] = cell; });
  let visible = false;
  const pad = (value) => String(value).padStart(2, "0");
  const roll = (cell, value) => {
    if (!cell) return;
    const text = pad(value);
    const current = cell.lastElementChild;
    if (current && current.textContent === text) return;
    const next = document.createElement("span");
    next.textContent = text;
    if (!visible || prefersReducedMotion || !current) {
      cell.replaceChildren(next);
      return;
    }
    cell.appendChild(next);
    gsap.to(current, { yPercent: -100, opacity: 0, duration: .38, ease: "power3.out", onComplete: () => current.remove() });
    gsap.fromTo(next, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, delay: .14, ease: "expo.out" });
  };
  let timer = 0;
  const tick = () => {
    const remaining = Math.max(0, target - Date.now());
    roll(cells.days, Math.floor(remaining / 864e5));
    roll(cells.hours, Math.floor(remaining / 36e5) % 24);
    roll(cells.minutes, Math.floor(remaining / 6e4) % 60);
    roll(cells.seconds, Math.floor(remaining / 1e3) % 60);
    if (remaining === 0) clearInterval(timer);
  };
  timer = setInterval(tick, 1000);
  tick();
  ScrollTrigger.create({ trigger: countdown, start: "top bottom", end: "bottom top", onToggle: (self) => { visible = self.isActive; } });
  if (prefersReducedMotion) return;
  const intro = gsap.timeline({ paused: true })
    .fromTo(countdown.querySelector(".panels__img"), { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.inOut", clearProps: "clipPath" })
    .from(countdown.querySelectorAll(".panels__slot"), { y: 16, opacity: 0, duration: 1.1, ease: "expo.out", stagger: .1 }, .7);
  onceInView(countdown, () => intro.play());
}

function setupCalendarLink() {
  const link = document.getElementById("calendarLink");
  if (!link) return;
  const start = new Date(INVITATION.eventStart);
  const end = new Date(INVITATION.eventEnd);
  if (Number.isNaN(start.getTime())) return;
  const toCalendarDate = (value) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: INVITATION.eventTitle,
    dates: `${toCalendarDate(start)}/${toCalendarDate(Number.isNaN(end.getTime()) ? start : end)}`,
    location: INVITATION.eventLocation,
    details: I18N.calendarDetails
  });
  link.href = `https://calendar.google.com/calendar/render?${params}`;
}
