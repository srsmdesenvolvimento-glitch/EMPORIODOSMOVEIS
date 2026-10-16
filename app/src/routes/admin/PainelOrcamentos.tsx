import { MessageCircle, MessagesSquare, Phone } from "lucide-react";
import { useState } from "react";

import {
  useMudarStatusOrcamento,
  useOrcamentosAdmin,
} from "@/features/admin/api";
import { Cartao, Esqueleto, EstadoVazio, Selo } from "@/shared/components/ui";
import { linkWhatsApp, useConfigSite } from "@/shared/lib/site";
import { cn, dataHora } from "@/shared/lib/utils";

const ABAS = [
  { valor: "novo", rotulo: "Novos" },
  { valor: "em_atendimento", rotulo: "Em atendimento" },
  { valor: "fechado", rotulo: "Fechados" },
  { valor: "perdido", rotulo: "Perdidos" },
  { valor: "", rotulo: "Todos" },
];

const TONS: Record<string, "info" | "aviso" | "sucesso" | "neutro"> = {
  novo: "info",
  em_atendimento: "aviso",
  fechado: "sucesso",
  perdido: "neutro",
};

export default function PainelOrcamentos() {
  const [aba, setAba] = useState("novo");
  const orcamentos = useOrcamentosAdmin(aba);
  const mudarStatus = useMudarStatusOrcamento();
  const config = useConfigSite();

  const lista = orcamentos.data ?? [];

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-bold text-texto">Orçamentos</h1>
        <p className="mt-1 text-sm text-texto-2">
          Pedidos que chegaram pelo site e pela lista do catálogo.
        </p>
      </header>

      <div role="tablist" aria-label="Filtrar por situação" className="trilho-x flex gap-1.5">
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            role="tab"
            aria-selected={aba === a.valor}
            onClick={() => setAba(a.valor)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 text-sm transition-colors",
              aba === a.valor
                ? "bg-tinta-950 font-semibold text-tinta-0"
                : "border border-borda-forte bg-superficie text-texto hover:bg-tinta-50",
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {orcamentos.isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          icone={<MessagesSquare aria-hidden className="size-8" />}
          titulo="Nenhum orçamento aqui"
          descricao="Assim que um cliente enviar a lista pelo site, ele aparece nesta tela."
        />
      ) : (
        <ul className="grid gap-3">
          {lista.map((o) => (
            <li key={o.id}>
              <Cartao className="grid gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-texto">{o.nome}</p>
                    <p className="text-xs text-texto-3">
                      {dataHora(o.criado_em)} · via {o.origem}
                    </p>
                  </div>
                  <Selo tom={TONS[o.status] ?? "neutro"}>
                    {ABAS.find((a) => a.valor === o.status)?.rotulo ?? o.status}
                  </Selo>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-texto-2">
                  <a
                    href={`tel:${o.telefone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-1.5 hover:text-texto"
                  >
                    <Phone aria-hidden className="size-4" />
                    {o.telefone}
                  </a>
                  {o.cidade ? <span>{o.cidade}</span> : null}
                  {o.email ? <span className="break-all">{o.email}</span> : null}
                </div>

                {o.mensagem ? (
                  <p className="rounded-xl bg-tinta-50 p-3 text-sm text-texto-2">
                    {o.mensagem}
                  </p>
                ) : null}

                {o.itens.length > 0 ? (
                  <details className="rounded-xl border border-borda">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-texto">
                      {o.itens.length} {o.itens.length === 1 ? "móvel" : "móveis"} na lista
                    </summary>
                    <ul className="grid gap-1 border-t border-borda p-3">
                      {o.itens.map((item, i) => (
                        <li key={i} className="text-sm text-texto-2">
                          {item.quantidade}× {item.nome}
                          {item.cor ? ` · ${item.cor}` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-borda pt-3">
                  {config.whatsapp ? (
                    <a
                      href={linkWhatsApp(
                        o.telefone,
                        `Olá ${o.nome.split(" ")[0]}! Aqui é do Empório dos Móveis, sobre o seu orçamento.`,
                      )}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-zap px-3 text-sm font-semibold text-tinta-0 transition-colors hover:bg-zap-forte"
                    >
                      <MessageCircle aria-hidden className="size-4" />
                      Responder
                    </a>
                  ) : null}

                  <label className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-texto-2">Situação</span>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        mudarStatus.mutate({ id: o.id, status: e.target.value })
                      }
                      aria-label={`Situação do orçamento de ${o.nome}`}
                      className="min-h-10 rounded-lg border border-borda-forte bg-superficie px-2 text-sm text-texto focus:border-tinta-950 focus:outline-none"
                    >
                      {ABAS.filter((a) => a.valor).map((a) => (
                        <option key={a.valor} value={a.valor}>
                          {a.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
