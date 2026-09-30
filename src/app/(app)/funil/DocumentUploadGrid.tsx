"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Eye, Download, Trash2, FileText, Loader2, X } from "lucide-react";
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
      className={`rounded-xl border p-3.5 transition-colors ${
        dragOver ? "border-brand bg-brand-soft" : "border-border bg-panel-bg"
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-card-bg border border-border flex items-center justify-center text-text-gray shrink-0">
            <FileText size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-dark truncate">
              {DOCUMENTO_LABEL[tipo]}
            </p>
            <p className="text-[11px] text-text-faint">
              {arquivos.length} arquivo{arquivos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-7 w-7 rounded-md flex items-center justify-center text-brand-strong hover:bg-brand-soft transition-colors shrink-0 disabled:opacity-50"
          aria-label={`Enviar ${DOCUMENTO_LABEL[tipo]}`}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        </button>
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
      </div>

      {arquivos.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-border py-3 text-[11.5px] text-text-faint hover:border-brand hover:text-brand-strong transition-colors"
        >
          Arraste um arquivo ou clique para enviar
        </button>
      ) : (
        <div className="space-y-1.5">
          {arquivos.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 bg-card-bg border border-border-soft rounded-lg px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => onView(a)}
                disabled={!a.previewUrl}
                className="shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default"
                aria-label={`Visualizar ${a.nome}`}
              >
                {ehImagem(a) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.previewUrl} alt={a.nome} className="h-7 w-7 rounded object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded bg-panel-bg flex items-center justify-center">
                    <FileText size={12} className="text-text-faint" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => onView(a)}
                disabled={!a.previewUrl}
                className="flex-1 min-w-0 truncate text-left text-[12px] text-text-dark hover:text-brand-strong disabled:hover:text-text-dark disabled:cursor-default"
              >
                {a.nome}
              </button>
              <span className="text-[10.5px] text-text-faint shrink-0">
                {(a.tamanho / 1024).toFixed(0)}KB
              </span>
              {a.previewUrl && (
                <>
                  <button
                    type="button"
                    onClick={() => onView(a)}
                    className="text-text-faint hover:text-text-gray shrink-0"
                    aria-label="Visualizar"
                    title="Visualizar"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => baixar(a)}
                    className="text-text-faint hover:text-text-gray shrink-0"
                    aria-label="Baixar"
                    title="Baixar"
                  >
                    <Download size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="text-text-faint hover:text-badge-red-text shrink-0"
                aria-label="Excluir"
                title="Excluir"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {visualizando && <Visualizador anexo={visualizando} onClose={() => setVisualizando(null)} />}
    </>
  );
}
