-- Emporio dos Moveis - esquema inicial
-- Catalogo publico (leitura anonima) + painel administrativo (escrita autenticada).
-- Regra da casa: toda autorizacao vive aqui, no banco. O cliente nunca decide acesso.

create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "unaccent" with schema extensions;

-- `unaccent(text)` e apenas STABLE, entao nao pode entrar numa coluna gerada
-- nem num indice. A forma de dois argumentos e imutavel: este embrulho fixa o
-- dicionario e devolve algo que o Postgres aceita indexar.
create or replace function public.sem_acento(entrada text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public, pg_temp
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(entrada, ''));
$$;

-- ---------------------------------------------------------------- papeis

do $$ begin
  create type public.papel_usuario as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

create table if not exists public.perfis (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null default '',
  email       text not null default '',
  papel       public.papel_usuario not null default 'editor',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is
  'Usuarios do painel. admin gerencia usuarios; editor gerencia catalogo.';

-- Funcoes de autorizacao. SECURITY DEFINER + search_path fixo para nao
-- recursar em RLS nem cair em captura de search_path.
create or replace function public.e_equipe()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo
  );
$$;

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo and p.papel = 'admin'
  );
$$;

-- Leem o proprio perfil sem passar por RLS de novo: usar uma subconsulta a
-- `perfis` dentro de uma policy de `perfis` reentra na politica de leitura.
create or replace function public.meu_papel()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.papel from public.perfis p where p.id = auth.uid();
$$;

create or replace function public.estou_ativo()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select p.ativo from public.perfis p where p.id = auth.uid()), false);
$$;

-- Todo usuario criado no auth ganha um perfil. O primeiro vira admin.
create or replace function public.ao_criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  primeiro boolean;
begin
  select not exists (select 1 from public.perfis) into primeiro;
  insert into public.perfis (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    case
      when primeiro then 'admin'
      when (new.raw_user_meta_data ->> 'papel') = 'admin' then 'admin'
      else 'editor'
    end::public.papel_usuario
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ao_criar_usuario on auth.users;
create trigger trg_ao_criar_usuario
  after insert on auth.users
  for each row execute function public.ao_criar_usuario();

-- ------------------------------------------------------------ catalogo

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  nome       text not null,
  descricao  text,
  imagem_url text,
  icone      text,
  ordem      integer not null default 0,
  ativa      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table if not exists public.produtos (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nome           text not null,
  categoria_id   uuid references public.categorias (id) on delete set null,
  descricao      text,
  especificacoes text[] not null default '{}',
  codigos        text[] not null default '{}',
  altura_cm      numeric(6,1),
  largura_cm     numeric(6,1),
  profundidade_cm numeric(6,1),
  peso_kg        numeric(7,2),
  volumes        integer,
  medidas_texto  text[] not null default '{}',
  observacoes    text[] not null default '{}',
  destaque       boolean not null default false,
  em_oferta      boolean not null default false,
  selo           text,
  ativo          boolean not null default true,
  ordem          integer not null default 0,
  pagina_catalogo integer,
  visualizacoes  integer not null default 0,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

comment on column public.produtos.selo is
  'Etiqueta livre exibida no card: "Oferta da semana", "Ultimas pecas"...';

-- Busca textual sem acento, cobrindo nome, descricao e codigo do fornecedor.
-- `array_to_string` e marcada STABLE pelo Postgres (por causa de tipos com
-- saida variavel); para text[] ela e deterministica, entao a montagem inteira
-- fica numa funcao IMMUTABLE que a coluna gerada pode usar.
create or replace function public.vetor_de_busca(
  nome text, descricao text, codigos text[], especificacoes text[]
)
returns tsvector
language sql
immutable
parallel safe
set search_path = public, extensions, pg_temp
as $$
  select
    setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(nome)), 'A') ||
    setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(descricao)), 'B') ||
    setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(array_to_string(codigos, ' '))), 'C') ||
    setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(array_to_string(especificacoes, ' '))), 'D');
$$;
alter table public.produtos
  drop column if exists busca;
alter table public.produtos
  add column busca tsvector generated always as (
    public.vetor_de_busca(nome, descricao, codigos, especificacoes)
  ) stored;

create index if not exists idx_produtos_busca on public.produtos using gin (busca);
create index if not exists idx_produtos_nome_trgm on public.produtos using gin (nome gin_trgm_ops);
create index if not exists idx_produtos_categoria on public.produtos (categoria_id) where ativo;
create index if not exists idx_produtos_oferta on public.produtos (em_oferta) where ativo and em_oferta;
create index if not exists idx_produtos_destaque on public.produtos (destaque) where ativo and destaque;

create table if not exists public.produto_imagens (
  id         uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  url        text not null,
  alt        text,
  largura    integer,
  altura     integer,
  ordem      integer not null default 0,
  criado_em  timestamptz not null default now()
);
create index if not exists idx_imagens_produto on public.produto_imagens (produto_id, ordem);

