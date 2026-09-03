export type PlaceSuggestion = {
  id: string;
  descricao: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number;
  longitude: number;
};

const PLACES: PlaceSuggestion[] = [
  {
    id: "pl1",
    descricao: "Av. Engenheiro Roberto Freire, 3000 — Capim Macio, Natal - RN",
    endereco: "Av. Engenheiro Roberto Freire",
    numero: "3000",
    bairro: "Capim Macio",
    cidade: "Natal",
    estado: "RN",
    cep: "59082-095",
    latitude: -5.8567,
    longitude: -35.1856,
  },
  {
    id: "pl2",
    descricao: "Rua Apodi, 500 — Tirol, Natal - RN",
    endereco: "Rua Apodi",
    numero: "500",
    bairro: "Tirol",
    cidade: "Natal",
    estado: "RN",
    cep: "59020-050",
    latitude: -5.7889,
    longitude: -35.2075,
  },
  {
    id: "pl3",
    descricao: "Av. Rio Branco, 780 — Centro, Mossoró - RN",
    endereco: "Av. Rio Branco",
    numero: "780",
    bairro: "Centro",
    cidade: "Mossoró",
    estado: "RN",
    cep: "59600-090",
    latitude: -5.1875,
    longitude: -37.3441,
  },
  {
    id: "pl4",
    descricao: "Rua Potengi, 210 — Petrópolis, Natal - RN",
    endereco: "Rua Potengi",
    numero: "210",
    bairro: "Petrópolis",
    cidade: "Natal",
    estado: "RN",
    cep: "59020-160",
    latitude: -5.7912,
    longitude: -35.1988,
  },
  {
    id: "pl5",
    descricao: "Av. Presidente Café Filho, 1200 — Praia do Meio, Natal - RN",
    endereco: "Av. Presidente Café Filho",
    numero: "1200",
    bairro: "Praia do Meio",
    cidade: "Natal",
    estado: "RN",
    cep: "59012-000",
    latitude: -5.7681,
    longitude: -35.1975,
  },
];

/** Simulates an async Google Places search call. */
export function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve) => {
    setTimeout(() => {
      if (q.length < 3) {
        resolve([]);
        return;
      }
      resolve(
        PLACES.filter(
          (p) =>
            p.descricao.toLowerCase().includes(q) ||
            p.bairro.toLowerCase().includes(q) ||
            p.cidade.toLowerCase().includes(q)
        )
      );
    }, 260);
  });
}
