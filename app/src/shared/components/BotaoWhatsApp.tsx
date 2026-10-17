import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";

/**
 * Botão flutuante de WhatsApp. Fica escondido no painel administrativo —
 * lá o contexto é outro.
 */
export function BotaoWhatsApp() {
  const config = useConfigSite();
  const local = useLocation();

  if (local.pathname.startsWith("/painel")) return null;
  // Na página do móvel a barra fixa já tem o WhatsApp; no desktop ele volta.
  const naPaginaDeProduto = local.pathname.startsWith("/produto/");
  if (!config.whatsapp) return null;

  return (
    <a
      href={linkWhatsApp(
        config.whatsapp,
        "Olá! Vim pelo site do Empório dos Móveis e quero falar com nosso time.",
      )}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Falar com nosso time no WhatsApp"
      className={`${naPaginaDeProduto ? "hidden lg:grid" : "grid"} fixed bottom-20 lg:bottom-4 right-4 z-40 size-14 place-items-center rounded-full bg-zap text-tinta-0 shadow-suspenso transition-[transform,background-color] duration-200 ease-mola hover:bg-zap-forte hover:scale-105 active:scale-95 motion-reduce:hover:scale-100`}
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <MessageCircle aria-hidden className="size-7" />
    </a>
  );
}
