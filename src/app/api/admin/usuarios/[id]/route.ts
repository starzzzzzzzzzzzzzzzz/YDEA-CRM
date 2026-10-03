import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * Exclui um colaborador: apaga a conta de login (Firebase Auth), o cadastro em "usuarios"
 * e as notificações dele. Só administradores podem chamar, e ninguém exclui a si mesmo
 * (isso também garante que sempre sobra pelo menos um administrador).
 * As anotações e atividades antigas guardam o nome de quem escreveu como texto, então o histórico continua.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!idToken) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let callerUid: string;
  try {
    callerUid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Sessão inválida. Faça login de novo." }, { status: 401 });
  }

  // A checagem de administrador é feita aqui no servidor, porque o Admin SDK ignora as regras do Firestore.
  const callerDoc = await adminDb().collection("usuarios").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data()?.cargoId !== "admin") {
    return NextResponse.json({ error: "Só administradores podem excluir usuários." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Informe o usuário." }, { status: 400 });
  if (id === callerUid) {
    return NextResponse.json({ error: "Você não pode excluir a sua própria conta." }, { status: 400 });
  }

  try {
    await adminAuth().deleteUser(id);
  } catch (err) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code;
    // Se a conta de login já não existe, segue e limpa só o cadastro.
    if (code !== "auth/user-not-found") {
      console.error("Erro ao excluir a conta de login:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Não foi possível excluir a conta de login." }, { status: 500 });
    }
  }

  await adminDb().collection("usuarios").doc(id).delete();

  // Limpa as notificações da pessoa (o Firestore aceita até 500 operações por lote).
  const notificacoes = await adminDb().collection("notificacoes").where("usuarioId", "==", id).get();
  for (let i = 0; i < notificacoes.docs.length; i += 400) {
    const lote = adminDb().batch();
    notificacoes.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
    await lote.commit();
  }

  return NextResponse.json({ ok: true });
}
