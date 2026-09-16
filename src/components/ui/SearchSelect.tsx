"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, ChevronDown, X, Check } from "lucide-react";

export type SearchSelectItem = {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
};

export default function SearchSelect({
  items,
  value,
  onChange,
  placeholder = "Pesquisar...",
  createLabel,
  onCreate,
  disabled,
  emptyHint = "Nenhum resultado encontrado",
  size = "md",
}: {
  items: SearchSelectItem[];
  value: SearchSelectItem | null;
  onChange: (item: SearchSelectItem | null) => void;
  placeholder?: string;
  createLabel?: (query: string) => string;
  onCreate?: (query: string) => void;
  disabled?: boolean;
  emptyHint?: string;
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sublabel?.toLowerCase().includes(q) ||
        i.meta?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectItem(item: SearchSelectItem) {
    onChange(item);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
        setHighlight(0);
      }
      return;
    }
    const maxIndex = filtered.length - 1 + (onCreate ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < filtered.length) {
        selectItem(filtered[highlight]);
      } else if (onCreate && query.trim()) {
        onCreate(query.trim());
        setOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const padding = size === "lg" ? "px-4 py-3 text-sm" : "px-3.5 py-2.5 text-sm";

  return (
    <div ref={rootRef} className="relative">
      {value && !open ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            setHighlight(0);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className={`w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-panel-bg ${padding} text-left outline-none hover:border-brand/60 focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <span className="min-w-0">
            <span className="block font-medium text-text-dark truncate">{value.label}</span>
            {value.sublabel && (
              <span className="block text-xs text-text-faint truncate">{value.sublabel}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-text-faint hover:text-text-gray p-0.5"
              aria-label="Limpar seleção"
            >
              <X size={14} />
            </span>
            <ChevronDown size={14} className="text-text-faint" />
          </span>
        </button>
      ) : (
        <div
          className={`w-full flex items-center gap-2 rounded-lg border bg-panel-bg ${padding} transition-colors ${
            open ? "border-brand ring-1 ring-brand" : "border-border"
          }`}
        >
          <Search size={15} className="text-text-faint shrink-0" />
          <input
            ref={inputRef}
            disabled={disabled}
            value={query}
            placeholder={placeholder}
            onFocus={() => {
              setOpen(true);
              setHighlight(0);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none placeholder:text-text-faint text-text-dark disabled:cursor-not-allowed"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-border bg-card-bg/95 backdrop-blur-md shadow-lg overflow-hidden animate-dropdown-in">
          <div className="max-h-64 overflow-y-auto py-1.5">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-xs text-text-faint">{emptyHint}</div>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => selectItem(item)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    idx === highlight ? "bg-brand-soft" : "hover:bg-panel-bg"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-text-dark truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="block text-xs text-text-faint truncate">{item.sublabel}</span>
                    )}
                  </span>
                  {value?.id === item.id && <Check size={14} className="text-brand-strong shrink-0" />}
                </button>
              ))
            )}
          </div>

          {onCreate && (
            <button
              type="button"
              onMouseEnter={() => setHighlight(filtered.length)}
              onClick={() => {
                onCreate(query.trim());
                setOpen(false);
                setQuery("");
              }}
              className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-brand-strong border-t border-border-soft transition-colors ${
                highlight === filtered.length ? "bg-brand-soft" : "hover:bg-brand-soft/60"
              }`}
            >
              <Plus size={14} />
              {createLabel ? createLabel(query.trim()) : "Criar novo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
