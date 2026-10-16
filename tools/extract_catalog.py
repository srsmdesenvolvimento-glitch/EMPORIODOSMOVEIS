"""Extrai produtos e imagens do catalogo PDF do fornecedor.

O catalogo tem hierarquia tipografica consistente, e e nela que este script se apoia:
  - titulo de produto .... MyanmarText-Bold 16.2
  - observacao da pagina .. MyanmarText-Bold 15.2 ("Pecas vendidas separadamente")
  - ficha tecnica ......... ArialMT ~10 na mesma coluna do titulo
  - rotulo de cor ......... ArialMT ~10 solto, perto da foto correspondente
  - navegacao/ruido ....... ArialMT 17.7 e MinionPro 12 (numero da pagina)

Uso: python tools/extract_catalog.py [--images]
Saida: tools/out/catalogo.json  e  tools/out/img/<slug>/<n>.webp
"""
from __future__ import annotations

import hashlib
import io
import shutil
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "NOVO CATALAGO - 2026 .pdf"
OUT = Path(__file__).resolve().parent / "out"
IMG_DIR = OUT / "img"

SUMARIO = [
    ("Sala decor", 2), ("Poltronas", 27), ("Sala de estar", 31), ("Estofados", 80),
    ("Bistrôs", 92), ("Sala de jantar", 98), ("Beliches", 131), ("Cabeceiras", 137),
    ("Camas", 146), ("Colchões", 151), ("Cômodas e mesas de cabeceira", 158),
    ("Linha infantil", 175), ("Dormitórios", 177), ("Roupeiros", 180),
    ("Sapateiras", 231), ("Multiuso", 235), ("Penteadeiras", 239),
    ("Linha office", 246), ("Cozinha", 253), ("Kits cozinha", 269),
    ("Balcões e complementos", 281),
]

TAM_TITULO = 16.0      # >= isso e MyanmarText bold -> titulo de produto
TAM_NOTA_MIN = 14.0    # entre TAM_NOTA_MIN e TAM_TITULO -> observacao da pagina
COLUNA_TOL = 30.0      # tolerancia horizontal para ligar ficha tecnica ao titulo
ALCANCE_FICHA = 170.0
LARGURA_MINIATURA = 480  # px: cartão de ~240 px em tela 2x  # alcance vertical maximo da ficha abaixo do titulo

RUIDO = re.compile(
    r"^(baixar imagens|voltar ao ind[ií]ce|voltar ao indice|sumário|sumario|\W*|\d+)$", re.I)
RE_COD = re.compile(r"C[óo]d\.?\s*:?\s*([\d/\s\-]+)", re.I)
RE_DIM = re.compile(r"(alt|larg|prof|comp)\.?\s*:?\s*([\d.,]+)\s*(cm|m|mm)\b", re.I)
RE_PESO = re.compile(r"peso\s*:?\s*([\d.,]+)\s*kg", re.I)
RE_VOL = re.compile(r"volumes?\s*:?\s*(\d+)", re.I)
# rotulos que aparecem em fonte de cor mas nao sao cor (specs, selos, legendas)
NAO_E_COR = re.compile(
    r"(vendid|separadamente|somente|apenas|acompanha|opcional|consulte|"
    r"imagem|ilustrat|medidas|obs\b|montagem|flex|exemplo|possívei|possivei|"
    r"\bmdp\b|\bmdf\b|\bmm\b|\bcm\b|\babs\b|espuma|prateleira|puxador|"
    r"gaveta|corrediç|cabideir|calceir|dobradiç|rodízio|rodizio|trilho|"
    r"estrutura|produzido|fundo|tampo|nicho|porta[s]?\b|pés|pes\b|sapata|"
    r"espelho|vidro|chanfrad|assento|encosto|percinta|articulaç|silicone|"
    r"molas|couro|botões|kit\b|incluso|inclusos|sistema|fecho|aberto|fechado|"
    r"retrátil|retratil|reclinável|reclinavel)", re.I)
