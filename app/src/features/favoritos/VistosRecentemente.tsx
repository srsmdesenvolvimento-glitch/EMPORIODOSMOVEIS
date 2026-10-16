import { CartaoGuardado } from "./CartaoGuardado";
import { useVistos } from "./store";

/**
 * Prateleira "Vistos recentemente". Quem compra móvel pesquisa por dias: esta
 * fileira devolve o cliente ao ponto em que parou.
 */
export function VistosRecentemente({
  excluir,
  titulo = "Vistos recentemente",
}: {
  /** Móvel da página atual, que não precisa aparecer na própria lista. */
  excluir?: string;
  titulo?: string;
}) {
  const vistos = useVistos((e) => e.itens).filter((i) => i.id !== excluir);
  const limpar = useVistos((e) => e.limpar);
  if (vistos.length < 2) return null;

  return (
    <section aria-labelledby="titulo-vistos" className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="titulo-vistos" className="titulo text-2xl text-texto sm:text-3xl">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={limpar}
          className="min-h-11 shrink-0 text-xs font-medium text-texto-3 underline underline-offset-4 hover:text-texto"
        >
          Limpar histórico
        </button>
      </div>
      <div className="trilho-x flex gap-3 pb-2">
        {vistos.map((movel) => (
          <CartaoGuardado key={movel.id} movel={movel} compacto />
        ))}
      </div>
    </section>
  );
}
