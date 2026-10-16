import { Link } from "react-router-dom";

import { useSeo } from "@/shared/lib/seo";
import { NOME_DA_MARCA, useConfigSite } from "@/shared/lib/site";

/**
 * Política de privacidade (LGPD — Lei 13.709/2018).
 *
 * Descreve exatamente o que este site faz com dados pessoais. Se o site
 * passar a coletar algo novo (analytics, pixel de anúncio, login de
 * cliente), esta página precisa ser atualizada junto.
 */
export default function Privacidade() {
  const config = useConfigSite();
  const contato = config.email || config.whatsapp || "os canais da página de contato";

  useSeo({
    titulo: "Política de privacidade",
    descricao: `Como o ${NOME_DA_MARCA} trata os dados pessoais enviados pelo site, conforme a LGPD.`,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <h1 className="titulo text-4xl text-texto">Política de privacidade</h1>
      <p className="mt-2 text-sm text-texto-3">Atualizada em outubro de 2026</p>

      <div className="mt-8 grid gap-8 text-sm leading-relaxed text-texto-2 [&_h2]:titulo [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:text-texto [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>Quem somos</h2>
          <p>
            O {NOME_DA_MARCA}
            {config.cidade ? `, com sede em ${config.cidade},` : ""} é o responsável (controlador)
            pelos dados pessoais tratados neste site, nos termos da Lei Geral de Proteção de
            Dados (Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2>Quais dados coletamos</h2>
          <ul className="grid gap-1">
            <li>
              <strong className="text-texto">No formulário de contato e orçamento:</strong> nome,
              telefone/WhatsApp e, se você quiser informar, e-mail, cidade, mensagem e a lista de
              móveis que montou.
            </li>
            <li>
              <strong className="text-texto">Ao enviar a lista pelo WhatsApp:</strong> registramos
              quais móveis foram pedidos, sem nome ou telefone. A conversa em si acontece no
              WhatsApp e segue a política de privacidade dele.
            </li>
          </ul>
        </section>

        <section>
          <h2>Para que usamos</h2>
          <p>
            Exclusivamente para responder ao seu contato: enviar valores, condições de pagamento
            (inclusive na promissória), combinar entrega e montagem. A base legal é o
            procedimento preliminar a um contrato que você pediu (art. 7º, V, da LGPD). Não
            vendemos nem repassamos seus dados a terceiros para fins de marketing.
          </p>
        </section>

        <section>
          <h2>O que fica no seu aparelho</h2>
          <p>
            A lista de orçamento, os favoritos, os móveis vistos recentemente e as buscas
            recentes ficam guardados apenas no seu navegador, não em nossos servidores. Você pode
            apagá-los a qualquer momento limpando os dados do site no navegador. Este site não
            usa cookies de publicidade nem de rastreamento.
          </p>
        </section>

        <section>
          <h2>Por quanto tempo guardamos</h2>
          <p>
            Pelo tempo necessário para atender ao seu pedido e cumprir obrigações legais, como as
            fiscais. Depois disso, os dados são apagados ou anonimizados.
          </p>
        </section>

        <section>
          <h2>Seus direitos</h2>
          <p>
            Você pode, a qualquer momento, pedir para confirmar se temos dados seus, acessá-los,
            corrigi-los, ou solicitar que sejam apagados. Para isso, fale com a gente por{" "}
            {contato}. Veja também a{" "}
            <Link to="/contato" className="font-medium text-texto underline underline-offset-4">
              página de contato
            </Link>
            .
          </p>
        </section>

        <section>
          <h2>Segurança</h2>
          <p>
            Os dados ficam em servidores com acesso restrito à equipe da loja, protegidos por
            senha e por regras de permissão no banco de dados.
          </p>
        </section>
      </div>
    </article>
  );
}
