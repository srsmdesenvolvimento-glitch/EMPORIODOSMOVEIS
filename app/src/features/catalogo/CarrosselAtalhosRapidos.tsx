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
    rotulo: "Promissória",
    destaque: true,
    icone: FileSignature,
    link: "/promissoria",
    badge: "Sem Cartão",
  },
  {
    rotulo: "Ofertas",
    icone: Percent,
    link: "/ofertas",
    badge: "Especial",
  },
  {
    rotulo: "Sala",
    icone: Armchair,
    link: "/catalogo?ambiente=sala",
  },
  {
    rotulo: "Quarto",
    icone: Bed,
    link: "/catalogo?ambiente=quarto",
  },
  {
    rotulo: "Cozinha",
    icone: Utensils,
    link: "/catalogo?ambiente=cozinha",
  },
  {
    rotulo: "Jantar",
    icone: UtensilsCrossed,
    link: "/catalogo?ambiente=jantar",
  },
  {
    rotulo: "Escritório",
    icone: Briefcase,
    link: "/catalogo?ambiente=escritorio",
  },
  {
    rotulo: "Todos",
    icone: Grid,
    link: "/catalogo",
  },
];

export function CarrosselAtalhosRapidos() {
  const config = useConfigSite();

  return (
    <section
      aria-label="Atalhos rápidos por ambiente"
      className="border-b border-borda/60 bg-superficie py-3 sm:py-4 shadow-carta"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="trilho-x flex items-center gap-3 overflow-x-auto pb-1 pt-1 scrollbar-none sm:gap-6 sm:justify-center">
          {ATALHOS.map((item) => {
            if (item.rotulo === "Promissória" && !config.promissoria_ativa) {
              return null;
            }
            const Icone = item.icone;

            return (
              <Link
                key={item.rotulo}
                to={item.link}
                className="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "relative grid size-14 place-items-center rounded-full transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:size-16",
                    item.destaque
                      ? "bg-marca-500 text-tinta-950 shadow-erguido ring-2 ring-marca-500 ring-offset-2"
                      : "bg-fundo border border-borda text-texto-2 shadow-carta group-hover:border-marca-500 group-hover:text-texto",
                  )}
                >
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider shadow-sm",
                        item.destaque
                          ? "bg-tinta-950 text-marca-400 ring-1 ring-marca-500/40"
                          : "bg-erro text-tinta-0",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  <Icone aria-hidden className="size-6 sm:size-7" />
                </span>
                <span
                  className={cn(
                    "text-center text-2xs transition-colors",
                    item.destaque
                      ? "font-bold text-marca-900"
                      : "font-medium text-texto group-hover:text-marca-800",
                  )}
                >
                  {item.rotulo}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
