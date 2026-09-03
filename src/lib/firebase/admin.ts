// ATENÇÃO: este arquivo só pode ser importado por código que roda no servidor
// (API routes, Server Components/Actions). Nunca importar isso em código de
// componente client ("use client") — a chave de admin não pode vazar pro navegador.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = join(process.cwd(), "service-account.json");

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;

  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      "service-account.json não encontrado na raiz do projeto. Baixe a chave em " +
        "Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada."
    );
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  return initializeApp({ credential: cert(serviceAccount) }, "admin");
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