# segunda linha de titulo que e outro movel do conjunto (vai para o nome)
E_MOVEL = re.compile(
    r"^(banqueta|balc[aã]o|mesa|cadeira|rack|painel|buffet|aparador|c[oô]moda|"
    r"cama|poltrona|puff|cristaleira|sapateira|estante|nicho)(?=\s|$)", re.I)
# titulos que na verdade sao legenda de montagem, nao produto
E_LEGENDA = re.compile(
    r"^(\d+\s+(pain|mesa|cama|módul|modul|nicho|prateleira)|exemplo|"
    r"possívei|possivei|montagem|composiç|sugestão|sugestao|ambiente)", re.I)


def categoria_da_pagina(pagina: int) -> str:
    atual = SUMARIO[0][0]
    for nome, inicio in SUMARIO:
        if pagina >= inicio:
            atual = nome
        else:
            break
    return atual


def limpa(txt: str) -> str:
    txt = txt.replace(" ", " ").replace("�", "")
    txt = re.sub(r"\s+", " ", txt)
    return txt.strip(" •·–—")


def slugify(txt: str) -> str:
    txt = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    txt = re.sub(r"[^a-zA-Z0-9]+", "-", txt).strip("-").lower()
    return re.sub(r"-{2,}", "-", txt)


def para_cm(valor: str, unidade: str) -> float | None:
    bruto = valor.replace(",", ".")
    if bruto.count(".") > 1:
        bruto = bruto.replace(".", "", bruto.count(".") - 1)
    try:
        v = float(bruto)
    except ValueError:
        return None
    u = unidade.lower()
    return round(v * 100, 1) if u == "m" else round(v / 10, 1) if u == "mm" else round(v, 1)


def parse_dimensoes(texto: str) -> dict[str, float]:
    dims: dict[str, float] = {}
    mapa = {"alt": "altura", "lar": "largura", "pro": "profundidade", "com": "comprimento"}
    for m in RE_DIM.finditer(texto):
        chave = mapa[m.group(1).lower()[:3]]
        cm = para_cm(m.group(2), m.group(3))
        # dimensao plausivel para movel: 1cm a 400cm
        if cm and 1 <= cm <= 400 and chave not in dims:
            dims[chave] = cm
    return dims


def coleta_spans(page: pymupdf.Page) -> list[dict]:
    spans = []
    for blk in page.get_text("dict")["blocks"]:
        if blk["type"] != 0:
            continue
        for ln in blk["lines"]:
            for sp in ln["spans"]:
                txt = limpa(sp["text"])
                if not txt or RUIDO.match(txt):
                    continue
                size = round(sp["size"], 1)
                if size > 14 and "Myanmar" not in sp["font"]:
                    continue  # "Baixar Imagens" / "Voltar ao indice" (Arial 17.7)
                spans.append({
                    "texto": txt, "size": size, "font": sp["font"],
                    "bold": bool(sp["flags"] & 16),
                    "x": sp["bbox"][0], "x1": sp["bbox"][2],
                    "y": sp["bbox"][1], "y1": sp["bbox"][3],
                })
    return spans


