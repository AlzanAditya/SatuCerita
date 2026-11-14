import type { Binding, TemplateManifest } from "./types";
import { attrs, commonGroups, commonSlots, hideUnless, html, img, removeUnless, slot, text, tx } from "./helpers";

const b: Binding[] = [
  // ---- head ----
  text("title", "{x.title}"),
  attrs('meta[property="og:title"]', { content: "{x.title}" }),
  attrs('meta[name="description"]', { content: "{x.desc}" }),
  attrs('meta[property="og:description"]', { content: "{x.desc}" }),

  // ---- panel samping (desktop) ----
  img(".showcase__photo", "media.cover"),
  html(".showcase__names", '<span>{groom.nick}</span><span><span class="showcase__amp">&amp;</span>{bride.nick}</span>'),
  text(".showcase__date", "{x.e.0.weekday} · {x.e.0.long}"),
  text(".menu__names", "{x.names}"),

  // ---- sampul ----
  img(".cover__photo img", "media.cover", "{x.names}"),
  text(".cover__names > span:nth-child(1)", "{groom.nick}"),
  text(".cover__names > span:nth-child(3)", "{bride.nick}"),
  text(".cover__date", "{x.e.0.dots}"),
  text("#guestName", "{cover.guest_label}", "cover.guest_label"),

  // ---- hero ----
  img(".hero__photo img", "media.hero||media.cover", "{x.names}"),
  text(".hero__names > span:nth-child(1)", "{groom.nick}"),
  text(".hero__names > span:nth-child(3)", "{bride.nick}"),
  text(".hero__date", "{x.e.0.weekday} · {x.e.0.long}"),
  text(".hero__tagline", "{hero.tagline}", "hero.tagline"),

  // ---- pembuka ----
  text("#opening .kicker", "{opening.greeting}", "opening.greeting"),
  text(".verse__text", "“{opening.verse}”", "opening.verse"),
  text(".verse__source", "{opening.verse_source}"),
  hideUnless(".verse", "opening.verse"),
  text(".opening__text", "{opening.text}", "opening.text"),

  // ---- mempelai ----
  img(".person--start .person__photo img", "media.groom", "{groom.nick}"),
  attrs(".person--start .person__photo img", { alt: "{groom.nick}" }),
  attrs(".person--start a.ig", { "aria-label": "Instagram {groom.nick}" }),
  text(".person--start .person__nick", "{groom.nick}"),
  text(".person--start .person__full", "{groom.full}"),
  html(".person--start .person__parents", "{groom.order_label}<br><b>Bapak {groom.father} &amp; Ibu {groom.mother}</b>"),
  attrs(".person--start a.ig", { href: "{x.ig.groom}" }, "x.ig.groom"),
  hideUnless(".person--start a.ig", "x.ig.groom"),
  img(".person--end .person__photo img", "media.bride", "{bride.nick}"),
  attrs(".person--end .person__photo img", { alt: "{bride.nick}" }),
  attrs(".person--end a.ig", { "aria-label": "Instagram {bride.nick}" }),
  text(".person--end .person__nick", "{bride.nick}"),
  text(".person--end .person__full", "{bride.full}"),
  html(".person--end .person__parents", "{bride.order_label}<br><b>Bapak {bride.father} &amp; Ibu {bride.mother}</b>"),
  attrs(".person--end a.ig", { href: "{x.ig.bride}" }, "x.ig.bride"),
  hideUnless(".person--end a.ig", "x.ig.bride"),

  // ---- kalender ----
  text(".calendar__month", "{x.e.0.month}"),
  text(".calendar__year", "{x.e.0.year}"),
];

// ---- cerita (3 kartu) ----
for (let i = 0; i < 3; i++) {
  const c = `#storyStack > .story-card:nth-of-type(${i + 1})`;
  b.push(
    img(`${c} .story-card__media img`, `media.story_${i + 1}||media.gallery.${i}||media.cover`, `{story.${i}.title}`),
    text(`${c} .story-card__meta`, `{story.${i}.year}`),
    text(`${c} .story-card__title`, `{story.${i}.title}`),
    text(`${c} .story-card__text`, `{story.${i}.text}`),
  );
}

