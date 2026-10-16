import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { Foto } from "@/shared/components/Foto";
import { cn } from "@/shared/lib/utils";

import type { MovelGuardado } from "./store";

/** Cartão leve para favoritos e "vistos recentemente". */
export function CartaoGuardado({
  movel,
  aoRemover,
  compacto = false,
}: {
  movel: MovelGuardado;
  aoRemover?: () => void;
  compacto?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-borda bg-superficie shadow-carta transition-shadow hover:shadow-flutuante",
        compacto ? "w-[9.5rem] shrink-0 sm:w-[11rem]" : "w-full",
      )}
    >
      <Link to={`/produto/${movel.slug}`} className="block focus-visible:outline-none">
        <span className="absolute inset-0 z-0 rounded-3xl group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-tinta-950" aria-hidden />
        <div className="moldura-foto border-b border-borda">
          <Foto
            src={movel.imagem_url}
            alt={movel.nome}
            width={300}
            height={300}
            loading="lazy"
            className="size-full object-contain p-2.5"
          />
        </div>
        <div className="grid gap-0.5 p-3">
          {movel.categoria_nome ? (
            <p className="text-2xs font-medium uppercase tracking-wide text-texto-3">
              {movel.categoria_nome}
            </p>
          ) : null}
          <h3 className="polegadas line-clamp-2 text-sm font-medium leading-snug text-texto">
            {movel.nome}
          </h3>
        </div>
      </Link>
      {aoRemover ? (
        <button
          type="button"
          onClick={aoRemover}
          aria-label={`Remover ${movel.nome} dos favoritos`}
          className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full bg-superficie/90 text-texto-2 shadow-carta backdrop-blur transition-colors hover:text-erro"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </article>
  );
}
