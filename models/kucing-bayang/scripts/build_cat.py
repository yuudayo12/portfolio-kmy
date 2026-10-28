"""Build the shadow cat .blend.

blender -b -P build_cat.py -- <dir with cat_sdf.py + body_raw.npz> <out.blend>

Model faces -Y, Z up, origin on the ground between the paws, 1 unit = 1 m.
Everything model-related lives in collection CAT_Model; preview-only effects
live in FX_Preview (to be rebuilt in Roblox Studio) and camera/lights in
Preview_Setup.
"""
import sys, os, math, random, json
import bpy, bmesh, numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index("--") + 1:]
WD, OUT = args[0], args[1]
sys.path.insert(0, WD)
import cat_sdf as S

rng = random.Random(11)
HC = Vector(S.HEAD_C.tolist())
HSC = S.HEAD_S


# ------------------------------------------------------------------ helpers
def V(*a):
    return Vector(a[0] if len(a) == 1 else a)


def norm(v):
    v = Vector(v)
    return v.normalized() if v.length > 1e-9 else v


def proj_tangent(v, n):
    v = Vector(v)
    return norm(v - n * v.dot(n))


def new_coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


class MeshBuf:
    """Accumulates verts/faces/per-corner UVs, then becomes one object."""

    def __init__(self):
        self.v, self.f, self.uv, self.mat = [], [], [], []

    def add(self, verts, faces, uvs=None, mat=0):
        o = len(self.v)
        self.v += [tuple(p) for p in verts]
        for i, f in enumerate(faces):
            self.f.append([o + k for k in f])
            self.uv.append(uvs[i] if uvs else [(0.0, 0.0)] * len(f))
            self.mat.append(mat)

    def tris(self):
        return sum(len(f) - 2 for f in self.f)

    def build(self, name, coll, mats, smooth=True):
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.v, [], self.f)
        uvl = me.uv_layers.new(name="UVMap")
        flat = [c for face in self.uv for uv in face for c in uv]
        uvl.data.foreach_set("uv", flat)
        for m in mats:
            me.materials.append(m)
        me.polygons.foreach_set("material_index", self.mat)
        me.validate()
        me.update()
        if smooth:
            me.shade_smooth()
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        return ob


def frame_from(T, up_hint):
    T = norm(T)
    N = proj_tangent(up_hint, T)
    if N.length < 1e-6:
        N = proj_tangent(Vector((1, 0, 0)), T)
    return T, N, T.cross(N)


def tube(path, radii, sides, up_hint, close_tip=True, flat=(1.0, 1.0)):
    """Generic swept tube; returns verts, faces, uvs (u around, v along)."""
    verts, faces, uvs = [], [], []
    n = len(path)
    rings = []
    N_prev = None
    for i, p in enumerate(path):
        T = (Vector(path[min(i + 1, n - 1)]) - Vector(path[max(i - 1, 0)]))
        T, N, B = frame_from(T, up_hint if N_prev is None else N_prev)
        N_prev = N
        if close_tip and i == n - 1 and radii[i] <= 1e-6:
            rings.append([len(verts)])
            verts.append(tuple(p))
            continue
        ring = []
        for k in range(sides):
            a = 2 * math.pi * k / sides
            q = Vector(p) + N * (math.cos(a) * radii[i] * flat[0]) + B * (math.sin(a) * radii[i] * flat[1])
            ring.append(len(verts))
            verts.append(tuple(q))
        rings.append(ring)
    for i in range(n - 1):
        r0, r1 = rings[i], rings[i + 1]
        v0, v1 = i / (n - 1), (i + 1) / (n - 1)
        for k in range(sides):
            k2 = (k + 1) % sides
            u0, u1 = k / sides, (k + 1) / sides
            if len(r1) == 1:
                faces.append([r0[k], r0[k2], r1[0]])
                uvs.append([(u0, v0), (u1, v0), ((u0 + u1) / 2, v1)])
            else:
                faces.append([r0[k], r0[k2], r1[k2], r1[k]])
                uvs.append([(u0, v0), (u1, v0), (u1, v1), (u0, v1)])
    return verts, faces, uvs


def bezier(p0, p1, p2, t):
    return p0 * (1 - t) ** 2 + p1 * (2 * (1 - t) * t) + p2 * (t * t)


def catmull(points, spacing):
    """Resample a polyline through Catmull-Rom to roughly even spacing."""
    P = [Vector(p) for p in points]
    if len(P) < 2:
        return P
    P = [2 * P[0] - P[1]] + P + [2 * P[-1] - P[-2]]
    dense = []
    for i in range(1, len(P) - 2):
        for s in range(12):
            t = s / 12
            t2, t3 = t * t, t * t * t
            q = 0.5 * ((2 * P[i]) + (-P[i - 1] + P[i + 1]) * t + (2 * P[i - 1] - 5 * P[i] + 4 * P[i + 1] - P[i + 2]) * t2
                       + (-P[i - 1] + 3 * P[i] - 3 * P[i + 1] + P[i + 2]) * t3)
            dense.append(q)
    dense.append(P[-2])
    L = [0.0]
    for a, b in zip(dense, dense[1:]):
        L.append(L[-1] + (b - a).length)
    total = L[-1]
    n = max(2, int(total / spacing) + 1)
    out, j = [], 0
    for k in range(n):
        target = total * k / (n - 1)
        while j < len(L) - 2 and L[j + 1] < target:
            j += 1
        seg = max(L[j + 1] - L[j], 1e-9)
        out.append(dense[j].lerp(dense[j + 1], (target - L[j]) / seg))
    return out


# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0
C_MODEL = new_coll("CAT_Model")
C_FUR = new_coll("CAT_Fur", C_MODEL)
C_FX = new_coll("FX_Preview")
C_SETUP = new_coll("Preview_Setup")


