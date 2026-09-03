"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { fetchUsuario } from "@/lib/firebase/firestore";
import { Usuario } from "@/lib/types";

type AuthContextValue = {
  /** Usuário logado, já casado com o documento dele em `usuarios` no Firestore. `null` = deslogado. */
  user: Usuario | null;
  /** true enquanto o Firebase ainda está resolvendo a sessão (evita "piscar" a tela de login). */
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setError(null);

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const usuarioDoc = await fetchUsuario(fbUser.uid);

        if (!usuarioDoc) {
          // Conta existe no Firebase Auth mas ninguém tem o documento correspondente
          // em `usuarios` — não deveria acontecer se o cadastro sempre passar pelo
          // painel de Admin (que cria as duas coisas juntas), mas por segurança
          // barramos o acesso mesmo assim.
          setError("Sua conta não tem cadastro em `usuarios`. Peça pro admin te recriar pelo painel.");
          setUser(null);
          await signOut(auth);
          return;
        }

        setUser({
          id: fbUser.uid,
          nome: usuarioDoc.nome,
          email: usuarioDoc.email,
          iniciais: usuarioDoc.iniciais,
          cargoId: usuarioDoc.cargoId,
        });
      } catch (err) {
        console.error("Erro ao carregar usuário do Firestore:", err);
        setError("Não foi possível carregar seus dados. Tente novamente em instantes.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email: string, senha: string) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // onAuthStateChanged acima cuida de popular `user` a partir do Firestore.
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(mapAuthError(code));
      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Aguarde um pouco antes de tentar de novo.";
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/network-request-failed":
      return "Falha de conexão. Confira sua internet e tente de novo.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}
