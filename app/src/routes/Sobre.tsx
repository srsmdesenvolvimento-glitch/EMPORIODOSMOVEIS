import { MapPin, Receipt, Ruler, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { classesBotao } from "@/shared/components/ui";
import { useConfigSite } from "@/shared/lib/site";
import { useSeo } from "@/shared/lib/seo";

const PILARES = [
  {
    icone: Receipt,
    titulo: "Boleto e Promissória Própria",
    texto:
      "Facilidade sem burocracia de limite bancário: você parcela no crediário próprio com parcelas fixas negociadas com transparência.",
  },
  {
    icone: ShieldCheck,
    titulo: "Qualidade de Fábrica Superior",
    texto:
      "Móveis produzidos com matérias-primas nobres: 100% MDF/MDP de alta densidade, ferragens reforçadas e espumas certificadas.",
  },
  {
    icone: Ruler,
    titulo: "Medidas Milimétricas e Ficha Técnica",
    texto:
      "Altura, largura, profundidade, peso e diagramas reais de cada móvel estão detalhados no site para você planejar seu espaço com precisão.",
  },
  {
    icone: Truck,
    titulo: "Logística Segura e Estruturada",
    texto:
      "Embalagens reforçadas de fábrica e equipe especializada para que seus móveis cheguem perfeitos até a sua residência.",
  },
];

export default function Sobre() {
  const config = useConfigSite();

  useSeo({
    titulo: "Sobre o Empório dos Móveis",
    descricao:
      "Conheça o Empório dos Móveis: grande empresa de e-commerce com catálogo de fábrica, alto padrão e compra facilitada no boleto e na promissória.",
  });

  return (
    <>
      <section className="bg-tinta-950 py-14 text-tinta-0 lg:py-20" data-escuro>
        <div className="mx-auto grid max-w-4xl gap-6 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/marca-256.png"
              alt=""
              width={72}
              height={72}
              className="size-16 rounded-full ring-2 ring-marca-500"
            />
            <div>
              <span className="inline-block rounded-full bg-marca-500/20 border border-marca-500/40 px-3 py-0.5 text-2xs font-bold uppercase tracking-wider text-marca-400">
                E-Commerce Nacional de Móveis
              </span>
              <h1 className="titulo text-3xl sm:text-4xl lg:text-5xl mt-1">
                O Empório dos Móveis
              </h1>
            </div>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-tinta-300">
            {config.sobre_texto ||
              "Somos uma grande empresa de e-commerce especializada em mobiliário de alto padrão e design contemporâneo. Conectamos os maiores polos fabris do Brasil diretamente à sua casa, oferecendo qualidade superior, transparência com medidas exatas e a maior facilidade de pagamento do mercado no boleto bancário e na promissória própria."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <span className="text-2xs font-extrabold uppercase tracking-wider text-marca-800">
            Nossos Compromissos
          </span>
          <h2 className="titulo text-3xl text-texto sm:text-4xl mt-1">
            Excelência da fabricação à sua entrega
          </h2>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="grid content-start gap-3 rounded-3xl border border-borda bg-superficie p-5 shadow-carta">
              <span className="grid size-12 place-items-center rounded-2xl bg-marca-100 text-marca-900">
                <Icone aria-hidden className="size-6" />
              </span>
              <h3 className="text-base font-bold text-texto">{titulo}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-texto-2">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 lg:px-6">
        <div className="grid items-center gap-6 rounded-3xl border border-borda bg-superficie p-6 shadow-carta sm:grid-cols-2 lg:p-10">
          <div className="grid gap-3">
            <span className="w-fit rounded-full bg-tinta-950 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-marca-400">
              Showroom Digital & Consultoria
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-texto">Atendimento dedicado para você</h2>
            <p className="text-sm leading-relaxed text-texto-2">
              Explore o catálogo completo com fotos em alta definição, especificações técnicas detalhadas e medidas milimétricas. Nossa equipe de consultoria via WhatsApp está pronta para tirar dúvidas, calcular frete e simular suas parcelas no boleto ou na promissória.
            </p>
            {config.endereco ? (
              <p className="flex items-start gap-2 text-sm text-texto pt-1">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-texto-3" />
                <span>
                  {config.endereco}
                  {config.cidade ? <><br />{config.cidade}</> : null}
                </span>
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2.5">
              <Link to="/contato" className={classesBotao({ aparencia: "solido", tamanho: "lg" })}>
                Falar com nosso time
              </Link>
              <Link to="/catalogo" className={classesBotao({ aparencia: "contorno", tamanho: "lg" })}>
                Ver o catálogo completo
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { num: "300+", desc: "móveis e modelos com medidas e ficha técnica" },
              { num: "100%", desc: "MDF/MDP de alta densidade e espumas certificadas" },
              { num: "Boleto", desc: "e promissória própria sem comprometer o cartão" },
              { num: "2026", desc: "nova coleção com garantia oficial de fábrica" },
            ].map((stat) => (
              <div key={stat.desc} className="grid content-center gap-1 rounded-2xl bg-tinta-50 p-4 text-center border border-borda/50">
                <p className="titulo text-2xl sm:text-3xl font-black text-texto">{stat.num}</p>
                <p className="text-2xs text-texto-2 leading-tight">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
