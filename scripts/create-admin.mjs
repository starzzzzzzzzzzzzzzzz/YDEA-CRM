// Cria a PRIMEIRA conta de administrador — o único passo manual de toda a
// configuração. A partir daí, esse admin cria todo o resto do time direto
// pela tela "Equipe" do CRM (o painel de Admin usa este mesmo mecanismo,
// só que pelo navegador em vez do terminal).
//
// Uso:
//   1. Baixe a chave de conta de serviço no Firebase Console:
//      Configurações do projeto → Contas de serviço → Gerar nova chave privada
//   2. Salve o arquivo como service-account.json na raiz do projeto
//      (esse arquivo já está no .gitignore — NUNCA comitar)
//   3. Ajuste ADMIN abaixo se quiser outro nome/e-mail/senha
//   4. Rode: node scripts/create-admin.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "..", "service-account.json");

if (!existsSync(serviceAccountPath)) {
  console.error(
    "\n❌ Não encontrei service-account.json na raiz do projeto.\n" +
      "   Baixe a chave em: Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada\n" +
      "   e salve como service-account.json na raiz (ela já está no .gitignore).\n"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

const ADMIN = {
  nome: "Kauê Victor",
  email: "kauevictor.ydeasolar@gmail.com",
  senha: "Yde@2023",
  iniciais: "KV",
};

async function main() {
  let uid;
  try {
    const existing = await auth.getUserByEmail(ADMIN.email);
    uid = existing.uid;
    console.log(`Já existe uma conta com esse e-mail (uid ${uid}) — só atualizando a senha e o cargo.`);
    await auth.updateUser(uid, { password: ADMIN.senha, displayName: ADMIN.nome });
  } catch {
    const created = await auth.createUser({
      email: ADMIN.email,
      password: ADMIN.senha,
      displayName: ADMIN.nome,
    });
    uid = created.uid;
    console.log(`Conta criada no Firebase Auth (uid ${uid}).`);
  }

  await db.collection("usuarios").doc(uid).set({
    nome: ADMIN.nome,
    email: ADMIN.email,
    iniciais: ADMIN.iniciais,
    cargoId: "admin",
  });

  console.log(`\n✅ Pronto. Login: ${ADMIN.email} / senha: ${ADMIN.senha}`);
  console.log("   Troque a senha depois do primeiro login (Esqueci minha senha, ou pelo Firebase Console).");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao criar o admin:", err);
  process.exit(1);
});
