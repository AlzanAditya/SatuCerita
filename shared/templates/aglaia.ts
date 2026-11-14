import type { Binding, TemplateManifest } from "./types";
import { attrs, commonGroups, commonSlots, hideUnless, html, img, removeUnless, slot, text, tx } from "./helpers";

const b: Binding[] = [
  // ---- head ----
  text("title", "{x.title}"),
  attrs('meta[property="og:title"]', { content: "{x.title}" }),
  attrs('meta[name="description"]', { content: "{x.desc}" }),
  attrs('meta[property="og:description"]', { content: "{x.desc}" }),
  attrs('link[rel="preload"][href*="cover-couple"]', { href: "{media.cover}" }, "media.cover"),

  // ---- panel samping (desktop) ----
  img(".showcase__photo", "media.cover"),
  html(".showcase__names", "{groom.nick}<span>&amp;</span>{bride.nick}"),
  html(".showcase__date", "<span>{x.e.0.weekday}</span>{x.e.0.long}"),

  // ---- sampul ----
  img(".cover__photo img", "media.cover", "{x.names}"),
  text(".cover__names .sr-only", "{x.names}"),
  text(".cover__names > span:nth-child(2)", "{groom.nick}"),
  text(".cover__names > span:nth-child(4)", "{bride.nick}"),
  text(".cover__date", "{x.e.0.longComma}"),
  text(".envelope__card-names", "{x.names}"),
  text(".envelope__card-date", "{x.e.0.longComma}"),
  text("#guestName", "{cover.guest_label}", "cover.guest_label"),

  // ---- hero ----
  text(".hero__names .sr-only", "{x.names}"),
  text(".hero__names > .mask:nth-child(2) > span", "{groom.nick}"),
  text(".hero__names > .mask:nth-child(4) > span", "{bride.nick}"),
  text(".hero__date", "{x.e.0.weekday} · {x.e.0.long}"),
  text(".hero__tagline", "{hero.tagline}", "hero.tagline"),

  // ---- prolog ----
  img(".stamp__media img", "media.prolog||media.cover", "{x.names}"),
  text(".letter__greeting", "{opening.greeting}", "opening.greeting"),
  text(".letter__verse", "“{opening.verse}”", "opening.verse"),
  hideUnless(".letter__verse", "opening.verse"),
  text(".letter__source", "{opening.verse_source}"),
  text(".letter__note", "{opening.text}", "opening.text"),

  // ---- mempelai (di Aglaia: wanita di kiri, pria di kanan) ----
  img('.mate[data-mate="left"] .mate__photo img', "media.bride", "{bride.nick}"),
  attrs('.mate[data-mate="left"] .mate__photo img', { alt: "{bride.nick}" }),
  attrs('.mate[data-mate="left"] a.mate__ig', { "aria-label": "Instagram {bride.nick}" }),
  text('.mate[data-mate="left"] .mate__name', "{bride.full}"),
  html('.mate[data-mate="left"] .mate__parents', "{bride.order_label}<br><span>Bapak {bride.father}</span> &amp; <span>Ibu {bride.mother}</span>"),
  attrs('.mate[data-mate="left"] a.mate__ig', { href: "{x.ig.bride}" }, "x.ig.bride"),
  tx('.mate[data-mate="left"] a.mate__ig', "{x.ig.brideAt}", "x.ig.brideAt"),
  hideUnless('.mate[data-mate="left"] a.mate__ig', "x.ig.bride"),
  img('.mate[data-mate="right"] .mate__photo img', "media.groom", "{groom.nick}"),
  attrs('.mate[data-mate="right"] .mate__photo img', { alt: "{groom.nick}" }),
  attrs('.mate[data-mate="right"] a.mate__ig', { "aria-label": "Instagram {groom.nick}" }),
  text('.mate[data-mate="right"] .mate__name', "{groom.full}"),
  html('.mate[data-mate="right"] .mate__parents', "{groom.order_label}<br><span>Bapak {groom.father}</span> &amp; <span>Ibu {groom.mother}</span>"),
  attrs('.mate[data-mate="right"] a.mate__ig', { href: "{x.ig.groom}" }, "x.ig.groom"),
  tx('.mate[data-mate="right"] a.mate__ig', "{x.ig.groomAt}", "x.ig.groomAt"),
  hideUnless('.mate[data-mate="right"] a.mate__ig', "x.ig.groom"),

  // ---- hitung mundur ----
  attrs("#countdown", { "data-target": "{x.e.0.startIso}" }, "x.e.0.startIso"),
];

