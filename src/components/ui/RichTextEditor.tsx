"use client";

import { useRef } from "react";
import { Bold, Italic, List, Link2, Image as ImageIcon } from "lucide-react";

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva uma observação...",
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

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
        <button type="button" title="Anexar imagem" className={toolBtn}>
          <ImageIcon size={14} />
        </button>
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3.5 py-3 text-sm text-text-dark placeholder:text-text-faint outline-none resize-y"
      />
    </div>
  );
}
