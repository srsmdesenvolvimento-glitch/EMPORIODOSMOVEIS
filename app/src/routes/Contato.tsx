import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useOrcamento } from "@/features/orcamento/store";
import { AreaTexto, Botao, Campo, Cartao, classesBotao } from "@/shared/components/ui";
import {
  esquemaEnvioOrcamento,
  type DadosEnvioOrcamento,
} from "@/shared/lib/esquemas";
import {
  linkWhatsApp,
  mensagemDeOrcamento,
  useConfigSite,
} from "@/shared/lib/site";
import { mensagemDeErro, supabase } from "@/shared/lib/supabase";
import { formatarTelefone } from "@/shared/lib/utils";
import { useSeo } from "@/shared/lib/seo";

export default function Contato() {
  const config = useConfigSite();
  const { itens, limpar } = useOrcamento();
  const [enviado, setEnviado] = useState(false);

  useSeo({
    titulo: "Contato e orçamento",
    descricao:
      "Fale com a loja pelo WhatsApp ou envie sua lista de móveis para receber valores, parcelas na promissória e prazo de entrega.",
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DadosEnvioOrcamento>({
    resolver: zodResolver(esquemaEnvioOrcamento),
    defaultValues: { nome: "", telefone: "", email: "", cidade: "", mensagem: "" },
  });

  async function enviar(dados: DadosEnvioOrcamento) {
    const { error } = await supabase.from("orcamentos").insert({
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email || null,
      cidade: dados.cidade || null,
      mensagem: dados.mensagem || null,
      origem: "site",
      status: "novo",
      itens: itens.map((i) => ({
        produto_id: i.produto_id,
        nome: i.nome,
        cor: i.cor,
        quantidade: i.quantidade,
      })),
    });

    if (error) {
      toast.error(mensagemDeErro(error));
      return;
    }

    setEnviado(true);
    reset();
    if (itens.length > 0) limpar();
    toast.success("Recebemos sua mensagem!", {
      description: "A equipe responde no horário comercial.",
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <header className="mb-8">
        <h1 className="titulo text-2xl text-texto sm:text-3xl">Fale com a loja</h1>
        <p className="mt-1 max-w-xl text-sm text-texto-2">
          Mande sua dúvida ou o pedido de orçamento. Se preferir, chame direto no
          WhatsApp — costuma ser mais rápido.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Cartao className="p-5 lg:p-6">
          {enviado ? (
            <div className="grid gap-3 py-8 text-center">
              <p className="text-lg font-semibold text-texto">Mensagem enviada!</p>
              <p className="mx-auto max-w-sm text-sm text-texto-2">
                Já chegou para a nossa equipe. Respondemos no horário comercial
                pelo telefone que você informou.
              </p>
              <div className="mt-2 flex justify-center">
                <Botao aparencia="contorno" onClick={() => setEnviado(false)}>
                  Enviar outra mensagem
                </Botao>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(enviar)} className="grid gap-4" noValidate>
              {itens.length > 0 ? (
                <p className="rounded-xl bg-marca-50 px-3 py-2 text-sm text-marca-900">
                  Sua lista com{" "}
                  <strong>
                    {itens.length} {itens.length === 1 ? "móvel" : "móveis"}
                  </strong>{" "}
                  vai junto com a mensagem.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  rotulo="Seu nome"
                  autoComplete="name"
                  erro={errors.nome?.message}
                  {...register("nome")}
                />
                <Campo
                  rotulo="WhatsApp / telefone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  erro={errors.telefone?.message}
                  {...register("telefone", {
                    onChange: (e) =>
                      setValue("telefone", formatarTelefone(e.target.value)),
                  })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  rotulo="E-mail (opcional)"
                  type="email"
                  autoComplete="email"
                  erro={errors.email?.message}
                  {...register("email")}
                />
                <Campo
                  rotulo="Cidade (opcional)"
                  autoComplete="address-level2"
                  erro={errors.cidade?.message}
                  {...register("cidade")}
                />
              </div>

              <AreaTexto
                rotulo="Mensagem"
                rows={5}
                placeholder="Conte o que você procura: cômodo, medida do espaço, cor preferida…"
                erro={errors.mensagem?.message}
                {...register("mensagem")}
              />

              <p className="text-xs text-texto-3">
                Usamos seus dados só para responder a este contato. Veja a{" "}
                <Link to="/privacidade" className="underline underline-offset-2 hover:text-texto">
                  política de privacidade
                </Link>
                .
              </p>
              <Botao
                type="submit"
                aparencia="marca"
                tamanho="lg"
                carregando={isSubmitting}
                className="w-full sm:w-fit"
              >
                <Send aria-hidden className="size-4" />
                Enviar mensagem
              </Botao>
            </form>
          )}
        </Cartao>

        <aside className="grid content-start gap-4">
          {config.whatsapp ? (
            <Cartao className="grid gap-3 p-5">
              <h2 className="font-semibold text-texto">Prefere o WhatsApp?</h2>
              <p className="text-sm text-texto-2">
                {itens.length > 0
                  ? "Mandamos sua lista já montada na conversa."
                  : "Atendimento direto com a equipe da loja."}
              </p>
              <a
                href={linkWhatsApp(
                  config.whatsapp,
                  itens.length > 0
                    ? mensagemDeOrcamento(itens)
                    : "Olá! Vim pelo site do Empório dos Móveis.",
                )}
                target="_blank"
                rel="noreferrer noopener"
                className={classesBotao({ aparencia: "zap", blocao: true })}
              >
                <MessageCircle aria-hidden className="size-4" />
                Abrir conversa
              </a>
            </Cartao>
          ) : null}

          <Cartao className="grid gap-3 p-5">
            <h2 className="font-semibold text-texto">A loja</h2>
            <address className="grid gap-3 not-italic">
              {config.endereco ? (
                <p className="flex items-start gap-2 text-sm text-texto-2">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-texto-3" />
                  <span>
                    {config.endereco}
                    {config.cidade ? <><br />{config.cidade}</> : null}
                  </span>
                </p>
              ) : null}
              {config.telefone ? (
                <a
                  href={`tel:${config.telefone.replace(/\D/g, "")}`}
                  className="flex min-h-11 items-center gap-2 text-sm text-texto-2 hover:text-texto"
                >
                  <Phone aria-hidden className="size-4 text-texto-3" />
                  {config.telefone}
                </a>
              ) : null}
              {config.email ? (
                <a
                  href={`mailto:${config.email}`}
                  className="flex min-h-11 items-center gap-2 break-all text-sm text-texto-2 hover:text-texto"
                >
                  <Mail aria-hidden className="size-4 shrink-0 text-texto-3" />
                  {config.email}
                </a>
              ) : null}
              {config.horarios ? (
                <p className="flex items-start gap-2 text-sm text-texto-2">
                  <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-texto-3" />
                  {config.horarios}
                </p>
              ) : null}
            </address>
          </Cartao>

          {config.mapa_url ? (
            <Cartao className="overflow-hidden">
              <iframe
                src={config.mapa_url}
                title="Mapa da loja"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-56 w-full border-0"
              />
            </Cartao>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
