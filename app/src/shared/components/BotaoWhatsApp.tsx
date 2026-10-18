import { useLocation } from "react-router-dom";

import { IconeWhatsApp } from "@/shared/components/IconesSociais";
import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";

/**
 * Botão flutuante oficial de WhatsApp:
 * Ícone autêntico branco sobre gradiente esmeralda oficial com anel de pulso suave
 * e badge elegante no desktop.
 */
export function BotaoWhatsApp() {
  const config = useConfigSite();
  const local = useLocation();

  if (local.pathname.startsWith("/painel")) return null;
  // Na página do produto a barra fixa inferior já tem WhatsApp no mobile
  const naPaginaDeProduto = local.pathname.startsWith("/produto/");
  if (!config.whatsapp) return null;

  return (
    <div
      className={`${
        naPaginaDeProduto ? "hidden lg:flex" : "flex"
      } fixed right-4 sm:right-6 z-40 items-center gap-2.5 pointer-events-none max-lg:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-6`}
    >
      {/* Badge elegante no Desktop */}
      <span className="hidden lg:flex pointer-events-auto items-center gap-2 rounded-full bg-tinta-950/90 backdrop-blur-md border border-tinta-700/80 px-3.5 py-1.5 text-xs font-bold text-tinta-0 shadow-suspenso transition-transform hover:scale-105 hover:border-marca-500">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25D366] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#25D366]" />
        </span>
        <span>Atendimento WhatsApp</span>
      </span>

      {/* Botão circular oficial WhatsApp */}
      <a
        href={linkWhatsApp(
          config.whatsapp,
          "Olá! Vim pelo site do Empório dos Móveis e gostaria de um atendimento personalizado.",
        )}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Falar com nosso time no WhatsApp"
        className="group pointer-events-auto relative grid size-14 sm:size-15 place-items-center rounded-full bg-gradient-to-tr from-[#1ebe57] to-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_36px_rgba(37,211,102,0.65)] transition-all duration-200 ease-mola hover:scale-110 active:scale-95"
      >
        {/* Anel de pulso sutil */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-[#25D366]/35 animate-ping -z-10"
        />
        <IconeWhatsApp className="size-7 sm:size-8 text-white drop-shadow-sm" />
      </a>
    </div>
  );
}
