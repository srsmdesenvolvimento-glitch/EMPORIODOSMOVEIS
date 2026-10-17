import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  MessageCircle,
  Ruler,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  useBanners,
  useCategorias,
  useVitrine,
} from "@/features/catalogo/api";
import { CarrosselAtalhosRapidos } from "@/features/catalogo/CarrosselAtalhosRapidos";
import { CartaoProduto, EsqueletoCartao } from "@/features/catalogo/CartaoProduto";
import { VistosRecentemente } from "@/features/favoritos/VistosRecentemente";
import { SecaoPromissoria } from "@/features/promissoria/SecaoPromissoria";
import { Foto } from "@/shared/components/Foto";
import { classesBotao } from "@/shared/components/ui";
import { AMBIENTES } from "@/shared/lib/ambientes";
import { useSeo } from "@/shared/lib/seo";
import { linkWhatsApp, NOME_DA_MARCA, useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

export default function Home() {
  const config = useConfigSite();
  const cidade = config.cidade.split(/[-,]/)[0]?.trim() ?? "";

  useSeo({
    titulo: `${NOME_DA_MARCA} — móveis${cidade ? ` em ${cidade}` : ""} na promissória`,
    descricao: `Móveis para sala, quarto, cozinha e escritório${
      cidade ? ` em ${cidade}` : ""
    }. Mais de 300 peças com medidas e acabamentos na tela. Compre na promissória, direto com a loja, sem cartão de crédito.`,
    dadosEstruturados: {
      "@context": "https://schema.org",
      "@type": "FurnitureStore",
      name: NOME_DA_MARCA,
      alternateName: "Srs. M Empório dos Móveis",
      url: typeof window === "undefined" ? undefined : window.location.origin,
      logo:
        typeof window === "undefined" ? undefined : `${window.location.origin}/marca-256.png`,
      telephone: config.whatsapp || config.telefone || undefined,
      priceRange: "Sob consulta",
      paymentAccepted: config.promissoria_ativa ? "Nota promissória" : undefined,
      address: config.cidade
        ? {
            "@type": "PostalAddress",
            streetAddress: config.endereco || undefined,
            addressLocality: cidade,
            addressRegion: config.cidade.split(/[-,]/)[1]?.trim() || undefined,
            addressCountry: "BR",
          }
        : undefined,
    },
  });

  return (
    <>
      <CarrosselAtalhosRapidos />
      <Vitrine />
      <Garantias />
      <AmbientesEmDestaque />

      <VistosRecentemente />
      <Prateleira
        titulo="Ofertas da semana"
        descricao="Condições especiais enquanto durar o estoque"
        tipo="ofertas"
        verMais="/ofertas"
        destaque
      />
      <SecaoPromissoria />
      <Prateleira
        titulo="Escolhas da casa"
        descricao="As peças que mais saem e as que a equipe recomenda"
        tipo="destaques"
        verMais="/catalogo"
      />
      <FaixaInstitucional />
      <Prateleira
        titulo="Novidades do catálogo"
        descricao="A linha 2026 acabou de chegar"
        tipo="novidades"
        verMais="/catalogo"
      />
      <ChamadaFinal whatsapp={config.whatsapp} />
    </>
  );
}

/* ------------------------------------------------------------- vitrine */

function Vitrine() {
  const banners = useBanners();
  const [atual, setAtual] = useState(0);
  const lista = banners.data ?? [];

  // Avanço automático só existe com mais de um banner, e para no hover.
  const [pausado, setPausado] = useState(false);
  useEffect(() => {
    if (lista.length < 2 || pausado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAtual((i) => (i + 1) % lista.length), 6000);
    return () => clearInterval(id);
  }, [lista.length, pausado]);

  if (banners.isPending) {
    return <div className="brilho-carregando h-[30rem] w-full sm:h-[32rem]" />;
  }

  // Sem banner cadastrado o site não fica com buraco: entra a capa da casa.
  if (lista.length === 0) return <VitrinePadrao />;

  const banner = lista[Math.min(atual, lista.length - 1)];
  if (!banner) return <VitrinePadrao />;

  return (
    <section
      aria-label="Destaques"
      className="relative isolate overflow-hidden bg-tinta-900"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <Link to={banner.link ?? "/catalogo"} className="block">
        <picture>
          {banner.imagem_mobile_url ? (
            <source media="(max-width: 640px)" srcSet={banner.imagem_mobile_url} />
          ) : null}
          <img
            src={banner.imagem_url}
            alt={banner.titulo}
            width={1600}
            height={600}
            fetchPriority="high"
            className="h-[18rem] w-full object-cover sm:h-[24rem] lg:h-[28rem]"
          />
        </picture>

        {banner.titulo || banner.subtitulo ? (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-tinta-950/85 via-tinta-950/25 to-transparent">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6 lg:pb-12">
              <h1 className="titulo max-w-2xl text-3xl text-tinta-0 sm:text-4xl lg:text-5xl">
                {banner.titulo}
              </h1>
              {banner.subtitulo ? (
                <p className="mt-2 max-w-xl text-sm text-tinta-200 sm:text-base">
                  {banner.subtitulo}
                </p>
              ) : null}
              {banner.texto_botao ? (
                <span className={cn(classesBotao({ aparencia: "marca", tamanho: "lg" }), "mt-4")}>
                  {banner.texto_botao}
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </Link>

      {lista.length > 1 ? (
        <>
          <ControleVitrine
            lado="esquerda"
            aoClicar={() => setAtual((i) => (i - 1 + lista.length) % lista.length)}
          />
          <ControleVitrine
            lado="direita"
            aoClicar={() => setAtual((i) => (i + 1) % lista.length)}
          />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {lista.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ir para o destaque ${i + 1}`}
                aria-current={i === atual}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 ease-saida",
                  i === atual ? "w-6 bg-marca-500" : "w-1.5 bg-tinta-0/60",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ControleVitrine({
  lado,
  aoClicar,
}: {
  lado: "esquerda" | "direita";
  aoClicar: () => void;
}) {
  const Icone = lado === "esquerda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={lado === "esquerda" ? "Destaque anterior" : "Próximo destaque"}
      className={cn(
        "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full",
        "bg-tinta-0/85 text-tinta-950 shadow-erguido transition-colors hover:bg-tinta-0 sm:grid",
        lado === "esquerda" ? "left-3" : "right-3",
      )}
    >
      <Icone aria-hidden className="size-5" />
    </button>
  );
}

/** Capa da casa: aparece quando não há banner cadastrado no painel. */
function VitrinePadrao() {
  const config = useConfigSite();
  const vitrine = useVitrine("destaques", 4);
  const fotos = (vitrine.data ?? []).filter((p) => p.imagem_url).slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-tinta-950 text-tinta-0" data-escuro>
      {/* brilho âmbar discreto, eco do halo da logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-marca-500/15 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:px-6 lg:py-20">
        <div className="grid gap-5">
          <span className="w-fit rounded-full border border-marca-500/40 px-3.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-marca-400">
            Catálogo 2026{config.cidade ? ` · ${config.cidade}` : ""}
          </span>
          <h1 className="titulo text-[2.6rem] sm:text-5xl lg:text-[3.6rem]">
            A casa que você imagina,{" "}
            <span className="text-marca-500">numa condição que cabe no seu bolso.</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-tinta-300 sm:text-lg">
            Mais de 300 móveis para sala, quarto e cozinha, com foto, medida e
            acabamento na tela. Escolha com calma e compre na promissória, direto
            com a loja.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Link to="/catalogo" className={classesBotao({ aparencia: "marca", tamanho: "lg" })}>
              Explorar a coleção
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            {config.promissoria_ativa ? (
              <Link
                to="/promissoria"
                className={classesBotao({
                  aparencia: "contorno",
                  tamanho: "lg",
                  className: "border-tinta-700 bg-transparent text-tinta-0 hover:bg-tinta-800",
                })}
              >
                <FileSignature aria-hidden className="size-4" />
                Comprar na promissória
              </Link>
            ) : null}
          </div>
        </div>

        {/* Mosaico com móveis de verdade do catálogo: é o produto que vende. */}
        <div className="relative hidden lg:block">
          {fotos.length >= 3 ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-3">
              {fotos.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/produto/${p.slug}`}
                  className={cn(
                    "group overflow-hidden rounded-3xl bg-tinta-0",
                    i === 0 && "row-span-2",
                  )}
                >
                  <Foto
                    src={p.imagem_url}
                    alt={p.nome}
                    width={420}
                    height={i === 0 ? 520 : 250}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className={cn(
                      "w-full object-cover transition-transform duration-500 ease-saida group-hover:scale-[1.04] motion-reduce:transform-none",
                      i === 0 ? "h-[26rem]" : "h-[12.6rem]",
                    )}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <img
              src="/logo.png"
              alt=""
              width={420}
              height={420}
              className="mx-auto size-[21rem] object-contain"
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- garantias */

function Garantias() {
  const config = useConfigSite();
  const itens = [
    config.promissoria_ativa
      ? {
          icone: FileSignature,
          titulo: "Compre na promissória",
          texto: "Parcelamento direto com a loja, sem cartão de crédito.",
          link: "/promissoria",
        }
      : null,
    {
      icone: Truck,
      titulo: "Entrega e montagem",
      texto: "Prazo e montagem combinados no fechamento do pedido.",
      link: null,
    },
    {
      icone: Ruler,
      titulo: "Medida antes da compra",
      texto: "Altura, largura e profundidade de cada peça, com desenho.",
      link: null,
    },
    {
      icone: BadgeCheck,
      titulo: "Catálogo oficial",
      texto: "Fotos e fichas técnicas direto do fabricante.",
      link: null,
    },
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  return (
    <section aria-label="Por que comprar aqui" className="border-b border-borda bg-superficie">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 lg:grid-cols-4 lg:px-6">
        {itens.map(({ icone: Icone, titulo, texto, link }) => {
          const conteudo = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-100 text-marca-900">
                <Icone aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-texto">{titulo}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-texto-2">{texto}</span>
              </span>
            </>
          );
          return (
            <li key={titulo}>
              {link ? (
                <Link to={link} className="flex items-start gap-3 rounded-xl hover:bg-tinta-50">
                  {conteudo}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------- ambientes */

/**
 * Navegação por cômodo, como nas grandes redes: o cliente pensa "preciso de
 * algo para o quarto", não "preciso de um item da linha Cômodas".
 */
function AmbientesEmDestaque() {
  const categorias = useCategorias();
  const lista = AMBIENTES.map((a) => {
    const doAmbiente = (categorias.data ?? []).filter((c) => c.ambiente === a.slug);
    return {
      ...a,
      total: doAmbiente.length,
      capa: doAmbiente.find((c) => c.imagem_url)?.imagem_url ?? null,
    };
  }).filter((a) => a.total > 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="titulo text-3xl text-texto sm:text-4xl">Cômodo por cômodo</h2>
          <p className="mt-1 text-sm text-texto-2">Comece pelo lugar onde o móvel vai morar</p>
        </div>
        <Link
          to="/categorias"
          className="shrink-0 text-sm font-semibold text-marca-800 underline underline-offset-4"
        >
          Todas as categorias
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categorias.isPending
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="brilho-carregando aspect-[4/3] rounded-3xl" />
            ))
          : lista.map((a, i) => (
              <li key={a.slug} className={cn(i === 0 && "col-span-2 sm:col-span-1")}>
                <Link
                  to={`/catalogo?ambiente=${a.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-tinta-900"
                >
                  <Foto
                    src={a.capa}
                    alt=""
                    width={480}
                    height={360}
                    loading="lazy"
                    className="size-full object-cover opacity-90 transition-transform duration-500 ease-saida group-hover:scale-105 motion-reduce:transform-none"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-tinta-950/85 via-tinta-950/20 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 grid gap-0.5 p-4 text-tinta-0 sm:p-5">
                    <span className="titulo text-2xl sm:text-3xl">{a.nome}</span>
                    <span className="hidden text-xs text-tinta-200 sm:block">{a.chamada}</span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------- prateleiras */

function Prateleira({
  titulo,
  descricao,
  tipo,
  verMais,
  destaque = false,
}: {
  titulo: string;
  descricao: string;
  tipo: "destaques" | "ofertas" | "novidades";
  verMais: string;
  destaque?: boolean;
}) {
  const consulta = useVitrine(tipo);
  const trilho = useRef<HTMLDivElement>(null);
  const itens = consulta.data ?? [];

  function rolar(direcao: 1 | -1) {
    trilho.current?.scrollBy({
      left: direcao * Math.min(600, trilho.current.clientWidth * 0.85),
      behavior: "smooth",
    });
  }

  if (!consulta.isPending && itens.length === 0) return null;

  return (
    <section className={cn("py-10", destaque && "border-y border-borda bg-marca-50")}>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="titulo text-3xl text-texto sm:text-4xl">{titulo}</h2>
            <p className="mt-1 text-sm text-texto-2">{descricao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={verMais}
              className="text-sm font-semibold text-marca-800 underline underline-offset-4"
            >
              Ver tudo
            </Link>
            <div className="hidden gap-1 sm:flex">
              <button
                type="button"
                onClick={() => rolar(-1)}
                aria-label="Rolar para a esquerda"
                className="grid size-10 place-items-center rounded-full border border-borda-forte bg-superficie text-texto-2 transition-colors hover:bg-tinta-100"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => rolar(1)}
                aria-label="Rolar para a direita"
                className="grid size-10 place-items-center rounded-full border border-borda-forte bg-superficie text-texto-2 transition-colors hover:bg-tinta-100"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div ref={trilho} className="trilho-x flex gap-3 pb-2">
          {consulta.isPending
            ? Array.from({ length: 6 }, (_, i) => <EsqueletoCartao key={i} compacto />)
            : itens.map((p) => <CartaoProduto key={p.id} produto={p} compacto />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- institucional */

function FaixaInstitucional() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <div className="grid items-center gap-8 rounded-[2rem] border border-borda bg-superficie p-6 shadow-carta lg:grid-cols-2 lg:p-12">
        <div className="grid gap-4">
          <span className="w-fit rounded-full bg-tinta-950 px-3.5 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-marca-500">
            A loja
          </span>
          <h2 className="titulo text-3xl text-texto sm:text-4xl">
            Atendimento de loja de bairro, catálogo de fábrica
          </h2>
          <p className="text-sm leading-relaxed text-texto-2 sm:text-base">
            Você escolhe aqui com calma, vendo a medida e o acabamento de cada peça.
            Depois, fecha com quem conhece o produto: uma pessoa da loja, que monta a
            condição do seu pedido e acompanha até a entrega.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/sobre" className={classesBotao({ aparencia: "solido" })}>
              Conheça a loja
            </Link>
            <Link to="/contato" className={classesBotao({ aparencia: "contorno" })}>
              Onde estamos
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {[
            { numero: "300+", texto: "móveis no catálogo" },
            { numero: "21", texto: "linhas, da sala à cozinha" },
            { numero: "2026", texto: "coleção atual" },
          ].map((item) => (
            <div
              key={item.texto}
              className="grid content-center gap-1 rounded-3xl bg-tinta-50 p-4 text-center"
            >
              <dt className="order-2 text-2xs leading-tight text-texto-2">{item.texto}</dt>
              <dd className="titulo order-1 text-3xl text-texto">{item.numero}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ChamadaFinal({ whatsapp }: { whatsapp: string }) {
  return (
    <section className="bg-tinta-950 py-16 text-tinta-0" data-escuro>
      <div className="mx-auto grid max-w-3xl gap-4 px-4 text-center lg:px-6">
        <h2 className="titulo text-3xl sm:text-4xl">
          Gostou de uma peça? A sua condição está a uma mensagem.
        </h2>
        <p className="text-tinta-300">
          Monte a lista com os móveis que você quer e envie de uma vez. Nosso time
          responde com valores, parcelas na promissória e prazo de entrega.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link to="/catalogo" className={classesBotao({ aparencia: "marca", tamanho: "lg" })}>
            Montar minha lista
          </Link>
          {whatsapp ? (
            <a
              href={linkWhatsApp(whatsapp, "Olá! Vim pelo site e quero falar com nosso time.")}
              target="_blank"
              rel="noreferrer noopener"
              className={classesBotao({ aparencia: "zap", tamanho: "lg" })}
            >
              <MessageCircle aria-hidden className="size-4" />
              Falar com nosso time
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
