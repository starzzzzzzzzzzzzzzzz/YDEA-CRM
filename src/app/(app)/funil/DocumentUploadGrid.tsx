"use client";

import { useRef, useState } from "react";
import { Upload, Eye, Trash2, FileText } from "lucide-react";
import { DocumentoAnexo, DocumentoTipo, DOCUMENTO_LABEL } from "@/lib/types";

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

function DocCard({
  tipo,
  arquivos,
  onAdd,
  onRemove,
}: {
  tipo: DocumentoTipo;
  arquivos: DocumentoAnexo[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
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
          className="h-7 w-7 rounded-md flex items-center justify-center text-brand-strong hover:bg-brand-soft transition-colors shrink-0"
          aria-label={`Enviar ${DOCUMENTO_LABEL[tipo]}`}
        >
          <Upload size={14} />
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
              {a.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.previewUrl} alt={a.nome} className="h-7 w-7 rounded object-cover shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded bg-panel-bg flex items-center justify-center shrink-0">
                  <FileText size={12} className="text-text-faint" />
                </div>
              )}
              <span className="flex-1 min-w-0 truncate text-[12px] text-text-dark">{a.nome}</span>
              <span className="text-[10.5px] text-text-faint shrink-0">
                {(a.tamanho / 1024).toFixed(0)}KB
              </span>
              {a.previewUrl && (
                <button
                  type="button"
                  onClick={() => window.open(a.previewUrl, "_blank")}
                  className="text-text-faint hover:text-text-gray shrink-0"
                  aria-label="Visualizar"
                >
                  <Eye size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="text-text-faint hover:text-badge-red-text shrink-0"
                aria-label="Excluir"
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
  documentos,
  onChange,
}: {
  documentos: DocumentoAnexo[];
  onChange: (docs: DocumentoAnexo[]) => void;
}) {
  function handleAdd(tipo: DocumentoTipo, files: FileList) {
    const novos: DocumentoAnexo[] = Array.from(files).map((f) => ({
      id: `doc${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      tipo,
      nome: f.name,
      tamanho: f.size,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    onChange([...documentos, ...novos]);
  }

  function handleRemove(id: string) {
    onChange(documentos.filter((d) => d.id !== id));
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {DOC_TYPES.map((tipo) => (
        <DocCard
          key={tipo}
          tipo={tipo}
          arquivos={documentos.filter((d) => d.tipo === tipo)}
          onAdd={(files) => handleAdd(tipo, files)}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
