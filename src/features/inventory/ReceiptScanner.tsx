import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import type { Unit, ReceiptItem } from "@/types";

const MOCK_RECEIPT = {
  vendor: "Pasar Borong Selayang",
  date: "24 April 2026",
  items: [
    { emoji: "🍗", name: "Ayam",         qty: 3, unit: "kg" as Unit,    price: 32.00 },
    { emoji: "🛢️", name: "Minyak Masak", qty: 2, unit: "liter" as Unit, price: 18.50 },
    { emoji: "🌾", name: "Tepung",       qty: 2, unit: "kg" as Unit,    price: 11.00 },
  ],
};

export const ReceiptScanner = ({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: (items: ReceiptItem[]) => void;
}) => {
  const [phase, setPhase] = useState<"scan" | "result">("scan");
  useEffect(() => {
    const t = setTimeout(() => setPhase("result"), 1500);
    return () => clearTimeout(t);
  }, []);
  const total = MOCK_RECEIPT.items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-extrabold">Scan Resit 📷</h3>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-elevated grid place-items-center tap">
          <X className="w-5 h-5" />
        </button>
      </div>

      {phase === "scan" ? (
        <div className="flex-1 grid place-items-center p-6">
          <div className="relative w-full aspect-[3/4] max-w-xs rounded-3xl bg-black/60 border-2 border-dashed border-warn/50 grid place-items-center overflow-hidden">
            {/* corner brackets */}
            <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-warn rounded-tl-lg" />
            <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-warn rounded-tr-lg" />
            <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-warn rounded-bl-lg" />
            <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-warn rounded-br-lg" />
            <div className="absolute inset-x-0 h-0.5 bg-warn animate-pulse" style={{ top: "50%" }} />
            <div className="text-warn font-bold text-sm">Scanning...</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <div className="rounded-2xl bg-surface border border-profit/30 p-4 animate-pop-in">
            <div className="text-profit font-bold text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> Resit Dijumpai
            </div>
            <div className="mt-2 text-sm">
              <div><span className="text-muted-foreground">Vendor:</span> <span className="font-semibold">{MOCK_RECEIPT.vendor}</span></div>
              <div><span className="text-muted-foreground">Tarikh:</span> <span className="font-semibold">{MOCK_RECEIPT.date}</span></div>
            </div>
            <div className="mt-3 border-t border-border pt-3 space-y-2">
              {MOCK_RECEIPT.items.map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-xl">{i.emoji}</span>
                  <span className="flex-1 font-semibold">{i.name}</span>
                  <span className="text-muted-foreground text-xs">{i.qty} {i.unit}</span>
                  <span className="font-bold w-16 text-right">RM {i.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
              <span className="font-bold uppercase text-xs tracking-wider">Jumlah</span>
              <span className="font-extrabold text-cost text-lg">RM {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onClose} className="h-12 rounded-2xl bg-surface-elevated border border-border font-bold tap">✏️ Edit</button>
            <button
              onClick={() => {
                toast.success(`${MOCK_RECEIPT.items.length} item berjaya disimpan! 🎉`);
                onConfirm(MOCK_RECEIPT.items);
              }}
              className="h-12 rounded-2xl bg-gradient-profit text-profit-foreground font-bold tap shadow-card"
            >
              ✅ Confirm & Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
