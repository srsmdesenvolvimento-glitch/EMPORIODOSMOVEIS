import { ArrowRight, FileSignature, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import {
  MENSAGEM_PROMISSORIA,
  PASSOS_PROMISSORIA,
  PERGUNTAS_PROMISSORIA,
} from "@/features/promissoria/conteudo";
import { SimuladorPromissoria } from "@/features/promissoria/SimuladorPromissoria";
import { classesBotao } from "@/shared/components/ui";
import { trilhaEstruturada, useSeo } from "@/shared/lib/seo";
import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";

export default function Promissoria() {
  const config = useConfigSite();
  const cidade = config.cidade ? ` em ${config.cidade.split(/[-,]/)[0]?.trim()}` : "";
  const condicoes = config.promissoria_condicoes
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  useSeo({
    titulo: `Móveis na promissória${cidade}`,
    descricao: `Compre móveis na promissória${cidade}, sem cartão de crédito: parcelamento direto com a loja, cadastro simples e sujeito a análise. Veja como funciona.`,
    dadosEstruturados: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: PERGUNTAS_PROMISSORIA.map((item) => ({
          "@type": "Question",
          name: item.pergunta,
          acceptedAnswer: { "@type": "Answer", text: item.resposta },
        })),
      },
      trilhaEstruturada([
        { nome: "Início", caminho: "/" },
        { nome: "Compre na promissória", caminho: "/promissoria" },
      ]),
    ],
  });

  const linkZap = linkWhatsApp(config.whatsapp, MENSAGEM_PROMISSORIA);

  return (
    <>
      <section data-escuro className="bg-tinta-950 py-14 text-tinta-0 lg:py-20">
        <div className="mx-auto grid max-w-3xl gap-5 px-4 lg:px-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-marca-500 px-3.5 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-tinta-950">
            <FileSignature aria-hidden className="size-4" />
            Sem cartão de crédito
          </span>
          <h1 className="titulo text-4xl sm:text-5xl">
            Móveis na promissória{cidade}, direto com a loja
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-tinta-300">
            {config.promissoria_texto}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {config.whatsapp ? (
              <a
                href={linkZap}
                target="_blank"
                rel="noreferrer noopener"
                className={classesBotao({ aparencia: "marca", tamanho: "lg" })}
              >
                <MessageCircle aria-hidden className="size-5" />
                Quero comprar na promissória
              </a>
            ) : null}
            <Link
              to="/catalogo"
              className={classesBotao({
                aparencia: "contorno",
                tamanho: "lg",
                className: "border-tinta-700 bg-transparent text-tinta-0 hover:bg-tinta-800",
              })}
            >
              Escolher os móveis
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Simulador Interativo */}
      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <SimuladorPromissoria />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <h2 className="titulo text-3xl text-texto">Como funciona</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {PASSOS_PROMISSORIA.map((passo, i) => (
            <li
              key={passo.titulo}
              className="grid content-start gap-3 rounded-3xl border border-borda bg-superficie p-5 shadow-carta"
            >
              <span className="titulo grid size-11 place-items-center rounded-full bg-marca-500 text-xl text-tinta-950">
                {i + 1}
              </span>
              <h3 className="font-semibold text-texto">{passo.titulo}</h3>
              <p className="text-sm leading-relaxed text-texto-2">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 lg:px-6">
        <div className="grid gap-4 rounded-3xl bg-marca-50 p-6 ring-1 ring-marca-200 lg:p-8">
          <h2 className="titulo text-2xl text-texto">Condições</h2>
          {condicoes.length > 0 ? (
            <ul className="grid gap-2">
              {condicoes.map((linha) => (
                <li key={linha} className="flex items-start gap-2.5 text-sm text-texto">
                  <span
                    aria-hidden
                    className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-marca-600"
                  />
                  {linha}
                </li>
              ))}
            </ul>
          ) : (
            <p className="max-w-2xl text-sm leading-relaxed text-texto-2">
              Entrada, número de parcelas e documentos são definidos de acordo com o
              seu pedido e informados no atendimento, antes de qualquer assinatura.
            </p>
          )}
          <p className="text-xs text-texto-3">
            Venda sujeita a análise de cadastro e aprovação da loja.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 lg:px-6">
        <h2 className="titulo text-3xl text-texto">Perguntas frequentes</h2>
        <div className="mt-5 grid gap-2">
          {PERGUNTAS_PROMISSORIA.map((item) => (
            <details
              key={item.pergunta}
              className="group rounded-2xl border border-borda bg-superficie px-5 open:shadow-carta"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-texto [&::-webkit-details-marker]:hidden">
                {item.pergunta}
                <span
                  aria-hidden
                  className="text-xl leading-none text-texto-3 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-texto-2">{item.resposta}</p>
            </details>
          ))}
        </div>

        {config.whatsapp ? (
          <div className="mt-8 grid justify-items-start gap-3 rounded-3xl border border-borda bg-superficie p-6">
            <p className="titulo text-2xl text-texto">Ficou alguma dúvida?</p>
            <p className="text-sm text-texto-2">
              Fale com a loja e receba as condições para o seu pedido.
            </p>
            <a
              href={linkZap}
              target="_blank"
              rel="noreferrer noopener"
              className={classesBotao({ aparencia: "zap", tamanho: "lg" })}
            >
              <MessageCircle aria-hidden className="size-5" />
              Falar com nosso time
            </a>
          </div>
        ) : null}
      </section>
    </>
  );
}
