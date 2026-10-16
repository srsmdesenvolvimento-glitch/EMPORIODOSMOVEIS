import { Tag } from "lucide-react";
import { Link } from "react-router-dom";

import { useProdutos } from "@/features/catalogo/api";
import { CartaoProduto, EsqueletoCartao } from "@/features/catalogo/CartaoProduto";
import { classesBotao, EstadoVazio } from "@/shared/components/ui";
import { plural } from "@/shared/lib/utils";
import { useSeo } from "@/shared/lib/seo";

export default function Ofertas() {
  const consulta = useProdutos({ somenteOfertas: true, ordenar: "relevancia" });
  const produtos = consulta.data?.pages.flat() ?? [];
  const total = consulta.data?.pages[0]?.[0]?.total ?? 0;

  useSeo({
    titulo: "Ofertas da semana em móveis",
    descricao:
      "Móveis com condição especial enquanto durar o estoque. Compre na promissória ou consulte a sua condição direto com a loja.",
  });

  return (
    <>
      <section className="bg-tinta-950 py-10 text-tinta-0" data-escuro>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-erro px-3 py-1 text-2xs font-bold uppercase tracking-wide text-tinta-0">
            <Tag aria-hidden className="size-3.5" />
            Ofertas
          </span>
          <h1 className="titulo mt-3 text-3xl sm:text-4xl">Ofertas da semana</h1>
          <p className="mt-2 max-w-xl text-tinta-300">
            Peças selecionadas com condição especial. O preço sai na conversa —
            monte sua lista e chame a equipe.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {consulta.isPending ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i}>
                <EsqueletoCartao />
              </li>
            ))}
          </ul>
        ) : produtos.length === 0 ? (
          <EstadoVazio
            icone={<Tag aria-hidden className="size-8" />}
            titulo="Nenhuma oferta no ar agora"
            descricao="As promoções mudam toda semana. Enquanto isso, veja o catálogo completo."
            acao={
              <Link to="/catalogo" className={classesBotao({ aparencia: "marca" })}>
                Ver o catálogo
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-texto-2">
              {plural(total, "móvel em oferta", "móveis em oferta")}
            </p>
            <h2 className="sr-only">Móveis em oferta</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {produtos.map((p, i) => (
                <li key={p.id}>
                  <CartaoProduto produto={p} prioridade={i < 4} />
                </li>
              ))}
            </ul>
            {consulta.hasNextPage ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => void consulta.fetchNextPage()}
                  className={classesBotao({ aparencia: "contorno", tamanho: "lg" })}
                >
                  {consulta.isFetchingNextPage ? "Carregando…" : "Ver mais ofertas"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
