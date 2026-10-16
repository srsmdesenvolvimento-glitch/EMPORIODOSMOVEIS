import { Component, type ErrorInfo, type ReactNode } from "react";

interface Estado {
  erro: Error | null;
}

/**
 * Rede de segurança da aplicação.
 *
 * O caso mais comum em produção: o site é publicado de novo enquanto alguém
 * navega, e a página aberta tenta baixar um pedaço de código que não existe
 * mais. Sem isto a tela fica branca; com isto a pessoa recarrega e segue.
 */
export class LimiteDeErro extends Component<{ children: ReactNode }, Estado> {
  override state: Estado = { erro: null };

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("Erro na interface:", erro, info.componentStack);
  }

  override render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    const versaoNova = /dynamically imported module|Failed to fetch|Loading chunk|Importing a module/i.test(
      erro.message,
    );

    return (
      <div role="alert" className="grid min-h-[60dvh] place-items-center px-4 py-16 text-center">
        <div className="grid max-w-md gap-3">
          <p className="titulo text-3xl text-texto">
            {versaoNova ? "O site foi atualizado" : "Algo saiu do lugar"}
          </p>
          <p className="text-sm text-texto-2">
            {versaoNova
              ? "Publicamos uma versão nova enquanto você navegava. Recarregue para continuar de onde parou."
              : "Não conseguimos mostrar esta página. Recarregue para tentar de novo; se persistir, fale com a gente pelo WhatsApp."}
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl bg-tinta-950 px-5 text-sm font-semibold text-tinta-0 hover:bg-tinta-800"
            >
              Recarregar a página
            </button>
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl border border-borda-forte px-5 text-sm font-medium text-texto hover:bg-tinta-50"
            >
              Ir para o início
            </a>
          </div>
        </div>
      </div>
    );
  }
}
