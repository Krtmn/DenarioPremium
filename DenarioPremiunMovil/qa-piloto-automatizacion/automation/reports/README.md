# automation/reports — Convención de estructura

## Organización

Cada corrida tiene **su propia carpeta**, plana (sin subcarpetas):

```
reports/
  {tipo}_{cliente}_{YYYYMMDD}_{HHMMSS}/
    consolidado.md
    login.md
    clientes.md
    pedidos.md
    cobros.md
    devoluciones.md
    inventarios.md
    depositos.md
    visitas.md
    productos.md
    vendedores.md
```

**Archivo global (raíz):** este `README.md` (índice de corridas + convención).

## Nombre de carpeta

```
{tipo}_{cliente}_{YYYYMMDD}_{HHMMSS}
```

| Parte | Valores | Ejemplo |
|-------|---------|---------|
| tipo | `smoke` / `fulltest` | `smoke` |
| cliente | slug del YAML (`insumar`, `hidroponias`, `romher`) | `insumar` |
| fecha | `YYYYMMDD` del RUN_ID | `20260603` |
| hora | `HHMMSS` del RUN_ID | `093706` |

## Corridas registradas

| Carpeta | Cliente | Fecha | Módulos | Resultado |
|---------|---------|-------|---------|-----------|
| [smoke_hidroponias_20260527_113900](smoke_hidroponias_20260527_113900/consolidado.md) | hidroponias | 2026-05-27 | 10/10 | 110P · 3F · 1S · 9N/A |
| [smoke_hidroponias_20260529_145657](smoke_hidroponias_20260529_145657/) | hidroponias | 2026-05-29 | 9/10 (sin consolidado) | 103P · 3F — ver módulos individuales |
| [smoke_hidroponias_20260602_retest-cobros](smoke_hidroponias_20260602_retest-cobros/) | hidroponias | 2026-06-02 | retest cobros | parcial |
| [smoke_insumar_20260602_180248](smoke_insumar_20260602_180248/) | insumar | 2026-06-02 | 1/10 (solo login) | parcial |
| [smoke_insumar_20260603_093706](smoke_insumar_20260603_093706/consolidado.md) | insumar | 2026-06-03 | 10/10 | 93P · 2F · 4S · 14N/A |
| [smoke_romher_20260604_122859](smoke_romher_20260604_122859/consolidado.md) | romher | 2026-06-04 | 10/10 | 93P · 4F · 1S · 8N/A |
| [smoke_globalmp_20260605_162806](smoke_globalmp_20260605_162806/consolidado.md) | globalmp | 2026-06-05/08 | 10/10 | 96P · 1F · 3S · 21N/A |
| [smoke_insumar_20260609_132051](smoke_insumar_20260609_132051/consolidado.md) | insumar | 2026-06-09 | 10/10 | 115P · 1F · 3S · 15N/A |
| [smoke_dm-electronica_20260713_115814](smoke_dm-electronica_20260713_115814/consolidado.md) | dm-electronica (BOTZ) | 2026-07-13 | 10/10 | 117P · 0F · 0S · 20N/A |

## Rezagados — revisar manualmente

*(ninguno — todos los archivos existentes fueron agrupados en sus corridas)*
