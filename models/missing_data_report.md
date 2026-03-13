# Missing Data Report

Source: user-provided VSM image transcribed on 2026-03-13.

## Global gaps

- VSM title/name is not visible.
- Demand rate is not visible.
- Product mix is not visible.
- Lot size is not visible.
- Shift hours (hours per shift) are not visible.
- Uptime/downtime assumptions are not visible.
- Worker counts are not visible.

## Step-level unresolved fields

| Step | Missing / null field | Reason |
| --- | --- | --- |
| Raw Material Staging & Weighing | `workers` | Worker count is not shown in the image. |
| Buffer / Media Preparation | `workers` | Worker count is not shown in the image. |
| Upstream Batch Transfer to Purification | `workers` | Worker count is not shown in the image. |
| Primary Capture Chromatography | `workers` | Worker count is not shown in the image. |
| Intermediate Purification Step | `workers` | Worker count is not shown in the image. |
| Viral Inactivation / Hold | `workers` | Worker count is not shown in the image. |
| Polishing Chromatography | `workers` | Worker count is not shown in the image. |
| UF/DF Concentration & Diafiltration | `workers` | Worker count is not shown in the image. |
| Bulk Fill / Collection | `workers` | Worker count is not shown in the image. |
| Sample Submission to QC | `workers` | Worker count is not shown in the image. |
| QC Testing / Release Hold | `workers` | Worker count is not shown in the image. |
| Final Bulk Release to Packaging / Cold Storage | `workers` | Worker count is not shown in the image. |

## Notes on strict transcription

- Step labels and sequence are preserved exactly as visible in the provided image.
- `Lead Time (hrs)` is transcribed as step wait/flow-delay input.
- `# of Lines` is transcribed as `parallelProcedures`.
- `# of Shifts` is preserved per-step in notes/data, but conversion to staffed hours requires an assumption (not visible in source).
