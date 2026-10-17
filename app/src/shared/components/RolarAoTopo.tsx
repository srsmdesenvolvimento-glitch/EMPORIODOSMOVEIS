import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Memória de rolagem por tela.
 *
 * Sem isto, quem rolou 200 móveis no catálogo, abriu um e tocou em "voltar"
 * caía no começo da lista — o pior atrito possível numa loja em que o cliente
 * compara dezenas de peças antes de falar com a equipe. O navegador até tenta
 * restaurar sozinho, mas aqui a página é montada depois (as rotas chegam por
 * `lazy`), então ele restaura para uma altura que ainda não existe e o valor
 * se perde.
 *
 * A regra é a do aplicativo: tela nova abre no topo; tela que volta abre
 * exatamente onde estava, sem animação.
 */

/** Chave da entrada do histórico → altura em que a pessoa parou. */
const posicoes = new Map<string, number>();

/** Guarda a posição da tela atual. `pagehide` cobre o fechar da aba. */
function guardar(chave: string) {
  posicoes.set(chave, window.scrollY);
}

export function RolarAoTopo() {
  const { pathname, key } = useLocation();
  const tipo = useNavigationType();
  const chaveAnterior = useRef(key);

  // A cada quadro de rolagem: só o número, sem re-renderizar nada.
  useEffect(() => {
    let pendente = 0;
    function aoRolar() {
      cancelAnimationFrame(pendente);
      pendente = requestAnimationFrame(() => guardar(key));
    }
    document.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      cancelAnimationFrame(pendente);
      document.removeEventListener("scroll", aoRolar);
    };
  }, [key]);

  useEffect(() => {
    // O navegador não deve competir com a gente: em SPA ele restaura no
    // momento errado e briga com o `lazy`.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    // Guarda onde a pessoa estava antes de sair desta tela.
    if (chaveAnterior.current !== key) guardar(chaveAnterior.current);
    chaveAnterior.current = key;

    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (tipo !== "POP") {
      window.scrollTo({ top: 0, behavior: menosMovimento ? "auto" : "smooth" });
      posicoes.set(key, 0);
      return;
    }

    // Voltar: devolve a posição. A rota ainda pode estar carregando, então
    // insistimos por alguns quadros até a página ter altura para receber o
    // valor — sem isso o navegador corta em 0 e a pessoa cai no topo.
    const alvo = posicoes.get(key) ?? 0;
    if (alvo <= 0) return;

    let quadro = 0;
    let tentativas = 0;
    const maxTentativas = 60; // ~1 s; depois disso a página já carregou ou falhou

    function tentar() {
      const alturaAlcancavel = document.documentElement.scrollHeight - window.innerHeight;
      if (alturaAlcancavel >= alvo - 2 || tentativas >= maxTentativas) {
        window.scrollTo({ top: Math.min(alvo, Math.max(0, alturaAlcancavel)), behavior: "auto" });
        return;
      }
      tentativas += 1;
      quadro = requestAnimationFrame(tentar);
    }
    tentar();

    return () => cancelAnimationFrame(quadro);
  }, [key, pathname, tipo]);

  return null;
}
