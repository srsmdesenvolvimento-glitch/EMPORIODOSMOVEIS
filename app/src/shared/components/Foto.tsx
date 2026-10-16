import { useState, type ImgHTMLAttributes } from "react";

import { miniatura } from "@/shared/lib/imagens";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  /** Usa a versão leve (480 px). Padrão: sim. */
  leve?: boolean;
}

/**
 * Imagem do catálogo. Pede a miniatura e, se ela não existir (foto antiga
 * enviada pelo painel), cai para a original sem deixar buraco na tela.
 */
export function Foto({ src, leve = true, onError, ...resto }: Props) {
  const [falhou, setFalhou] = useState<string | null>(null);
  if (!src) return null;
  const preferida = leve ? miniatura(src) : src;
  const atual = falhou === src ? src : (preferida ?? src);
  return (
    <img
      {...resto}
      src={atual}
      onError={(evento) => {
        if (atual !== src) setFalhou(src);
        onError?.(evento);
      }}
    />
  );
}
