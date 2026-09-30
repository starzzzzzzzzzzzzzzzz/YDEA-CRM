"use client";

import { useState } from "react";
import { Visualizador } from "./DocumentUploadGrid";

/** Miniaturas das fotos de uma anotação; clicar abre a foto grande, com opção de baixar. */
export default function AnotacaoImagens({ imagens }: { imagens?: string[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  if (!imagens?.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {imagens.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAberta(i)}
            aria-label={`Abrir foto ${i + 1}`}
            className="rounded-lg overflow-hidden border border-border-soft hover:border-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${i + 1} da anotação`} className="h-20 w-20 object-cover" />
          </button>
        ))}
      </div>
      {aberta !== null && (
        <Visualizador
          anexo={{ nome: `foto-${aberta + 1}.jpg`, previewUrl: imagens[aberta] }}
          onClose={() => setAberta(null)}
        />
      )}
    </>
  );
}