// ---- acara (2 kartu) ----
for (let i = 0; i < 2; i++) {
  const c = `.event-list > .event:nth-of-type(${i + 1})`;
  b.push(
    text(`${c} .event__kind`, `{events.${i}.title}`),
    text(`${c} .event__title`, `{events.${i}.tagline}`),
    text(`${c} .event__date strong`, `{x.e.${i}.day}`),
    attrs(`${c} .event__date strong`, { "data-count": `{x.e.${i}.day}` }),
    text(`${c} .event__date-meta > span:nth-child(1)`, `{x.e.${i}.weekday}`),
    text(`${c} .event__date-meta > span:nth-child(2)`, `{x.e.${i}.monthYear}`),
    tx(`${c} .event__time`, `{x.e.${i}.time}`),
    text(`${c} .event__desc`, `{events.${i}.desc}`),
    text(`${c} .event__place strong`, `{events.${i}.venue}`),
    text(`${c} .event__place span`, `{events.${i}.address}`),
    attrs(`${c} a.btn`, { href: `{x.e.${i}.maps}` }),
  );
}

// ---- dress code ----
b.push(text(".attire__note", "{attire.note}", "attire.note"), hideUnless(".attire__note", "attire.note"));
for (let i = 0; i < 5; i++) {
  const c = `#swatches > .swatch:nth-child(${i + 1})`;
  b.push(
    attrs(`${c} .swatch__fill`, { style: `background:{attire.colors.${i}.hex}` }),
    text(`${c} .swatch__name`, `{attire.colors.${i}.name}`),
    removeUnless(c, `attire.colors.${i}.name`),
  );
}

// ---- live ----
b.push(
  hideUnless("#live", "live.enabled"),
  attrs("a.stream", { href: "{x.liveUrl}" }, "x.liveUrl"),
  img(".stream__image", "media.live||media.cover"),
  text(".stream__badge-via", "{live.platform}", "live.platform"),
  text(".stream__title", "{live.title}", "live.title"),
  text(".stream__meta", "{x.e.0.longComma} · {x.e.0.start} via {live.platform}"),
);

// ---- galeri (maks 9; frame ke-2 dst dihapus bila tak ada foto) ----
for (let i = 0; i < 9; i++) {
  const c = `.flow__stage > .flow__card:nth-of-type(${i + 1})`;
  if (i > 0) b.push(removeUnless(c, `media.gallery.${i}`));
  const src = i === 0 ? "media.gallery.0||media.cover" : `media.gallery.${i}`;
  b.push(attrs(`${c} img`, { src: `{${src}}`, "data-full": `{${src}}` }, src));
}

// ---- kutipan ----
b.push(
  img(".quote__window img", "media.quote||media.hero||media.cover"),
  text(".quote__text", "{quote.text}", "quote.text"),
  text(".quote__author", "{quote.author}"),
  hideUnless("#quote", "quote.text"),
);

// ---- amplop digital ----
b.push(hideUnless("#gift", "gift.enabled"), hideUnless('a[href="#gift"]', "gift.enabled"));
for (let i = 0; i < 2; i++) {
  const c = `.gift__content > .bank:nth-of-type(${i + 1})`;
  b.push(
    text(`${c} .bank__name`, `{gift.banks.${i}.bank}`),
    text(`${c} .bank__number`, `{gift.banks.${i}.number}`),
    text(`${c} .bank__holder`, `a.n. {gift.banks.${i}.holder}`),
    attrs(`${c} button[data-copy]`, { "data-copy": `{gift.banks.${i}.number}` }),
    removeUnless(c, `gift.banks.${i}.number`),
  );
}
b.push(
  text(".parcel__name", "{gift.recipient}"),
  text(".parcel__text", "{gift.address}"),
  attrs(".parcel button[data-copy]", { "data-copy": "{gift.recipient}, {gift.address}" }),
  hideUnless(".parcel", "gift.address"),
  hideUnless(".gift__content > h3:nth-of-type(2)", "gift.address"),
);

// ---- penutup ----
b.push(
  text("#closing .title", "{closing.heading}", "closing.heading"),
  img(".farewell__photo img", "media.closing||media.cover", "{x.names}"),
  text(".farewell__text", "{closing.text}", "closing.text"),
  html(".farewell__names", '{groom.nick}<span class="amp">&amp;</span>{bride.nick}'),
  html(".farewell__families", "{closing.families:br}"),
  text(".footer__names", "{x.names}"),
  text(".footer__date", "{x.e.0.dots}"),
);

