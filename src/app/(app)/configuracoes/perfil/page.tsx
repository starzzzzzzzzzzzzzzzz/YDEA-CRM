"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/store/AuthContext";
import { useCrmData } from "@/lib/store/CrmDataContext";
import { useToast } from "@/components/ui/Toast";
import { Field, inputClass, SectionTitle } from "@/components/ui/Field";
import { CARGOS } from "@/lib/db/cargos";
import { atualizarPerfilUsuario } from "@/lib/firebase/firestore";

/**
 * Redimensiona a imagem no próprio navegador (lado maior = 256px) e comprime
 * como JPEG antes de virar um data URL. Assim a foto cabe tranquilamente num
 * campo do Firestore (limite de 1MB por documento) sem precisar do Firebase
 * Storage — que hoje exige plano pago (Blaze) mesmo pra uso pequeno.
 */
function resizeImageToDataUrl(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas não suportado neste navegador."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * "Configurações de perfil" — igual a "Informações gerais" da referência:
 * foto, nome, sobrenome, e-mail, telefone editáveis; perfil de permissão
 * (cargo) fica só leitura aqui porque quem define é o admin (painel /usuarios).
 */
export default function ConfiguracoesPerfilPage() {
  const { currentUser } = useCrmData();
  const { atualizarUsuarioLocal } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(currentUser.nome);
  const [sobrenome, setSobrenome] = useState(currentUser.sobrenome ?? "");
  const [telefone, setTelefone] = useState(currentUser.telefone ?? "");
  const [fotoUrl, setFotoUrl] = useState(currentUser.fotoUrl);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const cargo = CARGOS.find((c) => c.id === currentUser.cargoId);

  const sujo =
    nome !== currentUser.nome ||
    sobrenome !== (currentUser.sobrenome ?? "") ||
    telefone !== (currentUser.telefone ?? "") ||
    fotoUrl !== currentUser.fotoUrl;

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFoto(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setFotoUrl(dataUrl);
    } catch (err) {
      console.error("Erro ao processar foto de perfil:", err);
      showToast("Não foi possível enviar a imagem. Tente de novo.", "error");
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await atualizarPerfilUsuario(currentUser.id, {
        nome: nome.trim(),
        sobrenome: sobrenome.trim() || undefined,
        telefone: telefone.trim() || undefined,
        fotoUrl,
      });
      atualizarUsuarioLocal({
        nome: nome.trim(),
        sobrenome: sobrenome.trim() || undefined,
        telefone: telefone.trim() || undefined,
        fotoUrl,
      });
      showToast("Perfil atualizado.");
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      showToast("Não foi possível salvar. Tente de novo.", "error");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-xl text-text-dark mb-1">Configurações de perfil</h1>
      <p className="text-[13px] text-text-gray mb-6">
        Seus dados pessoais dentro do CRM — visíveis pra sua equipe nos negócios e atividades.
      </p>

      <form
        onSubmit={handleSalvar}
        className="rounded-2xl border border-border bg-card-bg p-6 space-y-6"
      >
        <SectionTitle>Informações gerais</SectionTitle>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[13px] font-medium text-text-dark">Foto de perfil</span>
          <div className="h-20 w-20 rounded-full bg-brand-soft text-brand-strong font-display font-semibold text-xl flex items-center justify-center overflow-hidden">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              currentUser.iniciais
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />
          <div className="flex items-center gap-3 text-[12.5px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              className="font-semibold text-badge-blue-text hover:underline disabled:opacity-60"
            >
              {uploadingFoto ? "Enviando..." : fotoUrl ? "Trocar imagem" : "Enviar imagem"}
            </button>
            {fotoUrl && (
              <button
                type="button"
                onClick={() => setFotoUrl(undefined)}
                className="inline-flex items-center gap-1 font-semibold text-badge-blue-text hover:underline"
              >
                Remover imagem <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome" required>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Sobrenome">
            <input
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              placeholder="Ex.: Silva"
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" required>
            <input value={currentUser.email} disabled className={inputClass} />
          </Field>
          <Field label="Telefone">
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex.: (00) 00000-0000"
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Perfil de permissão"
          hint="Quem define o seu cargo é um administrador, na página Equipe."
        >
          <input value={cargo?.nome ?? currentUser.cargoId} disabled className={inputClass} />
        </Field>

        <div className="flex justify-end gap-2 pt-2 border-t border-border-soft">
          <button
            type="submit"
            disabled={!sujo || salvando}
            className="rounded-lg bg-brand text-text-dark font-semibold text-[12.5px] px-4 py-2.5 hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
