---
type: task
status: done
priority: medium
createdAt: 2026-08-30T21:05:44.393Z
---

# Clarify the 200 kB initial JS budget: compressed or raw

> **Resolved in the adapt phase of `gen-001-76ea93`.** The human chose gzip. Genome and
> spec both amended with the unit and the measurement method.

## Problem

Spec section 6 and `genome/application.md` both state: initial load under 200 kB of JS
excluding Three.js. The unit is not specified.

Measured on the lot 0 scaffold — React 19 and react-dom only, no router, no Zustand, no
GSAP, no application code at all:

```
dist/assets/index-DSb_Smf7.js  190.55 kB │ gzip: 60.02 kB
```

Read as raw bytes, the budget is 95% consumed by the framework alone, before a single line
of product code. It would be unmeetable: React Router, Zustand and the shell cannot fit in
the remaining 9 kB. Read as gzip, 60 kB leaves a comfortable 140 kB, and the constraint
becomes a real but achievable target.

The ambiguity has to be resolved before it is enforced, otherwise the first performance
audit (lot 7) either fails against an impossible number or silently reinterprets the
genome — and a constraint that gets reinterpreted when inconvenient stops being a
constraint.

## Solution

Ask the human which reading is intended. Recommendation: **gzip**, because it is what the
user actually downloads, it is what the nginx config already enables (brotli or gzip, spec
section 8), and it is the unit every comparable budget is quoted in.

Then amend `genome/application.md`, Constraints section, to state the unit explicitly and
record the measurement method — `vite build` output for the initial route chunk, excluding
lazily loaded family chunks and Three.js.

Also worth settling at the same time: the budget applies to the initial route (home or a
lesson shell without its family chunk), not to the sum of all chunks. Lazy loading by
family is already decided, so the wording should reflect what is actually measured.

## Files to Change

- `.reap/genome/application.md` — Constraints section, performance bullet on the 200 kB
  budget: add the unit and the measurement method.
- `design/spec-technique-anima-lab.md` — section 6, first bullet, for consistency with the
  genome. The spec is the product source of truth; it should not contradict it.
