/**
 * Liga cada acabamento à foto dele, a partir do catálogo extraído.
 *
 * É uma atualização cirúrgica, feita para rodar com a loja já em uso:
 *   - só preenche `imagem_url` de cores que estão SEM foto;
 *   - só usa fotos que já pertencem àquele móvel no banco;
 *   - não cria, não apaga e não altera móveis, fotos ou textos.
 * Diferente do `semear.mjs`, pode rodar a qualquer momento sem risco de
 * desfazer o que foi editado no painel.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node tools/ligar_cores.mjs [--simular]
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const URL_BASE = process.env.SUPABASE_URL?.replace(/\/$/, "");
const CHAVE = process.env.SUPABASE_SECRET_KEY;
const SIMULAR = process.argv.includes("--simular");

if (!URL_BASE || !CHAVE) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente.");
  process.exit(1);
}

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
};

async function ler(caminho) {
  const linhas = [];
  // PostgREST pagina em 1000 por padrão: percorre até acabar.
  for (let inicio = 0; ; inicio += 1000) {
    const resposta = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
      headers: { ...cabecalhos, Range: `${inicio}-${inicio + 999}` },
    });
    if (!resposta.ok) throw new Error(`${caminho} → ${resposta.status}: ${await resposta.text()}`);
    const pagina = await resposta.json();
    linhas.push(...pagina);
    if (pagina.length < 1000) return linhas;
  }
}

const catalogo = JSON.parse(
  await readFile(path.join(RAIZ, "tools", "out", "catalogo.json"), "utf8"),
);

const [produtos, imagens, cores] = await Promise.all([
  ler("produtos?select=id,slug"),
  ler("produto_imagens?select=produto_id,url"),
  ler("produto_cores?select=id,produto_id,nome,imagem_url"),
]);

const idPorSlug = new Map(produtos.map((p) => [p.slug, p.id]));
const fotosDoProduto = new Map();
for (const im of imagens) {
  if (!fotosDoProduto.has(im.produto_id)) fotosDoProduto.set(im.produto_id, []);
  fotosDoProduto.get(im.produto_id).push(im.url);
}
const corNoBanco = new Map(cores.map((c) => [`${c.produto_id}|${c.nome}`, c]));

let ligadas = 0;
let jaTinham = 0;
let semFotoNoBanco = 0;
let semCorNoBanco = 0;

for (const movel of catalogo) {
  const produtoId = idPorSlug.get(movel.slug);
  if (!produtoId) continue;
  const fotos = fotosDoProduto.get(produtoId) ?? [];

  for (const cor of movel.cores) {
    if (!cor.arquivo) continue;
    const registro = corNoBanco.get(`${produtoId}|${cor.nome}`);
    if (!registro) {
      semCorNoBanco++;
      continue;
    }
    if (registro.imagem_url) {
      jaTinham++;
      continue;
    }
    const url = fotos.find((u) => u.endsWith(`/${movel.slug}/${cor.arquivo}`));
    if (!url) {
      semFotoNoBanco++;
      continue;
    }
    if (!SIMULAR) {
      const resposta = await fetch(
        `${URL_BASE}/rest/v1/produto_cores?id=eq.${registro.id}&imagem_url=is.null`,
        {
          method: "PATCH",
          headers: { ...cabecalhos, Prefer: "return=minimal" },
          body: JSON.stringify({ imagem_url: url }),
        },
      );
      if (!resposta.ok) throw new Error(`cor ${registro.id} → ${resposta.status}`);
    }
    ligadas++;
  }
}

console.log(SIMULAR ? "SIMULAÇÃO — nada foi gravado" : "Gravado.");
console.log(`  cores ligadas a uma foto ........ ${ligadas}`);
console.log(`  já tinham foto (não mexi) ....... ${jaTinham}`);
console.log(`  foto não está mais no móvel ..... ${semFotoNoBanco}`);
console.log(`  cor não existe mais no banco .... ${semCorNoBanco}`);
