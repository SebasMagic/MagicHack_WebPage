# -*- coding: utf-8 -*-
"""Comprime las imagenes de images/ sin cambiar sus nombres ni el HTML.

Por que: el deploy pesaba ~34 MB y varias fotos entraban a 2048px o mas para
mostrarse a 300-700px. Este script redimensiona al ancho maximo util y
recomprime, dejando el archivo en su misma ruta y extension.

Uso:
    python scripts/compress-images.py            # solo reporta, no toca nada
    python scripts/compress-images.py --apply    # escribe los cambios

Requiere Pillow (pip install Pillow).
"""
import argparse
import io
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instalalo con: pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "images")

# Ancho maximo por carpeta/uso. Son los anchos reales a los que el sitio
# muestra cada grupo, por 2 para pantallas retina.
RULES = [
    (os.path.join("images", "Team"), 900),   # avatares de 280px
    ("images", 1600),                        # fondos y portadas
]

# Se dejan fuera: el favicon (256x256, ya minimo), los SVG (no aplica) y los
# placeholders diminutos de Webflow.
SKIP_NAMES = {"favicon.png", "webclip.png", "Favicon MagicHack.png"}
SKIP_EXT = {".svg", ".ico", ".webp", ".gif"}
MIN_BYTES = 120 * 1024  # por debajo de esto no vale la pena tocar


def max_width_for(path):
    rel = os.path.relpath(path, ROOT)
    for prefix, width in RULES:
        if rel.startswith(prefix + os.sep) or rel.startswith(prefix + "/"):
            return width
    return None


def compress(path, apply_changes):
    name = os.path.basename(path)
    ext = os.path.splitext(name)[1].lower()
    if name in SKIP_NAMES or ext in SKIP_EXT:
        return None
    before = os.path.getsize(path)
    if before < MIN_BYTES:
        return None

    limit = max_width_for(path)
    if limit is None:
        return None

    try:
        img = Image.open(path)
    except Exception as e:
        print("  no se pudo abrir %s: %s" % (name, e))
        return None

    w, h = img.size
    resized = False
    if w > limit:
        img = img.resize((limit, round(h * limit / w)), Image.LANCZOS)
        resized = True

    buf = io.BytesIO()
    if ext in (".jpg", ".jpeg"):
        img.convert("RGB").save(buf, "JPEG", quality=82, optimize=True, progressive=True)
    elif ext == ".png":
        # Las portadas y fotos son fotograficas: una paleta de 256 colores
        # las deja igual a la vista y pesa una fraccion.
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img.convert("RGBA").quantize(colors=256, method=Image.FASTOCTREE).save(buf, "PNG", optimize=True)
        else:
            img.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT).save(buf, "PNG", optimize=True)
    else:
        return None

    after = buf.tell()
    if after >= before:
        return None  # nunca dejar el archivo peor de como estaba

    if apply_changes:
        with open(path, "wb") as f:
            f.write(buf.getvalue())

    return {
        "name": os.path.relpath(path, ROOT).replace("\\", "/"),
        "before": before,
        "after": after,
        "dims": "%dx%d -> %dx%d" % (w, h, img.size[0], img.size[1]) if resized else "%dx%d" % (w, h),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="escribe los cambios (por defecto solo reporta)")
    args = ap.parse_args()

    targets = []
    for base, _dirs, files in os.walk(IMAGES):
        for f in files:
            targets.append(os.path.join(base, f))
    targets.sort()

    results = [r for r in (compress(p, args.apply) for p in targets) if r]
    results.sort(key=lambda r: r["before"] - r["after"], reverse=True)

    total_before = sum(r["before"] for r in results)
    total_after = sum(r["after"] for r in results)

    for r in results:
        print("%-46s %7.0f KB -> %6.0f KB  (-%2.0f%%)  %s"
              % (r["name"], r["before"] / 1024, r["after"] / 1024,
                 100 * (1 - r["after"] / r["before"]), r["dims"]))

    if not results:
        print("Nada que comprimir.")
        return

    print("\n%d archivos | %.1f MB -> %.1f MB | ahorro %.1f MB (-%.0f%%)"
          % (len(results), total_before / 1048576, total_after / 1048576,
             (total_before - total_after) / 1048576,
             100 * (1 - total_after / total_before)))
    if not args.apply:
        print("\nSimulacion. Volve a correrlo con --apply para escribir los cambios.")


if __name__ == "__main__":
    main()
