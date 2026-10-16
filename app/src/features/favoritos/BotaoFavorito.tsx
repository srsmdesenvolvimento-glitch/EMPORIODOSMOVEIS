import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";

import { useEhFavorito, useFavoritos, type MovelGuardado } from "./store";

interface Props {
  movel: Omit<MovelGuardado, "guardado_em">;
  /** "flutuante": círculo sobre a foto do cartão. "contorno": botão da página do móvel. */
  estilo?: "flutuante" | "contorno";
  className?: string;
}

export function BotaoFavorito({ movel, estilo = "flutuante", className }: Props) {
  const favorito = useEhFavorito(movel.id);
  const alternar = useFavoritos((e) => e.alternar);
  const navegar = useNavigate();

  function aoClicar(evento: React.MouseEvent) {
    // O cartão inteiro é um link: o coração não pode navegar.
    evento.preventDefault();
    evento.stopPropagation();
    const agora = alternar(movel);
    toast(agora ? "Salvo nos favoritos" : "Removido dos favoritos", {
      description: movel.nome,
      ...(agora ? { action: { label: "Ver favoritos", onClick: () => navegar("/favoritos") } } : {}),
    });
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={favorito}
      aria-label={favorito ? `Remover ${movel.nome} dos favoritos` : `Salvar ${movel.nome} nos favoritos`}
      title={favorito ? "Remover dos favoritos" : "Salvar nos favoritos"}
      className={cn(
        "grid place-items-center transition-[transform,background-color,color] duration-150 ease-mola active:scale-90",
        estilo === "flutuante"
          ? "size-10 rounded-full bg-superficie/90 shadow-carta backdrop-blur hover:bg-superficie"
          : "size-11 rounded-xl border border-borda-forte bg-superficie hover:bg-tinta-50",
        favorito ? "text-erro" : "text-texto-2 hover:text-erro",
        className,
      )}
    >
      <Heart aria-hidden className={cn("size-5", favorito && "fill-current")} />
    </button>
  );
}
