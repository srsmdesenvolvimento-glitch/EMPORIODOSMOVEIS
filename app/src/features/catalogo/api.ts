import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import {
  esquemaBanner,
  esquemaCategoria,
  esquemaProdutoCartao,
  esquemaProdutoCompleto,
  type Banner,
  type Categoria,
  type ProdutoCartao,
  type ProdutoCompleto,
} from "@/shared/lib/esquemas";
import { supabase } from "@/shared/lib/supabase";

export const POR_PAGINA = 24;

export type Ordenacao = "relevancia" | "recentes" | "nome" | "maiores" | "menores";

export interface FiltrosCatalogo {
  termo?: string | undefined;
  categoria?: string | undefined;
  ambiente?: string | undefined;
  tom?: string | undefined;
  /** "Cabe no meu espaço": largura máxima em cm. */
  larguraMax?: number | undefined;
  somenteOfertas?: boolean | undefined;
  ordenar?: Ordenacao | undefined;
}

/** Parâmetros da função `buscar_produtos` a partir dos filtros da tela. */
function parametrosDaBusca(filtros: FiltrosCatalogo, limite: number, deslocamento: number) {
  return {
    termo: filtros.termo?.trim() || null,
    categoria: filtros.categoria || null,
    ambiente: filtros.ambiente || null,
    tom: filtros.tom || null,
    largura_max: filtros.larguraMax ?? null,
    somente_ofertas: filtros.somenteOfertas ?? false,
    ordenar: filtros.ordenar ?? "relevancia",
    limite,
    deslocamento,
  };
}

export const chaves = {
  categorias: ["categorias"] as const,
  banners: ["banners"] as const,
  produtos: (f: FiltrosCatalogo) => ["produtos", f] as const,
  produto: (slug: string) => ["produto", slug] as const,
  vitrine: (tipo: string) => ["vitrine", tipo] as const,
};

export function useCategorias() {
  return useQuery({
    queryKey: chaves.categorias,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("ativa", true)
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return esquemaCategoria.array().parse(data ?? []);
    },
  });
}

export function useBanners() {
  return useQuery({
    queryKey: chaves.banners,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return esquemaBanner.array().parse(data ?? []);
    },
  });
}

/**
 * A vitrine pagina por scroll infinito, como a busca do Mercado Livre.
 * A contagem total volta junto na mesma chamada — sem segundo round-trip.
 */
export function useProdutos(filtros: FiltrosCatalogo) {
  return useInfiniteQuery({
    queryKey: chaves.produtos(filtros),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async ({ pageParam }): Promise<ProdutoCartao[]> => {
      const { data, error } = await supabase.rpc(
        "buscar_produtos",
        parametrosDaBusca(filtros, POR_PAGINA, pageParam),
      );
      if (error) throw error;
      return esquemaProdutoCartao.array().parse(data ?? []);
    },
    getNextPageParam: (ultima, todas) => {
      const carregados = todas.reduce((s, p) => s + p.length, 0);
      const total = ultima[0]?.total ?? 0;
      return carregados < total ? carregados : undefined;
    },
  });
}

/** Prateleiras da home: destaques e ofertas, poucos itens cada. */
export function useVitrine(tipo: "destaques" | "ofertas" | "novidades", limite = 12) {
  return useQuery({
    queryKey: chaves.vitrine(`${tipo}-${limite}`),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProdutoCartao[]> => {
      const { data, error } = await supabase.rpc("buscar_produtos", {
        termo: null,
        categoria: null,
        somente_ofertas: tipo === "ofertas",
        ordenar: tipo === "novidades" ? "recentes" : "relevancia",
        limite,
        deslocamento: 0,
      });
      if (error) throw error;
      const lista = esquemaProdutoCartao.array().parse(data ?? []);
      return tipo === "destaques" ? lista.filter((p) => p.destaque) : lista;
    },
  });
}

export function useProduto(slug: string | undefined) {
  return useQuery({
    queryKey: chaves.produto(slug ?? ""),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProdutoCompleto | null> => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          `*,
           categorias ( slug, nome ),
           produto_imagens ( id, url, alt, largura, altura, ordem ),
           produto_cores ( id, nome, imagem_url, amostra_hex, ordem )`,
        )
        .eq("slug", slug ?? "")
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const produto = esquemaProdutoCompleto.parse(data);
      produto.produto_imagens.sort((a, b) => a.ordem - b.ordem);
      produto.produto_cores.sort((a, b) => a.ordem - b.ordem);
      return produto;
    },
  });
}

/** "Quem viu este, viu também" — mesma categoria, fora o próprio. */
export function useRelacionados(categoriaSlug: string | null, excluir: string) {
  return useQuery({
    queryKey: ["relacionados", categoriaSlug, excluir],
    enabled: Boolean(categoriaSlug),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProdutoCartao[]> => {
      const { data, error } = await supabase.rpc("buscar_produtos", {
        termo: null,
        categoria: categoriaSlug,
        somente_ofertas: false,
        ordenar: "relevancia",
        limite: 14,
        deslocamento: 0,
      });
      if (error) throw error;
      return esquemaProdutoCartao
        .array()
        .parse(data ?? [])
        .filter((p) => p.slug !== excluir)
        .slice(0, 12);
    },
  });
}

/** Sugestões da barra de busca. */
export function useSugestoes(termo: string) {
  const limpo = termo.trim();
  return useQuery({
    queryKey: ["sugestoes", limpo],
    enabled: limpo.length >= 2,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ProdutoCartao[]> => {
      const { data, error } = await supabase.rpc("buscar_produtos", {
        termo: limpo,
        categoria: null,
        somente_ofertas: false,
        ordenar: "relevancia",
        limite: 6,
        deslocamento: 0,
      });
      if (error) throw error;
      return esquemaProdutoCartao.array().parse(data ?? []);
    },
  });
}
