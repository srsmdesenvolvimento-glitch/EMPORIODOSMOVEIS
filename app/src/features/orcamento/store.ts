import { create } from "zustand";
import { persist } from "zustand/middleware";

import { esquemaItemOrcamento, type ItemOrcamento } from "@/shared/lib/esquemas";

const LIMITE_ITENS = 60;

interface EstadoOrcamento {
  itens: ItemOrcamento[];
  aberto: boolean;
  adicionar: (
    item: Omit<ItemOrcamento, "quantidade">,
    opcoes?: { quantidade?: number; abrir?: boolean },
  ) => void;
  remover: (produtoId: string, cor: string | null) => void;
  mudarQuantidade: (produtoId: string, cor: string | null, quantidade: number) => void;
  limpar: () => void;
  abrir: () => void;
  fechar: () => void;
  alternar: () => void;
}

/** Mesmo produto em cor diferente é linha diferente na lista. */
function mesmaLinha(item: ItemOrcamento, produtoId: string, cor: string | null): boolean {
  return item.produto_id === produtoId && (item.cor ?? null) === cor;
}

export const useOrcamento = create<EstadoOrcamento>()(
  persist(
    (set) => ({
      itens: [],
      aberto: false,

      adicionar: (item, { quantidade = 1, abrir = true } = {}) =>
        set((estado) => {
          const cor = item.cor ?? null;
          const existente = estado.itens.find((i) => mesmaLinha(i, item.produto_id, cor));
          if (existente) {
            return {
              aberto: abrir || estado.aberto,
              itens: estado.itens.map((i) =>
                mesmaLinha(i, item.produto_id, cor)
                  ? { ...i, quantidade: Math.min(99, i.quantidade + quantidade) }
                  : i,
              ),
            };
          }
          if (estado.itens.length >= LIMITE_ITENS) return estado;
          return {
            aberto: abrir || estado.aberto,
            itens: [...estado.itens, { ...item, cor, quantidade }],
          };
        }),

      remover: (produtoId, cor) =>
        set((estado) => ({
          itens: estado.itens.filter((i) => !mesmaLinha(i, produtoId, cor)),
        })),

      mudarQuantidade: (produtoId, cor, quantidade) =>
        set((estado) => ({
          itens:
            quantidade <= 0
              ? estado.itens.filter((i) => !mesmaLinha(i, produtoId, cor))
              : estado.itens.map((i) =>
                  mesmaLinha(i, produtoId, cor)
                    ? { ...i, quantidade: Math.min(99, quantidade) }
                    : i,
                ),
        })),

      limpar: () => set({ itens: [] }),
      abrir: () => set({ aberto: true }),
      fechar: () => set({ aberto: false }),
      alternar: () => set((e) => ({ aberto: !e.aberto })),
    }),
    {
      name: "emporio-orcamento",
      version: 1,
      partialize: (estado) => ({ itens: estado.itens }),
      // O que veio do storage é dado de fora: valida antes de confiar.
      merge: (persistido, atual) => {
        const bruto = (persistido as { itens?: unknown } | undefined)?.itens;
        const analisado = esquemaItemOrcamento.array().safeParse(bruto);
        return {
          ...atual,
          itens: analisado.success ? analisado.data.slice(0, LIMITE_ITENS) : [],
        };
      },
    },
  ),
);

/** Quantidade total de peças, para o contador do cabeçalho. */
export function useTotalDeItens(): number {
  return useOrcamento((e) => e.itens.reduce((s, i) => s + i.quantidade, 0));
}
