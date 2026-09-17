import numpy as np
from PIL import Image, ImageFilter

SRC = "/app/frontend/public/robot-full.png"
DST = "/app/frontend/public/robot-alpha.png"

im = Image.open(SRC).convert("RGB")
lum = np.asarray(im.convert("L"), dtype=np.float32) / 255.0

bg = float(np.percentile(lum, 92))
norm = np.clip(lum / max(bg, 1e-6), 0.0, 1.0)

alpha = 1.0 - norm
# tighter key: scene text (~0.62 norm) must vanish, robot body (~0.11) stays solid
alpha = np.clip((0.58 - norm) / 0.22, 0.0, 1.0)

a8 = (alpha * 255).astype(np.uint8)
aimg = Image.fromarray(a8).filter(ImageFilter.GaussianBlur(1.4))

out = im.convert("RGBA")
out.putalpha(aimg)
out.save(DST)
print("saved", out.size, "bg_lum", round(bg, 3))
