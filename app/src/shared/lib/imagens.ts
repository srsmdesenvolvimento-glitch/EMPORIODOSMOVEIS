/**
 * Miniaturas.
 *
 * Toda foto do catálogo tem uma irmã de 480 px com o mesmo nome terminado em
 * "-m.webp". Cartões, listas e miniaturas usam a irmã; a foto grande só é
 * baixada na galeria do móvel. Na primeira página do catálogo isso derruba o
 * download de imagens de ~2,7 MB para ~0,6 MB.
 *
 * Fotos enviadas pelo painel antes das miniaturas existirem não têm irmã: o
 * componente <Foto> volta para a original se a miniatura não carregar.
 */
const FOTO_DO_BUCKET = /\/storage\/v1\/object\/public\/catalogo\/produtos\/.+\.(webp|jpe?g|png|avif)$/i;

export function miniatura(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!FOTO_DO_BUCKET.test(url) || /-m\.webp$/i.test(url)) return url;
  return url.replace(/\.(webp|jpe?g|png|avif)$/i, "-m.webp");
}

/** Gera a miniatura de um arquivo no navegador, antes do envio pelo painel. */
export async function gerarMiniatura(arquivo: File, largura = 480): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, largura / bitmap.width);
    const tela = document.createElement("canvas");
    tela.width = Math.round(bitmap.width * escala);
    tela.height = Math.round(bitmap.height * escala);
    const contexto = tela.getContext("2d");
    if (!contexto) return null;
    // Fundo branco: PNG transparente não pode virar preto na miniatura.
    contexto.fillStyle = "#fff";
    contexto.fillRect(0, 0, tela.width, tela.height);
    contexto.drawImage(bitmap, 0, 0, tela.width, tela.height);
    bitmap.close();
    return await new Promise((resolver) => tela.toBlob(resolver, "image/webp", 0.8));
  } catch {
    // Sem miniatura o site usa a foto original: não vale travar o envio.
    return null;
  }
}