def extrai_pagina(doc: pymupdf.Document, idx: int) -> tuple[list[dict], list[str]]:
    page = doc[idx]
    pagina = idx + 1
    spans = coleta_spans(page)

    titulos, notas, resto = [], [], []
    for sp in spans:
        eh_myanmar_bold = "Myanmar" in sp["font"] and sp["bold"]
        if eh_myanmar_bold and sp["size"] >= TAM_TITULO:
            if E_LEGENDA.match(sp["texto"]):
                notas.append(sp["texto"])
            else:
                titulos.append(sp)
        elif eh_myanmar_bold and sp["size"] >= TAM_NOTA_MIN:
            notas.append(sp["texto"])
        else:
            resto.append(sp)
    if not titulos:
        return [], notas
    titulos.sort(key=lambda t: (t["y"], t["x"]))

    # Titulo quebrado em duas linhas ("Roupeiro Laredo" / "2 portas de correr e
    # 2 de bater"): a segunda linha e subtitulo do mesmo movel, nao outro movel.
    unidos: list[dict] = []
    for t in titulos:
        anterior = unidos[-1] if unidos else None
        if (anterior and abs(anterior["x"] - t["x"]) < 10
                and 0 < t["y"] - anterior["y"] < 30):
            anterior.setdefault("subtitulos", []).append(t["texto"])
            anterior["y1"] = t["y1"]
            continue
        unidos.append(t)
    titulos = unidos

    # liga cada linha de ficha tecnica ao titulo imediatamente acima na mesma coluna
    fichas: dict[int, list[dict]] = {i: [] for i in range(len(titulos))}
    sobras: list[dict] = []
    for sp in resto:
        candidatos = [
            (sp["y"] - t["y1"], i) for i, t in enumerate(titulos)
            if abs(t["x"] - sp["x"]) < COLUNA_TOL
            and -4 < (sp["y"] - t["y1"]) < ALCANCE_FICHA
        ]
        if candidatos:
            fichas[min(candidatos)[1]].append(sp)
        else:
            sobras.append(sp)

    # imagens da pagina, maior primeiro
    imagens = []
    for im in page.get_images(full=True):
        rects = page.get_image_rects(im[0])
        if not rects:
            continue
        r = rects[0]
        # descarta icones, filetes e selos graficos ("100% MDF")
        if r.width * r.height < 12000:
            continue
        imagens.append({
            "xref": im[0], "area": abs(r.width * r.height),
            "cx": (r.x0 + r.x1) / 2, "cy": (r.y0 + r.y1) / 2,
            "x0": r.x0, "y0": r.y0, "x1": r.x1, "y1": r.y1,
        })
    imagens.sort(key=lambda i: i["area"], reverse=True)

    produtos = []
    for i, t in enumerate(titulos):
        linhas = sorted(fichas[i], key=lambda s: s["y"])
        texto = " ".join(l["texto"] for l in linhas)
        mcod = RE_COD.search(texto)
        mpeso = RE_PESO.search(texto)
        mvol = RE_VOL.search(texto)
        specs = [
            l["texto"] for l in linhas
            if not RE_COD.search(l["texto"]) and not RE_PESO.search(l["texto"])
            and not RE_VOL.search(l["texto"]) and not RE_DIM.search(l["texto"])
        ]
        # Subtitulo que nomeia outro movel entra no nome ("Penteadeira Evora +
        # Banqueta Evora"); subtitulo descritivo vira a primeira especificacao.
        subtitulos = t.get("subtitulos", [])
        conjunto = [st for st in subtitulos if E_MOVEL.match(st)]
        descritivos = [st for st in subtitulos if not E_MOVEL.match(st)]
        nome = " + ".join([t["texto"], *conjunto])
        specs = descritivos + specs
        produtos.append({
            "pagina": pagina,
            "categoria": categoria_da_pagina(pagina),
            "nome": nome,
            "codigos": re.findall(r"\d{3,6}", mcod.group(1)) if mcod else [],
            "specs": specs,
            "dimensoes": parse_dimensoes(texto),
            "medidas_texto": [l["texto"] for l in linhas if RE_DIM.search(l["texto"])],
            "peso_kg": float(mpeso.group(1).replace(",", ".")) if mpeso else None,
            "volumes": int(mvol.group(1)) if mvol else None,
            "observacoes": notas,
            "_tx": t["x"], "_ty": t["y"],
            "cores": [], "imagens": [],
        })

    atribui_cores(produtos, sobras, imagens)
    atribui_imagens(produtos, imagens)
    return produtos, notas


