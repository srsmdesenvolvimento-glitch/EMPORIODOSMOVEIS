import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClipboardList, Minus, Plus, Send, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Botao, EstadoVazio } from "@/shared/components/ui";
import { supabase } from "@/shared/lib/supabase";
import {
  linkWhatsApp,
  mensagemDeOrcamento,
  useConfigSite,
} from "@/shared/lib/site";
import { plural } from "@/shared/lib/utils";

import { useOrcamento } from "./store";

export function GavetaOrcamento() {
  const { itens, aberto, fechar, remover, mudarQuantidade, limpar } = useOrcamento();
  const config = useConfigSite();
  const menosMovimento = useReducedMotion();
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, fechar]);

  const totalPecas = itens.reduce((s, i) => s + i.quantidade, 0);

  async function enviarPeloWhatsApp() {
    if (itens.length === 0) return;
    setEnviando(true);
    // Registra o interesse antes de sair do site. Se falhar, o cliente segue
    // para o WhatsApp do mesmo jeito — o contato vale mais que o registro.
    try {
      await supabase.from("orcamentos").insert({
        nome: "Visitante do site",
        telefone: "não informado",
        origem: "catalogo",
        status: "novo",
        itens: itens.map((i) => ({
          produto_id: i.produto_id,
          nome: i.nome,
          cor: i.cor,
          quantidade: i.quantidade,
        })),
      });
    } catch {
      // segue o fluxo
    }
    const url = linkWhatsApp(config.whatsapp, mensagemDeOrcamento(itens));
    window.open(url, "_blank", "noopener,noreferrer");
    setEnviando(false);
    toast.success("Abrimos o WhatsApp com a sua lista");
  }

  const duracao = menosMovimento ? 0 : 0.28;

  return (
    <AnimatePresence>
      {aberto ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Lista de orçamento">
          <motion.button
            type="button"
            aria-label="Fechar lista"
            onClick={fechar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duracao }}
            className="absolute inset-0 bg-tinta-950/50 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: menosMovimento ? 0 : "100%", opacity: menosMovimento ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: menosMovimento ? 0 : "100%", opacity: menosMovimento ? 0 : 1 }}
            transition={{ duration: duracao, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-fundo shadow-suspenso"
          >
            <header className="flex items-center justify-between gap-3 border-b border-borda bg-superficie px-4 py-3">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-texto">
                  <ClipboardList aria-hidden className="size-5" />
                  Minha lista
                </h2>
                <p className="text-xs text-texto-2">
                  {totalPecas > 0
                    ? `${plural(totalPecas, "peça", "peças")} para orçar`
                    : "Nenhuma peça ainda"}
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar lista"
                className="grid size-11 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-tinta-100"
              >
                <X aria-hidden className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {itens.length === 0 ? (
                <EstadoVazio
                  icone={<ClipboardList aria-hidden className="size-8" />}
                  titulo="Sua lista está vazia"
                  descricao="Navegue pelo catálogo e toque no + dos móveis que te interessam. Depois mande tudo de uma vez pelo WhatsApp."
                  acao={
                    <Link
                      to="/catalogo"
                      onClick={fechar}
                      className="text-sm font-semibold text-marca-800 underline underline-offset-4"
                    >
                      Ver o catálogo
                    </Link>
                  }
                />
              ) : (
                <ul className="grid gap-3">
                  {itens.map((item) => (
                    <li
                      key={`${item.produto_id}-${item.cor ?? "padrao"}`}
                      className="flex gap-3 rounded-xl border border-borda bg-superficie p-3"
                    >
                      {item.imagem_url ? (
                        <img
                          src={item.imagem_url}
                          alt=""
                          width={64}
                          height={64}
                          loading="lazy"
                          className="size-16 shrink-0 rounded-lg border border-borda object-contain"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produto/${item.slug}`}
                          onClick={fechar}
                          className="polegadas line-clamp-2 text-sm font-medium text-texto hover:underline"
                        >
                          {item.nome}
                        </Link>
                        {item.cor ? (
                          <p className="mt-0.5 text-xs text-texto-2">Cor: {item.cor}</p>
                        ) : null}

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-borda-forte">
                            <button
                              type="button"
                              onClick={() =>
                                mudarQuantidade(item.produto_id, item.cor, item.quantidade - 1)
                              }
                              aria-label={`Diminuir quantidade de ${item.nome}`}
                              className="grid size-9 place-items-center rounded-l-lg text-texto-2 transition-colors hover:bg-tinta-100"
                            >
                              <Minus aria-hidden className="size-4" />
                            </button>
                            <span
                              aria-live="polite"
                              className="min-w-9 text-center text-sm font-semibold tabular-nums text-texto"
                            >
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                mudarQuantidade(item.produto_id, item.cor, item.quantidade + 1)
                              }
                              aria-label={`Aumentar quantidade de ${item.nome}`}
                              className="grid size-9 place-items-center rounded-r-lg text-texto-2 transition-colors hover:bg-tinta-100"
                            >
                              <Plus aria-hidden className="size-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => remover(item.produto_id, item.cor)}
                            aria-label={`Remover ${item.nome} da lista`}
                            className="ml-auto grid size-9 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {itens.length > 0 ? (
              <footer className="grid gap-2 border-t border-borda bg-superficie p-4">
                <p className="text-xs text-texto-2">
                  Os preços são negociados peça a peça. Mande a lista e a equipe
                  responde com a melhor condição.
                </p>
                <Botao
                  aparencia="zap"
                  tamanho="lg"
                  blocao
                  carregando={enviando}
                  onClick={enviarPeloWhatsApp}
                >
                  <Send aria-hidden className="size-4" />
                  Pedir orçamento no WhatsApp
                </Botao>
                <div className="flex items-center justify-between">
                  <Link
                    to="/contato"
                    onClick={fechar}
                    className="text-xs font-medium text-texto-2 underline underline-offset-4"
                  >
                    Prefiro enviar por formulário
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      limpar();
                      toast("Lista esvaziada");
                    }}
                    className="text-xs font-medium text-texto-3 underline underline-offset-4 hover:text-erro"
                  >
                    Esvaziar
                  </button>
                </div>
              </footer>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
