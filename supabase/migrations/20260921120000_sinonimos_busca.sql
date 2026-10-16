-- Sinônimos de busca.
-- O catálogo usa o vocabulário do fornecedor ("Roupeiro", "Estofado"); o
-- cliente digita o dele ("guarda-roupa", "sofá"). Sem esta ponte, a busca mais
-- comum da loja volta vazia.

create table if not exists public.sinonimos_busca (
  termo       text primary key,   -- como o cliente escreve, sem acento e minúsculo
  equivalente text not null       -- como o catálogo chama
);

comment on table public.sinonimos_busca is
  'Traduz o que o cliente digita para o nome usado no catálogo do fornecedor.';

alter table public.sinonimos_busca enable row level security;

drop policy if exists sinonimos_leitura on public.sinonimos_busca;
create policy sinonimos_leitura on public.sinonimos_busca
  for select to anon, authenticated using (true);

drop policy if exists sinonimos_equipe on public.sinonimos_busca;
create policy sinonimos_equipe on public.sinonimos_busca
  for all to authenticated using (public.e_equipe()) with check (public.e_equipe());

insert into public.sinonimos_busca (termo, equivalente) values
  ('guarda roupa',  'roupeiro'),
  ('guarda-roupa',  'roupeiro'),
  ('guardaroupa',   'roupeiro'),
  ('armario',       'roupeiro'),
  ('sofa',          'estofado'),
  ('criado mudo',   'mesa cabeceira'),
  ('criado-mudo',   'mesa cabeceira'),
  ('mesinha',       'mesa lateral or mesa cabeceira'),
  ('estante',       'painel tv or estante'),
  ('home theater',  'painel'),
  ('rack',          'bancada or painel tv'),
  ('escrivaninha',  'escrivaninha or office'),
  ('mesa de estudo','office'),
  ('cristaleira',   'cristaleira or buffet'),
  ('aparador',      'aparador or buffet'),
  ('beliche',       'beliche'),
  ('cama infantil', 'infantil or car'),
  ('cozinha compacta', 'kit cozinha')
on conflict (termo) do update set equivalente = excluded.equivalente;

-- Devolve os nomes do catálogo que correspondem ao que foi digitado,
-- já no formato "a or b" que o websearch_to_tsquery entende.
create or replace function public.expandir_termo(entrada text)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select string_agg(distinct s.equivalente, ' or ')
      from public.sinonimos_busca s
      where lower(public.sem_acento(entrada)) like '%' || s.termo || '%'
    ),
    ''
  );
$$;

grant execute on function public.expandir_termo(text) to anon, authenticated;

-- Mesma assinatura da versão anterior; agora a busca também casa por sinônimo
-- e pelo nome da categoria.
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
  with consulta as (
    select
      nullif(btrim(termo), '') as original,
      nullif(public.expandir_termo(termo), '') as extra
  ), filtrados as (
    select p.*, c.slug as cat_slug, c.nome as cat_nome,
           case
             when q.original is null then 0
             else greatest(
               ts_rank(p.busca, websearch_to_tsquery('portuguese', public.sem_acento(q.original))),
               case when q.extra is null then 0
                    else 0.5 * ts_rank(p.busca, websearch_to_tsquery('portuguese', public.sem_acento(q.extra)))
               end
             )
           end as rank
    from public.produtos p
    left join public.categorias c on c.id = p.categoria_id
    cross join consulta q
    where p.ativo
      and (categoria is null or c.slug = categoria)
      and (not somente_ofertas or p.em_oferta)
      and (
        q.original is null
        or p.busca @@ websearch_to_tsquery('portuguese', public.sem_acento(q.original))
        or (q.extra is not null
            and p.busca @@ websearch_to_tsquery('portuguese', public.sem_acento(q.extra)))
        or public.sem_acento(p.nome) ilike '%' || public.sem_acento(q.original) || '%'
        or public.sem_acento(c.nome) ilike '%' || public.sem_acento(q.original) || '%'
        or exists (
          select 1 from public.produto_cores pc
          where pc.produto_id = p.id
            and public.sem_acento(pc.nome) ilike '%' || public.sem_acento(q.original) || '%'
        )
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
