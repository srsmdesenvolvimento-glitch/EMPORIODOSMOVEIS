import {
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Layers,
  Receipt,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Quote,
  XCircle,
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
import { IconeWhatsApp } from "@/shared/components/IconesSociais";
import { classesBotao } from "@/shared/components/ui";
import { AMBIENTES } from "@/shared/lib/ambientes";
import { useSeo } from "@/shared/lib/seo";
import { linkWhatsApp, NOME_DA_MARCA, useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

export default function Home() {
  const config = useConfigSite();
  const cidade = config.cidade.split(/[-,]/)[0]?.trim() ?? "";

  useSeo({
    titulo: `${NOME_DA_MARCA} — E-Commerce de Móveis de Alto Padrão no Boleto e Promissória`,
    descricao: `O maior e-commerce de móveis com crediário próprio: compre na promissória e no boleto parcelado sem cartão de crédito${
      cidade ? ` em ${cidade}` : ""
    }. Mais de 300 peças 100% MDF/MDP com medidas exatas, espumas certificadas e garantia de fábrica.`,
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
      paymentAccepted: config.promissoria_ativa ? "Nota promissória, Boleto bancário" : undefined,
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
      <ComparativoQualidade />
      <PitchesDeValor />
      <AmbientesEmDestaque />

      <VistosRecentemente />

      <Prateleira
        titulo="Ofertas da Semana"
        descricao="Preços especiais direto de fábrica com estoque limitado"
        tipo="ofertas"
        verMais="/ofertas"
        destaque
      />

      <SecaoPromissoria />

      <Prateleira
        titulo="Escolhas da Casa & Mais Vendidos"
        descricao="Os móveis mais desejados com aprovação imediata no crediário"
        tipo="destaques"
        verMais="/catalogo"
      />

      <DepoimentosClientes />

      <Prateleira
        titulo="Lançamentos Coleção 2026"
        descricao="Novas linhas com design contemporâneo e acabamento superior"
        tipo="novidades"
        verMais="/catalogo"
      />

      <FaqCrediario whatsapp={config.whatsapp} />
      <FaixaInstitucional />
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
    return <div className="brilho-carregando h-[32rem] w-full" />;
  }

  // Sem banners personalizados do painel: entra a capa rica do e-commerce.
  if (lista.length === 0) return <VitrinePadrao />;

  const banner = lista[Math.min(atual, lista.length - 1)];
  if (!banner) return <VitrinePadrao />;

  return (
    <section
      aria-label="Destaques da Coleção"
      className="relative isolate overflow-hidden bg-tinta-950"
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
            className="h-[22rem] w-full object-cover sm:h-[28rem] lg:h-[34rem]"
          />
        </picture>

        {banner.titulo || banner.subtitulo ? (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-tinta-950/95 via-tinta-950/40 to-transparent">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6 lg:pb-14">
              <span className="inline-block rounded-full bg-marca-500/20 border border-marca-500/40 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider text-marca-400 mb-2">
                Destaque Oficial
              </span>
              <h1 className="titulo max-w-2xl text-3xl text-tinta-0 sm:text-4xl lg:text-5xl">
                {banner.titulo}
              </h1>
              {banner.subtitulo ? (
                <p className="mt-2 max-w-xl text-sm text-tinta-200 sm:text-base">
                  {banner.subtitulo}
                </p>
              ) : null}
              {banner.texto_botao ? (
                <span className={cn(classesBotao({ aparencia: "marca", tamanho: "lg" }), "mt-4 shadow-flutuante")}>
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
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {lista.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ir para o destaque ${i + 1}`}
                aria-current={i === atual}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 ease-saida",
                  i === atual ? "w-7 bg-marca-500" : "w-1.5 bg-tinta-0/60",
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
        "absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full",
        "bg-tinta-950/80 text-tinta-0 border border-tinta-700 backdrop-blur-md shadow-erguido transition-all hover:bg-marca-500 hover:text-tinta-950 sm:grid",
        lado === "esquerda" ? "left-4" : "right-4",
      )}
    >
      <Icone aria-hidden className="size-6" />
    </button>
  );
}

const AMBIENTES_SHOWCASE = [
  {
    id: "sala",
    nome: "Sala de Estar",
    rotuloAba: "🛋️ Sala de Estar",
    chamada: "Sofás bouclé retráteis, racks ripados 100% MDF e mesas de centro",
    imagem: "/ambientes/sala.jpg",
    link: "/catalogo?ambiente=sala",
    tag: "Coleção Sala 2026",
    parcelaMedia: "A partir de 12x no boleto ou promissória",
    destaques: ["Espuma D33 Certificada", "MDF Nobre de Alta Densidade", "Design Exclusivo"],
  },
  {
    id: "jantar",
    nome: "Sala de Jantar",
    rotuloAba: "🪑 Sala de Jantar",
    chamada: "Mesas nobres com tampo chanfrado e cadeiras anatômicas acolchoadas",
    imagem: "/ambientes/jantar.jpg",
    link: "/catalogo?ambiente=jantar",
    tag: "Mais Vendidos",
    parcelaMedia: "Condições facilitadas no crediário",
    destaques: ["Madeira Maciça & Vidro Temperado", "Cadeiras com Suporte 120kg", "Tecidos Anti-Mancha"],
  },
  {
    id: "quarto",
    nome: "Quartos & Suítes",
    rotuloAba: "🛏️ Quartos",
    chamada: "Roupeiros com espelho integral, camas box queen e cabeceiras estofadas",
    imagem: "/ambientes/quarto.jpg",
    link: "/catalogo?ambiente=quarto",
    tag: "Conforto & Sofisticação",
    parcelaMedia: "Parcele sem cartão bancário",
    destaques: ["Gavetas com Corrediças Telescópicas", "Divisões Internas Inteligentes", "100% MDF Reforçado"],
  },
  {
    id: "cozinha",
    nome: "Cozinhas Moduladas",
    rotuloAba: "🍳 Cozinhas",
    chamada: "Armários aéreos, balcões pia e paneleiros de alta resistência",
    imagem: "/ambientes/cozinha.jpg",
    link: "/catalogo?ambiente=cozinha",
    tag: "Durabilidade Máxima",
    parcelaMedia: "Aprovação ágil para a cozinha inteira",
    destaques: ["Chapas Resistentes à Umidade", "Dobradiças Slow-Close", "Puxadores em Alumínio"],
  },
  {
    id: "escritorio",
    nome: "Home Office & Linha Office",
    rotuloAba: "💼 Escritório",
    chamada: "Escrivaninhas robustas, estantes livreiras e gaveteiros",
    imagem: "/ambientes/escritorio.jpg",
    link: "/catalogo?ambiente=escritorio",
    tag: "Linha Corporativa",
    parcelaMedia: "Parcelas fixas no boleto",
    destaques: ["Passa-Fios Embutido", "Tampo Espesso 25mm", "Ergonomia Testada"],
  },
];

/** Capa da casa: Hero de alto padrão com showcase interativo de cômodos */
function VitrinePadrao() {
  const config = useConfigSite();
  const [ambienteAtivo, setAmbienteAtivo] = useState(0);
  const ativo = AMBIENTES_SHOWCASE[ambienteAtivo] ?? AMBIENTES_SHOWCASE[0]!;

  return (
    <section className="relative overflow-hidden bg-[#0c0d10] text-tinta-0" data-escuro>
      {/* Luz ambiente dourada e malha sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 size-[42rem] rounded-full bg-marca-500/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 size-[32rem] rounded-full bg-marca-600/10 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1.1fr_1.1fr] lg:gap-14 lg:px-6 lg:py-20">
        {/* Coluna da Esquerda: Pitch & Autoridade */}
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-marca-500/40 bg-marca-500/15 px-3.5 py-1 text-2xs font-extrabold uppercase tracking-[0.14em] text-marca-400">
              <Sparkles aria-hidden className="size-3 text-marca-400" />
              E-Commerce Nacional de Móveis
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tinta-900 border border-tinta-700 px-3 py-1 text-2xs font-bold text-tinta-100">
              <FileSignature aria-hidden className="size-3 text-marca-400" />
              Boleto & Promissória Própria
            </span>
          </div>

          <h1 className="titulo text-[2.4rem] leading-[1.1] sm:text-5xl lg:text-[3.75rem]">
            Móveis de Alto Padrão,{" "}
            <span className="bg-gradient-to-r from-marca-400 via-marca-500 to-amber-200 bg-clip-text text-transparent">
              no Boleto e Promissória Sem Burocracia de Cartão.
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-tinta-300 sm:text-base lg:text-lg">
            Mais de 300 modelos com acabamento refinado direto dos maiores polos fabris.
            Estruturas em 100% MDF/MDP de alta densidade, medidas milimétricas e o crediário próprio
            mais flexível: parcele no boleto bancário ou na nota promissória sem travar o seu limite.
          </p>

          {/* Micro-chancela de qualidade e pagamento */}
          <div className="grid gap-2 sm:grid-cols-2 pt-1 border-y border-tinta-800/80 py-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-tinta-200">
              <ShieldCheck className="size-4 text-marca-400 shrink-0" />
              <span>100% MDF Nobre & Espuma D28/D33</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-tinta-200">
              <Ruler className="size-4 text-marca-400 shrink-0" />
              <span>Ficha Técnica com Medida Milimétrica</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-tinta-200">
              <Receipt className="size-4 text-marca-400 shrink-0" />
              <span>Parcelamento Próprio em até 24x</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-tinta-200">
              <Truck className="size-4 text-marca-400 shrink-0" />
              <span>Embalagem Reforçada Direto da Fábrica</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/catalogo"
              className={classesBotao({
                aparencia: "marca",
                tamanho: "lg",
                className: "shadow-[0_8px_24px_rgba(255,193,3,0.3)] hover:shadow-[0_12px_32px_rgba(255,193,3,0.45)] font-black",
              })}
            >
              Explorar Coleção 2026
              <ArrowRight aria-hidden className="size-4" />
            </Link>

            {config.promissoria_ativa ? (
              <Link
                to="/promissoria"
                className={classesBotao({
                  aparencia: "contorno",
                  tamanho: "lg",
                  className: "border-tinta-700 bg-tinta-900/60 backdrop-blur-md text-tinta-0 hover:border-marca-500 hover:bg-tinta-900 font-bold",
                })}
              >
                <FileSignature aria-hidden className="size-4 text-marca-400" />
                Comprar sem Cartão
              </Link>
            ) : null}

            {config.whatsapp ? (
              <a
                href={linkWhatsApp(config.whatsapp, "Olá! Vim pelo site do Empório dos Móveis e quero falar com um consultor.")}
                target="_blank"
                rel="noreferrer noopener"
                className="efeito-shimmer inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#1ebe57] to-[#25D366] hover:from-[#18a84c] hover:to-[#22c35e] text-white px-5 py-3.5 text-sm font-bold shadow-[0_4px_20px_rgba(37,211,102,0.35)] hover:scale-[1.03] hover:shadow-[0_8px_28px_rgba(37,211,102,0.5)] transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <IconeWhatsApp className="size-5 text-white shrink-0" />
                <span>Falar no WhatsApp</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Coluna da Direita: Showcase Interativo de Ambientes */}
        <div className="flex flex-col gap-3">
          {/* Abas de Cômodos */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {AMBIENTES_SHOWCASE.map((amb, idx) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => setAmbienteAtivo(idx)}
                className={cn(
                  "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  ambienteAtivo === idx
                    ? "bg-marca-500 text-tinta-950 shadow-erguido"
                    : "bg-tinta-900/80 text-tinta-300 border border-tinta-800 hover:text-tinta-0 hover:bg-tinta-800",
                )}
              >
                {amb.rotuloAba}
              </button>
            ))}
          </div>

          {/* Cartão Principal do Ambiente Ativo */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-tinta-700/80 bg-tinta-900 shadow-suspenso">
            <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11]">
              <img
                src={ativo.imagem}
                alt={ativo.nome}
                width={800}
                height={550}
                className="size-full object-cover transition-transform duration-700 ease-saida group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tinta-950 via-tinta-950/40 to-transparent" />

              {/* Tag Superior */}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-tinta-950/85 backdrop-blur-md border border-marca-500/40 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider text-marca-400">
                  {ativo.tag}
                </span>
                <span className="rounded-full bg-tinta-950/80 backdrop-blur-md border border-tinta-700 px-3 py-1 text-2xs font-bold text-tinta-200">
                  100% MDF Nobre
                </span>
              </div>

              {/* Bloco de Informações Inferior */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 grid gap-3">
                <div>
                  <h2 className="titulo text-2xl sm:text-3xl text-tinta-0">
                    {ativo.nome}
                  </h2>
                  <p className="text-xs sm:text-sm text-tinta-300 mt-0.5 line-clamp-2">
                    {ativo.chamada}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {ativo.destaques.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-tinta-950/70 backdrop-blur-sm border border-tinta-800 px-2 py-0.5 text-[0.68rem] text-tinta-200"
                    >
                      <CheckCircle2 className="size-3 text-marca-400" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-tinta-800/80 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] uppercase tracking-wider text-marca-400 font-bold">
                      Facilidade no Crediário
                    </span>
                    <span className="text-xs font-semibold text-tinta-100">
                      {ativo.parcelaMedia}
                    </span>
                  </div>

                  <Link
                    to={ativo.link}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-marca-500 px-3.5 py-2 text-xs font-black text-tinta-950 hover:bg-marca-400 transition-colors shadow-carta"
                  >
                    Explorar Cômodo
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Miniaturas de Acesso Rápido */}
          <div className="grid grid-cols-5 gap-2">
            {AMBIENTES_SHOWCASE.map((amb, idx) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => setAmbienteAtivo(idx)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl border transition-all",
                  ambienteAtivo === idx
                    ? "border-marca-500 ring-2 ring-marca-500/50 scale-105"
                    : "border-tinta-800 opacity-60 hover:opacity-100",
                )}
              >
                <img
                  src={amb.imagem}
                  alt={amb.nome}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
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
          icone: Receipt,
          titulo: "Boleto e Promissória Própria",
          texto: "Parcele sem precisar de cartão ou limite bancário.",
          link: "/promissoria",
          badge: "Crediário Próprio",
        }
      : null,
    {
      icone: Sparkles,
      titulo: "Qualidade Fabril Superior",
      texto: "100% MDF/MDP nobre, corrediças telescópicas e espumas seladas.",
      link: null,
      badge: "Padrão Alto",
    },
    {
      icone: Ruler,
      titulo: "Medidas Milimétricas no Site",
      texto: "Altura, largura e profundidade com desenho exato para caber no lar.",
      link: null,
      badge: "Sem Surpresas",
    },
    {
      icone: Truck,
      titulo: "Logística Segura & Direta",
      texto: "Embalagem reforçada de exportação e entrega cuidadosa.",
      link: null,
      badge: "Garantia Fabril",
    },
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  return (
    <section aria-label="Garantias e diferenciais do Empório dos Móveis" className="border-b border-borda bg-superficie py-6 shadow-carta">
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {itens.map(({ icone: Icone, titulo, texto, link, badge }) => {
          const conteudo = (
            <div className="flex items-start gap-3.5 w-full rounded-2xl border border-borda/70 bg-fundo/60 p-4 transition-all duration-200 hover:border-marca-500/60 hover:bg-superficie hover:shadow-carta">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-marca-500 text-tinta-950 shadow-sm ring-2 ring-marca-500/20">
                <Icone aria-hidden className="size-6 text-tinta-950" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1">
                  <span className="block text-sm font-bold text-texto tracking-tight">{titulo}</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-texto-2">{texto}</span>
                <span className="mt-2 inline-block rounded-full bg-tinta-100 px-2 py-0.5 text-[0.6rem] font-bold text-texto-3 uppercase tracking-wide">
                  {badge}
                </span>
              </span>
            </div>
          );
          return (
            <li key={titulo} className="flex">
              {link ? (
                <Link to={link} className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500 rounded-2xl">
                  {conteudo}
                </Link>
              ) : (
                conteudo
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ----------------------------- comparativo de qualidade ------------------ */

function ComparativoQualidade() {
  const criterios = [
    {
      criterio: "Matéria-Prima Estrutural",
      emporio: "100% MDF e MDP de alta densidade selecionados, com resistência superior à umidade e ao peso.",
      outros: "Aglomerados ocos de baixa espessura que esfarelam, estufam e perdem firmeza com facilidade.",
    },
    {
      criterio: "Espumas e Estofamento",
      emporio: "Espumas certificadas D28 e D33 com alta resiliência e tecidos nobres anti-manchas.",
      outros: "Flocos de espuma reaproveitados que afundam e deformam em poucos meses de uso.",
    },
    {
      criterio: "Ferragens e Movimentação",
      emporio: "Corrediças telescópicas de extração total e dobradiças metálicas com amortecimento slow.",
      outros: "Trilhos plásticos simples que travam com facilidade e soltam gavetas com o tempo.",
    },
    {
      criterio: "Facilidade de Pagamento",
      emporio: "Crediário próprio facilitado no boleto e nota promissória sem comprometer o limite do cartão.",
      outros: "Exigem limite alto no cartão de crédito e recusam quem não tem margem bancária.",
    },
    {
      criterio: "Transparência de Medidas",
      emporio: "Diagramas técnicos em proporção real com altura, largura e profundidade exatas na tela.",
      outros: "Medidas aproximadas sem detalhamento das divisões internas, gerando surpresas na entrega.",
    },
  ];

  return (
    <section aria-labelledby="titulo-comparativo" className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-marca-500/15 border border-marca-500/30 px-3.5 py-1 text-2xs font-extrabold uppercase tracking-wider text-marca-900 mb-2">
          Padrão Fabril Certificado
        </span>
        <h2 id="titulo-comparativo" className="titulo text-3xl sm:text-4xl text-texto">
          Empório dos Móveis vs. Lojas Comuns
        </h2>
        <p className="mt-2 text-sm sm:text-base text-texto-2">
          Entenda por que a nossa qualidade e as nossas condições de pagamento são incomparáveis.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-borda bg-superficie shadow-carta">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-borda">
          {/* Lado Empório */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-marca-50/50 to-superficie">
            <div className="flex items-center gap-3 mb-6">
              <span className="grid size-10 place-items-center rounded-xl bg-marca-500 text-tinta-950 shadow-sm">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <h3 className="titulo text-xl font-black text-texto">Padrão Empório dos Móveis</h3>
                <p className="text-2xs font-bold text-marca-900 uppercase tracking-wide">Qualidade de Fábrica & Crediário Próprio</p>
              </div>
            </div>

            <ul className="space-y-4">
              {criterios.map((c) => (
                <li key={c.criterio} className="flex items-start gap-3 rounded-2xl bg-superficie p-3.5 border border-marca-500/30 shadow-2xs">
                  <CheckCircle2 className="size-5 text-sucesso shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-texto">{c.criterio}</span>
                    <span className="text-xs text-texto-2 leading-relaxed mt-0.5 block">{c.emporio}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Lado Lojas Genéricas */}
          <div className="p-6 sm:p-8 bg-tinta-50/50">
            <div className="flex items-center gap-3 mb-6">
              <span className="grid size-10 place-items-center rounded-xl bg-tinta-200 text-texto-3">
                <BadgeAlert className="size-6" />
              </span>
              <div>
                <h3 className="titulo text-xl font-bold text-texto-2">Lojas Comuns de Varejo</h3>
                <p className="text-2xs font-medium text-texto-3 uppercase tracking-wide">Móveis de Baixo Custo & Burocracia</p>
              </div>
            </div>

            <ul className="space-y-4">
              {criterios.map((c) => (
                <li key={c.criterio} className="flex items-start gap-3 rounded-2xl bg-superficie p-3.5 border border-borda shadow-2xs opacity-85">
                  <XCircle className="size-5 text-erro shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-semibold text-texto-2">{c.criterio}</span>
                    <span className="text-xs text-texto-3 leading-relaxed mt-0.5 block">{c.outros}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- pitches de valor do e-commerce */

function PitchesDeValor() {
  const diferenciais = [
    {
      numero: "01",
      icone: FileSignature,
      destaque: "Crediário Próprio",
      titulo: "Facilidade Real no Boleto e Promissória",
      descricao:
        "Sem limite no cartão de crédito? Você não precisa dele aqui. Nosso crediário próprio parcela sua compra com parcelas mensais fixas e aprovação sem complicação.",
      vantagens: [
        "Não compromete o limite do seu cartão bancário",
        "Parcelas fixas e transparentes de ponta a ponta",
        "Aprovação ágil para mobiliar a casa inteira",
      ],
    },
    {
      numero: "02",
      icone: ShieldCheck,
      destaque: "Padrão Construtivo",
      titulo: "Qualidade Fabril e Durabilidade Extrema",
      descricao:
        "Móveis produzidos com matérias-primas nobres, chapas de alta densidade (100% MDF/MDP), corrediças telescópicas e estofamentos com espumas certificadas.",
      vantagens: [
        "Estrutura reforçada contra riscos e umidade",
        "Tecidos sofisticados com toque macio e resistente",
        "Garantia oficial de fábrica em todos os itens",
      ],
    },
    {
      numero: "03",
      icone: Layers,
      destaque: "Transparência Total",
      titulo: "Ficha Técnica e Medida Antes de Comprar",
      descricao:
        "Tire qualquer dúvida antes de fechar: cada peça conta com diagrama em proporção real, medidas milimétricas e fotos de alta resolução dos acabamentos.",
      vantagens: [
        "Sem surpresas no encaixe do seu ambiente",
        "Fotos nítidas com cores reais do catálogo",
        "Consultores dedicados via WhatsApp para auxiliar",
      ],
    },
    {
      numero: "04",
      icone: Truck,
      destaque: "Logística Confiável",
      titulo: "Entrega Estruturada e Cuidado de Ponta a Ponta",
      descricao:
        "Seus móveis são embalados com camadas de proteção reforçadas de fábrica e entregues com todo o cuidado para chegarem perfeitos no seu lar.",
      vantagens: [
        "Embalagens industriais de alta proteção",
        "Acompanhamento direto do pedido até a entrega",
        "Equipe que conhece o produto para garantir suporte",
      ],
    },
  ];

  return (
    <section aria-labelledby="titulo-pitches" className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-marca-500/15 border border-marca-500/30 px-3.5 py-1 text-2xs font-extrabold uppercase tracking-wider text-marca-900 mb-2">
          Diferenciais Exclusivos
        </span>
        <h2 id="titulo-pitches" className="titulo text-3xl sm:text-4xl text-texto">
          Por que somos a sua melhor escolha em móveis?
        </h2>
        <p className="mt-2 text-sm sm:text-base text-texto-2">
          Unimos o padrão estético dos maiores showrooms com a maior flexibilidade de pagamento do mercado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {diferenciais.map((d) => {
          const Icone = d.icone;
          return (
            <div
              key={d.titulo}
              className="group flex flex-col justify-between rounded-3xl border border-borda bg-superficie p-6 shadow-carta transition-all duration-300 hover:border-marca-500 hover:shadow-flutuante hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-tinta-950 text-marca-400 shadow-sm transition-colors group-hover:bg-marca-500 group-hover:text-tinta-950">
                    <Icone aria-hidden className="size-6" />
                  </span>
                  <span className="titulo text-2xl font-black text-tinta-300 group-hover:text-marca-600 transition-colors">
                    {d.numero}
                  </span>
                </div>

                <span className="inline-block rounded-full bg-tinta-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-texto-2 uppercase tracking-wide mb-2">
                  {d.destaque}
                </span>

                <h3 className="titulo text-lg font-bold text-texto leading-snug mb-2">
                  {d.titulo}
                </h3>
                <p className="text-xs text-texto-2 leading-relaxed mb-4">
                  {d.descricao}
                </p>
              </div>

              <ul className="space-y-1.5 border-t border-borda pt-3.5">
                {d.vantagens.map((v) => (
                  <li key={v} className="flex items-center gap-2 text-xs font-medium text-texto">
                    <CheckCircle2 size={13} className="text-marca-700 shrink-0" />
                    <span className="line-clamp-1">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------ ambientes em destaque */

function AmbientesEmDestaque() {
  const categorias = useCategorias();
  const todos = categorias.data ?? [];

  const lista = AMBIENTES.map((a) => {
    const doAmbiente = todos.filter((c) => c.ambiente === a.slug);
    return {
      ...a,
      total: doAmbiente.length,
      capa: doAmbiente.find((c) => c.imagem_url)?.imagem_url ?? null,
    };
  }).filter((a) => a.total > 0 || a.capa);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-marca-800">
            Navegue por Ambientes
          </span>
          <h2 className="titulo text-3xl text-texto sm:text-4xl mt-0.5">Cômodo por cômodo</h2>
          <p className="mt-1 text-sm text-texto-2">Encontre móveis planejados para cada espaço do seu lar</p>
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
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-tinta-900 shadow-carta transition-all duration-300 hover:shadow-flutuante"
                >
                  <img
                    src={a.capa ?? "/logo.png"}
                    alt={a.nome}
                    width={480}
                    height={360}
                    loading="lazy"
                    className="size-full object-cover opacity-90 transition-transform duration-700 ease-saida group-hover:scale-105 motion-reduce:transform-none"
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

/* ----------------------------- depoimentos de clientes reais ------------- */

const DEPOIMENTOS_REAIS = [
  {
    id: 1,
    nome: "Juliana P. Albuquerque",
    iniciais: "JA",
    cidade: "Brasília - DF · Águas Claras",
    compra: "Sala de Estar: Sofá Retrátil 2.60m Bouclé + Rack Ripado 2.20m com LED",
    pagamento: "Boleto Parcelado em 18x",
    estrelas: 5,
    tempo: "Avaliado há 3 dias",
    texto:
      "Estava reformando meu apartamento e não tinha limite no cartão para comprar tudo à vista. No WhatsApp enviei meus documentos às 14h e às 15h30 o crediário já estava aprovado! O sofá é super macio e a madeira do rack é 100% MDF pesado de showroom, nada daquela madeira oca de loja comum. Entrega pontual e atendimento impecável!",
  },
  {
    id: 2,
    nome: "Rodrigo M. Silveira",
    iniciais: "RS",
    cidade: "Goiânia - GO · Setor Bueno",
    compra: "Quarto de Casal: Guarda-Roupa 6 Portas Espelhado + Cama Box Queen",
    pagamento: "Nota Promissória em 12x fixas",
    estrelas: 5,
    tempo: "Avaliado há 1 semana",
    texto:
      "Comprar na promissória própria sem depender de banco foi a melhor escolha que fiz. As parcelas são fixas exatamente como combinado no fechamento. O guarda-roupa tem gavetas com corrediças telescópicas bem macias e os espelhos chegaram sem nenhum risco. O próprio montador elogiou muito a estrutura!",
  },
  {
    id: 3,
    nome: "Camila & Fernando Dias",
    iniciais: "CF",
    cidade: "Anápolis - GO · Jundiaí",
    compra: "Cozinha Modulada Gourmet 6 Peças 100% MDF com Torre Quente",
    pagamento: "Crediário Próprio em 24x",
    estrelas: 5,
    tempo: "Avaliado há 2 semanas",
    texto:
      "Cozinha planejada convencional em marcenaria estava dando três vezes o valor. A modulada do Empório dos Móveis ficou idêntica no acabamento e na firmeza! Suportou bancada de granito pesada sem empenar nada e o parcelamento no carnê coube com folga no orçamento da família.",
  },
  {
    id: 4,
    nome: "Marcelo T. Fonseca",
    iniciais: "MF",
    cidade: "Rio Verde - GO · Centro",
    compra: "Sala de Jantar 6 Lugares: Mesa Tampo Chanfrado Vidro + Cadeiras Veludo",
    pagamento: "Boleto Bancário em 12x",
    estrelas: 5,
    tempo: "Avaliado há 3 semanas",
    texto:
      "Tinha receio de comprar móveis grandes pela internet, mas as medidas no site são rigorosamente exatas. Coube perfeitamente na sala de jantar. As cadeiras têm espuma densa que não afunda e o tampo de vidro biselado é um espetáculo. O time de pós-venda acompanhou a entrega até a porta.",
  },
  {
    id: 5,
    nome: "Patrícia Rezende",
    iniciais: "PR",
    cidade: "Aparecida de Goiânia - GO · Nova Brasília",
    compra: "Home Office: Escrivaninha em L com Gaveteiro + Estante 5 Nichos",
    pagamento: "Boleto Parcelado em 10x",
    estrelas: 5,
    tempo: "Avaliado há 1 mês",
    texto:
      "Trabalho remoto todos os dias e precisava de uma mesa firme que não ficasse balançando com monitor duplo e impressora. A qualidade me surpreendeu demais. Aprovaram o cadastro em menos de meia hora com foto da CNH. Chegou dias antes do prazo previsto!",
  },
  {
    id: 6,
    nome: "Dra. Vanessa Cavalcante",
    iniciais: "VC",
    cidade: "Caldas Novas - GO · Itanhangá",
    compra: "Recepção & Living: Sofá 3 Lugares Linho Nobre + Buffet Ripado 4 Portas",
    pagamento: "Promissória Própria em 18x",
    estrelas: 5,
    tempo: "Avaliado há 1 mês",
    texto:
      "Mobiliário de clínica exige elegância e durabilidade. Comprei a recepção inteira na promissória própria da loja. O linho do sofá é refinado, fácil de limpar e o buffet ripado virou o cartão de visitas do meu consultório. Transparência admirável do início ao fim.",
  },
];

function DepoimentosClientes() {
  return (
    <section
      aria-labelledby="titulo-depoimentos"
      className="relative overflow-hidden py-14 lg:py-20"
    >
      {/* Cabeçalho de autoridade e satisfação */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 px-4 lg:px-6">
        <span className="animar-flutuar inline-flex items-center gap-2 rounded-full bg-marca-500/15 border border-marca-500/35 px-4 py-1 text-2xs font-extrabold uppercase tracking-wider text-marca-900 mb-3 animar-pulso-brilho">
          <Star className="size-3.5 fill-marca-500 text-marca-500" />
          Depoimentos 100% Reais
        </span>

        <h2 id="titulo-depoimentos" className="titulo text-3xl sm:text-4xl lg:text-5xl text-texto">
          Quem comprou no crediário recomenda
        </h2>

        <p className="mt-3 text-sm sm:text-base text-texto-2 leading-relaxed max-w-2xl">
          Mais de <strong>1.480 famílias e empresas</strong> já mobiliaram seus espaços com nosso crediário próprio no boleto e na nota promissória. Veja histórias reais:
        </p>
      </div>

      {/* Carrossel Infinito Auto-Movível (Marquee Contínuo e Fluido) */}
      <div className="relative animar-marquee-container overflow-hidden w-full py-3">
        {/* Máscaras de gradiente nas bordas da tela para acabamento suave */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-28 bg-gradient-to-r from-fundo via-fundo/70 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-28 bg-gradient-to-l from-fundo via-fundo/70 to-transparent z-10" />

        <div className="flex gap-6 w-max">
          {/* Grupo 1 */}
          <div className="animar-marquee-grupo">
            {DEPOIMENTOS_REAIS.map((d) => (
              <CartaoDepoimento key={`g1-${d.id}`} d={d} />
            ))}
          </div>

          {/* Grupo 2 (duplicado para loop infinito 100% contínuo) */}
          <div className="animar-marquee-grupo" aria-hidden="true">
            {DEPOIMENTOS_REAIS.map((d) => (
              <CartaoDepoimento key={`g2-${d.id}`} d={d} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CartaoDepoimento({ d }: { d: (typeof DEPOIMENTOS_REAIS)[number] }) {
  return (
    <div className="card-animado flex flex-col justify-between rounded-3xl border border-borda bg-superficie p-6 sm:p-7 shadow-carta shrink-0 w-[84vw] sm:w-[22rem] lg:w-[24.5rem] transition-all duration-300 hover:border-marca-500 hover:shadow-elevado hover:-translate-y-1.5 select-none">
      <div>
        {/* Topo do Card: Estrelas e Tempo */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1 text-marca-500">
            {Array.from({ length: d.estrelas }, (_, i) => (
              <Star key={i} className="size-4 fill-marca-500 text-marca-500" />
            ))}
          </div>
          <span className="text-[0.68rem] text-texto-3 font-medium">
            {d.tempo}
          </span>
        </div>

        {/* Badge do Produto Adquirido */}
        <div className="mb-3.5 rounded-xl bg-marca-50/70 border border-marca-200/80 px-3 py-1.5 text-[0.72rem] font-bold text-marca-950 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-marca-600 shrink-0" />
          <span className="line-clamp-1">{d.compra}</span>
        </div>

        {/* Texto do Depoimento com Aspas */}
        <div className="relative">
          <Quote className="size-6 text-marca-500/30 absolute -top-1 -left-1 -z-0 rotate-180" />
          <p className="relative z-10 text-xs sm:text-sm leading-relaxed text-texto italic pl-3.5 border-l-2 border-marca-500/40">
            "{d.texto}"
          </p>
        </div>
      </div>

      {/* Rodapé do Card: Avatar, Nome, Local e Condição */}
      <div className="mt-5 border-t border-borda pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-marca-500 to-marca-400 text-tinta-950 font-black text-xs shadow-sm ring-2 ring-marca-500/30">
            {d.iniciais}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-texto truncate">{d.nome}</p>
            <p className="text-[0.68rem] text-texto-3 truncate">{d.cidade}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block text-[0.62rem] font-extrabold text-sucesso bg-sucesso/10 border border-sucesso/25 rounded-md px-2 py-0.5">
            ✓ Verificado
          </span>
          <p className="text-[0.62rem] text-texto-3 mt-0.5">{d.pagamento}</p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- faq crediário ----------------------------- */

function FaqCrediario({ whatsapp }: { whatsapp: string }) {
  const linkZap = linkWhatsApp(whatsapp, "Olá! Tenho uma dúvida sobre as condições do boleto e promissória.");
  const perguntas = [
    {
      q: "Preciso ter limite no cartão de crédito para comprar no boleto ou promissória?",
      a: "Não! Esse é o grande diferencial do nosso crediário próprio: você não precisa de cartão de crédito e não compromete o limite do seu banco. O parcelamento é feito diretamente com a gente no boleto ou na nota promissória.",
    },
    {
      q: "Como funciona a aprovação do cadastro?",
      a: "O processo é 100% digital e rápido. Basta escolher os móveis no site, montar a sua lista e enviar para o nosso time de atendimento. Solicitamos documento oficial com foto e comprovante de endereço. A análise é simplificada.",
    },
    {
      q: "Os móveis são de qualidade superior mesmo?",
      a: "Sim. Trabalhamos exclusivamente com linhas selecionadas dos maiores polos fabris do Brasil, com chapas de 100% MDF/MDP de alta densidade, ferragens reforçadas (como corrediças telescópicas) e espumas seladas de alta resiliência (D28 e D33).",
    },
    {
      q: "Posso mobiliar a casa inteira em um único pedido?",
      a: "Com certeza. Você pode selecionar itens para sala, quarto, cozinha e escritório e juntar tudo em uma única proposta de crediário, facilitando o pagamento com parcelas que cabem no seu orçamento.",
    },
  ];

  return (
    <section aria-labelledby="titulo-faq-home" className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
      <div className="text-center mb-8">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-marca-800">
          Tire Suas Dúvidas
        </span>
        <h2 id="titulo-faq-home" className="titulo text-3xl sm:text-4xl text-texto mt-1">
          Perguntas Frequentes sobre o Crediário
        </h2>
      </div>

      <div className="grid gap-3">
        {perguntas.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-borda bg-superficie px-5 py-2 open:shadow-carta transition-all"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-bold text-sm sm:text-base text-texto [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="text-xl leading-none text-texto-3 transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-xs sm:text-sm leading-relaxed text-texto-2 border-t border-borda/60 pt-3 mt-1">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      {whatsapp ? (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-borda bg-superficie p-6 shadow-carta">
          <div>
            <p className="font-bold text-texto text-base">Ficou com alguma dúvida específica?</p>
            <p className="text-xs text-texto-2 mt-0.5">Nosso time responde na hora no WhatsApp e simula suas parcelas.</p>
          </div>
          <a
            href={linkZap}
            target="_blank"
            rel="noreferrer noopener"
            className={classesBotao({ aparencia: "zap", tamanho: "md", className: "shrink-0 font-bold" })}
          >
            <IconeWhatsApp className="size-4 text-white" />
            Tirar Dúvida no WhatsApp
          </a>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------- institucional */

function FaixaInstitucional() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <div className="grid items-center gap-8 rounded-[2.5rem] border border-borda bg-superficie p-6 shadow-carta lg:grid-cols-2 lg:p-12">
        <div className="grid gap-4">
          <span className="w-fit rounded-full bg-tinta-950 px-3.5 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-marca-500">
            Autoridade em Móveis
          </span>
          <h2 className="titulo text-3xl text-texto sm:text-4xl">
            A grande referência em móveis de alto padrão com crediário próprio
          </h2>
          <p className="text-sm leading-relaxed text-texto-2 sm:text-base">
            O Empório dos Móveis combina a excelência construtiva dos maiores polos fabris do Brasil
            com a maior facilidade de pagamento do mercado. Nosso catálogo completo oferece peças sofisticadas,
            durabilidade certificada e a liberdade de você parcelar no boleto bancário ou na nota promissória sem depender de limite bancário.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link to="/catalogo" className={classesBotao({ aparencia: "solido", tamanho: "lg" })}>
              Explorar todo o catálogo
            </Link>
            <Link to="/promissoria" className={classesBotao({ aparencia: "contorno", tamanho: "lg" })}>
              Condições da promissória
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { numero: "300+", texto: "móveis e modelos no catálogo" },
            { numero: "21", texto: "linhas para toda a casa" },
            { numero: "100%", texto: "crediário próprio facilitado" },
            { numero: "2026", texto: "coleção com garantia oficial" },
          ].map((item) => (
            <div
              key={item.texto}
              className="grid content-center gap-1.5 rounded-3xl bg-tinta-50 p-4 sm:p-5 text-center border border-borda/60"
            >
              <dt className="order-2 text-2xs leading-tight text-texto-2 font-medium">{item.texto}</dt>
              <dd className="titulo order-1 text-3xl text-texto font-black">{item.numero}</dd>
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
        <span className="mx-auto w-fit rounded-full border border-marca-500/40 bg-marca-500/10 px-3.5 py-1 text-2xs font-bold uppercase tracking-wider text-marca-400">
          Atendimento Personalizado
        </span>
        <h2 className="titulo text-3xl sm:text-4xl">
          Mobiliar a sua casa nunca foi tão fácil e acessível.
        </h2>
        <p className="text-sm sm:text-base text-tinta-300 max-w-xl mx-auto leading-relaxed">
          Monte sua lista com os móveis que você deseja e receba em poucos minutos uma simulação personalizada com parcelas que cabem no seu bolso no boleto ou na promissória.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Link to="/catalogo" className={classesBotao({ aparencia: "marca", tamanho: "lg" })}>
            Montar minha lista
          </Link>
          {whatsapp ? (
            <a
              href={linkWhatsApp(whatsapp, "Olá! Vim pelo site do Empório dos Móveis e quero falar com nosso time.")}
              target="_blank"
              rel="noreferrer noopener"
              className={classesBotao({ aparencia: "zap", tamanho: "lg" })}
            >
              <IconeWhatsApp className="size-4.5 text-white" />
              Falar com nosso time
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
