import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Favoritos e "vistos recentemente".
 *
 * Ficam no aparelho do cliente, sem cadastro: quem está escolhendo móvel
 * volta ao site várias vezes antes de decidir, e não deve precisar de conta
 * para reencontrar o que gostou.
 */

export const esquemaMovelGuardado = z.object({
  id: z.string(),
  slug: z.string(),
  nome: z.string(),
  imagem_url: z.string().nullable(),
  categoria_nome: z.string().nullable(),
  guardado_em: z.number(),
});
export type MovelGuardado = z.infer<typeof esquemaMovelGuardado>;

const LIMITE_FAVORITOS = 100;
const LIMITE_VISTOS = 16;

function validar(bruto: unknown, limite: number): MovelGuardado[] {
  const analisado = esquemaMovelGuardado.array().safeParse(bruto);
  return analisado.success ? analisado.data.slice(0, limite) : [];
}

interface EstadoFavoritos {
  itens: MovelGuardado[];
  alternar: (movel: Omit<MovelGuardado, "guardado_em">) => boolean;
  remover: (id: string) => void;
}

export const useFavoritos = create<EstadoFavoritos>()(
  persist(
    (set, get) => ({
      itens: [],
      /** Devolve `true` se o móvel passou a ser favorito. */
      alternar: (movel) => {
        const ja = get().itens.some((i) => i.id === movel.id);
        set((e) => ({
          itens: ja
            ? e.itens.filter((i) => i.id !== movel.id)
            : [{ ...movel, guardado_em: Date.now() }, ...e.itens].slice(0, LIMITE_FAVORITOS),
        }));
        return !ja;
      },
      remover: (id) => set((e) => ({ itens: e.itens.filter((i) => i.id !== id) })),
    }),
    {
      name: "emporio-favoritos",
      version: 1,
      merge: (persistido, atual) => ({
        ...atual,
        itens: validar((persistido as { itens?: unknown } | undefined)?.itens, LIMITE_FAVORITOS),
      }),
    },
  ),
);

export function useEhFavorito(id: string): boolean {
  return useFavoritos((e) => e.itens.some((i) => i.id === id));
}

interface EstadoVistos {
  itens: MovelGuardado[];
  registrar: (movel: Omit<MovelGuardado, "guardado_em">) => void;
  limpar: () => void;
}

export const useVistos = create<EstadoVistos>()(
  persist(
    (set) => ({
      itens: [],
      registrar: (movel) =>
        set((e) => ({
          itens: [
            { ...movel, guardado_em: Date.now() },
            ...e.itens.filter((i) => i.id !== movel.id),
          ].slice(0, LIMITE_VISTOS),
        })),
      limpar: () => set({ itens: [] }),
    }),
    {
      name: "emporio-vistos",
      version: 1,
      merge: (persistido, atual) => ({
        ...atual,
        itens: validar((persistido as { itens?: unknown } | undefined)?.itens, LIMITE_VISTOS),
      }),
    },
  ),
);
