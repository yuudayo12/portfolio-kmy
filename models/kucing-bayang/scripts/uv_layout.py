"""python3 uv_layout.py body_uv.npz out.png : draw Cat_Body UV layout"""
import sys, numpy as np
from PIL import Image, ImageDraw
d = np.load(sys.argv[1]); uv = d["uv"]; S = 1024
im = Image.new("RGB", (S, S), (24, 20, 30)); dr = ImageDraw.Draw(im)
for k in range(0, S, S // 8):
    dr.line([(k, 0), (k, S)], fill=(40, 36, 48)); dr.line([(0, k), (S, k)], fill=(40, 36, 48))
pal = [(70, 45, 105), (110, 40, 90), (45, 60, 110), (45, 80, 100), (60, 50, 130), (80, 60, 120), (100, 50, 140)]
labs = d["labels"] if "labels" in d.files else [0] * len(d["loop_start"])
for st, n, lb in zip(d["loop_start"], d["loop_total"], labs):
    pts = [(float(u) * S, (1 - float(v)) * S) for u, v in uv[st:st + n]]
    dr.polygon(pts, fill=pal[int(lb) % len(pal)], outline=(200, 150, 255))
if "label_names" in d.files:  # name each island at its centroid
    for li, name in enumerate(d["label_names"]):
        sel = [i for i, lb in enumerate(labs) if lb == li]
        if not sel:
            continue
        cu = np.mean([uv[d["loop_start"][i]] for i in sel], axis=0)
        dr.text((cu[0] * S - 12, (1 - cu[1]) * S), str(name), fill=(255, 255, 255))
im.save(sys.argv[2])
