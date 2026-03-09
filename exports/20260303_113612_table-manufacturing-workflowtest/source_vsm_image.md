# Missing Data Report (Strict VSM Transcription)

Source image title text: `Consumption Report`

This report lists unresolved or ambiguous fields extracted from the provided VSM image.

| Step | Field | Extracted value | Resolution | Reason |
| --- | --- | --- | --- | --- |
| Receiving | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Micro | D.T.(%) | not readable | `null` | No clear numeric value visible in D.T.(%) row. |
| Micro | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Granulation | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Compression | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Analitical Lab | D.T.(%) | not readable | `null` | No clear numeric value visible in D.T.(%) row. |
| Analitical Lab | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Docking | C.T.(m) | not readable | `null` | CT value not clearly visible in the process box. |
| Docking | D.T.(%) | not readable | `null` | No clear numeric value visible in D.T.(%) row. |
| Docking | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| Shipping | D.T.(%) | not readable | `null` | No clear numeric value visible in D.T.(%) row. |
| Shipping | C/O | not readable | `null` | No clear numeric value visible in C/O row. |
| All process steps | Workers | not shown | `null` | Worker counts are not visible in process boxes. |
| Whole VSM | Lead-time badge units | `7.3` | unresolved | The red text `LEAD TIME FROM CUSTOMER STAND POINT = 7.3` does not show units. |
| Whole VSM | Demand/mix/shift/uptime | not shown | unresolved | Arrival and staffing policy inputs are not fully specified in the image. |

## Notes captured as visible values
- Process sequence transcribed exactly: `Receiving -> Micro -> Granulation -> Compression -> Coating -> Printing -> Analitical Lab -> Packaging -> Docking -> Shipping`.
- Inbound/outbound inventory triangles show `7 Days` and `5-7 Days`; treated as contextual notes, not process nodes.
- `# of Lines` values were visible for Granulation (2), Compression (3), Coating (2), Printing (2), Packaging (1.00).
- Lead-time `8 hrs` is visible for Receiving, Micro, Granulation, Compression, Coating, Printing, Docking, and Shipping; `48 hrs` for Analitical Lab and Packaging.
- Bottom timeline values visible in this image pass: `0.05, 6.0, 1.0, -, 0.1, 2.19, 0.31, 1.89, 0.15, 0.52, 0.12, 4.02, 0.90, 20, 1.34, 0.71, 0.03`.
