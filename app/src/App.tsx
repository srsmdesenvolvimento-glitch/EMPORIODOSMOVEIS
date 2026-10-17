import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { ProvedorSessao } from "@/features/auth/sessao";
import { GavetaPreguicosa } from "@/features/orcamento/GavetaPreguicosa";
import { BarraNavegacaoInferior } from "@/shared/components/BarraNavegacaoInferior";
import { BotaoWhatsApp } from "@/shared/components/BotaoWhatsApp";
import { Cabecalho } from "@/shared/components/Cabecalho";
import { FaixaTopo } from "@/shared/components/FaixaTopo";
import { Rodape } from "@/shared/components/Rodape";
import { RolarAoTopo } from "@/shared/components/RolarAoTopo";
import { LimiteDeErro } from "@/shared/components/LimiteDeErro";
import { Carregando } from "@/shared/components/ui";
import { usePrefetchDeLinks } from "@/shared/hooks/usePrefetchDeLinks";

import { carregadores } from "@/routes/carregadores";
import Home from "@/routes/Home";

// O catálogo é a porta de entrada e carrega junto. O painel só chega
// para quem faz login — não pode pesar no bundle do visitante.
// As rotas saem todas do mesmo mapa que a pré-busca lê (routes/carregadores).
const Catalogo = lazy(carregadores.Catalogo);
const Produto = lazy(carregadores.Produto);
const Ofertas = lazy(carregadores.Ofertas);
const Categorias = lazy(carregadores.Categorias);
const Sobre = lazy(carregadores.Sobre);
const Contato = lazy(carregadores.Contato);
const Promissoria = lazy(carregadores.Promissoria);
const Favoritos = lazy(carregadores.Favoritos);
const Privacidade = lazy(carregadores.Privacidade);
const NaoEncontrada = lazy(() => import("@/routes/NaoEncontrada"));

const Entrar = lazy(() => import("@/routes/admin/Entrar"));
const PainelLayout = lazy(() => import("@/routes/admin/PainelLayout"));
const PainelInicio = lazy(() => import("@/routes/admin/PainelInicio"));
const PainelProdutos = lazy(() => import("@/routes/admin/PainelProdutos"));
const PainelProdutoEditar = lazy(() => import("@/routes/admin/PainelProdutoEditar"));
const PainelCategorias = lazy(() => import("@/routes/admin/PainelCategorias"));
const PainelBanners = lazy(() => import("@/routes/admin/PainelBanners"));
const PainelOfertas = lazy(() => import("@/routes/admin/PainelOfertas"));
const PainelOrcamentos = lazy(() => import("@/routes/admin/PainelOrcamentos"));
const PainelUsuarios = lazy(() => import("@/routes/admin/PainelUsuarios"));
const PainelConfiguracoes = lazy(() => import("@/routes/admin/PainelConfiguracoes"));

function LayoutDoSite() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-tinta-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-tinta-0"
      >
        Pular para o conteúdo
      </a>
      <FaixaTopo />
      <Cabecalho />
      <main id="conteudo" className="flex-1">
        <LimiteDeErro key={pathname}>
          {/* Altura de tela inteira enquanto a página carrega: sem isso o rodapé
              aparece logo abaixo e é empurrado depois (CLS alto no Lighthouse). */}
          <Suspense
            fallback={
              <div className="min-h-dvh">
                <Carregando />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </LimiteDeErro>
      </main>
      <Rodape />
      <GavetaPreguicosa />
      <BotaoWhatsApp />
      <BarraNavegacaoInferior />
    </div>
  );
}

export default function App() {
  const local = useLocation();
  usePrefetchDeLinks();

  return (
    <ProvedorSessao>
      <RolarAoTopo />
      <Routes key={local.pathname.startsWith("/painel") ? "painel" : "site"}>
        <Route element={<LayoutDoSite />}>
          <Route index element={<Home />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="produto/:slug" element={<Produto />} />
          <Route path="ofertas" element={<Ofertas />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="contato" element={<Contato />} />
          <Route path="promissoria" element={<Promissoria />} />
          <Route path="favoritos" element={<Favoritos />} />
          <Route path="privacidade" element={<Privacidade />} />
        </Route>

        <Route
          path="/entrar"
          element={
            <Suspense fallback={<Carregando />}>
              <Entrar />
            </Suspense>
          }
        />

        <Route
          path="/painel"
          element={
            <Suspense fallback={<Carregando />}>
              <PainelLayout />
            </Suspense>
          }
        >
          <Route index element={<PainelInicio />} />
          <Route path="produtos" element={<PainelProdutos />} />
          <Route path="produtos/:id" element={<PainelProdutoEditar />} />
          <Route path="categorias" element={<PainelCategorias />} />
          <Route path="banners" element={<PainelBanners />} />
          <Route path="ofertas" element={<PainelOfertas />} />
          <Route path="orcamentos" element={<PainelOrcamentos />} />
          <Route path="usuarios" element={<PainelUsuarios />} />
          <Route path="configuracoes" element={<PainelConfiguracoes />} />
        </Route>

        <Route path="/admin" element={<Navigate to="/painel" replace />} />
        <Route
          path="*"
          element={
            <Suspense fallback={<Carregando />}>
              <NaoEncontrada />
            </Suspense>
          }
        />
      </Routes>
    </ProvedorSessao>
  );
}
