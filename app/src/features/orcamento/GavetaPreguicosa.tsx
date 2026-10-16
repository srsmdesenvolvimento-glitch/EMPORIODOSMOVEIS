import { lazy, Suspense } from "react";

import { useOrcamento } from "./store";

/**
 * A gaveta carrega a biblioteca de animação junto, e isso são ~44 KB que
 * ninguém precisa só para ver o catálogo. Ela só é baixada quando a pessoa
 * abre a lista pela primeira vez.
 */
const Gaveta = lazy(() =>
  import("./GavetaOrcamento").then((m) => ({ default: m.GavetaOrcamento })),
);

export function GavetaPreguicosa() {
  const aberto = useOrcamento((e) => e.aberto);
  if (!aberto) return null;
  return (
    <Suspense fallback={null}>
      <Gaveta />
    </Suspense>
  );
}
