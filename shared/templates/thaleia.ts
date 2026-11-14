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
  html(".showcase__names", '{groom.nick}<span class="showcase__amp">&amp;</span>{bride.nick}'),
  text(".showcase__date", "{x.e.0.dots}"),
  text(".menu__names", "{x.names}"),

  // ---- sampul ----
  img(".cover__photo img", "media.cover", "{x.names}"),
  text(".cover__names > span:nth-child(1)", "{groom.nick}"),
  text(".cover__names > span:nth-child(3)", "{bride.nick}"),
  text(".cover__date", "{x.e.0.dots}"),
  text("#guestName", "{cover.guest_label}", "cover.guest_label"),
  html(".env__names", '{groom.nick}<span class="amp">&amp;</span>{bride.nick}'),
  text(".env__date", "{x.e.0.dots}"),

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

  // ---- mempelai (pria di awal, wanita di akhir) ----
  img(".person--start .person__photo img", "media.groom", "{groom.nick}"),
  attrs(".person--start .person__photo img", { alt: "{groom.nick}" }),
  attrs(".person--start a.ig", { "aria-label": "Instagram {groom.nick}" }),
  text(".person--start .person__nick", "{groom.nick}"),
  text(".person--start .person__full", "{groom.full}"),
  html(".person--start .person__parents", "{groom.order_label}<span>Bapak {groom.father} &amp; Ibu {groom.mother}</span>"),
  attrs(".person--start a.ig", { href: "{x.ig.groom}" }, "x.ig.groom"),
  tx(".person--start a.ig", "{x.ig.groomAt}", "x.ig.groomAt"),
  hideUnless(".person--start a.ig", "x.ig.groom"),
  img(".person--end .person__photo img", "media.bride", "{bride.nick}"),
  attrs(".person--end .person__photo img", { alt: "{bride.nick}" }),
  attrs(".person--end a.ig", { "aria-label": "Instagram {bride.nick}" }),
  text(".person--end .person__nick", "{bride.nick}"),
  text(".person--end .person__full", "{bride.full}"),
  html(".person--end .person__parents", "{bride.order_label}<span>Bapak {bride.father} &amp; Ibu {bride.mother}</span>"),
  attrs(".person--end a.ig", { href: "{x.ig.bride}" }, "x.ig.bride"),
  tx(".person--end a.ig", "{x.ig.brideAt}", "x.ig.brideAt"),
  hideUnless(".person--end a.ig", "x.ig.bride"),

  // ---- kalender (hitung mundur & tautan kalender dibaca JS dari INVITATION yang disuntik Worker) ----
  text(".calendar__month", "{x.e.0.month}"),
  text(".calendar__year", "{x.e.0.year}"),
];

// ---- kisah (3 bab bergaya perangko) ----
for (let i = 0; i < 3; i++) {
  const c = `#timeline > .milestone:nth-of-type(${i + 1})`;
  b.push(
    img(`${c} .stamp__media img`, `media.story_${i + 1}||media.gallery.${i}||media.cover`, `{story.${i}.title}`),
    text(`${c} .milestone__year`, `{story.${i}.year}`),
    text(`${c} .milestone__title`, `{story.${i}.title}`),
    text(`${c} .milestone__text`, `{story.${i}.text}`),
  );
}

// ---- acara (2 tiket) ----
for (let i = 0; i < 2; i++) {
  const c = `.tickets > .ticket:nth-of-type(${i + 1})`;
  b.push(
    text(`${c} .ticket__kind`, `{events.${i}.title}`),
    text(`${c} .ticket__title`, `{events.${i}.tagline}`),
    text(`${c} .ticket__date > span:nth-child(1)`, `{x.e.${i}.weekday}`),
    text(`${c} .ticket__day`, `{x.e.${i}.day}`),
    attrs(`${c} .ticket__day`, { "data-day": `{x.e.${i}.day}` }),
    text(`${c} .ticket__date > span:nth-child(3)`, `{x.e.${i}.monthShortYear}`),
    tx(`${c} .ticket__time`, `{x.e.${i}.time}`),
    text(`${c} .ticket__desc`, `{events.${i}.desc}`),
    html(`${c} .ticket__place`, `<strong>{events.${i}.venue}</strong>{events.${i}.address}`),
    attrs(`${c} a.btn`, { href: `{x.e.${i}.maps}` }),
  );
}

// ---- dress code (5 warna di tali jemuran; JS membaca #swatches [data-color]) ----
b.push(text(".attire__note", "{attire.note}", "attire.note"), hideUnless(".attire__note", "attire.note"));
for (let i = 0; i < 5; i++) {
  const c = `#swatches > span:nth-child(${i + 1})`;
  b.push(
    attrs(c, { "data-color": `{attire.colors.${i}.hex}` }),
    text(c, `{attire.colors.${i}.name}`),
    removeUnless(c, `attire.colors.${i}.name`),
  );
}

// ---- live ----
b.push(
  hideUnless("#live", "live.enabled"),
  attrs("a.stream", { href: "{x.liveUrl}" }, "x.liveUrl"),
  img(".stream__image", "media.live||media.cover"),
  text(".stream__badge", "Live · {live.platform}", "live.platform"),
  text(".stream__title", "{live.title}", "live.title"),
  text(".stream__meta", "{x.e.0.longComma} · {x.e.0.start} via {live.platform}"),
);

