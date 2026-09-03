// Popula o Firestore com o time inicial da Ydea Solar.
//
// Com login por Google, NÃO criamos contas no Firebase Auth aqui — isso
// acontece sozinho na primeira vez que a pessoa clicar em "Entrar com Google".
// Este script só grava, em `usuarios`, quais e-mails têm permissão de entrar
// e com qual cargo. Quem não estiver aqui não consegue acessar o CRM, mesmo
// logando certinho com uma conta Google válida (o AuthContext barra e desloga).
//
// Uso:
//   1. Baixe a chave de conta de serviço no Firebase Console:
//      Configurações do projeto → Contas de serviço → Gerar nova chave privada
//   2. Salve o arquivo como service-account.json na raiz do projeto
//      (esse arquivo já está no .gitignore — NUNCA comitar)
//   3. Rode: npm run seed:firestore

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
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

const db = getFirestore();

// Mesma lista que vivia em src/lib/db/usuarios.ts — agora vira dado real no Firestore.
// Troque os e-mails pelos e-mails Google reais de cada pessoa antes de rodar.
const TIME = [
  { nome: "Kauê Victor", email: "kaue@ydeaenergia.com.br", iniciais: "KV", cargoId: "admin" },
  { nome: "Marcos", email: "marcos@ydeaenergia.com.br", iniciais: "MK", cargoId: "vendedor" },
  { nome: "Fernanda", email: "fernanda@ydeaenergia.com.br", iniciais: "FE", cargoId: "vendedor" },
  { nome: "Yago Duarte", email: "yago@ydeaenergia.com.br", iniciais: "YD", cargoId: "projetista" },
  { nome: "Juliana Costa", email: "juliana@ydeaenergia.com.br", iniciais: "JC", cargoId: "pos_venda" },
  { nome: "Felipe Gomes", email: "felipe@ydeaenergia.com.br", iniciais: "FG", cargoId: "instalacao" },
  { nome: "Renata Alves", email: "renata@ydeaenergia.com.br", iniciais: "RA", cargoId: "financeiro" },
];

async function main() {
  console.log(`Semeando ${TIME.length} usuários em \`usuarios\` (Firestore)...\n`);

  for (const pessoa of TIME) {
    // doc ID = e-mail com "@" e "." trocados por "_" (só pra ficar legível no console;
    // a busca no login é sempre por e-mail, não pelo ID do documento).
    const docId = pessoa.email.replace(/[@.]/g, "_");
    await db.collection("usuarios").doc(docId).set({
      nome: pessoa.nome,
      email: pessoa.email,
      iniciais: pessoa.iniciais,
      cargoId: pessoa.cargoId,
    });
    console.log(`  gravado: usuarios/${docId} → ${pessoa.email} (${pessoa.cargoId})`);
  }

  console.log(
    "\n✅ Pronto. Agora cada pessoa clica em \"Entrar com Google\" na tela de login,\n" +
      "   usando exatamente um desses e-mails. A conta no Firebase Auth é criada\n" +
      "   sozinha no primeiro login — não precisa senha nenhuma."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao semear o Firestore:", err);
  process.exit(1);
});
