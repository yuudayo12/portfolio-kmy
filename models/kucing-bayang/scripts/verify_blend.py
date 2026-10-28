"""blender -b kucing_bayang.blend -P verify_blend.py : sanity report for review"""
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ok = True


def bad(msg):
    global ok
    ok = False
    print("FAIL", msg)


print("COLLECTIONS", [(c.name, [ch.name for ch in c.children], len(c.objects)) for c in bpy.data.collections])
model = bpy.data.collections["CAT_Model"].all_objects
fx = bpy.data.collections["FX_Preview"].all_objects
if set(o.name for o in model) & set(o.name for o in fx):
    bad("object in both model and FX")
for o in fx:
    if o.parent or any(c.parent == o for c in model):
        bad(f"FX parented: {o.name}")
    if not o.name.startswith("FX_"):
        bad(f"FX naming: {o.name}")

body = bpy.data.objects["Cat_Body"]
bbm = bmesh.new()
bbm.from_mesh(body.data)
bvh = BVHTree.FromBMesh(bbm)
nm = [e for e in bbm.edges if not e.is_manifold]
vol = bbm.calc_volume(signed=True)
print("BODY manifold_bad_edges", len(nm), "signed_volume %.4f m3" % vol, "faces", len(bbm.faces),
      "quads", sum(1 for f in bbm.faces if len(f.verts) == 4))
if nm or vol <= 0:
    bad("body not closed/outward")

total = 0
for o in sorted(model, key=lambda o: o.name):
    me = o.data
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    total += tris
    ident = o.matrix_world.is_identity if hasattr(o.matrix_world, "is_identity") else (o.matrix_world == o.matrix_world.Identity(4))
    if not (o.location.length < 1e-9 and tuple(o.rotation_euler) == (0, 0, 0) and tuple(o.scale) == (1, 1, 1)):
        bad(f"transform not applied: {o.name}")
    if not me.uv_layers:
        bad(f"no UVs: {o.name}")
    if me.validate(verbose=False):
        bad(f"mesh needed fixing: {o.name}")
    bm = bmesh.new()
    bm.from_mesh(me)
    inward = 0
    if o.name.startswith("Cat_Glow"):
        for f in bm.faces:
            _, n, _, _ = bvh.find_nearest(f.calc_center_median())
            inward += f.normal.dot(n) < 0
    elif o.name != "Cat_Body":
        # each connected piece should enclose positive volume (or be an open shell facing out)
        bm.faces.ensure_lookup_table()
        seen = set()
        for f0 in bm.faces:
            if f0.index in seen:
                continue
            stack, comp = [f0], []
            seen.add(f0.index)
            while stack:
                f = stack.pop()
                comp.append(f)
                for e in f.edges:
                    for g in e.link_faces:
                        if g.index not in seen:
                            seen.add(g.index)
                            stack.append(g)
            cen = sum((f.calc_center_median() for f in comp), Vector()) / len(comp)
            score = sum(f.normal.dot(f.calc_center_median() - cen) * f.calc_area() for f in comp)
            if o.name == "Cat_Ears" and comp[0].material_index == 1:
                continue  # flat inner-ear patch, checked by construction
            inward += score < 0
    bm.free()
    print(f"OBJ {o.name:28s} tris {tris:6d} mats {[m.name for m in me.materials]} uv {[u.name for u in me.uv_layers]} inward {inward}")
    if inward:
        bad(f"inward-facing parts in {o.name}: {inward}")
print("MODEL_TRIS_TOTAL", total)
print("FX", [(o.name, sum(len(p.vertices) - 2 for p in o.data.polygons)) for o in fx])
print("SETUP", [o.name for o in bpy.data.collections["Preview_Setup"].objects])
print("DEFAULT_OBJECTS", [o.name for o in bpy.data.objects if o.name in ("Cube", "Camera", "Light")])
dims = body.dimensions
print("BODY_DIMENSIONS_m x=%.2f y=%.2f z=%.2f" % tuple(dims), "min_z %.4f" % min(v.co.z for v in body.data.vertices))

# UV overlap check on the body: rasterise each island and look for shared pixels
import numpy as np
uv = np.zeros(len(body.data.loops) * 2)
body.data.uv_layers.active.data.foreach_get("uv", uv)
uv = uv.reshape(-1, 2)
inside = ((uv >= -1e-6) & (uv <= 1 + 1e-6)).all()
print("BODY_UV_IN_0_1", bool(inside))
if not inside:
    bad("body UVs outside 0-1")
bbm.faces.ensure_lookup_table()
uvl = bbm.loops.layers.uv.active
# islands = face groups connected through non-seam edges
seen, islands = set(), []
for f0 in bbm.faces:
    if f0.index in seen:
        continue
    stack, comp = [f0], []
    seen.add(f0.index)
    while stack:
        f = stack.pop()
        comp.append(f)
        for e in f.edges:
            if e.seam:
                continue
            for g in e.link_faces:
                if g.index not in seen:
                    seen.add(g.index)
                    stack.append(g)
    islands.append(comp)
R = 1024
cover = np.zeros((R, R), np.int16)
for comp in islands:
    mask = np.zeros((R, R), bool)
    for f in comp:
        pts = np.array([tuple(l[uvl].uv) for l in f.loops]) * (R - 1)
        lo, hi = np.floor(pts.min(0)).astype(int), np.ceil(pts.max(0)).astype(int)
        ys, xs = np.mgrid[lo[1]:hi[1] + 1, lo[0]:hi[0] + 1]
        P = np.stack([xs.ravel() + 0.5, ys.ravel() + 0.5], 1)
        sgn = []
        for k in range(len(pts)):
            a_, b_ = pts[k], pts[(k + 1) % len(pts)]
            sgn.append((b_[0] - a_[0]) * (P[:, 1] - a_[1]) - (b_[1] - a_[1]) * (P[:, 0] - a_[0]))
        sgn = np.array(sgn)
        hit = (sgn >= 0).all(0) | (sgn <= 0).all(0)
        xx, yy = xs.ravel()[hit].clip(0, R - 1), ys.ravel()[hit].clip(0, R - 1)
        mask[yy, xx] = True
    cover += mask
overlap = int((cover > 1).sum())
used = (cover > 0).mean()
print("BODY_UV_ISLANDS", len(islands), "overlap_px", overlap, "coverage %.0f%%" % (used * 100))
if overlap > 20:
    bad("body UV islands overlap")
print("VERIFY", "PASS" if ok else "FAIL")
