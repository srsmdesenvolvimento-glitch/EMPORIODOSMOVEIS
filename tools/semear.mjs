/**
 * Leva o catálogo extraído do PDF para o Supabase: categorias, produtos,
 * cores, e as fotos para o bucket `catalogo`.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node tools/semear.mjs [--apenas-dados]
 *
 * A chave de serviço fica só aqui, no processo do terminal. Ela nunca entra
 * no build do site.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const URL_BASE = process.env.SUPABASE_URL?.replace(/\/$/, "");
const CHAVE = process.env.SUPABASE_SECRET_KEY;
const SOMENTE_DADOS = process.argv.includes("--apenas-dados");
// Apaga do banco os móveis que não estão mais no JSON. Só use numa carga
// inicial: remove também o que alguém tenha cadastrado à mão no painel.
const REMOVER_AUSENTES = process.argv.includes("--remover-ausentes");

if (!URL_BASE || !CHAVE) {
  console.error(
    "Faltam SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente.\n" +
      "Exemplo: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_... node tools/semear.mjs",
  );
  process.exit(1);
}

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQ_JSON = path.join(RAIZ, "tools", "out", "catalogo.json");
const DIR_IMG = path.join(RAIZ, "tools", "out", "img");
const BUCKET = "catalogo";

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
};

async function rest(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: { ...cabecalhos, ...(opcoes.headers ?? {}) },
  });
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`${opcoes.method ?? "GET"} ${caminho} → ${resposta.status}: ${texto}`);
  }
  // `return=minimal` responde 201 sem corpo: só interpreta se houver algo.
  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

async function enviarArquivo(caminhoLocal, destino) {
  const corpo = await readFile(caminhoLocal);
  const resposta = await fetch(
    `${URL_BASE}/storage/v1/object/${BUCKET}/${destino}`,
    {
      method: "POST",
      headers: {
        apikey: CHAVE,
        Authorization: `Bearer ${CHAVE}`,
        "Content-Type": "image/webp",
        "Cache-Control": "31536000",
        "x-upsert": "true",
      },
      body: corpo,
    },
  );
  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`upload ${destino} → ${resposta.status}: ${texto}`);
  }
  return `${URL_BASE}/storage/v1/object/public/${BUCKET}/${destino}`;
}

/** Roda `tarefa` sobre `itens` com no máximo `n` em voo ao mesmo tempo. */
async function emParalelo(itens, n, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function operario() {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await tarefa(itens[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, operario));
  return resultados;
}

function paraSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Uma frase curta e natural para a descrição e para a busca do site. */
function descricaoDe(produto) {
  const partes = [];
  const medida = (cm) =>
    cm == null ? null : cm >= 100 ? `${(cm / 100).toFixed(2).replace(".", ",")} m` : `${cm} cm`;
  const dims = [
    produto.dimensoes.altura ? `altura de ${medida(produto.dimensoes.altura)}` : null,
    produto.dimensoes.largura ? `largura de ${medida(produto.dimensoes.largura)}` : null,
    produto.dimensoes.profundidade ? `profundidade de ${medida(produto.dimensoes.profundidade)}` : null,
  ].filter(Boolean);

  partes.push(`${produto.nome} da linha ${produto.categoria.toLowerCase()}.`);
  if (dims.length) partes.push(`Mede ${dims.join(", ")}.`);
  if (produto.specs.length) partes.push(`${produto.specs.slice(0, 3).join(". ")}.`);
  if (produto.cores.length > 1) {
    partes.push(`Disponível em ${produto.cores.length} acabamentos.`);
  }
  return partes.join(" ");
}

async function principal() {
  console.log("Lendo catálogo extraído…");
  const produtos = JSON.parse(await readFile(ARQ_JSON, "utf8"));
  console.log(`  ${produtos.length} produtos`);

  // ---------------------------------------------------------- categorias
  const nomesCategorias = [...new Set(produtos.map((p) => p.categoria))];
  console.log(`\nGravando ${nomesCategorias.length} categorias…`);

  const categorias = nomesCategorias.map((nome, i) => ({
    slug: paraSlug(nome),
    nome,
    ordem: i,
    ativa: true,
  }));

  await rest("categorias?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(categorias),
  });

  const salvas = await rest("categorias?select=id,slug");
  const idPorSlug = new Map(salvas.map((c) => [c.slug, c.id]));
  console.log(`  ok (${salvas.length} no banco)`);

  // ------------------------------------------------------------- fotos
  const urlPorArquivo = new Map();
  if (!SOMENTE_DADOS) {
    const pastas = await readdir(DIR_IMG, { withFileTypes: true });
    const envios = [];
    for (const pasta of pastas) {
      if (!pasta.isDirectory()) continue;
      const arquivos = await readdir(path.join(DIR_IMG, pasta.name));
      for (const arquivo of arquivos.filter((a) => a.endsWith(".webp"))) {
        envios.push({
          local: path.join(DIR_IMG, pasta.name, arquivo),
          destino: `produtos/${pasta.name}/${arquivo}`,
        });
      }
    }

    console.log(`\nEnviando ${envios.length} imagens para o bucket…`);
    let feitos = 0;
    await emParalelo(envios, 8, async (envio) => {
      try {
        const url = await enviarArquivo(envio.local, envio.destino);
        urlPorArquivo.set(envio.destino, url);
      } catch (erro) {
        console.warn(`  ! ${envio.destino}: ${erro.message}`);
      }
      if (++feitos % 100 === 0) console.log(`  ${feitos}/${envios.length}`);
    });
    console.log(`  ok (${urlPorArquivo.size} enviadas)`);
  } else {
    for (const p of produtos) {
      for (const a of p.arquivos ?? []) {
        const destino = `produtos/${p.slug}/${a.arquivo}`;
        urlPorArquivo.set(
          destino,
          `${URL_BASE}/storage/v1/object/public/${BUCKET}/${destino}`,
        );
      }
    }
  }

  // ---------------------------------------------------------- produtos
  console.log(`\nGravando ${produtos.length} produtos…`);
  const linhas = produtos.map((p, i) => ({
    slug: p.slug,
    nome: p.nome,
    categoria_id: idPorSlug.get(paraSlug(p.categoria)) ?? null,
    descricao: descricaoDe(p),
    especificacoes: p.specs,
    codigos: p.codigos,
    altura_cm: p.dimensoes.altura ?? null,
    largura_cm: p.dimensoes.largura ?? null,
    profundidade_cm: p.dimensoes.profundidade ?? null,
    peso_kg: p.peso_kg,
    volumes: p.volumes,
    medidas_texto: p.medidas_texto ?? [],
    observacoes: [...new Set(p.observacoes ?? [])],
    // Uma amostra vira destaque da home; oferta fica por conta da loja.
    destaque: i % 17 === 0,
    em_oferta: false,
    ativo: true,
    ordem: i,
    pagina_catalogo: p.paginas?.[0] ?? p.pagina ?? null,
  }));

  for (let i = 0; i < linhas.length; i += 100) {
    await rest("produtos?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(linhas.slice(i, i + 100)),
    });
    console.log(`  ${Math.min(i + 100, linhas.length)}/${linhas.length}`);
  }

  if (REMOVER_AUSENTES) {
    const atuais = await rest("produtos?select=slug&limit=5000");
    const validos = new Set(linhas.map((l) => l.slug));
    const ausentes = atuais.map((a) => a.slug).filter((s) => !validos.has(s));
    for (const slug of ausentes) {
      await rest(`produtos?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" });
    }
    console.log(`  removidos ${ausentes.length} que saíram do catálogo: ${ausentes.join(", ") || "—"}`);
  }

  const salvosProdutos = await rest("produtos?select=id,slug&limit=2000");
  const idPorProduto = new Map(salvosProdutos.map((p) => [p.slug, p.id]));
  console.log(`  ok (${salvosProdutos.length} no banco)`);

  // ------------------------------------------------- imagens e cores
  console.log("\nLigando fotos e acabamentos aos produtos…");
  const imagens = [];
  const cores = [];

  for (const p of produtos) {
    const produtoId = idPorProduto.get(p.slug);
    if (!produtoId) continue;

    (p.arquivos ?? []).forEach((a, ordem) => {
      const destino = `produtos/${p.slug}/${a.arquivo}`;
      const url = urlPorArquivo.get(destino);
      if (!url) return;
      imagens.push({
        produto_id: produtoId,
        url,
        alt: p.nome,
        largura: a.largura ?? null,
        altura: a.altura ?? null,
        ordem,
      });
    });

    const vistas = new Set();
    p.cores.forEach((c, ordem) => {
      const nome = typeof c === "string" ? c : c.nome;
      if (!nome || vistas.has(nome)) return;
      vistas.add(nome);
      // O extrator já diz qual arquivo é a foto de cada acabamento.
      const arquivo = typeof c === "object" ? c.arquivo : null;
      const destino = arquivo ? `produtos/${p.slug}/${arquivo}` : null;
      cores.push({
        produto_id: produtoId,
        nome,
        imagem_url: destino ? (urlPorArquivo.get(destino) ?? null) : null,
        ordem,
      });
    });
  }

  // Regrava do zero para a rodada ser repetível sem duplicar nada.
  await fetch(`${URL_BASE}/rest/v1/produto_imagens?produto_id=not.is.null`, {
    method: "DELETE",
    headers: cabecalhos,
  });
  await fetch(`${URL_BASE}/rest/v1/produto_cores?produto_id=not.is.null`, {
    method: "DELETE",
    headers: cabecalhos,
  });

  for (let i = 0; i < imagens.length; i += 200) {
    await rest("produto_imagens", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(imagens.slice(i, i + 200)),
    });
  }
  console.log(`  ${imagens.length} fotos`);

  for (let i = 0; i < cores.length; i += 200) {
    await rest("produto_cores?on_conflict=produto_id,nome", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(cores.slice(i, i + 200)),
    });
  }
  console.log(`  ${cores.length} acabamentos`);

  // ------------------------------------------------------ configuração
  // Só cria se ainda não existir: nunca sobrescreve o que a loja preencheu.
  await rest("configuracoes?on_conflict=chave", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        chave: "site",
        valor: {
          whatsapp: "",
          telefone: "",
          email: "",
          endereco: "",
          cidade: "",
          horarios: "",
          instagram: "",
          facebook: "",
          mapa_url: "",
          chamada_home: "Móveis para a casa inteira, com entrega e montagem.",
          sobre_texto: "",
        },
      },
    ]),
  });

  console.log("\nPronto. Catálogo no ar.");
}

principal().catch((erro) => {
  console.error("\nFalhou:", erro.message);
  process.exit(1);
});
