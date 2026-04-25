import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  Home, ShoppingCart, Package, BarChart3, Plus, Sparkles, TrendingUp, MessageCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader.jsx";
import SettingsPanel from "@/components/SettingsPanel.jsx";
import { BuyView } from "@/features/inventory/BuyView";
import { StockView } from "@/features/inventory/StockView";
import { LogView } from "@/features/money/LogView";
import { QuickInputModal } from "@/features/money/QuickInputModal";
import { ExportSheet } from "@/features/money/ExportSheet";
import { ChatView } from "@/features/ai/ChatView";
import { mockBotReply } from "@/features/ai/mockBotReply";
import { fmt } from "@/lib/format";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type {
  Tab, Txn, BuyItem, StockItem, ChatMsg, PettyEntry, ReceiptItem, Unit,
} from "@/types";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Selamat Pagi";
  if (h < 15) return "Selamat Tengah Hari";
  if (h < 19) return "Selamat Petang";
  return "Selamat Malam";
};

const Index = () => {
  const language = "ms";
  const [tab, setTab] = useState<Tab>("today");
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => localStorage.getItem("warkahbiz_profile_name") || "");
  const [businessName, setBusinessName] = useState(() => localStorage.getItem("warkahbiz_business_name") || "");
  const [txns, setTxns] = useLocalStorage<Txn[]>("warkahbiz_txns", []);
  const [stock, setStock] = useLocalStorage<StockItem[]>("warkahbiz_stock", []);
  const [buy, setBuy] = useLocalStorage<BuyItem[]>("warkahbiz_buy", []);
  const [dismissedAuto, setDismissedAuto] = useState<Set<string>>(new Set());
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [petty, setPetty] = useLocalStorage<PettyEntry[]>("warkahbiz_petty", [
    { id: 1, type: "in", desc: "Top-up dari jualan", emoji: "💵", amount: 200, time: "Isnin 9:00am", balance: 200 },
    { id: 2, type: "out", desc: "Beli plastik beg", emoji: "🛍️", amount: 15, time: "Isnin 11:30am", balance: 185 },
  ]);

  useEffect(() => {
    setChat((prev) => {
      const welcome = { id: 1, from: "bot" as const, text: "Hai Boss! Tanya saya apa-apa pasal untung, stok, atau harga. 😊" };
      if (prev.length === 0) return [welcome];
      return prev;
    });
  }, [language]);

  const today = useMemo(() => {
    const incoming = txns.filter((x) => x.type === "in").reduce((s, x) => s + x.amount, 0);
    const outgoing = txns.filter((x) => x.type === "out").reduce((s, x) => s + x.amount, 0);
    return { in: incoming, out: outgoing, profit: incoming - outgoing };
  }, [txns]);
  const week = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = txns.filter((x) => x.ts >= cutoff);
    const i = recent.filter((x) => x.type === "in").reduce((s, x) => s + x.amount, 0);
    const o = recent.filter((x) => x.type === "out").reduce((s, x) => s + x.amount, 0);
    return { in: i, out: o, profit: i - o };
  }, [txns]);
  const month = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = txns.filter((x) => x.ts >= cutoff);
    const i = recent.filter((x) => x.type === "in").reduce((s, x) => s + x.amount, 0);
    const o = recent.filter((x) => x.type === "out").reduce((s, x) => s + x.amount, 0);
    return { in: i, out: o, profit: i - o };
  }, [txns]);

  const nowTime = () =>
    new Date().toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(" ", "");

  const handleSaveTxn = (t: Omit<Txn, "id" | "ts" | "time">) => {
    const newTxn: Txn = {
      ...t,
      id: Date.now(),
      ts: Date.now(),
      time: nowTime(),
      createdAt: new Date().toISOString(),
    };
    setTxns((prev) => [...prev, newTxn]);
  };

  const handleReceiptConfirm = (items: ReceiptItem[]) => {
    const time = nowTime();
    const newTxns: Txn[] = items.map((r, i) => ({
      id: Date.now() + i,
      ts: Date.now() + i,
      time,
      createdAt: new Date().toISOString(),
      type: "out",
      emoji: r.emoji,
      label: `Beli ${r.name}`,
      amount: r.price,
    }));
    setTxns((prev) => [...prev, ...newTxns]);
    toast.success(`${items.length} item berjaya disimpan! 🎉`);
  };

  const handleBought = (id: string) => {
    setBuy((prev) => prev.map((b) => b.id === id ? { ...b, done: !b.done } : b));
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setStock((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const newQty = Math.max(0, +(s.qty + delta).toFixed(2));
      return { ...s, qty: newQty };
    }));
  };

  const handleSaveStock = (item: StockItem) => {
    setStock((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev.map((s) => s.id === item.id ? item : s);
      return [...prev, item];
    });
    toast.success("Stok disimpan ✅");
  };

  const handleDeleteStock = (id: string) => {
    setStock((prev) => prev.filter((s) => s.id !== id));
    toast.success("Item dipadam");
  };

  // Auto-sync: low-stock items appear in Nak Beli unless dismissed
  useEffect(() => {
    setBuy((prevBuy) => {
      let nextBuy = [...prevBuy];
      // Add new auto-restock items
      stock.forEach((s) => {
        if (s.qty > s.restockQty) return;
        const autoId = `auto-${s.id}`;
        if (dismissedAuto.has(autoId)) return;
        if (nextBuy.some((b) => b.id === autoId)) return;
        if (nextBuy.some((b) => b.name.toLowerCase() === s.name.toLowerCase() && b.source !== "auto")) return;
        const need = Math.max(s.restockQty - s.qty, s.restockQty);
        nextBuy.push({
          id: autoId, emoji: s.emoji, name: s.name, cost: 0,
          currentQty: s.qty, recQty: +need.toFixed(1), unit: s.unit, daysCover: 0,
          reason: s.qty <= s.minQty ? "Habis!" : "Hampir habis",
          done: false, source: "auto",
        });
      });
      // Remove stale auto items (stock now sufficient and not yet done)
      nextBuy = nextBuy.filter((b) => {
        if (b.source !== "auto") return true;
        const sId = b.id.replace(/^auto-/, "");
        const s = stock.find((x) => x.id === sId);
        if (!s) return true;
        if (s.qty > s.restockQty && !b.done) return false;
        return true;
      });
      return nextBuy;
    });
  }, [stock, dismissedAuto]);

  const handleResync = () => {
    setDismissedAuto(new Set());
    toast.success("Senarai dikemaskini dari Stok");
  };

  const handleAddBuy = (d: { emoji: string; name: string; recQty: number; unit: Unit; note?: string }) => {
    const newItem: BuyItem = {
      id: `m-${Date.now()}`, emoji: d.emoji || "🛒", name: d.name, cost: 0,
      currentQty: 0, recQty: d.recQty, unit: d.unit, daysCover: 0,
      reason: "", done: false, source: "manual", note: d.note,
    };
    setBuy((prev) => [...prev, newItem]);
  };

  const handleEditBuy = (id: string, d: { emoji: string; name: string; recQty: number; unit: Unit; note?: string }) => {
    setBuy((prev) => prev.map((b) => b.id === id ? { ...b, emoji: d.emoji, name: d.name, recQty: d.recQty, unit: d.unit, note: d.note } : b));
  };

  const handleDeleteBuy = (id: string) => {
    setBuy((prev) => prev.filter((b) => b.id !== id));
    if (id.startsWith("auto-")) setDismissedAuto((prev) => new Set(prev).add(id));
  };

  const handleBulkDone = (ids: string[]) => {
    setBuy((prev) => prev.map((b) => ids.includes(b.id) ? { ...b, done: true } : b));
  };

  const handleBulkDelete = (ids: string[]) => {
    setBuy((prev) => prev.filter((b) => !ids.includes(b.id)));
    setDismissedAuto((prev) => {
      const next = new Set(prev);
      ids.filter((id) => id.startsWith("auto-")).forEach((id) => next.add(id));
      return next;
    });
  };

  const handleClearCompleted = () => {
    setBuy((prev) => {
      const autoIds = prev.filter((b) => b.done && b.id.startsWith("auto-")).map((b) => b.id);
      if (autoIds.length) {
        setDismissedAuto((d) => {
          const next = new Set(d);
          autoIds.forEach((id) => next.add(id));
          return next;
        });
      }
      return prev.filter((b) => !b.done);
    });
  };

  const handleAddPetty = (type: "in" | "out", amount: number, desc: string, emoji: string) => {
    setPetty((prev) => {
      const last = prev[prev.length - 1]?.balance ?? 0;
      const balance = +(type === "in" ? last + amount : last - amount).toFixed(2);
      return [...prev, { id: Date.now(), type, desc, emoji, amount, time: nowTime(), balance }];
    });
  };

  const handleSendChat = (text: string) => {
    setChat((prev) => [
      ...prev,
      { id: Date.now(), from: "user", text },
      { id: Date.now() + 1, from: "bot", text: mockBotReply(text) },
    ]);
  };

  const saveProfile = (name: string, biz: string) => {
    setProfileName(name);
    setBusinessName(biz);
    localStorage.setItem("warkahbiz_profile_name", name);
    localStorage.setItem("warkahbiz_business_name", biz);
    setSettingsOpen(false);
    toast.success("Profil disimpan ✅");
  };

  const urgentCount = buy.filter((b) => !b.done).length;

  return (
    <div className="bg-gradient-shell min-h-screen text-foreground">
      <div className="mx-auto w-full max-w-[440px] min-h-screen relative bg-background shadow-card overflow-hidden flex flex-col">
        <AppHeader
          businessName={businessName || profileName}
          onOpenSettings={() => setSettingsOpen(true)}
          showNotificationDot={urgentCount > 0}
        />
        <div className="flex-1 overflow-y-auto pb-32 pt-0">
          {tab === "today" && <TodayView today={today} week={week} profileName={profileName} businessName={businessName} />}
          {tab === "buy" && (
            <BuyView
              buy={buy}
              stock={stock}
              onToggleDone={handleBought}
              onResync={handleResync}
              onAdd={handleAddBuy}
              onEdit={handleEditBuy}
              onDelete={handleDeleteBuy}
              onBulkDone={handleBulkDone}
              onBulkDelete={handleBulkDelete}
              onClearCompleted={handleClearCompleted}
              onGoToStock={() => setTab("stock")}
            />
          )}
          {tab === "stock" && (
            <StockView
              stock={stock}
              onAdjust={handleAdjustStock}
              onSave={handleSaveStock}
              onDelete={handleDeleteStock}
              onGoToBuy={() => setTab("buy")}
            />
          )}
          {tab === "log" && <LogView txns={txns} today={today} week={week} month={month} petty={petty} onExport={() => setExportOpen(true)} onAddPetty={handleAddPetty} />}
          {tab === "ai" && <ChatView messages={chat} onSend={handleSendChat} />}
        </div>

        <button onClick={() => setModalOpen(true)} className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-30 w-16 h-16 rounded-full bg-gradient-profit text-profit-foreground grid place-items-center shadow-fab tap ${urgentCount > 0 ? "animate-pulse-ring" : ""}`}>
          <Plus className="w-8 h-8" strokeWidth={3} />
        </button>

        <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[440px] z-20 bg-surface/90 backdrop-blur-xl border-t border-border">
          <div className="grid grid-cols-5 pt-2 pb-6 px-1">
            <TabBtn icon={<Home />} label="Hari Ini" active={tab === "today"} onClick={() => setTab("today")} />
            <TabBtn icon={<ShoppingCart />} label="Nak Beli" active={tab === "buy"} onClick={() => setTab("buy")} badge={urgentCount || undefined} />
            <TabBtn icon={<Package />} label="Stok" active={tab === "stock"} onClick={() => setTab("stock")} />
            <TabBtn icon={<BarChart3 />} label="Rekod" active={tab === "log"} onClick={() => setTab("log")} />
            <TabBtn icon={<MessageCircle />} label="Tanya AI" active={tab === "ai"} onClick={() => setTab("ai")} />
          </div>
        </nav>

        {modalOpen && (
          <QuickInputModal
            onClose={() => setModalOpen(false)}
            onSave={(t) => { handleSaveTxn(t); setModalOpen(false); }}
            onReceiptConfirm={(items) => { handleReceiptConfirm(items); setModalOpen(false); }}
          />
        )}
        {exportOpen && <ExportSheet onClose={() => setExportOpen(false)} />}
        {settingsOpen && (
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            profileName={profileName || "Boss"}
            businessName={businessName || "WarkahBiz"}
            onSaveProfile={saveProfile}
            onLogout={() => {}}
          />
        )}
      </div>
    </div>
  );
};

const TabBtn = ({ icon, label, active, onClick, badge }: {
  icon: ReactNode; label: string; active: boolean; onClick: () => void; badge?: number;
}) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 py-1 tap relative">
    <div className={`w-12 h-9 grid place-items-center rounded-2xl transition-all ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
      <div className="w-5 h-5">{icon}</div>
    </div>
    <span className={`text-[11px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
    {badge ? (
      <span className="absolute top-0 right-3 min-w-5 h-5 px-1 grid place-items-center text-[10px] font-bold bg-cost text-cost-foreground rounded-full animate-pop-in">{badge}</span>
    ) : null}
  </button>
);

const TodayView = ({ today, week, profileName, businessName }: {
  today: { in: number; out: number; profit: number };
  week: { in: number; out: number; profit: number };
  profileName: string;
  businessName: string;
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  return (
    <div className="px-5 pt-6 space-y-5">
      <header className="animate-fade-in">
        <p className="text-muted-foreground text-sm font-medium">{greeting()}, {profileName || "Boss"}! 👋</p>
        <h1 className="text-2xl font-extrabold tracking-tight mt-1">{businessName || "WarkahBiz"}</h1>
      </header>

      <div className="rounded-[2rem] p-6 bg-gradient-profit text-profit-foreground shadow-glow relative overflow-hidden animate-pop-in">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="w-4 h-4" />
            Untung Hari Ini 💚
          </div>
          <div className="text-6xl font-extrabold mt-3 tracking-tight">{fmt(today.profit)}</div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium opacity-95">
            <TrendingUp className="w-4 h-4" />
            Minggu ini: <span className="font-bold">{fmt(week.profit)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-5 bg-gradient-income text-white shadow-card animate-fade-in">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">Duit Masuk 💰</div>
          <div className="text-3xl font-extrabold mt-2">{fmt(today.in)}</div>
          <div className="text-[11px] opacity-80 mt-1">Hari ini</div>
        </div>
        <div className="rounded-3xl p-5 bg-gradient-cost text-white shadow-card animate-fade-in">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">Duit Keluar 💸</div>
          <div className="text-3xl font-extrabold mt-2">{fmt(today.out)}</div>
          <div className="text-[11px] opacity-80 mt-1">Hari ini</div>
        </div>
      </div>

      <section className="space-y-3 animate-fade-in">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Boss Kena Tahu</h2>
        <button
          onClick={() => setInsight("Minyak masak naik 18% berbanding minggu lepas. Cuba beli saiz besar (5L) — boleh jimat lebih kurang RM 14 seminggu.")}
          className="w-full text-left rounded-2xl p-4 bg-warn-soft border border-warn/30 tap"
        >
          <p className="font-semibold text-warn-foreground/90">⚠️ Minyak masak naik 18% minggu ini berbanding minggu lepas.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap untuk tips →</p>
        </button>
        <button
          onClick={() => setInsight("Jumaat & Sabtu adalah hari paling laris (purata RM 1,580/hari). Tambah stok ayam & tepung 30% malam Khamis untuk maksimumkan jualan.")}
          className="w-full text-left rounded-2xl p-4 bg-profit/10 border border-profit/30 tap"
        >
          <p className="font-semibold">🎉 Jumaat & Sabtu hari terbaik — tambah stok malam ni!</p>
          <p className="text-xs text-muted-foreground mt-1">Tap untuk tips →</p>
        </button>
      </section>

      {insight && <InsightModal text={insight} onClose={() => setInsight(null)} />}
    </div>
  );
};

const InsightModal = ({ text, onClose }: { text: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-40 grid place-items-center p-5" onClick={onClose}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
    <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm bg-surface rounded-3xl p-6 animate-pop-in">
      <div className="text-3xl">💡</div>
      <h3 className="font-extrabold text-lg mt-2">Tips dari WarkahBiz</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{text}</p>
      <button onClick={onClose} className="mt-5 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold tap">
        Faham, terima kasih!
      </button>
    </div>
  </div>
);

export default Index;
