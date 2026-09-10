/**
 * Gera um "ID de suporte" curto e estável a partir do UID do usuário — é só
 * pra identificar a conta rapidamente numa conversa de suporte (tipo o
 * "#417391" que aparece no menu de outros CRMs), não é um ID de segurança
 * nem substitui o UID de verdade do Firebase Auth.
 */
export function gerarIdSuporte(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const numero = 100000 + (hash % 900000);
  return `#${numero}`;
}
