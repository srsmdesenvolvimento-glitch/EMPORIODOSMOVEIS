import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { CartaoGuardado } from "@/features/favoritos/CartaoGuardado";
import { useFavoritos } from "@/features/favoritos/store";
import { VistosRecentemente } from "@/features/favoritos/VistosRecentemente";
import { useOrcamento } from "@/features/orcamento/store";
import { Botao, classesBotao, EstadoVazio } from "@/shared/components/ui";
import { useSeo } from "@/shared/lib/seo";
import { plural } from "@/shared/lib/utils";

export default function Favoritos() {
  const itens = useFavoritos((e) => e.itens);
  const remover = useFavoritos((e) => e.remover);
  const adicionar = useOrcamento((e) => e.adicionar);
  const abrirLista = useOrcamento((e) => e.abrir);

  useSeo({
    titulo: "Meus favoritos",
    descricao: "Os móveis que você salvou no site do Empório dos Móveis.",
    naoIndexar: true,
  });

  function levarTudoParaLista() {
    for (const movel of itens) {
      adicionar(
        {
          produto_id: movel.id,
          slug: movel.slug,
          nome: movel.nome,
          cor: null,
          imagem_url: movel.imagem_url,
          codigo: null,
        },
        { abrir: false },
      );
    }
    abrirLista();
  }

  // Compartilhar a seleção com quem divide a decisão (casal, família).
  async function compartilhar() {
    const texto = [
      "Olha os móveis que separei no Empório dos Móveis:",
      "",
      ...itens.map((m) => `• ${m.nome} — ${window.location.origin}/produto/${m.slug}`),
    ].join("\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meus favoritos", text: texto });
        return;
      } catch {
        // a pessoa fechou a janela de compartilhar: nada a fazer
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <h1 className="titulo mb-6 text-3xl text-texto sm:text-4xl">Meus favoritos</h1>
        <EstadoVazio
          icone={<Heart aria-hidden className="size-8" />}
          titulo="Você ainda não salvou nenhum móvel"
          descricao="Toque no coração dos móveis que te interessam. Eles ficam guardados aqui, neste aparelho, para você comparar com calma."
          acao={
            <Link to="/catalogo" className={classesBotao({ aparencia: "marca" })}>
              Explorar o catálogo
            </Link>
          }
        />
        <VistosRecentemente />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="titulo text-3xl text-texto sm:text-4xl">Meus favoritos</h1>
            <p className="mt-1 text-sm text-texto-2">
              {plural(itens.length, "móvel salvo", "móveis salvos")} neste aparelho
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao aparencia="contorno" onClick={() => void compartilhar()}>
              <Share2 aria-hidden className="size-4" />
              Compartilhar
            </Botao>
            <Botao
              aparencia="marca"
              onClick={() => {
                levarTudoParaLista();
                toast.success("Favoritos adicionados à sua lista");
              }}
            >
              <MessageCircle aria-hidden className="size-4" />
              Pedir orçamento de todos
            </Botao>
          </div>
        </header>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {itens.map((movel) => (
            <li key={movel.id}>
              <CartaoGuardado movel={movel} aoRemover={() => remover(movel.id)} />
            </li>
          ))}
        </ul>
      </div>
      <VistosRecentemente />
    </>
  );
}
