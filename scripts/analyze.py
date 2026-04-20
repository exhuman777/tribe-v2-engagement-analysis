#!/usr/bin/env python3
"""TRIBE v2 engagement analysis.

Runs TRIBE v2 on a video/audio/text stimulus, projects vertex-wise fMRI
predictions onto Yeo-7 networks, computes an engagement time-series, and
emits timestamped edit recommendations.

Usage:
    python analyze.py --video clip.mp4 --out report.md [--plot curve.png]
    python analyze.py --audio podcast.wav --out report.md
    python analyze.py --text script.txt   --out report.md
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from networks import (
    YEO7_NAMES,
    aggregate_to_yeo7,
    load_yeo7_fsaverage5_labels,
)


def run_tribe(video=None, audio=None, text=None, cache="./tribe_cache"):
    """Return (preds, segments) from TRIBE v2.

    preds: np.ndarray of shape (n_timesteps, n_vertices) at 1 Hz, fsaverage5,
    already HRF-offset by 5s.
    """
    from tribev2.demo_utils import TribeModel

    model = TribeModel.from_pretrained("facebook/tribev2", cache_folder=cache)
    df = model.get_events_dataframe(
        video_path=video, audio_path=audio, text_path=text
    )
    preds, segments = model.predict(events=df)
    return preds, segments


def zscore(x, axis=0, eps=1e-8):
    mu = x.mean(axis=axis, keepdims=True)
    sd = x.std(axis=axis, keepdims=True) + eps
    return (x - mu) / sd


def engagement_score(net_ts):
    """Combine Yeo-7 time-series into a single engagement score per timestep.

    E(t) = z(DAN) + z(VAN) + z(Limbic) + z(Visual) - z(DMN)
    """
    z = zscore(net_ts, axis=0)
    idx = {n: i for i, n in enumerate(YEO7_NAMES)}
    return (
        z[:, idx["DorsalAttention"]]
        + z[:, idx["VentralAttention"]]
        + z[:, idx["Limbic"]]
        + z[:, idx["Visual"]]
        - z[:, idx["Default"]]
    )


def find_runs(mask, min_len):
    """Yield (start, end) index pairs of True runs at least min_len long."""
    runs = []
    i, n = 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            if j - i >= min_len:
                runs.append((i, j))
            i = j
        else:
            i += 1
    return runs


def format_ts(sec):
    m, s = divmod(int(sec), 60)
    return f"{m:02d}:{s:02d}"


def build_report(E, net_ts, hz=1.0, valley_sigma=-1.0, peak_sigma=1.0, min_len=4):
    Ez = zscore(E[:, None])[:, 0]
    valleys = find_runs(Ez < valley_sigma, min_len)
    peaks = find_runs(Ez > peak_sigma, min_len)

    def summarize_range(a, b):
        seg = zscore(net_ts, axis=0)[a:b].mean(axis=0)
        ranked = sorted(
            enumerate(seg), key=lambda kv: kv[1], reverse=True
        )
        top = [YEO7_NAMES[i] for i, _ in ranked[:2]]
        bot = [YEO7_NAMES[i] for i, _ in ranked[-2:]]
        return top, bot

    lines = ["# TRIBE v2 Engagement Report", ""]
    lines.append(f"- Duration: {len(E)/hz:.1f}s  |  samples: {len(E)} @ {hz} Hz")
    lines.append(
        f"- Mean engagement z: {Ez.mean():+.2f}  "
        f"|  std: {Ez.std():.2f}  "
        f"|  range: [{Ez.min():+.2f}, {Ez.max():+.2f}]"
    )
    lines.append("")

    lines.append("## Cut candidates (engagement valleys)")
    if not valleys:
        lines.append("_None detected._")
    for a, b in valleys[:5]:
        top, bot = summarize_range(a, b)
        lines.append(
            f"- **{format_ts(a/hz)}–{format_ts(b/hz)}** "
            f"({(b-a)/hz:.0f}s, min z={Ez[a:b].min():+.2f}) — "
            f"elevated: {', '.join(top)}; suppressed: {', '.join(bot)}. "
            f"**Action:** tighten or cut."
        )
    lines.append("")

    lines.append("## Protect (engagement peaks)")
    if not peaks:
        lines.append("_None detected._")
    for a, b in peaks[:5]:
        top, _ = summarize_range(a, b)
        lines.append(
            f"- **{format_ts(a/hz)}–{format_ts(b/hz)}** "
            f"(peak z={Ez[a:b].max():+.2f}) — "
            f"driven by: {', '.join(top)}. "
            f"**Action:** keep, consider as hook / thumbnail."
        )
    lines.append("")

    lines.append("## Network narrative")
    zn = zscore(net_ts, axis=0).mean(axis=0)
    for i, name in enumerate(YEO7_NAMES):
        lines.append(f"- {name}: mean z = {zn[i]:+.2f}")

    lines.append("")
    lines.append(
        "_TRIBE v2 predicts average-subject fMRI. Use for relative edit "
        "decisions, not absolute audience claims. CC-BY-NC-4.0._"
    )
    return "\n".join(lines)


def maybe_plot(E, out_png):
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        return False
    Ez = zscore(E[:, None])[:, 0]
    t = np.arange(len(Ez))
    fig, ax = plt.subplots(figsize=(12, 3))
    ax.plot(t, Ez, lw=1.2)
    ax.axhline(-1, ls="--", c="red", alpha=0.5, label="valley (−1σ)")
    ax.axhline(+1, ls="--", c="green", alpha=0.5, label="peak (+1σ)")
    ax.fill_between(t, Ez, -1, where=(Ez < -1), alpha=0.25, color="red")
    ax.fill_between(t, Ez, +1, where=(Ez > +1), alpha=0.25, color="green")
    ax.set_xlabel("seconds")
    ax.set_ylabel("engagement (z)")
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    fig.savefig(out_png, dpi=120)
    return True


def load_preds_npy(path):
    """Load TRIBE preds saved in Colab.

    Accepts (T, 20484) fsaverage5 array, or a .npz with key 'preds'.
    """
    p = Path(path)
    if p.suffix == ".npz":
        arr = np.load(p)
        preds = arr["preds"] if "preds" in arr.files else arr[arr.files[0]]
    else:
        preds = np.load(p)
    if preds.ndim != 2 or preds.shape[1] != 20484:
        raise ValueError(
            f"expected (T, 20484) fsaverage5 preds, got {preds.shape}. "
            "In Colab save with: np.save('preds.npy', preds)"
        )
    return preds.astype(np.float32)


def main():
    ap = argparse.ArgumentParser(
        description="TRIBE v2 engagement analysis. Use --preds for the "
        "Colab flow (run TRIBE in Colab, download .npy, analyze locally)."
    )
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--video", help="run TRIBE locally on a video file")
    g.add_argument("--audio", help="run TRIBE locally on an audio file")
    g.add_argument("--text", help="run TRIBE locally on a text file")
    g.add_argument(
        "--preds",
        help="load precomputed preds .npy/.npz from Colab "
        "(shape [T, 20484], fsaverage5, already HRF-offset)",
    )
    ap.add_argument("--out", required=True, help="output markdown report")
    ap.add_argument("--plot", help="optional engagement curve PNG")
    ap.add_argument(
        "--cache", default="./tribe_cache",
        help="TRIBE weight cache (ignored when --preds is used)",
    )
    args = ap.parse_args()

    if args.preds:
        preds = load_preds_npy(args.preds)
        print(f"loaded preds {preds.shape} from {args.preds}")
    else:
        preds, _ = run_tribe(
            video=args.video, audio=args.audio, text=args.text,
            cache=args.cache,
        )

    lh, rh = load_yeo7_fsaverage5_labels()
    net_ts = aggregate_to_yeo7(preds, lh, rh)
    E = engagement_score(net_ts)

    report = build_report(E, net_ts)
    Path(args.out).write_text(report)
    print(f"wrote {args.out}")

    if args.plot:
        ok = maybe_plot(E, args.plot)
        print(f"{'wrote' if ok else 'skipped (no matplotlib)'} {args.plot}")


if __name__ == "__main__":
    sys.exit(main())
