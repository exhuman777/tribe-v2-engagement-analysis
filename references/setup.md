# TRIBE v2 Setup

One-time install. Takes ~20–40 min depending on disk/bandwidth.

## 1. Python env

```bash
conda create -n tribe python=3.10 -y
conda activate tribe

git clone https://github.com/facebookresearch/tribev2.git
cd tribev2
pip install -e ".[plotting]"
pip install nibabel matplotlib  # for Yeo loading + plotting
```

## 2. Model weights

Auto-downloaded on first `TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")`. About 10–15 GB for V-JEPA2 + Wav2Vec-BERT + LLaMA 3.2-3B + TRIBE head.

Requires HuggingFace access to `facebook/tribev2` (license: CC-BY-NC-4.0, click-through accept on first download).

## 3. Yeo-7 annot files

The skill projects TRIBE's fsaverage5 vertex output onto Yeo-7 networks. The annot files ship with FreeSurfer but can be fetched standalone.

**Option A — FreeSurfer installed:**
```bash
export SUBJECTS_DIR=$FREESURFER_HOME/subjects
# verify:
ls $SUBJECTS_DIR/fsaverage5/label/*.Yeo2011_7Networks_N1000.annot
```

**Option B — standalone (no FreeSurfer):**
```bash
mkdir -p ~/fsaverage5_labels/fsaverage5/label
cd ~/fsaverage5_labels/fsaverage5/label

# Yeo annot files are distributed with FreeSurfer and mirrored on several
# academic GitHub repos. Fetch from any mirror you trust, e.g.:
# https://github.com/ThomasYeoLab/CBIG/tree/master/stable_projects/brain_parcellation/Yeo2011_fcMRI_clustering/1000subjects_reference

# place lh.Yeo2011_7Networks_N1000.annot and rh.Yeo2011_7Networks_N1000.annot here

export SUBJECTS_DIR=~/fsaverage5_labels
```

## 4. Smoke test

```bash
python -c "
from tribev2.demo_utils import TribeModel
m = TribeModel.from_pretrained('facebook/tribev2', cache_folder='./cache')
print('OK')
"
```

## 5. Hardware

- GPU strongly recommended (any 16 GB+ CUDA card). CPU inference works but 10–50× slower.
- RAM: 32 GB recommended.
- Disk: ~30 GB for caches.

## 6. Troubleshooting

- **ImportError: nibabel** → `pip install nibabel`
- **Gated repo error on HF** → accept license at https://huggingface.co/facebook/tribev2
- **CUDA OOM** → set `device="cpu"` in `from_pretrained` or process shorter clips
- **Missing Yeo annot** → see Option B above
