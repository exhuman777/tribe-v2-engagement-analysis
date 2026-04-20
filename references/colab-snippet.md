# Colab → Local flow

Uruchom TRIBE v2 w Google Colab (darmowy GPU T4/L4), pobierz `preds.npy`, analizuj lokalnie.

## Colab notebook (skopiuj do nowej komórki)

```python
# 1. Install
!pip install -q git+https://github.com/facebookresearch/tribev2.git

# 2. HF login (raz — TRIBE to gated repo, CC-BY-NC-4.0)
from huggingface_hub import login
login()  # wklej token z https://huggingface.co/settings/tokens

# 3. Upload wideo
from google.colab import files
up = files.upload()              # wybierz plik .mp4
video_path = list(up.keys())[0]

# 4. Inference
from tribev2.demo_utils import TribeModel
model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")
df = model.get_events_dataframe(video_path=video_path)
preds, segments = model.predict(events=df)
print("preds shape:", preds.shape)   # (T, 20484)

# 5. Save + download
import numpy as np
np.save("preds.npy", preds.astype("float32"))
files.download("preds.npy")
```

Dla audio: `model.get_events_dataframe(audio_path=...)`.
Dla textu: `model.get_events_dataframe(text_path=...)`.

## Lokalnie

```bash
python ~/.claude/skills/tribe-v2-engagement-analysis/scripts/analyze.py \
  --preds preds.npy \
  --out report.md \
  --plot engagement.png
```

Tryb `--preds` **nie wymaga** TRIBE / torch / HuggingFace lokalnie — tylko `numpy`, `nibabel`, `matplotlib` + annot Yeo-7 (setup.md).

## Batch (kilka wersji montażu)

W Colabie:
```python
for name in ["cut_v1.mp4", "cut_v2.mp4", "cut_v3.mp4"]:
    df = model.get_events_dataframe(video_path=name)
    preds, _ = model.predict(events=df)
    np.save(f"preds_{name.replace('.mp4','')}.npy", preds.astype("float32"))
```

Lokalnie:
```bash
for f in preds_*.npy; do
  python .../analyze.py --preds "$f" --out "${f%.npy}.md" --plot "${f%.npy}.png"
done
```

Porównaj średnie engagement z raportów → który cut wygrywa.

## Gotchas

- Colab T4 wytrzymuje klipy ~60–120s. Dłuższe: L4/A100 lub potnij.
- `preds` musi być już HRF-offset (TRIBE robi to sam) — nie przesuwaj ponownie.
- Jeśli `.npy` ma kształt inny niż `(T, 20484)` — `analyze.py` rzuci `ValueError`.
- Colab kasuje sesję po odłączeniu — zapisuj `preds.npy` od razu na dysk lub pobieraj.
