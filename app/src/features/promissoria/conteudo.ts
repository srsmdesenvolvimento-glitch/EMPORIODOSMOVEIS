/**
 * Textos fixos sobre a venda na promissória.
 *
 * Tudo aqui é deliberadamente genérico: entrada, número de parcelas, encargos
 * e documentos são da política da loja e ficam no campo "Condições" do painel.
 * Não prometa neste arquivo nada que dependa dessas regras — publicidade de
 * crédito responde pelo que afirma.
 */

export const PASSOS_PROMISSORIA = [
  {
    titulo: "Escolha os móveis",
    texto: "Navegue pelo catálogo e monte a sua lista, com o acabamento de cada peça.",
  },
  {
    titulo: "Fale com a loja",
    texto: "Envie a lista pelo WhatsApp. A equipe apresenta as condições e faz o seu cadastro.",
  },
  {
    titulo: "Assine e receba",
    texto: "Com o cadastro aprovado, você assina a promissória e combina a entrega.",
  },
];

export const MENSAGEM_PROMISSORIA =
  "Olá! Vim pelo site e quero comprar na promissória. Quais são as condições?";

export const PERGUNTAS_PROMISSORIA = [
  {
    pergunta: "Preciso de cartão de crédito para comprar?",
    resposta:
      "Não. Na promissória o parcelamento é feito direto com a loja, sem passar por cartão.",
  },
  {
    pergunta: "Como sei o valor das parcelas?",
    resposta:
      "Você recebe a condição completa no atendimento: entrada, número de parcelas, valor de cada uma e eventuais encargos. Tudo é apresentado antes de você assinar.",
  },
  {
    pergunta: "Quais documentos preciso apresentar?",
    resposta:
      "Em geral, documento com foto, CPF e comprovante de endereço. A equipe confirma a lista no atendimento.",
  },
  {
    pergunta: "A aprovação é garantida?",
    resposta: "Não. O cadastro passa por uma análise da loja antes do fechamento do pedido.",
  },
  {
    pergunta: "Posso incluir vários móveis no mesmo pedido?",
    resposta:
      "Sim. Monte a lista aqui no site e envie de uma vez: a loja avalia o pedido inteiro.",
  },
];
