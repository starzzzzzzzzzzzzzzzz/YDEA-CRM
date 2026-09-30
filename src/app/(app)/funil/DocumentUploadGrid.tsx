"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Eye, Download, Trash2, FileText, Loader2, X } from "lucide-react";
import { DocumentoAnexo, DocumentoTipo, DOCUMENTO_LABEL } from "@/lib/types";
import { arquivoParaDataUrl } from "@/lib/fileToDataUrl";
import { addDocumento, removeDocumento } from "@/lib/firebase/documentos";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

const DOC_TYPES: DocumentoTipo[] = [
  "conta_energia",
  "cpf",
  "rg",
  "cnh",
  "comprovante",
  "kit_fotovoltaico",
  "projeto",
  "drone",
];

function ehImagem(a: DocumentoAnexo): boolean {
  return !!a.previewUrl && (a.previewUrl.startsWith("data:image") || a.previewUrl.startsWith("blob:"));
}

function ehPdf(a: DocumentoAnexo): boolean {
  return !!a.previewUrl?.startsWith("data:application/pdf");
}

/** Fotos são recomprimidas como JPEG ao enviar, então a extensão do download acompanha o conteúdo. */
function nomeParaDownload(a: DocumentoAnexo): string {
  if (a.previewUrl?.startsWith("data:image/jpeg") && !/\.jpe?g$/i.test(a.nome)) {
    return a.nome.replace(/\.[^.]+$/, "") + ".jpg";
  }
  return a.nome;
}

