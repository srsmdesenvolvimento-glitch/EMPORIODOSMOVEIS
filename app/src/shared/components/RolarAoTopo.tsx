import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Troca de rota volta ao topo — menos quando só mudou a query string
 * (filtro e paginação do catálogo devem manter a posição da leitura).
 */
export function RolarAoTopo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: menosMovimento ? "auto" : "smooth" });
  }, [pathname]);

  return null;
}
