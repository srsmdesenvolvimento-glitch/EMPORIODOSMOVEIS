import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useSessao } from "@/features/auth/sessao";
import { Botao, Campo, Cartao } from "@/shared/components/ui";
import {
  esquemaLogin,
  type DadosLogin,
} from "@/features/admin/esquemas";
import { mensagemDeErro, supabase } from "@/shared/lib/supabase";
import { useSeo } from "@/shared/lib/seo";

export default function Entrar() {
  const navegar = useNavigate();
  const { sessao, carregando } = useSessao();
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", senha: "" },
  });

  useSeo({
    titulo: "Acesso da equipe",
    descricao:
      "Área restrita à equipe da loja.",
    naoIndexar: true,
  });

  useEffect(() => {
    if (!carregando && sessao) navegar("/painel", { replace: true });
  }, [sessao, carregando, navegar]);

  async function entrar(dados: DadosLogin) {
    setErroGeral(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: dados.email.trim(),
      password: dados.senha,
    });
    if (error) {
      setErroGeral(mensagemDeErro(error));
      return;
    }
    navegar("/painel", { replace: true });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-tinta-950 px-4 py-10" data-escuro>
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-tinta-400 transition-colors hover:text-marca-500"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar ao site
        </Link>

        <Cartao className="grid gap-5 p-6">
          <div className="grid justify-items-center gap-2 text-center">
            <img src="/marca-64.png" alt="" width={56} height={56} className="size-14 rounded-full" />
            <h1 className="text-lg font-bold text-texto">Painel do Empório</h1>
            <p className="text-sm text-texto-2">Acesso restrito à equipe da loja.</p>
          </div>

          <form onSubmit={handleSubmit(entrar)} className="grid gap-4" noValidate>
            <Campo
              rotulo="E-mail"
              type="email"
              autoComplete="username"
              autoFocus
              erro={errors.email?.message}
              {...register("email")}
            />
            <Campo
              rotulo="Senha"
              type="password"
              autoComplete="current-password"
              adorno={<Lock aria-hidden className="size-4" />}
              erro={errors.senha?.message}
              {...register("senha")}
            />

            {erroGeral ? (
              <p role="alert" className="rounded-lg bg-erro-fraco px-3 py-2 text-sm font-medium text-erro">
                {erroGeral}
              </p>
            ) : null}

            <Botao type="submit" aparencia="solido" tamanho="lg" blocao carregando={isSubmitting}>
              Entrar
            </Botao>
          </form>

          <p className="text-center text-xs text-texto-3">
            Esqueceu a senha? Peça a um administrador para redefinir.
          </p>
        </Cartao>
      </div>
    </div>
  );
}
