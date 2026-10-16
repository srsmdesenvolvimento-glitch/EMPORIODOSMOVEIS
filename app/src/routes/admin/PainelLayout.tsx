import {
  ExternalLink,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  Shapes,
  Sofa,
  Tag,
  Users,
  X,
} from "lucide-react";
import { Suspense, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

import { useSessao } from "@/features/auth/sessao";
import { useSeo } from "@/shared/lib/seo";
import { Botao, Carregando } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

const ITENS = [
  { para: "/painel", rotulo: "Visão geral", icone: LayoutDashboard, exato: true },
  { para: "/painel/produtos", rotulo: "Móveis", icone: Sofa },
  { para: "/painel/ofertas", rotulo: "Ofertas", icone: Tag },
  { para: "/painel/banners", rotulo: "Banners", icone: Image },
  { para: "/painel/categorias", rotulo: "Categorias", icone: Shapes },
  { para: "/painel/orcamentos", rotulo: "Orçamentos", icone: MessagesSquare },
  { para: "/painel/usuarios", rotulo: "Usuários", icone: Users, soAdmin: true },
  { para: "/painel/configuracoes", rotulo: "Configurações", icone: Settings },
];

export default function PainelLayout() {
  return <Guardiao />;
}

function Guardiao() {
  const { sessao, perfil, carregando, eEquipe } = useSessao();
  const local = useLocation();

  if (carregando) return <Carregando rotulo="Verificando acesso" />;
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;

  // Autenticado mas sem perfil ativo: a RLS já barraria a escrita, mas
  // mostrar o painel a quem não pode usá-lo só gera confusão.
  if (!eEquipe) {
    return (
      <div className="grid min-h-dvh place-items-center bg-fundo px-4">
        <div className="grid max-w-sm gap-3 text-center">
          <h1 className="text-lg font-bold text-texto">Acesso não liberado</h1>
          <p className="text-sm text-texto-2">
            {perfil
              ? "Sua conta está desativada. Peça a um administrador para reativá-la."
              : "Sua conta ainda não tem permissão para o painel."}
          </p>
          <Link to="/" className="text-sm font-semibold text-marca-800 underline underline-offset-4">
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return <Estrutura />;
}

function Estrutura() {
  const { perfil, eAdmin, sair } = useSessao();
  useSeo({ titulo: "Painel", descricao: "Área restrita à equipe da loja.", naoIndexar: true });
  const [menuAberto, setMenuAberto] = useState(false);
  const itens = ITENS.filter((i) => !i.soAdmin || eAdmin);

  return (
    <div className="flex min-h-dvh bg-fundo">
      {/* Barra lateral fixa no desktop, gaveta no celular. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-tinta-950 transition-transform duration-200 ease-saida lg:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
        data-escuro
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <img src="/marca-64.png" alt="" width={36} height={36} className="size-9 rounded-full" />
          <span className="leading-tight">
            <span className="block text-sm font-bold text-tinta-0">Painel</span>
            <span className="block text-2xs text-marca-500">Empório dos Móveis</span>
          </span>
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="ml-auto grid size-10 place-items-center rounded-lg text-tinta-400 hover:bg-tinta-800 lg:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {itens.map(({ para, rotulo, icone: Icone, exato }) => (
            <NavLink
              key={para}
              to={para}
              end={exato}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  isActive
                    ? "bg-marca-500 font-semibold text-tinta-950"
                    : "text-tinta-300 hover:bg-tinta-800 hover:text-tinta-0",
                )
              }
            >
              <Icone aria-hidden className="size-[1.15rem]" />
              {rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-tinta-800 p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium text-tinta-0">
              {perfil?.nome || "Equipe"}
            </p>
            <p className="truncate text-xs text-tinta-500">
              {perfil?.papel === "admin" ? "Administrador" : "Editor"}
            </p>
          </div>
          <Link
            to="/"
            target="_blank"
            className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-xs text-tinta-400 transition-colors hover:text-marca-500"
          >
            <ExternalLink aria-hidden className="size-3.5" />
            Ver o site
          </Link>
          <button
            type="button"
            onClick={() => void sair()}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-1 text-xs text-tinta-400 transition-colors hover:text-erro"
          >
            <LogOut aria-hidden className="size-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {menuAberto ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-40 bg-tinta-950/50 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-borda bg-superficie px-4 py-3 lg:hidden">
          <Botao
            aparencia="fantasma"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="px-2"
          >
            <Menu aria-hidden className="size-5" />
          </Botao>
          <span className="text-sm font-semibold text-texto">Painel</span>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Suspense fallback={<Carregando />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
