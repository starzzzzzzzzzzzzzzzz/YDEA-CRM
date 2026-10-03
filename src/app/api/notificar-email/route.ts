import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FUNNELS, FUNCAO_DO_FUNIL } from "@/lib/funnels";

function esc(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Manda e-mail de "novo card" para quem tem a função do funil (ex.: funil Engenharia →
 * quem tem a função Engenharia). Serviço de e-mail: Resend (https://resend.com), via API REST.
 * Variáveis de ambiente: RESEND_API_KEY (obrigatória) e EMAIL_FROM (ex.: "CRM YDEA <crm@seudominio.com.br>").
 * Segurança: os destinatários e o texto saem do Firestore (não do que o navegador envia),
 * então a rota não serve pra mandar mensagem arbitrária pra qualquer endereço.
 */
export async function POST(req: NextRequest) {
  const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!idToken) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let callerUid: string;
  try {
    callerUid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "E-mail não configurado (falta RESEND_API_KEY)." }, { status: 503 });
  }
  const from = process.env.EMAIL_FROM || "CRM YDEA <onboarding@resend.dev>";

  const body = await req.json().catch(() => null);
  const dealId = typeof body?.dealId === "string" ? body.dealId : "";
  const excluirAutor = body?.excluirAutor === true;
  if (!dealId) return NextResponse.json({ error: "Informe o dealId." }, { status: 400 });

  const dealSnap = await adminDb().collection("deals").doc(dealId).get();
  if (!dealSnap.exists) return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  const deal = dealSnap.data() as { titulo?: string; funnelId?: string; stageId?: string };

  const funcao = deal.funnelId ? FUNCAO_DO_FUNIL[deal.funnelId as keyof typeof FUNCAO_DO_FUNIL] : undefined;
  if (!funcao) return NextResponse.json({ enviados: 0, motivo: "Funil sem função responsável." });

  const funil = FUNNELS.find((f) => f.id === deal.funnelId);
  const etapa = funil?.stages.find((s) => s.id === deal.stageId);

  const usuariosSnap = await adminDb().collection("usuarios").where("funcao", "==", funcao).get();
  const autor = (await adminDb().collection("usuarios").doc(callerUid).get()).data()?.nome ?? "Alguém da equipe";
  const destinatarios = usuariosSnap.docs
    .filter((d) => !(excluirAutor && d.id === callerUid))
    .map((d) => ({ nome: (d.data().nome as string) ?? "", email: d.data().email as string }))
    .filter((u) => !!u.email)
    .slice(0, 20);

  if (destinatarios.length === 0) return NextResponse.json({ enviados: 0, motivo: "Ninguém com essa função." });

  const titulo = deal.titulo ?? "Novo negócio";
  const destino = `${funil?.name ?? ""}${etapa ? " · " + etapa.label : ""}`;
  const link = `${req.nextUrl.origin}/funil?negocio=${encodeURIComponent(dealId)}`;
  const assunto = `Novo card em ${funil?.name ?? "um funil"}: ${titulo}`;

  const resultados = await Promise.allSettled(
    destinatarios.map(async (u) => {
      const html = `<div style="font-family:Arial,sans-serif;color:#12263A;max-width:520px">
<p>Olá${u.nome ? ", " + esc(u.nome.split(" ")[0]) : ""}!</p>
<p>${esc(autor)} criou um card para a sua área:</p>
<p style="padding:14px 16px;background:#F3F6F9;border-left:4px solid #E8A100;margin:16px 0"><b>${esc(titulo)}</b><br>${esc(destino)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#E8A100;color:#2B1D00;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:6px">Abrir no CRM</a></p>
<p style="color:#5B6B7B;font-size:13px">YDEA Soluções Energéticas · aviso automático do CRM</p></div>`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [u.email], subject: assunto, html }),
      });
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    })
  );

  const falhas = resultados.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  falhas.forEach((f) => console.error("Falha ao enviar e-mail:", f.reason));
  return NextResponse.json({ enviados: resultados.length - falhas.length, falhas: falhas.length });
}