create table if not exists public.produto_cores (
  id         uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  nome       text not null,
  imagem_url text,
  amostra_hex text,
  ordem      integer not null default 0,
  unique (produto_id, nome)
);
create index if not exists idx_cores_produto on public.produto_cores (produto_id, ordem);

-- -------------------------------------------------- vitrine e conteudo

create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  subtitulo    text,
  texto_botao  text,
  link         text,
  imagem_url   text not null,
  imagem_mobile_url text,
  cor_fundo    text,
  ordem        integer not null default 0,
  ativo        boolean not null default true,
  inicia_em    timestamptz,
  termina_em   timestamptz,
  criado_em    timestamptz not null default now()
);

comment on table public.banners is 'Carrossel da home, gerenciado pelo painel.';

create table if not exists public.configuracoes (
  chave      text primary key,
  valor      jsonb not null,
  atualizado_em timestamptz not null default now()
);

comment on table public.configuracoes is
  'Telefone, WhatsApp, endereco, horarios e textos do site.';

-- ---------------------------------------------------------- orcamentos

create table if not exists public.orcamentos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null,
  email      text,
  cidade     text,
  mensagem   text,
  itens      jsonb not null default '[]',
  origem     text not null default 'site',
  status     text not null default 'novo',
  criado_em  timestamptz not null default now(),
  constraint orcamentos_status_valido
    check (status in ('novo', 'em_atendimento', 'fechado', 'perdido')),
  constraint orcamentos_nome_tamanho check (char_length(nome) between 2 and 120),
  constraint orcamentos_telefone_tamanho check (char_length(telefone) between 8 and 30),
  constraint orcamentos_mensagem_tamanho check (mensagem is null or char_length(mensagem) <= 2000),
  constraint orcamentos_itens_tamanho check (jsonb_array_length(itens) <= 60)
);
create index if not exists idx_orcamentos_status on public.orcamentos (status, criado_em desc);

-- ------------------------------------------------------ atualizado_em

create or replace function public.marca_atualizacao()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_produtos_atualizado on public.produtos;
create trigger trg_produtos_atualizado before update on public.produtos
  for each row execute function public.marca_atualizacao();

drop trigger if exists trg_perfis_atualizado on public.perfis;
create trigger trg_perfis_atualizado before update on public.perfis
  for each row execute function public.marca_atualizacao();

-- ------------------------------------------------------------- RLS

alter table public.perfis           enable row level security;
alter table public.categorias       enable row level security;
alter table public.produtos         enable row level security;
alter table public.produto_imagens  enable row level security;
alter table public.produto_cores    enable row level security;
alter table public.banners          enable row level security;
alter table public.configuracoes    enable row level security;
alter table public.orcamentos       enable row level security;

-- perfis: cada um le o proprio; admin le e gerencia todos.
drop policy if exists perfis_leitura on public.perfis;
create policy perfis_leitura on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.e_admin());

drop policy if exists perfis_admin_insere on public.perfis;
create policy perfis_admin_insere on public.perfis
  for insert to authenticated
  with check (public.e_admin());

-- O proprio usuario pode editar nome/email, nunca o proprio papel nem o
-- proprio status. Papel e ativo so mudam por admin.
drop policy if exists perfis_atualiza on public.perfis;
create policy perfis_atualiza on public.perfis
  for update to authenticated
  using (public.e_admin() or id = auth.uid())
  with check (
    public.e_admin()
    or (
      id = auth.uid()
      and papel = public.meu_papel()
      and ativo = public.estou_ativo()
    )
  );

drop policy if exists perfis_admin_remove on public.perfis;
create policy perfis_admin_remove on public.perfis
  for delete to authenticated
  using (public.e_admin() and id <> auth.uid());

-- catalogo: mundo le o que esta ativo; equipe escreve.
drop policy if exists categorias_publicas on public.categorias;
create policy categorias_publicas on public.categorias
  for select to anon, authenticated using (ativa or public.e_equipe());

drop policy if exists categorias_equipe on public.categorias;
create policy categorias_equipe on public.categorias
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists produtos_publicos on public.produtos;
create policy produtos_publicos on public.produtos
  for select to anon, authenticated using (ativo or public.e_equipe());

drop policy if exists produtos_equipe on public.produtos;
create policy produtos_equipe on public.produtos
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists imagens_publicas on public.produto_imagens;
create policy imagens_publicas on public.produto_imagens
  for select to anon, authenticated using (true);

drop policy if exists imagens_equipe on public.produto_imagens;
create policy imagens_equipe on public.produto_imagens
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists cores_publicas on public.produto_cores;
create policy cores_publicas on public.produto_cores
  for select to anon, authenticated using (true);

drop policy if exists cores_equipe on public.produto_cores;
create policy cores_equipe on public.produto_cores
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists banners_publicos on public.banners;
create policy banners_publicos on public.banners
  for select to anon, authenticated
  using (
    public.e_equipe()
    or (
      ativo
      and (inicia_em is null or inicia_em <= now())
      and (termina_em is null or termina_em >= now())
    )
  );

