import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FUNNELS, FUNCAO_DO_FUNIL } from "@/lib/funnels";

// O nodemailer precisa do runtime Node.js (não funciona no Edge).
export const runtime = "nodejs";

function esc(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Manda e-mail de "novo card" para quem tem a função do funil (ex.: funil Engenharia →
 * quem tem a função Engenharia). Envio pelo Gmail (SMTP com senha de app), via nodemailer.
 * Variáveis de ambiente: GMAIL_USER (e-mail da conta remetente) e GMAIL_APP_PASSWORD
 * (senha de app de 16 caracteres, gerada em myaccount.google.com/apppasswords).
 * Obs.: o Gmail sempre usa o endereço da conta autenticada como remetente.
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

  const gmailUser = process.env.GMAIL_USER?.trim();
  // A senha de app é mostrada com espaços; aqui eles são removidos caso tenham sido colados junto.
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!gmailUser || !gmailPass) {
    return NextResponse.json(
      { error: "E-mail não configurado (faltam GMAIL_USER e GMAIL_APP_PASSWORD)." },
      { status: 503 }
    );
  }
  const from = `CRM YDEA <${gmailUser}>`;

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

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  // Envio um por vez: o Gmail recusa muitas conexões simultâneas na mesma conta.
  let enviados = 0;
  let falhas = 0;
  for (const u of destinatarios) {
    const html = `<div style="font-family:Arial,sans-serif;color:#12263A;max-width:520px">
<p>Olá${u.nome ? ", " + esc(u.nome.split(" ")[0]) : ""}!</p>
<p>${esc(autor)} criou um card para a sua área:</p>
<p style="padding:14px 16px;background:#F3F6F9;border-left:4px solid #E8A100;margin:16px 0"><b>${esc(titulo)}</b><br>${esc(destino)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#E8A100;color:#2B1D00;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:6px">Abrir no CRM</a></p>
<p style="color:#5B6B7B;font-size:13px">YDEA Soluções Energéticas · aviso automático do CRM</p></div>`;
    try {
      await transporter.sendMail({ from, to: u.email, subject: assunto, html });
      enviados++;
    } catch (err) {
      falhas++;
      console.error("Falha ao enviar e-mail:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ enviados, falhas });
}
