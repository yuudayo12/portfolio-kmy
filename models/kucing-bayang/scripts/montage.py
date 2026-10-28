"""python3 montage.py out.png img1 img2 ... : grid on neutral grey for review"""
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert("RGBA") for f in files]
w, h = ims[0].size
cols = 2 if len(ims) > 1 else 1
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGBA", (w * cols, h * rows), (40, 36, 48, 255))
for i, im in enumerate(ims):
    sheet.alpha_composite(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
sheet.convert("RGB").save(out)
