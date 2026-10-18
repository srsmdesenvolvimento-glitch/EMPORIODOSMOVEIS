import {
  ClipboardList,
  FileSignature,
  Grid,
  Heart,
  Home,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useFavoritos } from "@/features/favoritos/store";
import { useOrcamento, useTotalDeItens } from "@/features/orcamento/store";
import { useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

export function BarraNavegacaoInferior() {
  const local = useLocation();
  const config = useConfigSite();
  const totalItens = useTotalDeItens();
  const totalFavoritos = useFavoritos((s) => s.itens.length);
  const abrirOrcamento = useOrcamento((s) => s.abrir);

  // Não exibe a barra no painel administrativo
  if (local.pathname.startsWith("/painel")) return null;

  const estaNaHome = local.pathname === "/";
  const estaNoCatalogo = local.pathname.startsWith("/catalogo");
  const estaNaPromissoria = local.pathname === "/promissoria";
  const estaNosFavoritos = local.pathname === "/favoritos";

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda/80 bg-superficie/95 backdrop-blur-md lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {/* Início */}
        <Link
          to="/"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors",
            estaNaHome ? "text-marca-800 font-bold" : "text-texto-2 hover:text-texto",
          )}
        >
          <Home aria-hidden className="size-5" />
          <span className="text-[0.65rem] tracking-tight">Início</span>
        </Link>

        {/* Catálogo */}
        <Link
          to="/catalogo"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors",
            estaNoCatalogo ? "text-marca-800 font-bold" : "text-texto-2 hover:text-texto",
          )}
        >
          <Grid aria-hidden className="size-5" />
          <span className="text-[0.65rem] tracking-tight">Móveis</span>
        </Link>

        {/* Botão Central: Promissória em Destaque (O Diferencial de Ouro) */}
        {config.promissoria_ativa ? (
          <div className="flex flex-1 flex-col items-center justify-center -translate-y-3">
            <Link
              to="/promissoria"
              aria-label="Comprar no boleto ou na promissória sem cartão"
              className={cn(
                "relative grid size-13 place-items-center rounded-full bg-marca-500 text-tinta-950 shadow-suspenso transition-transform active:scale-90 hover:scale-105",
                estaNaPromissoria && "ring-2 ring-tinta-950",
              )}
            >
              <FileSignature aria-hidden className="size-6" />
            </Link>
            <span className="mt-0.5 text-[0.62rem] font-bold text-tinta-950 whitespace-nowrap">
              Crediário
            </span>
          </div>
        ) : null}

        {/* Favoritos */}
        <Link
          to="/favoritos"
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors",
            estaNosFavoritos ? "text-marca-800 font-bold" : "text-texto-2 hover:text-texto",
          )}
        >
          <Heart aria-hidden className="size-5" />
          <span className="text-[0.65rem] tracking-tight">Favoritos</span>
          {totalFavoritos > 0 && (
            <span className="absolute right-2 top-0.5 grid size-4 place-items-center rounded-full bg-tinta-950 text-[0.6rem] font-bold text-tinta-0">
              {totalFavoritos}
            </span>
          )}
        </Link>

        {/* Minha Lista / Orçamento */}
        <button
          type="button"
          onClick={abrirOrcamento}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center text-texto-2 hover:text-texto transition-colors"
          aria-label={`Abrir lista de orçamento (${totalItens} itens)`}
        >
          <ClipboardList aria-hidden className="size-5" />
          <span className="text-[0.65rem] tracking-tight">Minha Lista</span>
          {totalItens > 0 && (
            <span className="absolute right-2 top-0.5 grid min-w-4.5 px-1 place-items-center rounded-full bg-marca-500 text-[0.65rem] font-bold text-tinta-950">
              {totalItens}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
