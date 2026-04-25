import { useEffect, useState, useCallback } from "react";
import {
  collection, doc, onSnapshot, addDoc, setDoc,
  deleteDoc, updateDoc, query, orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import type { Txn, StockItem, BuyItem, PettyEntry } from "@/types";

const USER_ID = "default_user";
const col = (name: string) => collection(db, "users", USER_ID, name);

// --- Transactions ---
export function useTxns() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(col("txns"), orderBy("ts", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTxns(snap.docs.map((d) => ({ ...(d.data() as Txn) })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addTxn = useCallback(async (txn: Txn) => {
    await addDoc(col("txns"), txn);
  }, []);

  return { txns, loading, addTxn };
}

// --- Stock ---
export function useStock() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(col("stock"), (snap) => {
      setStock(snap.docs.map((d) => d.data() as StockItem));
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveStock = useCallback(async (item: StockItem) => {
    await setDoc(doc(col("stock"), item.id), item);
  }, []);

  const deleteStock = useCallback(async (id: string) => {
    await deleteDoc(doc(col("stock"), id));
  }, []);

  const adjustStock = useCallback(async (id: string, newQty: number) => {
    await updateDoc(doc(col("stock"), id), { qty: newQty });
  }, []);

  return { stock, loading, saveStock, deleteStock, adjustStock };
}

// --- Buy list ---
export function useBuyList() {
  const [buy, setBuy] = useState<BuyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(col("buyList"), (snap) => {
      setBuy(snap.docs.map((d) => d.data() as BuyItem));
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveBuyItem = useCallback(async (item: BuyItem) => {
    await setDoc(doc(col("buyList"), item.id), item);
  }, []);

  const deleteBuyItem = useCallback(async (id: string) => {
    await deleteDoc(doc(col("buyList"), id));
  }, []);

  const updateBuyItem = useCallback(async (id: string, updates: Partial<BuyItem>) => {
    await updateDoc(doc(col("buyList"), id), updates as { [key: string]: unknown });
  }, []);

  return { buy, loading, saveBuyItem, deleteBuyItem, updateBuyItem };
}

// --- Petty cash ---
export function usePetty() {
  const [petty, setPetty] = useState<PettyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(col("petty"), orderBy("id", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPetty(snap.docs.map((d) => d.data() as PettyEntry));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addPetty = useCallback(async (entry: PettyEntry) => {
    await addDoc(col("petty"), entry);
  }, []);

  return { petty, loading, addPetty };
}