import { Check, PackageSearch, Ruler, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  useCategorias,
  useProdutos,
  type FiltrosCatalogo,
  type Ordenacao,
} from "@/features/catalogo/api";
import { CartaoProduto, EsqueletoCartao } from "@/features/catalogo/CartaoProduto";
import { Botao, EstadoVazio } from "@/shared/components/ui";
import {
  AMBIENTES,
  LARGURAS_MAXIMAS,
  nomeDoAmbiente,
  TONS,
} from "@/shared/lib/ambientes";
import { useSeo } from "@/shared/lib/seo";
import { cn, medida, plural } from "@/shared/lib/utils";

const ORDENS: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "relevancia", rotulo: "Mais relevantes" },
  { valor: "recentes", rotulo: "Novidades" },
  { valor: "menores", rotulo: "Menores primeiro" },
  { valor: "maiores", rotulo: "Maiores primeiro" },
  { valor: "nome", rotulo: "Nome (A–Z)" },
];

export default function Catalogo() {
  const [parametros, definirParametros] = useSearchParams();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const filtros: FiltrosCatalogo = useMemo(() => {
    const largura = Number(parametros.get("largura"));
    return {
      termo: parametros.get("q") ?? undefined,
      categoria: parametros.get("categoria") ?? undefined,
      ambiente: parametros.get("ambiente") ?? undefined,
      tom: parametros.get("tom") ?? undefined,
      larguraMax: Number.isFinite(largura) && largura > 0 ? largura : undefined,
      somenteOfertas: parametros.get("ofertas") === "1",
      ordenar: (parametros.get("ordem") as Ordenacao | null) ?? "relevancia",
    };
  }, [parametros]);

  const categorias = useCategorias();
  const consulta = useProdutos(filtros);

  const produtos = useMemo(() => consulta.data?.pages.flat() ?? [], [consulta.data]);
  const total = consulta.data?.pages[0]?.[0]?.total ?? 0;
  const categoriaAtual = categorias.data?.find((c) => c.slug === filtros.categoria);
  const ambienteAtual = nomeDoAmbiente(filtros.ambiente);
  const tomAtual = TONS.find((t) => t.slug === filtros.tom);
  const categoriasVisiveis = (categorias.data ?? []).filter(
    (c) => !filtros.ambiente || c.ambiente === filtros.ambiente,
  );

  const titulo = filtros.termo
    ? `Resultados para “${filtros.termo}”`
    : (categoriaAtual?.nome ??
      (ambienteAtual ? `Móveis para ${ambienteAtual.toLowerCase()}` : "Todo o catálogo"));

  useSeo({
    titulo: filtros.termo
      ? `Busca: ${filtros.termo}`
      : categoriaAtual
        ? `${categoriaAtual.nome} — móveis`
        : ambienteAtual
          ? `Móveis para ${ambienteAtual.toLowerCase()}`
          : "Catálogo de móveis",
    descricao: categoriaAtual
      ? `${categoriaAtual.nome}: veja todos os modelos com foto, medidas e acabamentos. Compre na promissória, direto com a loja.`
      : "Catálogo completo com mais de 300 móveis para sala, quarto, cozinha e escritório. Medidas e acabamentos na tela, compra na promissória.",
    // Busca e combinações de filtro não viram página no Google; ambiente e categoria sim.
    naoIndexar:
      Boolean(filtros.termo) ||
      Boolean(filtros.somenteOfertas) ||
      Boolean(filtros.tom) ||
      Boolean(filtros.larguraMax),
  });

  const mudarFiltros = useCallback(
    (mudancas: Record<string, string | null>) => {
      const proximos = new URLSearchParams(parametros);
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor) proximos.set(chave, valor);
        else proximos.delete(chave);
      }
      definirParametros(proximos, { preventScrollReset: true });
    },
    [parametros, definirParametros],
  );
  const mudarFiltro = (chave: string, valor: string | null) => mudarFiltros({ [chave]: valor });

  // Scroll infinito: o sentinela no fim da lista pede a próxima página.
  const sentinela = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && consulta.hasNextPage && !consulta.isFetchingNextPage) {
          void consulta.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [consulta]);

  // Filtros em uso, cada um com o que precisa ser apagado da URL para tirá-lo.
  const ativos: { rotulo: string; limpar: Record<string, null> }[] = [];
  if (filtros.termo) ativos.push({ rotulo: `“${filtros.termo}”`, limpar: { q: null } });
  if (ambienteAtual) {
    ativos.push({ rotulo: ambienteAtual, limpar: { ambiente: null, categoria: null } });
  }
  if (categoriaAtual) ativos.push({ rotulo: categoriaAtual.nome, limpar: { categoria: null } });
  if (tomAtual) {
    ativos.push({ rotulo: `Tons ${tomAtual.nome.toLowerCase()}`, limpar: { tom: null } });
  }
  if (filtros.larguraMax) {
    ativos.push({
      rotulo: `Até ${medida(filtros.larguraMax)} de largura`,
      limpar: { largura: null },
    });
  }
  if (filtros.somenteOfertas) ativos.push({ rotulo: "Só ofertas", limpar: { ofertas: null } });

  const painel = (
    <div className="grid gap-6">
      <GrupoFiltro titulo="Ambiente">
        <div className="flex flex-wrap gap-1.5">
          {AMBIENTES.map((a) => (
            <Pilula
              key={a.slug}
              ativa={filtros.ambiente === a.slug}
              aoClicar={() =>
                mudarFiltros({
                  ambiente: filtros.ambiente === a.slug ? null : a.slug,
                  categoria: null,
                })
              }
            >
              {a.nome}
            </Pilula>
          ))}
        </div>
      </GrupoFiltro>

      <GrupoFiltro titulo="Categoria">
        <ul className="grid gap-0.5">
          {categoriasVisiveis.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => mudarFiltro("categoria", filtros.categoria === c.slug ? null : c.slug)}
                aria-pressed={filtros.categoria === c.slug}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm transition-colors",
                  filtros.categoria === c.slug
                    ? "bg-marca-100 font-semibold text-marca-900"
                    : "text-texto-2 hover:bg-tinta-100",
                )}
              >
                {c.nome}
                {filtros.categoria === c.slug ? <Check aria-hidden className="size-4" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </GrupoFiltro>

      <GrupoFiltro titulo="Tom do acabamento">
        <div className="grid grid-cols-2 gap-1.5">
          {TONS.map((t) => (
            <Pilula
              key={t.slug}
              ativa={filtros.tom === t.slug}
              aoClicar={() => mudarFiltro("tom", filtros.tom === t.slug ? null : t.slug)}
            >
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full ring-1 ring-tinta-300"
                style={{ background: t.amostra }}
              />
              {t.nome}
            </Pilula>
          ))}
        </div>
      </GrupoFiltro>

      <GrupoFiltro titulo="Cabe no meu espaço" icone={<Ruler aria-hidden className="size-4" />}>
        <p className="-mt-1 mb-1 text-xs text-texto-3">Largura máxima do móvel</p>
        <div className="grid grid-cols-2 gap-1.5">
          {LARGURAS_MAXIMAS.map((cm) => (
            <Pilula
              key={cm}
              ativa={filtros.larguraMax === cm}
              aoClicar={() => mudarFiltro("largura", filtros.larguraMax === cm ? null : String(cm))}
            >
              até {medida(cm)}
            </Pilula>
          ))}
        </div>
      </GrupoFiltro>

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-borda pt-4">
        <input
          type="checkbox"
          checked={filtros.somenteOfertas ?? false}
          onChange={(e) => mudarFiltro("ofertas", e.target.checked ? "1" : null)}
          className="size-4 rounded border-borda-forte accent-marca-600"
        />
        <span className="text-sm text-texto">Somente ofertas</span>
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <nav aria-label="Você está em" className="mb-3 text-xs text-texto-2">
        <Link to="/" className="hover:underline">
          Início
        </Link>
        <span aria-hidden> › </span>
        <Link to="/catalogo" className="hover:underline">
          Catálogo
        </Link>
        {ambienteAtual ? (
          <>
            <span aria-hidden> › </span>
            <Link to={`/catalogo?ambiente=${filtros.ambiente}`} className="hover:underline">
              {ambienteAtual}
            </Link>
          </>
        ) : null}
        {categoriaAtual ? (
          <>
            <span aria-hidden> › </span>
            <span className="text-texto">{categoriaAtual.nome}</span>
          </>
        ) : null}
      </nav>

      <header className="mb-5">
        <h1 className="titulo text-3xl text-texto sm:text-4xl">{titulo}</h1>
        <p aria-live="polite" className="mt-1 text-sm text-texto-2">
          {consulta.isPending
            ? "Carregando móveis…"
            : plural(total, "móvel encontrado", "móveis encontrados")}
        </p>
      </header>

      {ativos.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {ativos.map((f) => (
            <span
              key={f.rotulo}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-borda-forte bg-superficie pl-3.5 pr-1 text-xs text-texto"
            >
              {f.rotulo}
              <button
                type="button"
                onClick={() => mudarFiltros(f.limpar)}
                aria-label={`Remover filtro ${f.rotulo}`}
                className="alvo-44 grid size-9 place-items-center rounded-full text-texto-3 transition-colors hover:bg-tinta-100 hover:text-erro"
              >
                <X aria-hidden className="size-4" />
              </button>
            </span>
          ))}
          <Link
            to="/catalogo"
            className="inline-flex min-h-11 items-center text-xs font-medium text-texto-2 underline underline-offset-4 hover:text-erro"
          >
            Limpar tudo
          </Link>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[15.5rem_1fr]">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-44 max-h-[calc(100dvh-12rem)] overflow-y-auto pb-6 pr-1">
            {painel}
          </div>
        </aside>

        {filtrosAbertos ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtrar móveis"
            className="fixed inset-0 z-[60] flex flex-col bg-fundo lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-borda bg-superficie px-4 py-3">
              <h2 className="text-lg font-bold text-texto">Filtrar</h2>
              <button
                type="button"
                onClick={() => setFiltrosAbertos(false)}
                aria-label="Fechar filtros"
                className="grid size-11 place-items-center rounded-lg text-texto-2 hover:bg-tinta-100"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">{painel}</div>
            <div
              className="border-t border-borda bg-superficie p-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <Botao blocao tamanho="lg" onClick={() => setFiltrosAbertos(false)}>
                {consulta.isFetching ? "Atualizando…" : `Ver ${plural(total, "móvel", "móveis")}`}
              </Botao>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Botao aparencia="contorno" onClick={() => setFiltrosAbertos(true)} className="lg:hidden">
              <SlidersHorizontal aria-hidden className="size-4" />
              Filtrar
              {ativos.length > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-tinta-950 text-2xs font-bold text-tinta-0">
                  {ativos.length}
                </span>
              ) : null}
            </Botao>

            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-texto-2 sm:inline">Ordenar por</span>
              <select
                value={filtros.ordenar}
                onChange={(e) => mudarFiltro("ordem", e.target.value)}
                aria-label="Ordenar por"
                className="min-h-11 rounded-xl border border-borda-forte bg-superficie px-3 text-sm text-texto focus:border-tinta-950 focus:outline-none"
              >
                {ORDENS.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {consulta.isError ? (
            <EstadoVazio
              titulo="Não conseguimos carregar o catálogo"
              descricao="Verifique sua conexão e tente de novo."
              acao={<Botao onClick={() => void consulta.refetch()}>Tentar de novo</Botao>}
            />
          ) : consulta.isPending ? (
            <GradeEsqueleto />
          ) : produtos.length === 0 ? (
            <EstadoVazio
              icone={<PackageSearch aria-hidden className="size-8" />}
              titulo="Nenhum móvel com esses filtros"
              descricao={
                filtros.larguraMax
                  ? "Tente uma largura um pouco maior, ou tire algum filtro."
                  : "Tente outra palavra ou tire algum filtro."
              }
              acao={
                <Link
                  to="/catalogo"
                  className="text-sm font-semibold text-marca-800 underline underline-offset-4"
                >
                  Ver todo o catálogo
                </Link>
              }
            />
          ) : (
            <>
              <h2 className="sr-only">Móveis encontrados</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {produtos.map((p, i) => (
                  <li key={`${p.id}-${i}`} className="flex">
                    <CartaoProduto produto={p} prioridade={i < 4} />
                  </li>
                ))}
              </ul>

              <div ref={sentinela} aria-hidden className="h-4" />

              {consulta.isFetchingNextPage ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <li key={i}>
                      <EsqueletoCartao />
                    </li>
                  ))}
                </ul>
              ) : null}

              {!consulta.hasNextPage && produtos.length > 8 ? (
                <p className="py-8 text-center text-sm text-texto-3">
                  Você viu todos os {total} móveis desta seleção.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GrupoFiltro({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-texto">
        {icone}
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Pilula({
  ativa,
  aoClicar,
  children,
}: {
  ativa: boolean;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativa}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        ativa
          ? "border-tinta-950 bg-tinta-950 font-medium text-tinta-0"
          : "border-borda-forte bg-superficie text-texto hover:bg-tinta-50",
      )}
    >
      {children}
    </button>
  );
}

function GradeEsqueleto() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i}>
          <EsqueletoCartao />
        </li>
      ))}
    </ul>
  );
}
