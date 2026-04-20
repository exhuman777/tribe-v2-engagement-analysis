# Brain Network → Editorial Meaning

TRIBE v2 outputs per-vertex predictions on fsaverage5. We aggregate into the Yeo-7 functional networks (Yeo et al., 2011), then interpret each network as an editorial signal. All mappings are **cortical-only** — TRIBE v2 does not predict subcortical structures.

## Network-by-network interpretation

### Visual (Yeo-1)
**Contains:** V1, V2, V4, MT/V5, ventral occipital, lateral occipital.
**Drives when:** scenes are visually rich — motion, color, faces, high contrast.
**Editorial read:**
- High + rising → strong visual hook. Protect.
- Flat during talking-head → add B-roll / cutaways.
- Rapid alternation → cut pacing is working.

### Somatomotor (Yeo-2)
**Contains:** M1, S1, SMA, premotor, auditory association (STG spillover).
**Drives when:** speech is present, physical action on screen, music with strong beat.
**Editorial read:**
- Sustained high + no speech visible → audio dominates, consider on-screen text.
- Drops during motion → check if action is actually visible.

### Dorsal Attention (DAN, Yeo-3)
**Contains:** FEF, SPL, IPS.
**Drives when:** top-down voluntary attention, goal-directed tracking.
**Editorial read:**
- **This is your primary "locked in" signal.**
- Sustained high → viewer is actively following. Protect.
- Drops for >4s → viewer is disengaging. Cut or add stimulation.

### Ventral Attention (VAN, Yeo-4)
**Contains:** TPJ, ventral prefrontal, insula edges.
**Drives when:** salience, surprise, reorienting to unexpected stimuli.
**Editorial read:**
- Spikes = surprise moment. Great for hooks, scene transitions, reveals.
- Absent across a segment → nothing unexpected. May feel flat.

### Limbic (Yeo-5, cortical proxy)
**Contains:** OFC, vmPFC, temporal pole, subgenual ACC.
**Drives when:** reward valuation, emotional valence, social meaning.
**Editorial read:**
- **Cortical reward proxy only** — real reward nuclei (NAcc, VTA) are subcortical and NOT predicted.
- High + Visual peak → emotionally resonant visual moment.
- High + Language peak → story beat lands.
- Flat throughout → content feels affect-less; consider adding stakes, faces, or narrative.

### Frontoparietal (FPN, Yeo-6)
**Contains:** dlPFC, IPL, lateral prefrontal.
**Drives when:** cognitive effort, working memory, reasoning.
**Editorial read:**
- Moderate is good. Very high = you're making viewers work too hard. Simplify.
- Very low across educational content → not challenging enough or not landing.

### Default Mode (DMN, Yeo-7) — **INVERSE signal**
**Contains:** mPFC, PCC, angular gyrus, precuneus.
**Drives when:** self-referential thought, mind-wandering, autobiographical memory.
**Editorial read:**
- **High DMN during stimulus = viewer has drifted.** Bad.
- Rising DMN + falling DAN = classic disengagement pattern. Cut.
- EXCEPTION: narrative / memoir / reflective content intentionally engages DMN (viewers relate stimulus to their own life). In that context, DMN rise is good.

## Language sub-signal (not a Yeo network)

Language regions (Broca IFG 44/45, Wernicke STG posterior, AG) span Yeo-2/6/7. For language-heavy content, treat high activity across left-lateralized temporal + inferior frontal vertices as a comprehension-load signal. Dense narration + low visual = saturation. Break with silence or visuals.

## Engagement score (default formula)

```
E(t) = z(DAN) + z(VAN) + z(Limbic) + z(Visual) − z(DMN)
```

Rationale: attention networks + reward + visual richness are all positive engagement; DMN is subtracted because ongoing DMN during external stimulus indicates mind-wandering (Mason et al., 2007; Andrews-Hanna et al., 2014).

Tune for content type:
- **Narrative / memoir:** flip DMN sign (add instead of subtract).
- **Educational:** add +z(FPN) for appropriate cognitive load.
- **Music video:** weight Visual and Somatomotor higher.

## What the model CANNOT tell you

- Individual-viewer response (model is subject-average).
- Subcortical reward (NAcc, VTA, amygdala) — cortical only.
- Memory consolidation (hippocampus not predicted).
- Autonomic arousal (no HR/skin conductance).
- Valence sign (positive vs. negative emotion — limbic activity alone is ambiguous).

## References (load-bearing)

- Schaefer et al. 2018 — Cortical parcellation (used in TRIBE paper).
- Yeo et al. 2011 — 7-network functional parcellation used here.
- d'Ascoli et al. 2025 — Algonauts 2025 winning TRIBE architecture.
- Meta AI 2026 — TRIBE v2 release blog.
- Mason et al. 2007 — DMN and mind-wandering.
- Andrews-Hanna et al. 2014 — DMN functional subdivisions.
