import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSignature,
  Heart,
  MapPin,
  Menu,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useCategorias } from "@/features/catalogo/api";
import { useFavoritos } from "@/features/favoritos/store";
import { useOrcamento, useTotalDeItens } from "@/features/orcamento/store";
import { CampoBusca } from "@/shared/components/CampoBusca";
import { Foto } from "@/shared/components/Foto";
import { useAlturaEmVariavel } from "@/shared/hooks/useAlturaEmVariavel";
import { useDirecaoDaRolagem } from "@/shared/hooks/useDirecaoDaRolagem";
import { AMBIENTES } from "@/shared/lib/ambientes";
import type { Categoria } from "@/shared/lib/esquemas";
import { NOME_DA_MARCA, useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

export function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false);
  const config = useConfigSite();
  const categorias = useCategorias();
  const totalItens = useTotalDeItens();
  const totalFavoritos = useFavoritos((e) => e.itens.length);
  const abrirOrcamento = useOrcamento((e) => e.abrir);
  // No celular a barra enxuga ao descer; no computador ela é o menu
  // principal e fica. Quem decide é o breakpoint, não o JavaScript.
  const recolhido = useDirecaoDaRolagem();
  const refCabecalho = useAlturaEmVariavel<HTMLElement>("--altura-cabecalho");

  return (
    <header ref={refCabecalho} className="sticky top-0 z-50">
      {/* Faixa da marca: amarelo da logo com tipografia preta, como no símbolo. */}
      <div className="bg-marca-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="grid size-11 shrink-0 place-items-center rounded-lg text-tinta-950 transition-colors hover:bg-marca-400 lg:hidden"
            >
              <Menu aria-hidden className="size-6" />
            </button>

            <Link
              to="/"
              className="flex shrink-0 items-center gap-2"
              aria-label={`${NOME_DA_MARCA} — página inicial`}
            >
              <img
                src="/marca-64.png"
                alt=""
                width={40}
                height={40}
                className="size-9 rounded-full object-cover sm:size-10"
              />
              <span className="hidden leading-tight sm:block">
                <span className="block text-[0.95rem] font-bold text-tinta-950">
                  Empório dos Móveis
                </span>
                <span className="block text-2xs font-medium text-tinta-800">
                  móveis para a casa inteira
                </span>
              </span>
            </Link>

            <div className="hidden flex-1 lg:block">
              <CampoBusca id="busca-desktop" placeholder="Buscar guarda-roupa, sofá, cozinha…" />
            </div>

            <div className="ml-auto flex items-center gap-0.5">
              <Link
                to="/ofertas"
                className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-tinta-950 transition-colors hover:bg-marca-400 sm:inline-flex"
              >
                <Tag aria-hidden className="size-4" />
                Ofertas
              </Link>
              {config.promissoria_ativa ? (
                <Link
                  to="/promissoria"
                  className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-tinta-950 transition-colors hover:bg-marca-400 sm:inline-flex"
                >
                  <FileSignature aria-hidden className="size-4" />
                  <span>Boleto & Promissória</span>
                </Link>
              ) : null}
              <IconeComContador
                para="/favoritos"
                rotulo={
                  totalFavoritos > 0 ? `Favoritos, ${totalFavoritos} salvos` : "Favoritos"
                }
                contador={totalFavoritos}
              >
                <Heart aria-hidden className="size-6" />
              </IconeComContador>
              <button
                type="button"
                onClick={abrirOrcamento}
                className="relative grid size-11 place-items-center rounded-lg text-tinta-950 transition-colors hover:bg-marca-400"
                aria-label={
                  totalItens > 0
                    ? `Lista de orçamento com ${totalItens} ${totalItens === 1 ? "item" : "itens"}`
                    : "Lista de orçamento, vazia"
                }
              >
                <ClipboardList aria-hidden className="size-6" />
                <Contador valor={totalItens} />
              </button>
            </div>
          </div>

          {/* No celular a busca ganha a própria linha, sem competir com nada. */}
          <div className="lg:hidden">
            <CampoBusca id="busca-mobile" placeholder="Buscar móveis…" />
          </div>
        </div>
      </div>

      <BarraAmbientes
        categorias={categorias.data ?? []}
        promissoria={config.promissoria_ativa}
        recolhido={recolhido}
      />

      {menuAberto ? (
        <MenuLateral
          aoFechar={() => setMenuAberto(false)}
          categorias={categorias.data ?? []}
          cidade={config.cidade}
          promissoria={config.promissoria_ativa}
        />
      ) : null}
    </header>
  );
}

function Contador({ valor }: { valor: number }) {
  if (valor <= 0) return null;
  return (
    <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-tinta-950 px-1 text-2xs font-bold text-marca-500">
      {valor > 99 ? "99+" : valor}
    </span>
  );
}

function IconeComContador({
  para,
  rotulo,
  contador,
  children,
}: {
  para: string;
  rotulo: string;
  contador: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={para}
      aria-label={rotulo}
      className="relative grid size-11 place-items-center rounded-lg text-tinta-950 transition-colors hover:bg-marca-400"
    >
      {children}
      <Contador valor={contador} />
    </Link>
  );
}

