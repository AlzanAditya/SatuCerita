import type { Binding, FieldDef, GroupDef, SlotDef } from "./types";

// ---- builder binding ----
export const text = (sel: string, t: string, when?: string): Binding => ({ sel, text: t, ...(when ? { when } : {}) });
export const tx = (sel: string, t: string, when?: string): Binding => ({ sel, tx: t, ...(when ? { when } : {}) });
export const html = (sel: string, h: string, when?: string): Binding => ({ sel, html: h, ...(when ? { when } : {}) });
export const attrs = (sel: string, a: Record<string, string>, when?: string): Binding => ({ sel, attrs: a, ...(when ? { when } : {}) });
export const removeUnless = (sel: string, path: string): Binding => ({ sel, removeUnless: path });
export const hideUnless = (sel: string, path: string): Binding => ({ sel, hideUnless: path });
/** Ganti foto: hanya bila path terisi (kalau tidak, foto bawaan template tetap tampil). `fb` = rantai fallback `a||b`. */
export const img = (sel: string, fb: string, alt?: string): Binding =>
  attrs(sel, { src: `{${fb}}`, ...(alt ? { alt } : {}) }, fb);

// ---- builder field ----
export const F = (path: string, label: string, type: FieldDef["type"], o: Partial<FieldDef> = {}): FieldDef => ({ path, label, type, ...o });

const TZ = [{ value: "WIB", label: "WIB" }, { value: "WITA", label: "WITA" }, { value: "WIT", label: "WIT" }];

export function personGroup(who: "groom" | "bride"): GroupDef {
  const pria = who === "groom";
  const p = (k: string) => `${who}.${k}`;
  const s = pria ? "pria" : "wanita";
  return {
    id: who,
    title: pria ? "Mempelai Pria" : "Mempelai Wanita",
    step: 0,
    icon: "users",
    fields: [
      F(p("nick"), `Nama panggilan ${s}`, "text", { max: 20, required: true, half: true }),
      F(p("full"), `Nama lengkap ${s}`, "text", { max: 60, required: true, half: true }),
      F(p("order_label"), "Keterangan anak ke-", "text", { max: 40, placeholder: pria ? "Putra kedua dari" : "Putri pertama dari" }),
      F(p("father"), "Nama ayah (tanpa “Bapak”)", "text", { max: 60, half: true }),
      F(p("mother"), "Nama ibu (tanpa “Ibu”)", "text", { max: 60, half: true }),
      F(p("instagram"), "Instagram (opsional)", "text", { max: 60, placeholder: "username atau link" }),
    ],
  };
}

export function eventGroup(i: number): GroupDef {
  const p = (k: string) => `events.${i}.${k}`;
  return {
    id: `event${i}`,
    title: `Acara ${i + 1}`,
    step: 0,
    icon: "calendar",
    hint: i === 0 ? "Tanggal acara pertama dipakai untuk hitung mundur dan kalender." : undefined,
    fields: [
      F(p("title"), "Nama acara", "text", { max: 40, required: true, half: true }),
      F(p("tagline"), "Judul kecil", "text", { max: 40, half: true }),
      F(p("date"), "Tanggal", "date", { required: true }),
      F(p("start"), "Mulai", "time", { required: true, half: true }),
      F(p("end"), "Selesai", "time", { half: true }),
      F(p("tz"), "Zona waktu", "select", { options: TZ }),
      F(p("venue"), "Nama tempat", "text", { max: 80, required: true }),
      F(p("address"), "Alamat lengkap", "text", { max: 160 }),
      F(p("maps_url"), "Link Google Maps (opsional)", "url", { max: 300, placeholder: "https://maps.app.goo.gl/…", help: "Kosongkan agar dibuat otomatis dari nama tempat dan alamat." }),
      F(p("desc"), "Keterangan singkat", "textarea", { max: 200 }),
    ],
  };
}

