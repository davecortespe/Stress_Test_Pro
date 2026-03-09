# Lead Time Impact Insights

## Baseline
- Total lead time: 44062.73 min
- Wait-time share: 98.04%
- Top contributor: Approval

## Sensitivity Ranking (Lead Time -50% at one step)
1. Approval: -21600.00 min (-49.02%)
2. Receiving: 0.00 min (0.00%)
3. QA: 0.00 min (0.00%)
4. Storage: 0.00 min (0.00%)
5. Generate Claim: 0.00 min (0.00%)
6. Follow  UP: 0.00 min (0.00%)
7. Send: 0.00 min (0.00%)

## Interpretation
- Lead-time behavior is highly concentrated at Approval; reductions there dominate total lead-time improvement.
- Elasticity of Approval vs total lead time: 0.980.
- Steps with null/zero explicit Lead Time show negligible sensitivity until non-zero values are entered.

## Recommended Next Moves
1. Validate and refine Lead Time entries for currently null steps in the Step Inspector.
2. Prioritize reduction experiments on Approval first, then Receiving.
3. Re-run this analysis after each committed lead-time update to track migration in top contributors.
