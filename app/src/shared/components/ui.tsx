import { Loader2 } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/utils";

/* ------------------------------------------------------------------ botão */

type Aparencia = "solido" | "marca" | "contorno" | "fantasma" | "zap" | "perigo";
type Tamanho = "sm" | "md" | "lg";

const APARENCIAS: Record<Aparencia, string> = {
  solido:
    "bg-tinta-950 text-tinta-0 hover:bg-tinta-800 active:bg-tinta-900 shadow-carta",
  marca:
    "bg-marca-500 text-tinta-950 hover:bg-marca-400 active:bg-marca-600 shadow-carta font-semibold",
  contorno:
    "bg-superficie text-texto border border-borda-forte hover:bg-tinta-50 active:bg-tinta-100",
  fantasma: "text-texto hover:bg-tinta-100 active:bg-tinta-200",
  zap: "bg-zap text-tinta-0 hover:bg-zap-forte active:bg-zap-forte shadow-carta font-semibold",
  perigo: "bg-erro text-tinta-0 hover:opacity-90 active:opacity-100 shadow-carta",
};

// min-h-11 = 44px: alvo de toque mínimo, não é número arbitrário.
const TAMANHOS: Record<Tamanho, string> = {
  sm: "min-h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "min-h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "min-h-12 px-6 text-base gap-2 rounded-xl",
};

/**
 * Mesmas classes do botão, para quando o elemento precisa ser um link de
 * verdade (`<Link>`, `<a href>`). Navegação é âncora, não botão: trocar isso
 * quebra abrir em nova aba, arrastar e o menu de contexto.
 */
export function classesBotao({
  aparencia = "solido",
  tamanho = "md",
  blocao = false,
  className,
}: {
  aparencia?: Aparencia;
  tamanho?: Tamanho;
  blocao?: boolean;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center font-medium select-none",
    "transition-[background-color,opacity,transform] duration-150 ease-saida",
    "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
    APARENCIAS[aparencia],
    TAMANHOS[tamanho],
    blocao && "w-full",
    className,
  );
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  aparencia?: Aparencia;
  tamanho?: Tamanho;
  carregando?: boolean;
  blocao?: boolean;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  {
    aparencia = "solido",
    tamanho = "md",
    carregando = false,
    blocao = false,
    className,
    children,
    disabled,
    type,
    ...resto
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classesBotao({ aparencia, tamanho, blocao, className })}
      {...resto}
    >
      {carregando ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          <span>Aguarde…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

/* ------------------------------------------------------------------ campos */

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  erro?: string | undefined;
  dica?: string | undefined;
  adorno?: ReactNode;
}

export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  { rotulo, erro, dica, adorno, className, id, ...resto },
  ref,
) {
  const idCampo = id ?? `campo-${rotulo.toLowerCase().replace(/\W+/g, "-")}`;
  const idErro = `${idCampo}-erro`;
  const idDica = `${idCampo}-dica`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={idCampo} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <div className="relative">
        {adorno ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-3"
          >
            {adorno}
          </span>
        ) : null}
        <input
          ref={ref}
          id={idCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={cn(erro && idErro, dica && idDica) || undefined}
          className={cn(
            "min-h-11 w-full rounded-xl border bg-superficie px-3 text-[16px] sm:text-sm",
            "text-texto placeholder:text-texto-3",
            "transition-colors duration-150",
            "focus:border-tinta-950 focus:outline-none focus-visible:outline-none",
            "disabled:bg-tinta-50 disabled:text-texto-3",
            adorno && "pl-9",
            erro ? "border-erro" : "border-borda-forte",
            className,
          )}
          {...resto}
        />
      </div>
      {dica && !erro ? (
        <p id={idDica} className="text-xs text-texto-3">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p id={idErro} role="alert" className="text-xs font-medium text-erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
});

interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo: string;
  erro?: string | undefined;
  dica?: string | undefined;
}