# ------------------------------------------------------------------ materials
def principled(name, base, rough=0.5, sheen=0.0, sheen_tint=(1, 1, 1), emit=None, strength=0.0, metal=0.0, coat=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Sheen Weight"].default_value = sheen
    b.inputs["Sheen Tint"].default_value = (*sheen_tint, 1)
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Specular IOR Level"].default_value = spec
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    m.diffuse_color = (*(emit or base), 1)  # viewport solid colour
    return m


FUR_BASE = (0.009, 0.005, 0.013)
M_FUR = principled("MAT_Cat_Fur", FUR_BASE, rough=0.8, sheen=0.1, sheen_tint=(0.36, 0.2, 0.58), spec=0.25)
M_FUR_TIP = principled("MAT_Cat_FurClumps", FUR_BASE, rough=0.78, sheen=0.12, sheen_tint=(0.4, 0.24, 0.62), spec=0.28)
# fur clumps: darker root -> violet-tinted tip along UV.y
_nt = M_FUR_TIP.node_tree
_uv = _nt.nodes.new("ShaderNodeUVMap")
_sep = _nt.nodes.new("ShaderNodeSeparateXYZ")
_ramp = _nt.nodes.new("ShaderNodeValToRGB")
_ramp.color_ramp.elements[0].color = (*FUR_BASE, 1)
_ramp.color_ramp.elements[1].position = 1.0
_ramp.color_ramp.elements[1].color = (0.05, 0.022, 0.075, 1)
_nt.links.new(_uv.outputs["UV"], _sep.inputs[0])
_nt.links.new(_sep.outputs["Y"], _ramp.inputs["Fac"])
_nt.links.new(_ramp.outputs["Color"], _nt.nodes["Principled BSDF"].inputs["Base Color"])
M_EAR_IN = principled("MAT_Cat_EarInner", (0.07, 0.018, 0.06), rough=0.6, sheen=0.4, sheen_tint=(0.8, 0.4, 0.8))
M_NOSE = principled("MAT_Cat_Nose", (0.025, 0.012, 0.03), rough=0.25)
M_CLAW = principled("MAT_Cat_Claw", (0.42, 0.38, 0.47), rough=0.22, coat=0.5)
GLOW_PURPLE = (0.52, 0.10, 1.0)
GLOW_MAGENTA = (1.0, 0.08, 0.72)
M_GLOW_P = principled("MAT_Glow_Purple", GLOW_PURPLE, rough=0.4, emit=GLOW_PURPLE, strength=1.9)
M_GLOW_M = principled("MAT_Glow_Magenta", GLOW_MAGENTA, rough=0.3, emit=GLOW_MAGENTA, strength=2.2)
M_EYE = principled("MAT_Glow_Eye", (1.0, 0.35, 0.9), rough=0.1, emit=(1.0, 0.16, 0.78), strength=2.6, coat=1.0)


# ------------------------------------------------------------------ body
data = np.load(os.path.join(WD, "body_raw.npz"))
me = bpy.data.meshes.new("Cat_Body")
me.from_pydata(data["verts"].tolist(), [], data["faces"].tolist())
body = bpy.data.objects.new("Cat_Body", me)
C_MODEL.objects.link(body)
bpy.context.view_layer.objects.active = body
body.select_set(True)


def cleanup(mesh, dist):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=dist)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=dist * 0.5)
    bad = [v for v in bm.verts if not v.is_manifold]
    if bad:
        bmesh.ops.delete(bm, geom=bad, context="VERTS")
        bmesh.ops.holes_fill(bm, edges=bm.edges, sides=12)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()


# quadriflow rejects edges < 0.1 mm and any non-manifold spot: clean, scale x10, retry harder if needed
res = None
for attempt, dist in enumerate((3e-4, 6e-4, 1e-3, None)):
    if dist is None:  # last resort: voxel remesh guarantees a closed manifold surface
        body.data.remesh_voxel_size = 0.004
        bpy.ops.object.voxel_remesh()
        dist = 6e-4
    cleanup(body.data, dist)
    body.data.transform(Matrix.Scale(10, 4))
    res = bpy.ops.object.quadriflow_remesh(target_faces=3400, use_mesh_symmetry=False, use_preserve_sharp=False,
                                           use_preserve_boundary=False, smooth_normals=False, seed=3)
    if res == {"FINISHED"}:
        break
    body.data.transform(Matrix.Scale(0.1, 4))
    print("quadriflow retry", attempt)
assert res == {"FINISHED"}, res
body.data.transform(Matrix.Scale(0.1, 4))
me = body.data
me.materials.append(M_FUR)
me.shade_smooth()

# ---- UV seams from anatomical parts: part borders + one hidden cut per part
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
bm.edges.ensure_lookup_table()
centers = np.array([tuple(f.calc_center_median()) for f in bm.faces])


def poly_dist(P, path):
    """distance of points P (n,3) to a polyline + arc-length param in [0,1]"""
    path = np.asarray(path, float)
    seg_len = np.linalg.norm(np.diff(path, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg_len)])
    best_d = np.full(len(P), np.inf)
    best_t = np.zeros(len(P))
    for i in range(len(path) - 1):
        a_, ab = path[i], path[i + 1] - path[i]
        h = np.clip(((P - a_) @ ab) / (ab @ ab), 0, 1)
        d = np.linalg.norm(P - (a_ + h[:, None] * ab), axis=1)
        m = d < best_d
        best_d[m] = d[m]
        best_t[m] = (cum[i] + h[m] * seg_len[i]) / cum[-1]
    return best_d, best_t


# anatomical cut planes give clean, loop-like borders between UV islands
uniq = ["body", "head", "fore_L", "fore_R", "hind_L", "hind_R", "tail"]
lab = np.zeros(len(centers), int)
cx, cy, cz = centers[:, 0], centers[:, 1], centers[:, 2]
neck_n = np.array([0, -0.9, 0.42]) / np.linalg.norm([0, -0.9, 0.42])
lab[((centers - np.array([0, -0.33, 0.55])) @ neck_n) > 0] = 1
for k, (path, zcut, rad) in enumerate([(S.FORE_PATH, 0.37, 0.075), (S.HIND_PATH, 0.33, 0.085)]):
    for side, li in ((1, 2 + 2 * k), (-1, 3 + 2 * k)):
        pth = path if side > 0 else [S.mx(p) for p in path]
        d, _ = poly_dist(centers, pth)
        lab[(d < rad) & (cz < zcut) & (cx * side > 0.035)] = li
d, t = poly_dist(centers, S.TAIL_PATH)
lab[(d < 0.08) & (t > 0.045)] = 6
adj = [[e2f.index for e in f.edges for e2f in e.link_faces if e2f.index != f.index] for f in bm.faces]


def components(lab):
    seen = np.full(len(lab), -1)
    comps = []
    for s in range(len(lab)):
        if seen[s] >= 0:
            continue
        stack, comp = [s], []
        seen[s] = len(comps)
        while stack:
            a = stack.pop()
            comp.append(a)
            for b in adj[a]:
                if seen[b] < 0 and lab[b] == lab[a]:
                    seen[b] = len(comps)
                    stack.append(b)
        comps.append(comp)
    return comps


for _ in range(2):  # absorb specks and single-face notches so borders are clean loops
    new = lab.copy()
    for i, nb in enumerate(adj):
        vals = [lab[j] for j in nb]
        best = max(set(vals), key=vals.count)
        if best != lab[i] and vals.count(best) >= 3:
            new[i] = best
    lab = new
    for comp in components(lab):
        if len(comp) < 40:
            border = [lab[j] for a in comp for j in adj[a] if lab[j] != lab[a]]
            if border:
                lab[comp] = max(set(border), key=border.count)

axes = {
    "body": (S.BODY_PATH, (0, 0, 1)),
    "head": ([S.NECK_PATH[0], S.NECK_PATH[1]] + S.HEAD_PATH[1:], (0, 0, 1)),
    "fore_L": (S.FORE_PATH, (1, 0, 0)), "fore_R": ([S.mx(p) for p in S.FORE_PATH], (-1, 0, 0)),
    "hind_L": (S.HIND_PATH, (1, 0, 0)), "hind_R": ([S.mx(p) for p in S.HIND_PATH], (-1, 0, 0)),
    "tail": (S.TAIL_PATH, (0, 0, 1)),
}


def polyline_frames(path, n0):
    P = [Vector(p) for p in path]
    frames, N = [], Vector(n0)
    for a, b in zip(P, P[1:]):
        T = norm(b - a)
        N = proj_tangent(N, T)
        frames.append((a, b, T, N, T.cross(N)))
    return frames


import heapq

bm.verts.ensure_lookup_table()
for e in bm.edges:  # borders between parts
    lf = e.link_faces
    e.seam = len(lf) == 2 and bool(lab[lf[0].index] != lab[lf[1].index])


def axis_info(frames, cum, co):
    """(how far the point faces the hidden cut side -N, arc-length along the axis)"""
    best = None
    for si, (a, b, T, N, B) in enumerate(frames):
        ab = b - a
        h = max(0.0, min(1.0, (co - a).dot(ab) / ab.dot(ab)))
        q = a + ab * h
        d = (co - q).length
        if best is None or d < best[0]:
            best = (d, q, N, cum[si] + h * ab.length)
    d, q, N, s_ = best
    r = co - q
    return (r.normalized().dot(-N) if r.length > 1e-9 else 0.0), s_


