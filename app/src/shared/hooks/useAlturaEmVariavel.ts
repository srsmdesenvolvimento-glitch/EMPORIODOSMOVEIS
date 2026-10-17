import { useEffect, useRef } from "react";

/**
 * Publica a altura de um elemento numa variável CSS.
 *
 * Serve para o layout parar de adivinhar. O cabeçalho muda de altura entre
 * o celular e o computador, e entre a faixa de aviso ligada ou desligada no
 * painel; quem se prende logo abaixo dele (o filtro do catálogo, por
 * exemplo) precisa do número real, não de um chute fixo que quebra quando
 * a loja desliga um bloco.
 *
 * O `ResizeObserver` cobre o que um listener de `resize` não pega: fonte
 * que troca, carrinho que ganha um item, faixa que some.
 */
export function useAlturaEmVariavel<T extends HTMLElement>(variavel: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;

    function medir() {
      document.documentElement.style.setProperty(variavel, `${alvo?.offsetHeight ?? 0}px`);
    }

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [variavel]);

  return ref;
}
