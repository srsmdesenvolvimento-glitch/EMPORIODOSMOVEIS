import { useEffect } from "react";

import { NOME_DA_MARCA } from "./site";

/**
 * SEO por página. O `index.html` traz os valores da home; cada rota troca os
 * que mudam. É um efeito de verdade — sincroniza o React com o `<head>`, que
 * vive fora da árvore.
 *
 * Buscadores que executam JavaScript (Google, Bing) leem o que este hook
 * escreve. Robôs que não executam — WhatsApp, Facebook — leem os arquivos
 * gerados por `scripts/pre-render.mjs` no build, que usam as mesmas regras.
 */

export interface DadosSeo {
  /** Sem o nome da loja: o sufixo é acrescentado aqui. */
  titulo: string;
  descricao: string;
  /** Imagem de compartilhamento (URL absoluta). */
  imagem?: string | null | undefined;
  tipo?: "website" | "product" | "article";
  /** Páginas que não devem ir para o Google (painel, login, busca vazia). */
  naoIndexar?: boolean;
  /** Um ou mais blocos schema.org. */
  dadosEstruturados?: Record<string, unknown> | Record<string, unknown>[] | null;
}

const SUFIXO = ` — ${NOME_DA_MARCA}`;

/** Título inteiro cabendo em ~60 caracteres, que é o que o Google mostra. */
export function tituloCompleto(titulo: string): string {
  const limpo = titulo.trim();
  if (limpo.includes(NOME_DA_MARCA)) return limpo;
  return limpo.length + SUFIXO.length <= 62 ? `${limpo}${SUFIXO}` : limpo;
}

/** Descrição em uma frase, cortada em palavra inteira perto de 155 caracteres. */
export function descricaoCurta(texto: string, limite = 155): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

function definirMeta(seletor: string, atributos: Record<string, string>, conteudo: string) {
  let marca = document.head.querySelector<HTMLMetaElement>(seletor);
  if (!marca) {
    marca = document.createElement("meta");
    for (const [chave, valor] of Object.entries(atributos)) marca.setAttribute(chave, valor);
    document.head.appendChild(marca);
  }
  marca.setAttribute("content", conteudo);
}

export function useSeo(dados: DadosSeo | null) {
  const serializado = dados ? JSON.stringify(dados) : null;

  useEffect(() => {
    if (!serializado) return;
    const seo = JSON.parse(serializado) as DadosSeo;
    const titulo = tituloCompleto(seo.titulo);
    const descricao = descricaoCurta(seo.descricao);
    // A URL canônica ignora filtros e ordenação: evita conteúdo duplicado.
    const canonica = `${window.location.origin}${window.location.pathname}`;

    document.title = titulo;
    definirMeta('meta[name="description"]', { name: "description" }, descricao);
    definirMeta(
      'meta[name="robots"]',
      { name: "robots" },
      seo.naoIndexar ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    definirMeta('meta[property="og:title"]', { property: "og:title" }, titulo);
    definirMeta('meta[property="og:description"]', { property: "og:description" }, descricao);
    definirMeta('meta[property="og:type"]', { property: "og:type" }, seo.tipo ?? "website");
    definirMeta('meta[property="og:url"]', { property: "og:url" }, canonica);
    if (seo.imagem) {
      definirMeta('meta[property="og:image"]', { property: "og:image" }, seo.imagem);
      definirMeta('meta[name="twitter:image"]', { name: "twitter:image" }, seo.imagem);
    }

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonica;

    // Dados estruturados da rota: sai o bloco da página anterior, entra o novo.
    document.head.querySelectorAll("script[data-seo-rota]").forEach((el) => el.remove());
    const blocos = seo.dadosEstruturados
      ? Array.isArray(seo.dadosEstruturados)
        ? seo.dadosEstruturados
        : [seo.dadosEstruturados]
      : [];
    for (const bloco of blocos) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoRota = "";
      // textContent, não innerHTML: o conteúdo vem do banco e não é interpretado.
      script.textContent = JSON.stringify(bloco);
      document.head.appendChild(script);
    }
  }, [serializado]);
}

/** Trilha de navegação no formato que o Google mostra no resultado. */
export function trilhaEstruturada(itens: { nome: string; caminho: string }[]) {
  const origem = typeof window === "undefined" ? "" : window.location.origin;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: `${origem}${item.caminho}`,
    })),
  };
}
