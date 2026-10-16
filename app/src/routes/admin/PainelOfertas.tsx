import { Search, Tag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useAlternarCampo,
  useProdutosAdmin,
  useSalvarProduto,
} from "@/features/admin/api";
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  EstadoVazio,
  Selo,
} from "@/shared/components/ui";
import { plural } from "@/shared/lib/utils";

const SELOS_SUGERIDOS = [
  "Oferta da semana",
  "Últimas peças",
  "Queima de estoque",
  "Só hoje",
  "Pronta entrega",
];

/**
 * Tela dedicada a montar a página de ofertas: de um lado o que já está
 * promovido, do outro a busca para incluir peças novas.
 */
export default function PainelOfertas() {
  const [busca, setBusca] = useState("");
  const [seloEmLote, setSeloEmLote] = useState("Oferta da semana");

  const emOferta = useProdutosAdmin("", "");
  const resultados = useProdutosAdmin(busca, "");
  const alternar = useAlternarCampo();
  const salvar = useSalvarProduto();

  const promovidos = (emOferta.data ?? []).filter((p) => p.em_oferta);
  const candidatos = busca.trim()
    ? (resultados.data ?? []).filter((p) => !p.em_oferta).slice(0, 12)
    : [];

  function promover(id: string, nome: string) {
    salvar.mutate(
      { id, campos: { em_oferta: true, selo: seloEmLote || "Oferta" } },
      { onSuccess: () => toast.success(`“${nome}” entrou nas ofertas`) },
    );
  }

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-bold text-texto">Ofertas</h1>
        <p className="mt-1 text-sm text-texto-2">
          O que estiver aqui aparece na página de ofertas e com selo no catálogo.
        </p>
      </header>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Incluir móveis na promoção</h2>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-texto">Selo aplicado ao incluir</span>
          <div className="flex flex-wrap gap-1.5">
            {SELOS_SUGERIDOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeloEmLote(s)}
                aria-pressed={seloEmLote === s}
                className={
                  seloEmLote === s
                    ? "min-h-9 rounded-full bg-tinta-950 px-3 text-xs font-semibold text-tinta-0"
                    : "min-h-9 rounded-full border border-borda-forte px-3 text-xs text-texto transition-colors hover:bg-tinta-50"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </label>

        <Campo
          rotulo="Buscar móvel para promover"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome do móvel…"
          adorno={<Search aria-hidden className="size-4" />}
        />

        {busca.trim() && resultados.isPending ? (
          <Esqueleto className="h-20 rounded-xl" />
        ) : candidatos.length > 0 ? (
          <ul className="grid gap-2">
            {candidatos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-borda p-2"
              >
                <div className="moldura-foto size-12 shrink-0 rounded-lg border border-borda">
                  {p.produto_imagens[0]?.url ? (
                    <img
                      src={p.produto_imagens[0].url}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      className="size-full object-contain p-0.5"
                    />
                  ) : null}
                </div>
                <span className="polegadas min-w-0 flex-1 truncate text-sm text-texto">
                  {p.nome}
                </span>
                <Botao tamanho="sm" aparencia="marca" onClick={() => promover(p.id, p.nome)}>
                  <Tag aria-hidden className="size-3.5" />
                  Promover
                </Botao>
              </li>
            ))}
          </ul>
        ) : busca.trim() ? (
          <p className="text-sm text-texto-3">Nenhum móvel novo com esse nome.</p>
        ) : null}
      </Cartao>

      <section className="grid gap-3">
        <h2 className="font-semibold text-texto">
          Na página de ofertas
          {!emOferta.isPending ? (
            <span className="ml-2 text-sm font-normal text-texto-2">
              {plural(promovidos.length, "móvel", "móveis")}
            </span>
          ) : null}
        </h2>

        {emOferta.isPending ? (
          <Esqueleto className="h-24 rounded-xl" />
        ) : promovidos.length === 0 ? (
          <EstadoVazio
            icone={<Tag aria-hidden className="size-8" />}
            titulo="Nenhuma oferta no ar"
            descricao="Busque um móvel acima e clique em Promover."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {promovidos.map((p) => (
              <li key={p.id}>
                <Cartao className="flex items-center gap-3 p-3">
                  <div className="moldura-foto size-14 shrink-0 rounded-lg border border-borda">
                    {p.produto_imagens[0]?.url ? (
                      <img
                        src={p.produto_imagens[0].url}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        className="size-full object-contain p-1"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="polegadas truncate text-sm font-medium text-texto">
                      {p.nome}
                    </p>
                    <Selo tom="oferta" className="mt-1">
                      {p.selo ?? "Oferta"}
                    </Selo>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      alternar.mutate(
                        { id: p.id, campo: "em_oferta", valor: false },
                        { onSuccess: () => toast.success("Saiu das ofertas") },
                      )
                    }
                    aria-label={`Tirar ${p.nome} das ofertas`}
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </Cartao>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
