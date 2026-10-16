import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  enviarImagem,
  useCategoriasAdmin,
  useProdutoAdmin,
  useSalvarProduto,
} from "@/features/admin/api";
import {
  AreaTexto,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Interruptor,
  Seletor,
} from "@/shared/components/ui";
import {
  esquemaFormProduto,
  type DadosFormProduto,
  type EntradaFormProduto,
} from "@/features/admin/esquemas";
import { mensagemDeErro, supabase } from "@/shared/lib/supabase";
import { cn, slugificar } from "@/shared/lib/utils";

export default function PainelProdutoEditar() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const criando = id === "novo";

  const consulta = useProdutoAdmin(criando ? undefined : id);
  const categorias = useCategoriasAdmin();
  const salvar = useSalvarProduto();

  const [specs, setSpecs] = useState<string[]>([]);
  const [codigos, setCodigos] = useState<string[]>([]);
  const [fotos, setFotos] = useState<{ id?: string; url: string }[]>([]);
  const [cores, setCores] = useState<{ id?: string; nome: string; imagem_url: string | null }[]>([]);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntradaFormProduto, unknown, DadosFormProduto>({
    resolver: zodResolver(esquemaFormProduto),
    defaultValues: {
      nome: "",
      slug: "",
      categoria_id: null,
      descricao: null,
      especificacoes: [],
      codigos: [],
      altura_cm: null,
      largura_cm: null,
      profundidade_cm: null,
      peso_kg: null,
      volumes: null,
      destaque: false,
      em_oferta: false,
      selo: null,
      ativo: true,
    },
  });

  const produto = consulta.data;

  useEffect(() => {
    if (!produto) return;
    reset({
      nome: produto.nome,
      slug: produto.slug,
      categoria_id: produto.categoria_id,
      descricao: produto.descricao,
      especificacoes: produto.especificacoes,
      codigos: produto.codigos,
      altura_cm: produto.altura_cm,
      largura_cm: produto.largura_cm,
      profundidade_cm: produto.profundidade_cm,
      peso_kg: produto.peso_kg,
      volumes: produto.volumes,
      destaque: produto.destaque,
      em_oferta: produto.em_oferta,
      selo: produto.selo,
      ativo: produto.ativo,
    });
    setSpecs(produto.especificacoes);
    setCodigos(produto.codigos);
    setFotos(produto.produto_imagens.map((i) => ({ id: i.id, url: i.url })));
    setCores(
      produto.produto_cores.map((c) => ({
        id: c.id,
        nome: c.nome,
        imagem_url: c.imagem_url,
      })),
    );
  }, [produto, reset]);

  useEffect(() => {
    document.title = criando
      ? "Novo móvel — Painel"
      : `Editar ${produto?.nome ?? "móvel"} — Painel`;
  }, [criando, produto]);

  const emOferta = watch("em_oferta");

  async function aoEnviarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    if (arquivos.length === 0) return;
    setEnviando(true);
    try {
      for (const arquivo of arquivos) {
        const url = await enviarImagem(arquivo, "produtos");
        setFotos((atuais) => [...atuais, { url }]);
      }
      toast.success(arquivos.length === 1 ? "Foto enviada" : "Fotos enviadas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : mensagemDeErro(e));
    } finally {
      setEnviando(false);
      evento.target.value = "";
    }
  }

  async function gravar(dados: DadosFormProduto) {
    const campos = {
      ...dados,
      especificacoes: specs,
      codigos,
      selo: dados.em_oferta ? (dados.selo || "Oferta") : null,
    };

    const idSalvo = await salvar.mutateAsync(
      criando ? { campos } : { id: id!, campos },
    );

    // Fotos e cores são tabelas próprias: regrava o conjunto inteiro, que é
    // mais simples e previsível do que diferenciar item a item.
    const { error: erroFotos } = await supabase
      .from("produto_imagens")
      .delete()
      .eq("produto_id", idSalvo);
    if (erroFotos) {
      toast.error(mensagemDeErro(erroFotos));
      return;
    }
    if (fotos.length > 0) {
      const { error } = await supabase.from("produto_imagens").insert(
        fotos.map((f, i) => ({
          produto_id: idSalvo,
          url: f.url,
          alt: dados.nome,
          ordem: i,
        })),
      );
      if (error) {
        toast.error(mensagemDeErro(error));
        return;
      }
    }

    await supabase.from("produto_cores").delete().eq("produto_id", idSalvo);
    const coresValidas = cores.filter((c) => c.nome.trim());
    if (coresValidas.length > 0) {
      await supabase.from("produto_cores").insert(
        coresValidas.map((c, i) => ({
          produto_id: idSalvo,
          nome: c.nome.trim(),
          imagem_url: c.imagem_url,
          ordem: i,
        })),
      );
    }

    navegar("/painel/produtos");
  }

  if (!criando && consulta.isPending) return <Carregando rotulo="Carregando móvel" />;

  return (
    <form onSubmit={handleSubmit(gravar)} className="grid max-w-4xl gap-5" noValidate>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/painel/produtos"
            className="mb-1 inline-flex items-center gap-1.5 text-sm text-texto-2 hover:text-texto"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-texto">
            {criando ? "Novo móvel" : produto?.nome}
          </h1>
        </div>
        <Botao
          type="submit"
          aparencia="marca"
          carregando={isSubmitting || salvar.isPending}
        >
          <Save aria-hidden className="size-4" />
          Salvar
        </Botao>
      </header>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Identificação</h2>
        <Campo
          rotulo="Nome do móvel"
          erro={errors.nome?.message}
          {...register("nome", {
            onChange: (e) => {
              if (criando) setValue("slug", slugificar(e.target.value));
            },
          })}
        />
        <Campo
          rotulo="Endereço no site"
          dica="Aparece na URL: /produto/nome-do-movel"
          erro={errors.slug?.message}
          {...register("slug")}
        />
        <Seletor
          rotulo="Categoria"
          erro={errors.categoria_id?.message}
          {...register("categoria_id", {
            setValueAs: (v: string) => (v === "" ? null : v),
          })}
        >
          <option value="">Sem categoria</option>
          {(categorias.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Seletor>
        <AreaTexto
          rotulo="Descrição (opcional)"
          rows={3}
          placeholder="Um parágrafo sobre o móvel, para o cliente entender o que ele é."
          {...register("descricao", { setValueAs: (v: string) => v || null })}
        />
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-texto">Fotos</h2>
          <label className="cursor-pointer">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-borda-forte px-3 text-sm font-medium text-texto transition-colors hover:bg-tinta-50">
              <ImagePlus aria-hidden className="size-4" />
              {enviando ? "Enviando…" : "Adicionar fotos"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={aoEnviarArquivo}
              disabled={enviando}
              className="sr-only"
            />
          </label>
        </div>

        {fotos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda-forte px-4 py-8 text-center text-sm text-texto-3">
            Nenhuma foto ainda. A primeira vira a capa do móvel no catálogo.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {fotos.map((foto, i) => (
              <li key={foto.url} className="relative">
                <div className="moldura-foto aspect-square rounded-lg border border-borda">
                  <img
                    src={foto.url}
                    alt=""
                    width={120}
                    height={120}
                    loading="lazy"
                    className="size-full object-contain p-1"
                  />
                </div>
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-marca-500 px-1.5 py-0.5 text-2xs font-bold text-tinta-950">
                    capa
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFotos((a) => a.filter((_, k) => k !== i))}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-tinta-950/80 text-tinta-0 transition-colors hover:bg-erro"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Medidas e ficha técnica</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            rotulo="Altura (cm)"
            type="number"
            step="0.1"
            inputMode="decimal"
            erro={errors.altura_cm?.message}
            {...register("altura_cm", { setValueAs: paraNumero })}
          />
          <Campo
            rotulo="Largura (cm)"
            type="number"
            step="0.1"
            inputMode="decimal"
            erro={errors.largura_cm?.message}
            {...register("largura_cm", { setValueAs: paraNumero })}
          />
          <Campo
            rotulo="Profundidade (cm)"
            type="number"
            step="0.1"
            inputMode="decimal"
            erro={errors.profundidade_cm?.message}
            {...register("profundidade_cm", { setValueAs: paraNumero })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Peso (kg)"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register("peso_kg", { setValueAs: paraNumero })}
          />
          <Campo
            rotulo="Volumes (caixas)"
            type="number"
            inputMode="numeric"
            {...register("volumes", { setValueAs: paraNumero })}
          />
        </div>

        <ListaEditavel
          rotulo="Especificações"
          itens={specs}
          aoMudar={setSpecs}
          exemplo="Ex.: Gavetas com corrediças telescópicas"
        />
        <ListaEditavel
          rotulo="Códigos do fornecedor"
          itens={codigos}
          aoMudar={setCodigos}
          exemplo="Ex.: 5341"
        />
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Acabamentos</h2>
        <p className="-mt-2 text-sm text-texto-2">
          As cores que o cliente escolhe na página do móvel. Escolha a foto de cada
          uma: ao clicar na cor, o site mostra essa foto.
        </p>
        {cores.map((cor, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border border-borda p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Campo
                  rotulo={`Cor ${i + 1}`}
                  value={cor.nome}
                  onChange={(e) =>
                    setCores((a) =>
                      a.map((c, k) => (k === i ? { ...c, nome: e.target.value } : c)),
                    )
                  }
                  placeholder="Ex.: Cinamomo/Off white"
                />
              </div>
              <button
                type="button"
                onClick={() => setCores((a) => a.filter((_, k) => k !== i))}
                aria-label={`Remover cor ${i + 1}`}
                className="mb-0.5 grid size-11 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </div>

            {fotos.length > 0 ? (
              <div role="radiogroup" aria-label={`Foto da cor ${cor.nome || i + 1}`} className="flex flex-wrap gap-1.5">
                {fotos.map((foto, k) => {
                  const marcada = cor.imagem_url === foto.url;
                  return (
                    <button
                      key={foto.url}
                      type="button"
                      role="radio"
                      aria-checked={marcada}
                      aria-label={`Foto ${k + 1}`}
                      onClick={() =>
                        setCores((a) =>
                          a.map((c, j) =>
                            j === i ? { ...c, imagem_url: marcada ? null : foto.url } : c,
                          ),
                        )
                      }
                      className={cn(
                        "size-14 overflow-hidden rounded-lg border-2 bg-superficie transition-colors",
                        marcada ? "border-marca-600" : "border-borda hover:border-borda-forte",
                      )}
                    >
                      <img
                        src={foto.url}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        className="size-full object-contain p-0.5"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
        <Botao
          aparencia="contorno"
          onClick={() => setCores((a) => [...a, { nome: "", imagem_url: null }])}
          className="w-fit"
        >
          <Plus aria-hidden className="size-4" />
          Adicionar cor
        </Botao>
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Publicação</h2>
        <Interruptor
          ligado={watch("ativo")}
          aoMudar={(v) => setValue("ativo", v)}
          rotulo="Visível no site"
          descricao="Desligado, o móvel some do catálogo público."
        />
        <Interruptor
          ligado={watch("destaque")}
          aoMudar={(v) => setValue("destaque", v)}
          rotulo="Destacar na página inicial"
          descricao="Aparece na prateleira “Escolhas da loja”."
        />
        <Interruptor
          ligado={emOferta}
          aoMudar={(v) => setValue("em_oferta", v)}
          rotulo="Está em oferta"
          descricao="Entra na página de ofertas com selo no card."
        />
        {emOferta ? (
          <Campo
            rotulo="Texto do selo"
            placeholder="Oferta da semana"
            dica="Curto. Aparece sobre a foto do móvel."
            {...register("selo", { setValueAs: (v: string) => v || null })}
          />
        ) : null}
      </Cartao>

      <div className="flex justify-end gap-2">
        <Link to="/painel/produtos" className="inline-flex">
          <Botao aparencia="contorno">Cancelar</Botao>
        </Link>
        <Botao type="submit" aparencia="marca" carregando={isSubmitting || salvar.isPending}>
          <Save aria-hidden className="size-4" />
          Salvar móvel
        </Botao>
      </div>
    </form>
  );
}

function paraNumero(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ListaEditavel({
  rotulo,
  itens,
  aoMudar,
  exemplo,
}: {
  rotulo: string;
  itens: string[];
  aoMudar: (itens: string[]) => void;
  exemplo: string;
}) {
  const [novo, setNovo] = useState("");

  function incluir() {
    const limpo = novo.trim();
    if (!limpo) return;
    aoMudar([...itens, limpo]);
    setNovo("");
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-texto">{rotulo}</span>
      {itens.length > 0 ? (
        <ul className="grid gap-1.5">
          {itens.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-tinta-50 py-1.5 pl-3 pr-1 text-sm text-texto"
            >
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => aoMudar(itens.filter((_, k) => k !== i))}
                aria-label={`Remover ${item}`}
                className="grid size-8 place-items-center rounded text-texto-3 transition-colors hover:text-erro"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              incluir();
            }
          }}
          placeholder={exemplo}
          aria-label={`Novo item em ${rotulo}`}
          className="min-h-11 flex-1 rounded-xl border border-borda-forte bg-superficie px-3 text-sm text-texto placeholder:text-texto-3 focus:border-tinta-950 focus:outline-none"
        />
        <Botao aparencia="contorno" onClick={incluir}>
          <Plus aria-hidden className="size-4" />
        </Botao>
      </div>
    </div>
  );
}
