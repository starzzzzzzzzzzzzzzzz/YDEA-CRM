import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { CargoId } from "@/lib/types";

const CARGOS_VALIDOS: CargoId[] = [
  "admin",
  "vendedor",
  "projetista",
  "financeiro",
  "instalacao",
  "pos_venda",
];

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? [partes[0][0], partes[partes.length - 1][0]] : [partes[0]?.[0] ?? "?"];
  return letras.join("").toUpperCase();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace(/^Bearer\s+/i, "");

  if (!idToken) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Sessão inválida. Faça login de novo." }, { status: 401 });
  }

  // Só quem já é admin no Firestore pode criar novas contas — a checagem é
  // feita aqui no servidor com o Admin SDK, que ignora as regras do cliente
  // (por isso essa validação manual é obrigatória).
  const callerDoc = await adminDb().collection("usuarios").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data()?.cargoId !== "admin") {
    return NextResponse.json({ error: "Só administradores podem criar usuários." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";
  const cargoId = body?.cargoId as CargoId | undefined;

  if (!nome || !email || !senha || !cargoId) {
    return NextResponse.json({ error: "Preencha nome, e-mail, senha e cargo." }, { status: 400 });
  }
  if (!CARGOS_VALIDOS.includes(cargoId)) {
    return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  try {
    const created = await adminAuth().createUser({ email, password: senha, displayName: nome });
    await adminDb().collection("usuarios").doc(created.uid).set({
      nome,
      email,
      iniciais: iniciaisDe(nome),
      cargoId,
    });
    return NextResponse.json({ id: created.uid, nome, email, iniciais: iniciaisDe(nome), cargoId });
  } catch (err) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code;
    const message =
      code === "auth/email-already-exists"
        ? "Já existe uma conta com esse e-mail."
        : "Não foi possível criar o usuário. Confira o arquivo service-account.json.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
