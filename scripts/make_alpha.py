import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "/app/frontend/public/robot-full.png"
DST = sys.argv[2] if len(sys.argv) > 2 else "/app/frontend/public/robot-alpha.png"

im = Image.open(SRC).convert("RGB")
w, h = im.size
lum = np.asarray(im.convert("L"), dtype=np.float32) / 255.0

bg = float(np.percentile(lum, 92))
norm = np.clip(lum / max(bg, 1e-6), 0.0, 1.0)

# tighter key: scene text (~0.62 norm) must vanish, robot body (~0.11) stays solid
alpha = np.clip((0.58 - norm) / 0.22, 0.0, 1.0)

# strip the "Built with Spline" badge (bottom-right)
alpha[int(h * 0.93):, int(w * 0.82):] = 0

a8 = (alpha * 255).astype(np.uint8)
aimg = Image.fromarray(a8).filter(ImageFilter.GaussianBlur(1.4))

out = im.convert("RGBA")
out.putalpha(aimg)
out.save(DST)
print("saved", DST, out.size, "bg_lum", round(bg, 3))
