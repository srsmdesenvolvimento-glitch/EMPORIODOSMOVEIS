import { medida } from "@/shared/lib/utils";

interface Props {
  altura: number | null;
  largura: number | null;
  profundidade: number | null;
}

/**
 * Desenho do móvel em proporção real, com as três cotas.
 *
 * Um número solto ("162 × 201 × 47") obriga o cliente a imaginar o volume.
 * O desenho mostra de relance se a peça é alta e estreita ou baixa e comprida
 * — a dúvida que mais trava a compra de móvel pela internet.
 */
export function DiagramaMedidas({ altura, largura, profundidade }: Props) {
  if (!altura || !largura) return null;
  const prof = profundidade ?? Math.min(largura, altura) * 0.3;

  // Perspectiva cavaleira: frente em verdadeira grandeza, fundo a 45° pela metade.
  const recuo = prof * 0.5 * Math.SQRT1_2;
  const areaUtil = { l: 250, a: 170 };
  const escala = Math.min(areaUtil.l / (largura + recuo), areaUtil.a / (altura + recuo));
  const L = largura * escala;
  const A = altura * escala;
  const R = recuo * escala;

  const x0 = 46 + (areaUtil.l - (L + R)) / 2;
  const y0 = 22 + (areaUtil.a - (A + R)) / 2 + R;

  const frente = `M${x0},${y0} h${L} v${A} h${-L} z`;
  const topo = `M${x0},${y0} l${R},${-R} h${L} l${-R},${R} z`;
  const lado = `M${x0 + L},${y0} l${R},${-R} v${A} l${-R},${R} z`;

  return (
    <figure className="grid gap-3">
      <svg
        viewBox="0 0 340 240"
        role="img"
        aria-label={`Proporções do móvel: ${medida(largura)} de largura, ${medida(altura)} de altura${
          profundidade ? ` e ${medida(profundidade)} de profundidade` : ""
        }`}
        className="h-auto w-full max-w-md"
      >
        <path d={topo} className="fill-marca-100 stroke-tinta-400" strokeWidth={1.2} />
        <path d={lado} className="fill-marca-200 stroke-tinta-400" strokeWidth={1.2} />
        <path d={frente} className="fill-tinta-0 stroke-tinta-700" strokeWidth={1.5} />

        {/* cota da altura, à esquerda */}
        <g className="stroke-tinta-500" strokeWidth={1}>
          <line x1={x0 - 14} y1={y0} x2={x0 - 14} y2={y0 + A} />
          <line x1={x0 - 19} y1={y0} x2={x0 - 9} y2={y0} />
          <line x1={x0 - 19} y1={y0 + A} x2={x0 - 9} y2={y0 + A} />
        </g>
        <text
          x={x0 - 20}
          y={y0 + A / 2}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-tinta-900 text-[11px] font-semibold"
        >
          {medida(altura)}
        </text>

        {/* cota da largura, embaixo */}
        <g className="stroke-tinta-500" strokeWidth={1}>
          <line x1={x0} y1={y0 + A + 14} x2={x0 + L} y2={y0 + A + 14} />
          <line x1={x0} y1={y0 + A + 9} x2={x0} y2={y0 + A + 19} />
          <line x1={x0 + L} y1={y0 + A + 9} x2={x0 + L} y2={y0 + A + 19} />
        </g>
        <text
          x={x0 + L / 2}
          y={y0 + A + 30}
          textAnchor="middle"
          className="fill-tinta-900 text-[11px] font-semibold"
        >
          {medida(largura)}
        </text>

        {/* cota da profundidade, na diagonal de cima */}
        {profundidade ? (
          <text
            x={x0 + L + R / 2 + 8}
            y={y0 - R / 2 - 4}
            className="fill-tinta-900 text-[11px] font-semibold"
          >
            {medida(profundidade)}
          </text>
        ) : null}
      </svg>
      <figcaption className="text-xs text-texto-3">
        Desenho em proporção real. Confira o espaço antes de fechar o pedido.
      </figcaption>
    </figure>
  );
}
