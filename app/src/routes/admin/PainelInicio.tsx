import {
  ArrowRight,
  Image,
  MessagesSquare,
  Shapes,
  Sofa,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useResumo } from "@/features/admin/api";
import { useSessao } from "@/features/auth/sessao";
import { Cartao, Esqueleto } from "@/shared/components/ui";

export default function PainelInicio() {
  const { perfil } = useSessao();
  const resumo = useResumo();

  const cartoes = [
    { rotulo: "Móveis no catálogo", valor: resumo.data?.produtos, icone: Sofa, para: "/painel/produtos" },
    { rotulo: "Publicados no site", valor: resumo.data?.ativos, icone: Sofa, para: "/painel/produtos" },
    { rotulo: "Em oferta", valor: resumo.data?.ofertas, icone: Tag, para: "/painel/ofertas" },
    { rotulo: "Orçamentos novos", valor: resumo.data?.orcamentosNovos, icone: MessagesSquare, para: "/painel/orcamentos" },
  ];

  const atalhos = [
    { titulo: "Cadastrar um móvel", texto: "Adicione uma peça nova ao catálogo", para: "/painel/produtos", icone: Sofa },
    { titulo: "Montar uma oferta", texto: "Marque peças e crie o selo da promoção", para: "/painel/ofertas", icone: Tag },
    { titulo: "Trocar o banner", texto: "Atualize o destaque da página inicial", para: "/painel/banners", icone: Image },
    { titulo: "Organizar categorias", texto: "Renomeie e ordene as seções do site", para: "/painel/categorias", icone: Shapes },
  ];

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-bold text-texto">
          Olá, {perfil?.nome?.split(" ")[0] || "equipe"}
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Tudo que está no site é controlado por aqui.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cartoes.map(({ rotulo, valor, icone: Icone, para }) => (
          <li key={rotulo}>
            <Link to={para}>
              <Cartao className="grid gap-2 p-4 transition-shadow hover:shadow-flutuante">
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-texto-3">
                  <Icone aria-hidden className="size-4" />
                  {rotulo}
                </span>
                {resumo.isPending ? (
                  <Esqueleto className="h-8 w-16" />
                ) : (
                  <span className="text-3xl font-bold tabular-nums text-texto">
                    {valor ?? 0}
                  </span>
                )}
              </Cartao>
            </Link>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="mb-3 text-lg font-bold text-texto">O que você quer fazer?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {atalhos.map(({ titulo, texto, para, icone: Icone }) => (
            <li key={titulo}>
              <Link to={para}>
                <Cartao className="flex items-center gap-4 p-4 transition-shadow hover:shadow-flutuante">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-100 text-marca-900">
                    <Icone aria-hidden className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-texto">{titulo}</span>
                    <span className="block text-sm text-texto-2">{texto}</span>
                  </span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-texto-3" />
                </Cartao>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
