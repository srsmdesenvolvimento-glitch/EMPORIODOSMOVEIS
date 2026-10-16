import { Link } from "react-router-dom";

import { useCategorias } from "@/features/catalogo/api";
import { Esqueleto } from "@/shared/components/ui";
import { useSeo } from "@/shared/lib/seo";

export default function Categorias() {
  const consulta = useCategorias();

  useSeo({
    titulo: "Categorias de móveis",
    descricao:
      "Todas as linhas do catálogo: sala, quarto, cozinha, escritório, roupeiros, cômodas e mais. Escolha o cômodo e veja medidas e acabamentos.",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <header className="mb-6">
        <h1 className="titulo text-2xl text-texto sm:text-3xl">Categorias</h1>
        <p className="mt-1 text-sm text-texto-2">
          O catálogo inteiro, organizado por cômodo e tipo de móvel.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {consulta.isPending
          ? Array.from({ length: 12 }, (_, i) => (
              <li key={i}>
                <Esqueleto className="h-40 rounded-2xl" />
              </li>
            ))
          : (consulta.data ?? []).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/catalogo?categoria=${c.slug}`}
                  className="group grid h-full gap-2 overflow-hidden rounded-2xl border border-borda bg-superficie p-3 shadow-carta transition-shadow hover:shadow-flutuante"
                >
                  <div className="moldura-foto aspect-[4/3] rounded-xl bg-tinta-50">
                    {c.imagem_url ? (
                      <img
                        src={c.imagem_url}
                        alt=""
                        width={300}
                        height={225}
                        loading="lazy"
                        className="size-full object-contain p-1 transition-transform duration-300 ease-saida group-hover:scale-105 motion-reduce:transform-none"
                      />
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-texto">{c.nome}</span>
                  {c.descricao ? (
                    <span className="line-clamp-2 text-xs text-texto-2">{c.descricao}</span>
                  ) : null}
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}
