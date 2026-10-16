import { ArrowRight, FileSignature, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { classesBotao } from "@/shared/components/ui";
import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";

import { MENSAGEM_PROMISSORIA, PASSOS_PROMISSORIA } from "./conteudo";

/**
 * Seção da home dedicada à venda na promissória — o diferencial da loja.
 * Título e texto vêm do painel; se o destaque for desligado lá, ela some.
 */
export function SecaoPromissoria() {
  const config = useConfigSite();
  if (!config.promissoria_ativa) return null;

  return (
    <section aria-labelledby="titulo-promissoria" className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <div
        data-escuro
        className="grid gap-8 overflow-hidden rounded-[2rem] bg-tinta-950 p-6 text-tinta-0 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:p-14"
      >
        <div className="grid content-center gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-marca-500 px-3.5 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-tinta-950">
            <FileSignature aria-hidden className="size-4" />
            Sem cartão de crédito
          </span>
          <h2 id="titulo-promissoria" className="titulo text-3xl sm:text-4xl lg:text-5xl">
            {config.promissoria_titulo}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-tinta-300">
            {config.promissoria_texto}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {config.whatsapp ? (
              <a
                href={linkWhatsApp(config.whatsapp, MENSAGEM_PROMISSORIA)}
                target="_blank"
                rel="noreferrer noopener"
                className={classesBotao({ aparencia: "marca", tamanho: "lg" })}
              >
                <MessageCircle aria-hidden className="size-5" />
                Quero comprar na promissória
              </a>
            ) : null}
            <Link
              to="/promissoria"
              className={classesBotao({
                aparencia: "contorno",
                tamanho: "lg",
                className: "border-tinta-700 bg-transparent text-tinta-0 hover:bg-tinta-800",
              })}
            >
              Como funciona
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>

        <ol className="grid content-center gap-3">
          {PASSOS_PROMISSORIA.map((passo, i) => (
            <li
              key={passo.titulo}
              className="flex gap-4 rounded-2xl bg-tinta-900 p-4 ring-1 ring-tinta-800 sm:p-5"
            >
              <span className="titulo grid size-11 shrink-0 place-items-center rounded-full bg-marca-500 text-xl text-tinta-950">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-tinta-0">{passo.titulo}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-tinta-400">
                  {passo.texto}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