# one continuous cut per part along its hidden side (belly, inner leg, under tail/chin):
# waypoints every few cm joined by shortest edge paths, from the part border to its tip
for pi, pname in enumerate(uniq):
    path, n0 = axes[pname]
    frames = polyline_frames(path, n0)
    cum = [0.0]
    for fa, fb, *_ in frames:
        cum.append(cum[-1] + (fb - fa).length)
    fset = set(np.nonzero(lab == pi)[0].tolist())
    verts = {v.index: v for i in fset for v in bm.faces[i].verts}
    info = {i: axis_info(frames, cum, v.co) for i, v in verts.items()}
    border = {i for i, v in verts.items() if any(lab[f.index] != pi for f in v.link_faces)}
    s_lo = min(v[1] for v in info.values())
    span = max(v[1] for v in info.values()) - s_lo
    nbr = {i: [] for i in verts}
    for i, v in verts.items():
        for e in v.link_edges:
            lf = e.link_faces
            if len(lf) == 2 and lf[0].index in fset and lf[1].index in fset:
                j = e.other_vert(v).index
                nbr[i].append((j, e.calc_length() * (2.2 - info[i][0] - info[j][0]), e))
    best_of = lambda c: max(c, key=lambda i: info[i][0])
    win = 0.12 if pname == "body" else 0.35  # body also borders the leg holes mid-way
    wps = []
    start_c = [i for i in border if info[i][1] < s_lo + win * span]
    if start_c:
        wps.append(best_of(start_c))
    nb = max(1, int(span / 0.035))
    for k in range(nb):
        lo, hi = s_lo + span * k / nb, s_lo + span * (k + 1) / nb
        c = [i for i in verts if lo <= info[i][1] < hi and info[i][0] > 0.6 and i not in border]
        if c:
            wps.append(best_of(c))
    if pname == "body":
        end_c = [i for i in border if info[i][1] > s_lo + (1 - win) * span]
        if end_c:
            wps.append(best_of(end_c))
    for wa, wb in zip(wps, wps[1:]):
        if wa == wb:
            continue
        dist, prev, pq = {wa: 0.0}, {}, [(0.0, wa)]
        while pq:
            dd, u = heapq.heappop(pq)
            if u == wb:
                break
            if dd > dist.get(u, 1e9):
                continue
            for j, w, e in nbr[u]:
                if dd + w < dist.get(j, 1e9):
                    dist[j], prev[j] = dd + w, (u, e)
                    heapq.heappush(pq, (dd + w, j))
        u = wb
        while u in prev:
            u, e = prev[u]
            e.seam = True
seam_count = sum(1 for e in bm.edges if e.seam)
bm.to_mesh(me)
bm.free()
body_labels = {uniq[i]: int((lab == i).sum()) for i in range(len(uniq))}

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.unwrap(method="MINIMUM_STRETCH", margin=0.01)
bpy.ops.uv.average_islands_scale()
bpy.ops.uv.pack_islands(rotate=True, margin=0.008)
bpy.ops.object.mode_set(mode="OBJECT")
body.select_set(False)

# BVH of the final low-poly body for snapping accessories
_bm = bmesh.new()
_bm.from_mesh(me)
BVH = BVHTree.FromBMesh(_bm)
VCO = np.array([tuple(v.co) for v in _bm.verts])
VNO = np.array([tuple(v.normal) for v in _bm.verts])
_bm.free()
names_v, lab_v = S.labels(VCO)
VLAB = np.array([names_v[i] for i in lab_v])


def snap(p, off=0.0):
    loc, nor, _, _ = BVH.find_nearest(Vector(p))
    return loc + nor * off, nor


def head_pt(local):
    """head-local point (unscaled units) pushed outward then snapped to skin"""
    v = Vector(local) * HSC
    return snap(HC + v * 1.6)


# ------------------------------------------------------------------ ears
ears = MeshBuf()
for side in (1, -1):
    root, n = snap(HC + Vector((0.050 * side, 0.020, 0.075)) * HSC * 1.3)
    up = norm(Vector((0.30 * side, 0.22, 1.0)))
    front = proj_tangent(Vector((0.42 * side, -1.0, 0.0)), up)
    width_dir = up.cross(front) * side
    H, W, D = 0.14, 0.040, 0.017
    base = root - up * 0.016
    levels = [0.0, 0.22, 0.45, 0.66, 0.84]
    ring_ids = []
    for t in levels:
        c = base + up * (H * t) - front * (0.018 * t * t) + width_dir * (0.008 * t * t) * side
        w, d = W * (1 - t) ** 0.85, D * (1 - t) ** 0.9 + 0.002
        ring = []
        for k in range(8):
            a = 2 * math.pi * k / 8
            back = math.sin(a)
            y = d * back if back > 0 else d * back * 0.25  # flat front face
            ring.append(tuple(c + width_dir * (w * math.cos(a)) - front * y))
        ring_ids.append(ring)
    tip = base + up * H - front * 0.02 + width_dir * 0.009 * side
    verts = [p for r in ring_ids for p in r] + [tuple(tip)]
    faces, uvs = [], []
    for li in range(len(levels) - 1):
        for k in range(8):
            k2 = (k + 1) % 8
            faces.append([li * 8 + k, li * 8 + k2, (li + 1) * 8 + k2, (li + 1) * 8 + k])
            uvs.append([(k / 8, levels[li]), ((k + 1) / 8, levels[li]), ((k + 1) / 8, levels[li + 1]), (k / 8, levels[li + 1])])
    ti = len(verts) - 1
    last = (len(levels) - 1) * 8
    for k in range(8):
        faces.append([last + k, last + (k + 1) % 8, ti])
        uvs.append([(k / 8, 0.84), ((k + 1) / 8, 0.84), ((k + 0.5) / 8, 1.0)])
    if side == -1:  # keep outward winding after mirroring the frame
        faces = [f[::-1] for f in faces]
        uvs = [u[::-1] for u in uvs]
    ears.add(verts, faces, [[(u * 0.5, v) for u, v in f] for f in uvs], mat=0)
    # inner ear: concave triangular patch on the flat front
    rows = [0.10, 0.35, 0.6, 0.82]
    iv, ifc, iuv = [], [], []
    for t in rows:
        c = base + up * (H * t) - front * (0.018 * t * t) + width_dir * (0.008 * t * t) * side
        w = W * (1 - t) ** 0.85 * 0.72
        for s in (-1, 0, 1):
            cup = 0.004 * (1 - abs(s)) * (1 - t)
            iv.append(tuple(c + width_dir * (w * s) + front * (D * 0.25 * (1 - t) + 0.0012 - cup)))
    itip = base + up * (H * 0.93) - front * (0.018 * 0.86 - 0.001)
    iv.append(tuple(itip))
    for r in range(len(rows) - 1):
        for s in range(2):
            a, b = r * 3 + s, r * 3 + s + 1
            ifc.append([a, b, b + 3, a + 3])
            iuv.append([(0.5 + s * 0.25, rows[r]), (0.75 + s * 0.25, rows[r]), (0.75 + s * 0.25, rows[r + 1]), (0.5 + s * 0.25, rows[r + 1])])
    top = (len(rows) - 1) * 3
    ifc += [[top, top + 1, len(iv) - 1], [top + 1, top + 2, len(iv) - 1]]
    iuv += [[(0.5, 0.82), (0.75, 0.82), (0.75, 1)], [(0.75, 0.82), (1, 0.82), (1, 1)]]
    if side == 1:
        ifc = [f[::-1] for f in ifc]
        iuv = [u[::-1] for u in iuv]
    ears.add(iv, ifc, iuv, mat=1)
