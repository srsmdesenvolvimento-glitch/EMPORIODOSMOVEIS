import { useQuery } from "@tanstack/react-query";

import { esquemaConfigSite, type ConfigSite, type ItemOrcamento } from "./esquemas";
import { apenasDigitos } from "./utils";
import { supabase } from "./supabase";

export const NOME_DA_MARCA = "Empório dos Móveis";
export const ASSINATURA_MARCA = "Srs. M";

/**
 * Valores de partida. O painel sobrescreve cada um deles; ficam aqui para o
 * site nunca renderizar vazio enquanto a configuração não carregou.
 */
export const CONFIG_PADRAO: ConfigSite = {
  whatsapp: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  horarios: "",
  instagram: "",
  facebook: "",
  mapa_url: "",
  chamada_home: "Móveis para a casa inteira, com montagem e entrega.",
  sobre_texto: "",
  promissoria_ativa: true,
  promissoria_titulo: "Compre na promissória",
  promissoria_texto:
    "Parcele direto com a loja, sem cartão de crédito. Cadastro simples, sujeito a análise.",
  promissoria_condicoes: "",
  faixa_topo: "Compre na promissória, sem cartão de crédito",
};

const CAMPOS_COM_PADRAO = new Set(["promissoria_titulo", "promissoria_texto"]);

export function useConfigSite() {
  const consulta = useQuery({
    queryKey: ["config-site"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ConfigSite> => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("chave, valor")
        .eq("chave", "site")
        .maybeSingle();
      if (error) throw error;
      const bruto = (data?.valor ?? {}) as Record<string, unknown>;
      // Campo salvo em branco não apaga o texto padrão dos blocos de promissória:
      // a loja desliga o destaque pelo interruptor, não esvaziando o título.
      const preenchidos = Object.fromEntries(
        Object.entries(bruto).filter(
          ([chave, valor]) => !(CAMPOS_COM_PADRAO.has(chave) && valor === ""),
        ),
      );
      return esquemaConfigSite.parse({ ...CONFIG_PADRAO, ...preenchidos });
    },
  });
  return consulta.data ?? CONFIG_PADRAO;
}

/** Número em formato internacional para o link do WhatsApp. */
function numeroInternacional(whatsapp: string): string {
  const d = apenasDigitos(whatsapp);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export function linkWhatsApp(whatsapp: string, mensagem: string): string {
  const numero = numeroInternacional(whatsapp);
  const texto = encodeURIComponent(mensagem);
  if (!numero) return `https://wa.me/?text=${texto}`;
  return `https://wa.me/${numero}?text=${texto}`;
}

export function mensagemDeProduto(produto: {
  nome: string;
  slug: string;
  codigos?: string[];
  cor?: string | null;
  /** O que a pessoa quer saber: muda a primeira linha da conversa. */
  intencao?: "condicao" | "promissoria";
}): string {
  const abertura =
    produto.intencao === "promissoria"
      ? "Olá! Vi este móvel no site e quero comprar na promissória. Quais são as condições?"
      : "Olá! Vi este móvel no site e quero receber a minha condição:";
  const linhas = [abertura, ``, `*${produto.nome}*`];
  if (produto.cor) linhas.push(`Cor: ${produto.cor}`);
  const codigo = produto.codigos?.[0];
  if (codigo) linhas.push(`Código: ${codigo}`);
  if (typeof window !== "undefined") {
    linhas.push(``, `${window.location.origin}/produto/${produto.slug}`);
  }
  return linhas.join("\n");
}

export function mensagemDeOrcamento(
  itens: ItemOrcamento[],
  contato?: { nome?: string; cidade?: string; mensagem?: string },
): string {
  const linhas = ["Olá! Montei uma lista no site e quero um orçamento:", ""];
  itens.forEach((item, i) => {
    linhas.push(`${i + 1}. *${item.nome}*`);
    const detalhes = [
      item.cor ? `Cor: ${item.cor}` : null,
      item.codigo ? `Cód: ${item.codigo}` : null,
      `Qtd: ${item.quantidade}`,
    ].filter(Boolean);
    linhas.push(`   ${detalhes.join(" · ")}`);
  });
  linhas.push("", `Total de itens: ${itens.reduce((s, i) => s + i.quantidade, 0)}`);
  if (contato?.nome) linhas.push(`Meu nome: ${contato.nome}`);
  if (contato?.cidade) linhas.push(`Cidade: ${contato.cidade}`);
  if (contato?.mensagem) linhas.push("", contato.mensagem);
  return linhas.join("\n");
}
