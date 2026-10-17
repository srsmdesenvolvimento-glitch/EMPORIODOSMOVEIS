import {
  Calculator,
  CheckCircle2,
  FileSignature,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { classesBotao } from "@/shared/components/ui";
import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";
import { cn } from "@/shared/lib/utils";

interface Props {
  valorInicial?: number;
  nomeProduto?: string;
  classeContainer?: string;
}

const PRESETS_VALOR = [1200, 2500, 4000, 6500, 10000];
const OPCOES_PARCELAS = [3, 6, 10, 12, 18];

export function SimuladorPromissoria({
  valorInicial = 2500,
  nomeProduto,
  classeContainer,
}: Props) {
  const config = useConfigSite();

  const [valor, setValor] = useState<number>(valorInicial);
  const [parcelas, setParcelas] = useState<number>(10);

  // Coeficiente aproximado de financiamento/crediário na promissória
  // Fator leve de juros mercadológicos de crediário próprio para estimativa
  const taxaEstimada = 0.028; // ~2.8% a.m.
  const valorParcela =
    (valor * (taxaEstimada * Math.pow(1 + taxaEstimada, parcelas))) /
    (Math.pow(1 + taxaEstimada, parcelas) - 1);

  const valorFormatado = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const parcelaFormatada = valorParcela.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const mensagemWhatsApp = [
    `*SIMULAÇÃO DE PROMISSÓRIA — EMPÓRIO DOS MÓVEIS* 📝`,
    nomeProduto ? `*Móvel:* ${nomeProduto}` : null,
    `*Valor Estimado:* ${valorFormatado}`,
    `*Parcelamento Pretendido:* ${parcelas}x de aproximadamente ${parcelaFormatada} na Promissória`,
    ``,
    `_Olá! Fiz essa simulação no site e quero consultar a aprovação do meu cadastro na promissória._`,
  ]
    .filter(Boolean)
    .join("\n");

  const linkZap = linkWhatsApp(config.whatsapp, mensagemWhatsApp);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-borda-forte bg-superficie p-5 shadow-erguido sm:p-7",
        classeContainer,
      )}
    >
      {/* Halo âmbar de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-marca-500/10 blur-3xl"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-marca-500 text-tinta-950 shadow-carta">
            <Calculator aria-hidden className="size-5" />
          </span>
          <div>
            <h3 className="titulo text-xl text-texto sm:text-2xl">
              Simulador de Promissória
            </h3>
            <p className="text-xs text-texto-2">
              Direto com a loja · Sem cartão de crédito
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-marca-500/20 px-3 py-1 text-2xs font-bold text-marca-900 ring-1 ring-marca-500/40">
          <FileSignature aria-hidden className="size-3.5" />
          Crediário Próprio
        </span>
      </header>

      {/* Controle de Valor */}
      <div className="mt-6 grid gap-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="slider-valor" className="text-xs font-semibold text-texto">
            Quanto você deseja investir?
          </label>
          <span className="titulo text-xl font-bold text-marca-800 sm:text-2xl">
            {valorFormatado}
          </span>
        </div>

        {/* Slider visual */}
        <input
          id="slider-valor"
          type="range"
          min={500}
          max={15000}
          step={200}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-tinta-200 accent-marca-500"
        />

        {/* Atalhos de valor rápido */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS_VALOR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValor(p)}
              className={cn(
                "rounded-xl px-2.5 py-1 text-2xs font-semibold transition-colors",
                valor === p
                  ? "bg-tinta-950 text-tinta-0"
                  : "border border-borda bg-fundo text-texto-2 hover:bg-tinta-100",
              )}
            >
              R$ {p.toLocaleString("pt-BR")}
            </button>
          ))}
        </div>
      </div>

      {/* Escolha de Parcelas */}
      <div className="mt-5 grid gap-2">
        <span className="text-xs font-semibold text-texto">
          Número de parcelas na promissória:
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {OPCOES_PARCELAS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setParcelas(n)}
              className={cn(
                "rounded-2xl border-2 py-2 text-center transition-all",
                parcelas === n
                  ? "border-tinta-950 bg-marca-500/20 font-bold text-tinta-950 shadow-carta"
                  : "border-borda text-texto-2 hover:border-borda-forte",
              )}
            >
              <span className="block text-sm sm:text-base font-bold">{n}x</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resultado do Cálculo */}
      <div className="mt-6 rounded-2xl border border-marca-500/50 bg-gradient-to-br from-marca-50 to-superficie p-4 text-center">
        <p className="text-2xs font-semibold uppercase tracking-wider text-texto-3">
          Estimativa de parcela
        </p>
        <p className="titulo my-1 text-3xl font-bold text-tinta-950 sm:text-4xl">
          {parcelas}x de <span className="text-marca-800">{parcelaFormatada}</span>
        </p>
        <p className="text-2xs text-texto-2">
          *Sujeito a análise de cadastro. Condições finais combinadas com nosso time.
        </p>
      </div>

      {/* Vantagens rápidas */}
      <ul className="mt-4 grid grid-cols-2 gap-2 text-2xs text-texto-2 sm:text-xs">
        <li className="flex items-center gap-1.5">
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-sucesso" />
          Sem consulta a cartão
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-sucesso" />
          Aprovação simplificada
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-sucesso" />
          Assine e combine entrega
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-sucesso" />
          Atendimento humanizado
        </li>
      </ul>

      {/* CTAs de Alta Conversão */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {config.whatsapp ? (
          <a
            href={linkZap}
            target="_blank"
            rel="noreferrer noopener"
            className={classesBotao({
              aparencia: "zap",
              tamanho: "lg",
              className: "flex-1 justify-center text-center font-bold shadow-erguido py-3.5",
            })}
          >
            <MessageCircle aria-hidden className="size-5" />
            Consultar Aprovação no WhatsApp
          </a>
        ) : null}

        <Link
          to="/promissoria"
          className={classesBotao({
            aparencia: "contorno",
            tamanho: "lg",
            className: "justify-center border-borda-forte bg-superficie text-texto hover:bg-tinta-50 shadow-carta",
          })}
        >
          <FileSignature aria-hidden className="size-5 text-marca-800" />
          Ver Como Funciona
        </Link>
      </div>
    </div>
  );
}
