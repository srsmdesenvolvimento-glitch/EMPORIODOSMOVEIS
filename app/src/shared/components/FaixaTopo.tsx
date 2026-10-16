import { ArrowRight, FileSignature } from "lucide-react";
import { Link } from "react-router-dom";

import { useConfigSite } from "@/shared/lib/site";

/**
 * Faixa fina acima do cabeçalho com o principal argumento de venda.
 * Não é fixa: sai de cena na primeira rolagem e não rouba altura no celular.
 */
export function FaixaTopo() {
  const config = useConfigSite();
  if (!config.promissoria_ativa || !config.faixa_topo) return null;

  return (
    <div data-escuro className="bg-tinta-950 text-tinta-0">
      <Link
        to="/promissoria"
        className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium transition-colors hover:text-marca-400 lg:px-6"
      >
        <FileSignature aria-hidden className="size-3.5 shrink-0 text-marca-500" />
        <span>{config.faixa_topo}</span>
        <span className="hidden items-center gap-1 text-marca-500 sm:inline-flex">
          Saiba como
          <ArrowRight aria-hidden className="size-3" />
        </span>
      </Link>
    </div>
  );
}
