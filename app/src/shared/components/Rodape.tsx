import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { useCategorias } from "@/features/catalogo/api";
import { IconeFacebook, IconeInstagram } from "@/shared/components/IconesSociais";
import { linkWhatsApp, NOME_DA_MARCA, useConfigSite } from "@/shared/lib/site";

export function Rodape() {
  const config = useConfigSite();
  const categorias = useCategorias();
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-tinta-950 text-tinta-300" data-escuro>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div className="grid content-start gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/marca-64.png"
              alt=""
              width={44}
              height={44}
              loading="lazy"
              className="size-11 rounded-full"
            />
            <span className="leading-tight">
              <span className="block font-bold text-tinta-0">Empório dos Móveis</span>
              <span className="block text-xs text-marca-500">Srs. M</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-tinta-400">
            {config.sobre_texto ||
              "Móveis para a casa inteira: sala, quarto, cozinha e escritório. Atendimento próximo e condição negociada peça a peça."}
          </p>
          {config.instagram ? (
            <a
              href={config.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-tinta-300 transition-colors hover:text-marca-500"
            >
              <IconeInstagram className="size-4" />
              Instagram
            </a>
          ) : null}
          {config.facebook ? (
            <a
              href={config.facebook}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-tinta-300 transition-colors hover:text-marca-500"
            >
              <IconeFacebook className="size-4" />
              Facebook
            </a>
          ) : null}
        </div>

        <nav aria-labelledby="rodape-catalogo" className="grid content-start gap-2">
          <h2 id="rodape-catalogo" className="text-sm font-semibold text-tinta-0">
            Catálogo
          </h2>
          {(categorias.data ?? []).slice(0, 7).map((c) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.slug}`}
              className="text-sm text-tinta-400 transition-colors hover:text-marca-500"
            >
              {c.nome}
            </Link>
          ))}
          <Link
            to="/categorias"
            className="text-sm font-medium text-marca-500 transition-opacity hover:opacity-80"
          >
            Ver todas as categorias
          </Link>
        </nav>

        <nav aria-labelledby="rodape-loja" className="grid content-start gap-2">
          <h2 id="rodape-loja" className="text-sm font-semibold text-tinta-0">
            A loja
          </h2>
          <Link to="/sobre" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Quem somos
          </Link>
          <Link to="/ofertas" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Ofertas da semana
          </Link>
          <Link to="/promissoria" className="text-sm font-medium text-marca-500 transition-opacity hover:opacity-80">
            Compre na promissória
          </Link>
          <Link to="/contato" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Fale com a gente
          </Link>
          <Link to="/favoritos" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Meus favoritos
          </Link>
          <Link to="/privacidade" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Privacidade
          </Link>
          <Link to="/entrar" className="text-sm text-tinta-400 transition-colors hover:text-marca-500">
            Acesso da equipe
          </Link>
        </nav>

        <address className="grid content-start gap-3 not-italic">
          <h2 className="text-sm font-semibold text-tinta-0">Contato</h2>
          {config.whatsapp ? (
            <a
              href={linkWhatsApp(config.whatsapp, "Olá! Vim pelo site do Empório dos Móveis.")}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-11 items-center gap-2 text-sm text-tinta-400 transition-colors hover:text-marca-500"
            >
              <MessageCircle aria-hidden className="size-4" />
              WhatsApp {config.whatsapp}
            </a>
          ) : null}
          {config.endereco || config.cidade ? (
            <p className="flex items-start gap-2 text-sm text-tinta-400">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                {config.endereco}
                {config.endereco && config.cidade ? <br /> : null}
                {config.cidade}
              </span>
            </p>
          ) : null}
          {config.telefone ? (
            <a
              href={`tel:${config.telefone.replace(/\D/g, "")}`}
              className="flex min-h-11 items-center gap-2 text-sm text-tinta-400 transition-colors hover:text-marca-500"
            >
              <Phone aria-hidden className="size-4" />
              {config.telefone}
            </a>
          ) : null}
          {config.email ? (
            <a
              href={`mailto:${config.email}`}
              className="flex min-h-11 items-center gap-2 text-sm text-tinta-400 transition-colors hover:text-marca-500"
            >
              <Mail aria-hidden className="size-4" />
              {config.email}
            </a>
          ) : null}
          {config.horarios ? (
            <p className="flex items-start gap-2 text-sm text-tinta-400">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
              {config.horarios}
            </p>
          ) : null}
        </address>
      </div>

      <div className="border-t border-tinta-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-tinta-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>
            © {ano} {NOME_DA_MARCA}. Todos os direitos reservados.
          </p>
          <p>
            Imagens e medidas do catálogo do fornecedor. Preços sob consulta.
          </p>
        </div>
      </div>
    </footer>
  );
}
