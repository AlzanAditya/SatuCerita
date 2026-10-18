const WISHES_PER_PAGE = 5;
const rsvpState = { wishes: [], stats: { total: 0, yes: 0, no: 0 }, page: 0, revealed: false };

function initialsOf(name) {
  return String(name || "").split(/\s+/).filter((part) => /\p{L}/u.test(part)).slice(0, 2).map((part) => part.match(/\p{L}/u)[0].toUpperCase()).join("");
}

function countStats(list) {
  return list.reduce((stats, wish) => {
    stats.total += 1;
    if (wish.attendance === "yes") stats.yes += 1;
    if (wish.attendance === "no") stats.no += 1;
    return stats;
  }, { total: 0, yes: 0, no: 0 });
}

function renderTally() {
  document.getElementById("tallyTotal").textContent = rsvpState.stats.total;
  document.getElementById("tallyYes").textContent = rsvpState.stats.yes;
  document.getElementById("tallyNo").textContent = rsvpState.stats.no;
}

function wishTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    const locale = document.documentElement.lang === "en" ? "en-GB" : "id-ID";
    return `${date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "";
  }
}

function createWishCard(wish) {
  const card = document.createElement("article");
  card.className = "wish";
  const head = document.createElement("div");
  head.className = "wish__head";
  const avatar = document.createElement("span");
  avatar.className = "wish__avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = initialsOf(wish.name);
  const who = document.createElement("div");
  const name = document.createElement("p");
  name.className = "wish__name";
  name.textContent = String(wish.name || "");
  const badge = document.createElement("span");
  badge.className = "wish__badge";
  badge.textContent = ATTENDANCE_BADGES[wish.attendance] || "";
  const text = document.createElement("p");
  text.className = "wish__text";
  text.textContent = String(wish.message || "");
  who.append(name, badge);
  head.append(avatar, who);
  card.append(head, text);
  const when = wishTime(wish.createdAt);
  if (when) {
    const time = document.createElement("p");
    time.className = "wish__time";
    time.textContent = when;
    card.appendChild(time);
  }
  return card;
}

function renderWishes() {
  const container = document.getElementById("wishes");
  const pages = Math.max(1, Math.ceil(rsvpState.wishes.length / WISHES_PER_PAGE));
  rsvpState.page = Math.min(Math.max(rsvpState.page, 0), pages - 1);
  document.getElementById("wishesPager").hidden = pages <= 1;
  document.getElementById("wishesCount").textContent = `${rsvpState.page + 1} / ${pages}`;
  document.getElementById("wishesPrev").disabled = rsvpState.page === 0;
  document.getElementById("wishesNext").disabled = rsvpState.page >= pages - 1;
  container.replaceChildren();
  if (!rsvpState.wishes.length) {
    const empty = document.createElement("p");
    empty.className = "wishes__empty";
    empty.textContent = I18N.wishesEmpty;
    container.appendChild(empty);
    return;
  }
  const start = rsvpState.page * WISHES_PER_PAGE;
  rsvpState.wishes.slice(start, start + WISHES_PER_PAGE).forEach((wish) => container.appendChild(createWishCard(wish)));
}

function animateWishes() {
  if (!prefersReducedMotion) gsap.from("#wishes > *", { y: 24, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", clearProps: "transform,opacity" });
}

function revealWishesOnce() {
  if (rsvpState.revealed || prefersReducedMotion) return;
  rsvpState.revealed = true;
  const container = document.getElementById("wishes");
  const cards = [...container.children];
  if (!cards.length || container.getBoundingClientRect().top < window.innerHeight) return;
  gsap.set(cards, { y: 24, opacity: 0 });
  onceInView(container, () => gsap.to(cards, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "expo.out", clearProps: "transform,opacity" }));
}

function turnWishes(step) {
  rsvpState.page += step;
  renderWishes();
  ScrollTrigger.refresh();
  const container = document.getElementById("wishes");
  if (container.getBoundingClientRect().top < 0) lenis.scrollTo(container, { offset: -90, duration: .8, immediate: prefersReducedMotion });
  animateWishes();
}

async function loadWishes() {
  if (INVITATION.wishesEndpoint) {
    try {
      const url = new URL(INVITATION.wishesEndpoint, location.href);
      url.searchParams.set("page", "1");
      url.searchParams.set("perPage", "50");
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(String(response.status));
      const payload = await response.json();
      const stats = payload.stats || {};
      rsvpState.wishes = Array.isArray(payload.data) ? payload.data : [];
      rsvpState.stats = { total: Number(stats.total) || rsvpState.wishes.length, yes: Number(stats.yes) || 0, no: Number(stats.no) || 0 };
    } catch {
      rsvpState.wishes = [];
    }
  } else if (SAMPLE_WISHES.length) {
    rsvpState.wishes = [...SAMPLE_WISHES];
    rsvpState.stats = countStats(rsvpState.wishes);
  }
  renderTally();
  renderWishes();
  revealWishesOnce();
  ScrollTrigger.refresh();
}

function recordWish(wish) {
  const existed = Boolean(wish.id) && rsvpState.wishes.some((item) => item.id === wish.id);
  rsvpState.wishes = [wish, ...rsvpState.wishes.filter((item) => !wish.id || item.id !== wish.id)];
  rsvpState.page = 0;
  if (!existed) {
    rsvpState.stats.total += 1;
    if (wish.attendance === "yes") rsvpState.stats.yes += 1;
    if (wish.attendance === "no") rsvpState.stats.no += 1;
  }
  renderTally();
  renderWishes();
  ScrollTrigger.refresh();
  const fresh = document.querySelector("#wishes .wish:first-child");
  if (!fresh) return;
  fresh.classList.add("is-fresh");
  setTimeout(() => fresh.classList.remove("is-fresh"), 2600);
  if (!prefersReducedMotion) gsap.from(fresh, { y: -30, opacity: 0, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity" });
}

async function submitRsvp(payload) {
  const response = await fetch(INVITATION.rsvpEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok) return { wish: body.data || payload };
  if (response.status === 429) return { error: I18N.rsvpRateLimited };
  if (response.status === 422) return { error: (body.error && body.error.message) || I18N.rsvpInvalid };
  return { error: I18N.rsvpFailed };
}

function setupRsvp() {
  const form = document.getElementById("rsvpForm");
  if (!form) return;
  const status = document.getElementById("rsvpStatus");
  const submitButton = form.querySelector('button[type="submit"]');
  const guestGroup = document.getElementById("guestGroup");
  const guest = readGuestName();
  if (guest) document.getElementById("rsvpName").value = guest;
  form.querySelectorAll('input[name="attendance"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      guestGroup.hidden = form.attendance.value === "no";
      ScrollTrigger.refresh();
    });
  });
  document.getElementById("wishesPrev").addEventListener("click", () => turnWishes(-1));
  document.getElementById("wishesNext").addEventListener("click", () => turnWishes(1));
  loadWishes();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const attendance = String(data.get("attendance") || "yes");
    const payload = {
      name: String(data.get("name") || "").trim(),
      attendance,
      guestCount: attendance === "no" ? 1 : Math.min(Math.max(Number(data.get("guests")) || 1, 1), INVITATION.maxGuests),
      message: String(data.get("message") || "").trim()
    };
    if (INVITATION.guestCode) payload.guestCode = INVITATION.guestCode;
    if (!payload.name || !payload.message) {
      status.textContent = I18N.rsvpRequired;
      return;
    }
    if (!INVITATION.rsvpEndpoint) {
      recordWish({ ...payload, createdAt: new Date().toISOString() });
      document.getElementById("rsvpMessage").value = "";
      status.textContent = `${I18N.rsvpThanks} ${I18N.previewNotice}`;
      return;
    }
    submitButton.disabled = true;
    status.textContent = I18N.sending;
    let result;
    try {
      result = await submitRsvp(payload);
    } catch {
      result = { error: I18N.rsvpFailed };
    }
    submitButton.disabled = false;
    if (result.error) {
      status.textContent = result.error;
      return;
    }
    recordWish(result.wish);
    document.getElementById("rsvpMessage").value = "";
    status.textContent = I18N.rsvpThanks;
  });
}
