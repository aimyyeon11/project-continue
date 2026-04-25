import { useMemo, useState } from "react";
import { Plus, RefreshCw, Share2, Trash2, Pencil, Check } from "lucide-react";
import type { BuyItem, StockItem, Unit } from "@/types";

type Draft = {
  id?: string;
  emoji: string;
  name: string;
  recQty: number;
  unit: Unit;
  note?: string;
};

const UNITS: Unit[] = ["kg", "g", "liter", "ml", "biji", "pek", "kotak", "batang", "helai"];

export const BuyView = ({
  buy,
  stock,
  onToggleDone,
  onResync,
  onAdd,
  onEdit,
  onDelete,
  onBulkDone,
  onBulkDelete,
  onClearCompleted,
  onGoToStock,
}: {
  buy: BuyItem[];
  stock: StockItem[];
  onToggleDone: (id: string) => void;
  onResync: () => void;
  onAdd: (d: Draft) => void;
  onEdit: (id: string, d: Draft) => void;
  onDelete: (id: string) => void;
  onBulkDone: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onClearCompleted: () => void;
  onGoToStock: () => void;
}) => {
  const [tab, setTab] = useState<"all" | "todo" | "done">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const autoCount = buy.filter((b) => b.source === "auto").length;
  const todoCount = buy.filter((b) => !b.done).length;
  const doneCount = buy.length - todoCount;

  const sorted = useMemo(() => {
    return [...buy].sort((a, b) => Number(a.done) - Number(b.done));
  }, [buy]);
  const visible = sorted.filter((b) =>
    tab === "all" ? true : tab === "todo" ? !b.done : b.done,
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAdd = () =>
    setDraft({ emoji: "🛒", name: "", recQty: 1, unit: "kg", note: "" });
  const openEdit = (b: BuyItem) => {
    setEditingId(b.id);
    setDraft({ id: b.id, emoji: b.emoji, name: b.name, recQty: b.recQty, unit: b.unit, note: b.note ?? "" });
  };
  const saveDraft = () => {
    if (!draft || !draft.name.trim()) return;
    if (editingId) onEdit(editingId, draft);
    else onAdd(draft);
    setDraft(null);
    setEditingId(null);
  };

  const share = () => {
    const date = new Date().toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
    const lines = buy
      .filter((b) => !b.done)
      .map((b) => `☐ ${b.name} - ${b.recQty}${b.unit}`);
    const text =
      `🛒 *Senarai Nak Beli - WarkahBiz*\n📅 ${date}\n\n${lines.join("\n")}\n\n_Dijana oleh WarkahBiz App_`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => navigator.clipboard?.writeText(text));
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  const isEmpty = buy.length === 0;

  return (
    <div className="px-5 pt-6 space-y-5 pb-32">
      {/* Header */}
      <header className="animate-fade-in flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Nak Beli 🛒</h1>
          <p className="text-sm text-muted-foreground mt-1">Senarai Pembelian</p>
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground">
              {doneCount} / {buy.length} selesai
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-profit transition-all"
                style={{ width: buy.length ? `${(doneCount / buy.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center tap shadow-card"
          aria-label="Tambah item"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </header>

      {/* Auto sync banner */}
      {autoCount > 0 && (
        <div className="rounded-2xl p-3 bg-profit/10 border border-profit/30 flex items-center gap-3 animate-fade-in">
          <div className="flex-1 text-xs font-semibold text-profit">
            {autoCount} item diambil dari Stok Rendah secara automatik
          </div>
          <button
            onClick={onResync}
            className="w-9 h-9 rounded-xl bg-profit/15 text-profit grid place-items-center tap"
            aria-label="Segerak semula"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          ["all", "Semua", buy.length],
          ["todo", "Belum Beli", todoCount],
          ["done", "Sudah Beli", doneCount],
        ] as const).map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 h-10 rounded-2xl text-xs font-bold tap border ${
              tab === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border text-muted-foreground"
            }`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="rounded-2xl p-8 bg-surface border border-border text-center space-y-3 animate-fade-in">
          <div className="text-5xl">🧺</div>
          <p className="font-extrabold">Senarai kosong!</p>
          <p className="text-xs text-muted-foreground">Tambah item atau semak stok anda</p>
          <button onClick={onGoToStock} className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold tap">
            Pergi ke Stok →
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl p-6 bg-surface border border-border text-center text-muted-foreground text-sm">
          Tiada item dalam tab ini
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((b) => {
            const checked = !!b.done;
            const isSel = selected.has(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl p-3 border flex items-center gap-3 animate-fade-in ${
                  checked ? "bg-profit/5 border-profit/20" : "bg-surface border-border"
                } ${isSel ? "ring-2 ring-primary" : ""}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleSelect(b.id);
                }}
              >
                <button
                  onClick={() => onToggleDone(b.id)}
                  className={`w-7 h-7 rounded-full border-2 grid place-items-center tap shrink-0 ${
                    checked ? "bg-profit border-profit text-profit-foreground" : "border-border"
                  }`}
                  aria-label="Tandakan selesai"
                >
                  {checked && <Check className="w-4 h-4" strokeWidth={3} />}
                </button>

                <div className="text-2xl shrink-0">{b.emoji}</div>

                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>
                    {b.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {b.recQty} {b.unit}
                    {b.note ? ` · ${b.note}` : ""}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.source === "auto"
                          ? "bg-cost/15 text-cost"
                          : "bg-profit/15 text-profit"
                      }`}
                    >
                      {b.source === "auto" ? "🔴 Auto - Stok Rendah" : "✏️ Manual"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(b)}
                    className="w-8 h-8 rounded-lg bg-profit/10 text-profit grid place-items-center tap"
                    aria-label="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(b.id)}
                    className="w-8 h-8 rounded-lg bg-cost/15 text-cost grid place-items-center tap"
                    aria-label="Padam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="sticky bottom-44 rounded-2xl bg-surface-elevated border border-border p-3 flex items-center gap-2 shadow-card animate-fade-in">
          <div className="text-xs font-bold flex-1">{selected.size} item dipilih</div>
          <button
            onClick={() => { onBulkDone([...selected]); setSelected(new Set()); }}
            className="h-9 px-3 rounded-xl bg-profit text-profit-foreground text-xs font-bold tap"
          >
            Tandakan Selesai
          </button>
          <button
            onClick={() => { onBulkDelete([...selected]); setSelected(new Set()); }}
            className="h-9 px-3 rounded-xl bg-cost text-cost-foreground text-xs font-bold tap"
          >
            Hapus
          </button>
        </div>
      )}

      {/* Trip summary */}
      {!isEmpty && (
        <div className="sticky bottom-40 rounded-full px-4 py-3 bg-surface-elevated border border-border flex items-center gap-2 shadow-card">
          <span className="text-xs font-semibold text-muted-foreground flex-1">
            {todoCount} item untuk dibeli
          </span>
          <button
            onClick={share}
            className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold tap flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kongsi
          </button>
          {doneCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="h-9 px-3 rounded-xl bg-surface border border-border text-xs font-bold tap"
            >
              Bersihkan
            </button>
          )}
        </div>
      )}

      {/* Add/Edit sheet */}
      {draft && (
        <BuySheet
          draft={draft}
          stock={stock}
          onChange={setDraft}
          onSave={saveDraft}
          onClose={() => { setDraft(null); setEditingId(null); }}
          isEdit={!!editingId}
        />
      )}
    </div>
  );
};

const BuySheet = ({
  draft,
  stock,
  onChange,
  onSave,
  onClose,
  isEdit,
}: {
  draft: Draft;
  stock: StockItem[];
  onChange: (d: Draft) => void;
  onSave: () => void;
  onClose: () => void;
  isEdit: boolean;
}) => {
  const [showSugg, setShowSugg] = useState(false);
  const suggestions = stock.filter(
    (s) => draft.name && s.name.toLowerCase().includes(draft.name.toLowerCase()),
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] mx-auto bg-surface rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[88vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 rounded-full bg-border mx-auto mb-4" />
        <h3 className="font-extrabold text-lg">{isEdit ? "Edit Item" : "Tambah ke Senarai"}</h3>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2 relative">
            <input
              value={draft.emoji}
              onChange={(e) => onChange({ ...draft, emoji: e.target.value })}
              maxLength={2}
              className="w-16 h-12 rounded-2xl bg-background border border-border text-center text-2xl"
              aria-label="Emoji"
            />
            <input
              value={draft.name}
              onChange={(e) => { onChange({ ...draft, name: e.target.value }); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
              placeholder="Nama Item"
              className="flex-1 h-12 px-4 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-14 left-16 right-0 bg-surface-elevated border border-border rounded-xl z-10 max-h-40 overflow-auto">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onChange({ ...draft, name: s.name, emoji: s.emoji, unit: s.unit });
                      setShowSugg(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface flex items-center gap-2"
                  >
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kuantiti">
              <input
                type="number" inputMode="decimal" step="0.1"
                value={draft.recQty}
                onChange={(e) => onChange({ ...draft, recQty: +e.target.value })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-sm"
              />
            </Field>
            <Field label="Unit">
              <select
                value={draft.unit}
                onChange={(e) => onChange({ ...draft, unit: e.target.value as Unit })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-sm"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Nota (pilihan)">
            <input
              value={draft.note ?? ""}
              onChange={(e) => onChange({ ...draft, note: e.target.value })}
              placeholder="cth. jenama jimat"
              className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-sm"
            />
          </Field>

          <button onClick={onSave} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold tap mt-2">
            {isEdit ? "Simpan Perubahan" : "Tambah ke Senarai"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
    {children}
  </label>
);