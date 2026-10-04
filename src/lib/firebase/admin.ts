// ATENÇÃO: este arquivo só pode ser importado por código que roda no servidor
// (API routes, Server Components/Actions). Nunca importar isso em código de
// componente client ("use client") — a chave de admin não pode vazar pro navegador.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = join(process.cwd(), "service-account.json");

/**
 * Lê a chave de administrador do Firebase.
 * - Em produção (Vercel): da variável de ambiente FIREBASE_SERVICE_ACCOUNT, com o conteúdo
 *   inteiro do service-account.json (esse arquivo não vai pro Git, então não existe lá).
 * - No computador: do arquivo service-account.json na raiz do projeto.
 */
function lerCredencial(): Record<string, unknown> {
  const doEnv = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (doEnv) {
    let credencial: Record<string, unknown>;
    try {
      credencial = JSON.parse(doEnv);
    } catch {
      throw new Error(
        "A variável FIREBASE_SERVICE_ACCOUNT não é um JSON válido. Cole o conteúdo inteiro do service-account.json."
      );
    }
    // Se as quebras de linha da chave privada vierem como texto "\n", converte pro caractere real.
    if (typeof credencial.private_key === "string") {
      credencial.private_key = credencial.private_key.replace(/\\n/g, "\n");
    }
    return credencial;
  }

  if (existsSync(SERVICE_ACCOUNT_PATH)) {
    return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
  }

  throw new Error(
    "Credencial do Firebase Admin não encontrada. Em produção, defina a variável FIREBASE_SERVICE_ACCOUNT; " +
      "no computador, baixe a chave em Firebase Console → Configurações do projeto → Contas de serviço → " +
      "Gerar nova chave privada e salve como service-account.json na raiz do projeto."
  );
}

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;

  return initializeApp({ credential: cert(lerCredencial()) }, "admin");
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
