# Missing Data Report

Source: user-provided VSM image transcribed on 2026-03-19.

## Global gaps

- The VSM title is not visible, so the model title was inferred from the bicycle assembly line context.
- Demand rate is not visible.
- Product mix is not visible.
- Hours per shift are not visible.

## Step-level unresolved fields

None. All visible process-box values used for strict transcription were readable.

## Notes on strict transcription

- Step labels and left-to-right sequence are preserved exactly as shown in the image.
- `CT`, `C/O`, lead/wait time, `# of Equipment`, `People Needed`, `# of Shifts`, `Lot Size`, `Rework %`, `Equipment Reliability`, and notes were transcribed from the visible table values.
- `People Needed` was mapped to `workers`.
- `# of Equipment` was mapped to `parallelProcedures`.
- The forecast compiler will infer baseline demand from the start-step release capacity because no explicit demand rate is shown in the image.
