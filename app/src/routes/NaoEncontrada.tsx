import { Link } from "react-router-dom";

import { Cabecalho } from "@/shared/components/Cabecalho";
import { Rodape } from "@/shared/components/Rodape";
import { classesBotao } from "@/shared/components/ui";
import { useSeo } from "@/shared/lib/seo";

export default function NaoEncontrada() {
  useSeo({
    titulo: "Página não encontrada",
    descricao:
      "Esta página não existe. Volte ao catálogo para encontrar o seu móvel.",
    naoIndexar: true,
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Cabecalho />
      <main className="mx-auto grid max-w-lg flex-1 content-center gap-4 px-4 py-20 text-center">
        <p className="text-5xl font-bold text-marca-500">404</p>
        <h1 className="text-2xl font-bold text-texto">Essa página não existe</h1>
        <p className="text-sm text-texto-2">
          O endereço pode ter mudado. Volte ao catálogo para encontrar o móvel
          que você procura.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link to="/catalogo" className={classesBotao({ aparencia: "marca" })}>
            Ver o catálogo
          </Link>
          <Link to="/" className={classesBotao({ aparencia: "contorno" })}>
            Ir para o início
          </Link>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
