import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  esquemaBanner,
  esquemaCategoria,
  esquemaPerfil,
  esquemaProdutoCompleto,
  type Banner,
  type Categoria,
  type ConfigSite,
  type Perfil,
  type ProdutoCompleto,
} from "@/shared/lib/esquemas";
import { gerarMiniatura } from "@/shared/lib/imagens";
import { mensagemDeErro, supabase } from "@/shared/lib/supabase";
import { slugificar } from "@/shared/lib/utils";

export const chavesAdmin = {
  produtos: (busca: string, categoria: string) =>
    ["admin", "produtos", busca, categoria] as const,
  produto: (id: string) => ["admin", "produto", id] as const,
  categorias: ["admin", "categorias"] as const,
  banners: ["admin", "banners"] as const,
  orcamentos: (status: string) => ["admin", "orcamentos", status] as const,
  usuarios: ["admin", "usuarios"] as const,
  resumo: ["admin", "resumo"] as const,
};

/** Invalida tudo que o site público mostra depois de uma edição. */
function useInvalidarVitrine() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: ["produtos"] });
    void cliente.invalidateQueries({ queryKey: ["vitrine"] });
    void cliente.invalidateQueries({ queryKey: ["produto"] });
    void cliente.invalidateQueries({ queryKey: ["categorias"] });
    void cliente.invalidateQueries({ queryKey: ["banners"] });
    void cliente.invalidateQueries({ queryKey: ["admin"] });
  };
}

/* ------------------------------------------------------------ produtos */

export interface LinhaProdutoAdmin {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  destaque: boolean;
  em_oferta: boolean;
  selo: string | null;
  categoria_id: string | null;
  categorias: { nome: string } | null;
  produto_imagens: { url: string }[];
}

export function useProdutosAdmin(busca: string, categoria: string) {
  return useQuery({
    queryKey: chavesAdmin.produtos(busca, categoria),
    queryFn: async (): Promise<LinhaProdutoAdmin[]> => {
      let consulta = supabase
        .from("produtos")
        .select(
          "id, slug, nome, ativo, destaque, em_oferta, selo, categoria_id, categorias(nome), produto_imagens(url)",
        )
        .order("nome")
        .limit(1000);
      if (busca.trim()) consulta = consulta.ilike("nome", `%${busca.trim()}%`);
      if (categoria) consulta = consulta.eq("categoria_id", categoria);
      const { data, error } = await consulta;
      if (error) throw error;
      return (data ?? []) as unknown as LinhaProdutoAdmin[];
    },
  });
}

export function useProdutoAdmin(id: string | undefined) {
  return useQuery({
    queryKey: chavesAdmin.produto(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<ProdutoCompleto | null> => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          `*, categorias ( slug, nome ),
           produto_imagens ( id, url, alt, largura, altura, ordem ),
           produto_cores ( id, nome, imagem_url, amostra_hex, ordem )`,
        )
        .eq("id", id ?? "")
        .maybeSingle();
      if (error) throw error;
      return data ? esquemaProdutoCompleto.parse(data) : null;
    },
  });
}

