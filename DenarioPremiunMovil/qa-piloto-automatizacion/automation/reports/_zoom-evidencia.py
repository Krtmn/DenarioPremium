# -*- coding: utf-8 -*-
"""
RECORTE DE EVIDENCIA — amplía la zona clave de una captura de la app.

Uso:  python automation/reports/_zoom-evidencia.py <captura.png> <salida.png> [y_ini] [y_fin]

Por qué existe: las capturas del dispositivo son 720x1600 (verticales). En un A4 caben
acotadas a ~138 mm de alto, y ahí la fila de la tabla que PRUEBA el resultado queda
diminuta. Este script recorta la banda relevante y la amplía x2, de modo que el informe
lleve la captura completa (contexto) MÁS el recorte legible (prueba).

y_ini / y_fin son fracciones de la altura (0..1). Por defecto **0.535-0.585**, banda
VERIFICADA el 2026-08-26 sobre capturas 720x1600 del Tab TOTAL de Cobros: encuadra la
cabecera y la fila de `Nro. Doc. / Monto Doc. / Monto Pago / Monto Saldo`.
Con DOS filas de documento, usar **0.515-0.625**.

⚠ La banda depende de la pantalla y de la resolución. Si el Tab TOTAL trae más filas
  arriba (otro cliente con más totalizadores), la tabla baja y hay que correr la banda.
  **Mirar SIEMPRE el recorte antes de meterlo en el informe**: una banda mal elegida
  corta justo el número y la "prueba" no prueba nada.
  Referencia medida: y=0.47-0.53 cae en «Diferencia VES», demasiado arriba.

🔴 LECCIÓN CARA (2026-08-26) — EL RECORTE DEBE CONTENER LA COLUMNA EN DISPUTA.
  En el caso de RETENCIÓN aparecen columnas extra (`Retención IVA`, `Retención ISLR`) y la
  tabla se desplaza horizontalmente. El recorte publicado como prueba de ese escenario
  quedó sobre las columnas de retención y **no mostraba `Monto Saldo`**, que era justo lo
  que había que demostrar. El informe salió con una evidencia que no probaba su afirmación.
  ⇒ Antes de publicar: confirmar que en el recorte se leen TODAS las columnas citadas en el
    texto. Si no entran juntas, ajustar el `scrollLeft` de `ion-grid.tablaDocVentasGrip`
    antes de capturar, o tomar dos recortes solapados y explicar el solape.
"""
import sys
from PIL import Image

if len(sys.argv) < 3:
    print("ERR: uso: _zoom-evidencia.py <entrada.png> <salida.png> [y_ini] [y_fin]")
    sys.exit(1)

src, dst = sys.argv[1], sys.argv[2]
y0 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.535
y1 = float(sys.argv[4]) if len(sys.argv) > 4 else 0.585

im = Image.open(src)
w, h = im.size
rec = im.crop((0, int(h * y0), w, int(h * y1)))
rec = rec.resize((rec.width * 2, rec.height * 2), Image.LANCZOS)
rec.save(dst)
print("OK %s  %dx%d  (banda y=%.2f-%.2f de %dx%d)" % (dst, rec.width, rec.height, y0, y1, w, h))