drop policy if exists banners_equipe on public.banners;
create policy banners_equipe on public.banners
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists config_publica on public.configuracoes;
create policy config_publica on public.configuracoes
  for select to anon, authenticated using (true);

drop policy if exists config_equipe on public.configuracoes;
create policy config_equipe on public.configuracoes
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

-- orcamentos: visitante so envia; ninguem anonimo le.
drop policy if exists orcamentos_envio on public.orcamentos;
create policy orcamentos_envio on public.orcamentos
  for insert to anon, authenticated
  with check (status = 'novo' and origem in ('site', 'whatsapp', 'catalogo'));

drop policy if exists orcamentos_equipe_le on public.orcamentos;
create policy orcamentos_equipe_le on public.orcamentos
  for select to authenticated using (public.e_equipe());

drop policy if exists orcamentos_equipe_edita on public.orcamentos;
create policy orcamentos_equipe_edita on public.orcamentos
  for update to authenticated using (public.e_equipe()) with check (public.e_equipe());

drop policy if exists orcamentos_admin_remove on public.orcamentos;
create policy orcamentos_admin_remove on public.orcamentos
  for delete to authenticated using (public.e_admin());

-- ---------------------------------------------------------- storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogo', 'catalogo', true, 10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalogo_leitura_publica on storage.objects;
create policy catalogo_leitura_publica on storage.objects
  for select to anon, authenticated using (bucket_id = 'catalogo');

drop policy if exists catalogo_equipe_envia on storage.objects;
create policy catalogo_equipe_envia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalogo' and public.e_equipe());

drop policy if exists catalogo_equipe_atualiza on storage.objects;
create policy catalogo_equipe_atualiza on storage.objects
  for update to authenticated
  using (bucket_id = 'catalogo' and public.e_equipe());

drop policy if exists catalogo_equipe_remove on storage.objects;
create policy catalogo_equipe_remove on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalogo' and public.e_equipe());

-- ------------------------------------------------- busca de catalogo

-- Uma chamada so para a vitrine: filtra, ordena e ja devolve a contagem
-- total, para a paginacao nao precisar de um segundo round-trip.
create or replace function public.buscar_produtos(
  termo text default null,
  categoria text default null,
  somente_ofertas boolean default false,
  ordenar text default 'relevancia',
  limite integer default 24,
  deslocamento integer default 0
)
returns table (
  id uuid, slug text, nome text, categoria_slug text, categoria_nome text,
  selo text, em_oferta boolean, destaque boolean,
  altura_cm numeric, largura_cm numeric, profundidade_cm numeric,
  imagem_url text, imagem_largura integer, imagem_altura integer,
  total_cores integer, total bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with filtrados as (
    select p.*, c.slug as cat_slug, c.nome as cat_nome,
           case
             when termo is null or btrim(termo) = '' then 0
             else ts_rank(p.busca, websearch_to_tsquery('portuguese', public.sem_acento(termo)))
           end as rank
    from public.produtos p
    left join public.categorias c on c.id = p.categoria_id
    where p.ativo
      and (categoria is null or c.slug = categoria)
      and (not somente_ofertas or p.em_oferta)
      and (
        termo is null or btrim(termo) = ''
        or p.busca @@ websearch_to_tsquery('portuguese', public.sem_acento(termo))
        or public.sem_acento(p.nome) ilike '%' || public.sem_acento(termo) || '%'
      )
  ), contados as (
    select count(*) as total from filtrados
  )
  select f.id, f.slug, f.nome, f.cat_slug, f.cat_nome,
         f.selo, f.em_oferta, f.destaque,
         f.altura_cm, f.largura_cm, f.profundidade_cm,
         i.url, i.largura, i.altura,
         (select count(*)::int from public.produto_cores pc where pc.produto_id = f.id),
         contados.total
  from filtrados f
  cross join contados
  left join lateral (
    select url, largura, altura from public.produto_imagens
    where produto_id = f.id order by ordem limit 1
  ) i on true
  order by
    case when ordenar = 'relevancia' then f.rank end desc nulls last,
    case when ordenar = 'recentes' then f.criado_em end desc nulls last,
    case when ordenar = 'nome' then f.nome end asc nulls last,
    case when ordenar = 'maiores' then f.largura_cm end desc nulls last,
    f.destaque desc, f.ordem, f.nome
  limit greatest(1, least(coalesce(limite, 24), 60))
  offset greatest(0, coalesce(deslocamento, 0));
$$;

grant execute on function public.buscar_produtos to anon, authenticated;

-- As policies avaliam estas funcoes como o proprio usuario, entao ele precisa
-- poder executa-las. Sao seguras: cada uma so revela o estado de quem chamou.
grant execute on function public.e_equipe() to anon, authenticated;
grant execute on function public.e_admin() to authenticated;
grant execute on function public.meu_papel() to authenticated;
grant execute on function public.estou_ativo() to authenticated;
grant execute on function public.sem_acento(text) to anon, authenticated;
