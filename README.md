# tribe-v2-engagement-analysis

Claude Code / Claude Agent SDK skill that turns Meta FAIR's **[TRIBE v2](https://github.com/facebookresearch/tribev2)** fMRI brain-encoding model into actionable video/podcast edit recommendations.

Run TRIBE v2 on a stimulus → aggregate vertex predictions into Yeo-7 functional networks → compute an engagement score → get timestamped cut/keep recommendations.

```
video / audio / text  →  TRIBE v2 (fsaverage5 preds)  →  Yeo-7 networks  →  engagement(t)  →  valleys (cut) + peaks (keep)  →  report.md
```

## Quick start — Colab flow (recommended)

No local TRIBE/torch install needed. Run inference on free Colab GPU, analyze locally.

1. Open [Colab](https://colab.research.google.com/), paste cells from [`references/colab-snippet.md`](references/colab-snippet.md).
2. Upload your `.mp4`, run TRIBE, download `preds.npy`.
3. Locally:

```bash
pip install numpy nibabel matplotlib
# fetch Yeo-7 annot (see references/setup.md §3)
python scripts/analyze.py --preds preds.npy --out report.md --plot engagement.png
```

## Full local install

See [`references/setup.md`](references/setup.md). Needs CUDA GPU, ~15 GB disk for HF weights.

```bash
python scripts/analyze.py --video input.mp4 --out report.md --plot engagement.png
```

## Output

```
# TRIBE v2 Engagement Report

- Duration: 63.0s | samples: 63 @ 1.0 Hz
- Mean engagement z: +0.02 | std: 1.00 | range: [-2.14, +2.31]

## Cut candidates (engagement valleys)
- **00:34–00:41** (7s, min z=-1.87) — elevated: Default, Frontoparietal; suppressed: Visual, DorsalAttention. **Action:** tighten or cut.

## Protect (engagement peaks)
- **00:09–00:12** (peak z=+2.31) — driven by: VentralAttention, Limbic. **Action:** keep, consider as hook / thumbnail.

## Network narrative
- Visual: mean z = +0.14
- Somatomotor: mean z = -0.02
- DorsalAttention: mean z = +0.31
- ...
```

Plus a PNG showing the engagement curve with valleys/peaks shaded.

## Install as a Claude Code skill

```bash
git clone https://github.com/exhuman777/tribe-v2-engagement-analysis.git \
  ~/.claude/skills/tribe-v2-engagement-analysis
```

Claude Code auto-discovers skills in `~/.claude/skills/`. Restart Claude Code, then trigger with:

> "analyze engagement for this video"
> "where should I cut this podcast?"
> "run tribe-v2 on preds.npy"

## Examples

### VIA 45s viral reel (Remotion)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/exhuman777/via-ad-remotion)

A full worked example: a 45s reel built in [Remotion](https://www.remotion.dev/) following the UGC arc from [`references/hooks-and-ugc-scripting.md`](references/hooks-and-ugc-scripting.md), rendered to `.mp4`, then scored with this skill.

Repo: https://github.com/exhuman777/via-ad-remotion

```bash
# 1. scaffold the ad in browser
git clone https://github.com/exhuman777/via-ad-remotion.git && cd via-ad-remotion
npm install && npm run dev          # http://localhost:3000

# 2. render
npm run render                       # out/via_ad.mp4

# 3. score with TRIBE v2 (Colab preds.npy flow)
python scripts/analyze.py --preds preds.npy --out report.md --plot curve.png
```

## Files

```
SKILL.md                              # skill entry point read by Claude
scripts/
  analyze.py                          # CLI: --video | --audio | --text | --preds
  networks.py                         # Yeo-7 aggregation from FreeSurfer annot
references/
  setup.md                            # full local install
  colab-snippet.md                    # Colab notebook cells
  roi-to-engagement.md                # network → editorial meaning reference
README.md
LICENSE                               # MIT (this wrapper)
```

## The engagement score

```
E(t) = z(DAN) + z(VAN) + z(Limbic) + z(Visual) − z(DMN)
```

Rationale: attention networks + cortical reward proxy + visual richness are positive; Default Mode Network during external stimulus indicates mind-wandering (Mason et al. 2007), so it is subtracted.

Tune per content type — see [`references/roi-to-engagement.md`](references/roi-to-engagement.md).

## What this tool CANNOT tell you

- Individual-viewer response (TRIBE v2 is subject-average).
- Subcortical reward (NAcc, VTA, amygdala) — cortical only.
- Memory consolidation (hippocampus not predicted).
- Valence sign (positive vs negative emotion).

Use for **relative edit decisions within one stimulus**. Do NOT sell as audience measurement.

## Licensing

- **This wrapper:** MIT
- **TRIBE v2 model weights (`facebook/tribev2`):** CC-BY-NC-4.0 — research / non-commercial only. Review before any commercial use.

## Credits

- [TRIBE v2](https://github.com/facebookresearch/tribev2) by Meta FAIR (d'Ascoli et al. 2025, 2026)
- [Yeo-7 parcellation](https://doi.org/10.1152/jn.00338.2011) (Yeo et al. 2011)
- [Algonauts 2025](https://algonautsproject.com/) brain encoding challenge

Not affiliated with Meta.
