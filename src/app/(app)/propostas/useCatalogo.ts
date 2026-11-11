"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCatalogoInversores, fetchCatalogoModulos } from "@/lib/firebase/catalogo";
import type { CatalogoInversor, CatalogoModulo } from "@/lib/propostas/types";

/** Carrega o catálogo de equipamentos (módulos e inversores) cadastrado no CRM. */
export function useCatalogo() {
  const [modulos, setModulos] = useState<CatalogoModulo[]>([]);
  const [inversores, setInversores] = useState<CatalogoInversor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([fetchCatalogoModulos(), fetchCatalogoInversores()]);
      setModulos(m);
      setInversores(i);
      setErro(false);
    } catch (err) {
      console.error("Erro ao carregar o catálogo:", err);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { modulos, inversores, carregando, erro, recarregar };
}