export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaTextoProps>(
  function AreaTexto({ rotulo, erro, dica, className, id, ...resto }, ref) {
    const idCampo = id ?? `area-${rotulo.toLowerCase().replace(/\W+/g, "-")}`;
    const idErro = `${idCampo}-erro`;
    return (
      <div className="grid gap-1.5">
        <label htmlFor={idCampo} className="text-sm font-medium text-texto">
          {rotulo}
        </label>
        <textarea
          ref={ref}
          id={idCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className={cn(
            "min-h-24 w-full rounded-xl border bg-superficie p-3 text-[16px] sm:text-sm",
            "text-texto placeholder:text-texto-3 transition-colors duration-150",
            "focus:border-tinta-950 focus:outline-none focus-visible:outline-none",
            erro ? "border-erro" : "border-borda-forte",
            className,
          )}
          {...resto}
        />
        {dica && !erro ? <p className="text-xs text-texto-3">{dica}</p> : null}
        {erro ? (
          <p id={idErro} role="alert" className="text-xs font-medium text-erro">
            {erro}
          </p>
        ) : null}
      </div>
    );
  },
);

interface SeletorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo: string;
  erro?: string | undefined;
}

export const Seletor = forwardRef<HTMLSelectElement, SeletorProps>(function Seletor(
  { rotulo, erro, className, id, children, ...resto },
  ref,
) {
  const idCampo = id ?? `sel-${rotulo.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={idCampo} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <select
        ref={ref}
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        className={cn(
          "min-h-11 w-full rounded-xl border bg-superficie px-3 text-[16px] sm:text-sm",
          "text-texto transition-colors duration-150",
          "focus:border-tinta-950 focus:outline-none focus-visible:outline-none",
          erro ? "border-erro" : "border-borda-forte",
          className,
        )}
        {...resto}
      >
        {children}
      </select>
      {erro ? (
        <p role="alert" className="text-xs font-medium text-erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
});

/* ------------------------------------------------------------------ selos */

type TomSelo = "marca" | "oferta" | "neutro" | "sucesso" | "info" | "aviso";

const TONS_SELO: Record<TomSelo, string> = {
  marca: "bg-marca-500 text-tinta-950",
  oferta: "bg-erro text-tinta-0",
  neutro: "bg-tinta-100 text-tinta-700",
  sucesso: "bg-sucesso-fraco text-sucesso",
  info: "bg-info-fraco text-info",
  aviso: "bg-marca-100 text-marca-900",
};

export function Selo({
  tom = "neutro",
  className,
  children,
}: {
  tom?: TomSelo;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        TONS_SELO[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------- carregamento */

export function Esqueleto({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("brilho-carregando rounded-lg", className)}
      {...resto}
    />
  );
}

export function Carregando({ rotulo = "Carregando" }: { rotulo?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-texto-2">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      <span className="text-sm">{rotulo}…</span>
    </div>
  );
}

/* ------------------------------------------------------------ vazio/erro */

export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-borda-forte bg-superficie px-6 py-14 text-center">
      {icone ? <div className="text-texto-3">{icone}</div> : null}
      <div className="grid gap-1">
        <p className="font-semibold text-texto">{titulo}</p>
        {descricao ? (
          <p className="mx-auto max-w-md text-sm text-texto-2">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </div>
  );
}

/* ---------------------------------------------------------------- cartão */

export function Cartao({ className, children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-borda bg-superficie shadow-carta",
        className,
      )}
      {...resto}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ interruptor */

export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  descricao,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: string;
  descricao?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-texto">{rotulo}</span>
        {descricao ? <span className="text-xs text-texto-2">{descricao}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={rotulo}
        onClick={() => aoMudar(!ligado)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-saida",
          ligado ? "bg-marca-500" : "bg-tinta-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-tinta-0 shadow-carta",
            "transition-transform duration-200 ease-mola",
            ligado ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
