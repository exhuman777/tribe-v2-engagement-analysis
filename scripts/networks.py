"""Map TRIBE v2 fsaverage5 vertex predictions onto Yeo-7 networks.

TRIBE v2 outputs `(n_timesteps, n_vertices)` on the fsaverage5 mesh
(10242 vertices per hemisphere, 20484 total, concatenated LH then RH).

The Yeo-7 parcellation ships with FreeSurfer as .annot files at:
    $FREESURFER_HOME/subjects/fsaverage5/label/
        lh.Yeo2011_7Networks_N1000.annot
        rh.Yeo2011_7Networks_N1000.annot

If FreeSurfer is not installed, nilearn can download fsaverage meshes but
NOT the Yeo annot. See references/setup.md for the fallback (download from
FreeSurfer GitHub mirror).

Network index convention (Yeo 2011):
    0 = medial wall / unassigned  (dropped)
    1 = Visual
    2 = Somatomotor
    3 = DorsalAttention
    4 = VentralAttention
    5 = Limbic
    6 = Frontoparietal
    7 = Default
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np

YEO7_NAMES = [
    "Visual",
    "Somatomotor",
    "DorsalAttention",
    "VentralAttention",
    "Limbic",
    "Frontoparietal",
    "Default",
]


def _fs_subjects_dir():
    env = os.environ.get("FREESURFER_HOME") or os.environ.get("SUBJECTS_DIR")
    if env:
        p = Path(env)
        if p.name == "FREESURFER_HOME" or (p / "subjects").exists():
            return p / "subjects"
        return p
    for guess in ("/Applications/freesurfer/subjects", "/usr/local/freesurfer/subjects"):
        if Path(guess).exists():
            return Path(guess)
    return None


def load_yeo7_fsaverage5_labels():
    """Return (lh_labels, rh_labels) int arrays, shape (10242,) each.

    Values in 0..7. 0 = medial wall / unassigned.
    """
    import nibabel.freesurfer.io as fsio

    subj = _fs_subjects_dir()
    if subj is None:
        raise RuntimeError(
            "Yeo-7 annot not found. Install FreeSurfer or copy "
            "lh/rh.Yeo2011_7Networks_N1000.annot into a directory pointed "
            "to by $SUBJECTS_DIR/fsaverage5/label/. See references/setup.md."
        )
    base = subj / "fsaverage5" / "label"
    lh = base / "lh.Yeo2011_7Networks_N1000.annot"
    rh = base / "rh.Yeo2011_7Networks_N1000.annot"
    lh_labels, _, _ = fsio.read_annot(str(lh))
    rh_labels, _, _ = fsio.read_annot(str(rh))
    return lh_labels, rh_labels


def aggregate_to_yeo7(preds, lh_labels, rh_labels):
    """Mean vertex activity per Yeo-7 network, per timestep.

    preds: (T, V) where V = 20484 (LH concatenated with RH).
    returns: (T, 7)
    """
    T, V = preds.shape
    assert V == 20484, f"expected 20484 fsaverage5 vertices, got {V}"
    assert lh_labels.size == 10242 and rh_labels.size == 10242

    labels = np.concatenate([lh_labels, rh_labels])  # (20484,)
    out = np.zeros((T, 7), dtype=np.float32)
    for net in range(1, 8):
        mask = labels == net
        if mask.sum() == 0:
            continue
        out[:, net - 1] = preds[:, mask].mean(axis=1)
    return out