// ---- galeri (maks 9 kartu; kartu ke-2 dst dihapus bila tak ada foto) ----
for (let i = 0; i < 9; i++) {
  const c = `#deckStage > .deck__card:nth-of-type(${i + 1})`;
  if (i > 0) b.push(removeUnless(c, `media.gallery.${i}`));
  const src = i === 0 ? "media.gallery.0||media.cover" : `media.gallery.${i}`;
  b.push(attrs(c, { "data-caption": "{x.names}" }), attrs(`${c} img`, { src: `{${src}}`, "data-full": `{${src}}` }, src));
}

// ---- kutipan ----
b.push(
  img(".quote__lens img", "media.quote||media.hero||media.cover"),
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
  img(".farewell__photo img", "media.closing||media.cover", "{x.names}"),
  text(".farewell__text", "{closing.text}", "closing.text"),
  html(".farewell__names", '{groom.nick}<span class="amp">&amp;</span>{bride.nick}'),
  html(".farewell__families", "{closing.families:br}"),
  text(".footer__names", "{x.names}"),
  text(".footer__date", "{x.e.0.dots}"),
);

export const thaleia: TemplateManifest = {
  slug: "thaleia",
  title: "Thaleia",
  version: 1,
  titlePrefix: "Pernikahan",
  groups: commonGroups({ closingHeading: false }),
  slots: commonSlots(9, [slot("hero", "Foto halaman utama", { fallback: "sampul" })]),
  bindings: b,
  defaultContent: {
    groom: { nick: "John", full: "John Pradipta Wiratama", order_label: "Putra pertama dari", father: "Agus Wiratama", mother: "Dewi Lestari", instagram: "" },
    bride: { nick: "Jane", full: "Jane Ayu Maharani", order_label: "Putri kedua dari", father: "Suryo Hadinoto", mother: "Rina Kartika", instagram: "" },
    cover: { guest_label: "Tamu Undangan" },
    hero: { tagline: "Seperti melati yang dironce satu demi satu, kami merangkai hari menuju satu janji." },
    opening: {
      greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
      verse: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
      verse_source: "QS. Ar-Rum : 21",
      text: "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir dan memberikan doa restu pada pernikahan kami.",
    },
    events: [
      { title: "Akad Nikah", tagline: "Ijab Kabul", date: "2027-11-20", start: "08:00", end: "10:00", tz: "WIB", venue: "Masjid Raya Al-Ukhuwah", address: "Jl. Wastukencana No. 27, Bandung", maps_url: "", desc: "Prosesi sakral yang disaksikan keluarga dan kerabat terdekat." },
      { title: "Resepsi", tagline: "Walimatul ‘Ursy", date: "2027-11-20", start: "11:00", end: "14:00", tz: "WIB", venue: "Pendopo Kota Bandung", address: "Jl. Dalem Kaum No. 56, Bandung", maps_url: "", desc: "Jamuan hangat untuk berbagi bahagia bersama keluarga besar dan sahabat." },
    ],
    story: [
      { year: "2020", title: "Awal Bersua", text: "Sebuah kedai kopi di sudut Braga mempertemukan kami dalam antrean yang terlalu panjang dan obrolan yang terasa terlalu singkat." },
      { year: "2023", title: "Saling Menjaga", text: "Tahun demi tahun berjalan beriringan, belajar memahami tanpa harus selalu sepakat, dan tetap memilih satu sama lain." },
      { year: "2027", title: "Lamaran", text: "Di hadapan kedua keluarga, sebentuk cincin dan seuntai melati menjadi saksi niat baik kami untuk melangkah bersama." },
    ],
    attire: {
      note: "Batik maupun kain tradisional sangat kami persilakan. Mohon hindari busana serba putih.",
      colors: [
        { name: "Putih Melati", hex: "#f4f1e6" }, { name: "Hijau Sage", hex: "#9aab8c" }, { name: "Hijau Zaitun", hex: "#5e6b4e" },
        { name: "Krem Pasir", hex: "#d9c9a8" }, { name: "Cokelat Kayu", hex: "#8a6a4a" },
      ],
    },
    live: { enabled: false, platform: "YouTube", title: "Akad Nikah", url: "" },
    quote: { text: "Aku mencintaimu bukan hanya karena siapa dirimu, tetapi karena siapa diriku saat bersamamu.", author: "Roy Croft" },
    rsvp: { max_guests: 2 },
    gift: { enabled: true, banks: [{ bank: "", number: "", holder: "" }, { bank: "", number: "", holder: "" }], recipient: "", address: "" },
    closing: {
      text: "Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doanya, kami ucapkan terima kasih.",
      families: "Keluarga Bapak Agus Wiratama\n& Keluarga Bapak Suryo Hadinoto",
    },
    music: { youtube: "https://youtu.be/GRC_iiZtAkA", start: 0 },
    site: { title: "", description: "" },
    media: {},
  },
};
