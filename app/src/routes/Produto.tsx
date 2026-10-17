import {
  BadgeCheck,
  ClipboardList,
  FileSignature,
  Info,
  MessageCircle,
  Package,
  Ruler,
  Share2,
  ShieldCheck,
  Truck,
  Weight,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useProduto, useRelacionados } from "@/features/catalogo/api";
import { CartaoProduto } from "@/features/catalogo/CartaoProduto";
import { DiagramaMedidas } from "@/features/catalogo/DiagramaMedidas";
import { Galeria } from "@/features/catalogo/Galeria";
import { BotaoFavorito } from "@/features/favoritos/BotaoFavorito";
import { useVistos } from "@/features/favoritos/store";
import { VistosRecentemente } from "@/features/favoritos/VistosRecentemente";
import { useOrcamento } from "@/features/orcamento/store";
import { SimuladorPromissoria } from "@/features/promissoria/SimuladorPromissoria";
import {
  Botao,
  classesBotao,
  Esqueleto,
  EstadoVazio,
  Selo,
} from "@/shared/components/ui";
import { Foto } from "@/shared/components/Foto";
import type { ProdutoCompleto } from "@/shared/lib/esquemas";
import { trilhaEstruturada, useSeo, type DadosSeo } from "@/shared/lib/seo";
import {
  linkWhatsApp,
  mensagemDeProduto,
  useConfigSite,
} from "@/shared/lib/site";
import { cn, dimensoesEmTexto, medida } from "@/shared/lib/utils";

