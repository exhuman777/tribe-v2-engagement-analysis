---
name: tribe-v2-engagement-analysis
description: Use when user wants to predict viewer brain engagement, find low-engagement moments, or get data-driven edit cuts for a video/podcast/script. Runs Meta's TRIBE v2 fMRI encoder, maps predictions to Yeo-7 networks (attention, DMN, reward, visual, language), and outputs timestamped edit recommendations.
---

# TRIBE v2 Engagement Analysis

## Overview

TRIBE v2 (Meta FAIR, 2026) predicts fMRI brain responses to video/audio/text on the fsaverage5 cortical surface (~20k vertices, 1 Hz). This skill turns those raw predictions into actionable edit notes: **where viewers tune out, where they focus, where to cut**.

**Core pipeline:** stimulus → TRIBE v2 → vertex time-series → Yeo-7 network aggregation → engagement score → valley detection → timestamped recommendations.

**License caveat:** TRIBE v2 is CC-BY-NC-4.0. Research / internal creative iteration only. Not a commercial audience measurement product.

## When to Use

- "Analyze this video for engagement drops"
- "Where should I cut this podcast?"
- "Predict how viewers react to this edit"
- "Find the boring parts of my script"
- "Rank these three cuts by predicted attention"

**Do NOT use for:** clinical claims, medical diagnosis, real-subject data (TRIBE predicts average-subject fMRI, not individuals), or commercial audience measurement products.

## Quick Reference

| Network (Yeo-7) | Meaning | High value = |
|---|---|---|
| Visual | V1–V4 activation | scene is visually dense |
| Dorsal Attention (DAN) | top-down focus | viewer locked in |
| Ventral Attention (VAN) | salience / surprise | something grabbed them |
| Limbic | reward / affect (cortical proxy) | emotional engagement |
| Frontoparietal (FPN) | cognitive control | active thinking |
| Default Mode (DMN) | self-referential / mind-wandering | **disengagement / drift** |
| Somatomotor | action / speech motor | physical involvement |

**Engagement score:** `E(t) = z(DAN) + z(VAN) + z(Limbic) + z(Visual) − z(DMN)`

## Workflow

Two paths — pick whichever is easier:

### A. Colab inference → local analysis (recommended for most users)

Run TRIBE v2 in Google Colab (free GPU), download `preds.npy`, analyze locally. No TRIBE/torch install needed on your machine.

See [colab-snippet.md](references/colab-snippet.md) for the notebook cells.

```bash
python scripts/analyze.py --preds preds.npy --out report.md --plot curve.png
```

### B. Full local install

Install TRIBE v2, HF weights (~15 GB), Yeo annot. See [setup.md](references/setup.md).

```bash
python scripts/analyze.py --video input.mp4 --out report.md --plot curve.png
```

## Running the Analysis

```bash
python ~/.claude/skills/tribe-v2-engagement-analysis/scripts/analyze.py \
  [--video FILE | --audio FILE | --text FILE | --preds preds.npy] \
  --out report.md \
  [--plot curve.png]
```

Exactly one input source. `--preds` accepts `(T, 20484)` float32 fsaverage5 arrays already HRF-offset.

See [scripts/analyze.py](scripts/analyze.py) for the full pipeline and [scripts/networks.py](scripts/networks.py) for Yeo mapping logic.

## Interpreting Output

- **Valley** (E(t) < −1σ for ≥4s): candidate cut or tighten. Check DMN — if DMN spikes, viewers are mind-wandering.
- **Peak** (E(t) > +1σ): keep, consider as thumbnail / clip hook.
- **Language-heavy with low visual:** add B-roll or cutaways.
- **DAN flat + DMN rising:** pacing problem, re-cut.
- **Limbic peak + VAN peak:** emotional hook — protect this moment.

## Mapping Table

See [roi-to-engagement.md](references/roi-to-engagement.md) for full vertex→network→editorial-meaning lookup and the rationale / literature pointers behind each mapping.

## Common Mistakes

- **Treating TRIBE predictions as ground truth for one viewer.** It predicts the *average* subject. Use for relative ranking within one stimulus, not absolute claims.
- **Ignoring the 5s HRF offset.** Predictions are already offset by the pipeline; don't apply it again.
- **Reading subcortical claims into results.** TRIBE v2 is cortical-only. "Reward" here = cortical limbic proxy (OFC, vmPFC, ACC), NOT NAcc/VTA.
- **Running on clips <10s.** Too short for stable temporal context (window = 3s, model expects several windows).
- **Using for ads without a license review.** CC-BY-NC-4.0.

## Red Flags

- Stakeholder wants "neuroscience-validated" claim → reject, this is a predictive model not a measurement.
- Asked to compare two viewer groups → out of scope, model is subject-average.
- Asked for millisecond precision → model is 1 Hz, fMRI resolution only.
