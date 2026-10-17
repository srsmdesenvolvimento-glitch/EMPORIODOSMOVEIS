import { useEffect, useState } from "react";

/**
 * A barra recolhe quando a pessoa desce e volta assim que ela sobe um
 * dedo — como o cromo de um aplicativo.
 *
 * O `limiar` evita recolher nos primeiros pixels (seria nervoso) e a
 * `histerese` evita o pisca-pisca: num toque, o navegador emite rolagens
 * de 1–2 px para os dois lados, e sem essa folga a barra ficaria batendo.
 * A leitura é feita dentro de um `requestAnimationFrame`, então o listener
 * não custa nada por evento.
 */
export function useDirecaoDaRolagem({
  limiar = 140,
  histerese = 10,
}: {
  limiar?: number;
  histerese?: number;
} = {}): boolean {
  // Lido já no primeiro render: recarregar a página no meio dela não pode
  // devolver a barra aberta para depois recolher, que seria um solavanco.
  const [recolhido, setRecolhido] = useState(() => window.scrollY > limiar);

  useEffect(() => {
    let ultimo = window.scrollY;
    let pendente = 0;

    function avaliar() {
      pendente = 0;
      const atual = window.scrollY;
      const delta = atual - ultimo;
      if (Math.abs(delta) < histerese) return;
      ultimo = atual;

      // No topo a barra sempre volta: é onde ela faz mais falta.
      if (atual <= limiar) {
        setRecolhido(false);
        return;
      }
      setRecolhido(delta > 0);
    }

    function aoRolar() {
      if (!pendente) pendente = requestAnimationFrame(avaliar);
    }

    document.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      document.removeEventListener("scroll", aoRolar);
      if (pendente) cancelAnimationFrame(pendente);
    };
  }, [limiar, histerese]);

  return recolhido;
}