ob_ears = ears.build("Cat_Ears", C_MODEL, [M_FUR, M_EAR_IN])


# ------------------------------------------------------------------ eyes
eyes = MeshBuf()
for side in (1, -1):
    c = Vector(S.EYE_L) * 1.0
    c.x *= side
    fwd = norm(Vector((0.30 * side, -1.0, 0.04)))
    sidev = norm(Vector((0, 0, 1)).cross(fwd)) * -1  # points outward-ish
    upv = fwd.cross(sidev) * -1
    # fierce slant: rotate side/up around forward
    R = Matrix.Rotation(math.radians(-22 * side), 3, fwd)
    sidev, upv = R @ sidev, R @ upv
    sidev = norm(sidev)
    upv = norm(upv)
    if upv.z < 0:
        upv = -upv
    center = c + fwd * 0.0025
    rx, ry, rz = 0.0205, 0.0105, 0.0098  # width, depth, height
    bm = bmesh.new()
    bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=7, radius=1.0, calc_uvs=True)
    uvl = bm.loops.layers.uv.active
    M = Matrix((sidev * rx, fwd * ry, upv * rz)).transposed()
    vs = [tuple(center + M @ v.co) for v in bm.verts]
    fs = [[v.index for v in f.verts] for f in bm.faces]
    us = [[tuple(l[uvl].uv) for l in f.loops] for f in bm.faces]
    if M.determinant() < 0:
        fs = [f[::-1] for f in fs]
        us = [u[::-1] for u in us]
    bm.free()
    eyes.add(vs, fs, [[(u * 0.5 + (0.5 if side < 0 else 0), v) for u, v in f] for f in us])
ob_eyes = eyes.build("Cat_Eyes", C_MODEL, [M_EYE])


# ------------------------------------------------------------------ nose
nose = MeshBuf()
tip, n = snap(HC + Vector((0, -0.125, -0.008)) * HSC * 1.25)
fwd = norm(n)
upv = proj_tangent(Vector((0, 0.35, 1)), fwd)
sidev = upv.cross(fwd)
bm = bmesh.new()
bm.loops.layers.uv.new('UVMap')
bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1.0, calc_uvs=True)
uvl = bm.loops.layers.uv.active
vs = []
for v in bm.verts:
    x, y, z = v.co
    x *= 1.0 + 0.55 * z  # wide top, pointed bottom -> cat nose triangle
    vs.append(tuple(tip - fwd * 0.004 + sidev * (x * 0.0125) + fwd * (y * 0.0075) + upv * (z * 0.0085)))
fs = [[v.index for v in f.verts] for f in bm.faces]
us = [[tuple(l[uvl].uv) for l in f.loops] for f in bm.faces]
if Matrix((sidev, fwd, upv)).determinant() < 0:
    fs = [f[::-1] for f in fs]
    us = [u[::-1] for u in us]
bm.free()
nose.add(vs, fs, us)
ob_nose = nose.build("Cat_Nose", C_MODEL, [M_NOSE])


# ------------------------------------------------------------------ claws
claws = MeshBuf()
toe_sets = [(t, 1) for t in S.FORE_TOES_L] + [(S.mx(t), -1) for t in S.FORE_TOES_L] + \
           [(t, 1) for t in S.HIND_TOES_L] + [(S.mx(t), -1) for t in S.HIND_TOES_L]
