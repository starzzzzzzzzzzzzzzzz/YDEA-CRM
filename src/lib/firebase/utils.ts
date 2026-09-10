/**
 * O Firestore não aceita `undefined` em nenhum campo — só aceita quando o campo
 * simplesmente não existe no objeto. Como nossos formulários têm muitos campos
 * opcionais que ficam `undefined` quando não preenchidos, toda escrita
 * (addDoc/updateDoc) precisa passar por aqui antes de ir pro Firestore.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
