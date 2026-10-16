import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  enviarImagem,
  useCategoriasAdmin,
  useRemoverCategoria,
  useSalvarCategoria,
} from "@/features/admin/api";
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  Interruptor,
  Selo,
  Seletor,
} from "@/shared/components/ui";
import { AMBIENTES, nomeDoAmbiente } from "@/shared/lib/ambientes";
import {
  type Categoria,
} from "@/shared/lib/esquemas";
import {
  esquemaFormCategoria,
  type DadosFormCategoria,
} from "@/features/admin/esquemas";
import { slugificar } from "@/shared/lib/utils";

export default function PainelCategorias() {
  const categorias = useCategoriasAdmin();
  const remover = useRemoverCategoria();
  const [editando, setEditando] = useState<Categoria | "nova" | null>(null);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-texto">Categorias</h1>
          <p className="mt-1 text-sm text-texto-2">
            As seções do catálogo e a ordem em que aparecem no site.
          </p>
        </div>
        <Botao aparencia="marca" onClick={() => setEditando("nova")}>
          <Plus aria-hidden className="size-4" />
          Nova categoria
        </Botao>
      </header>

      {editando ? (
        <FormCategoria
          categoria={editando === "nova" ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      ) : null}

      {categorias.isPending ? (
        <Esqueleto className="h-40 rounded-2xl" />
      ) : (
        <ul className="grid gap-2">
          {(categorias.data ?? []).map((c) => (
            <li key={c.id}>
              <Cartao className="flex items-center gap-3 p-3">
                <div className="moldura-foto size-14 shrink-0 rounded-lg border border-borda">
                  {c.imagem_url ? (
                    <img
                      src={c.imagem_url}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="size-full object-contain p-1"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-texto">{c.nome}</p>
                  <p className="truncate text-xs text-texto-3">/{c.slug}</p>
                </div>
                <Selo tom="aviso">{nomeDoAmbiente(c.ambiente) ?? "Sem ambiente"}</Selo>
                <Selo tom="neutro">ordem {c.ordem}</Selo>
                {!c.ativa ? <Selo tom="neutro">oculta</Selo> : null}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditando(c)}
                    aria-label={`Editar ${c.nome}`}
                    className="grid size-10 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-tinta-100"
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Remover a categoria “${c.nome}”? Os móveis dela ficam sem categoria.`,
                        )
                      ) {
                        remover.mutate(c.id);
                      }
                    }}
                    aria-label={`Remover ${c.nome}`}
                    className="grid size-10 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormCategoria({
  categoria,
  aoFechar,
}: {
  categoria: Categoria | null;
  aoFechar: () => void;
}) {
  const salvar = useSalvarCategoria();
  const [imagem, setImagem] = useState(categoria?.imagem_url ?? "");
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DadosFormCategoria>({
    resolver: zodResolver(esquemaFormCategoria),
    defaultValues: {
      nome: categoria?.nome ?? "",
      slug: categoria?.slug ?? "",
      descricao: categoria?.descricao ?? null,
      imagem_url: categoria?.imagem_url ?? null,
      ordem: categoria?.ordem ?? 0,
      ativa: categoria?.ativa ?? true,
      ambiente: (categoria?.ambiente as DadosFormCategoria["ambiente"] | undefined) ?? "outros",
    },
  });

  async function enviar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);
    try {
      const url = await enviarImagem(arquivo, "categorias");
      setImagem(url);
      setValue("imagem_url", url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio");
    } finally {
      setEnviando(false);
    }
  }

  async function gravar(dados: DadosFormCategoria) {
    await salvar.mutateAsync(
      categoria ? { id: categoria.id, campos: dados } : { campos: dados },
    );
    aoFechar();
  }

  return (
    <Cartao className="grid gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-texto">
          {categoria ? "Editar categoria" : "Nova categoria"}
        </h2>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="grid size-10 place-items-center rounded-lg text-texto-2 hover:bg-tinta-100"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(gravar)} className="grid gap-4" noValidate>
        <Campo
          rotulo="Nome"
          erro={errors.nome?.message}
          {...register("nome", {
            onChange: (e) => {
              if (!categoria) setValue("slug", slugificar(e.target.value));
            },
          })}
        />
        <Campo
          rotulo="Endereço no site"
          dica="Aparece na URL: /catalogo?categoria=…"
          erro={errors.slug?.message}
          {...register("slug")}
        />
        <Campo
          rotulo="Descrição (opcional)"
          {...register("descricao", { setValueAs: (v: string) => v || null })}
        />
        <Seletor
          rotulo="Ambiente"
          erro={errors.ambiente?.message}
          {...register("ambiente")}
        >
          {AMBIENTES.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.nome}
            </option>
          ))}
        </Seletor>
        <Campo
          rotulo="Ordem no menu"
          type="number"
          inputMode="numeric"
          {...register("ordem", { valueAsNumber: true })}
        />

        <div className="grid gap-2">
          <span className="text-sm font-medium text-texto">Imagem da categoria</span>
          {imagem ? (
            <img
              src={imagem}
              alt=""
              width={120}
              height={90}
              className="h-24 w-32 rounded-xl border border-borda object-contain"
            />
          ) : null}
          <label className="cursor-pointer">
            <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-borda-forte px-4 text-sm font-medium text-texto transition-colors hover:bg-tinta-50">
              <ImagePlus aria-hidden className="size-4" />
              {enviando ? "Enviando…" : imagem ? "Trocar" : "Enviar imagem"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={enviar}
              disabled={enviando}
              className="sr-only"
            />
          </label>
        </div>

        <Interruptor
          ligado={watch("ativa")}
          aoMudar={(v) => setValue("ativa", v)}
          rotulo="Categoria visível"
          descricao="Desligada, some do menu e dos filtros."
        />

        <div className="flex justify-end gap-2">
          <Botao aparencia="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" aparencia="marca" carregando={isSubmitting || salvar.isPending}>
            Salvar
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
