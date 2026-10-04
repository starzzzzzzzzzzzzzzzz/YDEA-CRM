import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { stripUndefined } from "./utils";
import { Lead } from "@/lib/types";

/** Leads do CRM (coleção `leads`). */
const COLLECTION = "leads";

export async function fetchLeads(): Promise<Lead[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Lead, "id">), id: d.id }))
    .sort((a, b) => (b.criadoEm ?? "").localeCompare(a.criadoEm ?? ""));
}

export async function addLeadDoc(dados: Omit<Lead, "id">): Promise<Lead> {
  const ref = await addDoc(collection(db, COLLECTION), stripUndefined(dados));
  return { ...dados, id: ref.id };
}

export async function updateLeadDoc(id: string, patch: Partial<Omit<Lead, "id">>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(patch));
}