// ---- catatan pelayaran (3 pemberhentian) ----
for (let i = 0; i < 3; i++) {
  const c = `#route > .stop:nth-of-type(${i + 1})`;
  b.push(
    img(`${c} .polaroid img`, `media.story_${i + 1}||media.gallery.${i}||media.cover`, `{story.${i}.title}`),
    text(`${c} .stop__year`, `{story.${i}.year}`),
    text(`${c} .stop__title`, `{story.${i}.title}`),
    text(`${c} .stop__text`, `{story.${i}.text}`),
  );
}

// ---- acara (2 tiket) ----
for (let i = 0; i < 2; i++) {
  const c = `#event > .ticket:nth-of-type(${i + 1})`;
  b.push(
    text(`${c} .ticket__kind`, `{events.${i}.tagline}`),
    text(`${c} .ticket__name`, `{events.${i}.title}`),
    text(`${c} .ticket__desc`, `{events.${i}.desc}`),
    text(`${c} .ticket__stamp-day`, `{x.e.${i}.day}`),
    text(`${c} .ticket__stamp-month`, `{x.e.${i}.monthShortYear}`),
    text(`${c} .ticket__grid > div:nth-child(1) dd`, `{x.e.${i}.longComma}`),
    text(`${c} .ticket__grid > div:nth-child(2) dd`, `{x.e.${i}.time}`),
    html(`${c} .ticket__place`, `<strong>{events.${i}.venue}</strong>{events.${i}.address}`),
    attrs(`${c} a.btn`, { href: `{x.e.${i}.maps}` }),
  );
}

// ---- warna busana (5 bendera) ----
b.push(text(".attire__note", "{attire.note}", "attire.note"), hideUnless(".attire__note", "attire.note"));
for (let i = 0; i < 5; i++) {
  const c = `#bunting > .flag:nth-of-type(${i + 1})`;
  b.push(attrs(c, { style: `--c:{attire.colors.${i}.hex}` }), text(`${c} .flag__name`, `{attire.colors.${i}.name}`), removeUnless(c, `attire.colors.${i}.name`));
}

// ---- live ----
b.push(
  hideUnless("#live", "live.enabled"),
  attrs("a.screen", { href: "{x.liveUrl}" }, "x.liveUrl"),
  attrs(".live__caption a.btn", { href: "{x.liveUrl}" }, "x.liveUrl"),
  img(".screen__frame img", "media.live||media.cover"),
  text(".live__title", "{live.title}", "live.title"),
  text(".live__meta", "Tayang {x.e.0.longComma} · {x.e.0.start} melalui {live.platform}"),
);

// ---- galeri (maks 8) ----
for (let i = 0; i < 8; i++) {
  const c = `.reel__track > .reel__item:nth-of-type(${i + 1})`;
  if (i > 0) b.push(removeUnless(c, `media.gallery.${i}`));
  const src = i === 0 ? "media.gallery.0||media.cover" : `media.gallery.${i}`;
  b.push(attrs(`${c} img`, { src: `{${src}}`, "data-full": `{${src}}` }, src), text(`${c} .snap__script`, "{x.initials}"));
}

// ---- kutipan ----
b.push(
  img(".print--quote .print__photo img", "media.quote||media.cover"),
  text("#quoteText", "{quote.text}", "quote.text"),
  text(".quote__author", "{quote.author}"),
  hideUnless("#quote", "quote.text"),
);

// ---- bekal pelayaran ----
b.push(hideUnless("#gift", "gift.enabled"), hideUnless('a[href="#gift"]', "gift.enabled"));
for (let i = 0; i < 2; i++) {
  const c = `.gift__content > .tag:nth-of-type(${i + 1})`;
  b.push(
    text(`${c} .tag__bank`, `{gift.banks.${i}.bank}`),
    text(`${c} .tag__number`, `{gift.banks.${i}.number}`),
    text(`${c} .tag__holder`, `a.n. {gift.banks.${i}.holder}`),
    attrs(`${c} button[data-copy]`, { "data-copy": `{gift.banks.${i}.number}` }),
    removeUnless(c, `gift.banks.${i}.number`),
  );
}
b.push(
  text(".tag--address .tag__name", "{gift.recipient}"),
  text(".tag--address .tag__text", "{gift.address}"),
  attrs(".tag--address button[data-copy]", { "data-copy": "{gift.recipient}, {gift.address}" }),
  hideUnless(".tag--address", "gift.address"),
  hideUnless(".gift__content > h3:nth-of-type(2)", "gift.address"),
);