def foto_do_rotulo(sp: dict, imagens: list[dict]) -> int | None:
    """Acha a foto a que um rotulo de cor se refere.

    No catalogo o nome do acabamento fica no pe da foto daquele acabamento:
    logo abaixo dela, ou sobre a margem transparente do proprio recorte. Por
    isso o que decide e a BORDA INFERIOR da foto, nao o retangulo mais proximo
    -- o rotulo costuma invadir o topo (transparente) da foto seguinte, e ela
    nao e a dona dele.
    """
    cx = (sp["x"] + sp.get("x1", sp["x"])) / 2
    cy = (sp["y"] + sp["y1"]) / 2
    melhor: tuple[float, float, int] | None = None
    for im in imagens:
        if not (im["x0"] - 12 <= cx <= im["x1"] + 12):
            continue
        desvio = cy - im["y1"]          # >0: abaixo da foto; <0: sobre o pe dela
        if not (-70 <= desvio <= 25):
            continue
        chave = (abs(desvio), im["area"], im["xref"])
        if melhor is None or chave < melhor:
            melhor = chave
    return melhor[2] if melhor else None


def atribui_cores(produtos: list[dict], sobras: list[dict], imagens: list[dict]) -> None:
    """Rotulos soltos viram cores do produto cujo titulo esta mais perto."""
    nomes = {p["nome"].casefold() for p in produtos}
    for sp in sobras:
        txt = sp["texto"]
        if len(txt) < 3 or len(txt) > 46 or NAO_E_COR.search(txt):
            continue
        if RE_COD.search(txt) or RE_DIM.search(txt):
            continue
        if txt.casefold() in nomes:       # legenda repetindo o nome do movel
            continue
        if txt.isupper() and len(txt) <= 12:  # selo grafico (MONTAGEM, FLEX)
            continue
        alvo = min(produtos, key=lambda p: (
            (p["_tx"] - sp["x"]) ** 2 + ((p["_ty"] - sp["y"]) * 0.7) ** 2))
        if not any(c["nome"] == txt for c in alvo["cores"]):
            alvo["cores"].append({"nome": txt, "xref": foto_do_rotulo(sp, imagens)})


def atribui_imagens(produtos: list[dict], imagens: list[dict]) -> None:
    """Cada produto fica com as imagens mais proximas do seu titulo.

    Pagina de produto unico leva todas. Em pagina compartilhada, distribui por
    distancia (guloso) para que ninguem fique sem foto.
    """
    if not imagens:
        return
    if len(produtos) == 1:
        produtos[0]["imagens"] = [{"xref": i["xref"], "area": i["area"]} for i in imagens]
        return

    def dist(p: dict, im: dict) -> float:
        return ((p["_tx"] - im["cx"]) ** 2 + ((p["_ty"] - im["cy"]) * 0.8) ** 2) ** 0.5

    pares = sorted(
        ((dist(p, im), pi, ii) for pi, p in enumerate(produtos) for ii, im in enumerate(imagens)))
    usados: set[int] = set()
    # primeira rodada: uma foto para cada produto, do par mais proximo ao mais distante
    com_foto: set[int] = set()
    for _, pi, ii in pares:
        if pi in com_foto or ii in usados:
            continue
        produtos[pi]["imagens"].append({"xref": imagens[ii]["xref"], "area": imagens[ii]["area"]})
        com_foto.add(pi)
        usados.add(ii)
        if len(com_foto) == len(produtos):
            break
    # sobras vao para o produto mais proximo
    for ii, im in enumerate(imagens):
        if ii in usados:
            continue
        pi = min(range(len(produtos)), key=lambda k: dist(produtos[k], im))
        produtos[pi]["imagens"].append({"xref": im["xref"], "area": im["area"]})
    # produto sem nenhuma foto herda a maior da pagina (foto de ambiente)
    for p in produtos:
        if not p["imagens"]:
            p["imagens"].append({"xref": imagens[0]["xref"], "area": imagens[0]["area"]})
        p["imagens"].sort(key=lambda i: i["area"], reverse=True)


