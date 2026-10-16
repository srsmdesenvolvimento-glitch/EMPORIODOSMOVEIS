import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAtualizarUsuario, useUsuarios } from "@/features/admin/api";
import { useSessao } from "@/features/auth/sessao";
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  Interruptor,
  Selo,
  Seletor,
} from "@/shared/components/ui";
import {
  esquemaNovoUsuario,
  type DadosNovoUsuario,
} from "@/features/admin/esquemas";
import { supabase } from "@/shared/lib/supabase";
import { dataCurta } from "@/shared/lib/utils";

export default function PainelUsuarios() {
  const { perfil, eAdmin } = useSessao();
  const usuarios = useUsuarios();
  const atualizar = useAtualizarUsuario();
  const [criando, setCriando] = useState(false);

  if (!eAdmin) {
    return (
      <Cartao className="grid gap-2 p-6 text-center">
        <ShieldCheck aria-hidden className="mx-auto size-8 text-texto-3" />
        <p className="font-semibold text-texto">Área dos administradores</p>
        <p className="text-sm text-texto-2">
          Só quem tem papel de administrador gerencia a equipe.
        </p>
      </Cartao>
    );
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-texto">Usuários</h1>
          <p className="mt-1 text-sm text-texto-2">
            Quem pode entrar no painel e o que cada um pode fazer.
          </p>
        </div>
        <Botao aparencia="marca" onClick={() => setCriando(true)}>
          <UserPlus aria-hidden className="size-4" />
          Novo usuário
        </Botao>
      </header>

      {criando ? <FormNovoUsuario aoFechar={() => setCriando(false)} /> : null}

      <Cartao className="grid gap-3 p-4">
        <p className="text-sm text-texto-2">
          <strong className="text-texto">Administrador</strong> gerencia a equipe
          e todo o conteúdo. <strong className="text-texto">Editor</strong> cuida
          do catálogo, ofertas e orçamentos, mas não mexe em usuários.
        </p>
      </Cartao>

      {usuarios.isPending ? (
        <Esqueleto className="h-40 rounded-2xl" />
      ) : (
        <ul className="grid gap-2">
          {(usuarios.data ?? []).map((u) => {
            const souEu = u.id === perfil?.id;
            return (
              <li key={u.id}>
                <Cartao className="grid gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marca-100 text-sm font-bold text-marca-900">
                      {u.nome.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-texto">
                        {u.nome}
                        {souEu ? (
                          <span className="ml-1.5 text-xs font-normal text-texto-3">
                            (você)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-texto-2">{u.email}</p>
                    </div>
                    <Selo tom={u.papel === "admin" ? "marca" : "neutro"}>
                      {u.papel === "admin" ? "Administrador" : "Editor"}
                    </Selo>
                    {!u.ativo ? <Selo tom="neutro">Desativado</Selo> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-borda pt-3">
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-texto-2">Papel</span>
                      <select
                        value={u.papel}
                        disabled={souEu}
                        onChange={(e) =>
                          atualizar.mutate({
                            id: u.id,
                            campos: { papel: e.target.value as "admin" | "editor" },
                          })
                        }
                        aria-label={`Papel de ${u.nome}`}
                        className="min-h-10 rounded-lg border border-borda-forte bg-superficie px-2 text-sm text-texto disabled:bg-tinta-50 disabled:text-texto-3"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </label>

                    <div className="ml-auto min-w-48">
                      <Interruptor
                        ligado={u.ativo}
                        aoMudar={(v) =>
                          atualizar.mutate({ id: u.id, campos: { ativo: v } })
                        }
                        rotulo="Acesso liberado"
                      />
                    </div>
                  </div>

                  {souEu ? (
                    <p className="text-xs text-texto-3">
                      Você não pode mudar o próprio papel nem se desativar — é o
                      que impede a loja de ficar sem administrador.
                    </p>
                  ) : (
                    <p className="text-xs text-texto-3">
                      Na equipe desde {dataCurta(u.criado_em)}
                    </p>
                  )}
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FormNovoUsuario({ aoFechar }: { aoFechar: () => void }) {
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosNovoUsuario>({
    resolver: zodResolver(esquemaNovoUsuario),
    defaultValues: { nome: "", email: "", senha: "", papel: "editor" },
  });

  async function criar(dados: DadosNovoUsuario) {
    setErro(null);
    // A criação passa pela Edge Function: é lá que mora a chave de serviço.
    const { data, error } = await supabase.functions.invoke("criar-usuario", {
      body: dados,
    });

    if (error) {
      setErro(
        "Não foi possível criar o usuário. Confirme se a função `criar-usuario` está publicada no Supabase.",
      );
      return;
    }
    const resposta = data as { erro?: string } | null;
    if (resposta?.erro) {
      setErro(resposta.erro);
      return;
    }

    toast.success("Usuário criado", {
      description: "Passe a senha para a pessoa; ela pode trocá-la depois.",
    });
    aoFechar();
  }

  return (
    <Cartao className="grid gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-texto">Novo usuário</h2>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="grid size-10 place-items-center rounded-lg text-texto-2 hover:bg-tinta-100"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(criar)} className="grid gap-4" noValidate>
        <Campo rotulo="Nome" erro={errors.nome?.message} {...register("nome")} />
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="off"
          erro={errors.email?.message}
          {...register("email")}
        />
        <Campo
          rotulo="Senha provisória"
          type="text"
          autoComplete="new-password"
          dica="Ao menos 8 caracteres, com letra e número."
          erro={errors.senha?.message}
          {...register("senha")}
        />
        <Seletor rotulo="Papel" erro={errors.papel?.message} {...register("papel")}>
          <option value="editor">Editor — cuida do catálogo</option>
          <option value="admin">Administrador — também gerencia a equipe</option>
        </Seletor>

        {erro ? (
          <p role="alert" className="rounded-lg bg-erro-fraco px-3 py-2 text-sm font-medium text-erro">
            {erro}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Botao aparencia="contorno" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" aparencia="marca" carregando={isSubmitting}>
            Criar usuário
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
