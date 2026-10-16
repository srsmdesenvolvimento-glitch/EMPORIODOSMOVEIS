/**
 * Envia as miniaturas (*-m.webp) geradas pelo extrator para o bucket.
 *
 * Só acrescenta arquivos: não mexe no banco nem nas fotos originais. Pode
 * rodar quantas vezes precisar.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node tools/enviar_miniaturas.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const URL_BASE = process.env.SUPABASE_URL?.replace(/\/$/, "");
const CHAVE = process.env.SUPABASE_SECRET_KEY;
if (!URL_BASE || !CHAVE) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente.");
  process.exit(1);
}

const DIR_IMG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "out", "img");

const envios = [];
for (const pasta of await readdir(DIR_IMG, { withFileTypes: true })) {
  if (!pasta.isDirectory()) continue;
  for (const arquivo of await readdir(path.join(DIR_IMG, pasta.name))) {
    if (arquivo.endsWith("-m.webp")) {
      envios.push({ local: path.join(DIR_IMG, pasta.name, arquivo), destino: `produtos/${pasta.name}/${arquivo}` });
    }
  }
}

let feitos = 0;
let falhas = 0;
let proximo = 0;
async function operario() {
  while (proximo < envios.length) {
    const envio = envios[proximo++];
    const resposta = await fetch(`${URL_BASE}/storage/v1/object/catalogo/${envio.destino}`, {
      method: "POST",
      headers: {
        apikey: CHAVE,
        Authorization: `Bearer ${CHAVE}`,
        "Content-Type": "image/webp",
        "Cache-Control": "31536000",
        "x-upsert": "true",
      },
      body: await readFile(envio.local),
    });
    if (resposta.ok) feitos++;
    else {
      falhas++;
      console.warn(`  ! ${envio.destino}: ${resposta.status}`);
    }
    if ((feitos + falhas) % 200 === 0) console.log(`  ${feitos + falhas}/${envios.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, operario));
console.log(`Miniaturas enviadas: ${feitos} | falhas: ${falhas}`);