/* --------------------------------------------------------- mega-menu */

/**
 * Barra escura com os ambientes. No desktop, cada ambiente abre um painel com
 * as categorias dele, como no menu da IKEA e da Tok&Stok; no celular vira uma
 * fileira de atalhos que rola de lado.
 */
function BarraAmbientes({
  categorias,
  promissoria,
  recolhido,
}: {
  categorias: Categoria[];
  promissoria: boolean;
  /** Celular: a faixa enxuga ao descer a página. No desktop, nunca. */
  recolhido: boolean;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const local = useLocation();

  // Navegou: fecha o painel. Ajustado no render, sem efeito.
  const [caminhoAnterior, setCaminhoAnterior] = useState(local.key);
  if (local.key !== caminhoAnterior) {
    setCaminhoAnterior(local.key);
    setAberto(null);
  }

  // Um atraso curto evita que o painel pisque quando o mouse só passa por cima.
  function abrirComAtraso(slug: string) {
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => setAberto(slug), 120);
  }
  function fecharComAtraso() {
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => setAberto(null), 160);
  }
  useEffect(
    () => () => {
      if (espera.current) clearTimeout(espera.current);
    },
    [],
  );

  const ambientes = AMBIENTES.filter((a) => categorias.some((c) => c.ambiente === a.slug));
  const painel = ambientes.find((a) => a.slug === aberto);
  const doPainel = categorias.filter((c) => c.ambiente === aberto);

  return (
    <div
      data-escuro
      className="relative border-b border-tinta-800 bg-tinta-950"
      onMouseLeave={fecharComAtraso}
      onKeyDown={(e) => {
        if (e.key === "Escape") setAberto(null);
      }}
    >
      <nav aria-label="Ambientes" className="mx-auto hidden max-w-7xl items-center px-4 lg:flex lg:px-6">
        <NavLink
          to="/catalogo"
          end
          className={({ isActive }) =>
            cn(
              "min-h-11 px-3 py-3 text-sm font-medium transition-colors",
              isActive ? "text-marca-500" : "text-tinta-100 hover:text-tinta-0",
            )
          }
        >
          Todo o catálogo
        </NavLink>
        {ambientes.map((a) => (
          <div key={a.slug} onMouseEnter={() => abrirComAtraso(a.slug)}>
            <button
              type="button"
              aria-expanded={aberto === a.slug}
              onClick={() => setAberto(aberto === a.slug ? null : a.slug)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1 px-3 py-3 text-sm transition-colors",
                aberto === a.slug ? "text-marca-500" : "text-tinta-200 hover:text-tinta-0",
              )}
            >
              {a.nome}
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  aberto === a.slug && "rotate-180",
                )}
              />
            </button>
          </div>
        ))}
        <Link
          to="/ofertas"
          className="min-h-11 px-3 py-3 text-sm font-medium text-tinta-200 transition-colors hover:text-tinta-0"
        >
          Ofertas
        </Link>
        {promissoria ? (
          <Link
            to="/promissoria"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 px-3 py-3 text-sm font-semibold text-marca-500 transition-opacity hover:opacity-80"
          >
            <FileSignature aria-hidden className="size-4" />
            Boleto & Promissória
          </Link>
        ) : null}
      </nav>

      {painel ? (
        <div
          onMouseEnter={() => abrirComAtraso(painel.slug)}
          className="absolute inset-x-0 top-full hidden border-b border-borda bg-superficie shadow-suspenso lg:block"
        >
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[14rem_1fr]">
            <div className="grid content-start gap-2">
              <p className="titulo text-3xl text-texto">{painel.nome}</p>
              <p className="text-sm text-texto-2">{painel.chamada}</p>
              <Link
                to={`/catalogo?ambiente=${painel.slug}`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-marca-800 underline underline-offset-4"
              >
                Ver tudo para {painel.nome.toLowerCase()}
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-3 gap-3 xl:grid-cols-5">
              {doPainel.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/catalogo?categoria=${c.slug}`}
                    className="group grid gap-2 rounded-2xl p-2 transition-colors hover:bg-tinta-50"
                  >
                    <span className="moldura-foto aspect-[4/3] rounded-xl bg-tinta-50">
                      <Foto
                        src={c.imagem_url}
                        alt=""
                        width={200}
                        height={150}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 ease-saida group-hover:scale-105 motion-reduce:transform-none"
                      />
                    </span>
                    <span className="px-1 text-sm font-medium text-texto">{c.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Atalhos roláveis no celular. Enxugam quando a pessoa desce e
          voltam no primeiro gesto de subir — o cromo não come a tela.
          O `grid-rows` de 1fr para 0fr é o único jeito de tirar a faixa do
          fluxo sem animar altura; no computador ele fica travado em 1fr,
          porque lá esta barra é o menu principal e não pode sumir. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-saida motion-reduce:transition-none",
          recolhido ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          "lg:grid-rows-[1fr] lg:opacity-100",
        )}
        // Recolhida, a faixa sai também do teclado: sem isso o Tab levaria
        // o foco para links invisíveis.
        inert={recolhido}
      >
        <div className="min-h-0 overflow-hidden">
          <nav aria-label="Ambientes" className="trilho-x flex gap-1 px-3 py-1.5 lg:hidden">
            <NavLink
              to="/catalogo"
              end
              className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold text-tinta-0"
            >
              Tudo
            </NavLink>
            {ambientes.map((a) => (
              <Link
                key={a.slug}
                to={`/catalogo?ambiente=${a.slug}`}
                className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-tinta-200"
              >
                {a.nome}
              </Link>
            ))}
            <Link
              to="/ofertas"
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-xs text-tinta-200"
            >
              Ofertas
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ menu do celular */

function MenuLateral({
  aoFechar,
  categorias,
  cidade,
  promissoria,
}: {
  aoFechar: () => void;
  categorias: Categoria[];
  cidade: string;
  promissoria: boolean;
}) {
  const painel = useRef<HTMLDivElement>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    // Trava o fundo e leva o foco ao menu: navegação por teclado precisa disso.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aoFechar]);

  const ambientes = AMBIENTES.filter((a) => categorias.some((c) => c.ambiente === a.slug));

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={aoFechar}
        className="absolute inset-0 bg-tinta-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={painel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="surgir absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col bg-superficie shadow-suspenso focus:outline-none"
      >
        <div className="flex items-center justify-between gap-2 bg-marca-500 px-4 py-3">
          <span className="flex items-center gap-2">
            <img src="/marca-64.png" alt="" width={36} height={36} className="size-9 rounded-full" />
            <span className="text-sm font-bold text-tinta-950">Empório dos Móveis</span>
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="grid size-11 place-items-center rounded-lg text-tinta-950 hover:bg-marca-400"
          >
            <X aria-hidden className="size-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain py-2">
          <Link
            to="/catalogo"
            onClick={aoFechar}
            className="flex min-h-12 items-center px-4 text-sm font-semibold text-texto hover:bg-tinta-50"
          >
            Todo o catálogo
          </Link>
          <Link
            to="/ofertas"
            onClick={aoFechar}
            className="flex min-h-12 items-center gap-2 px-4 text-sm font-semibold text-erro hover:bg-tinta-50"
          >
            <Tag aria-hidden className="size-4" />
            Ofertas
          </Link>
          {promissoria ? (
            <Link
              to="/promissoria"
              onClick={aoFechar}
              className="flex min-h-12 items-center gap-2 px-4 text-sm font-semibold text-texto hover:bg-tinta-50"
            >
              <FileSignature aria-hidden className="size-4 text-marca-800" />
              Compre na promissória
            </Link>
          ) : null}
          <Link
            to="/favoritos"
            onClick={aoFechar}
            className="flex min-h-12 items-center gap-2 px-4 text-sm font-semibold text-texto hover:bg-tinta-50"
          >
            <Heart aria-hidden className="size-4" />
            Meus favoritos
          </Link>

          <p className="px-4 pb-1 pt-4 text-2xs font-semibold uppercase tracking-wide text-texto-3">
            Ambientes
          </p>
          {ambientes.map((a) => {
            const aberto = expandido === a.slug;
            return (
              <div key={a.slug}>
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : a.slug)}
                  aria-expanded={aberto}
                  className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-medium text-texto hover:bg-tinta-50"
                >
                  {a.nome}
                  <ChevronDown
                    aria-hidden
                    className={cn("size-4 text-texto-3 transition-transform", aberto && "rotate-180")}
                  />
                </button>
                {aberto ? (
                  <div className="bg-tinta-50 py-1">
                    <Link
                      to={`/catalogo?ambiente=${a.slug}`}
                      onClick={aoFechar}
                      className="flex min-h-11 items-center px-7 text-sm font-semibold text-marca-800"
                    >
                      Ver tudo para {a.nome.toLowerCase()}
                    </Link>
                    {categorias
                      .filter((c) => c.ambiente === a.slug)
                      .map((c) => (
                        <Link
                          key={c.id}
                          to={`/catalogo?categoria=${c.slug}`}
                          onClick={aoFechar}
                          className="flex min-h-11 items-center px-7 text-sm text-texto-2 hover:text-texto"
                        >
                          {c.nome}
                        </Link>
                      ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="mt-2 border-t border-borda pt-2">
            <Link
              to="/sobre"
              onClick={aoFechar}
              className="flex min-h-12 items-center px-4 text-sm text-texto hover:bg-tinta-50"
            >
              Quem somos
            </Link>
            <Link
              to="/contato"
              onClick={aoFechar}
              className="flex min-h-12 items-center px-4 text-sm text-texto hover:bg-tinta-50"
            >
              Contato
            </Link>
          </div>
        </nav>

        {cidade ? (
          <p className="flex items-center gap-1.5 border-t border-borda px-4 py-3 text-xs text-texto-2">
            <MapPin aria-hidden className="size-3.5" />
            {cidade}
          </p>
        ) : null}
      </div>
    </div>
  );
}
