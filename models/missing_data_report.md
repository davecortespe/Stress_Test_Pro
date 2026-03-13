# Missing Data Report

Source: user-provided VSM image transcribed on 2026-03-12.

## Global gaps

- Demand rate is not visible.
- Shift calendar / staffed hours are not visible.
- Uptime / downtime assumptions are not visible.
- Variability assumptions are not visible.
- Resource-sharing rules between stages are not visible.

## Step-level unresolved fields

| Step | Missing / null field | Reason |
| --- | --- | --- |
| Order entry and RN awareness | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; visible counts are shared pool sizes, not step-dedicated workers or stations. |
| RN review and patient clinical prep | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; visible counts are shared pool sizes, not step-dedicated workers or stations. |
| Discharge clearance and med processing | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; visible counts are shared pool sizes, not step-dedicated workers or stations. |
| Education and paperwork completion | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; visible counts are shared pool sizes, not step-dedicated workers or stations. |
| Patient/family departure prep | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; patient/family has no numeric count and RN support is marked optional. |
| Transport and physical exit | `changeover`, `workers`, `parallelProcedures` | No C/O is shown; visible counts are shared pool sizes, not step-dedicated workers or stations. |

## Material modeling ambiguity

- The image shows shared resource pools by step, but it does not specify whether those pools are required simultaneously, partially shared, or only conditionally involved. Forecast capacity inference must therefore use an explicit assumption in compilation rather than a directly observed value.