export const antheia: TemplateManifest = {
  slug: "antheia",
  title: "Antheia",
  version: 1,
  titlePrefix: "Pawiwahan",
  groups: commonGroups({ closingHeading: true }),
  slots: commonSlots(9, [slot("hero", "Foto halaman utama", { fallback: "sampul" })]),
  bindings: b,
  defaultContent: {
    groom: { nick: "John", full: "John Hadiwijaya", order_label: "Putra kedua dari", father: "Hendra Wijaya", mother: "Ratna Sari", instagram: "" },
    bride: { nick: "Jane", full: "Jane Kusumawardani", order_label: "Putri pertama dari", father: "Bambang Kusuma", mother: "Sri Lestari", instagram: "" },
    cover: { guest_label: "Tamu Kehormatan" },
    hero: { tagline: "Dua jiwa, satu doa, berjalan seiring dalam ridha-Nya." },
    opening: {
      greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
      verse: "Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat kebesaran Allah.",
      verse_source: "QS. Adz-Dzariyat : 49",
      text: "Dengan memohon rahmat dan ridha Allah Subhanahu wa Ta’ala, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
    },
    events: [
      { title: "Akad Nikah", tagline: "Janji Suci", date: "2027-09-18", start: "08:00", end: "10:00", tz: "WIB", venue: "Masjid Nurul Huda", address: "Jl. Kaliurang Km. 7, Sleman, Yogyakarta", maps_url: "", desc: "Ikrar sakral yang disaksikan keluarga inti dan kerabat terdekat." },
      { title: "Resepsi", tagline: "Pawiwahan", date: "2027-09-18", start: "11:00", end: "14:00", tz: "WIB", venue: "Pendopo Ndalem Larasati", address: "Jl. Prawirotaman No. 8, Yogyakarta", maps_url: "", desc: "Ramah tamah dan syukuran bersama keluarga besar serta para sahabat." },
    ],
    story: [
      { year: "2019", title: "Perjumpaan Pertama", text: "Kami bertemu di sebuah pameran batik di Yogyakarta. Obrolan singkat tentang motif parang berujung pada janji minum teh sore itu." },
      { year: "2022", title: "Menumbuhkan Rasa", text: "Jarak dua kota tak pernah benar-benar memisahkan. Surat, panggilan larut malam, dan doa yang sama menjaga kami tetap dekat." },
      { year: "2026", title: "Ikatan Lamaran", text: "Di ruang tamu yang hangat, dua keluarga duduk bersama. Sebentuk cincin dan restu orang tua menandai langkah menuju pelaminan." },
    ],
    attire: {
      note: "Batik dan kebaya sangat kami nantikan. Mohon hindari busana putih polos.",
      colors: [
        { name: "Biru Dongker", hex: "#1f2e5c" }, { name: "Biru Safir", hex: "#4b6aa3" }, { name: "Biru Langit", hex: "#9dbbe0" },
        { name: "Gading", hex: "#f1ece0" }, { name: "Emas Antik", hex: "#b39150" },
      ],
    },
    live: { enabled: false, platform: "YouTube", title: "Akad Nikah", url: "" },
    quote: { text: "Cinta tidak terdiri dari saling memandang, tetapi memandang bersama ke arah yang sama.", author: "Antoine de Saint-Exupéry" },
    rsvp: { max_guests: 2 },
    gift: { enabled: true, banks: [{ bank: "", number: "", holder: "" }, { bank: "", number: "", holder: "" }], recipient: "", address: "" },
    closing: {
      heading: "Matur Nuwun",
      text: "Kehadiran serta doa restu Bapak/Ibu/Saudara/i akan menjadi kehormatan dan kebahagiaan yang tak ternilai bagi kami sekeluarga.",
      families: "Keluarga Besar Bapak Hendra Wijaya\n& Keluarga Besar Bapak Bambang Kusuma",
    },
    music: { youtube: "https://youtu.be/e1mOmdykmwI", start: 2 },
    site: { title: "", description: "" },
    media: {},
  },
};
