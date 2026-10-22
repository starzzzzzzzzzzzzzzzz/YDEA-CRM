import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDate, // ou updateDoc conforme padrão do seu projeto
  updateDoc,
  query, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; // Ajuste o import do db conforme o seu projeto
import { PropostaSolar } from '../types';

const COLLECTION_NAME = 'propostas_solares';

// Salvar nova proposta
Firestore: export async function criarProposta(proposta: Omit<PropostaSolar, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...proposta,
      criadoEm: new Date().toISOString(),
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

// Listar propostas de um Deal específico do CRM
export async function listarPropostasPorDeal(idDeal: string): Promise<PropostaSolar[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('idDeal', '==', idDeal));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropostaSolar));
  } catch (error) {
    console.error('Erro ao listar propostas do deal:', error);
    return [];
  }
}