import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { esquemaPerfil, type Perfil } from "@/shared/lib/esquemas";
import { supabase } from "@/shared/lib/supabase";

interface ContextoSessao {
  sessao: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  /**
   * `true` apenas quando o banco confirma um perfil ativo. É indicação de UI:
   * quem decide o que pode ser gravado é a RLS, não esta flag.
   */
  eEquipe: boolean;
  eAdmin: boolean;
  sair: () => Promise<void>;
}

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;

    async function carregarPerfil(usuarioId: string | undefined) {
      if (!usuarioId) {
        if (vivo) setPerfil(null);
        return;
      }
      const { data } = await supabase
        .from("perfis")
        .select("id, nome, email, papel, ativo, criado_em")
        .eq("id", usuarioId)
        .maybeSingle();
      if (!vivo) return;
      const analisado = esquemaPerfil.safeParse(data);
      setPerfil(analisado.success ? analisado.data : null);
    }

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!vivo) return;
      setSessao(data.session);
      await carregarPerfil(data.session?.user.id);
      if (vivo) setCarregando(false);
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange(
      (_evento, novaSessao) => {
        setSessao(novaSessao);
        void carregarPerfil(novaSessao?.user.id);
      },
    );

    return () => {
      vivo = false;
      inscricao.subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({
      sessao,
      perfil,
      carregando,
      eEquipe: Boolean(perfil?.ativo),
      eAdmin: perfil?.papel === "admin" && perfil.ativo,
      sair: async () => {
        await supabase.auth.signOut();
        setPerfil(null);
      },
    }),
    [sessao, perfil, carregando],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSessao precisa estar dentro de <ProvedorSessao>");
  return ctx;
}