export default function Produto() {
  const { slug } = useParams<{ slug: string }>();
  const [parametros] = useSearchParams();
  const corDaUrl = parametros.get("cor");
  const consulta = useProduto(slug);
  const registrarVisto = useVistos((e) => e.registrar);
  const config = useConfigSite();
  const adicionar = useOrcamento((e) => e.adicionar);

  const [indiceFoto, setIndiceFoto] = useState(0);
  const [corEscolhida, setCorEscolhida] = useState<string | null>(corDaUrl);
  const [slugAnterior, setSlugAnterior] = useState(slug);
  // A cor que veio do cartão abre a foto dela assim que o móvel carregar.
  const [corDaUrlAplicada, setCorDaUrlAplicada] = useState(false);

  const produto = consulta.data;

  // Trocar de móvel zera a galeria e a cor. Isso acontece durante o render,
  // não num efeito: assim a tela nunca chega a pintar o estado do móvel velho.
  if (slug !== slugAnterior) {
    setSlugAnterior(slug);
    setIndiceFoto(0);
    setCorEscolhida(corDaUrl);
    setCorDaUrlAplicada(false);
  }

  const fotos = useMemo(() => produto?.produto_imagens ?? [], [produto]);
  const cores = useMemo(() => produto?.produto_cores ?? [], [produto]);

  /** Acabamento que a foto em exibição mostra, se o catálogo disser. */
  const corDaFoto = useCallback(
    (indice: number): string | null => {
      const url = fotos[indice]?.url;
      if (!url) return null;
      return cores.find((c) => c.imagem_url === url)?.nome ?? null;
    },
    [fotos, cores],
  );

  // Foto e acabamento andam juntos, nos dois sentidos:
  // escolher a cor mostra a foto dela; passar para outra foto marca a cor dela.
  function mudarFoto(indice: number) {
    setIndiceFoto(indice);
    const ligada = corDaFoto(indice);
    if (ligada) setCorEscolhida(ligada);
  }

  function escolherCor(nome: string, imagemUrl: string | null) {
    setCorEscolhida(nome);
    if (!imagemUrl) return;
    const alvo = fotos.findIndex((f) => f.url === imagemUrl);
    if (alvo >= 0) setIndiceFoto(alvo);
  }

  if (produto && !corDaUrlAplicada) {
    setCorDaUrlAplicada(true);
    const alvo = corDaUrl ? cores.find((c) => c.nome === corDaUrl)?.imagem_url : null;
    const indice = alvo ? fotos.findIndex((f) => f.url === alvo) : -1;
    if (indice >= 0) setIndiceFoto(indice);
  }

  // Histórico local de móveis vistos: sincroniza com o armazenamento do aparelho.
  useEffect(() => {
    if (!produto) return;
    registrarVisto({
      id: produto.id,
      slug: produto.slug,
      nome: produto.nome,
      imagem_url: produto.produto_imagens[0]?.url ?? null,
      categoria_nome: produto.categorias?.nome ?? null,
    });
  }, [produto, registrarVisto]);

  useSeo(produto ? seoDoProduto(produto) : null);

  const relacionados = useRelacionados(
    produto?.categorias?.slug ?? null,
    produto?.slug ?? "",
  );

  if (consulta.isPending) return <EsqueletoProduto />;

  if (consulta.isError || !produto) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EstadoVazio
          titulo="Móvel não encontrado"
          descricao="Ele pode ter saído de linha ou o endereço está errado."
          acao={
            <Link to="/catalogo" className={classesBotao({ aparencia: "marca" })}>
              Ver o catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const fotoAtual = fotos[Math.min(indiceFoto, Math.max(0, fotos.length - 1))];
  // Sem escolha explícita, vale o acabamento da foto que está na tela.
  const corAtiva = corEscolhida ?? corDaFoto(indiceFoto);
  const medidas = dimensoesEmTexto(produto);
  const codigo = produto.codigos[0] ?? null;

  const dadosDaMensagem = {
    nome: produto.nome,
    slug: produto.slug,
    codigos: produto.codigos,
    cor: corAtiva,
  };
  const linkCondicao = linkWhatsApp(config.whatsapp, mensagemDeProduto(dadosDaMensagem));
  const linkPromissoria = linkWhatsApp(
    config.whatsapp,
    mensagemDeProduto({ ...dadosDaMensagem, intencao: "promissoria" }),
  );

  // Compartilhar com quem divide a decisão: abre a folha nativa do celular
  // (WhatsApp, Instagram…); no computador, copia o link.
  async function compartilhar() {
    if (!produto) return;
    const url = `${window.location.origin}/produto/${produto.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: produto.nome, text: `Olha este móvel: ${produto.nome}`, url });
      } catch {
        // a pessoa fechou a janela: nada a fazer
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado", { description: "Cole no WhatsApp para enviar." });
    } catch {
      toast("Copie o endereço da barra do navegador para compartilhar.");
    }
  }

  function incluirNaLista() {
    if (!produto) return;
    adicionar({
      produto_id: produto.id,
      slug: produto.slug,
      nome: produto.nome,
      cor: corAtiva,
      imagem_url: fotoAtual?.url ?? null,
      codigo,
    });
    // A gaveta abre com o item recém-incluído: ela já é a confirmação.
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">
      <nav aria-label="Você está em" className="mb-4 text-xs text-texto-2">
        <Link to="/" className="hover:underline">
          Início
        </Link>
        <span aria-hidden> › </span>
        <Link to="/catalogo" className="hover:underline">
          Catálogo
        </Link>
        {produto.categorias ? (
          <>
            <span aria-hidden> › </span>
            <Link
              to={`/catalogo?categoria=${produto.categorias.slug}`}
              className="hover:underline"
            >
              {produto.categorias.nome}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <Galeria
          key={produto.id}
          fotos={fotos}
          nome={produto.nome}
          indice={indiceFoto}
          aoMudar={mudarFoto}
          legenda={corDaFoto(indiceFoto)}
        />

        {/* ------------------------------------------------ informações */}
        <div className="grid content-start gap-6">
          <header className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {produto.categorias ? (
                <Link
                  to={`/catalogo?categoria=${produto.categorias.slug}`}
                  className="text-2xs font-semibold uppercase tracking-[0.14em] text-marca-800 hover:underline"
                >
                  {produto.categorias.nome}
                </Link>
              ) : null}
              {produto.em_oferta || produto.selo ? (
                <Selo tom={produto.em_oferta ? "oferta" : "marca"}>
                  {produto.selo ?? "Oferta"}
                </Selo>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="titulo polegadas text-[1.75rem] text-texto sm:text-4xl">
                {produto.nome}
              </h1>
              <div className="flex shrink-0 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => void compartilhar()}
                  aria-label="Compartilhar este móvel"
                  title="Compartilhar"
                  className="grid size-11 place-items-center rounded-xl border border-borda-forte bg-superficie text-texto-2 transition-colors hover:bg-tinta-50 hover:text-texto"
                >
                  <Share2 aria-hidden className="size-5" />
                </button>
                <BotaoFavorito
                  estilo="contorno"
                  movel={{
                    id: produto.id,
                    slug: produto.slug,
                    nome: produto.nome,
                    imagem_url: produto.produto_imagens[0]?.url ?? null,
                    categoria_nome: produto.categorias?.nome ?? null,
                  }}
                />
              </div>
            </div>
            {medidas ? <p className="text-sm text-texto-2">{medidas}</p> : null}
          </header>

          {/* Acabamentos: cada um mostra a própria foto e troca a galeria. */}
          {cores.length > 0 ? (
            <fieldset className="grid gap-2.5">
              <legend className="mb-2.5 text-sm text-texto-2">
                Acabamento:{" "}
                <span className="font-semibold text-texto">
                  {corAtiva ?? "escolha uma opção"}
                </span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {cores.map((cor) => {
                  const ativa = corAtiva === cor.nome;
                  return (
                    <button
                      key={cor.id}
                      type="button"
                      onClick={() => escolherCor(cor.nome, cor.imagem_url)}
                      aria-pressed={ativa}
                      title={cor.nome}
                      className={cn(
                        "group grid w-[5.25rem] gap-1.5 rounded-2xl border-2 p-1.5 text-center transition-[border-color,box-shadow] duration-150",
                        ativa
                          ? "border-tinta-950 shadow-erguido"
                          : "border-borda hover:border-borda-forte",
                      )}
                    >
                      <span className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-tinta-0">
                        {cor.imagem_url ? (
                          <Foto
                            src={cor.imagem_url}
                            alt=""
                            width={72}
                            height={72}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-contain p-0.5"
                          />
                        ) : (
                          <span className="px-1 text-2xs leading-tight text-texto-3">
                            sem foto
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-2 text-2xs leading-tight",
                          ativa ? "font-semibold text-texto" : "text-texto-2",
                        )}
                      >
                        {cor.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {/* ------------------------------------------- bloco de compra */}
          <section
            aria-label="Como comprar"
            className="grid gap-4 rounded-3xl border border-borda bg-superficie p-5 shadow-erguido"
          >
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-marca-800">
                Condição sob medida
              </p>
              <p className="titulo mt-1 text-2xl text-texto">
                Receba a sua condição para este móvel
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-texto-2">
                Nosso time responde com o valor, as formas de pagamento e a
                disponibilidade{corAtiva ? ` no acabamento ${corAtiva}` : ""}.
              </p>
            </div>

            <div className="grid gap-2">
              {config.promissoria_ativa && config.whatsapp ? (
                <a
                  href={linkPromissoria}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={classesBotao({
                    aparencia: "marca",
                    tamanho: "lg",
                    blocao: true,
                    className: "font-bold shadow-carta py-3.5",
                  })}
                >
                  <FileSignature aria-hidden className="size-5" />
                  Comprar na Promissória (WhatsApp)
                </a>
              ) : null}
              {config.whatsapp ? (
                <a
                  href={linkCondicao}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={classesBotao({
                    aparencia: "zap",
                    tamanho: "lg",
                    blocao: true,
                    className: "font-semibold py-3",
                  })}
                >
                  <MessageCircle aria-hidden className="size-5" />
                  Solicitar Condição Geral / À Vista
                </a>
              ) : null}
              <Botao aparencia="contorno" tamanho="lg" blocao onClick={incluirNaLista}>
                <ClipboardList aria-hidden className="size-4" />
                Adicionar à minha lista
              </Botao>
            </div>

            {config.promissoria_ativa ? (
              <div className="grid gap-2 rounded-2xl bg-marca-50 p-4 ring-1 ring-marca-200">
                <p className="flex items-center gap-2 font-semibold text-texto">
                  <FileSignature aria-hidden className="size-5 shrink-0 text-marca-800" />
                  {config.promissoria_titulo}
                </p>
                <p className="text-sm leading-relaxed text-texto-2">
                  {config.promissoria_texto}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {config.whatsapp ? (
                    <a
                      href={linkPromissoria}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-tinta-950 underline decoration-marca-500 decoration-2 underline-offset-4 hover:decoration-tinta-950"
                    >
                      Quero comprar na promissória
                    </a>
                  ) : null}
                  <Link
                    to="/promissoria"
                    className="inline-flex min-h-11 items-center text-sm text-texto-2 underline underline-offset-4 hover:text-texto"
                  >
                    Como funciona
                  </Link>
                </div>
              </div>
            ) : null}

            <ul className="grid gap-2 border-t border-borda pt-4 text-sm text-texto-2">
              <li className="flex items-start gap-2">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-sucesso" />
                Atendimento direto com a loja, do pedido à entrega
              </li>
              <li className="flex items-start gap-2">
                <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-sucesso" />
                Fotos e medidas do catálogo oficial do fabricante
              </li>
              <li className="flex items-start gap-2">
                <Truck aria-hidden className="mt-0.5 size-4 shrink-0 text-sucesso" />
                Entrega e montagem combinadas no fechamento
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* ------------------------------------------------ detalhes */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <section className="grid content-start gap-4 rounded-3xl border border-borda bg-superficie p-5 lg:p-7">
          <h2 className="titulo text-2xl text-texto">Sobre este móvel</h2>
          {produto.descricao ? (
            <p className="text-sm leading-relaxed text-texto-2">{produto.descricao}</p>
          ) : null}

          {produto.especificacoes.length > 0 ? (
            <ul className="grid gap-2.5">
              {produto.especificacoes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-texto">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-marca-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {produto.observacoes.length > 0 ? (
            <ul className="grid gap-1.5 rounded-2xl bg-marca-50 p-3">
              {produto.observacoes.map((obs) => (
                <li key={obs} className="flex items-start gap-2 text-sm font-medium text-marca-900">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {obs}
                </li>
              ))}
            </ul>
          ) : null}

          {codigo ? (
            <p className="border-t border-borda pt-3 text-xs text-texto-3">
              Referência do fabricante: {produto.codigos.join(" · ")}
            </p>
          ) : null}
        </section>

        <section className="grid content-start gap-5 rounded-3xl border border-borda bg-superficie p-5 lg:p-7">
          <h2 className="titulo text-2xl text-texto">Medidas</h2>

          <DiagramaMedidas
            altura={produto.altura_cm}
            largura={produto.largura_cm}
            profundidade={produto.profundidade_cm}
          />

          <dl className="grid grid-cols-3 gap-2">
            <Cota rotulo="Altura" valor={medida(produto.altura_cm)} />
            <Cota rotulo="Largura" valor={medida(produto.largura_cm)} />
            <Cota rotulo="Profundidade" valor={medida(produto.profundidade_cm)} />
          </dl>

          {produto.medidas_texto.length > 1 ? (
            <div className="grid gap-1 border-t border-borda pt-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-texto">
                <Ruler aria-hidden className="size-4 text-texto-3" />
                Medidas por peça
              </h3>
              <ul className="grid gap-1">
                {produto.medidas_texto.map((m) => (
                  <li key={m} className="text-sm text-texto-2">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {produto.peso_kg || produto.volumes ? (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-borda pt-4 text-sm">
              {produto.peso_kg ? (
                <div className="flex items-center gap-2">
                  <Weight aria-hidden className="size-4 text-texto-3" />
                  <dt className="text-texto-2">Peso</dt>
                  <dd className="font-semibold text-texto">
                    {String(produto.peso_kg).replace(".", ",")} kg
                  </dd>
                </div>
              ) : null}
              {produto.volumes ? (
                <div className="flex items-center gap-2">
                  <Package aria-hidden className="size-4 text-texto-3" />
                  <dt className="text-texto-2">Embalagem</dt>
                  <dd className="font-semibold text-texto">
                    {produto.volumes} {produto.volumes === 1 ? "volume" : "volumes"}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </section>
      </div>

      {/* Simulador de Promissória exclusivo para este móvel */}
      {config.promissoria_ativa ? (
        <section aria-label="Simular na Promissória" className="mt-12">
          <SimuladorPromissoria nomeProduto={produto.nome} />
        </section>
      ) : null}

      {relacionados.data && relacionados.data.length > 0 ? (
        <section className="mt-14">
          <h2 className="titulo mb-4 text-2xl text-texto">Combine com este móvel</h2>
          <div className="trilho-x flex gap-3 pb-2">
            {relacionados.data.map((p) => (
              <CartaoProduto key={p.id} produto={p} compacto />
            ))}
          </div>
        </section>
      ) : null}

      <div className="-mx-4 lg:-mx-6">
        <VistosRecentemente excluir={produto.id} titulo="Você também viu" />
      </div>

      {/* No celular os botões de ação ficam acessíveis ao polegar, logo acima da navegação */}
      <div
        className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-2 border-t border-borda/80 bg-superficie/95 p-3 shadow-suspenso backdrop-blur-md lg:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Botao
          aparencia="contorno"
          onClick={incluirNaLista}
          aria-label="Adicionar à minha lista"
          className="shrink-0 size-11 p-0 grid place-items-center rounded-xl"
        >
          <ClipboardList aria-hidden className="size-5" />
        </Botao>
        {config.whatsapp ? (
          <a
            href={linkPromissoria}
            target="_blank"
            rel="noreferrer noopener"
            className={classesBotao({
              aparencia: "zap",
              blocao: true,
              className: "flex-1 justify-center text-center font-bold text-xs sm:text-sm py-2.5",
            })}
          >
            <MessageCircle aria-hidden className="size-4.5" />
            Quero na Promissória
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Mesma geometria da página pronta: nada pula quando o móvel chega. */
function EsqueletoProduto() {
  return (
    <div role="status" aria-label="Carregando o móvel" className="mx-auto min-h-dvh max-w-7xl px-4 pt-5 lg:px-6">
      <Esqueleto className="mb-4 h-3 w-48" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div className="grid gap-3 lg:grid-cols-[4.75rem_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 lg:order-1 lg:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Esqueleto key={i} className="size-16 rounded-xl lg:size-[4.75rem]" />
            ))}
          </div>
          <Esqueleto className="order-1 aspect-square rounded-3xl sm:aspect-[4/3] lg:order-2" />
        </div>
        <div className="grid content-start gap-4">
          <Esqueleto className="h-3 w-24" />
          <Esqueleto className="h-9 w-4/5" />
          <Esqueleto className="h-4 w-3/5" />
          <div className="flex gap-2.5">
            {Array.from({ length: 3 }, (_, i) => (
              <Esqueleto key={i} className="h-28 w-[5.25rem] rounded-2xl" />
            ))}
          </div>
          <Esqueleto className="h-72 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

function Cota({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="grid gap-0.5 rounded-2xl bg-tinta-50 px-3 py-3 text-center">
      <dt className="text-2xs font-medium uppercase tracking-wide text-texto-3">{rotulo}</dt>
      <dd className="text-base font-semibold tabular-nums text-texto">{valor ?? "—"}</dd>
    </div>
  );
}

/** Título, descrição e dados estruturados que o Google lê desta página. */
function seoDoProduto(produto: ProdutoCompleto): DadosSeo {
  const categoria = produto.categorias?.nome ?? "Móveis";
  const medidas = dimensoesEmTexto(produto);
  const acabamentos = produto.produto_cores.map((c) => c.nome);
  const descricao = [
    `${produto.nome}${medidas ? ` (${medidas})` : ""}.`,
    acabamentos.length > 1 ? `${acabamentos.length} acabamentos.` : null,
    "Compre na promissória ou consulte a sua condição direto com a loja.",
  ]
    .filter(Boolean)
    .join(" ");

  const emCm = (valor: number | null) =>
    valor ? { "@type": "QuantitativeValue", value: valor, unitCode: "CMT" } : undefined;

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Catálogo", caminho: "/catalogo" },
    ...(produto.categorias
      ? [
          {
            nome: produto.categorias.nome,
            caminho: `/catalogo?categoria=${produto.categorias.slug}`,
          },
        ]
      : []),
    { nome: produto.nome, caminho: `/produto/${produto.slug}` },
  ];

  return {
    titulo: produto.nome,
    descricao,
    imagem: produto.produto_imagens[0]?.url,
    tipo: "product",
    dadosEstruturados: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: produto.nome,
        description: produto.descricao ?? descricao,
        image: produto.produto_imagens.map((i) => i.url),
        category: categoria,
        sku: produto.codigos[0],
        color: acabamentos.length > 0 ? acabamentos.join(", ") : undefined,
        height: emCm(produto.altura_cm),
        width: emCm(produto.largura_cm),
        depth: emCm(produto.profundidade_cm),
        weight: produto.peso_kg
          ? { "@type": "QuantitativeValue", value: produto.peso_kg, unitCode: "KGM" }
          : undefined,
      },
      trilhaEstruturada(trilha),
    ],
  };
}
