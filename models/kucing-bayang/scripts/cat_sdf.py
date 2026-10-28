"""Signed-distance definition of the shadow cat's base body.

Pure numpy so it runs both in system Python (marching cubes) and inside
Blender (part labels for UV seams).  Units are metres, the cat faces -Y,
Z is up and the cat's left side is +X.
"""
import numpy as np


def rot(rx=0.0, ry=0.0, rz=0.0):
    """XYZ euler (degrees) -> 3x3 matrix whose columns are the local axes."""
    rx, ry, rz = np.radians([rx, ry, rz])
    cx, sx, cy, sy, cz, sz = np.cos(rx), np.sin(rx), np.cos(ry), np.sin(ry), np.cos(rz), np.sin(rz)
    mx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    my = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    mz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return mz @ my @ mx


def ellipsoid(p, c, r, R=None):
    q = p - np.asarray(c, dtype=p.dtype)
    if R is not None:
        q = q @ np.asarray(R, dtype=p.dtype)
    r = np.asarray(r, dtype=p.dtype)
    k0 = np.linalg.norm(q / r, axis=-1)
    k1 = np.linalg.norm(q / (r * r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def roundcone(p, a, b, ra, rb):
    a = np.asarray(a, dtype=p.dtype)
    ba = np.asarray(b, dtype=p.dtype) - a
    pa = p - a
    h = np.clip((pa @ ba) / (ba @ ba), 0.0, 1.0)
    d = np.linalg.norm(pa - h[:, None] * ba, axis=-1)
    return d - (ra + (rb - ra) * h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def chain(points, radii):
    """Consecutive round cones through a path."""
    out = []
    for i in range(len(points) - 1):
        out.append(("cone", points[i], points[i + 1], radii[i], radii[i + 1]))
    return out


# ---------------------------------------------------------------- anatomy
# Paths are also used for UV seam placement, so keep them as named data.
def spline(points, radii, per_seg=6):
    """Catmull-Rom resample of a control polyline (and its radii)."""
    P = np.asarray(points, float); R = np.asarray(radii, float)
    P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    R = np.concatenate([[R[0]], R, [R[-1]]])
    outp, outr = [], []
    for i in range(1, len(P) - 2):
        for s in range(per_seg):
            t = s / per_seg
            t2, t3 = t * t, t * t * t
            w = np.array([-t3 + 2 * t2 - t, 3 * t3 - 5 * t2 + 2, -3 * t3 + 4 * t2 + t, t3 - t2]) * 0.5
            outp.append(w @ P[i - 1:i + 3]); outr.append(w @ R[i - 1:i + 3])
    outp.append(P[-2]); outr.append(R[-2])
    return [tuple(p) for p in outp], list(outr)


TAIL_CTRL = [
    (0.00, 0.36, 0.58), (0.00, 0.49, 0.52), (-0.03, 0.61, 0.40), (-0.08, 0.69, 0.26),
    (-0.17, 0.71, 0.14), (-0.30, 0.69, 0.09), (-0.44, 0.65, 0.10), (-0.56, 0.61, 0.18),
    (-0.62, 0.58, 0.30), (-0.59, 0.56, 0.42), (-0.50, 0.55, 0.46), (-0.42, 0.55, 0.41),
    (-0.40, 0.56, 0.33), (-0.45, 0.57, 0.28),
]
TAIL_CTRL_R = [0.046, 0.044, 0.041, 0.038, 0.036, 0.034, 0.032, 0.030, 0.028, 0.026, 0.024, 0.021, 0.018, 0.013]
TAIL_PATH, TAIL_RADII = spline(TAIL_CTRL, TAIL_CTRL_R)

FORE_PATH = [(0.074, -0.30, 0.52), (0.072, -0.32, 0.45), (0.068, -0.23, 0.31), (0.066, -0.30, 0.08), (0.066, -0.335, 0.032)]
FORE_RADII = [0.050, 0.048, 0.038, 0.024, 0.027]
HIND_PATH = [(0.085, 0.25, 0.50), (0.088, 0.185, 0.30), (0.082, 0.35, 0.14), (0.078, 0.325, 0.035)]
HIND_RADII = [0.062, 0.040, 0.023, 0.026]

BODY_PATH = [(0, -0.30, 0.58), (0, -0.17, 0.50), (0, 0.06, 0.53), (0, 0.25, 0.54), (0, 0.36, 0.58)]
NECK_PATH = [(0, -0.30, 0.58), (0, -0.42, 0.555)]
HEAD_C = np.array([0.0, -0.50, 0.545])
HEAD_S = 1.22          # head centre; head prims are local to it
HEAD_PATH = [tuple(HEAD_C + HEAD_S * np.array([0, 0.09, 0])), tuple(HEAD_C), tuple(HEAD_C + HEAD_S * np.array([0, -0.125, -0.015]))]

EYE_L = tuple(HEAD_C + HEAD_S * np.array([0.042, -0.083, 0.010]))  # eye socket centre (left, +X)
EYE_R = (-EYE_L[0], EYE_L[1], EYE_L[2])
EYE_SOCKET_R = 0.0145 * HEAD_S

# toe centres for the left paws (+X); claws grow out of these
FORE_PAW_L = (0.066, -0.345, 0.026)
HIND_PAW_L = (0.078, 0.333, 0.025)
FORE_TOES_L = [(0.066 + dx, -0.380 - dy, 0.019) for dx, dy in [(-0.026, -0.008), (-0.009, 0.0), (0.009, 0.0), (0.026, -0.008)]]
HIND_TOES_L = [(0.078 + dx, 0.298 - dy, 0.018) for dx, dy in [(-0.024, -0.007), (-0.008, 0.0), (0.008, 0.0), (0.024, -0.007)]]
TOE_R = 0.0135


def mx(p):
    return (-p[0], p[1], p[2])


def mirror_x(item):
    kind = item[0]
    if kind == "ell":
        _, c, r, R = item
        R2 = None
        if R is not None:
            M = np.diag([-1.0, 1.0, 1.0])
            R2 = M @ np.asarray(R) @ M
        return ("ell", (-c[0], c[1], c[2]), r, R2)
    if kind == "cone":
        _, a, b, ra, rb = item
        return ("cone", (-a[0], a[1], a[2]), (-b[0], b[1], b[2]), ra, rb)
    if kind == "toe":
        return ("toe", mx(item[1]), item[2])
    raise ValueError(kind)


def _h(v):
    return tuple(HEAD_C + HEAD_S * np.asarray(v, float))


def _hs(item):
    """scale radii of a head-local primitive"""
    if item[0] == "ell":
        return (item[0], item[1], tuple(HEAD_S * np.asarray(item[2])), item[3])
    return (item[0], item[1], item[2], item[3] * HEAD_S, item[4] * HEAD_S)


def build_parts():
    """part name -> (list of primitives, smooth k inside part)."""
    body = [
        ("ell", (0, -0.17, 0.500), (0.100, 0.20, 0.145), rot(-8)),   # ribcage, deep chest
        ("ell", (0, -0.24, 0.625), (0.075, 0.11, 0.070), None),      # withers hump
        ("ell", (0, 0.06, 0.530), (0.082, 0.17, 0.088), rot(4)),     # tucked waist
        ("ell", (0, 0.25, 0.540), (0.095, 0.135, 0.100), None),      # pelvis
        ("ell", (0, -0.23, 0.385), (0.055, 0.11, 0.045), rot(-12)),  # sternum keel
    ]
    side = [
        ("ell", (0.068, -0.255, 0.540), (0.038, 0.090, 0.120), rot(-28)),  # scapula / shoulder muscle
        ("ell", (0.080, 0.230, 0.440), (0.055, 0.120, 0.150), rot(18)),    # thigh muscle
        ("ell", (0.072, 0.05, 0.510), (0.028, 0.12, 0.070), rot(5)),       # flank / oblique
    ]
    body += side + [mirror_x(s) for s in side]

    neck = [("cone", NECK_PATH[0], NECK_PATH[1], 0.095, 0.075),
            ("ell", (0, -0.36, 0.625), (0.060, 0.08, 0.050), rot(12))]   # nape muscle

    head = [
        ("ell", _h((0, 0, 0)), (0.080, 0.095, 0.068), rot(-6)),                    # cranium
        ("cone", _h((0, -0.045, 0.024)), _h((0, -0.128, -0.010)), 0.038, 0.019),   # nose bridge
        ("ell", _h((0, -0.103, -0.032)), (0.030, 0.042, 0.026), rot(-10)),         # muzzle
        ("ell", _h((0, -0.088, -0.055)), (0.028, 0.032, 0.018), rot(-8)),          # chin
        ("cone", _h((0, 0.02, -0.05)), _h((0, -0.08, -0.058)), 0.048, 0.026),      # jaw line
    ]
    head_side = [
        ("ell", _h((0.056, -0.042, -0.016)), (0.040, 0.050, 0.034), rot(0, 0, 18)),    # cheekbone
        ("ell", _h((0.040, -0.080, 0.030)), (0.030, 0.022, 0.014), rot(-20, 0, 26)),   # brow ridge
        ("ell", _h((0.019, -0.106, -0.030)), (0.020, 0.020, 0.017), None),            # whisker pad
    ]
    head += head_side + [mirror_x(s) for s in head_side]
    head = [_hs(h) for h in head]

    fore_l = chain(FORE_PATH, FORE_RADII) + [
        ("ell", (0.069, -0.262, 0.240), (0.030, 0.036, 0.075), rot(14)),     # forearm muscle
        ("ell", FORE_PAW_L, (0.038, 0.048, 0.026), None),                   # paw
    ] + [("toe", t, TOE_R) for t in FORE_TOES_L]
    hind_l = chain(HIND_PATH, HIND_RADII) + [
        ("ell", (0.086, 0.270, 0.240), (0.024, 0.040, 0.055), rot(-35)),     # calf
        ("ell", HIND_PAW_L, (0.036, 0.048, 0.025), None),                   # paw
    ] + [("toe", t, TOE_R * 0.95) for t in HIND_TOES_L]
    tail = chain(TAIL_PATH, TAIL_RADII)

    return {
        "body": (body, 0.045),
        "neck": (neck, 0.03),
        "head": (head, 0.022),
        "fore_L": (fore_l, 0.02),
        "fore_R": ([mirror_x(s) for s in fore_l], 0.02),
        "hind_L": (hind_l, 0.02),
        "hind_R": ([mirror_x(s) for s in hind_l], 0.02),
        "tail": (tail, 0.01),
    }


# smooth k used when a part joins the rest
JOIN_K = {"body": 0.0, "neck": 0.05, "head": 0.035, "fore_L": 0.04, "fore_R": 0.04,
          "hind_L": 0.045, "hind_R": 0.045, "tail": 0.03}


def eval_prim(p, item):
    if item[0] == "ell":
        return ellipsoid(p, item[1], item[2], item[3])
    if item[0] == "toe":
        r = item[2]
        return ellipsoid(p, item[1], (r, r * 1.1, r * 0.85), None)
    return roundcone(p, item[1], item[2], item[3], item[4])


def part_sdfs(p, parts=None):
    parts = parts or build_parts()
    out = {}
    for name, (prims, k) in parts.items():
        d = None
        for it in prims:
            e = eval_prim(p, it)
            d = e if d is None else smin(d, e, 0.005 if it[0] == "toe" else k)
        out[name] = d
    return out


def total_sdf(p, parts=None):
    ps = part_sdfs(p, parts)
    d = ps["body"]
    for name in ["neck", "head", "fore_L", "fore_R", "hind_L", "hind_R", "tail"]:
        d = smin(d, ps[name], JOIN_K[name])
    for eye in (EYE_L, EYE_R):  # eye sockets
        d = smax(d, -(np.linalg.norm(p - np.asarray(eye, dtype=p.dtype), axis=-1) - EYE_SOCKET_R), 0.006)
    return d, ps


def labels(p):
    ps = part_sdfs(p)
    names = list(ps.keys())
    stack = np.stack([ps[n] for n in names], axis=0)
    return names, np.argmin(stack, axis=0)
