import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { createRedeemCode, deleteRedeemCode, fetchRedeemCodes, fmtDateTime, updateRedeemCode } from "@/lib/adminApi";
import { formatRupiahLang, useT } from "@/i18n";
import type { RedeemCodeInput, RedeemCodeItem } from "./types";

export interface RedeemPageProps {
  showToast: (msg: string) => void;
}

type CodeStatus = "active" | "inactive" | "scheduled" | "expired";

function statusOf(c: RedeemCodeItem, now = Date.now()): CodeStatus {
  if (!c.isActive) return "inactive";
  if (c.startsAt && now < Date.parse(c.startsAt)) return "scheduled";
  if (c.expiresAt && now >= Date.parse(c.expiresAt)) return "expired";
  return "active";
}

const STATUS_STYLE: Record<CodeStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-neutral-200 text-neutral-700",
  scheduled: "bg-sky-100 text-sky-800",
  expired: "bg-rose-100 text-rose-800",
};

// Tanggal di form selalu WIB (UTC+7), sama dengan tampilan dashboard lainnya.
const isoToWibInput = (iso: string | null): string => (iso ? new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 16) : "");
const wibInputToIso = (v: string): string | null => (v ? new Date(`${v}:00+07:00`).toISOString() : null);

interface FormState {
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: string;
  maxDiscount: string;
  usageMode: "per_invitation" | "time_based";
  maxInvitationsPerUser: string;
  startsAt: string;
  expiresAt: string;
  audience: "all" | "selected";
  emails: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "", description: "", discountType: "percent", discountValue: "10", maxDiscount: "",
  usageMode: "per_invitation", maxInvitationsPerUser: "1", startsAt: "", expiresAt: "",
  audience: "all", emails: "", isActive: true,
};

const formFrom = (c: RedeemCodeItem): FormState => ({
  code: c.code, description: c.description, discountType: c.discountType, discountValue: String(c.discountValue),
  maxDiscount: c.maxDiscount == null ? "" : String(c.maxDiscount), usageMode: c.usageMode,
  maxInvitationsPerUser: String(c.maxInvitationsPerUser), startsAt: isoToWibInput(c.startsAt), expiresAt: isoToWibInput(c.expiresAt),
  audience: c.audience, emails: c.emails.join("\n"), isActive: c.isActive,
});

const numOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 select-text focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/30 focus:border-[#7d6aee] disabled:bg-neutral-100 disabled:text-neutral-500";
const labelCls = "block text-xs font-bold text-neutral-700 mb-1";
const hintCls = "text-[11px] text-neutral-400 mt-1";

export const RedeemPage: React.FC<RedeemPageProps> = ({ showToast }) => {
  const { t, tr, lang } = useT();
  const rp = (n: number) => formatRupiahLang(n, lang);

  const [codes, setCodes] = useState<RedeemCodeItem[]>([]);
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
  const [editing, setEditing] = useState<{ item: RedeemCodeItem | null } | null>(null); // item null = buat baru
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RedeemCodeItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchRedeemCodes();
    if (!res.ok) {
      setState({ loading: false, error: res.error });
      return;
    }
    setCodes(res.data.codes);
    setState({ loading: false, error: null });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({ item: null });
  };
  const openEdit = (item: RedeemCodeItem) => {
    setForm(formFrom(item));
    setFormError("");
    setEditing({ item });
  };
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!editing || saving) return;
    const input: RedeemCodeInput = {
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.discountType === "percent" ? numOrNull(form.maxDiscount) : null,
      usageMode: form.usageMode,
      maxInvitationsPerUser: Number(form.maxInvitationsPerUser),
      startsAt: wibInputToIso(form.startsAt),
      expiresAt: wibInputToIso(form.expiresAt),
      audience: form.audience,
      isActive: form.isActive,
    };
    if (form.audience === "selected") input.emails = form.emails.split(/[\s,;]+/).filter(Boolean);
    if (!editing.item) input.code = form.code.trim();

    setSaving(true);
    setFormError("");
    const res = editing.item ? await updateRedeemCode(editing.item.id, input) : await createRedeemCode(input);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    showToast(t(editing.item ? "dash.redeem.toast.updated" : "dash.redeem.toast.created"));
    setEditing(null);
    void load();
  };

  const toggleActive = async (c: RedeemCodeItem) => {
    setBusyId(c.id);
    const res = await updateRedeemCode(c.id, { isActive: !c.isActive });
    setBusyId(null);
    if (!res.ok) return showToast(tr(res.error));
    showToast(t("dash.redeem.toast.updated"));
    void load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setBusyId(target.id);
    const res = await deleteRedeemCode(target.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (!res.ok) return showToast(tr(res.error));
    showToast(t("dash.redeem.toast.deleted"));
    void load();
  };

  const stats = useMemo(() => {
    let active = 0, used = 0, given = 0;
    for (const c of codes) {
      if (statusOf(c) === "active") active++;
      used += c.stats.orders;
      given += c.stats.discountGiven;
    }
    return { total: codes.length, active, used, given };
  }, [codes]);

  const columns: DataTableColumn<RedeemCodeItem>[] = [
    {
      key: "code",
      header: t("dash.redeem.col.code"),
      sortable: true,
      sortKey: "code",
      render: (c) => (
        <div className="min-w-0">
          <span className="font-mono text-xs font-black tracking-wide text-neutral-900 select-text">{c.code}</span>
          {c.description && <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">{c.description}</p>}
        </div>
      ),
    },
    {
      key: "discount",
      header: t("dash.redeem.col.discount"),
      render: (c) => (
        <div>
          <span className="font-bold text-neutral-900">{c.discountType === "percent" ? `${c.discountValue}%` : rp(c.discountValue)}</span>
          {c.discountType === "percent" && c.maxDiscount != null && (
            <p className="text-[11px] text-neutral-400">{t("dash.redeem.cap", { amount: rp(c.maxDiscount) })}</p>
          )}
        </div>
      ),
    },
    {
      key: "mode",
      header: t("dash.redeem.col.mode"),
      render: (c) => (
        <div>
          <span className="font-semibold text-neutral-800">{t(c.usageMode === "per_invitation" ? "dash.redeem.mode.per" : "dash.redeem.mode.time")}</span>
          <p className="text-[11px] text-neutral-400">
            {c.usageMode === "per_invitation" ? t("dash.redeem.mode.perDetail", { n: c.maxInvitationsPerUser }) : t("dash.redeem.mode.timeDetail")}
          </p>
        </div>
      ),
    },
    {
      key: "validity",
      header: t("dash.redeem.col.validity"),
      render: (c) =>
        !c.startsAt && !c.expiresAt ? (
          <span className="text-neutral-500">{t("dash.redeem.noLimit")}</span>
        ) : (
          <div className="text-[11px] leading-snug text-neutral-600">
            {c.startsAt && <p>{t("dash.redeem.from", { date: fmtDateTime(c.startsAt, lang) })}</p>}
            {c.expiresAt && <p>{t("dash.redeem.until", { date: fmtDateTime(c.expiresAt, lang) })}</p>}
          </div>
        ),
    },
    {
      key: "audience",
      header: t("dash.redeem.col.audience"),
      render: (c) => (
        <span className="text-neutral-700" title={c.audience === "selected" ? c.emails.join(", ") : undefined}>
          {c.audience === "all" ? t("dash.redeem.aud.all") : t("dash.redeem.aud.selected", { n: c.emails.length })}
        </span>
      ),
    },
    {
      key: "usage",
      header: t("dash.redeem.col.usage"),
      sortable: true,
      sortKey: (c) => c.stats.orders,
      render: (c) => (
        <div>
          <span className="font-bold text-neutral-900">{t("dash.redeem.usedOrders", { n: c.stats.orders })}</span>
          <p className="text-[11px] text-neutral-400">{t("dash.redeem.usedDetail", { users: c.stats.users, amount: rp(c.stats.discountGiven) })}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: t("dash.redeem.col.status"),
      render: (c) => {
        const st = statusOf(c);
        return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[st]}`}>{t(`dash.redeem.status.${st}` as const)}</span>;
      },
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (c) => (
        <div className="inline-flex items-center gap-1.5">
          <button type="button" title={t("dash.redeem.edit")} aria-label={t("dash.redeem.edit")} onClick={() => openEdit(c)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={busyId === c.id} onClick={() => void toggleActive(c)}
            title={t(c.isActive ? "dash.redeem.deactivate" : "dash.redeem.activate")} aria-label={t(c.isActive ? "dash.redeem.deactivate" : "dash.redeem.activate")}
            className={`p-1.5 rounded-lg border bg-white hover:bg-neutral-50 cursor-pointer disabled:opacity-50 ${c.isActive ? "border-emerald-200 text-emerald-600" : "border-neutral-200 text-neutral-400"}`}>
            <Power className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={busyId === c.id} onClick={() => setConfirmDelete(c)}
            title={t("dash.redeem.delete")} aria-label={t("dash.redeem.delete")}
            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 cursor-pointer disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const isTime = form.usageMode === "time_based";
  const isPct = form.discountType === "percent";
  const radio = (checked: boolean) =>
    `flex-1 px-3 py-2 rounded-xl border text-xs font-bold text-left cursor-pointer transition-colors ${checked ? "border-[#7d6aee] bg-purple-50 text-[#5c47dc]" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"}`;

  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-neutral-500 max-w-xl">{t("dash.redeem.subtitle")}</p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("dash.redeem.add")}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("dash.redeem.stat.total"), value: String(stats.total), tone: "text-neutral-900" },
          { label: t("dash.redeem.stat.active"), value: String(stats.active), tone: "text-emerald-600" },
          { label: t("dash.redeem.stat.used"), value: String(stats.used), tone: "text-neutral-900" },
          { label: t("dash.redeem.stat.given"), value: rp(stats.given), tone: "text-[#7d6aee]" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
            <span className="text-xs text-neutral-400 font-semibold">{s.label}</span>
            <p className={`text-xl font-black mt-1 ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {state.error && (
        <div role="alert" className="flex items-center justify-between gap-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          <span>{tr(state.error)}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer">
            {t("common.retry")}
          </button>
        </div>
      )}

      <DataTable columns={columns} data={codes} rowKey={(c) => c.id} emptyMessage={state.loading ? t("dash.loadingData") : t("dash.redeem.empty")} />

      {/* MODAL: buat / ubah kode */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">{t(editing.item ? "dash.redeem.form.editTitle" : "dash.redeem.form.createTitle")}</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer" aria-label={t("common.close")}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className={labelCls} htmlFor="rc-code">{t("dash.redeem.form.code")}</label>
              <input id="rc-code" className={`${inputCls} font-mono uppercase`} value={form.code} disabled={!!editing.item} maxLength={32}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="HEMAT10" autoComplete="off" />
              <p className={hintCls}>{t("dash.redeem.form.codeHint")}</p>
            </div>

            <div>
              <label className={labelCls} htmlFor="rc-desc">{t("dash.redeem.form.desc")}</label>
              <input id="rc-desc" className={inputCls} value={form.description} maxLength={120} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div>
              <span className={labelCls}>{t("dash.redeem.form.type")}</span>
              <div className="flex gap-2">
                <button type="button" className={radio(isPct)} onClick={() => set("discountType", "percent")}>{t("dash.redeem.form.typePercent")}</button>
                <button type="button" className={radio(!isPct)} onClick={() => set("discountType", "flat")}>{t("dash.redeem.form.typeFlat")}</button>
              </div>
            </div>

            <div className={`grid gap-3 ${isPct ? "sm:grid-cols-2" : ""}`}>
              <div>
                <label className={labelCls} htmlFor="rc-val">{t(isPct ? "dash.redeem.form.valuePercent" : "dash.redeem.form.valueFlat")}</label>
                <input id="rc-val" type="number" inputMode="numeric" min={1} max={isPct ? 100 : 10000000} className={inputCls} value={form.discountValue}
                  onChange={(e) => set("discountValue", e.target.value)} />
              </div>
              {isPct && (
                <div>
                  <label className={labelCls} htmlFor="rc-cap">{t("dash.redeem.form.maxDiscount")}</label>
                  <input id="rc-cap" type="number" inputMode="numeric" min={1} className={inputCls} value={form.maxDiscount} placeholder="30000"
                    onChange={(e) => set("maxDiscount", e.target.value)} />
                </div>
              )}
            </div>
            {isPct && <p className={`${hintCls} -mt-2`}>{t("dash.redeem.form.maxDiscountHint")}</p>}

            <div>
              <span className={labelCls}>{t("dash.redeem.form.mode")}</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" className={radio(!isTime)} onClick={() => set("usageMode", "per_invitation")}>{t("dash.redeem.mode.per")}</button>
                <button type="button" className={radio(isTime)} onClick={() => set("usageMode", "time_based")}>{t("dash.redeem.mode.time")}</button>
              </div>
              <p className={hintCls}>{t(isTime ? "dash.redeem.form.modeTimeHint" : "dash.redeem.form.modePerHint")}</p>
            </div>

            {!isTime && (
              <div>
                <label className={labelCls} htmlFor="rc-per">{t("dash.redeem.form.perUser")}</label>
                <input id="rc-per" type="number" inputMode="numeric" min={1} max={1000} className={inputCls} value={form.maxInvitationsPerUser}
                  onChange={(e) => set("maxInvitationsPerUser", e.target.value)} />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="rc-start">{t("dash.redeem.form.startsAt")}</label>
                <input id="rc-start" type="datetime-local" className={inputCls} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="rc-end">{t("dash.redeem.form.expiresAt")}</label>
                <input id="rc-end" type="datetime-local" className={inputCls} value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
              </div>
            </div>
            {!isTime && <p className={`${hintCls} -mt-2`}>{t("dash.redeem.form.expiresHintOptional")}</p>}

            <div>
              <span className={labelCls}>{t("dash.redeem.form.audience")}</span>
              <div className="flex gap-2">
                <button type="button" className={radio(form.audience === "all")} onClick={() => set("audience", "all")}>{t("dash.redeem.form.audAll")}</button>
                <button type="button" className={radio(form.audience === "selected")} onClick={() => set("audience", "selected")}>{t("dash.redeem.form.audSelected")}</button>
              </div>
            </div>

            {form.audience === "selected" && (
              <div>
                <label className={labelCls} htmlFor="rc-emails">{t("dash.redeem.form.emails")}</label>
                <textarea id="rc-emails" rows={4} className={`${inputCls} font-mono text-xs`} value={form.emails} placeholder="nama@email.com"
                  onChange={(e) => set("emails", e.target.value)} />
                <p className={hintCls}>{t("dash.redeem.form.emailsHint")}</p>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 cursor-pointer">
              <input type="checkbox" className="size-4 accent-[#7d6aee]" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              {t("dash.redeem.form.active")}
            </label>

            {formError && (
              <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{tr(formError)}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 cursor-pointer">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] disabled:opacity-60 cursor-pointer">
                {t(saving ? "dash.redeem.form.saving" : "dash.redeem.form.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: konfirmasi hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <p className="text-sm font-semibold text-neutral-800">{t("dash.redeem.confirmDelete", { code: confirmDelete.code })}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 cursor-pointer">
                {t("common.cancel")}
              </button>
              <button type="button" onClick={() => void handleDelete()} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer">
                {t("dash.redeem.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemPage;