export function commonGroups(opts: { closingHeading: boolean }): GroupDef[] {
  const bank = (i: number): FieldDef[] => [
    F(`gift.banks.${i}.bank`, `Rekening ${i + 1} · Bank`, "text", { max: 30, half: true }),
    F(`gift.banks.${i}.number`, `Rekening ${i + 1} · Nomor`, "text", { max: 30, half: true }),
    F(`gift.banks.${i}.holder`, `Rekening ${i + 1} · Atas nama`, "text", { max: 60 }),
  ];
  const story: FieldDef[] = [0, 1, 2].flatMap((i) => [
    F(`story.${i}.year`, `Kisah ${i + 1} · Tahun`, "text", { max: 10, half: true }),
    F(`story.${i}.title`, `Kisah ${i + 1} · Judul`, "text", { max: 40, half: true }),
    F(`story.${i}.text`, `Kisah ${i + 1} · Cerita`, "textarea", { max: 240 }),
  ]);
  const colors: FieldDef[] = [0, 1, 2, 3, 4].flatMap((i) => [
    F(`attire.colors.${i}.name`, `Warna ${i + 1} · Nama`, "text", { max: 24, half: true, help: i > 0 ? "Kosongkan untuk menyembunyikan." : undefined }),
    F(`attire.colors.${i}.hex`, `Warna ${i + 1} · Kode`, "color", { half: true }),
  ]);
  return [
    personGroup("groom"),
    personGroup("bride"),
    eventGroup(0),
    eventGroup(1),
    {
      id: "opening", title: "Ucapan Pembuka", step: 2, icon: "quote",
      fields: [
        F("cover.guest_label", "Sebutan tamu di sampul", "text", { max: 40, help: "Tampil bila tamu membuka link tanpa nama." }),
        F("hero.tagline", "Kalimat sambutan di halaman utama", "textarea", { max: 160 }),
        F("opening.greeting", "Salam pembuka", "text", { max: 80 }),
        F("opening.verse", "Ayat / kutipan pembuka", "textarea", { max: 400 }),
        F("opening.verse_source", "Sumber kutipan", "text", { max: 60 }),
        F("opening.text", "Paragraf undangan", "textarea", { max: 320 }),
      ],
    },
    { id: "story", title: "Cerita Cinta", step: 2, icon: "heart", fields: story },
    { id: "quote", title: "Kutipan", step: 2, icon: "quote", fields: [F("quote.text", "Kutipan", "textarea", { max: 200 }), F("quote.author", "Penulis kutipan", "text", { max: 60 })] },
    { id: "attire", title: "Dress Code", step: 2, icon: "palette", fields: [F("attire.note", "Catatan busana", "textarea", { max: 200 }), ...colors] },
    {
      id: "live", title: "Siaran Langsung", step: 2, icon: "video", toggle: "live.enabled",
      fields: [
        F("live.platform", "Platform", "text", { max: 20, placeholder: "YouTube", half: true }),
        F("live.title", "Judul siaran", "text", { max: 80, half: true }),
        F("live.url", "Link siaran", "url", { max: 300, placeholder: "https://youtube.com/live/…" }),
      ],
    },
    {
      id: "gift", title: "Amplop Digital", step: 2, icon: "gift", toggle: "gift.enabled",
      fields: [...bank(0), ...bank(1), F("gift.recipient", "Penerima kado fisik", "text", { max: 60 }), F("gift.address", "Alamat pengiriman kado", "textarea", { max: 200 })],
    },
    {
      id: "closing", title: "Penutup", step: 2, icon: "heart",
      fields: [
        ...(opts.closingHeading ? [F("closing.heading", "Judul penutup", "text", { max: 40 })] : []),
        F("closing.text", "Pesan penutup", "textarea", { max: 300 }),
        F("closing.families", "Nama keluarga (boleh 2 baris)", "textarea", { max: 160 }),
      ],
    },
    {
      id: "rsvp", title: "RSVP & Ucapan", step: 2, icon: "users",
      fields: [F("rsvp.max_guests", "Maksimal tamu per konfirmasi", "number", { min: 1, maxNum: 10 })],
    },
    {
      id: "music", title: "Musik Latar", step: 2, icon: "music",
      fields: [
        F("music.youtube", "Link / ID video YouTube", "text", { max: 120, placeholder: "https://youtu.be/…", help: "Kosongkan untuk mematikan musik." }),
        F("music.start", "Mulai dari detik ke-", "number", { min: 0, maxNum: 3600 }),
      ],
    },
    {
      id: "site", title: "Judul & Pratinjau Link", step: 2, icon: "file",
      hint: "Tampil saat link dibagikan di WhatsApp dan media sosial. Kosongkan untuk otomatis.",
      fields: [F("site.title", "Judul halaman", "text", { max: 80 }), F("site.description", "Deskripsi singkat", "textarea", { max: 160 })],
    },
  ];
}

export const slot = (s: string, label: string, o: Partial<SlotDef> = {}): SlotDef => ({ slot: s, label, step: 1, max: 1, ...o });

export function commonSlots(galleryMax: number, extra: SlotDef[] = []): SlotDef[] {
  return [
    slot("cover", "Foto sampul", { required: true, hint: "Foto utama berdua (rasio potret)." }),
    slot("groom", "Foto mempelai pria", { required: true, round: true }),
    slot("bride", "Foto mempelai wanita", { required: true, round: true }),
    ...extra,
    slot("story_1", "Foto kisah 1", { fallback: "galeri / sampul" }),
    slot("story_2", "Foto kisah 2", { fallback: "galeri / sampul" }),
    slot("story_3", "Foto kisah 3", { fallback: "galeri / sampul" }),
    slot("quote", "Foto kutipan", { fallback: "sampul" }),
    slot("live", "Foto siaran langsung", { fallback: "sampul" }),
    slot("closing", "Foto penutup", { fallback: "sampul" }),
    slot("gallery", "Galeri foto", { step: 3, max: galleryMax }),
  ];
}
