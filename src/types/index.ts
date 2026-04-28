export type Tab = "today" | "bekalan" | "log" | "ai";
export type StockLevel = "habis" | "sedikit" | "cukup" | "banyak";
export type TxnType = "in" | "out";
export type Unit = "kg" | "g" | "liter" | "ml" | "biji" | "pek" | "kotak" | "batang" | "helai";
export type StockCategory = "Bahan Mentah" | "Minuman" | "Pembungkusan" | "Lain-lain";
export const STOCK_CATEGORIES: StockCategory[] = ["Bahan Mentah", "Minuman", "Pembungkusan", "Lain-lain"];

export interface Txn {
  id: number;
  type: TxnType;
  emoji: string;
  label: string;
  amount: number;
  time: string; // display
  ts: number;   // sort
  createdAt?: string; // ISO date string
}

export interface BuyItem {
  id: string;
  emoji: string;
  name: string;
  cost: number;        // estimated cost of recommended qty
  currentQty: number;  // baki sekarang
  recQty: number;      // cadangan beli
  unit: Unit;
  daysCover: number;
  reason: string;
  done: boolean;
  removing?: boolean;
  source?: "auto" | "manual";
  note?: string;
}

export interface StockItem {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  unit: Unit;
  minQty: number;     // below = habis
  restockQty: number; // below = sedikit
  maxQty?: number;    // capacity for progress bar
  category?: StockCategory;
}

export interface SafeStockItem {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  unit: Unit;
  dailyUsage: number;
}

export interface ChatMsg {
  id: number;
  from: "user" | "bot";
  text: string;
}

export interface PettyEntry {
  id: number;
  type: "in" | "out";
  desc: string;
  emoji: string;
  amount: number;
  time: string;
  balance: number;
}

/** Line items from receipt scan / quick expense confirm. */
export interface ReceiptItem {
  emoji: string;
  name: string;
  qty: number;
  unit: Unit;
  price: number;
}

export const UNIT_STEP: Record<Unit, number> = {
  kg: 0.5, g: 50, liter: 0.5, ml: 100,
  biji: 1, pek: 1, kotak: 1, batang: 1, helai: 1,
};

export type OpExCategory =
  | "Kos Bahan"
  | "Utiliti"
  | "Pembungkusan"
  | "Gaji"
  | "Pengangkutan"
  | "Lain-lain";

export const OPEX_CATEGORIES: OpExCategory[] = [
  "Kos Bahan", "Utiliti", "Pembungkusan", "Gaji", "Pengangkutan", "Lain-lain",
];

export const OPEX_EMOJI: Record<OpExCategory, string> = {
  "Kos Bahan":    "🥩",
  "Utiliti":      "💡",
  "Pembungkusan": "📦",
  "Gaji":         "👷",
  "Pengangkutan": "🚚",
  "Lain-lain":    "🏷️",
};

export interface OpExEntry {
  id: number;
  category: OpExCategory;
  desc: string;
  amount: number;
  time: string;
  ts: number;
  createdAt: string;
  paidFromPetty: boolean;
}
