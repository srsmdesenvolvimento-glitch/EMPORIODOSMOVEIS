-- Vitrine v2: ambientes, filtros de tom e de medida, e prévia de acabamentos
-- nos cartões. Nada aqui apaga dado: só acrescenta coluna e troca a função
-- de busca (que precisa ser recriada porque o retorno mudou).

-- ------------------------------------------------------------ ambientes
-- Lojas grandes de móveis navegam por cômodo, não por linha de fabricação.
alter table public.categorias
  add column if not exists ambiente text not null default 'outros';

do $$ begin
  alter table public.categorias
    add constraint categorias_ambiente_valido
    check (ambiente in ('sala', 'jantar', 'quarto', 'cozinha', 'escritorio', 'outros'));
exception when duplicate_object then null; end $$;

-- Só preenche quem ainda está no padrão: não desfaz o que a loja mudar no painel.
update public.categorias set ambiente = case slug
    when 'sala-decor' then 'sala'
    when 'poltronas' then 'sala'
    when 'sala-de-estar' then 'sala'
    when 'estofados' then 'sala'
    when 'bistros' then 'jantar'
    when 'sala-de-jantar' then 'jantar'
    when 'beliches' then 'quarto'
    when 'dormitorios' then 'quarto'
    when 'cabeceiras' then 'quarto'
    when 'camas' then 'quarto'
    when 'colchoes' then 'quarto'
    when 'comodas-e-mesas-de-cabeceira' then 'quarto'
    when 'linha-infantil' then 'quarto'
    when 'roupeiros' then 'quarto'
    when 'sapateiras' then 'quarto'
    when 'penteadeiras' then 'quarto'
    when 'linha-office' then 'escritorio'
    when 'cozinha' then 'cozinha'
    when 'kits-cozinha' then 'cozinha'
    when 'balcoes-e-complementos' then 'cozinha'
    else ambiente
  end
where ambiente = 'outros';

create index if not exists idx_categorias_ambiente on public.categorias (ambiente) where ativa;

-- ---------------------------------------------------------------- tons
-- O fornecedor dá nomes próprios aos acabamentos ("Cinamomo", "Freijó",
-- "Nude prime"). O cliente pensa em família de cor. Esta função traduz.
create or replace function public.tons_da_cor(nome text)
returns text[]
language sql
immutable
parallel safe
set search_path = public, extensions, pg_temp
as $$
  select array_remove(array[
    case when public.sem_acento(nome) ~* '(branc|off|nude|perola|gelo|creme|areia|cru|linho|bege|fendi|bali|quartzo|mascavo|camurca|platina|prata)'
      then 'claro' end,
    case when public.sem_acento(nome) ~* '(cinamomo|freijo|jatoba|amendoa|amendol|cedro|nogueira|cumaru|naturalle|mel|imbuia|carvalho|nature|rustic|ype|ipe|canela|whisky|castanho|jequitiba|tauari|madeira|cerejeira|savana|amadeirad)'
      then 'madeira' end,
    case when public.sem_acento(nome) ~* '(preto|chumbo|grafite|cinza|onix|cafe|marrom|castor|tabaco|fume|carbono|cacau)'
      then 'escuro' end,
    case when public.sem_acento(nome) ~* '(verde|azul|rosa|amarelo|vermelh|lilas|terracota|mostarda|turquesa|laranja|roxo|colorid|rubi)'
      then 'colorido' end
  ], null);
$$;

grant execute on function public.tons_da_cor(text) to anon, authenticated;

-- ----------------------------------------------------- busca da vitrine
drop function if exists public.buscar_produtos(text, text, boolean, text, integer, integer);

create or replace function public.buscar_produtos(
  termo text default null,
  categoria text default null,
  somente_ofertas boolean default false,
  ordenar text default 'relevancia',
  limite integer default 24,
  deslocamento integer default 0,
  ambiente text default null,
  tom text default null,
  largura_max numeric default null
)
returns table (
  id uuid, slug text, nome text, categoria_slug text, categoria_nome text,
  selo text, em_oferta boolean, destaque boolean,
  altura_cm numeric, largura_cm numeric, profundidade_cm numeric,
  imagem_url text, imagem_largura integer, imagem_altura integer,
  imagem2_url text,
  total_cores integer,
  cores_previa jsonb,
  total bigint
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
      and (buscar_produtos.categoria is null or c.slug = buscar_produtos.categoria)
      and (buscar_produtos.ambiente is null or c.ambiente = buscar_produtos.ambiente)
      and (not somente_ofertas or p.em_oferta)
      and (largura_max is null or (p.largura_cm is not null and p.largura_cm <= largura_max))
      and (
        buscar_produtos.tom is null
        or exists (
          select 1 from public.produto_cores pc
          where pc.produto_id = p.id
            and buscar_produtos.tom = any (public.tons_da_cor(pc.nome))
        )
      )
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
         i2.url,
         (select count(*)::int from public.produto_cores pc where pc.produto_id = f.id),
         coalesce((
           select jsonb_agg(jsonb_build_object('nome', pc.nome, 'imagem_url', pc.imagem_url) order by pc.ordem)
           from (
             select nome, imagem_url, ordem from public.produto_cores
             where produto_id = f.id and imagem_url is not null
             order by ordem limit 4
           ) pc
         ), '[]'::jsonb),
         contados.total
  from filtrados f
  cross join contados
  left join lateral (
    select url, largura, altura from public.produto_imagens
    where produto_id = f.id order by ordem limit 1
  ) i on true
  left join lateral (
    select url from public.produto_imagens
    where produto_id = f.id order by ordem offset 1 limit 1
  ) i2 on true
  order by
    case when ordenar = 'relevancia' then f.rank end desc nulls last,
    case when ordenar = 'recentes' then f.criado_em end desc nulls last,
    case when ordenar = 'nome' then f.nome end asc nulls last,
    case when ordenar = 'maiores' then f.largura_cm end desc nulls last,
    case when ordenar = 'menores' then f.largura_cm end asc nulls last,
    f.destaque desc, f.ordem, f.nome
  limit greatest(1, least(coalesce(limite, 24), 60))
  offset greatest(0, coalesce(deslocamento, 0));
$$;

grant execute on function public.buscar_produtos(text, text, boolean, text, integer, integer, text, text, numeric)
  to anon, authenticated;
