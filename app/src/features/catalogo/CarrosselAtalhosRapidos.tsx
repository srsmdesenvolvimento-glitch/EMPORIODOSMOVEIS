import {
  Armchair,
  Bed,
  Briefcase,
  FileSignature,
  Grid,
  Percent,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

const ATALHOS = [
  {
    rotulo: "Boleto & Promissória",
    descricao: "Crediário sem cartão",
    destaque: true,
    icone: FileSignature,
    link: "/promissoria",
    badge: "Sem Limite",
  },
  {
    rotulo: "Ofertas da Semana",
    descricao: "Descontos especiais",
    icone: Percent,
    link: "/ofertas",
    badge: "Até 30% OFF",
  },
  {
    rotulo: "Sala de Estar",
    descricao: "Sofás, racks e painéis",
    icone: Armchair,
    link: "/catalogo?ambiente=sala",
  },
  {
    rotulo: "Quarto & Suíte",
    descricao: "Camas, roupeiros e cômodas",
    icone: Bed,
    link: "/catalogo?ambiente=quarto",
  },
  {
    rotulo: "Cozinha Modulada",
    descricao: "Armários e balcões 100% MDF",
    icone: Utensils,
    link: "/catalogo?ambiente=cozinha",
  },
  {
    rotulo: "Sala de Jantar",
    descricao: "Mesas e cadeiras nobres",
    icone: UtensilsCrossed,
    link: "/catalogo?ambiente=jantar",
  },
  {
    rotulo: "Home Office",
    descricao: "Escrivaninhas e gaveteiros",
    icone: Briefcase,
    link: "/catalogo?ambiente=escritorio",
  },
  {
    rotulo: "Todo o Catálogo",
    descricao: "Mais de 300 móveis",
    icone: Grid,
    link: "/catalogo",
  },
];

export function CarrosselAtalhosRapidos() {
  const config = useConfigSite();

  return (
    <section
      aria-label="Atalhos rápidos por categoria e crediário"
      className="border-b border-borda/70 bg-superficie py-3 sm:py-3.5 shadow-carta"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="trilho-x flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none sm:gap-3 sm:justify-center">
          {ATALHOS.map((item) => {
            if (
              (item.rotulo.includes("Promissória") || item.rotulo.includes("Boleto")) &&
              !config.promissoria_ativa
            ) {
              return null;
            }
            const Icone = item.icone;

            return (
              <Link
                key={item.rotulo}
                to={item.link}
                className={cn(
                  "group relative flex items-center gap-3 shrink-0 rounded-2xl border px-3.5 py-2 transition-all duration-200 ease-saida focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-500",
                  item.destaque
                    ? "border-marca-500 bg-gradient-to-r from-marca-500/20 via-marca-500/10 to-transparent shadow-sm hover:border-marca-600 hover:shadow-carta hover:scale-[1.02]"
                    : "border-borda bg-fundo/80 hover:border-marca-400 hover:bg-superficie hover:shadow-carta hover:scale-[1.01]",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl transition-all duration-200 group-hover:scale-105",
                    item.destaque
                      ? "bg-marca-500 text-tinta-950 shadow-sm"
                      : "bg-tinta-100 text-texto-2 group-hover:bg-marca-100 group-hover:text-marca-900",
                  )}
                >
                  <Icone aria-hidden className="size-5" />
                </span>

                <div className="flex flex-col pr-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-bold leading-none tracking-tight transition-colors",
                        item.destaque
                          ? "text-marca-950 font-black"
                          : "text-texto group-hover:text-marca-800",
                      )}
                    >
                      {item.rotulo}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-wider shadow-2xs",
                          item.destaque
                            ? "bg-tinta-950 text-marca-400 ring-1 ring-marca-500/40"
                            : "bg-erro text-tinta-0",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-[0.65rem] text-texto-3 leading-none font-medium">
                    {item.descricao}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
