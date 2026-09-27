# Balance

Measured with `npm run balance` (see `scripts/balance.mjs`): a heuristic bot plays seeded nights.
Each seed is deterministic (seeded `Math.random`, fixed 60 fps logic steps, audio disabled), so a
change to `TUNING`/`SHADOWS` can be compared on the same nights. Try a change without editing code:

```
npm run balance -- --seeds 1,2,3,4,5,6,7,8,9,10 --tuning '{"energyDecayGrowth":0.004}'
```

Every gameplay number (spawn timings and distances, pickup and contact radii, points, Shadow
behaviour, shields per Shadow kind) lives in `TUNING` or `SHADOWS`, so `--tuning` can reach it.

The bot collects Moon dew, then lost fireflies, then pollen (avoiding spots near Shadows), flees
nearby Shadows and fires a Flash when one gets close and it has ≥ 28 light. It is not a human:
it reacts instantly but never plans. Treat the numbers as relative, and confirm with real players.

## Target (D09)

A competent player — approximated by the bot — reaches dawn in **3 to 5 nights out of 10**, with a
median survival of **at least 125 s**: tense to the last seconds, but beatable.

## 2026-09-27 — baseline (`energyDecayGrowth: 0.005`)

| Seed | Outcome | Survived (s) | Score | Flashes | Largest swarm | Moon dew |
|---|---|---|---|---|---|---|
| 1 | light out | 109 | 4806 | 28 | 9 | 2 |
| 2 | light out | 98.5 | 3412 | 25 | 9 | 2 |
| 3 | light out | 102 | 3673 | 26 | 7 | 2 |
| 4 | light out | 126.3 | 5321 | 29 | 9 | 3 |
| 5 | light out | 104.6 | 3787 | 25 | 8 | 2 |
| 6 | light out | 72.1 | 1938 | 17 | 4 | 1 |
| 7 | light out | 91.3 | 3278 | 21 | 7 | 2 |
| 8 | light out | 103.2 | 3914 | 27 | 7 | 2 |
| 9 | light out | 123.2 | 4123 | 23 | 7 | 2 |
| 10 | dawn | 150 | 8716 | 39 | 11 | 3 |

Dawn reached in 1/10 nights; median survival 104.6 s. Most nights end between 90 and 127 s, after the
second wave (95 s) with the Colossus already around. The earlier informal estimate ("2 of 3 nights
reach dawn", 3 non-deterministic runs) was too optimistic.

## Experiments (same 10 seeds)

| Change | Dawn | Median survival | Verdict |
|---|---|---|---|
| none (baseline) | 1/10 | 104.6 s | too hard for the target |
| `waveGrowth: 1` (waves of 3, 4, 5) | 0/10 | 123.7 s | nights last longer but still end before dawn: waves are not the main killer |
| `energyDecayGrowth: 0.003` | 5/10 | 150 s | upper edge of the target |
| `energyDecayGrowth: 0.004` | 4/10 | 137.4 s | **adopted**: in the middle of the target, several losses within seconds of dawn |

## 2026-09-27 — adopted (`energyDecayGrowth: 0.004`)

| Seed | Outcome | Survived (s) | Score | Flashes | Largest swarm | Moon dew |
|---|---|---|---|---|---|---|
| 1 | light out | 127.8 | 5171 | 29 | 10 | 2 |
| 2 | dawn | 150 | 8835 | 41 | 11 | 3 |
| 3 | light out | 99.9 | 3922 | 23 | 8 | 2 |
| 4 | light out | 133.3 | 5834 | 30 | 8 | 3 |
| 5 | dawn | 150 | 8288 | 38 | 9 | 3 |
| 6 | dawn | 150 | 7575 | 31 | 8 | 3 |
| 7 | dawn | 150 | 7911 | 35 | 10 | 3 |
| 8 | light out | 94.7 | 2892 | 20 | 7 | 2 |
| 9 | light out | 137.4 | 5673 | 31 | 8 | 3 |
| 10 | light out | 71.4 | 2167 | 17 | 7 | 1 |

Dawn reached in 4/10 nights; median survival 137.4 s.
