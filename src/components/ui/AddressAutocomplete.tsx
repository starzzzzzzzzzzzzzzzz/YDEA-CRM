"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { maskCEP, onlyDigits } from "@/lib/masks";

export type EnderecoCep = {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

/**
 * Busca de endereço pelo CEP (serviço público ViaCEP, sem chave). Ao completar os 8 dígitos,
 * devolve rua, bairro, cidade e estado; o número a pessoa preenche.
 */
export default function AddressAutocomplete({ onSelect }: { onSelect: (endereco: EnderecoCep) => void }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function buscar(digitos: string) {
    setLoading(true);
    setAviso(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      if (!res.ok) throw new Error(`ViaCEP respondeu ${res.status}`);
      const d = await res.json();
      if (d.erro) {
        setAviso("CEP não encontrado. Confira os números ou preencha à mão.");
        return;
      }
      onSelect({
        endereco: d.logradouro ?? "",
        bairro: d.bairro ?? "",
        cidade: d.localidade ?? "",
        estado: d.uf ?? "",
        cep: d.cep ?? maskCEP(digitos),
      });
      setAviso("Endereço preenchido. Complete o número.");
    } catch (err) {
      console.error("Erro ao consultar o CEP:", err);
      setAviso("Não foi possível consultar o CEP agora. Preencha o endereço à mão.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(valor: string) {
    const mascarado = maskCEP(valor);
    setCep(mascarado);
    setAviso(null);
    const digitos = onlyDigits(mascarado);
    if (digitos.length === 8) void buscar(digitos);
  }

  return (
    <div>
      <div className="w-full flex items-center gap-2 rounded-lg border border-border bg-panel-bg px-3.5 py-2.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-colors">
        <MapPin size={15} className="text-text-faint shrink-0" />
        <input
          value={cep}
          onChange={(e) => handleChange(e.target.value)}
          inputMode="numeric"
          placeholder="Buscar endereço pelo CEP (00000-000)"
          className="w-full bg-transparent outline-none placeholder:text-text-faint text-sm text-text-dark"
        />
        {loading && <Loader2 size={14} className="animate-spin-slow text-text-faint shrink-0" />}
      </div>
      {aviso && <p className="mt-1.5 text-[11.5px] text-text-faint">{aviso}</p>}
    </div>
  );
}
