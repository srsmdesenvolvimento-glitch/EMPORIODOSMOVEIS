import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Foto } from "@/shared/components/Foto";
import type { ImagemProduto } from "@/shared/lib/esquemas";
import { cn } from "@/shared/lib/utils";

interface Props {
  fotos: ImagemProduto[];
  nome: string;
  indice: number;
  aoMudar: (indice: number) => void;
  /** Legenda da foto em exibição (ex.: o acabamento que ela mostra). */
  legenda?: string | null;
}

/**
 * Galeria do móvel.
 *
 * Um único trilho com encaixe de rolagem atende os dois mundos: no celular o
 * dedo desliza de uma foto para a outra; no desktop as setas e as miniaturas
 * fazem o mesmo trilho rolar. Passar o mouse amplia o detalhe sob o cursor, e
 * um clique abre a foto em tela cheia.
 */
export function Galeria({ fotos, nome, indice, aoMudar, legenda }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  // Quando a mudança de foto NASCE da rolagem do usuário, o efeito abaixo não
  // deve rolar de novo — isso brigaria com o dedo ainda em movimento.
  const veioDaRolagem = useRef(false);
  const ignorarRolagemAte = useRef(0);
  const [telaCheia, setTelaCheia] = useState(false);

  const total = fotos.length;
  const atual = Math.min(indice, Math.max(0, total - 1));

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    if (veioDaRolagem.current) {
      veioDaRolagem.current = false;
      return;
    }
    const alvo = el.clientWidth * atual;
    if (Math.abs(el.scrollLeft - alvo) < 4) return;
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ignorarRolagemAte.current = performance.now() + 700;
    el.scrollTo({ left: alvo, behavior: semMovimento ? "auto" : "smooth" });
  }, [atual]);

  function aoRolar() {
    const el = trilho.current;
    if (!el || performance.now() < ignorarRolagemAte.current) return;
    const visivel = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (visivel !== atual && visivel >= 0 && visivel < total) {
      veioDaRolagem.current = true;
      aoMudar(visivel);
    }
  }

  const ir = useCallback(
    (passo: number) => aoMudar((atual + passo + total) % total),
    [atual, total, aoMudar],
  );

  /** O ponto de origem do zoom segue o cursor, sem re-renderizar a cada pixel. */
  function seguirCursor(evento: React.MouseEvent<HTMLButtonElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - caixa.left) / caixa.width) * 100;
    const y = ((evento.clientY - caixa.top) / caixa.height) * 100;
    evento.currentTarget.style.setProperty("--zoom-x", `${x}%`);
    evento.currentTarget.style.setProperty("--zoom-y", `${y}%`);
  }

  if (total === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-3xl border border-borda bg-superficie text-sm text-texto-3 sm:aspect-[4/3]">
        sem foto
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[4.75rem_minmax(0,1fr)] lg:items-start">
      {total > 1 ? (
        <ul
          aria-label="Fotos do móvel"
          className="trilho-x order-2 flex gap-2 lg:order-1 lg:max-h-[34rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible"
        >
          {fotos.map((foto, i) => (
            <li key={foto.id} className="shrink-0">
              <button
                type="button"
                onClick={() => aoMudar(i)}
                aria-label={`Ver foto ${i + 1} de ${total}`}
                aria-current={i === atual}
                className={cn(
                  "grid size-16 place-items-center overflow-hidden rounded-xl border-2 bg-superficie transition-[border-color,opacity] duration-150 lg:size-[4.75rem]",
                  i === atual
                    ? "border-tinta-950"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Foto
                  src={foto.url}
                  alt=""
                  width={76}
                  height={76}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-contain p-1"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative order-1 lg:order-2">
        <div
          ref={trilho}
          onScroll={aoRolar}
          className="galeria-trilho flex aspect-square rounded-3xl border border-borda bg-superficie sm:aspect-[4/3]"
        >
          {fotos.map((foto, i) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => setTelaCheia(true)}
              onMouseMove={seguirCursor}
              aria-label={`Ampliar foto ${i + 1} de ${total}`}
              // Fotos fora da tela não entram na ordem do Tab.
              tabIndex={i === atual ? 0 : -1}
              className="lupa relative grid size-full shrink-0 basis-full cursor-zoom-in place-items-center overflow-hidden"
              style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
            >
              <img
                src={foto.url}
                alt={i === 0 ? nome : `${nome} — foto ${i + 1}`}
                width={foto.largura ?? 1200}
                height={foto.altura ?? 900}
                // A primeira foto é o LCP da página; as demais esperam.
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="size-full object-contain p-3 sm:p-5"
              />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute right-3 top-3 hidden items-center gap-1.5 rounded-full bg-tinta-950/75 px-2.5 py-1 text-2xs font-medium text-tinta-0 backdrop-blur lg:inline-flex">
          <Expand aria-hidden className="size-3" />
          Clique para ampliar
        </span>

        {legenda ? (
          <span className="pointer-events-none absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-superficie/95 px-3 py-1 text-xs font-medium text-texto shadow-carta backdrop-blur">
            {legenda}
          </span>
        ) : null}

        {total > 1 ? (
          <>
            <span
              aria-live="polite"
              className="absolute bottom-3 right-3 rounded-full bg-tinta-950/75 px-2.5 py-1 text-2xs font-semibold tabular-nums text-tinta-0 backdrop-blur"
            >
              {atual + 1} / {total}
            </span>
            <BotaoSeta lado="esquerda" aoClicar={() => ir(-1)} />
            <BotaoSeta lado="direita" aoClicar={() => ir(1)} />
          </>
        ) : null}
      </div>

      <TelaCheia
        aberta={telaCheia}
        aoFechar={() => setTelaCheia(false)}
        fotos={fotos}
        nome={nome}
        atual={atual}
        ir={ir}
      />
    </div>
  );
}

function BotaoSeta({
  lado,
  aoClicar,
  claro = true,
}: {
  lado: "esquerda" | "direita";
  aoClicar: () => void;
  claro?: boolean;
}) {
  const Icone = lado === "esquerda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full shadow-erguido transition-[background-color,transform] duration-150 active:scale-95",
        claro
          ? "bg-superficie/95 text-texto hover:bg-superficie"
          : "bg-tinta-950/70 text-tinta-0 ring-1 ring-tinta-0/30 hover:bg-tinta-950",
        lado === "esquerda" ? "left-3" : "right-3",
      )}
    >
      <Icone aria-hidden className="size-5" />
    </button>
  );
}

function TelaCheia({
  aberta,
  aoFechar,
  fotos,
  nome,
  atual,
  ir,
}: {
  aberta: boolean;
  aoFechar: () => void;
  fotos: ImagemProduto[];
  nome: string;
  atual: number;
  ir: (passo: number) => void;
}) {
  useEffect(() => {
    if (!aberta) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "ArrowLeft") ir(-1);
      if (evento.key === "ArrowRight") ir(1);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberta, ir]);

  const foto = fotos[atual];

  return (
    <Dialog.Root open={aberta} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-tinta-950/95" />
        <Dialog.Popup
          data-escuro
          className="fixed inset-0 z-[71] flex flex-col outline-none"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Dialog.Title className="polegadas truncate text-sm font-medium text-tinta-100">
              {nome}
              {fotos.length > 1 ? (
                <span className="ml-2 tabular-nums text-tinta-400">
                  {atual + 1} / {fotos.length}
                </span>
              ) : null}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-tinta-0/10 text-tinta-0 transition-colors hover:bg-tinta-0/20"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>

          <div className="relative min-h-0 flex-1 px-2 pb-4 sm:px-16">
            {foto ? (
              <img
                key={foto.id}
                src={foto.url}
                alt={`${nome} — foto ${atual + 1}`}
                className="surgir mx-auto size-full rounded-xl bg-tinta-0 object-contain"
              />
            ) : null}
            {fotos.length > 1 ? (
              <>
                <BotaoSeta lado="esquerda" aoClicar={() => ir(-1)} claro={false} />
                <BotaoSeta lado="direita" aoClicar={() => ir(1)} claro={false} />
              </>
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
