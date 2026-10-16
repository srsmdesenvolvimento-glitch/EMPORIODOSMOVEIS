import { Clock, Search, TrendingUp, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useCategorias, useSugestoes } from "@/features/catalogo/api";
import { Foto } from "@/shared/components/Foto";
import { cn } from "@/shared/lib/utils";

const POPULARES = ["guarda-roupa", "sofá", "rack", "cômoda", "cozinha", "mesa de jantar"];
const CHAVE_RECENTES = "emporio-buscas";

function lerRecentes(): string[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? "[]") as unknown;
    return Array.isArray(bruto) ? bruto.filter((t): t is string => typeof t === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function guardarRecente(termo: string) {
  try {
    const lista = [termo, ...lerRecentes().filter((t) => t !== termo)].slice(0, 5);
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista));
  } catch {
    // modo privado sem armazenamento: a busca funciona do mesmo jeito
  }
}

/**
 * Campo de busca com painel de sugestões, como nas grandes lojas:
 * vazio → buscas recentes e populares; digitando → categorias e móveis.
 */
export function CampoBusca({ id, placeholder }: { id: string; placeholder: string }) {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [termo, setTermo] = useState(() => parametros.get("q") ?? "");
  const [aberto, setAberto] = useState(false);
  const [recentes, setRecentes] = useState<string[]>([]);
  const caixa = useRef<HTMLFormElement>(null);
  const idPainel = useId();

  // Acompanha a busca da URL (voltar do navegador, clique em categoria),
  // ajustando no render em vez de num efeito.
  const buscaDaUrl = parametros.get("q") ?? "";
  const [buscaAnterior, setBuscaAnterior] = useState(buscaDaUrl);
  if (buscaDaUrl !== buscaAnterior) {
    setBuscaAnterior(buscaDaUrl);
    setTermo(buscaDaUrl);
  }

  const limpo = termo.trim();
  const sugestoes = useSugestoes(aberto ? limpo : "");
  const categorias = useCategorias();
  const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const categoriasQueCasam =
    limpo.length >= 2
      ? (categorias.data ?? [])
          .filter((c) => normalizar(c.nome).includes(normalizar(limpo)))
          .slice(0, 3)
      : [];

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function irPara(busca: string) {
    const t = busca.trim();
    setAberto(false);
    if (!t) {
      navegar("/catalogo");
      return;
    }
    guardarRecente(t);
    setTermo(t);
    navegar(`/catalogo?q=${encodeURIComponent(t)}`);
  }

  const mostrarVazio = aberto && limpo.length < 2;
  const mostrarResultados =
    aberto && limpo.length >= 2 && ((sugestoes.data?.length ?? 0) > 0 || categoriasQueCasam.length > 0);

  return (
    <form
      ref={caixa}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        irPara(termo);
      }}
      onKeyDown={(e) => {
        // O campo de busca nativo apaga o texto no Esc, o que reabriria o
        // painel; aqui o Esc só fecha as sugestões e mantém o que foi digitado.
        if (e.key === "Escape") {
          e.preventDefault();
          setAberto(false);
        }
      }}
      className="relative w-full"
    >
      <label htmlFor={id} className="sr-only">
        Buscar móveis
      </label>
      <input
        id={id}
        type="search"
        value={termo}
        autoComplete="off"
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => {
          setRecentes(lerRecentes());
          setAberto(true);
        }}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrarVazio || mostrarResultados}
        aria-controls={idPainel}
        className="min-h-11 w-full rounded-xl border-0 bg-tinta-0 px-4 pr-20 text-[16px] text-texto shadow-carta placeholder:text-texto-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-tinta-950 sm:text-sm"
      />
      {termo ? (
        <button
          type="button"
          onClick={() => {
            setTermo("");
            setAberto(true);
          }}
          aria-label="Limpar busca"
          className="absolute right-10 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-texto-3 hover:text-texto"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-texto-2 transition-colors hover:bg-tinta-100"
      >
        <Search aria-hidden className="size-5" />
      </button>

      {mostrarVazio || mostrarResultados ? (
        <div
          id={idPainel}
          className="absolute inset-x-0 top-full z-[55] mt-1.5 overflow-hidden rounded-2xl border border-borda bg-superficie p-2 shadow-suspenso"
        >
          {mostrarVazio ? (
            <div className="grid gap-3 p-2">
              {recentes.length > 0 ? (
                <GrupoSugestao titulo="Buscas recentes" icone={<Clock aria-hidden className="size-3.5" />}>
                  {recentes.map((t) => (
                    <Ficha key={t} aoClicar={() => irPara(t)}>
                      {t}
                    </Ficha>
                  ))}
                </GrupoSugestao>
              ) : null}
              <GrupoSugestao titulo="Mais buscados" icone={<TrendingUp aria-hidden className="size-3.5" />}>
                {POPULARES.map((t) => (
                  <Ficha key={t} aoClicar={() => irPara(t)}>
                    {t}
                  </Ficha>
                ))}
              </GrupoSugestao>
            </div>
          ) : (
            <ul className="grid">
              {categoriasQueCasam.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/catalogo?categoria=${c.slug}`}
                    onClick={() => setAberto(false)}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-texto hover:bg-tinta-50"
                  >
                    <Search aria-hidden className="size-4 text-texto-3" />
                    <span>
                      Ver tudo em <strong className="font-semibold">{c.nome}</strong>
                    </span>
                  </Link>
                </li>
              ))}
              {(sugestoes.data ?? []).map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/produto/${p.slug}`}
                    onClick={() => {
                      guardarRecente(limpo);
                      setAberto(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-tinta-50"
                  >
                    <Foto
                      src={p.imagem_url}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-lg border border-borda bg-tinta-0 object-contain"
                    />
                    <span className="min-w-0">
                      <span className="polegadas block truncate text-sm text-texto">{p.nome}</span>
                      {p.categoria_nome ? (
                        <span className="block text-xs text-texto-3">em {p.categoria_nome}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-marca-800 hover:bg-tinta-50"
                >
                  <Search aria-hidden className="size-4" />
                  Ver todos os resultados para “{limpo}”
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}

function GrupoSugestao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-texto-3">
        {icone}
        {titulo}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Ficha({ aoClicar, children }: { aoClicar: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={cn(
        "min-h-9 rounded-full border border-borda-forte bg-superficie px-3 text-sm text-texto transition-colors hover:bg-tinta-50",
      )}
    >
      {children}
    </button>
  );
}