export function useSalvarProduto() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async ({
      id,
      campos,
    }: {
      id?: string;
      campos: Record<string, unknown>;
    }) => {
      if (id) {
        const { error } = await supabase.from("produtos").update(campos).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("produtos")
        .insert(campos)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Móvel salvo");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/** Liga/desliga um campo booleano direto da lista, sem abrir a edição. */
export function useAlternarCampo() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async ({
      id,
      campo,
      valor,
    }: {
      id: string;
      campo: "ativo" | "destaque" | "em_oferta";
      valor: boolean;
    }) => {
      const { error } = await supabase
        .from("produtos")
        .update({ [campo]: valor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

export function useRemoverProduto() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Móvel removido");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* ---------------------------------------------------------- categorias */

export function useCategoriasAdmin() {
  return useQuery({
    queryKey: chavesAdmin.categorias,
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return esquemaCategoria.array().parse(data ?? []);
    },
  });
}

export function useSalvarCategoria() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async ({ id, campos }: { id?: string; campos: Record<string, unknown> }) => {
      if (id) {
        const { error } = await supabase.from("categorias").update(campos).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("categorias").insert(campos);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Categoria salva");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

export function useRemoverCategoria() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Categoria removida");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* ------------------------------------------------------------- banners */

export function useBannersAdmin() {
  return useQuery({
    queryKey: chavesAdmin.banners,
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabase.from("banners").select("*").order("ordem");
      if (error) throw error;
      return esquemaBanner.array().parse(data ?? []);
    },
  });
}

export function useSalvarBanner() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async ({ id, campos }: { id?: string; campos: Record<string, unknown> }) => {
      if (id) {
        const { error } = await supabase.from("banners").update(campos).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("banners").insert(campos);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Banner salvo");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

export function useRemoverBanner() {
  const invalidar = useInvalidarVitrine();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Banner removido");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* ---------------------------------------------------------- orçamentos */

export interface OrcamentoAdmin {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string | null;
  mensagem: string | null;
  itens: { nome: string; cor: string | null; quantidade: number }[];
  status: string;
  origem: string;
  criado_em: string;
}

export function useOrcamentosAdmin(status: string) {
  return useQuery({
    queryKey: chavesAdmin.orcamentos(status),
    queryFn: async (): Promise<OrcamentoAdmin[]> => {
      let consulta = supabase
        .from("orcamentos")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (status) consulta = consulta.eq("status", status);
      const { data, error } = await consulta;
      if (error) throw error;
      return (data ?? []) as unknown as OrcamentoAdmin[];
    },
  });
}

export function useMudarStatusOrcamento() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["admin", "orcamentos"] });
      void cliente.invalidateQueries({ queryKey: chavesAdmin.resumo });
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* ------------------------------------------------------------ usuários */

export function useUsuarios() {
  return useQuery({
    queryKey: chavesAdmin.usuarios,
    queryFn: async (): Promise<Perfil[]> => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome, email, papel, ativo, criado_em")
        .order("criado_em");
      if (error) throw error;
      return esquemaPerfil.array().parse(data ?? []);
    },
  });
}

export function useAtualizarUsuario() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      campos,
    }: {
      id: string;
      campos: { papel?: "admin" | "editor"; ativo?: boolean; nome?: string };
    }) => {
      const { error } = await supabase.from("perfis").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: chavesAdmin.usuarios });
      toast.success("Usuário atualizado");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* ------------------------------------------------------- configurações */

export function useSalvarConfig() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (valores: ConfigSite) => {
      const { error } = await supabase
        .from("configuracoes")
        .upsert({ chave: "site", valor: valores, atualizado_em: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["config-site"] });
      toast.success("Configurações salvas");
    },
    onError: (e) => toast.error(mensagemDeErro(e)),
  });
}

/* --------------------------------------------------------------- envio */

/**
 * Envia um arquivo ao bucket do catálogo e devolve a URL pública.
 * O tipo e o tamanho são conferidos aqui e de novo no bucket — o cliente
 * é só a primeira barreira, nunca a única.
 */
export async function enviarImagem(
  arquivo: File,
  pasta: "produtos" | "banners" | "categorias",
): Promise<string> {
  const permitidos = ["image/webp", "image/jpeg", "image/png", "image/avif"];
  if (!permitidos.includes(arquivo.type)) {
    throw new Error("Formato não aceito. Use JPG, PNG, WebP ou AVIF.");
  }
  if (arquivo.size > 10 * 1024 * 1024) {
    throw new Error("Imagem muito grande. O limite é 10 MB.");
  }

  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = slugificar(arquivo.name.replace(/\.[^.]+$/, "")) || "imagem";
  const caminho = `${pasta}/${base}-${Date.now().toString(36)}.${extensao}`;

  const { error } = await supabase.storage
    .from("catalogo")
    .upload(caminho, arquivo, { cacheControl: "31536000", upsert: false });
  if (error) throw error;

  // Foto de móvel ganha a irmã leve usada nos cartões (ver shared/lib/imagens).
  if (pasta === "produtos") {
    const mini = await gerarMiniatura(arquivo);
    if (mini) {
      await supabase.storage
        .from("catalogo")
        .upload(caminho.replace(/\.[^.]+$/, "-m.webp"), mini, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true,
        });
    }
  }

  const { data } = supabase.storage.from("catalogo").getPublicUrl(caminho);
  return data.publicUrl;
}

/* --------------------------------------------------------------- resumo */

export interface ResumoPainel {
  produtos: number;
  ativos: number;
  ofertas: number;
  categorias: number;
  orcamentosNovos: number;
}

export function useResumo() {
  return useQuery({
    queryKey: chavesAdmin.resumo,
    queryFn: async (): Promise<ResumoPainel> => {
      const conta = (filtro?: { campo: string; valor: unknown }) => {
        let q = supabase.from("produtos").select("id", { count: "exact", head: true });
        if (filtro) q = q.eq(filtro.campo, filtro.valor);
        return q;
      };
      const [todos, ativos, ofertas, categorias, novos] = await Promise.all([
        conta(),
        conta({ campo: "ativo", valor: true }),
        conta({ campo: "em_oferta", valor: true }),
        supabase.from("categorias").select("id", { count: "exact", head: true }),
        supabase
          .from("orcamentos")
          .select("id", { count: "exact", head: true })
          .eq("status", "novo"),
      ]);
      return {
        produtos: todos.count ?? 0,
        ativos: ativos.count ?? 0,
        ofertas: ofertas.count ?? 0,
        categorias: categorias.count ?? 0,
        orcamentosNovos: novos.count ?? 0,
      };
    },
  });
}
