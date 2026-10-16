# Empório dos Móveis

Site institucional + catálogo no estilo Mercado Livre, com painel administrativo.
Os preços não aparecem no site: todo móvel leva a uma conversa no WhatsApp.

- **Catálogo**: 325 móveis em 21 categorias, extraídos do PDF do fornecedor
  (nome, ficha técnica, medidas, peso, volumes, código e acabamentos), com
  744 fotos.
- **Lista de orçamento**: o visitante junta vários móveis e manda tudo de uma
  vez pelo WhatsApp — é o "carrinho" de uma loja que negocia preço.
- **Painel**: móveis, ofertas, banners, categorias, orçamentos recebidos,
  usuários e os dados de contato do site.

## Stack

React 19 · TypeScript strict · Vite · Tailwind v4 (tokens OKLCH próprios) ·
React Router 7 · TanStack Query · Zustand · React Hook Form + Zod ·
Base UI · Motion · Sonner · Supabase (Postgres + Auth + Storage + Edge Functions).

## Estrutura

```
app/                      aplicação web
  src/
    features/             organizado por funcionalidade
      admin/              api e esquemas do painel
      auth/               sessão e papéis
      catalogo/           consultas e cartão de produto
      orcamento/          lista de orçamento (Zustand + gaveta)
    routes/               páginas do site e do painel
    shared/               componentes, utilitários e esquemas comuns
supabase/
  migrations/             schema versionado (RLS incluída)
  functions/criar-usuario/  criação de contas do painel
tools/
  extract_catalog.py      lê o PDF do fornecedor → JSON + WebP
  semear.mjs              leva o JSON e as fotos para o Supabase
```

## Rodando

```bash
cd app
pnpm install
cp .env.example .env.local     # preencha URL e chave publicável
pnpm dev
```

O ambiente é validado por Zod no boot: se faltar variável, a aplicação falha
na inicialização com a mensagem do que está faltando.

## Banco de dados

As migrações vivem em `supabase/migrations` e são aplicadas pela CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Nunca aplique alteração de schema pelo painel web — o que não está versionado
e revisado não existe.

### Autorização

Toda regra de acesso está em RLS, no banco. O cliente é território hostil e não
decide nada:

- catálogo, categorias, banners e configurações: leitura pública do que está
  ativo; escrita só para quem tem perfil ativo;
- orçamentos: qualquer visitante insere, mas só a equipe lê;
- perfis: cada um lê o seu; só administradores mudam papel e status, e
  ninguém muda o próprio papel;
- Storage: leitura pública no bucket `catalogo`, escrita só para a equipe.

### Primeiro acesso

O primeiro usuário criado no Auth vira administrador automaticamente (gatilho
`ao_criar_usuario`). Depois disso, novos usuários saem do painel, em
**Usuários → Novo usuário**, que chama a Edge Function `criar-usuario`.

Publicar a função:

```bash
npx supabase functions deploy criar-usuario
```

Ela confere o JWT de quem chamou e exige papel de administrador antes de usar a
chave de serviço. **Desative o cadastro público** no Supabase
(Authentication → Providers → Email → Allow new users to sign up: off): o painel
não tem tela de cadastro e não deve ter.

## Repovoar o catálogo a partir do PDF

```bash
python tools/extract_catalog.py --images          # gera tools/out/
SUPABASE_URL=... SUPABASE_SECRET_KEY=... node tools/semear.mjs
```

O extrator se apoia na hierarquia tipográfica do catálogo (título do móvel em
`MyanmarText-Bold 16.2`, ficha técnica em `ArialMT 10` na mesma coluna), funde
variações do mesmo móvel espalhadas por páginas vizinhas e descarta legendas de
montagem. Rodar de novo é seguro: produtos são casados por `slug`.

## Recursos de vitrine

- **Navegação por ambiente** (Sala, Quarto, Cozinha, Jantar, Escritório, Multiuso)
  com mega-menu; o ambiente de cada categoria é editável no painel.
- **Filtros**: ambiente, categoria, tom do acabamento (claro, madeira, escuro,
  colorido) e **"cabe no meu espaço"** (largura máxima). Ficam na URL, então
  um link filtrado pode ser compartilhado.
- **Cartões** com amostras de acabamento que trocam a foto, segunda foto ao
  passar o mouse, favorito e "adicionar à lista".
- **Cor ↔ foto** na página do móvel, nos dois sentidos; o cartão leva a cor
  escolhida para a página (`?cor=`).
- **Favoritos, vistos recentemente e buscas recentes** guardados no aparelho do
  cliente, sem cadastro.
- **Busca** com mais buscados, recentes, categoria sugerida e sinônimos
  ("guarda-roupa" acha roupeiros).
- **Promissória** em destaque, com textos e condições editáveis no painel.
- **Miniaturas** de 480 px (`*-m.webp`) nos cartões: a primeira tela do catálogo
  baixa ~0,3 MB de fotos em vez de ~2,7 MB.
- **SEO**: título, descrição e dados estruturados por página; `scripts/pre-render.mjs`
  gera páginas com prévia própria para WhatsApp/Google, `robots.txt` e, com
  `VITE_SITE_URL`, o `sitemap.xml`.
- **LGPD**: página `/privacidade` e aviso no formulário.

## Manutenção do catálogo já publicado

Depois que a loja começou a usar o painel, **não rode `semear.mjs`** — ele
sobrescreve ofertas, destaques e fotos editadas. Use os scripts cirúrgicos:

```bash
node tools/ligar_cores.mjs --simular   # liga cada acabamento à sua foto (só preenche o que está vazio)
node tools/enviar_miniaturas.mjs       # envia as miniaturas *-m.webp ao bucket
```

## Números desta entrega

| Medida | Valor |
|---|---|
| Móveis publicados | 325 (544 acabamentos com foto) |
| Fotos | 744 (WebP) |
| Categorias | 21 |
| Pacote inicial | 211 KB JS + 10 KB CSS (gzip) |
| Lighthouse celular (home / catálogo / produto) | desempenho 90 / 84 / 82 · acessibilidade 100 · SEO 100 · CLS 0 |
| TypeScript | zero erro, zero `any`, zero `@ts-ignore` |
| Alvo de toque | 44 px em todo controle |
| `prefers-reduced-motion` | respeitado em todas as animações |

## Segurança — o que exige atenção

As chaves do projeto foram compartilhadas em conversa durante o
desenvolvimento. **Rotacione a chave de serviço** (`sb_secret_…`) no painel do
Supabase antes de ir para produção: Settings → API → Rotate. A chave publicável
pode ficar, é feita para o cliente — quem a protege é a RLS.
