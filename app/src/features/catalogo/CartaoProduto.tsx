import { Palette, Plus } from "lucide-react";
import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { BotaoFavorito } from "@/features/favoritos/BotaoFavorito";
import { useOrcamento } from "@/features/orcamento/store";
import { Foto } from "@/shared/components/Foto";
import { Esqueleto, Selo } from "@/shared/components/ui";
import type { ProdutoCartao } from "@/shared/lib/esquemas";
import { cn, dimensoesEmTexto } from "@/shared/lib/utils";

interface Props {
  produto: ProdutoCartao;
  /** Card estreito para as prateleiras horizontais da home. */
  compacto?: boolean;
  /** A primeira dobra carrega imediato; o resto entra preguiçoso. */
  prioridade?: boolean;
}

/**
 * Cartão de móvel.
 *
 * O link ocupa o cartão inteiro por uma camada invisível; botões (favorito,
 * amostras de acabamento, lista) ficam por cima dela. Assim nenhum botão fica
 * dentro de um <a>, que é HTML inválido e confunde leitor de tela.
 */
export const CartaoProduto = memo(function CartaoProduto({
  produto,
  compacto = false,
  prioridade = false,
}: Props) {
  const adicionar = useOrcamento((e) => e.adicionar);
  const abrirLista = useOrcamento((e) => e.abrir);
  const medidas = dimensoesEmTexto(produto);

  // A foto do cartão: a de capa, a do acabamento em foco, ou a segunda foto
  // enquanto o mouse está sobre a imagem.
  const [fotoEmFoco, setFotoEmFoco] = useState<string | null>(null);
  const [corEmFoco, setCorEmFoco] = useState<string | null>(null);
  const foto = fotoEmFoco ?? produto.imagem_url;
  const amostras = produto.cores_previa;
  const restantes = Math.max(0, produto.total_cores - amostras.length);

  function focarCor(nome: string, url: string) {
    setFotoEmFoco(url);
    setCorEmFoco(nome);
  }

  function incluirNaLista() {
    adicionar(
      {
        produto_id: produto.id,
        slug: produto.slug,
        nome: produto.nome,
        cor: corEmFoco,
        imagem_url: foto,
        codigo: null,
      },
      { abrir: false },
    );
    toast.success("Adicionado à sua lista", {
      description: corEmFoco ? `${produto.nome} · ${corEmFoco}` : produto.nome,
      action: { label: "Ver lista", onClick: abrirLista },
    });
  }

  // Quem escolheu um acabamento no cartão chega na página já com ele marcado.
  const destino = corEmFoco
    ? `/produto/${produto.slug}?cor=${encodeURIComponent(corEmFoco)}`
    : `/produto/${produto.slug}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-borda bg-superficie",
        "shadow-carta transition-shadow duration-200 ease-saida hover:shadow-flutuante",
        compacto ? "w-[11.5rem] shrink-0 sm:w-[13.5rem]" : "w-full",
      )}
    >
      <Link to={destino} className="flex flex-col focus-visible:outline-none">
        <span className="absolute inset-0 z-0 rounded-3xl group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-tinta-950" aria-hidden />

        <div
          className="moldura-foto relative border-b border-borda"
          onMouseEnter={() => {
            if (!corEmFoco && produto.imagem2_url) setFotoEmFoco(produto.imagem2_url);
          }}
          onMouseLeave={() => {
            if (!corEmFoco) setFotoEmFoco(null);
          }}
        >
          {foto ? (
            <Foto
              key={foto}
              src={foto}
              alt={produto.nome}
              width={480}
              height={480}
              loading={prioridade ? "eager" : "lazy"}
              fetchPriority={prioridade ? "high" : "auto"}
              decoding="async"
              className="surgir size-full object-contain p-3"
            />
          ) : (
            <div className="grid size-full place-items-center text-xs text-texto-3">
              sem foto
            </div>
          )}

          {produto.em_oferta || produto.selo ? (
            <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
              <Selo tom={produto.em_oferta ? "oferta" : "marca"}>
                {produto.selo ?? "Oferta"}
              </Selo>
            </div>
          ) : null}
        </div>

        <div className="grid gap-1 px-3 pt-3">
          {produto.categoria_nome ? (
            <p className="text-2xs font-medium uppercase tracking-wide text-texto-3">
              {produto.categoria_nome}
            </p>
          ) : null}
          <h3
            className={cn(
              "polegadas line-clamp-2 font-medium leading-snug text-texto",
              compacto ? "text-sm" : "text-sm sm:text-[0.95rem]",
            )}
          >
            {produto.nome}
          </h3>
          {medidas ? <p className="line-clamp-1 text-xs text-texto-2">{medidas}</p> : null}
        </div>
      </Link>

      {/* Amostras de acabamento: passar o mouse ou tocar troca a foto. */}
      <div className="relative z-10 flex min-h-9 items-center gap-1 px-3 pt-2">
        {amostras.length > 1 ? (
          <>
            {amostras.map((cor) => (
              <button
                key={cor.nome}
                type="button"
                aria-label={`Ver em ${cor.nome}`}
                aria-pressed={corEmFoco === cor.nome}
                title={cor.nome}
                onMouseEnter={() => focarCor(cor.nome, cor.imagem_url)}
                onFocus={() => focarCor(cor.nome, cor.imagem_url)}
                onClick={() => focarCor(cor.nome, cor.imagem_url)}
                className={cn(
                  "size-7 overflow-hidden rounded-md border-2 bg-superficie transition-[border-color,transform] duration-150",
                  corEmFoco === cor.nome
                    ? "scale-110 border-tinta-950"
                    : "border-borda hover:border-tinta-700",
                )}
              >
                <Foto
                  src={cor.imagem_url}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  className="size-full object-contain"
                />
              </button>
            ))}
            {restantes > 0 ? (
              <span className="pl-0.5 text-2xs font-medium text-texto-2">+{restantes}</span>
            ) : null}
          </>
        ) : produto.total_cores > 1 ? (
          <span className="pointer-events-none flex items-center gap-1 text-xs text-texto-2">
            <Palette aria-hidden className="size-3.5" />
            {produto.total_cores} acabamentos
          </span>
        ) : null}
      </div>

      <div className="pointer-events-none mt-auto grid gap-0.5 px-3 pb-3 pt-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-xs font-bold text-texto sm:text-sm">Preço sob consulta</p>
          <span className="text-[0.65rem] font-semibold text-sucesso whitespace-nowrap">Pronta entrega</span>
        </div>
        <p className="text-[0.68rem] font-medium text-marca-900 line-clamp-1">
          Boleto ou promissória sem cartão
        </p>
      </div>

      {/* Camada do tamanho exato da foto (quadrada): os botões ficam nos cantos
          dela e o texto do cartão ganha a largura toda. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-square">
        <BotaoFavorito
          movel={{
            id: produto.id,
            slug: produto.slug,
            nome: produto.nome,
            imagem_url: produto.imagem_url,
            categoria_nome: produto.categoria_nome,
          }}
          className="pointer-events-auto absolute right-2.5 top-2.5"
        />
        <button
          type="button"
          onClick={incluirNaLista}
          title="Adicionar à lista de orçamento"
          aria-label={`Adicionar ${produto.nome} à lista de orçamento`}
          className={cn(
            "pointer-events-auto absolute bottom-2.5 right-2.5 grid size-11 place-items-center rounded-full",
            "bg-marca-500 text-tinta-950 shadow-erguido",
            "transition-[transform,background-color] duration-150 ease-mola",
            "hover:bg-marca-400 active:scale-90",
          )}
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </div>
    </article>
  );
});

export function EsqueletoCartao({ compacto = false }: { compacto?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-borda bg-superficie",
        compacto ? "w-[11.5rem] shrink-0 sm:w-[13.5rem]" : "w-full",
      )}
    >
      <Esqueleto className="aspect-square rounded-none" />
      <div className="grid gap-2 p-3">
        <Esqueleto className="h-2.5 w-16" />
        <Esqueleto className="h-3.5 w-full" />
        <Esqueleto className="h-3.5 w-2/3" />
        <Esqueleto className="mt-6 h-4 w-28" />
      </div>
    </div>
  );
}
