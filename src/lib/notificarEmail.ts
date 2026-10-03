import { auth } from "@/lib/firebase/config";

/**
 * Pede ao servidor para mandar e-mail a quem tem a função do funil do card.
 * O servidor decide os destinatários (função do funil) e monta o texto a partir do
 * próprio card — o navegador só informa qual card foi criado.
 * Nunca lança erro: e-mail é complemento, não pode atrapalhar a criação do card.
 */
export async function enviarEmailNovoCard(dealId: string, excluirAutor: boolean): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    const res = await fetch("/api/notificar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ dealId, excluirAutor }),
    });
    if (!res.ok) {
      const dados = await res.json().catch(() => null);
      console.warn("E-mail de novo card não enviado:", dados?.error ?? res.status);
    }
  } catch (err) {
    console.warn("E-mail de novo card não enviado:", err);
  }
}