ci = 0
for t, side in toe_sets:
    t = Vector(t)
    paw_c = Vector(S.FORE_PAW_L if abs(t.y - S.FORE_PAW_L[1]) < 0.1 else S.HIND_PAW_L)
    paw_c.x = math.copysign(paw_c.x, t.x)
    spread = (t.x - paw_c.x) * 4.0
    d = norm(Vector((spread, -1.0, 0.0)))
    p0 = t + d * (S.TOE_R * 0.55) + Vector((0, 0, -0.002))
    p1 = p0 + d * 0.020 + Vector((0, 0, 0.004))
    p2 = p0 + d * 0.028 + Vector((0, 0, -p0.z + 0.0015))
    pts = [bezier(p0, p1, p2, s) for s in (0.0, 0.33, 0.66, 1.0)]
    radii = [0.0042, 0.0034, 0.0021, 0.0]
    vs, fs, us = tube(pts, radii, 4, Vector((0, 0, 1)), flat=(1.0, 0.75))
    claws.add(vs, fs, [[((ci % 8 + u) / 8, (ci // 8 + v) / 4) for u, v in f] for f in us])
    ci += 1
ob_claws = claws.build("Cat_Claws", C_MODEL, [M_CLAW], smooth=True)


# ------------------------------------------------------------------ fur clumps
def spike(buf, root, n, g, L, w, lift_deg, bend=0.35, uv_cell=None):
    n = norm(n)
    g = proj_tangent(g, n)
    lift = math.radians(lift_deg)
    d0 = norm(g * math.cos(lift) + n * math.sin(lift))
    d1 = norm(g * math.cos(lift * bend) + n * math.sin(lift * bend))
    p0 = root - n * (w * 0.35)
    p1 = root + d0 * (L * 0.55)
    p2 = p1 + d1 * (L * 0.5)
    ts = [0.0, 0.55]
    verts = []
    for t in ts:
        c = bezier(p0, p1, p2, t)
        tan = norm(bezier(p0, p1, p2, min(t + 0.05, 1.0)) - bezier(p0, p1, p2, max(t - 0.05, 0.0)))
        sd = norm(tan.cross(n))
        nn = norm(sd.cross(tan))
        k = (1 - t) ** 0.9
        verts += [tuple(c - sd * (w * 0.5 * k)), tuple(c + sd * (w * 0.5 * k)), tuple(c + nn * (w * 0.22 * k))]
    verts.append(tuple(p2))
    faces, uvs = [], []
    for r in range(len(ts) - 1):
        for k in range(3):
            k2 = (k + 1) % 3
            a, b, c2, d2 = r * 3 + k, r * 3 + k2, (r + 1) * 3 + k2, (r + 1) * 3 + k
            faces.append([a, d2, c2, b])
            uvs.append([(k / 3, ts[r]), (k / 3, ts[r + 1]), ((k + 1) / 3, ts[r + 1]), ((k + 1) / 3, ts[r])])
    last, tipi = 3 * (len(ts) - 1), 3 * len(ts)
    for k in range(3):
        faces.append([last + k, tipi, last + (k + 1) % 3])
        uvs.append([(k / 3, ts[-1]), ((k + 0.5) / 3, 1.0), ((k + 1) / 3, ts[-1])])
    faces.append([0, 1, 2])  # cap the (embedded) root so the spike is closed
    uvs.append([(0, 0), (0.5, 0), (1, 0)])
    vol = sum(Vector(verts[f[0]]).dot(Vector(verts[f[k]]).cross(Vector(verts[f[k + 1]])))
              for f in faces for k in range(1, len(f) - 1))
    if vol < 0:  # outward winding regardless of how the blade curls
        faces = [f[::-1] for f in faces]
        uvs = [u[::-1] for u in uvs]
    if uv_cell:
        cu, cv, cs = uv_cell
        uvs = [[(cu + u * cs, cv + v * cs) for u, v in f] for f in uvs]
    buf.add(verts, faces, uvs)


def poisson(idx, spacing):
    idx = list(idx)
    rng.shuffle(idx)
    picked = []
    for i in idx:
        p = VCO[i]
        if all(np.sum((VCO[j] - p) ** 2) > spacing * spacing for j in picked):
            picked.append(i)
    return picked


def clumps(buf, idx, spacing, per, Lf, wf, lift, gdir, jitter=0.012, fan=16, bend=0.35, max_roots=None):
    roots = poisson(idx, spacing)
    while max_roots and len(roots) > max_roots:
        spacing *= 1.08
        roots = poisson(idx, spacing)
    for i in roots:
        p, n = Vector(VCO[i]), Vector(VNO[i])
        g0 = proj_tangent(gdir(p, n), n)
        L0 = Lf(p)
        side = norm(g0.cross(n))
        for s in range(per):
            off = (s - (per - 1) / 2)
            q, nq = snap(p + side * (off * jitter) + g0 * (rng.uniform(-0.4, 0.4) * jitter))
            gq = (Matrix.Rotation(math.radians(off * fan + rng.uniform(-5, 5)), 3, nq) @ g0)
            L = L0 * (1.0 - 0.18 * abs(off)) * rng.uniform(0.88, 1.12)
            spike(buf, q, nq, gq, L, wf * rng.uniform(0.9, 1.1), lift + rng.uniform(-6, 6), bend)
    return len(roots)


lab_is = lambda *ns: np.isin(VLAB, ns)
X, Y, Z = VCO[:, 0], VCO[:, 1], VCO[:, 2]
NX, NY, NZ = VNO[:, 0], VNO[:, 1], VNO[:, 2]


def gauss(x, mu, s):
    return math.exp(-((x - mu) / s) ** 2)


fur_objs = {}
# head: crown between/behind the ears + cheek ruff + throat
buf = MeshBuf()
crown = np.nonzero(lab_is("head") & (Y > HC.y + 0.01) & (Z > HC.z + 0.035) & (NZ > 0.3))[0]
clumps(buf, crown, 0.036, 3, lambda p: 0.042, 0.02, 26, lambda p, n: Vector((0, 1, 0.45)), jitter=0.014, fan=18, max_roots=12)
cheek = np.nonzero(lab_is("head") & (np.abs(X) > 0.05) & (Z < HC.z + 0.02) & (Y > HC.y - 0.08) & (Y < HC.y + 0.07) & (np.abs(NX) > 0.35))[0]
clumps(buf, cheek, 0.024, 3, lambda p: 0.08, 0.026, 20, lambda p, n: Vector((math.copysign(1.0, p.x), 0.5, -0.35)), jitter=0.011, fan=16, max_roots=28)
throat = np.nonzero(lab_is("head", "neck") & (NZ < -0.45) & (Y > HC.y - 0.03))[0]
clumps(buf, throat, 0.034, 3, lambda p: 0.058, 0.024, 14, lambda p, n: Vector((0, 0.35, -1)), jitter=0.013, max_roots=9)
# lynx ear tufts
for side in (1, -1):
    root, n = snap(HC + Vector((0.050 * side, 0.020, 0.075)) * HSC * 1.3)
    up = norm(Vector((0.30 * side, 0.22, 1.0)))
    front = proj_tangent(Vector((0.42 * side, -1.0, 0.0)), up)
    tipp = root - up * 0.016 + up * 0.132 - front * 0.021
    for k in (-1, 0, 1):
        spike(buf, tipp, -front, up + front * 0.1 + Vector((0.12 * k * side, 0, 0)), 0.03 - 0.006 * abs(k), 0.007, 70, 0.6)
fur_objs["Cat_Fur_Head"] = buf

# mane: nape, neck sides and withers - the big spiky crest
buf = MeshBuf()
mane = np.nonzero(((lab_is("neck") & (NZ > -0.35)) | (lab_is("head") & (Y > HC.y + 0.03) & (NZ > -0.2))
                   | (lab_is("body") & (Y < -0.10) & (Z > 0.55) & (NZ > 0.15))))[0]
clumps(buf, mane, 0.044, 3, lambda p: 0.055 + 0.06 * gauss(p.y, -0.33, 0.11) * (0.6 + 0.4 * max(0.0, (p.z - 0.5) / 0.15)),
       0.034, 32, lambda p, n: Vector((math.copysign(0.3, p.x) if abs(p.x) > 0.02 else 0, 1, 0.4)), jitter=0.02, fan=20, bend=0.25, max_roots=34)
fur_objs["Cat_Fur_Mane"] = buf

# chest ruff
buf = MeshBuf()
chest = np.nonzero(lab_is("body", "neck") & (Y < -0.25) & (NY < -0.3) & (Z > 0.36) & (Z < 0.62))[0]
clumps(buf, chest, 0.042, 3, lambda p: 0.06, 0.03, 14, lambda p, n: Vector((0, 0.2, -1)), jitter=0.016, max_roots=10)
fur_objs["Cat_Fur_Chest"] = buf

# back ridge + shaggy flanks
buf = MeshBuf()
back = np.nonzero(lab_is("body") & (Y > -0.10) & (Y < 0.33) & (NZ > 0.5))[0]
clumps(buf, back, 0.058, 3, lambda p: 0.058 + 0.014 * gauss(p.y, 0.0, 0.1), 0.03, 16, lambda p, n: Vector((0, 1, 0.1)), jitter=0.018, max_roots=12)
fur_objs["Cat_Fur_Back"] = buf

# belly fringe
buf = MeshBuf()
belly = np.nonzero(lab_is("body") & (NZ < -0.55) & (Y > -0.20) & (Y < 0.16))[0]
clumps(buf, belly, 0.048, 3, lambda p: 0.05, 0.028, 14, lambda p, n: Vector((0, 0.45, -1)), jitter=0.016, max_roots=9)
fur_objs["Cat_Fur_Belly"] = buf

# legs: elbows, back of thighs
buf = MeshBuf()
elbow = np.nonzero(lab_is("fore_L", "fore_R") & (Z > 0.22) & (Z < 0.40) & (NY > 0.35))[0]
clumps(buf, elbow, 0.034, 3, lambda p: 0.048, 0.022, 14, lambda p, n: Vector((0, 1, -0.7)), jitter=0.011, max_roots=6)
thigh = np.nonzero(lab_is("body", "hind_L", "hind_R") & (Y > 0.26) & (Z > 0.30) & (Z < 0.58) & (NY > 0.45))[0]
clumps(buf, thigh, 0.046, 3, lambda p: 0.05, 0.026, 14, lambda p, n: Vector((0, 0.6, -1)), jitter=0.015, max_roots=6)
fur_objs["Cat_Fur_Legs"] = buf

# tail: smooth base, bushy curl at the end
buf = MeshBuf()
TP = [Vector(p) for p in S.TAIL_PATH]
TL = [0.0]
for a, b in zip(TP, TP[1:]):
    TL.append(TL[-1] + (b - a).length)


def tail_param(p):
    best = min(range(len(TP) - 1), key=lambda i: (TP[i] - p).length)
    return TL[best] / TL[-1], norm(TP[min(best + 1, len(TP) - 1)] - TP[best])


tail_idx = np.nonzero(lab_is("tail"))[0]
tail_idx = [i for i in tail_idx if tail_param(Vector(VCO[i]))[0] > 0.55]
clumps(buf, tail_idx, 0.042, 3, lambda p: 0.03 + 0.05 * ((tail_param(p)[0] - 0.55) / 0.45) ** 1.2, 0.028, 16,
       lambda p, n: tail_param(p)[1], jitter=0.014, fan=18, max_roots=18)
# end tuft
T_end = norm(TP[-1] - TP[-3])
end, endn = snap(Vector(S.TAIL_PATH[-1]) + T_end * 0.02)
_, Nn, Bn = frame_from(T_end, Vector((0, 1, 0)))
for k in range(5):
    a = 2 * math.pi * k / 5
    rad = Nn * math.cos(a) + Bn * math.sin(a)
    q, nq = snap(end - T_end * 0.012 + rad * 0.01)
    spike(buf, q, nq, norm(T_end + rad * 0.5), 0.07, 0.024, 12, 0.5)
fur_objs["Cat_Fur_Tail"] = buf

fur_obs = [b.build(nm, C_FUR, [M_FUR_TIP]) for nm, b in fur_objs.items()]


# ------------------------------------------------------------------ glow markings
def ribbon_on_skin(buf, ctrl, width, spacing=0.011, off=0.0022, taper=0.3, end_w=0.15):
    pts = [snap(p)[0] for p in ctrl]
    dense = catmull(pts, spacing)
    sn = [snap(p) for p in dense]
    P = [s[0] for s in sn]
    N = [Vector(s[1]) for s in sn]
    for _ in range(2):  # smooth normals along the stroke
        N = [norm(N[max(i - 1, 0)] + N[i] * 2 + N[min(i + 1, len(N) - 1)]) for i in range(len(N))]
    n = len(P)
    verts, faces, uvs = [], [], []
    for i in range(n):
        t = i / (n - 1)
        T = norm(P[min(i + 1, n - 1)] - P[max(i - 1, 0)])
        sd = norm(T.cross(N[i]))
        prof = min(1.0, t / taper, (1 - t) / taper)
        w = width * (end_w + (1 - end_w) * math.sin(prof * math.pi / 2))
        c = P[i] + N[i] * off
        verts += [tuple(c - sd * w / 2), tuple(c + sd * w / 2)]
    for i in range(n - 1):
        a = 2 * i
        faces.append([a, a + 2, a + 3, a + 1])
        t0, t1 = i / (n - 1), (i + 1) / (n - 1)
        uvs.append([(t0, 0), (t1, 0), (t1, 1), (t0, 1)])
    buf.add(verts, faces, uvs)


def dot_on_skin(buf, p, r, off=0.0024, n_sides=6, stretch=1.0, up_hint=(0, 0, 1)):
    c, n = snap(p)
    u = proj_tangent(Vector(up_hint), n)
    s = u.cross(n)
    ring = []
    for k in range(n_sides):
        a = 2 * math.pi * k / n_sides
        q, nq = snap(c + s * (math.cos(a) * r) + u * (math.sin(a) * r * stretch))
        ring.append(tuple(q + nq * off))
    verts = ring + [tuple(c + n * off)]
    faces = [[k, (k + 1) % n_sides, n_sides] for k in range(n_sides)]
    uvs = [[(0.5 + 0.5 * math.cos(2 * math.pi * k / n_sides), 0.5 + 0.5 * math.sin(2 * math.pi * k / n_sides)),
            (0.5 + 0.5 * math.cos(2 * math.pi * (k + 1) / n_sides), 0.5 + 0.5 * math.sin(2 * math.pi * (k + 1) / n_sides)),
            (0.5, 0.5)] for k in range(n_sides)]
    if (Vector(ring[1]) - Vector(ring[0])).cross(Vector(verts[-1]) - Vector(ring[0])).dot(n) < 0:
        faces = [f[::-1] for f in faces]
        uvs = [u2[::-1] for u2 in uvs]
    buf.add(verts, faces, uvs)


def H(x, y, z):  # head-local -> world (pushed out, used as snap target)
    return HC + Vector((x, y, z)) * HSC * 1.6


def leg_arc(path, seg, s, th0, th1, side, n=6, r=0.12, slope=0.0):
    a, b = Vector(path[seg]), Vector(path[seg + 1])
    T = norm(b - a)
    Nn = proj_tangent(Vector((side, 0, 0)), T)
    B = T.cross(Nn)
    out = []
    for k in range(n):
        t = k / (n - 1)
        th = math.radians(th0 + (th1 - th0) * t)
        c = a.lerp(b, s + slope * (t - 0.5))
        out.append(c + (Nn * math.cos(th) + B * math.sin(th) * side) * r)
    return out


marks = MeshBuf()
for sd in (1, -1):
    m = lambda x, y, z: Vector((x * sd, y, z))
    # face: tear line from outer eye corner over the cheek, lower cheek line, brow line
    ribbon_on_skin(marks, [H(0.052 * sd, -0.084, -0.006), H(0.068 * sd, -0.062, -0.016), H(0.080 * sd, -0.035, -0.018), H(0.086 * sd, -0.005, -0.008)], 0.0055)
    ribbon_on_skin(marks, [H(0.026 * sd, -0.094, 0.034), H(0.046 * sd, -0.078, 0.048), H(0.062 * sd, -0.052, 0.058), H(0.070 * sd, -0.025, 0.062)], 0.0045)
    # shoulder swirl that trails back along the flank
    c0, n0 = snap(m(0.25, -0.235, 0.53))
    e1 = proj_tangent(Vector((0, 1, 0.2)), n0)
    e2 = n0.cross(e1) * sd
    spiral = []
    for k in range(22):
        t = k / 21
        ang = 2 * math.pi * 1.55 * t
        r = 0.005 + 0.034 * t
        spiral.append(c0 + n0 * 0.05 + (e1 * math.cos(ang) + e2 * math.sin(ang)) * r)
    spiral += [m(0.25, -0.17, 0.60), m(0.25, -0.10, 0.625), m(0.25, -0.03, 0.62)]
    ribbon_on_skin(marks, spiral, 0.0075, taper=0.15)
    # flowing flank / hip lines
    for line in ([(-0.06, 0.585), (0.0, 0.56), (0.05, 0.535), (0.09, 0.50)],
                 [(0.04, 0.625), (0.10, 0.60), (0.15, 0.565), (0.18, 0.52)],
                 [(0.17, 0.63), (0.22, 0.60), (0.255, 0.555), (0.27, 0.50), (0.265, 0.45)]):
        ribbon_on_skin(marks, [m(0.3, y, z) for y, z in line], 0.0065)
    # hind leg: curved bands on thigh and shin
    for line in ([(0.17, 0.43), (0.21, 0.405), (0.26, 0.41)],
                 [(0.18, 0.355), (0.22, 0.335), (0.265, 0.345)]):
        ribbon_on_skin(marks, [m(0.3, y, z) for y, z in line], 0.0060)
    hp = S.HIND_PATH if sd > 0 else [S.mx(p) for p in S.HIND_PATH]
    for s in (0.35, 0.62):
        ribbon_on_skin(marks, leg_arc(hp, 1, s, -40, 70, sd, slope=0.10), 0.0050)
    # foreleg: chevron bands wrapping the front of forearm + one on the upper arm
    fp = S.FORE_PATH if sd > 0 else [S.mx(p) for p in S.FORE_PATH]
    for s in (0.22, 0.42, 0.62):
        ribbon_on_skin(marks, leg_arc(fp, 2, s, -35, 115, sd, slope=-0.12), 0.0060)
    ribbon_on_skin(marks, leg_arc(fp, 1, 0.5, -30, 100, sd, slope=-0.15), 0.0065)
    # glowing spots along the shoulder blade / back
    for p, r in ((m(0.05, -0.20, 0.72), 0.008), (m(0.06, -0.10, 0.70), 0.006), (m(0.05, 0.02, 0.70), 0.005)):
        dot_on_skin(marks, p, r)
ob_marks = marks.build("Cat_Glow_Markings", C_MODEL, [M_GLOW_P])

# forehead diamond + crown of dots (magenta)
dia = MeshBuf()
dc, dn = snap(H(0, -0.090, 0.052))
du = proj_tangent(Vector((0, 0.45, 1)), dn)
ds = du.cross(dn)
outline = []
for k, (a, b) in enumerate([(0, 1), (0.5, 0.5), (1, 0), (0.5, -0.5), (0, -1), (-0.5, -0.5), (-1, 0), (-0.5, 0.5)]):
    q, nq = snap(dc + ds * (a * 0.0105) + du * (b * 0.021))
    outline.append(tuple(q + nq * 0.0025))
verts = outline + [tuple(dc + dn * 0.0028)]
faces = [[k, (k + 1) % 8, 8] for k in range(8)]
uvs = [[(0.5 + 0.5 * a, 0.5 + 0.5 * b) for a, b in [[(0, 1), (0.5, 0.5), (1, 0), (0.5, -0.5), (0, -1), (-0.5, -0.5), (-1, 0), (-0.5, 0.5)][k],
                                                     [(0, 1), (0.5, 0.5), (1, 0), (0.5, -0.5), (0, -1), (-0.5, -0.5), (-1, 0), (-0.5, 0.5)][(k + 1) % 8], (0, 0)]] for k in range(8)]
if (Vector(verts[1]) - Vector(verts[0])).cross(Vector(verts[8]) - Vector(verts[0])).dot(dn) < 0:
    faces = [f[::-1] for f in faces]
    uvs = [u[::-1] for u in uvs]
dia.add(verts, faces, uvs)
for x, y, z, r in ((0, -0.072, 0.074, 0.0042), (0.016, -0.080, 0.064, 0.0036), (-0.016, -0.080, 0.064, 0.0036),
                   (0.028, -0.072, 0.070, 0.0030), (-0.028, -0.072, 0.070, 0.0030)):
    dot_on_skin(dia, H(x, y, z), r, off=0.0025)
ob_dia = dia.build("Cat_Glow_ForeheadDiamond", C_MODEL, [M_GLOW_M])


# ------------------------------------------------------------------ FX (preview only)
def fx_ribbon_mat():
    m = bpy.data.materials.new("MAT_FX_EnergyRibbon")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    uv = nt.nodes.new("ShaderNodeUVMap")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    col = nt.nodes.new("ShaderNodeValToRGB")
    col.color_ramp.elements[0].color = (1.0, 0.15, 0.8, 1)
    col.color_ramp.elements[1].color = (0.45, 0.08, 1.0, 1)
    fade = nt.nodes.new("ShaderNodeValToRGB")  # alpha along length
    e = fade.color_ramp.elements
    e[0].position, e[0].color = 0.0, (0, 0, 0, 1)
    e[1].position, e[1].color = 1.0, (0, 0, 0, 1)
    e.new(0.12).color = (1, 1, 1, 1)
    e.new(0.55).color = (0.85, 0.85, 0.85, 1)
    edge = nt.nodes.new("ShaderNodeMath")  # soft edges across width: 1-|2v-1|^2
    edge.operation = "PINGPONG"
    edge.inputs[1].default_value = 0.5
    edge2 = nt.nodes.new("ShaderNodeMath")
    edge2.operation = "MULTIPLY"
    edge2.inputs[1].default_value = 2.0
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.8
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    L = nt.links.new
    L(uv.outputs["UV"], sep.inputs[0])
    L(sep.outputs["X"], col.inputs["Fac"])
    L(sep.outputs["X"], fade.inputs["Fac"])
    L(sep.outputs["Y"], edge.inputs[0])
    L(edge.outputs[0], edge2.inputs[0])
    L(fade.outputs["Color"], mul.inputs[0])
    L(edge2.outputs[0], mul.inputs[1])
    L(col.outputs["Color"], em.inputs["Color"])
    L(mul.outputs[0], mix.inputs["Fac"])
    L(tr.outputs[0], mix.inputs[1])
    L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs["Surface"])
    m.diffuse_color = (0.8, 0.1, 0.9, 1)
    return m


def fx_smoke_mat():
    m = bpy.data.materials.new("MAT_FX_PurpleSmoke")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.30, 0.06, 0.55, 1)
    vol.inputs["Absorption Color"].default_value = (0.25, 0.0, 0.4, 1)
    vol.inputs["Emission Color"].default_value = (0.42, 0.06, 0.9, 1)
    vol.inputs["Emission Strength"].default_value = 0.9
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.2
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.48
    ramp.color_ramp.elements[1].position = 0.75
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul2 = nt.nodes.new("ShaderNodeMath")
    mul2.operation = "MULTIPLY"
    mul2.inputs[1].default_value = 9.0
    L = nt.links.new
    L(tc.outputs["Object"], noise.inputs["Vector"])
    L(tc.outputs["Object"], grad.inputs["Vector"])
    L(noise.outputs["Fac"], ramp.inputs["Fac"])
    L(ramp.outputs["Color"], mul.inputs[0])
    L(grad.outputs["Fac"], mul.inputs[1])
    L(mul.outputs[0], mul2.inputs[0])
    L(mul2.outputs[0], vol.inputs["Density"])
    L(vol.outputs[0], out.inputs["Volume"])
    m.diffuse_color = (0.4, 0.15, 0.6, 0.4)
    return m


M_FX_RIB = fx_ribbon_mat()
M_FX_SMOKE = fx_smoke_mat()
M_FX_SPARK = principled("MAT_FX_Spark", GLOW_MAGENTA, emit=(1.0, 0.12, 0.75), strength=2.4)

# energy ribbons rising off the back and curling
rib = MeshBuf()
ribbon_specs = [
    # start, rise, drift, swirl radius, turns, phase, width, length
    ((0.04, -0.20, 0.70), 0.62, (0.10, 0.25), 0.07, 1.4, 0.0, 0.060),
    ((-0.05, -0.08, 0.68), 0.55, (-0.12, 0.30), 0.06, 1.2, 2.0, 0.052),
    ((0.05, 0.10, 0.66), 0.48, (0.14, 0.32), 0.05, 1.6, 4.0, 0.046),
    ((-0.03, 0.24, 0.65), 0.40, (-0.10, 0.30), 0.045, 1.8, 1.0, 0.040),
    ((0.08, -0.30, 0.62), 0.42, (0.22, 0.05), 0.05, 1.3, 3.0, 0.040),
]
for k, (st, rise, drift, rad, turns, ph, w) in enumerate(ribbon_specs):
    st = Vector(st)
    pts = []
    n = 70
    for i in range(n):
        t = i / (n - 1)
        a = ph + 2 * math.pi * turns * t
        r = rad * (0.3 + 1.2 * t)
        pts.append(st + Vector((drift[0] * t + r * math.cos(a), drift[1] * t * t + r * math.sin(a) * 0.6, rise * t ** 0.85)))
    verts, faces, uvs = [], [], []
    for i, p in enumerate(pts):
        t = i / (n - 1)
        T = norm(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
        side = norm(T.cross(Vector((0.3, -1, 0.1))))
        side = Matrix.Rotation(math.radians(70 * t + k * 20), 3, T) @ side
        ww = w * (0.35 + 0.65 * math.sin(min(1.0, t * 3.0) * math.pi / 2)) * (1 - 0.7 * t)
        verts += [tuple(p - side * ww / 2), tuple(p + side * ww / 2)]
    for i in range(n - 1):
        faces.append([2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1])
        uvs.append([(i / (n - 1), 0), ((i + 1) / (n - 1), 0), ((i + 1) / (n - 1), 1), (i / (n - 1), 1)])
    rib.add(verts, faces, uvs)
ob_rib = rib.build("FX_EnergyRibbons", C_FX, [M_FX_RIB])

# purple smoke volumes: wisps over the back + a low haze around the paws
smoke_obs = []
for name, loc, scl, rot in [
    ("FX_Smoke_Back", (0.0, -0.05, 0.86), (0.30, 0.42, 0.26), (0, 0, 0)),
    ("FX_Smoke_Shoulder", (0.10, -0.22, 0.95), (0.18, 0.20, 0.28), (0, 0.3, 0)),
    ("FX_Smoke_Ground", (-0.05, 0.0, 0.03), (0.55, 0.70, 0.10), (0, 0, 0)),
]:
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    me2 = bpy.data.meshes.new(name)
    bm.to_mesh(me2)
    bm.free()
    o = bpy.data.objects.new(name, me2)
    o.location, o.scale, o.rotation_euler = loc, scl, rot
    me2.materials.append(M_FX_SMOKE)
    C_FX.objects.link(o)
    o.display_type = "WIRE"
    smoke_obs.append(o)

# magenta sparks: small diamonds around the upper body and ribbons
spk = MeshBuf()
for i in range(70):
    k = rng.randrange(len(ribbon_specs))
    st = Vector(ribbon_specs[k][0])
    p = st + Vector((rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.35), rng.uniform(0.05, 0.62)))
    if i < 14:  # a few drifting near the head and paws
        p = Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.75, 0.1), rng.uniform(0.05, 0.75)))
    s = rng.uniform(0.003, 0.009)
    st_up = rng.uniform(1.0, 2.6)
    oct_v = [(s, 0, 0), (-s, 0, 0), (0, s, 0), (0, -s, 0), (0, 0, s * st_up), (0, 0, -s * st_up)]
    oct_f = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]
    spk.add([tuple(p + Vector(v)) for v in oct_v], oct_f)
