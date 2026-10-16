/**
 * Pré-renderização do <head> — roda depois do `vite build`.
 *
 * O site é uma SPA: quem não executa JavaScript (WhatsApp, Facebook,
 * Instagram e vários robôs de busca) só enxerga o index.html genérico. Num
 * negócio que vende pelo WhatsApp, isso significa que todo link de móvel
 * compartilhado mostrava "Empório dos Móveis" e a logo, em vez do móvel.
 *
 * Este script gera, para cada página pública, uma cópia do index.html com
 * título, descrição, foto e dados estruturados próprios:
 *   dist/produto/<slug>/index.html, dist/promissoria/index.html, ...
 * O React carrega por cima normalmente. Também escreve sitemap.xml e robots.txt.
 *
 * Variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e, para URLs
 * absolutas (canonical, sitemap), VITE_SITE_URL. Lê .env.local se existir.
 * Falha de rede NÃO derruba o build: o site continua funcionando sem as cópias.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(RAIZ, "dist");

for (const arquivo of [".env.local", ".env"]) {
  const caminho = path.join(RAIZ, arquivo);
  if (existsSync(caminho)) process.loadEnvFile(caminho);
}

const URL_SUPABASE = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const CHAVE = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SITE = process.env.VITE_SITE_URL?.replace(/\/$/, "") ?? "";
const MARCA = "Empório dos Móveis";

const escapar = (texto) =>
  String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

// JSON dentro de <script>: impede que um "</script>" vindo do banco feche a tag.
const jsonSeguro = (dados) => JSON.stringify(dados).replaceAll("<", "\\u003c");

function titulo(texto) {
  const sufixo = ` — ${MARCA}`;
  if (texto.includes(MARCA)) return texto;
  return texto.length + sufixo.length <= 62 ? `${texto}${sufixo}` : texto;
}

function resumo(texto, limite = 155) {
  const limpo = String(texto).replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

function medida(cm) {
  if (!cm) return null;
  const n = Number(cm);
  return n >= 100 ? `${(n / 100).toFixed(2).replace(".", ",")} m` : `${String(n).replace(".", ",")} cm`;
}

async function buscar(caminho) {
  const resposta = await fetch(`${URL_SUPABASE}/rest/v1/${caminho}`, {
    headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resposta.ok) throw new Error(`${caminho} → HTTP ${resposta.status}`);
  return resposta.json();
}

/** Troca no index.html tudo o que é específico da página. */
function montarPagina(base, { titulo: t, descricao, imagem, caminho, tipo = "website", blocos = [] }) {
  let html = base
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
    .replace(/<meta\s+property="og:(title|description|image|type|url)"[\s\S]*?\/>/g, "")
    .replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g, "");

  const url = SITE ? `${SITE}${caminho}` : "";
  const cabeca = [
    `<title>${escapar(t)}</title>`,
    `<meta name="description" content="${escapar(descricao)}" />`,
    `<meta property="og:type" content="${tipo}" />`,
    `<meta property="og:title" content="${escapar(t)}" />`,
    `<meta property="og:description" content="${escapar(descricao)}" />`,
    imagem ? `<meta property="og:image" content="${escapar(imagem)}" />` : "",
    imagem ? `<meta name="twitter:image" content="${escapar(imagem)}" />` : "",
    url ? `<meta property="og:url" content="${escapar(url)}" />` : "",
    url ? `<link rel="canonical" href="${escapar(url)}" />` : "",
    // data-seo-rota: o hook useSeo troca estes blocos ao navegar no site.
    ...blocos.map((b) => `<script type="application/ld+json" data-seo-rota>${jsonSeguro(b)}</script>`),
  ]
    .filter(Boolean)
    .join("\n    ");

  return html.replace("</head>", `    ${cabeca}\n  </head>`);
}

async function gravar(caminho, html) {
  const pasta = path.join(DIST, caminho);
  await mkdir(pasta, { recursive: true });
  await writeFile(path.join(pasta, "index.html"), html, "utf8");
}

