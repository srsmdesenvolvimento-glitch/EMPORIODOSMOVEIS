import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  enviarImagem,
  useBannersAdmin,
  useRemoverBanner,
  useSalvarBanner,
} from "@/features/admin/api";
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  EstadoVazio,
  Interruptor,
  Selo,
} from "@/shared/components/ui";
import {
  type Banner,
} from "@/shared/lib/esquemas";
import {
  esquemaFormBanner,
  type DadosFormBanner,
} from "@/features/admin/esquemas";
import { dataCurta } from "@/shared/lib/utils";

export default function PainelBanners() {
  const banners = useBannersAdmin();
  const remover = useRemoverBanner();
  const [editando, setEditando] = useState<Banner | "novo" | null>(null);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-texto">Banners</h1>
          <p className="mt-1 text-sm text-texto-2">
            O carrossel do topo da página inicial.
          </p>
        </div>
        <Botao aparencia="marca" onClick={() => setEditando("novo")}>
          <Plus aria-hidden className="size-4" />
          Novo banner
        </Botao>
      </header>

      {editando ? (
        <FormBanner
          banner={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      ) : null}

      {banners.isPending ? (
        <Esqueleto className="h-40 rounded-2xl" />
      ) : (banners.data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Nenhum banner cadastrado"
          descricao="Sem banner, a home mostra a capa padrão da loja."
        />
      ) : (
        <ul className="grid gap-3">
          {(banners.data ?? []).map((b) => (
            <li key={b.id}>
              <Cartao className="overflow-hidden">
                <img
                  src={b.imagem_url}
                  alt=""
                  width={1200}
                  height={300}
                  loading="lazy"
                  className="h-32 w-full object-cover sm:h-40"
                />
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-texto">{b.titulo}</p>
                    {b.subtitulo ? (
                      <p className="truncate text-sm text-texto-2">{b.subtitulo}</p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Selo tom={b.ativo ? "sucesso" : "neutro"}>
                        {b.ativo ? "No ar" : "Pausado"}
                      </Selo>
                      {b.termina_em ? (
                        <Selo tom="aviso">até {dataCurta(b.termina_em)}</Selo>
                      ) : null}
                      <Selo tom="neutro">ordem {b.ordem}</Selo>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditando(b)}
                      aria-label={`Editar ${b.titulo}`}
                      className="grid size-10 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-tinta-100"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover o banner “${b.titulo}”?`)) remover.mutate(b.id);
                      }}
                      aria-label={`Remover ${b.titulo}`}
                      className="grid size-10 place-items-center rounded-lg text-texto-3 transition-colors hover:bg-erro-fraco hover:text-erro"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormBanner({ banner, aoFechar }: { banner: Banner | null; aoFechar: () => void }) {
  const salvar = useSalvarBanner();
  const [imagem, setImagem] = useState(banner?.imagem_url ?? "");
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DadosFormBanner>({
    resolver: zodResolver(esquemaFormBanner),
    defaultValues: {
      titulo: banner?.titulo ?? "",
      subtitulo: banner?.subtitulo ?? null,
      texto_botao: banner?.texto_botao ?? "Ver ofertas",
      link: banner?.link ?? "/ofertas",
      imagem_url: banner?.imagem_url ?? "",
      imagem_mobile_url: banner?.imagem_mobile_url ?? null,
      ativo: banner?.ativo ?? true,
      ordem: banner?.ordem ?? 0,
      inicia_em: banner?.inicia_em ?? null,
      termina_em: banner?.termina_em ?? null,
    },
  });

  async function enviar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);
    try {
      const url = await enviarImagem(arquivo, "banners");
      setImagem(url);
      setValue("imagem_url", url, { shouldValidate: true });
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio");
    } finally {
      setEnviando(false);
    }
  }

  async function gravar(dados: DadosFormBanner) {
    await salvar.mutateAsync(
      banner ? { id: banner.id, campos: dados } : { campos: dados },
    );
    aoFechar();
  }

  return (
    <Cartao className="grid gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-texto">
          {banner ? "Editar banner" : "Novo banner"}
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
        <div className="grid gap-2">
          <span className="text-sm font-medium text-texto">Imagem do banner</span>
          {imagem ? (
            <img
              src={imagem}
              alt=""
              width={800}
              height={200}
              className="h-32 w-full rounded-xl border border-borda object-cover"
            />
          ) : null}
          <label className="cursor-pointer">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-borda-forte px-4 text-sm font-medium text-texto transition-colors hover:bg-tinta-50">
              <ImagePlus aria-hidden className="size-4" />
              {enviando ? "Enviando…" : imagem ? "Trocar imagem" : "Enviar imagem"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={enviar}
              disabled={enviando}
              className="sr-only"
            />
          </label>
          {errors.imagem_url ? (
            <p role="alert" className="text-xs font-medium text-erro">
              {errors.imagem_url.message}
            </p>
          ) : null}
          <p className="text-xs text-texto-3">
            Use uma imagem larga (1600×600 ou parecido) para não cortar no desktop.
          </p>
        </div>

        <Campo rotulo="Título" erro={errors.titulo?.message} {...register("titulo")} />
        <Campo
          rotulo="Subtítulo"
          {...register("subtitulo", { setValueAs: (v: string) => v || null })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Texto do botão"
            {...register("texto_botao", { setValueAs: (v: string) => v || null })}
          />
          <Campo
            rotulo="Para onde leva"
            dica="Ex.: /ofertas ou /catalogo?categoria=roupeiros"
            {...register("link", { setValueAs: (v: string) => v || null })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            rotulo="Ordem"
            type="number"
            inputMode="numeric"
            {...register("ordem", { valueAsNumber: true })}
          />
          <Campo
            rotulo="Começa em (opcional)"
            type="date"
            {...register("inicia_em", { setValueAs: (v: string) => v || null })}
          />
          <Campo
            rotulo="Termina em (opcional)"
            type="date"
            {...register("termina_em", { setValueAs: (v: string) => v || null })}
          />
        </div>

        <Interruptor
          ligado={watch("ativo")}
          aoMudar={(v) => setValue("ativo", v)}
          rotulo="Banner no ar"
          descricao="Desligado, ele some do carrossel sem ser apagado."
        />

        <div className="flex justify-end gap-2">
          <Botao aparencia="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" aparencia="marca" carregando={isSubmitting || salvar.isPending}>
            Salvar banner
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
