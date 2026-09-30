"use client";

import { useRef, useState } from "react";
import { Bold, Italic, List, Link2, Image as ImageIcon, Loader2, X } from "lucide-react";
import { fotoParaDataUrl } from "@/lib/fileToDataUrl";
import { useToast } from "@/components/ui/Toast";

const MAX_IMAGENS = 4;
// Soma máxima (em caracteres base64) das fotos de uma anotação: deixa folga no limite de 1MB por documento do Firestore.
const LIMITE_TOTAL_CHARS = 850_000;

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva uma observação...",
  rows = 6,
  imagens = [],
  onImagensChange,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  /** Fotos anexadas (data URLs). Só aparecem se `onImagensChange` for passado. */
  imagens?: string[];
  onImagensChange?: (imagens: string[]) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const { showToast } = useToast();

  function wrapSelection(prefix: string, suffix = prefix, placeholderText = "") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholderText;
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertListItem() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const needsNewline = start > 0 && value[start - 1] !== "\n";
    const insert = `${needsNewline ? "\n" : ""}- `;
    const next = value.slice(0, start) + insert + value.slice(start);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + insert.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertLink() {
    wrapSelection("[", "](https://)", "texto do link");
  }

  async function handleFotos(files: File[]) {
    if (!onImagensChange) return;
    setLendo(true);
    let atuais = [...imagens];
    try {
      for (const file of files) {
        if (atuais.length >= MAX_IMAGENS) {
          showToast(`Máximo de ${MAX_IMAGENS} fotos por anotação.`, "info");
          break;
        }
        try {
          const dataUrl = await fotoParaDataUrl(file);
          const total = atuais.reduce((soma, img) => soma + img.length, 0) + dataUrl.length;
          if (total > LIMITE_TOTAL_CHARS) {
            showToast("As fotos ficaram grandes demais para uma anotação. Remova alguma ou use fotos menores.", "info");
            break;
          }
          atuais = [...atuais, dataUrl];
        } catch (err) {
          console.error(err);
          showToast(err instanceof Error ? err.message : `Não foi possível anexar ${file.name}`, "info");
        }
      }
      onImagensChange(atuais);
    } finally {
      setLendo(false);
    }
  }

  const toolBtn =
    "h-8 w-8 flex items-center justify-center rounded-md text-text-gray hover:bg-panel-bg hover:text-text-dark transition-colors";

  return (
    <div className="rounded-lg border border-border bg-panel-bg overflow-hidden focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-soft bg-card-bg">
        <button type="button" title="Negrito" onClick={() => wrapSelection("**", "**", "negrito")} className={toolBtn}>
          <Bold size={14} />
        </button>
        <button type="button" title="Itálico" onClick={() => wrapSelection("_", "_", "itálico")} className={toolBtn}>
          <Italic size={14} />
        </button>
        <button type="button" title="Lista" onClick={insertListItem} className={toolBtn}>
          <List size={14} />
        </button>
        <button type="button" title="Link" onClick={insertLink} className={toolBtn}>
          <Link2 size={14} />
        </button>
        {onImagensChange && (
          <>
            <button
              type="button"
              title="Anexar foto"
              onClick={() => fileRef.current?.click()}
              disabled={lendo}
              className={toolBtn}
            >
              {lendo ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void handleFotos(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          if (!onImagensChange) return;
          const fotos = Array.from(e.clipboardData.files).filter((f: File) => f.type.startsWith("image/"));
          if (fotos.length === 0) return;
          e.preventDefault();
          void handleFotos(fotos);
        }}
        placeholder={placeholder}
        className="w-full bg-transparent px-3.5 py-3 text-sm text-text-dark placeholder:text-text-faint outline-none resize-y"
      />
      {imagens.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-2 pb-3">
          {imagens.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="h-16 w-16 rounded-lg object-cover border border-border-soft"
              />
              <button
                type="button"
                aria-label={`Remover foto ${i + 1}`}
                onClick={() => onImagensChange?.(imagens.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-card-bg border border-border text-text-gray hover:text-badge-red-text flex items-center justify-center"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
