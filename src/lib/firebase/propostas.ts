import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  query, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PropostaSolar } from '../types';

const COLLECTION_NAME = 'propostas_solares';

// Salvar nova proposta
export async function criarProposta(proposta: Omit<PropostaSolar, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...proposta,
      criadoEm: proposta.criadoEm || new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    return { success: false, error };
  }
}

// Buscar proposta por ID
export async function buscarPropostaPorId(id: string): Promise<PropostaSolar | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PropostaSolar;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar proposta:', error);
    return null;
  }
}

// Buscar propostas vinculadas a um Deal específico do CRM
export async function buscarPropostasPorDeal(idDeal: string): Promise<PropostaSolar[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('idDeal', '==', idDeal)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PropostaSolar[];
  } catch (error) {
    console.error('Erro ao buscar propostas do deal:', error);
    return [];
  }
}