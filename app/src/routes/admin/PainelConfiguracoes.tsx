import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useSalvarConfig } from "@/features/admin/api";
import { AreaTexto, Botao, Campo, Cartao, Interruptor } from "@/shared/components/ui";
import {
  esquemaConfigSite,
  type ConfigSite,
  type EntradaConfigSite,
} from "@/shared/lib/esquemas";
import { CONFIG_PADRAO, useConfigSite } from "@/shared/lib/site";
import { formatarTelefone } from "@/shared/lib/utils";

export default function PainelConfiguracoes() {
  const atual = useConfigSite();
  const salvar = useSalvarConfig();

  const { register, handleSubmit, reset, setValue, watch } = useForm<
    EntradaConfigSite,
    unknown,
    ConfigSite
  >({
    resolver: zodResolver(esquemaConfigSite),
    defaultValues: CONFIG_PADRAO,
  });

  useEffect(() => {
    reset(atual);
  }, [atual, reset]);

  return (
    <form
      onSubmit={handleSubmit((dados) => salvar.mutate(dados))}
      className="grid max-w-3xl gap-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-texto">Configurações</h1>
          <p className="mt-1 text-sm text-texto-2">
            Contato, endereço e textos que aparecem no site.
          </p>
        </div>
        <Botao type="submit" aparencia="marca" carregando={salvar.isPending}>
          <Save aria-hidden className="size-4" />
          Salvar
        </Botao>
      </header>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Contato</h2>
        <Campo
          rotulo="WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="(00) 00000-0000"
          dica="É o número de todos os botões verdes do site."
          {...register("whatsapp", {
            onChange: (e) => setValue("whatsapp", formatarTelefone(e.target.value)),
          })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Telefone fixo"
            type="tel"
            inputMode="tel"
            {...register("telefone", {
              onChange: (e) => setValue("telefone", formatarTelefone(e.target.value)),
            })}
          />
          <Campo rotulo="E-mail" type="email" {...register("email")} />
        </div>
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Endereço</h2>
        <Campo rotulo="Rua e número" {...register("endereco")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Cidade / estado" {...register("cidade")} />
          <Campo
            rotulo="Horário de atendimento"
            placeholder="Seg a sex, 8h às 18h"
            {...register("horarios")}
          />
        </div>
        <Campo
          rotulo="Link do mapa (incorporar do Google Maps)"
          dica="No Google Maps: Compartilhar → Incorporar um mapa → copie só o endereço do src."
          {...register("mapa_url")}
        />
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Redes sociais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Instagram"
            placeholder="https://instagram.com/..."
            {...register("instagram")}
          />
          <Campo
            rotulo="Facebook"
            placeholder="https://facebook.com/..."
            {...register("facebook")}
          />
        </div>
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <div>
          <h2 className="font-semibold text-texto">Venda na promissória</h2>
          <p className="mt-0.5 text-sm text-texto-2">
            Aparece na faixa do topo, na página inicial, em cada móvel e na página
            “Compre na promissória”.
          </p>
        </div>
        <Interruptor
          ligado={watch("promissoria_ativa") ?? true}
          aoMudar={(v) => setValue("promissoria_ativa", v, { shouldDirty: true })}
          rotulo="Destacar a promissória no site"
          descricao="Desligado, os blocos de promissória somem de todas as páginas."
        />
        <Campo
          rotulo="Frase da faixa do topo"
          placeholder="Compre na promissória, sem cartão de crédito"
          dica="Curta: aparece numa linha só, acima do cabeçalho."
          {...register("faixa_topo")}
        />
        <Campo
          rotulo="Título"
          placeholder="Compre na promissória"
          {...register("promissoria_titulo")}
        />
        <AreaTexto
          rotulo="Texto curto"
          rows={2}
          placeholder="Parcele direto com a loja, sem cartão de crédito. Cadastro simples, sujeito a análise."
          {...register("promissoria_texto")}
        />
        <AreaTexto
          rotulo="Condições (uma por linha)"
          rows={5}
          placeholder={[
            "Entrada a partir de …",
            "Até … parcelas mensais",
            "Documentos: RG, CPF e comprovante de endereço",
          ].join("\n")}
          dica="Só publique condições que a loja realmente pratica: o que está escrito aqui vale como oferta."
          {...register("promissoria_condicoes")}
        />
      </Cartao>

      <Cartao className="grid gap-4 p-5">
        <h2 className="font-semibold text-texto">Textos do site</h2>
        <Campo
          rotulo="Frase da página inicial"
          dica="Aparece logo abaixo do nome da loja."
          {...register("chamada_home")}
        />
        <AreaTexto
          rotulo="Sobre a loja"
          rows={5}
          dica="Usado na página “A loja” e no rodapé."
          {...register("sobre_texto")}
        />
      </Cartao>

      <div className="flex justify-end">
        <Botao type="submit" aparencia="marca" carregando={salvar.isPending}>
          <Save aria-hidden className="size-4" />
          Salvar configurações
        </Botao>
      </div>
    </form>
  );
}
