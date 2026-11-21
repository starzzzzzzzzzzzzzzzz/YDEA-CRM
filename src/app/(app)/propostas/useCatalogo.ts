"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCatalogoInversores, fetchCatalogoModulos } from "@/lib/firebase/catalogo";
import { INVERSORES_PADRAO, MODULOS_PADRAO, mesclarCatalogo } from "@/lib/propostas/catalogo-padrao";
import type { CatalogoInversor, CatalogoModulo } from "@/lib/propostas/types";

/**
 * Catálogo de equipamentos (módulos e inversores).
 *  - `modulos` / `inversores`: catálogo padrão embutido + o da empresa (o da empresa vence na mesma marca+modelo).
 *    É o que a caixa "Escolher do catálogo" mostra — funciona mesmo sem nada cadastrado e sem internet no Firestore.
 *  - `modulosProprios` / `inversoresProprios`: só o que a empresa cadastrou (tela de catálogo).
 */
export function useCatalogo() {
  const [modulosProprios, setModulos] = useState<CatalogoModulo[]>([]);
  const [inversoresProprios, setInversores] = useState<CatalogoInversor[]>([]);
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

  const modulos = useMemo(() => mesclarCatalogo(MODULOS_PADRAO, modulosProprios), [modulosProprios]);
  const inversores = useMemo(() => mesclarCatalogo(INVERSORES_PADRAO, inversoresProprios), [inversoresProprios]);

  return { modulos, inversores, modulosProprios, inversoresProprios, carregando, erro, recarregar };
}