function baixar(a: DocumentoAnexo) {
  if (!a.previewUrl) return;
  const link = document.createElement("a");
  link.href = a.previewUrl;
  link.download = nomeParaDownload(a);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Abre a imagem ou o PDF numa janela dentro do app. Os navegadores bloqueiam abrir
 * data URLs direto numa aba nova, por isso não usamos window.open aqui.
 */
function Visualizador({ anexo, onClose }: { anexo: DocumentoAnexo; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const imagem = ehImagem(anexo);
  const pdf = ehPdf(anexo);

  useEffect(() => {
    if (!pdf || !anexo.previewUrl) return;
    let url: string | null = null;
    let cancelado = false;
    fetch(anexo.previewUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelado) return;
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      })
      .catch((err) => console.error("Erro ao abrir o PDF:", err));
    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [pdf, anexo.previewUrl]);

  return (
    <Modal onClose={onClose} widthClass="max-w-4xl">
      {(fechar) => (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-soft">
            <p className="flex-1 min-w-0 truncate text-[13px] font-semibold text-text-dark">{anexo.nome}</p>
            <button
              type="button"
              onClick={() => baixar(anexo)}
              className="h-8 px-3 rounded-lg border border-border text-[12.5px] font-medium text-text-dark hover:bg-panel-bg flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Baixar
            </button>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-text-gray hover:bg-panel-bg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-panel-bg rounded-b-2xl">
            {imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anexo.previewUrl}
                alt={anexo.nome}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            ) : pdf ? (
              pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title={anexo.nome}
                  className="w-full h-[70vh] rounded-lg border border-border bg-white"
                />
              ) : (
                <Loader2 size={20} className="animate-spin text-text-faint" />
              )
            ) : (
              <p className="text-[13px] text-text-gray py-10">
                Esse tipo de arquivo não abre aqui. Use o botão Baixar para ver no seu computador.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

function AcaoBtn({
  icon,
  label,
  onClick,
  perigo = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-2 rounded-md border border-border-soft text-[11px] font-medium flex items-center gap-1 transition-colors ${
        perigo
          ? "text-text-gray hover:text-badge-red-text"
          : "text-text-gray hover:text-brand-strong hover:bg-brand-soft"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DocCard({
  tipo,
  arquivos,
  uploading,
  onAdd,
  onRemove,
  onView,
}: {
  tipo: DocumentoTipo;
  arquivos: DocumentoAnexo[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onView: (anexo: DocumentoAnexo) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files);
      }}
      className={`rounded-xl border p-3 transition-colors ${
        dragOver ? "border-brand bg-brand-soft" : "border-border bg-panel-bg"
      }`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-card-bg border border-border flex items-center justify-center text-text-gray shrink-0">
          <FileText size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text-dark truncate">{DOCUMENTO_LABEL[tipo]}</p>
          <p className="text-[11px] text-text-faint">
            {arquivos.length} arquivo{arquivos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2 mb-2.5">
          {arquivos.map((a) => (
            <div key={a.id} className="rounded-lg bg-card-bg border border-border-soft p-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onView(a)}
                  disabled={!a.previewUrl}
                  className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default"
                  aria-label={`Visualizar ${a.nome}`}
                >
                  {ehImagem(a) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.previewUrl} alt={a.nome} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-panel-bg flex items-center justify-center">
                      <FileText size={16} className="text-text-faint" />
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-text-dark" title={a.nome}>
                    {a.nome}
                  </p>
                  <p className="text-[10.5px] text-text-faint">{(a.tamanho / 1024).toFixed(0)}KB</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {a.previewUrl && (
                  <>
                    <AcaoBtn icon={<Eye size={12} />} label="Ver" onClick={() => onView(a)} />
                    <AcaoBtn icon={<Download size={12} />} label="Baixar" onClick={() => baixar(a)} />
                  </>
                )}
                <AcaoBtn icon={<Trash2 size={12} />} label="Excluir" onClick={() => onRemove(a.id)} perigo />
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-lg border border-dashed border-border py-2.5 text-[11.5px] text-text-faint hover:border-brand hover:text-brand-strong transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Plus size={13} />
            {arquivos.length === 0 ? "Arraste ou clique para enviar" : "Adicionar arquivo"}
          </>
        )}
      </button>
    </div>
  );
}

export default function DocumentUploadGrid({
  dealId,
  documentos,
  onChange,
}: {
  /** Quando fornecido, os arquivos são salvos de verdade no Firestore (deals/{dealId}/documentos).
   * Sem isso (ex.: criando um negócio novo que ainda não tem id), fica só como preview local. */
  dealId?: string;
  documentos: DocumentoAnexo[];
  onChange: (docs: DocumentoAnexo[]) => void;
}) {
  const { showToast } = useToast();
  const [uploadingTipo, setUploadingTipo] = useState<DocumentoTipo | null>(null);
  const [visualizando, setVisualizando] = useState<DocumentoAnexo | null>(null);

  async function handleAdd(tipo: DocumentoTipo, files: FileList) {
    if (!dealId) {
      // Sem negócio salvo ainda: só guarda um preview local (blob), não persiste.
      const novos: DocumentoAnexo[] = Array.from(files).map((f) => ({
        id: `doc${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        tipo,
        nome: f.name,
        tamanho: f.size,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      onChange([...documentos, ...novos]);
      return;
    }

    setUploadingTipo(tipo);
    try {
      const enviados: DocumentoAnexo[] = [];
      for (const file of Array.from(files)) {
        try {
          const dataUrl = await arquivoParaDataUrl(file);
          const salvo = await addDocumento(dealId, {
            tipo,
            nome: file.name,
            tamanho: file.size,
            previewUrl: dataUrl,
          });
          enviados.push(salvo);
        } catch (err) {
          console.error(err);
          showToast(err instanceof Error ? err.message : `Não foi possível enviar ${file.name}`, "info");
        }
      }
      if (enviados.length > 0) onChange([...documentos, ...enviados]);
    } finally {
      setUploadingTipo(null);
    }
  }

  async function handleRemove(id: string) {
    onChange(documentos.filter((d) => d.id !== id));
    if (dealId) {
      try {
        await removeDocumento(dealId, id);
      } catch (err) {
        console.error("Erro ao excluir documento do Firestore:", err);
      }
    }
  }

  return (
    <>
      <div className="@container">
        <div className="grid grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-3 gap-3">
        {DOC_TYPES.map((tipo) => (
          <DocCard
            key={tipo}
            tipo={tipo}
            arquivos={documentos.filter((d) => d.tipo === tipo)}
            uploading={uploadingTipo === tipo}
            onAdd={(files) => handleAdd(tipo, files)}
            onRemove={handleRemove}
            onView={setVisualizando}
          />
        ))}
        </div>
      </div>

      {visualizando && <Visualizador anexo={visualizando} onClose={() => setVisualizando(null)} />}
    </>
  );
}