function trilha(itens) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      ...(SITE ? { item: `${SITE}${item.caminho}` } : {}),
    })),
  };
}

async function principal() {
  if (!existsSync(path.join(DIST, "index.html"))) {
    console.warn("[pre-render] dist/index.html não existe — rode o vite build antes.");
    return;
  }
  if (!URL_SUPABASE || !CHAVE) {
    console.warn("[pre-render] Sem VITE_SUPABASE_URL/KEY: pulando a pré-renderização.");
    return;
  }
  if (!SITE) {
    console.warn(
      "[pre-render] VITE_SITE_URL não definida: páginas geradas sem canonical, e sem sitemap.\n" +
        "             Defina o domínio final (ex.: https://emporiodosmoveis.com.br) no deploy.",
    );
  }

  const base = await readFile(path.join(DIST, "index.html"), "utf8");

  const [configuracoes, categorias, produtos] = await Promise.all([
    buscar("configuracoes?select=valor&chave=eq.site"),
    buscar("categorias?select=slug,nome&ativa=eq.true&order=ordem"),
    buscar(
      "produtos?select=slug,nome,descricao,codigos,altura_cm,largura_cm,profundidade_cm,peso_kg,atualizado_em," +
        "categorias(slug,nome),produto_imagens(url,ordem),produto_cores(nome)&ativo=eq.true&limit=5000",
    ),
  ]);

  const config = configuracoes[0]?.valor ?? {};
  const promissoria = config.promissoria_ativa !== false;
  const cidade = String(config.cidade ?? "").split(/[-,]/)[0]?.trim() ?? "";
  const emCidade = cidade ? ` em ${cidade}` : "";
  const logo = SITE ? `${SITE}/logo-fundo.png` : "";

  // --------------------------------------------------------- produtos
  for (const p of produtos) {
    const fotos = [...(p.produto_imagens ?? [])].sort((a, b) => a.ordem - b.ordem).map((f) => f.url);
    const dims = [
      medida(p.altura_cm) && `Alt. ${medida(p.altura_cm)}`,
      medida(p.largura_cm) && `Larg. ${medida(p.largura_cm)}`,
      medida(p.profundidade_cm) && `Prof. ${medida(p.profundidade_cm)}`,
    ]
      .filter(Boolean)
      .join(" × ");
    const cores = (p.produto_cores ?? []).map((c) => c.nome);
    const descricao = resumo(
      [
        `${p.nome}${dims ? ` (${dims})` : ""}.`,
        cores.length > 1 ? `${cores.length} acabamentos.` : "",
        promissoria
          ? "Compre na promissória ou consulte a sua condição direto com a loja."
          : "Consulte a sua condição direto com a loja.",
      ].join(" "),
    );
    const cm = (v) => (v ? { "@type": "QuantitativeValue", value: Number(v), unitCode: "CMT" } : undefined);

    await gravar(
      `produto/${p.slug}`,
      montarPagina(base, {
        titulo: titulo(p.nome),
        descricao,
        imagem: fotos[0],
        caminho: `/produto/${p.slug}`,
        tipo: "product",
        blocos: [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.nome,
            description: p.descricao ?? descricao,
            image: fotos,
            category: p.categorias?.nome,
            sku: p.codigos?.[0],
            color: cores.length ? cores.join(", ") : undefined,
            height: cm(p.altura_cm),
            width: cm(p.largura_cm),
            depth: cm(p.profundidade_cm),
          },
          trilha([
            { nome: "Início", caminho: "/" },
            { nome: "Catálogo", caminho: "/catalogo" },
            ...(p.categorias
              ? [{ nome: p.categorias.nome, caminho: `/catalogo?categoria=${p.categorias.slug}` }]
              : []),
            { nome: p.nome, caminho: `/produto/${p.slug}` },
          ]),
        ],
      }),
    );
  }

  // ------------------------------------------------- páginas fixas
  const fixas = [
    {
      caminho: "/catalogo",
      titulo: "Catálogo de móveis",
      descricao: `Catálogo com mais de 300 móveis para sala, quarto, cozinha e escritório${emCidade}. Medidas e acabamentos na tela${promissoria ? ", compra na promissória" : ""}.`,
    },
    {
      caminho: "/categorias",
      titulo: "Categorias de móveis",
      descricao: "Todas as linhas do catálogo: sala, quarto, cozinha, escritório, roupeiros, cômodas e mais.",
    },
    {
      caminho: "/ofertas",
      titulo: "Ofertas da semana em móveis",
      descricao: "Móveis com condição especial enquanto durar o estoque. Consulte a sua condição direto com a loja.",
    },
    {
      caminho: "/sobre",
      titulo: "A loja",
      descricao: `Conheça o ${MARCA}: catálogo completo do fabricante e atendimento direto com a loja${emCidade}.`,
    },
    {
      caminho: "/contato",
      titulo: "Contato e orçamento",
      descricao: "Fale com a loja pelo WhatsApp ou envie a sua lista de móveis para receber valores e prazo de entrega.",
    },
  ];
  fixas.push({
    caminho: "/privacidade",
    titulo: "Política de privacidade",
    descricao: `Como o ${MARCA} trata os dados pessoais enviados pelo site, conforme a LGPD.`,
  });
  if (promissoria) {
    fixas.push({
      caminho: "/promissoria",
      titulo: `Móveis na promissória${emCidade}`,
      descricao: `Compre móveis na promissória${emCidade}, sem cartão de crédito: parcelamento direto com a loja, cadastro simples e sujeito a análise.`,
    });
  }
  for (const pagina of fixas) {
    await gravar(
      pagina.caminho,
      montarPagina(base, {
        titulo: titulo(pagina.titulo),
        descricao: resumo(pagina.descricao),
        imagem: logo || undefined,
        caminho: pagina.caminho,
      }),
    );
  }

  // ------------------------------------------------ robots e sitemap
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /painel",
    "Disallow: /entrar",
    "Disallow: /favoritos",
    "Disallow: /catalogo?q=",
    SITE ? `\nSitemap: ${SITE}/sitemap.xml` : "",
  ].join("\n");
  await writeFile(path.join(DIST, "robots.txt"), `${robots}\n`, "utf8");

  if (SITE) {
    const hoje = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: "/", prioridade: "1.0", data: hoje },
      ...fixas.map((f) => ({ loc: f.caminho, prioridade: "0.8", data: hoje })),
      ...["sala", "quarto", "cozinha", "jantar", "escritorio"].map((ambiente) => ({
        loc: `/catalogo?ambiente=${ambiente}`,
        prioridade: "0.9",
        data: hoje,
      })),
      ...categorias.map((c) => ({
        loc: `/catalogo?categoria=${encodeURIComponent(c.slug)}`,
        prioridade: "0.8",
        data: hoje,
      })),
      ...produtos.map((p) => ({
        loc: `/produto/${p.slug}`,
        prioridade: "0.6",
        data: String(p.atualizado_em ?? hoje).slice(0, 10),
      })),
    ];
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (u) =>
          `  <url><loc>${escapar(`${SITE}${u.loc}`)}</loc><lastmod>${u.data}</lastmod><priority>${u.prioridade}</priority></url>`,
      ),
      "</urlset>",
    ].join("\n");
    await writeFile(path.join(DIST, "sitemap.xml"), `${xml}\n`, "utf8");
  }

  console.log(
    `[pre-render] ${produtos.length} móveis + ${fixas.length} páginas fixas` +
      (SITE ? " + sitemap.xml" : "") +
      " + robots.txt",
  );
}

principal().catch((erro) => {
  // O site funciona sem as cópias; não vale derrubar o deploy por isso.
  console.warn(`[pre-render] Não gerado: ${erro.message}`);
});
