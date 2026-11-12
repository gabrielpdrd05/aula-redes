#!/usr/bin/env python3
"""Compila el temario de Aula de Redes.

Lee los módulos escritos en Markdown (contenido/*.md) y genera:
  - data/curso.json   estructura completa (módulos, lecciones ya analizadas en bloques y cuestionarios)
  - data/buscar.json  índice de búsqueda (texto plano por lección)
  - data/examen.json  banco de preguntas del simulador de examen, etiquetadas por dominio del CCNA

Formato de cada módulo:
    ---
    id: m1
    titulo: Fundamentos de redes
    dominio: 1.0 Network Fundamentals
    peso: 20
    descripcion: ...
    ---
    === m1-redes | ¿Qué es una red? | 12 | 1      (el último número es el nivel: 1 principiante, 2 intermedio, 3 avanzado)
    Texto en Markdown (párrafos, listas, **negrita**, *cursiva*, `código`, [enlaces](https://...), tablas,
    bloques ``` con lenguaje), avisos (::: nota / ::: examen / ::: cuidado ... :::), elementos interactivos
    ([[anim:arp]], [[lab:subnetting]], [[cli:vlan]], [[sql:select]]) y un cuestionario:
    ::: quiz
    ? Enunciado
    - opción incorrecta
    + opción correcta
    = Explicación de la respuesta.
    :::

Uso: python3 scripts/build_curso.py [--check]   (--check: no escribe, falla si data/ no está al día)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "contenido"
OUT = ROOT / "data"

# Elementos interactivos que existen en la web (se comprueba que cada [[tipo:id]] apunta a uno real).
KNOWN = {
    "anim": {"encapsulacion", "switch", "arp", "tcp", "dhcp", "dns", "vlan", "stp", "enrutamiento", "nat", "acl", "ospf"},
    "lab": {"subnetting", "binario", "vlsm"},
    "cli": {"basico", "vlan", "trunk", "estatica", "ospf", "acl", "ssh", "portsecurity", "router", "intervlan", "dhcp", "nat",
            "averia-puerto", "averia-trunk", "averia-gestion", "averia-ruta", "averia-ospf", "averia-ssh", "averia-acl", "averia-duplex"},
    "sql": {"select", "join", "agregacion", "funciones", "subconsultas", "modificar", "ddl", "ventanas", "inventario"},
    "code": {"python-basico", "python-condicionales", "python-bucles", "python-colecciones", "python-redes", "python-poo",
             "js-basico", "js-arrays", "js-avanzado", "python-libre", "js-libre"},
}
CALLOUTS = {"nota", "examen", "cuidado", "practica", "comando"}
AREAS = ("redes", "bd", "prog")
LESSON_RE = re.compile(r"^===\s*([a-z0-9-]+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*([123])\s*$")
INLINE_RE = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\((?:https://|\./|#)[^)\s]+\)|(?<![\w*])\*[^*\s][^*]*?\*(?!\w))")


class ContentError(Exception):
    pass


def inline(text: str) -> list:
    """Convierte texto con **negrita**, *cursiva*, `código` y [enlaces](https://...) en segmentos."""
    out, pos = [], 0
    for m in INLINE_RE.finditer(text):
        if m.start() > pos:
            out.append({"t": "text", "v": text[pos:m.start()]})
        tok = m.group(0)
        if tok.startswith("**"):
            out.append({"t": "b", "v": tok[2:-2]})
        elif tok.startswith("`"):
            out.append({"t": "code", "v": tok[1:-1]})
        elif tok.startswith("["):
            label, href = re.match(r"\[([^\]]+)\]\(([^)]+)\)", tok).groups()
            out.append({"t": "link", "v": label, "href": href})
        else:
            out.append({"t": "i", "v": tok[1:-1]})
        pos = m.end()
    if pos < len(text):
        out.append({"t": "text", "v": text[pos:]})
    return out


def plain(segments: list) -> str:
    return "".join(s["v"] for s in segments)


def parse_quiz(lines: list[str], where: str) -> list:
    questions, cur = [], None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith("? "):
            cur = {"q": line[2:].strip(), "options": [], "correct": [], "explain": ""}
            questions.append(cur)
        elif cur is None:
            raise ContentError(f"{where}: el cuestionario debe empezar con '? pregunta'")
        elif line.startswith(("- ", "+ ")):
            if line[0] == "+":
                cur["correct"].append(len(cur["options"]))
            cur["options"].append(line[2:].strip())
        elif line.startswith("= "):
            cur["explain"] = (cur["explain"] + " " + line[2:].strip()).strip()
        else:
            raise ContentError(f"{where}: línea de cuestionario no reconocida: {line!r}")
    for q in questions:
        if len(q["options"]) < 2 or not q["correct"]:
            raise ContentError(f"{where}: la pregunta {q['q']!r} necesita al menos 2 opciones y una correcta")
        if not q["explain"]:
            raise ContentError(f"{where}: la pregunta {q['q']!r} no tiene explicación (= ...)")
    return questions


def parse_blocks(lines: list[str], where: str) -> tuple[list, list]:
    blocks, quiz = [], []
    i, para = 0, []

    def flush_para():
        if para:
            blocks.append({"t": "p", "c": inline(" ".join(s.strip() for s in para))})
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if not s:
            flush_para(); i += 1; continue
        if s.startswith("```"):
            flush_para()
            lang = s[3:].strip() or "texto"
            j = i + 1
            code = []
            while j < len(lines) and not lines[j].strip().startswith("```"):
                code.append(lines[j].rstrip("\n"))
                j += 1
            if j >= len(lines):
                raise ContentError(f"{where}: bloque de código sin cerrar")
            blocks.append({"t": "code", "lang": lang, "v": "\n".join(code)})
            i = j + 1; continue
        if s.startswith(":::"):
            flush_para()
            kind = s[3:].strip()
            j = i + 1
            inner = []
            depth = 0
            while j < len(lines):
                t = lines[j].strip()
                if t.startswith(":::") and t != ":::":
                    depth += 1
                elif t == ":::":
                    if depth == 0:
                        break
                    depth -= 1
                inner.append(lines[j])
                j += 1
            if j >= len(lines):
                raise ContentError(f"{where}: bloque ::: {kind} sin cerrar")
            if kind == "quiz":
                quiz.extend(parse_quiz(inner, where))
            elif kind in CALLOUTS:
                sub, subquiz = parse_blocks(inner, where)
                if subquiz:
                    raise ContentError(f"{where}: no puede haber cuestionario dentro de un aviso")
                blocks.append({"t": "callout", "kind": kind, "c": sub})
            else:
                raise ContentError(f"{where}: tipo de bloque desconocido ::: {kind}")
            i = j + 1; continue
        m = re.fullmatch(r"\[\[(\w+):([\w-]+)\]\]", s)
        if m:
            flush_para()
            kind, ident = m.groups()
            if ident not in KNOWN.get(kind, set()):
                raise ContentError(f"{where}: elemento interactivo desconocido [[{kind}:{ident}]]")
            blocks.append({"t": "embed", "kind": kind, "id": ident})
            i += 1; continue
        hm = re.match(r"^(#{2,4})\s+(.*)$", s)
        if hm:
            flush_para()
            blocks.append({"t": "h", "level": len(hm.group(1)), "c": inline(hm.group(2))})
            i += 1; continue
        if re.match(r"^([-*]|\d+\.)\s+", s):
            flush_para()
            ordered = bool(re.match(r"^\d+\.", s))
            items = []
            while i < len(lines) and re.match(r"^\s*([-*]|\d+\.)\s+", lines[i]):
                item = re.sub(r"^\s*([-*]|\d+\.)\s+", "", lines[i]).strip()
                i += 1
                while i < len(lines) and lines[i].startswith("  ") and lines[i].strip() and not re.match(r"^\s*([-*]|\d+\.)\s+", lines[i]):
                    item += " " + lines[i].strip(); i += 1
                items.append(inline(item))
            blocks.append({"t": "ol" if ordered else "ul", "items": items})
            continue
        if s.startswith("|"):
            flush_para()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                # Celdas separadas por | ; un \| dentro de una celda es una barra literal (por ejemplo el operador ||).
                fila = lines[i].strip()
                fila = fila[1:] if fila.startswith("|") else fila
                fila = fila[:-1] if fila.endswith("|") and not fila.endswith("\\|") else fila
                cells = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", fila)]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append([inline(c) for c in cells])
                i += 1
            if len(rows) < 2:
                raise ContentError(f"{where}: una tabla necesita cabecera y al menos una fila")
            width = len(rows[0])
            if any(len(r) != width for r in rows):
                raise ContentError(f"{where}: filas de tabla con distinto número de columnas")
            blocks.append({"t": "table", "head": rows[0], "rows": rows[1:]})
            continue
        para.append(line)
        i += 1
    flush_para()
    return blocks, quiz


def block_text(blocks: list) -> str:
    parts = []
    for b in blocks:
        t = b["t"]
        if t in ("p", "h"):
            parts.append(plain(b["c"]))
        elif t in ("ul", "ol"):
            parts.extend(plain(it) for it in b["items"])
        elif t == "code":
            parts.append(b["v"])
        elif t == "callout":
            parts.append(block_text(b["c"]))
        elif t == "table":
            parts.extend(" | ".join(plain(c) for c in row) for row in [b["head"], *b["rows"]])
    return "\n".join(parts)


def parse_module(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ContentError(f"{path.name}: falta la cabecera --- ... ---")
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    for key in ("id", "titulo", "descripcion", "area"):
        if not meta.get(key):
            raise ContentError(f"{path.name}: falta '{key}' en la cabecera")
    body = text[m.end():].splitlines()
    lessons, cur, buf = [], None, []

    def close():
        if cur is None:
            return
        where = f"{path.name} › {cur['id']}"
        blocks, quiz = parse_blocks(buf, where)
        if not blocks:
            raise ContentError(f"{where}: lección vacía")
        cur["blocks"], cur["quiz"] = blocks, quiz
        cur["texto"] = block_text(blocks)
        lessons.append(cur)

    for line in body:
        lm = LESSON_RE.match(line.strip())
        if lm:
            close()
            lid, title, minutes, level = lm.groups()
            if not lid.startswith(meta["id"] + "-"):
                raise ContentError(f"{path.name}: la lección {lid} debe empezar por '{meta['id']}-'")
            cur, buf = {"id": lid, "titulo": title, "minutos": int(minutes), "nivel": int(level)}, []
        elif line.startswith("=== "):
            raise ContentError(f"{path.name}: cabecera de lección mal formada (=== id | título | minutos | nivel 1-3): {line!r}")
        elif cur is None:
            if line.strip():
                raise ContentError(f"{path.name}: texto antes de la primera lección: {line!r}")
        else:
            buf.append(line)
    close()
    if not lessons:
        raise ContentError(f"{path.name}: el módulo no tiene lecciones")
    return {
        "id": meta["id"], "titulo": meta["titulo"], "descripcion": meta["descripcion"],
        "dominio": meta.get("dominio", ""), "peso": int(meta.get("peso", 0) or 0), "area": meta["area"],
        "lecciones": lessons,
    }


def build() -> dict[str, str]:
    modules = [parse_module(p) for p in sorted(SRC.glob("*.md")) if not p.name.startswith("_")]
    ids = [l["id"] for m in modules for l in m["lecciones"]]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        raise ContentError(f"Identificadores de lección repetidos: {sorted(dup)}")
    if len({m['id'] for m in modules}) != len(modules):
        raise ContentError("Identificadores de módulo repetidos")

    curso = {"modulos": []}
    buscar, examen = [], []
    for m in modules:
        if m["area"] not in AREAS:
            raise ContentError(f"Módulo {m['id']}: área desconocida {m['area']!r} (usa {', '.join(AREAS)})")
        mod = {k: m[k] for k in ("id", "titulo", "descripcion", "dominio", "peso", "area")}
        mod["lecciones"] = []
        for l in m["lecciones"]:
            mod["lecciones"].append({k: l[k] for k in ("id", "titulo", "minutos", "nivel", "blocks", "quiz")})
            buscar.append({"id": l["id"], "modulo": m["id"], "titulo": l["titulo"], "texto": l["texto"]})
            for n, q in enumerate(l["quiz"]):
                examen.append({"id": f"{l['id']}#{n}", "modulo": m["id"], "area": m["area"], "dominio": m["dominio"], **q})
        curso["modulos"].append(mod)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")) + "\n"
    return {"curso.json": dump(curso), "buscar.json": dump(buscar), "examen.json": dump(examen)}


def main() -> int:
    check = "--check" in sys.argv
    try:
        files = build()
    except ContentError as e:
        print(f"Error en el temario: {e}", file=sys.stderr)
        return 1
    stale = []
    OUT.mkdir(exist_ok=True)
    for name, content in files.items():
        target = OUT / name
        if check:
            if not target.exists() or target.read_text(encoding="utf-8") != content:
                stale.append(name)
        else:
            target.write_text(content, encoding="utf-8")
    curso = json.loads(files["curso.json"])
    n_lessons = sum(len(m["lecciones"]) for m in curso["modulos"])
    n_q = len(json.loads(files["examen.json"]))
    if stale:
        print("data/ no está al día (ejecuta python3 scripts/build_curso.py): " + ", ".join(stale), file=sys.stderr)
        return 1
    print(f"Temario {'al día' if check else 'compilado'}: {len(curso['modulos'])} módulos, {n_lessons} lecciones, {n_q} preguntas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
