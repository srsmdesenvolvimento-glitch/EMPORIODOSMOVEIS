/**
 * Um mapa só para os pedaços de rota.
 *
 * O `App` declara as rotas preguiçosas com isto e a pré-busca de links
 * (`usePrefetchDeLinks`) usa o mesmo mapa. Se cada um tivesse a sua lista,
 * elas divergiriam no primeiro dia em que alguém renomeasse um arquivo — e
 * o sintoma seria silencioso: a pré-busca simplesmente deixaria de acertar.
 *
 * As chaves são os nomes dos componentes no `App`; o `caminho` é o prefixo
 * de URL que a pré-busca reconhece.
 */
export const carregadores = {
  Catalogo: () => import("@/routes/Catalogo"),
  Produto: () => import("@/routes/Produto"),
  Ofertas: () => import("@/routes/Ofertas"),
  Categorias: () => import("@/routes/Categorias"),
  Sobre: () => import("@/routes/Sobre"),
  Contato: () => import("@/routes/Contato"),
  Promissoria: () => import("@/routes/Promissoria"),
  Favoritos: () => import("@/routes/Favoritos"),
  Privacidade: () => import("@/routes/Privacidade"),
} as const;

export type NomeDaRota = keyof typeof carregadores;

/**
 * Qual rota atende este caminho. A ordem importa: `/produto/x` casa com o
 * prefixo `/produto/` antes de qualquer outro teste.
 */
const POR_PREFIXO: { prefixo: string; rota: NomeDaRota }[] = [
  { prefixo: "/catalogo", rota: "Catalogo" },
  { prefixo: "/produto/", rota: "Produto" },
  { prefixo: "/ofertas", rota: "Ofertas" },
  { prefixo: "/categorias", rota: "Categorias" },
  { prefixo: "/promissoria", rota: "Promissoria" },
  { prefixo: "/favoritos", rota: "Favoritos" },
  { prefixo: "/privacidade", rota: "Privacidade" },
  { prefixo: "/sobre", rota: "Sobre" },
  { prefixo: "/contato", rota: "Contato" },
];

export function rotaDoCaminho(caminho: string): NomeDaRota | null {
  return POR_PREFIXO.find((r) => caminho.startsWith(r.prefixo))?.rota ?? null;
}

/** O `slug` de `/produto/alguma-coisa?cor=…`, ou null. */
export function slugDoCaminho(caminho: string): string | null {
  if (!caminho.startsWith("/produto/")) return null;
  const slug = caminho.slice("/produto/".length).split("/")[0]?.split("?")[0];
  return slug ? decodeURIComponent(slug) : null;
}
