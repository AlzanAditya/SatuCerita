function eventDateParts() {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(INVITATION.eventStart);
  return match ? match.slice(1).map(Number) : null;
}

function setupCalendar() {
  const grid = document.getElementById("calendarGrid");
  const parts = eventDateParts();
  if (!grid || !parts) return;
  const [year, month, day] = parts;
  WEEKDAY_SHORT.forEach((label) => {
    const cell = document.createElement("span");
    cell.className = "calendar__weekday";
    cell.textContent = label;
    grid.appendChild(cell);
  });
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPreviousMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  let bloom = null;
  for (let index = 0; index < totalCells; index++) {
    const cell = document.createElement("span");
    cell.className = "calendar__day";
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
        cell.setAttribute("aria-label", INVITATION.calendarEventLabel);
        bloom = document.createElement("img");
        bloom.className = "calendar__bloom";
        bloom.src = "assets/ornament/sprig-jasmine.webp";
        bloom.alt = "";
        cell.appendChild(bloom);
      }
    }
    grid.appendChild(cell);
  }
  const eventDay = grid.querySelector(".calendar__day.is-event");
  if (prefersReducedMotion) {
    if (eventDay) eventDay.classList.add("is-pulsing");
    return;
  }
  const days = grid.querySelectorAll(".calendar__day:not(.is-event)");
  const timeline = gsap.timeline({ paused: true })
    .fromTo(days, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .7, ease: "power2.out", stagger: { grid: "auto", from: 0, amount: .9 }, clearProps: "transform,opacity" }, .3);
  if (eventDay) {
    timeline.fromTo(eventDay, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 1.1, ease: "power3.out", force3D: true, clearProps: "transform,opacity", onComplete: () => eventDay.classList.add("is-pulsing") }, 1.05);
  }
  if (bloom) timeline.fromTo(bloom, { opacity: 0, scale: .5, rotation: -25 }, { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity" }, 1.45);
  onceInView(grid, () => timeline.play(), "top 85%");
}

function setupCountdown() {
  const countdown = document.getElementById("countdown");
  const target = new Date(INVITATION.eventStart).getTime();
  if (!countdown || Number.isNaN(target)) return;
  const cells = {};
  countdown.querySelectorAll("[data-unit]").forEach((cell) => { cells[cell.dataset.unit] = cell; });
  let visible = false;
  const paint = (unit, value) => {
    const cell = cells[unit];
    if (!cell) return;
    const text = String(value).padStart(2, "0");
    if (cell.textContent === text) return;
    cell.textContent = text;
    if (visible && !prefersReducedMotion) gsap.fromTo(cell, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .55, ease: "power3.out" });
  };
  const tick = () => {
    const remaining = Math.max(0, target - Date.now());
    paint("days", Math.floor(remaining / 864e5));
    paint("hours", Math.floor(remaining / 36e5) % 24);
    paint("minutes", Math.floor(remaining / 6e4) % 60);
    paint("seconds", Math.floor(remaining / 1e3) % 60);
    if (remaining === 0) clearInterval(timer);
  };
  const timer = setInterval(tick, 1000);
  tick();
  ScrollTrigger.create({ trigger: countdown, start: "top bottom", end: "bottom top", onToggle: (self) => { visible = self.isActive; } });
  if (!prefersReducedMotion) {
    const intro = gsap.from(countdown.children, { yPercent: 45, scaleY: .6, transformOrigin: "50% 100%", opacity: 0, duration: 1.3, ease: "back.out(1.4)", stagger: { each: .12, from: "center" }, paused: true, clearProps: "transform,opacity" });
    onceInView(countdown, () => intro.play());
  }
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