def abre_imagem(doc: pymupdf.Document, xref: int) -> Image.Image | None:
    """Abre a imagem ja com a transparencia aplicada.

    Muitos PNGs do catalogo guardam o recorte numa mascara separada (SMask).
    Lida sem ela, a area transparente sai preta.
    """
    try:
        smask = doc.xref_get_key(xref, "SMask")
        base = pymupdf.Pixmap(doc, xref)
        if base.colorspace and base.colorspace.n > 3:
            base = pymupdf.Pixmap(pymupdf.csRGB, base)
        if base.alpha:
            return Image.frombytes("RGBA", (base.width, base.height), base.samples)
        rgb = Image.frombytes("RGB", (base.width, base.height), base.samples)
        if smask[0] == "xref":
            mask_xref = int(smask[1].split()[0])
            m = pymupdf.Pixmap(doc, mask_xref)
            if m.n > 1:
                m = pymupdf.Pixmap(pymupdf.csGRAY, m)
            alfa = Image.frombytes("L", (m.width, m.height), m.samples)
            if alfa.size != rgb.size:
                alfa = alfa.resize(rgb.size, Image.LANCZOS)
            rgb.putalpha(alfa)
        return rgb
    except Exception:
        try:
            return Image.open(io.BytesIO(doc.extract_image(xref)["image"]))
        except Exception:
            return None


def salva_imagens(doc: pymupdf.Document, produto: dict, pasta: Path) -> list[dict]:
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    for i, img in enumerate(produto["imagens"]):
        im = abre_imagem(doc, img["xref"])
        if im is None:
            continue
        if im.mode in ("RGBA", "LA", "P"):
            fundo = Image.new("RGB", im.size, (255, 255, 255))
            im = im.convert("RGBA")
            fundo.paste(im, mask=im.split()[-1])
            im = fundo
        else:
            im = im.convert("RGB")
        if im.width < 120 or im.height < 120:
            continue
        largura_max = 1400 if i == 0 else 900
        if im.width > largura_max:
            im = im.resize((largura_max, round(im.height * largura_max / im.width)),
                           Image.LANCZOS)
        buffer = io.BytesIO()
        im.save(buffer, "WEBP", quality=82, method=5)
        dados = buffer.getvalue()
        nome = f"{i}-{hashlib.sha1(dados).hexdigest()[:8]}.webp"
        (pasta / nome).write_bytes(dados)
        # miniatura para cartões e listas: o site troca "-<hash>.webp" por
        # "-<hash>-m.webp" e só baixa a foto grande na página do móvel
        mini = im.copy()
        mini.thumbnail((LARGURA_MINIATURA, LARGURA_MINIATURA * 2), Image.LANCZOS)
        mini.save(pasta / nome.replace(".webp", "-m.webp"), "WEBP", quality=78, method=5)
        arquivos.append({"arquivo": nome, "largura": im.width, "altura": im.height,
                         "xref": img["xref"]})
    return arquivos


