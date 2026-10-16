import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App";
// Só o eixo de peso, só latim: ~35 KB, carregado com font-display: swap.
import "@fontsource-variable/fraunces/wght.css";
import "./styles/index.css";

const cliente = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (tentativas, erro) => {
        // Erro de permissão não melhora com insistência.
        const msg = erro instanceof Error ? erro.message : "";
        if (msg.includes("row-level security") || msg.includes("JWT")) return false;
        return tentativas < 2;
      },
    },
  },
});

const raiz = document.getElementById("root");
if (!raiz) throw new Error("Elemento #root não encontrado no index.html");

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: "text-sm" }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
