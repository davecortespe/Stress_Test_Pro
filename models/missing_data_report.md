# Missing Data Report (Strict VSM Transcription)

Source image: attached VSM named `Filter Making Line`.

This report lists unresolved or ambiguous fields extracted from the provided image.

| Step | Field | Extracted value | Resolution | Reason |
| --- | --- | --- | --- | --- |
| Receiving | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Stocking | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Pleating | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Forming | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Capping | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Testing | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Packaging | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Palletizing | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Shipping | Workers | not visible | `null` | Worker count is not shown in the process box. |
| Palletizing | C/O (M) | `--` | `null` | C/O is visible as non-numeric (`--`). |
| Shipping | C/O (M) | `--` | `null` | C/O is visible as non-numeric (`--`). |
| Receiving -> Stocking | Wait duration | `FIFO` | unresolved | FIFO marker is visible but numeric wait and units are not shown. |
| Stocking -> Pleating | Wait duration | `FIFO` | unresolved | FIFO marker is visible but numeric wait and units are not shown. |
| Pleating -> Forming | Wait duration | `FIFO` | unresolved | FIFO marker is visible but numeric wait and units are not shown. |
| Testing -> Packaging | Wait duration | `FIFO` | unresolved | FIFO marker is visible but numeric wait and units are not shown. |
| Palletizing -> Shipping | Wait duration | `Inventory triangle (I)` | unresolved | Inventory marker is visible but numeric wait and units are not shown. |
| Pre-Receiving inbound | Inventory/wait | `Inventory triangle (I)` | unresolved | Upstream marker is visible but no quantity/time unit is shown. |
| Whole VSM | Demand/product mix/uptime policy | not visible | unresolved | Required forecasting policy inputs are absent from the image. |
| Whole VSM | Shift-hour calendar | partially visible (`# Shifts`) | unresolved | Shift count is visible but shift length/calendar rule is not shown in the image. |

## Strictly captured visible values
- Process sequence transcribed exactly:
  `Receiving -> Stocking -> Pleating -> Forming -> Capping -> Testing -> Packaging -> Palletizing -> Shipping`
- Process-box numeric values captured as shown (minutes where labeled `m`):
  - `C.T. (m)`: `10, 5.00, 20.00, 3.00, 1.00, 3.00, 3.00, 5.00, 5.00`
  - `Lead Time (m)`: `6, 10.00, 180.00, 1.00, 2.00, 4.00, 10.00, 10.00, 10.00`
  - `C/O (M)`: `0, 0, 30.00, 30.00, 30.00, 20.00, 30.00, --, --`
  - `# of Lines/Shifts/Lot Size` values captured per process box as visible.
