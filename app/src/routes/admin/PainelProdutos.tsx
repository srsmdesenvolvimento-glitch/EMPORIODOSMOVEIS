import { Eye, EyeOff, Pencil, Plus, Search, Star, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  useAlternarCampo,
  useCategoriasAdmin,
  useProdutosAdmin,
  useRemoverProduto,
} from "@/features/admin/api";
import {
  Botao,
  Campo,
  Cartao,
  classesBotao,
  Esqueleto,
  EstadoVazio,
  Selo,
} from "@/shared/components/ui";
import { cn, plural } from "@/shared/lib/utils";

export default function PainelProdutos() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const categorias = useCategoriasAdmin();
  const produtos = useProdutosAdmin(busca, categoria);
  const alternar = useAlternarCampo();
  const remover = useRemoverProduto();

  const lista = produtos.data ?? [];

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-texto">Móveis</h1>
          <p className="mt-1 text-sm text-texto-2">
            {produtos.isPending
              ? "Carregando…"
              : plural(lista.length, "móvel no catálogo", "móveis no catálogo")}
          </p>
        </div>
        <Link to="/painel/produtos/novo" className={classesBotao({ aparencia: "marca" })}>
          <Plus aria-hidden className="size-4" />
          Novo móvel
        </Link>
      </header>

      <Cartao className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Campo
          rotulo="Buscar"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome do móvel…"
          adorno={<Search aria-hidden className="size-4" />}
        />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-texto">Categoria</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="min-h-11 rounded-xl border border-borda-forte bg-superficie px-3 text-sm text-texto focus:border-tinta-950 focus:outline-none"
          >
            <option value="">Todas</option>
            {(categorias.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </Cartao>

      {produtos.isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Esqueleto key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum móvel encontrado"
          descricao="Ajuste a busca ou cadastre uma peça nova."
        />
      ) : (
        <ul className="grid gap-2">
          {lista.map((p) => {
            const foto = p.produto_imagens[0]?.url;
            return (
              <li key={p.id}>
                <Cartao className="flex flex-wrap items-center gap-3 p-3">
                  <div className="moldura-foto size-16 shrink-0 rounded-lg border border-borda">
                    {foto ? (
                      <img
                        src={foto}
                        alt=""
                        width={64}
                        height={64}
                        loading="lazy"
                        className="size-full object-contain p-1"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="polegadas truncate font-medium text-texto">{p.nome}</p>
                    <p className="truncate text-xs text-texto-2">
                      {p.categorias?.nome ?? "sem categoria"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {!p.ativo ? <Selo tom="neutro">Oculto</Selo> : null}
                      {p.destaque ? <Selo tom="marca">Destaque</Selo> : null}
                      {p.em_oferta ? <Selo tom="oferta">{p.selo ?? "Oferta"}</Selo> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <BotaoAcao
                      titulo={p.ativo ? "Ocultar do site" : "Publicar no site"}
                      ativo={p.ativo}
                      onClick={() =>
                        alternar.mutate({ id: p.id, campo: "ativo", valor: !p.ativo })
                      }
                    >
                      {p.ativo ? (
                        <Eye aria-hidden className="size-4" />
                      ) : (
                        <EyeOff aria-hidden className="size-4" />
                      )}
                    </BotaoAcao>

                    <BotaoAcao
                      titulo={p.destaque ? "Tirar dos destaques" : "Pôr nos destaques"}
                      ativo={p.destaque}
                      onClick={() =>
                        alternar.mutate({ id: p.id, campo: "destaque", valor: !p.destaque })
                      }
                    >
                      <Star aria-hidden className="size-4" />
                    </BotaoAcao>

                    <BotaoAcao
                      titulo={p.em_oferta ? "Tirar da oferta" : "Pôr em oferta"}
                      ativo={p.em_oferta}
                      onClick={() =>
                        alternar.mutate({ id: p.id, campo: "em_oferta", valor: !p.em_oferta })
                      }
                    >
                      <Tag aria-hidden className="size-4" />
                    </BotaoAcao>

                    <Link
                      to={`/painel/produtos/${p.id}`}
                      title="Editar"
                      className="grid size-10 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-tinta-100"
                    >
                      <Pencil aria-hidden className="size-4" />
                      <span className="sr-only">Editar {p.nome}</span>
                    </Link>

                    <button
                      type="button"
                      title="Remover"
                      onClick={() => setConfirmando(p.id)}
                      className="grid size-10 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
                    >
                      <Trash2 aria-hidden className="size-4" />
                      <span className="sr-only">Remover {p.nome}</span>
                    </button>
                  </div>

                  {confirmando === p.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-erro-fraco px-3 py-2">
                      <p className="flex-1 text-sm font-medium text-erro">
                        Remover “{p.nome}” do catálogo? Isso apaga as fotos e cores dele.
                      </p>
                      <Botao
                        tamanho="sm"
                        aparencia="perigo"
                        carregando={remover.isPending}
                        onClick={() => {
                          remover.mutate(p.id);
                          setConfirmando(null);
                        }}
                      >
                        Sim, remover
                      </Botao>
                      <Botao
                        tamanho="sm"
                        aparencia="contorno"
                        onClick={() => setConfirmando(null)}
                      >
                        Cancelar
                      </Botao>
                    </div>
                  ) : null}
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BotaoAcao({
  titulo,
  ativo,
  onClick,
  children,
}: {
  titulo: string;
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "grid size-10 place-items-center rounded-lg transition-colors",
        ativo
          ? "bg-marca-100 text-marca-900 hover:bg-marca-200"
          : "text-texto-3 hover:bg-tinta-100",
      )}
    >
      {children}
      <span className="sr-only">{titulo}</span>
    </button>
  );
}
