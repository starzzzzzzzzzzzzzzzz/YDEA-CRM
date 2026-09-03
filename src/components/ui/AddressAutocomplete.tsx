"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchPlaces, PlaceSuggestion } from "@/lib/mock-places";

export default function AddressAutocomplete({
  onSelect,
}: {
  onSelect: (place: PlaceSuggestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchPlaces(v);
      setResults(r);
      setLoading(false);
    }, 200);
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="w-full flex items-center gap-2 rounded-lg border border-border bg-panel-bg px-3.5 py-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
        <MapPin size={15} className="text-text-faint shrink-0" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar endereço (Google Places)"
          className="w-full bg-transparent outline-none placeholder:text-text-faint text-sm text-text-dark"
        />
        {loading && <Loader2 size={14} className="animate-spin-slow text-text-faint shrink-0" />}
      </div>

      {open && (query.trim().length >= 3 || results.length > 0) && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-border bg-card-bg shadow-lg overflow-hidden animate-dropdown-in">
          {loading ? (
            <div className="p-1.5 space-y-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 mx-1.5 rounded-lg bg-panel-bg animate-skeleton" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3.5 py-4 text-center text-xs text-text-faint">
              Nenhum endereço encontrado
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto py-1.5">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelect(r);
                    setQuery(r.descricao);
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-panel-bg transition-colors"
                >
                  <MapPin size={14} className="text-brand-strong shrink-0 mt-0.5" />
                  <span className="text-text-dark">{r.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