// ---- penutup ----
b.push(
  img(".print--closing .print__photo img", "media.closing||media.cover", "{x.names}"),
  text(".print--closing .print__caption", "{x.names}"),
  text(".closing__text", "{closing.text}", "closing.text"),
  html(".closing__names", '{groom.nick} <span class="amp">&amp;</span> {bride.nick}'),
  html(".closing__families", "{closing.families:br}"),
  text(".footer__label", "Berlabuh · {x.e.0.long}"),
  text(".footer__names", "{x.names}"),
);

export const aglaia: TemplateManifest = {
  slug: "aglaia",
  title: "Aglaia",
  version: 1,
  titlePrefix: "Pernikahan",
  groups: commonGroups({ closingHeading: false }),
  slots: commonSlots(8, [slot("prolog", "Foto kartu pos pembuka", { fallback: "sampul" })]),
  bindings: b,
  defaultContent: {
    groom: { nick: "John", full: "John Adrian Wijaya", order_label: "Putra tercinta dari", father: "Hendra Wijaya", mother: "Ratna Sari", instagram: "" },
    bride: { nick: "Jane", full: "Jane Amelia Putri", order_label: "Putri tercinta dari", father: "Daniel Kusuma", mother: "Maria Lestari", instagram: "" },
    cover: { guest_label: "Tamu Undangan" },
    hero: { tagline: "Tali sudah dilepas dari tambatan. Antar kami ke tengah danau dengan doa terbaik Anda." },
    opening: {
      greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
      verse: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
      verse_source: "QS. Ar-Rum · 21",
      text: "Berpegang pada ayat ini, kami bersiap menambatkan tali di dermaga yang sama, dan berharap Anda berkenan turut melepas pelayaran pertama kami.",
    },
    events: [
      { title: "Akad Nikah", tagline: "Prosesi Sakral", date: "2026-12-20", start: "08:00", end: "10:00", tz: "WIB", venue: "Masjid Baiturrahman", address: "Jl. Telaga Biru No. 21, Bogor", maps_url: "", desc: "Janji suci yang diucapkan dalam lingkar kecil orang-orang tersayang." },
      { title: "Resepsi Pernikahan", tagline: "Jamuan Bahagia", date: "2026-12-20", start: "11:00", end: "14:00", tz: "WIB", venue: "Pavilion Tepi Danau", address: "Kawasan Danau Lido, Jl. Raya Bogor–Sukabumi Km. 21, Bogor", maps_url: "", desc: "Jamuan siang dan ramah tamah di tepi Danau Lido." },
    ],
    story: [
      { year: "2017", title: "Satu Kompas, Dua Arah", text: "Kami sama-sama tersesat mencari dermaga di tepi Danau Toba. Satu peta dibagi dua, dan sejak itu arah kami tak pernah benar-benar berpisah." },
      { year: "2020", title: "Belajar Membaca Angin", text: "Merencanakan perjalanan pertama berdua mengajari kami berkompromi: kapan mendayung, kapan cukup menunggu angin." },
      { year: "2025", title: "Tali yang Ditambatkan", text: "Jane mengira itu piknik biasa, sampai John berlutut di ujung dermaga dengan sebuah cincin dan suara yang sedikit bergetar." },
    ],
    attire: {
      note: "Kain yang ringan dan alas kaki yang nyaman akan memudahkan Anda di area tepi danau.",
      colors: [
        { name: "Langit Pagi", hex: "#9cc9e4" }, { name: "Biru Danau", hex: "#2b5d7d" }, { name: "Pasir Danau", hex: "#f1eadb" },
        { name: "Merah Senja", hex: "#e3b4ab" }, { name: "Abu Kabut", hex: "#c3cfd4" },
      ],
    },
    live: { enabled: false, platform: "YouTube", title: "Akad Nikah", url: "" },
    quote: { text: "Apa pun jiwa kita terbuat darinya, jiwanya dan jiwaku adalah sama.", author: "Emily Brontë" },
    rsvp: { max_guests: 2 },
    gift: { enabled: true, banks: [{ bank: "", number: "", holder: "" }, { bank: "", number: "", holder: "" }], recipient: "", address: "" },
    closing: {
      text: "Merupakan kehormatan bagi kami bila Bapak/Ibu/Saudara/i berkenan hadir dan mengiringi doa. Sampai jumpa di dermaga bahagia kami.",
      families: "Bersama keluarga Wijaya\n& keluarga Kusuma",
    },
    music: { youtube: "https://youtu.be/NZGHXy1IAHM", start: 0 },
    site: { title: "", description: "" },
    media: {},
  },
};
