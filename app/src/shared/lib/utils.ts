import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

/** 201 -> "2,01 m" · 47 -> "47 cm" — como o vendedor fala na loja. */
export function medida(cm: number | null | undefined): string | null {
  if (cm == null || Number.isNaN(cm)) return null;
  if (cm >= 100) {
    return `${(cm / 100).toFixed(2).replace(".", ",")} m`;
  }
  return `${String(cm).replace(".", ",")} cm`;
}

/** "Alt. 2,01 m × Larg. 1,62 m × Prof. 47 cm" */
export function dimensoesEmTexto(p: {
  altura_cm?: number | null;
  largura_cm?: number | null;
  profundidade_cm?: number | null;
}): string | null {
  const partes = [
    medida(p.altura_cm) && `Alt. ${medida(p.altura_cm)}`,
    medida(p.largura_cm) && `Larg. ${medida(p.largura_cm)}`,
    medida(p.profundidade_cm) && `Prof. ${medida(p.profundidade_cm)}`,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" × ") : null;
}

export function apenasDigitos(texto: string): string {
  return texto.replace(/\D+/g, "");
}

/** (34) 99999-8888 — formata enquanto a pessoa digita. */
export function formatarTelefone(bruto: string): string {
  const d = apenasDigitos(bruto).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function dataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Espera o usuário parar de digitar antes de buscar. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): ((...args: A) => void) & { cancelar: () => void } {
  let id: ReturnType<typeof setTimeout> | undefined;
  const envolvido = (...args: A) => {
    if (id) clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  envolvido.cancelar = () => {
    if (id) clearTimeout(id);
  };
  return envolvido;
}

export function plural(n: number, singular: string, plural_: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? singular : plural_}`;
}
