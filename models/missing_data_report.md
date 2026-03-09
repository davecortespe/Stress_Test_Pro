# Missing Data Report (Strict VSM Transcription)

Source image: attached VSM beginning `Form & Filling` and ending `Release`.

This report lists unresolved or ambiguous fields extracted from the provided image.

| Step | Field | Extracted value | Resolution | Reason |
| --- | --- | --- | --- | --- |
| Form & Filling | C/O | not visible | `null` | No C/O value shown in the process box. |
| Inspection | C/O | not visible | `null` | No C/O value shown in the process box. |
| Packaging | C/O | not visible | `null` | No C/O value shown in the process box. |
| Functional Test | C/O | not visible | `null` | No C/O value shown in the process box. |
| COA | C/O | not visible | `null` | No C/O value shown in the process box. |
| Release | C/O | not visible | `null` | No C/O value shown in the process box. |
| All process steps | Workers | not visible | `null` | Worker counts are not shown in the image. |
| All process steps | Parallel procedures | not visible | `null` | Parallel line/procedure counts are not shown in the image. |
| Triangle between Form & Filling -> Inspection | Wait units | `5` | unresolved | Numeric value is visible but no explicit unit label is shown. |
| Triangle between Inspection -> Packaging | Wait units | `15` | unresolved | Numeric value is visible but no explicit unit label is shown. |
| Triangle after Release | Wait destination + units | `2.5` | unresolved | Value is visible, but no destination step or explicit unit label is shown. |
| Whole VSM | Demand/product mix/shift/uptime | not visible | unresolved | Required planning and capacity policy inputs are absent from the image. |

## Strictly captured visible values
- Process sequence transcribed exactly:
  `Form & Filling -> Inspection -> Packaging -> Functional Test -> COA -> Release`
- Process box values captured from image:
  - `Target days`: `2, 2, 4, 10, 4, 2`
  - `C.T. (Median)`: `2 days, 1 days, 2 days, 4 days, 2 days, 1 days`
- Status dots visible:
  - green: `Form & Filling`, `Inspection`, `Packaging`, `Functional Test`, `COA`, `Release`