def funde_variacoes(brutos: list[dict]) -> list[dict]:
    """O mesmo movel costuma ocupar paginas seguidas, uma por acabamento.

    Junta esses registros num produto so, somando cores, fotos e ficha tecnica.
    """
    por_slug: dict[str, dict] = {}
    ordem: list[str] = []
    for p in brutos:
        base = slugify(p["nome"]) or f"produto-p{p['pagina']}"
        anterior = por_slug.get(base)
        # so funde se for pagina vizinha: nomes iguais distantes sao moveis distintos
        if anterior and p["pagina"] - anterior["_ultima_pagina"] <= 2:
            anterior["_ultima_pagina"] = p["pagina"]
            anterior["paginas"].append(p["pagina"])
            for c in p["cores"]:
                igual = next((a for a in anterior["cores"] if a["nome"] == c["nome"]), None)
                if igual is None:
                    anterior["cores"].append(c)
                elif igual["xref"] is None:
                    igual["xref"] = c["xref"]
            for s in p["specs"]:
                if s not in anterior["specs"]:
                    anterior["specs"].append(s)
            for cod in p["codigos"]:
                if cod not in anterior["codigos"]:
                    anterior["codigos"].append(cod)
            anterior["imagens"].extend(p["imagens"])
            anterior["dimensoes"] = anterior["dimensoes"] or p["dimensoes"]
            anterior["peso_kg"] = anterior["peso_kg"] or p["peso_kg"]
            anterior["volumes"] = anterior["volumes"] or p["volumes"]
            continue
        novo = dict(p)
        novo["slug"] = base if base not in por_slug else f"{base}-p{p['pagina']}"
        novo["paginas"] = [p["pagina"]]
        novo["_ultima_pagina"] = p["pagina"]
        por_slug[novo["slug"]] = novo
        por_slug[base] = novo
        ordem.append(novo["slug"])
    vistos: set[int] = set()
    final = []
    for slug in ordem:
        p = por_slug[slug]
        if id(p) in vistos:
            continue
        vistos.add(id(p))
        # remove fotos repetidas mantendo a ordem (maior primeiro)
        unicas, xrefs = [], set()
        for im in sorted(p["imagens"], key=lambda i: -i["area"]):
            if im["xref"] not in xrefs:
                xrefs.add(im["xref"])
                unicas.append(im)
        p["imagens"] = unicas
        p.pop("_ultima_pagina", None)
        p.pop("_tx", None)
        p.pop("_ty", None)
        final.append(p)
    return final


def main() -> int:
    com_imagens = "--images" in sys.argv
    doc = pymupdf.open(PDF)
    OUT.mkdir(parents=True, exist_ok=True)

    brutos: list[dict] = []
    sem_titulo: list[int] = []
    for idx in range(1, doc.page_count):
        achados, _ = extrai_pagina(doc, idx)
        if not achados:
            sem_titulo.append(idx + 1)
            continue
        brutos.extend(achados)

    produtos = funde_variacoes(brutos)
    # um produto precisa de foto e de algum dado concreto para entrar no site
    produtos = [p for p in produtos
                if p["imagens"] and (p["codigos"] or p["dimensoes"] or len(p["specs"]) >= 2)]

    if com_imagens:
        shutil.rmtree(IMG_DIR, ignore_errors=True)
        for n, p in enumerate(produtos, 1):
            p["arquivos"] = salva_imagens(doc, p, IMG_DIR / p["slug"])
            por_xref = {a["xref"]: a["arquivo"] for a in p["arquivos"]}
            for c in p["cores"]:
                # so vale a foto que ficou com este movel (pagina compartilhada
                # pode ter o rotulo de um e a foto de outro)
                c["arquivo"] = por_xref.get(c["xref"])
            if n % 50 == 0:
                print(f"  ... {n}/{len(produtos)} produtos", flush=True)
        produtos = [p for p in produtos if p["arquivos"]]

    (OUT / "catalogo.json").write_text(
        json.dumps(produtos, ensure_ascii=False, indent=1), encoding="utf-8")

    cats: dict[str, int] = {}
    for p in produtos:
        cats[p["categoria"]] = cats.get(p["categoria"], 0) + 1
    print(f"\nprodutos: {len(produtos)} | paginas sem titulo: {len(sem_titulo)} {sem_titulo[:12]}")
    print(f"sem codigo: {sum(1 for p in produtos if not p['codigos'])} | "
          f"sem dimensoes: {sum(1 for p in produtos if not p['dimensoes'])} | "
          f"sem imagem: {sum(1 for p in produtos if not p['imagens'])} | "
          f"sem cor: {sum(1 for p in produtos if not p['cores'])}")
    for c, n in sorted(cats.items(), key=lambda kv: -kv[1]):
        print(f"  {c:32} {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
