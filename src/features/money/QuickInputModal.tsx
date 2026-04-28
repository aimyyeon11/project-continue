import { useState } from "react";
import { X, Check, Delete, Camera } from "lucide-react";
import type { Txn, TxnType, ReceiptItem } from "@/types";
import { ReceiptScanner } from "@/features/inventory/ReceiptScanner";

const expenseCats = [
  { emoji: "🍗", name: "Ayam" },     { emoji: "🛢️", name: "Minyak" },
  { emoji: "🌾", name: "Tepung" },   { emoji: "🍚", name: "Beras" },
  { emoji: "🥚", name: "Telur" },    { emoji: "📦", name: "Bungkus" },
  { emoji: "⛽", name: "Gas" },      { emoji: "🏷️", name: "Lain" },
];

const incomeSuggestions = ["Jualan Pagi", "Jualan Petang", "Penghantaran"];

export const QuickInputModal = ({ onClose, onSave, onReceiptConfirm, onBoughtItems }: {
  onClose: () => void;
  onSave: (t: Omit<Txn, "id" | "ts" | "time">) => void;
  onReceiptConfirm: (items: ReceiptItem[]) => void;
  onBoughtItems?: (items: Array<{ name: string; qty: number; unit: string }>) => void;
}) => {
  const [mode, setMode] = useState<TxnType>("in");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState<{ emoji: string; name: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [stockInput, setStockInput] = useState("");

  const press = (k: string) => {
    setAmount(prev => {
      if (k === "del") return prev.length <= 1 ? "0" : prev.slice(0, -1);
      if (k === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return k;
      return prev + k;
    });
  };

  const canSave = parseFloat(amount) > 0 && (mode === "in" || cat !== null);

  const handleSave = () => {
    if (!canSave) return;
    setSuccess(true);
    setTimeout(() => {
      const value = parseFloat(amount);
      if (mode === "in") {
        onSave({ type: "in", emoji: "💰", label: note || "Jualan", amount: value });
      } else if (cat) {
        onSave({ type: "out", emoji: cat.emoji, label: `Beli ${cat.name}`, amount: value });
        if (stockInput.trim() && onBoughtItems) {
          const parsed = stockInput.split(/[,]+/).map(s => s.trim()).filter(Boolean).map(line => {
            const qtyMatch = line.match(/(\d+\.?\d*)\s*(kg|g|liter|ml|biji|pek|kotak|batang|helai)?/i);
            const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
            const unit = qtyMatch?.[2]?.toLowerCase() ?? "biji";
            const name = line.replace(/\d+\.?\d*\s*(kg|g|liter|ml|biji|pek|kotak|batang|helai)?/i, "").replace(/rm[\d.]+/i, "").trim();
            return { name, qty, unit };
          }).filter(i => i.name.length > 0);
          onBoughtItems(parsed);
        }
      }
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] h-[88vh] bg-surface rounded-t-[2.5rem] animate-slide-up flex flex-col"
      >
        {/* handle */}
        <div className="pt-3 pb-1 grid place-items-center">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
        </div>

        {/* close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-elevated grid place-items-center tap">
          <X className="w-5 h-5" />
        </button>

        {/* tabs */}
        <div className="px-5 mt-2">
          <div className="rounded-2xl p-1 bg-surface-elevated grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode("in")}
              className={`py-3 rounded-xl font-bold text-sm tap ${mode === "in" ? "bg-gradient-profit text-profit-foreground shadow-card" : "text-muted-foreground"}`}
            >
              💰 Dapat Duit
            </button>
            <button
              onClick={() => setMode("out")}
              className={`py-3 rounded-xl font-bold text-sm tap ${mode === "out" ? "bg-gradient-cost text-white shadow-card" : "text-muted-foreground"}`}
            >
              💸 Dah Belanja
            </button>
          </div>
        </div>

        {/* amount display */}
        <div className="px-5 mt-5">
          <div className={`rounded-3xl p-5 text-center ${mode === "in" ? "bg-profit/10" : "bg-cost/10"}`}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {mode === "in" ? "Berapa dapat?" : "Berapa belanja?"}
            </div>
            <div className={`text-5xl font-extrabold mt-2 ${mode === "in" ? "text-profit" : "text-cost"}`}>
              RM {amount}
            </div>
          </div>
        </div>

        {/* mode-specific section */}
        <div className="flex-1 overflow-y-auto px-5 mt-4 no-scrollbar">
          {mode === "in" ? (
            <div className="space-y-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Apa yang dijual? (optional)"
                className="w-full h-12 px-4 rounded-2xl bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary"
              />
              <div className="flex flex-wrap gap-2">
                {incomeSuggestions.map(s => (
                  <button key={s} onClick={() => setNote(s)} className={`px-3 h-10 rounded-full text-sm font-semibold border tap ${note === s ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-muted-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setScanner(true)}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-warn/50 text-warn font-bold tap flex items-center justify-center gap-2 bg-warn/5"
              >
                <Camera className="w-5 h-5" /> Scan Resit / Invoice
              </button>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pilih Kategori</div>
              <div className="grid grid-cols-4 gap-2">
                {expenseCats.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setCat(c)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 tap border ${cat?.name === c.name ? "bg-cost/20 border-cost" : "bg-surface-elevated border-border"}`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-[10px] font-semibold">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kemaskini Stok (pilihan)</div>
                <input
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  placeholder="cth: telur 2 biji, minyak 1 liter"
                  className="w-full h-12 px-4 rounded-2xl bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary text-sm"
                />
                <div className="text-[11px] text-muted-foreground">Stok akan dikemaskini secara automatik</div>
              </div>
            </div>
          )}
        </div>

        {/* keypad */}
        <div className="px-5 mt-3 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9",".","0","del"].map(k => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-12 rounded-2xl bg-surface-elevated text-xl font-bold tap grid place-items-center"
            >
              {k === "del" ? <Delete className="w-5 h-5" /> : k}
            </button>
          ))}
        </div>

        {/* save */}
        <div className="px-5 pt-3 pb-6">
          <button
            disabled={!canSave}
            onClick={handleSave}
            className={`w-full h-14 rounded-2xl font-extrabold text-lg tap shadow-card transition-opacity ${
              !canSave ? "opacity-50 " : ""
            }${mode === "in" ? "bg-gradient-profit text-profit-foreground" : "bg-gradient-cost text-white"}`}
          >
            Simpan 💾
          </button>
        </div>

        {success && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur grid place-items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-profit grid place-items-center animate-check-pop shadow-glow">
              <Check className="w-14 h-14 text-profit-foreground" strokeWidth={3} />
            </div>
          </div>
        )}

        {scanner && (
          <ReceiptScanner
            onClose={() => setScanner(false)}
            onConfirm={(items) => {
              onReceiptConfirm(items);
              setScanner(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
