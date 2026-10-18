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
  let ring = null;
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
        cell.insertAdjacentHTML("beforeend", '<svg class="calendar__ring" viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="22" pathLength="1"/></svg>');
        ring = cell.querySelector(".calendar__ring circle");
      }
    }
    grid.appendChild(cell);
  }
  if (prefersReducedMotion) return;
  const days = grid.querySelectorAll(".calendar__day");
  const eventDay = grid.querySelector(".calendar__day.is-event");
  const timeline = gsap.timeline({ paused: true })
    .from(days, { opacity: 0, y: 10, duration: .5, ease: "power2.out", stagger: { amount: .9, from: "random" } }, .3);
  if (eventDay) timeline.from(eventDay, { scale: .2, duration: .7, ease: "back.out(2.4)" }, 1.2);
  if (ring) timeline.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 1.4);
  onceInView(grid, () => timeline.play(), "top 85%");
}

function setupCountdown() {
  const countdown = document.getElementById("countdown");
  const target = new Date(INVITATION.eventStart).getTime();
  if (!countdown || Number.isNaN(target)) return;
  const cells = {};
  const arcs = {};
  countdown.querySelectorAll("[data-unit]").forEach((cell) => {
    cells[cell.dataset.unit] = cell;
    arcs[cell.dataset.unit] = cell.closest(".dial").querySelector(".dial__arc");
  });
  const spans = { days: 365, hours: 24, minutes: 60, seconds: 60 };
  let visible = false;
  const paint = (unit, value) => {
    const cell = cells[unit];
    if (!cell) return;
    if (arcs[unit]) arcs[unit].style.strokeDashoffset = String(100 - Math.min(value / spans[unit], 1) * 100);
    const text = String(value).padStart(2, "0");
    if (cell.textContent === text) return;
    cell.textContent = text;
    if (visible && !prefersReducedMotion) gsap.fromTo(cell, { rotationX: -90, opacity: 0, transformPerspective: 240 }, { rotationX: 0, opacity: 1, duration: .55, ease: "back.out(1.6)" });
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
    const intro = gsap.from(countdown.children, { scale: .4, rotation: -120, opacity: 0, duration: 1.3, ease: "back.out(1.5)", stagger: .12, paused: true, clearProps: "transform,opacity" });
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
