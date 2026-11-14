/**
 * Editor undangan 5 langkah (Data, Foto, Cerita, Galeri, Selesai) yang digerakkan oleh MANIFEST template:
 * field & slot foto datang dari API (/api/invitations/:id), jadi menambah template tidak perlu mengubah halaman ini.
 * Teks disimpan otomatis ke Supabase (lewat Worker), foto diunggah ke R2.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Calendar, Check, Eye, Gift, Heart, ImagePlus, Loader2, Music, FileText, Palette, Plus, Quote, Share2, Trash2, Users, Video, X, MapPin, Link2,
} from "lucide-react";
import {
  compressImage, deleteMedia, getInvitation, listInvitations, previewUrl, publishInvitation, saveInvitation, uploadMedia,
  type Content, type InvitationDetail, type MediaItem,
} from "@/lib/invitationApi";
import type { FieldDef, GroupDef, PublicManifest, SlotDef } from "../../../shared/templates/types";
import { clone, getPath, isEmpty, setPath } from "../../../shared/templates/path";
import { EDIT_STEPS, FINAL_PROGRESS, isEditFinished } from "@/lib/editSteps";

export interface EditUndanganPageProps {
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
}

const STEPS = EDIT_STEPS;
const LAST_STEP = STEPS.length - 1;

const ICONS: Record<GroupDef["icon"], React.ElementType> = {
  users: Users, calendar: Calendar, quote: Quote, heart: Heart, file: FileText, palette: Palette, video: Video, gift: Gift, music: Music, map: MapPin,
};

const card = "rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(94,75,180,0.07)]";
const inputCls =
  "w-full h-12 rounded-xl border border-[#e0daf5] bg-white px-3.5 text-[15px] text-[#17112e] placeholder:text-[#a39cc4] focus:outline-none focus:border-[#7d6aee] focus:ring-2 focus:ring-[#7d6aee]/20";
const btnPrimary =
  "h-12 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] disabled:opacity-60 text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer";

const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-[#7d6aee]" : "bg-[#d4ccf5]"}`}>
    <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
  </button>
);

const FieldInput: React.FC<{ f: FieldDef; value: unknown; error?: string; onChange: (v: unknown) => void }> = ({ f, value, error, onChange }) => {
  const id = `f-${f.path}`;
  const v = value == null ? "" : String(value);
  let input: React.ReactNode;
  switch (f.type) {
    case "textarea":
      input = (
        <>
          <textarea id={id} rows={3} maxLength={f.max} value={v} onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-[#e0daf5] bg-white p-3.5 text-[15px] text-[#17112e] focus:outline-none focus:border-[#7d6aee] focus:ring-2 focus:ring-[#7d6aee]/20" />
          {f.max ? <p className="mt-1 text-right text-[11px] text-[#a39cc4]">{v.length}/{f.max}</p> : null}
        </>
      );
      break;
    case "select":
      input = (
        <select id={id} value={v} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    case "color":
      input = (
        <div className="flex items-center gap-2">
          <input id={id} type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#cccccc"} onChange={(e) => onChange(e.target.value)} className="h-12 w-16 rounded-xl border border-[#e0daf5] bg-white p-1 cursor-pointer" />
          <span className="text-sm text-[#5a5476] tabular-nums">{v}</span>
        </div>
      );
      break;
    case "toggle":
      input = <Switch on={value === true} onChange={onChange} label={f.label} />;
      break;
    default: {
      const t = f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "url" ? "url" : f.type === "number" ? "number" : "text";
      input = (
        <input id={id} type={t} inputMode={t === "number" ? "numeric" : undefined} min={f.min} max={f.type === "number" ? f.maxNum : undefined}
          maxLength={t === "text" || t === "url" ? f.max : undefined} placeholder={f.placeholder} value={v} autoComplete="off"
          onChange={(e) => onChange(t === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} className={inputCls} />
      );
    }
  }
  return (
    <div className={`mb-3 ${f.half ? "" : "col-span-2"}`}>
      <label htmlFor={id} className="block text-xs text-[#5a5476] mb-1.5">{f.label}{f.required ? <span className="text-[#e0457b]"> *</span> : null}</label>
      {input}
      {f.help && !error ? <p className="mt-1 text-[11px] text-[#7a7494]">{f.help}</p> : null}
      {error ? <p role="alert" className="mt-1 text-xs text-[#d92d62]">{error}</p> : null}
    </div>
  );
};

const GroupCard: React.FC<{ g: GroupDef; content: Content; errors: Record<string, string>; onSet: (path: string, v: unknown) => void }> = ({ g, content, errors, onSet }) => {
  const Icon = ICONS[g.icon] ?? FileText;
  const on = g.toggle ? getPath(content, g.toggle) === true : true;
  return (
    <section className={card}>
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="flex-1 flex items-center gap-2.5 text-[15px] font-extrabold text-[#17112e]"><Icon className="w-5 h-5 text-[#7d6aee]" />{g.title}</h3>
        {g.toggle ? <Switch on={on} onChange={(v) => onSet(g.toggle!, v)} label={`Tampilkan ${g.title}`} /> : null}
      </div>
      {g.hint ? <p className="-mt-1 mb-3 text-xs text-[#7a7494]">{g.hint}</p> : null}
      {on ? (
        <div className="grid grid-cols-2 gap-x-3">
          {g.fields.map((f) => <FieldInput key={f.path} f={f} value={getPath(content, f.path)} error={errors[f.path]} onChange={(v) => onSet(f.path, v)} />)}
        </div>
      ) : <p className="text-xs text-[#7a7494]">Bagian ini disembunyikan dari undangan.</p>}
    </section>
  );
};

const SlotCard: React.FC<{
  s: SlotDef; items: MediaItem[]; busy: boolean; error?: string; onPick: (slot: string, files: FileList | null) => void; onRemove: (m: MediaItem) => void;
}> = ({ s, items, busy, error, onPick, onRemove }) => {
  const input = useRef<HTMLInputElement>(null);
  const full = items.length >= s.max;
  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[15px] font-extrabold text-[#17112e]">{s.label}{s.required ? <span className="text-[#e0457b]"> *</span> : null}</h3>
          {s.hint ? <p className="text-xs text-[#7a7494] mt-0.5">{s.hint}</p> : null}
          {s.fallback && !s.required ? <p className="text-xs text-[#7a7494] mt-0.5">Opsional. Kosong = memakai {s.fallback}.</p> : null}
          {s.max > 1 ? <p className="text-xs text-[#7a7494] mt-0.5">{items.length}/{s.max} foto</p> : null}
        </div>
        {!full || s.max === 1 ? (
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="h-10 px-3.5 rounded-xl border border-dashed border-[#bdb2f2] text-[#5b49c9] text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#f1edff] cursor-pointer disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : s.max === 1 ? <ImagePlus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {s.max === 1 ? (items.length ? "Ganti" : "Unggah") : "Tambah"}
          </button>
        ) : null}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={s.max > 1} className="hidden"
          onChange={(e) => { onPick(s.slot, e.target.files); e.target.value = ""; }} />
      </div>
      {items.length ? (
        <div className={`grid gap-2 ${s.max === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
          {items.map((m) => (
            <div key={m.id} className={`relative overflow-hidden bg-[#efeaff] ${s.round && s.max === 1 ? "mx-auto size-40 rounded-full" : s.max === 1 ? "aspect-[4/5] max-h-72 w-full rounded-xl" : "aspect-square rounded-xl"}`}>
              <img src={m.url} alt="" className="size-full object-cover" loading="lazy" />
              <button type="button" aria-label="Hapus foto" onClick={() => onRemove(m)}
                className="absolute top-1.5 right-1.5 size-7 rounded-full bg-[#17112e]/70 text-white flex items-center justify-center cursor-pointer hover:bg-[#17112e]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-[#a39cc4]">Belum ada foto.</p>}
      {error ? <p role="alert" className="mt-2 text-xs text-[#d92d62]">{error}</p> : null}
    </section>
  );
};

type Load = { state: "loading" } | { state: "empty" } | { state: "error"; msg: string } | { state: "ready" };

export const EditUndanganPage: React.FC<EditUndanganPageProps> = ({ onNavigate, showToast }) => {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [inv, setInv] = useState<InvitationDetail | null>(null);
  const [manifest, setManifest] = useState<PublicManifest | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [content, setContent] = useState<Content>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, setSave] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);

  const contentRef = useRef(content);
  contentRef.current = content;
  const dirty = useRef(false);

  // ---- muat ----
  useEffect(() => {
    let off = false;
    (async () => {
      const list = await listInvitations();
      if (off) return;
      if (!list.ok) return setLoad({ state: "error", msg: list.data.error || "Gagal memuat undangan." });
      const wanted = new URLSearchParams(location.search).get("id");
      const pick = list.data.invitations.find((i) => i.id === wanted) ?? list.data.invitations[0];
      if (!pick) return setLoad({ state: "empty" });
      const d = await getInvitation(pick.id);
      if (off) return;
      if (!d.ok) return setLoad({ state: "error", msg: d.data.error || "Gagal memuat undangan." });
      setInv(d.data.invitation);
      setManifest(d.data.manifest);
      setMedia(d.data.media);
      setContent(d.data.invitation.content);
      setSlug(d.data.invitation.slug);
      setStep(Math.min(d.data.invitation.progressStep, LAST_STEP));
      setLoad({ state: "ready" });
    })();
    return () => { off = true; };
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); headRef.current?.focus(); }, [step]);

  // ---- simpan otomatis ----
  const flush = useCallback(async (extra: { progressStep?: number; slug?: string } = {}): Promise<boolean> => {
    if (!inv) return false;
    if (!dirty.current && !Object.keys(extra).length) return true;
    setSave("saving");
    const sending = contentRef.current;
    dirty.current = false;
    const r = await saveInvitation(inv.id, { content: sending, ...extra });
    if (!r.ok) {
      dirty.current = true;
      setSave("error");
      showToast?.(r.data.error || "Gagal menyimpan. Periksa koneksi Anda.");
      return false;
    }
    setInv((cur) => (cur ? { ...cur, ...r.data.invitation, content: cur.content } : cur));
    setSave(dirty.current ? "dirty" : "saved");
    return true;
  }, [inv, showToast]);

  // Begitu pengguna tiba di langkah "Selesai", progres edit tercatat selesai (bukan sekadar 80%).
  const finalSent = useRef(false);
  useEffect(() => {
    if (step !== LAST_STEP) { finalSent.current = false; return; }
    if (!inv || finalSent.current || isEditFinished(inv.progressStep)) return;
    finalSent.current = true;
    void flush({ progressStep: FINAL_PROGRESS });
  }, [step, inv, flush]);

  useEffect(() => {
    if (save !== "dirty") return;
    const t = setTimeout(() => void flush(), 1200);
    return () => clearTimeout(t);
  }, [save, content, flush]);

  const setField = (path: string, v: unknown) => {
    const next = clone(contentRef.current);
    setPath(next, path, v);
    setContent(next);
    dirty.current = true;
    setSave("dirty");
    if (errors[path]) setErrors((e) => ({ ...e, [path]: "" }));
  };

  // ---- foto ----
  const bySlot = useMemo(() => {
    const m: Record<string, MediaItem[]> = {};
    for (const x of media) (m[x.slot] ||= []).push(x);
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.sortOrder - b.sortOrder);
    return m;
  }, [media]);

  const onPick = async (slot: string, files: FileList | null) => {
    if (!inv || !files?.length) return;
    const def = manifest?.slots.find((s) => s.slot === slot);
    if (!def) return;
    setBusySlot(slot);
    let list = Array.from(files);
    if (def.max > 1) list = list.slice(0, def.max - (bySlot[slot]?.length ?? 0));
    for (const f of list) {
      if (!f.type.startsWith("image/")) { showToast?.("Pilih file gambar (JPG, PNG, atau WebP)."); continue; }
      try {
        const blob = await compressImage(f);
        const r = await uploadMedia(inv.id, slot, blob);
        if (!r.ok) { showToast?.(r.data.error || "Gagal mengunggah foto."); break; }
        setMedia((cur) => [...cur.filter((m) => def.max > 1 || m.slot !== slot), r.data.media]);
        setErrors((e) => ({ ...e, [`slot:${slot}`]: "" }));
      } catch {
        showToast?.("Foto tidak dapat diproses. Coba foto lain.");
      }
    }
    setBusySlot(null);
  };

  const onRemove = async (m: MediaItem) => {
    if (!inv) return;
    const r = await deleteMedia(inv.id, m.id);
    if (!r.ok) return void showToast?.(r.data.error || "Gagal menghapus foto.");
    setMedia((cur) => cur.filter((x) => x.id !== m.id));
  };

  // ---- validasi ----
  const missingForStep = (st: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!manifest) return e;
    for (const g of manifest.groups.filter((x) => x.step === st)) {
      if (g.toggle && getPath(content, g.toggle) !== true) continue;
      for (const f of g.fields) if (f.required && isEmpty(getPath(content, f.path))) e[f.path] = `${f.label} wajib diisi.`;
    }
    for (const s of manifest.slots.filter((x) => x.step === st && x.required)) if (!bySlot[s.slot]?.length) e[`slot:${s.slot}`] = `${s.label} wajib diunggah.`;
    return e;
  };

  const allMissing = (): string[] => {
    if (!manifest) return [];
    const out: string[] = [];
    for (const g of manifest.groups) {
      if (g.toggle && getPath(content, g.toggle) !== true) continue;
      for (const f of g.fields) if (f.required && isEmpty(getPath(content, f.path))) out.push(f.label);
    }
    for (const s of manifest.slots) if (s.required && !bySlot[s.slot]?.length) out.push(s.label);
    return out;
  };

  const next = async () => {
    const e = missingForStep(step);
    setErrors(e);
    if (Object.keys(e).length) return void showToast?.("Lengkapi data yang wajib diisi.");
    if (await flush({ progressStep: step + 1 })) setStep((s) => Math.min(s + 1, LAST_STEP));
  };

  const goStep = (i: number) => {
    if (i === step || !inv) return;
    if (i > Math.max(inv.progressStep, step)) return void showToast?.("Selesaikan langkah sebelumnya dulu.");
    if (i > step) {
      const e = missingForStep(step);
      setErrors(e);
      if (Object.keys(e).length) return void showToast?.("Lengkapi data yang wajib diisi.");
    }
    void flush();
    setStep(i);
  };

  const preview = async () => {
    if (!inv) return;
    if (!(await flush())) return;
    window.open(previewUrl(inv.id), "_blank", "noopener");
  };

  const publish = async () => {
    if (!inv) return;
    const miss = allMissing();
    if (miss.length) return void showToast?.(`Lengkapi dulu: ${miss.slice(0, 3).join(", ")}${miss.length > 3 ? "…" : ""}`);
    setPublishing(true);
    const slugChanged = !inv.publishedAt && slug !== inv.slug;
    const saved = await flush(slugChanged ? { slug, progressStep: 5 } : { progressStep: 5 });
    if (!saved) return void setPublishing(false);
    const r = await publishInvitation(inv.id);
    setPublishing(false);
    if (!r.ok) return void showToast?.(r.data.error || "Gagal mempublikasikan.");
    setInv((cur) => (cur ? { ...cur, ...r.data.invitation, content: cur.content } : cur));
    setShowDone(true);
  };

  const share = async () => {
    if (!inv) return;
    try {
      if (navigator.share) await navigator.share({ title: "Undangan Pernikahan", url: inv.publicUrl });
      else { await navigator.clipboard.writeText(inv.publicUrl); showToast?.("Link undangan disalin."); }
    } catch { /* dibatalkan */ }
  };

  // ---- tampilan ----
  if (load.state !== "ready" || !inv || !manifest) {
    return (
      <div className="min-h-screen bg-[#f4f1ff] flex items-center justify-center p-6 text-center">
        {load.state === "loading" ? <Loader2 className="w-6 h-6 animate-spin text-[#7d6aee]" aria-label="Memuat" /> : (
          <div className="max-w-xs">
            <h1 className="text-lg font-black text-[#17112e]">{load.state === "empty" ? "Belum ada undangan" : "Gagal memuat"}</h1>
            <p className="mt-2 text-sm text-[#5a5476]">{load.state === "empty" ? "Undangan muncul di sini setelah pesanan Anda lunas." : load.state === "error" ? load.msg : ""}</p>
            <button type="button" onClick={() => onNavigate(load.state === "empty" ? "/studio/pesanan" : "/studio/home")} className={`${btnPrimary} mt-5 px-6`}>
              {load.state === "empty" ? "Lihat pesanan" : "Kembali"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const s = STEPS[step];
  const doneCount = Math.max(inv.progressStep, step);
  const groups = manifest.groups.filter((g) => g.step === (step === 0 ? 0 : 2));
  const slots = manifest.slots.filter((x) => x.step === (step === 1 ? 1 : 3));
  const miss = step === 4 ? allMissing() : [];
  const saveLabel = save === "saving" ? "Menyimpan…" : save === "dirty" ? "Belum tersimpan" : save === "error" ? "Gagal menyimpan" : save === "saved" ? "Tersimpan" : "";

  return (
    <div className="min-h-screen bg-[#f4f1ff] pb-28">
      <div className="max-w-md mx-auto px-5">
        <div className="flex items-center gap-2 h-16">
          <button type="button" onClick={() => { void flush(); onNavigate("/studio/home"); }} aria-label="Kembali ke beranda"
            className="size-10 -ml-2 rounded-full flex items-center justify-center text-[#17112e] hover:bg-white/70 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 pl-2 min-w-0">
            <h2 className="text-base font-bold text-[#17112e] leading-tight">Edit Undangan</h2>
            <p className={`text-[11px] ${save === "error" ? "text-[#d92d62]" : "text-[#7a7494]"}`} aria-live="polite">{saveLabel}</p>
          </div>
          <button type="button" onClick={preview}
            className="h-10 px-4 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-sm font-bold inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(125,106,238,0.3)] cursor-pointer"><Eye className="w-4 h-4" /> Preview</button>
        </div>

        <ol className="relative grid grid-cols-5 mt-1" aria-label="Langkah edit undangan">
          <span aria-hidden className="absolute top-[14px] left-[10%] right-[10%] h-0.5 bg-[#ddd6f7]" />
          <span aria-hidden className="absolute top-[14px] left-[10%] h-0.5 bg-[#7d6aee] transition-[width] duration-500" style={{ width: `${step * 20}%` }} />
          {STEPS.map((st, i) => {
            const cur = i === step;
            const done = i < doneCount && !cur;
            return (
              <li key={st.label} className="relative flex flex-col items-center">
                <button type="button" onClick={() => goStep(i)} aria-current={cur ? "step" : undefined} className="flex flex-col items-center gap-1.5 cursor-pointer rounded-lg">
                  <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${cur ? "bg-[#7d6aee] border-[#7d6aee] text-white shadow-[0_0_0_4px_rgba(125,106,238,0.18)]" : done ? "bg-[#7d6aee] border-[#7d6aee] text-white" : "bg-white border-[#d4ccf5] text-[#7a7494]"}`}>
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`text-xs ${cur ? "font-bold text-[#6b58e0]" : "text-[#7a7494]"}`}>{st.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 mb-4">
          <h1 ref={headRef} tabIndex={-1} className="text-2xl font-black tracking-tight text-[#17112e] focus:outline-none">{s.title}</h1>
          <p className="mt-1 text-sm text-[#5a5476]">{s.sub}</p>
        </div>

        <div className="space-y-3" key={step} style={{ animation: "sc-rise .3s ease-out both" }}>
          {(step === 0 || step === 2) && groups.map((g) => <GroupCard key={g.id} g={g} content={content} errors={errors} onSet={setField} />)}
          {(step === 1 || step === 3) && slots.map((sl) => (
            <SlotCard key={sl.slot} s={sl} items={bySlot[sl.slot] ?? []} busy={busySlot === sl.slot} error={errors[`slot:${sl.slot}`]} onPick={onPick} onRemove={onRemove} />
          ))}

          {step === 4 && (
            <>
              <section className={card}>
                <h3 className="flex items-center gap-2.5 text-[15px] font-extrabold text-[#17112e] mb-3"><Link2 className="w-5 h-5 text-[#7d6aee]" />Link Undangan</h3>
                {inv.publishedAt ? (
                  <p className="text-sm text-[#17112e] break-all">{inv.publicUrl}</p>
                ) : (
                  <>
                    <label htmlFor="slug" className="block text-xs text-[#5a5476] mb-1.5">Alamat link (tidak bisa diubah setelah dipublikasikan)</label>
                    <div className="flex items-center rounded-xl border border-[#e0daf5] bg-white focus-within:border-[#7d6aee] focus-within:ring-2 focus-within:ring-[#7d6aee]/20">
                      <span className="pl-3.5 text-sm text-[#7a7494] whitespace-nowrap">…/i/</span>
                      <input id="slug" value={slug} maxLength={48} autoComplete="off" onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))} className="w-full h-12 bg-transparent px-1.5 text-[15px] focus:outline-none" />
                    </div>
                  </>
                )}
              </section>
              <section className={card}>
                {miss.length ? (
                  <>
                    <h3 className="text-[15px] font-extrabold text-[#17112e] mb-2">Belum lengkap</h3>
                    <ul className="list-disc pl-5 text-sm text-[#5a5476] space-y-0.5">{miss.map((m) => <li key={m}>{m}</li>)}</ul>
                  </>
                ) : (
                  <p className="text-sm text-[#17112e]">
                    {inv.status === "published" ? (inv.hasUnpublishedChanges ? "Ada perubahan yang belum dipublikasikan." : "Undangan Anda sudah tayang dan sesuai dengan draft terbaru.") : "Semua data wajib sudah lengkap. Undangan siap dipublikasikan."}
                  </p>
                )}
              </section>
              {inv.publishedAt ? (
                <button type="button" onClick={share} className="w-full h-12 rounded-full border border-[#d4ccf5] bg-white text-[#5b49c9] font-bold text-[15px] inline-flex items-center justify-center gap-2 cursor-pointer"><Share2 className="w-4 h-4" /> Bagikan Undangan</button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#f4f1ff] via-[#f4f1ff]/95 to-transparent pt-6 pb-5 px-5">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 ? <button type="button" onClick={() => goStep(step - 1)} className="h-12 px-5 rounded-full border border-[#d4ccf5] bg-white text-[#5b49c9] font-bold text-[15px] cursor-pointer">Kembali</button> : null}
          {step < 4 ? (
            <button type="button" onClick={next} disabled={save === "saving"} className={`${btnPrimary} flex-1`}>Simpan & Lanjut</button>
          ) : (
            <button type="button" onClick={publish} disabled={publishing || (inv.status === "published" && !inv.hasUnpublishedChanges)} className={`${btnPrimary} flex-1`}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{inv.status === "published" ? "Publikasikan Perubahan" : "Publikasikan"}
            </button>
          )}
        </div>
      </div>

      {showDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#17112e]/50 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Undangan dipublikasikan">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center">
            <button type="button" aria-label="Tutup" onClick={() => setShowDone(false)} className="absolute top-3 right-3 size-9 rounded-full flex items-center justify-center text-[#7a7494] hover:bg-[#f1edff] cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="mx-auto size-14 rounded-full bg-[#efeaff] flex items-center justify-center"><Check className="w-7 h-7 text-[#7d6aee]" strokeWidth={3} /></div>
            <h2 className="mt-4 text-xl font-black text-[#17112e]">Undangan sudah tayang</h2>
            <p className="mt-1 text-sm text-[#5a5476] break-all">{inv.publicUrl}</p>
            <div className="mt-5 space-y-2.5">
              <button type="button" onClick={share} className={`${btnPrimary} w-full`}><Share2 className="w-4 h-4" /> Bagikan Undangan</button>
              <button type="button" onClick={() => { setShowDone(false); onNavigate("/studio/home"); }} className="w-full h-11 rounded-full text-sm font-bold text-[#5b49c9] hover:bg-[#f1edff] cursor-pointer">Ke beranda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
