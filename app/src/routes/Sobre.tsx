import { Handshake, MapPin, Ruler, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { classesBotao } from "@/shared/components/ui";
import { useConfigSite } from "@/shared/lib/site";
import { useSeo } from "@/shared/lib/seo";

const PILARES = [
  {
    icone: Handshake,
    titulo: "Preço conversado, não tabelado",
    texto:
      "Cada pedido é diferente. Em vez de fixar um valor na tela, a gente ouve o que você precisa e fecha a condição que cabe — à vista, parcelado ou no conjunto.",
  },
  {
    icone: Ruler,
    titulo: "A medida antes da compra",
    texto:
      "Altura, largura, profundidade, peso e número de volumes de cada móvel estão no site. Você confere se cabe no seu espaço antes de decidir.",
  },
  {
    icone: Truck,
    titulo: "Entrega e montagem combinadas",
    texto:
      "Acertamos prazo e montagem no fechamento do pedido, com a equipe que já conhece a peça.",
  },
];

export default function Sobre() {
  const config = useConfigSite();

  useSeo({
    titulo: "A loja",
    descricao:
      "Conheça o Empório dos Móveis: catálogo completo do fabricante, atendimento direto e venda na promissória.",
  });

  return (
    <>
      <section className="bg-tinta-950 py-14 text-tinta-0" data-escuro>
        <div className="mx-auto grid max-w-3xl gap-4 px-4 lg:px-6">
          <img
            src="/marca-256.png"
            alt=""
            width={72}
            height={72}
            className="size-16 rounded-full"
          />
          <h1 className="titulo text-3xl sm:text-4xl">
            O Empório dos Móveis
          </h1>
          <p className="text-lg leading-relaxed text-tinta-300">
            {config.sobre_texto ||
              "Somos uma loja de móveis que trabalha com a linha completa do catálogo do fornecedor. Da sala ao quarto das crianças, da cozinha ao escritório: você escolhe com calma aqui no site e fecha o preço conversando com quem entende da peça."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <ul className="grid gap-6 sm:grid-cols-3">
          {PILARES.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="grid content-start gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-marca-100 text-marca-900">
                <Icone aria-hidden className="size-6" />
              </span>
              <h2 className="text-base font-semibold text-texto">{titulo}</h2>
              <p className="text-sm leading-relaxed text-texto-2">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 lg:px-6">
        <div className="grid items-center gap-6 rounded-3xl border border-borda bg-superficie p-6 shadow-carta sm:grid-cols-2 lg:p-10">
          <div className="grid gap-3">
            <h2 className="text-2xl font-bold text-texto">Venha ver de perto</h2>
            <p className="text-sm leading-relaxed text-texto-2">
              O site mostra o catálogo inteiro, mas nada substitui ver o
              acabamento ao vivo. Passe na loja ou chame a gente no WhatsApp para
              tirar qualquer dúvida.
            </p>
            {config.endereco ? (
              <p className="flex items-start gap-2 text-sm text-texto">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-texto-3" />
                <span>
                  {config.endereco}
                  {config.cidade ? <><br />{config.cidade}</> : null}
                </span>
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/contato" className={classesBotao({ aparencia: "solido" })}>
                Falar com a loja
              </Link>
              <Link to="/catalogo" className={classesBotao({ aparencia: "contorno" })}>
                Ver o catálogo
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl bg-tinta-50 p-6 text-center">
            <p className="text-4xl font-bold text-texto">300+</p>
            <p className="text-sm text-texto-2">
              móveis disponíveis, com foto, medida e ficha técnica
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
