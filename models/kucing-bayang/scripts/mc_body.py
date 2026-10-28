"""Polygonise cat_sdf with marching cubes -> body_raw.npz"""
import sys, time
import numpy as np
from skimage.measure import marching_cubes
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import cat_sdf

VOX = float(sys.argv[1]) if len(sys.argv) > 1 else 0.004
lo = np.array([-0.70, -0.70, -0.03])
hi = np.array([0.20, 0.82, 0.80])
n = np.ceil((hi - lo) / VOX).astype(int) + 1
xs, ys, zs = [np.linspace(lo[i], lo[i] + (n[i] - 1) * VOX, n[i], dtype=np.float32) for i in range(3)]
t = time.time()
vol = np.empty(n, dtype=np.float32)
X, Y = np.meshgrid(xs, ys, indexing="ij")
for k, z in enumerate(zs):  # slice-wise to keep memory low
    p = np.stack([X.ravel(), Y.ravel(), np.full(X.size, z, np.float32)], axis=1)
    d, _ = cat_sdf.total_sdf(p)
    vol[:, :, k] = d.reshape(X.shape)
print("grid", n, "sdf %.1fs" % (time.time() - t))
# flat ground cut so paws have flat soles
vol = np.maximum(vol, (zs[None, None, :] * -1.0) + 0.0)
verts, faces, _, _ = marching_cubes(vol, 0.0, spacing=(VOX, VOX, VOX))
verts += lo
print("verts", len(verts), "faces", len(faces))
np.savez(sys.argv[2] if len(sys.argv) > 2 else "body_raw.npz", verts=verts.astype(np.float32), faces=faces.astype(np.int32))
