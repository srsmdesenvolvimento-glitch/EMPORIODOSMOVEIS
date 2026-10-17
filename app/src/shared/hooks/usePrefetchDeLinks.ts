import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { prefetchProduto } from "@/features/catalogo/api";
import { carregadores, rotaDoCaminho, slugDoCaminho } from "@/routes/carregadores";

/**
 * Antecipa a próxima tela pelo gesto, não pelo clique.
 *
 * Um listener só, no documento, em vez de um `onMouseEnter` em cada link do
 * site — assim todo link que existir amanhã já nasce acelerado, inclusive os
 * que vierem do painel.
 *
 * Os três gatilhos, e por que cada um:
 * - `pointerdown`: no celular é o que importa. O dedo encosta, o navegador
 *   gasta de 100 a 300 ms decidindo se é toque ou início de rolagem, e nós
 *   usamos exatamente essa janela morta para baixar o pedaço da rota.
 * - `mouseover` e `focusin`: cobrem quem usa mouse e quem navega por teclado,
 *   que ganham a pré-busca já na intenção.
 *
 * Duas recusas deliberadas: quem liga a economia de dados no aparelho não
 * recebe pré-busca nenhuma, e rede 2G também não. Baixar o que talvez a
 * pessoa nem abra é aceitável em 4G e abusivo no interior.
 */

interface NavegadorComConexao extends Navigator {
  connection?: { saveData?: boolean; effectiveType?: string };
}

const REDES_RUINS = new Set(["slow-2g", "2g"]);

function redeAguenta(): boolean {
  const conexao = (navigator as NavegadorComConexao).connection;
  if (!conexao) return true; // Safari e Firefox não expõem: assume que sim
  if (conexao.saveData) return false;
  return !REDES_RUINS.has(conexao.effectiveType ?? "");
}

/** Vale a pena antecipar este link? */
function linkAntecipavel(ancora: HTMLAnchorElement, evento: Event): string | null {
  // Abrir em nova aba, baixar arquivo ou clicar com modificador não navega
  // aqui dentro, então pré-buscar seria trabalho jogado fora.
  if (ancora.target && ancora.target !== "_self") return null;
  if (ancora.hasAttribute("download")) return null;
  if (ancora.origin !== window.location.origin) return null;

  if (evento instanceof MouseEvent && (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey)) {
    return null;
  }
  if (evento instanceof PointerEvent && evento.button !== 0) return null;

  const caminho = ancora.pathname;
  // Mesma tela, ou só um salto dentro dela: nada a carregar.
  if (caminho === window.location.pathname) return null;
  return caminho;
}

export function usePrefetchDeLinks() {
  const cliente = useQueryClient();

  useEffect(() => {
    const jaPedidos = new Set<string>();

    function tratar(evento: Event) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const ancora = alvo.closest("a[href]");
      if (!(ancora instanceof HTMLAnchorElement)) return;

      const caminho = linkAntecipavel(ancora, evento);
      if (!caminho) return;

      const rota = rotaDoCaminho(caminho);
      if (rota) {
        const chaveRota = `rota:${rota}`;
        if (!jaPedidos.has(chaveRota)) {
          jaPedidos.add(chaveRota);
          // Erro aqui não é assunto de quem só está passando o mouse.
          void carregadores[rota]().catch(() => jaPedidos.delete(chaveRota));
        }
      }

      const slug = slugDoCaminho(caminho);
      if (slug && !jaPedidos.has(`movel:${slug}`)) {
        jaPedidos.add(`movel:${slug}`);
        prefetchProduto(cliente, slug);
      }
    }

    function aoApontar(evento: Event) {
      if (evento instanceof PointerEvent && evento.pointerType === "touch") return;
      if (!redeAguenta()) return;
      tratar(evento);
    }

    function aoEncostar(evento: Event) {
      if (!redeAguenta()) return;
      tratar(evento);
    }

    document.addEventListener("pointerover", aoApontar, { passive: true });
    document.addEventListener("focusin", aoEncostar, { passive: true });
    document.addEventListener("pointerdown", aoEncostar, { passive: true });

    return () => {
      document.removeEventListener("pointerover", aoApontar);
      document.removeEventListener("focusin", aoEncostar);
      document.removeEventListener("pointerdown", aoEncostar);
    };
  }, [cliente]);
}