ob_spk = spk.build("FX_Sparks_Magenta", C_FX, [M_FX_SPARK], smooth=False)


# ------------------------------------------------------------------ preview camera + lights
def area(name, loc, target, power, color, size):
    L = bpy.data.lights.new(name, "AREA")
    L.energy, L.color, L.size = power, color, size
    o = bpy.data.objects.new(name, L)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    C_SETUP.objects.link(o)
    return o


area("Light_Key", (1.6, -1.8, 1.9), (0, -0.2, 0.4), 80, (0.92, 0.88, 1.0), 1.2)
area("Light_Rim_Magenta", (-1.4, 1.2, 1.3), (0, -0.1, 0.5), 170, (1.0, 0.3, 0.85), 1.0)
area("Light_Rim_Purple", (1.3, 1.5, 0.9), (0, 0.1, 0.4), 140, (0.55, 0.3, 1.0), 1.0)
area("Light_Fill", (-1.8, -1.5, 0.6), (0, -0.2, 0.35), 18, (0.6, 0.6, 1.0), 2.0)
cam = bpy.data.objects.new("Preview_Camera", bpy.data.cameras.new("Preview_Camera"))
cam.data.lens = 50
C_SETUP.objects.link(cam)
scene.camera = cam

world = bpy.data.worlds.new("Preview_World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.010, 0.006, 0.016, 1)
scene.world = world

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.cycles.volume_step_rate = 2.0
scene.render.film_transparent = True  # no background in renders
scene.render.resolution_x = scene.render.resolution_y = 1100
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium High Contrast"

# bloom for the glow, keeping halos in the alpha so transparent PNGs still glow
ng = bpy.data.node_groups.new("Preview_Glow", "CompositorNodeTree")
ng.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
rl = ng.nodes.new("CompositorNodeRLayers")
gl = ng.nodes.new("CompositorNodeGlare")
try:
    gl.inputs["Type"].default_value = "Bloom"
except Exception:
    gl.inputs["Type"].default_value = "BLOOM"
gl.inputs["Threshold"].default_value = 0.9
gl.inputs["Strength"].default_value = 0.7
gl.inputs["Size"].default_value = 0.5
go = ng.nodes.new("NodeGroupOutput")
ng.links.new(rl.outputs["Image"], gl.inputs["Image"])
ng.links.new(gl.outputs["Image"], go.inputs[0])
scene.compositing_node_group = ng

# ------------------------------------------------------------------ normals: everything faces outward
# (Roblox culls back faces, so a flipped face would vanish in game)
def fix_normals(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()
    on_skin = ob.name.startswith("Cat_Glow")
    closed = [f for f in bm.faces if not on_skin and not (ob.name == "Cat_Ears" and f.material_index == 1)]
    if closed:
        bmesh.ops.recalc_face_normals(bm, faces=closed)
    flips = []
    if on_skin:  # decals: must face away from the skin underneath
        for f in bm.faces:
            _, nor, _, _ = BVH.find_nearest(f.calc_center_median())
            if f.normal.dot(nor) < 0:
                flips.append(f)
    if ob.name == "Cat_Ears":  # inner-ear patches face away from their ear shell
        for side in (1, -1):
            outer = [v.co for f in bm.faces if f.material_index == 0 for v in f.verts if v.co.x * side > 0]
            cen = sum(outer, Vector()) / len(outer)
            for f in bm.faces:
                c = f.calc_center_median()
                if f.material_index == 1 and c.x * side > 0 and f.normal.dot(c - cen) < 0:
                    flips.append(f)
    if flips:
        bmesh.ops.reverse_faces(bm, faces=flips)
    bm.to_mesh(ob.data)
    bm.free()


for o in list(C_MODEL.all_objects):
    if o.name != "Cat_Body" and not o.name.startswith("Cat_Fur"):
        fix_normals(o)

# ------------------------------------------------------------------ report + save
for o in C_MODEL.all_objects:
    o.data.name = o.name
stats = {}
for o in list(C_MODEL.all_objects) + list(C_FX.objects):
    if o.type == "MESH":
        stats[o.name] = sum(len(p.vertices) - 2 for p in o.data.polygons)
model_tris = sum(v for k, v in stats.items() if not k.startswith("FX_"))
info = {"tris": stats, "model_tris_total": model_tris, "body_quads": len(body.data.polygons),
        "body_seams": seam_count, "body_parts_faces": body_labels}
print("STATS", json.dumps(info))
with open(os.path.join(WD, "stats.json"), "w") as fh:
    json.dump(info, fh, indent=1)
# body UVs for the layout image
uv = np.zeros(len(body.data.loops) * 2)
body.data.uv_layers.active.data.foreach_get("uv", uv)
np.savez(os.path.join(WD, "body_uv.npz"), uv=uv.reshape(-1, 2),
         loop_start=np.array([p.loop_start for p in body.data.polygons]),
         loop_total=np.array([p.loop_total for p in body.data.polygons]), labels=lab, label_names=np.array(uniq))
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print("SAVED", OUT)
