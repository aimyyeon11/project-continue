import { useState } from "react";
import { Share2, Coins } from "lucide-react";
import type { PettyEntry, Txn } from "@/types";
import { fmt } from "@/lib/format";
import { PettyInputSheet } from "./PettyInputSheet";

const MiniStat = ({ label, value, tone }: { label: string; value: number; tone: "income" | "cost" | "profit" }) => {
  const styles = {
    income: "bg-gradient-income text-white",
    cost:   "bg-gradient-cost text-white",
    profit: "bg-gradient-profit text-profit-foreground",
  }[tone];
  return (
    <div className={`rounded-2xl p-3 ${styles}`}>
      <div className="text-[10px] font-bold uppercase opacity-90">{label}</div>
      <div className="text-base font-extrabold mt-1">{fmt(value)}</div>
    </div>
  );
};

export const LogView = ({ txns, today, week, month, petty, onExport, onAddPetty }: {
  txns: Txn[];
  today: { in: number; out: number; profit: number };
  week: { in: number; out: number; profit: number };
  month: { in: number; out: number; profit: number };
  petty: PettyEntry[];
  onExport: () => void;
  onAddPetty: (type: "in" | "out", amount: number, desc: string, emoji: string) => void;
  onAddOpEx?: (category: string, amount: number, desc: string, paidFromPetty: boolean) => void;
}) => {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "petty">("all");
  const [pettySheet, setPettySheet] = useState<null | "in" | "out">(null);
  const sum = range === "today" ? today : range === "week" ? week : month;
  const filtered = filter === "all" ? txns : filter === "in" ? txns.filter(t => t.type === "in") : txns.filter(t => t.type === "out");
  const balance = petty[petty.length - 1]?.balance ?? 0;

  return (
    <div className="px-5 pt-6 space-y-5">
      <header className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Rekod Kewangan 📊</h1>
          <p className="text-sm text-muted-foreground mt-1">Semua transaksi</p>
        </div>
        <button onClick={onExport} className="h-10 px-3 rounded-full bg-surface border border-border text-sm font-semibold tap flex items-center gap-1.5">
          <Share2 className="w-4 h-4" /> Export
        </button>
      </header>

      <div className="flex gap-2 -mx-5 px-5 overflow-x-auto no-scrollbar">
        {([
          { k: "all", label: "Semua" },
          { k: "in", label: "Jualan" },
          { k: "out", label: "Belanja" },
          { k: "petty", label: "Petty Cash 🪙" },
        ] as const).map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`shrink-0 h-10 px-4 rounded-full text-sm font-bold tap border ${filter === f.k ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filter !== "petty" ? (
        <>
          <div className="rounded-full p-1 bg-surface-elevated grid grid-cols-3 gap-1">
            {(["today", "week", "month"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`py-2.5 rounded-full text-sm font-bold transition-all tap ${range === r ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground"}`}
              >
                {r === "today" ? "Hari Ini" : r === "week" ? "Minggu Ini" : "Bulan Ini"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Masuk"  value={sum.in}     tone="income" />
            <MiniStat label="Keluar" value={sum.out}    tone="cost" />
            <MiniStat label="Untung" value={sum.profit} tone="profit" />
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Transaksi</h2>
            <div className="space-y-2">
              {filtered.map(t => (
                <div key={t.id} className="rounded-2xl p-3.5 bg-surface border border-border flex items-center gap-3 animate-fade-in">
                  <div className={`w-11 h-11 rounded-2xl grid place-items-center text-2xl ${t.type === "in" ? "bg-profit/15" : "bg-cost/15"}`}>
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold leading-tight truncate">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.time}</div>
                  </div>
                  <div className={`font-extrabold text-lg ${t.type === "in" ? "text-profit" : "text-cost"}`}>
                    {t.type === "in" ? "+" : "−"}{fmt(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="rounded-3xl p-5 bg-gradient-to-br from-warn/30 to-warn/10 border border-warn/30 text-center animate-pop-in">
            <Coins className="w-6 h-6 mx-auto text-warn" />
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Wang Runcit / Petty Cash</div>
            <div className="text-4xl font-extrabold mt-1">RM {balance.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">Baki semasa dalam tangan</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPettySheet("in")} className="h-14 rounded-2xl bg-gradient-profit text-profit-foreground font-bold tap shadow-card">+ Masuk Wang 💵</button>
            <button onClick={() => setPettySheet("out")} className="h-14 rounded-2xl bg-gradient-cost text-white font-bold tap shadow-card">− Keluar Wang 💸</button>
          </div>
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Log Petty Cash</h2>
            <div className="space-y-2">
              {[...petty].reverse().map(p => (
                <div key={p.id} className="rounded-2xl p-3 bg-surface border border-border flex items-center gap-3 animate-fade-in">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center text-xl ${p.type === "in" ? "bg-profit/15" : "bg-cost/15"}`}>{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.desc}</div>
                    <div className="text-[11px] text-muted-foreground">{p.time} • Baki: RM {p.balance.toFixed(2)}</div>
                  </div>
                  <div className={`font-extrabold text-sm ${p.type === "in" ? "text-profit" : "text-cost"}`}>
                    {p.type === "in" ? "+" : "−"}RM {p.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>
          {pettySheet && (
            <PettyInputSheet
              kind={pettySheet}
              onClose={() => setPettySheet(null)}
              onSave={(amt, desc, emoji) => { onAddPetty(pettySheet, amt, desc, emoji); setPettySheet(null); }}
            />
          )}
        </>
      )}
    </div>
  );
};
