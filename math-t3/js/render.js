/* Enjin paparan: tatatanda matematik ringkas + rajah SVG.
   Tatatanda dalam teks soalan:
     ^{..}  superskrip      _{..}  subskrip
     ~f{a}{b}  pecahan      ~r{x}  punca kuasa dua      ~rt{n}{x}  punca kuasa n
   Rentetan yang bermula dengan '<svg' dipaparkan terus. */

window.BANK = [];

function M(s) {
  if (s == null) return '';
  s = String(s);
  if (s.trimStart().startsWith('<svg')) return s;
  let i = 0;
  const grp = () => {
    if (s[i] !== '{') return s[i++] || '';
    i++;
    const out = seq();
    i++;
    return out;
  };
  const seq = () => {
    let out = '';
    while (i < s.length && s[i] !== '}') {
      if (s.startsWith('~f{', i)) {
        i += 2;
        const a = grp(), b = grp();
        out += `<span class="fr"><span class="nu">${a}</span><span class="de">${b}</span></span>`;
      } else if (s.startsWith('~rt{', i)) {
        i += 3;
        const n = grp(), x = grp();
        out += `<span class="rt"><sup class="ri">${n}</sup>√<span class="rx">${x}</span></span>`;
      } else if (s.startsWith('~r{', i)) {
        i += 2;
        out += `<span class="rt">√<span class="rx">${grp()}</span></span>`;
      } else if (s[i] === '^' && s[i + 1] === '{') {
        i++;
        out += `<sup>${grp()}</sup>`;
      } else if (s[i] === '_' && s[i + 1] === '{') {
        i++;
        out += `<sub>${grp()}</sub>`;
      } else {
        out += s[i++];
      }
    }
    return out;
  };
  let out = '';
  while (i < s.length) {
    out += seq();
    if (s[i] === '}') { out += '}'; i++; }
  }
  return out;
}

/* ---------- Rajah ---------- */
const D = {};
const r1 = (n) => Math.round(n * 10) / 10;
const unit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

D.svg = (w, h, inner, cls = '') =>
  `<svg class="fig ${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;

D.onC = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
D.ext = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

/* Babak umum: titik bernama, poligon, segmen, bulatan, tanda sudut, label sisi. */
D.inner = function (o) {
  const P = o.P;
  const pts = Object.values(P);
  const ctr = o.center || [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  const pt = (k) => (typeof k === 'string' ? P[k] : k);
  let s = '';
  (o.fills || []).forEach((p) => { s += `<polygon class="shade" points="${p.map((k) => pt(k).map(r1).join(',')).join(' ')}"/>`; });
  (o.circles || []).forEach((c) => {
    const cc = pt(c.c);
    s += `<circle class="ln${c.dash ? ' dash' : ''}${c.hl ? ' hl' : ''}" cx="${r1(cc[0])}" cy="${r1(cc[1])}" r="${c.r}"/>`;
  });
  (o.polys || []).forEach((p) => { s += `<polygon class="ln" points="${p.map((k) => pt(k).map(r1).join(',')).join(' ')}"/>`; });
  (o.segs || []).forEach(([a, b, f]) => {
    const A = pt(a), B = pt(b);
    s += `<line class="ln${f ? ' ' + f : ''}" x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}"/>`;
  });
  (o.rights || []).forEach(([a, v, b]) => {
    const V = pt(v), u1 = unit([pt(a)[0] - V[0], pt(a)[1] - V[1]]), u2 = unit([pt(b)[0] - V[0], pt(b)[1] - V[1]]);
    const k = 11;
    s += `<polyline class="ln thin" points="${[[V[0] + u1[0] * k, V[1] + u1[1] * k], [V[0] + u1[0] * k + u2[0] * k, V[1] + u1[1] * k + u2[1] * k], [V[0] + u2[0] * k, V[1] + u2[1] * k]].map((p) => p.map(r1).join(',')).join(' ')}"/>`;
  });
  (o.angs || []).forEach(([a, v, b, label, rr, cls]) => {
    const V = pt(v), u1 = unit([pt(a)[0] - V[0], pt(a)[1] - V[1]]), u2 = unit([pt(b)[0] - V[0], pt(b)[1] - V[1]]);
    const r = rr || 20;
    const cross = u1[0] * u2[1] - u1[1] * u2[0];
    const p1 = [V[0] + u1[0] * r, V[1] + u1[1] * r], p2 = [V[0] + u2[0] * r, V[1] + u2[1] * r];
    s += `<path class="arc${cls ? ' ' + cls : ''}" d="M${r1(p1[0])},${r1(p1[1])} A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${r1(p2[0])},${r1(p2[1])}"/>`;
    let bis = [u1[0] + u2[0], u1[1] + u2[1]];
    if (Math.hypot(bis[0], bis[1]) < 0.05) bis = [-u1[1], u1[0]];
    bis = unit(bis);
    const sharp = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) < 0.8;
    const d = r + (sharp ? 22 : 13);
    if (label) s += `<text class="al${cls ? ' ' + cls : ''}" x="${r1(V[0] + bis[0] * d)}" y="${r1(V[1] + bis[1] * d)}">${label}</text>`;
  });
  (o.sides || []).forEach(([a, b, label, flip]) => {
    const A = pt(a), B = pt(b), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let n = unit([-(B[1] - A[1]), B[0] - A[0]]);
    if ((m[0] - ctr[0]) * n[0] + (m[1] - ctr[1]) * n[1] < 0) n = [-n[0], -n[1]];
    if (flip) n = [-n[0], -n[1]];
    const anchor = n[0] > 0.35 ? 'start' : n[0] < -0.35 ? 'end' : 'middle', k = anchor === 'middle' ? 14 : 8;
    s += `<text class="sl" style="text-anchor:${anchor}" x="${r1(m[0] + n[0] * k)}" y="${r1(m[1] + n[1] * k)}">${label}</text>`;
  });
  (o.dots || []).forEach((k) => { const p = pt(k); s += `<circle class="dot" cx="${r1(p[0])}" cy="${r1(p[1])}" r="3"/>`; });
  const lp = o.lpos || {};
  (o.labels || Object.keys(P)).forEach((k) => {
    const p = P[k];
    let off;
    if (lp[k]) off = lp[k];
    else {
      const d = unit([p[0] - ctr[0], p[1] - ctr[1]]);
      off = [d[0] * 14, d[1] * 14];
    }
    s += `<text class="pl" x="${r1(p[0] + off[0])}" y="${r1(p[1] + off[1])}">${k}</text>`;
  });
  (o.texts || []).forEach(([x, y, t, cls]) => { s += `<text class="${cls || 'sl'}" x="${x}" y="${y}">${t}</text>`; });
  return s;
};
D.scene = (o) => D.svg(o.w || 300, o.h || 220, D.inner(o), o.cls || '');

/* Grid untuk lokus dan lukisan berskala. Koordinat grid: x ke kanan, y ke atas. */
D.grid = function (o) {
  const u = o.u || 30, pad = o.pad || 24, W = o.cols * u + pad * 2, H = o.rows * u + pad * 2;
  const g = (x, y) => [pad + x * u, pad + (o.rows - y) * u];
  let s = '';
  for (let i = 0; i <= o.cols; i++) s += `<line class="gl" x1="${pad + i * u}" y1="${pad}" x2="${pad + i * u}" y2="${pad + o.rows * u}"/>`;
  for (let j = 0; j <= o.rows; j++) s += `<line class="gl" x1="${pad}" y1="${pad + j * u}" x2="${pad + o.cols * u}" y2="${pad + j * u}"/>`;
  const P = {};
  Object.entries(o.P || {}).forEach(([k, v]) => { P[k] = g(v[0], v[1]); });
  const map = (arr) => (arr || []).map((x) => (Array.isArray(x) && typeof x[0] === 'number' ? g(x[0], x[1]) : x));
  s += D.inner({
    P,
    center: o.center ? g(o.center[0], o.center[1]) : undefined,
    polys: (o.polys || []).map(map),
    fills: (o.fills || []).map(map),
    segs: (o.segs || []).map(([a, b, f]) => [Array.isArray(a) ? g(a[0], a[1]) : a, Array.isArray(b) ? g(b[0], b[1]) : b, f]),
    circles: (o.circles || []).map((c) => ({ ...c, c: Array.isArray(c.c) ? g(c.c[0], c.c[1]) : c.c, r: c.r * u })),
    dots: o.dots,
    lpos: o.lpos,
    labels: o.labels,
    texts: (o.texts || []).map(([x, y, t, c]) => { const p = g(x, y); return [r1(p[0]), r1(p[1]), t, c]; }),
  });
  return D.svg(W, H, s, o.cls || '');
};

/* Satah Cartes untuk Garis Lurus. */
D.cart = function (o) {
  const [x0, x1] = o.xr, [y0, y1] = o.yr, u = o.u || 24, pad = 26;
  const W = (x1 - x0) * u + pad * 2, H = (y1 - y0) * u + pad * 2;
  const X = (x) => pad + (x - x0) * u, Y = (y) => pad + (y1 - y) * u;
  let s = '';
  for (let x = x0; x <= x1; x++) s += `<line class="gl" x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}"/>`;
  for (let y = y0; y <= y1; y++) s += `<line class="gl" x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}"/>`;
  s += `<line class="axis" x1="${X(x0)}" y1="${Y(0)}" x2="${X(x1) + 8}" y2="${Y(0)}"/><line class="axis" x1="${X(0)}" y1="${Y(y0)}" x2="${X(0)}" y2="${Y(y1) - 8}"/>`;
  s += `<text class="ax" x="${X(x1) + 14}" y="${Y(0)}">x</text><text class="ax" x="${X(0)}" y="${Y(y1) - 16}">y</text>`;
  const step = o.step || 1;
  for (let x = x0; x <= x1; x += step) if (x !== 0) s += `<text class="tk" x="${X(x)}" y="${Y(0) + 13}">${x < 0 ? '−' + -x : x}</text>`;
  for (let y = y0; y <= y1; y += step) if (y !== 0) s += `<text class="tk" x="${X(0) - 11}" y="${Y(y)}">${y < 0 ? '−' + -y : y}</text>`;
  s += `<text class="tk" x="${X(0) - 9}" y="${Y(0) + 12}">O</text>`;
  const id = 'c' + Math.random().toString(36).slice(2, 8);
  s += `<clipPath id="${id}"><rect x="${X(x0)}" y="${Y(y1)}" width="${(x1 - x0) * u}" height="${(y1 - y0) * u}"/></clipPath><g clip-path="url(#${id})">`;
  (o.lines || []).forEach(([a, b, c, d, f]) => { s += `<line class="ln${f ? ' ' + f : ''}" x1="${X(a)}" y1="${Y(b)}" x2="${X(c)}" y2="${Y(d)}"/>`; });
  s += '</g>';
  (o.pts || []).forEach(([x, y, t, dx = 10, dy = -10]) => {
    s += `<circle class="dot" cx="${X(x)}" cy="${Y(y)}" r="3.5"/>`;
    if (t) s += `<text class="pl" x="${X(x) + dx}" y="${Y(y) + dy}">${t}</text>`;
  });
  return D.svg(W, H, s, 'cart');
};

/* ---------- Pelan & dongakan dari susunan kubus ---------- */
/* Kubus [x, y, z]: x ke kanan, y ke belakang, z ke atas. Depan = arah -y. */
D.iso = function (cubes, o = {}) {
  const s = o.s || 26, c = s * Math.cos(Math.PI / 6), h = s / 2;
  const has = (x, y, z) => cubes.some((q) => q[0] === x && q[1] === y && q[2] === z);
  const pr = (x, y, z) => [(x + y) * c, (x - y) * h - z * s];
  const xs = cubes.map((q) => q[0]), ys = cubes.map((q) => q[1]);
  const midX = (Math.min(...xs) + Math.max(...xs) + 1) / 2, maxXc = Math.max(...xs) + 1, midY = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
  const arrows = [];
  if (o.front !== false) arrows.push([pr(midX, -1.7, 0.3), pr(midX, -0.35, 0.3), 'Depan']);
  if (o.side) arrows.push([pr(maxXc + 1.7, midY, 0.3), pr(maxXc + 0.35, midY, 0.3), 'Sisi']);
  const all = [];
  cubes.forEach(([x, y, z]) => {
    for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) all.push(pr(x + dx, y + dy, z + dz));
  });
  arrows.forEach(([a, b]) => all.push(a, [a[0], a[1] + 16], b));
  const minX = Math.min(...all.map((p) => p[0])) - 24, maxX = Math.max(...all.map((p) => p[0])) + 24;
  const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
  const padL = 6, padR = 6, padT = 8, padB = 8;
  const T = (p) => [p[0] - minX + padL, p[1] - minY + padT];
  const poly = (pts, cls) => `<polygon class="${cls}" points="${pts.map((p) => T(p).map(r1).join(',')).join(' ')}"/>`;
  const order = [...cubes].sort((a, b) => a[2] - b[2] || b[1] - a[1] || a[0] - b[0]);
  let g = '';
  order.forEach(([x, y, z]) => {
    if (!has(x, y - 1, z)) g += poly([pr(x, y, z), pr(x + 1, y, z), pr(x + 1, y, z + 1), pr(x, y, z + 1)], 'cf');
    if (!has(x + 1, y, z)) g += poly([pr(x + 1, y, z), pr(x + 1, y + 1, z), pr(x + 1, y + 1, z + 1), pr(x + 1, y, z + 1)], 'cs');
    if (!has(x, y, z + 1)) g += poly([pr(x, y, z + 1), pr(x + 1, y, z + 1), pr(x + 1, y + 1, z + 1), pr(x, y + 1, z + 1)], 'ct');
  });
  const W = maxX - minX + padL + padR, H = maxY - minY + padT + padB;
  const arrow = (from, to, label) => {
    const A = T(from), B = T(to);
    const u = unit([B[0] - A[0], B[1] - A[1]]), n = [-u[1], u[0]];
    const tip = `${r1(B[0])},${r1(B[1])} ${r1(B[0] - u[0] * 9 + n[0] * 5)},${r1(B[1] - u[1] * 9 + n[1] * 5)} ${r1(B[0] - u[0] * 9 - n[0] * 5)},${r1(B[1] - u[1] * 9 - n[1] * 5)}`;
    return `<line class="arw" x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}"/><polygon class="arwh" points="${tip}"/><text class="al" x="${r1(A[0] - u[0] * 4)}" y="${r1(A[1] - u[1] * 4 + 12)}">${label}</text>`;
  };
  const a = arrows.map(([f, t, l]) => arrow(f, t, l)).join('');
  return D.svg(r1(W), r1(H), g + a, 'iso');
};

/* Kira pandangan: kembalikan peta sel 'i,j' -> nilai kedalaman. */
D.viewCells = function (cubes, which) {
  const m = {};
  cubes.forEach(([x, y, z]) => {
    let k, v;
    if (which === 'plan') { k = x + ',' + y; v = -(z + 1); }
    else if (which === 'front') { k = x + ',' + z; v = y; }
    else { k = y + ',' + z; v = -x; }
    if (!(k in m) || v < m[k]) m[k] = v;
  });
  return m;
};
D.flip = (m, axis) => {
  const keys = Object.keys(m).map((k) => k.split(',').map(Number));
  const mx = Math.max(...keys.map((p) => p[axis]));
  const o = {};
  keys.forEach((p) => { const q = [...p]; q[axis] = mx - q[axis]; o[q.join(',')] = m[p.join(',')]; });
  return o;
};
D.view = function (m) {
  const keys = Object.keys(m).map((k) => k.split(',').map(Number));
  const mi = Math.min(...keys.map((p) => p[0])), mj = Math.min(...keys.map((p) => p[1]));
  const cells = {};
  keys.forEach((p) => { cells[(p[0] - mi) + ',' + (p[1] - mj)] = m[p.join(',')]; });
  const ks = Object.keys(cells).map((k) => k.split(',').map(Number));
  const ni = Math.max(...ks.map((p) => p[0])) + 1, nj = Math.max(...ks.map((p) => p[1])) + 1;
  const u = 24, pad = 8, W = ni * u + pad * 2, H = nj * u + pad * 2;
  const get = (i, j) => cells[i + ',' + j];
  const X = (i) => pad + i * u, Y = (j) => pad + (nj - j) * u;
  let s = '';
  ks.forEach(([i, j]) => { s += `<rect class="vf" x="${X(i)}" y="${Y(j + 1)}" width="${u}" height="${u}"/>`; });
  for (let i = 0; i <= ni; i++) for (let j = 0; j < nj; j++) {
    const a = get(i - 1, j), b = get(i, j);
    if ((a !== undefined || b !== undefined) && a !== b) s += `<line class="ve" x1="${X(i)}" y1="${Y(j)}" x2="${X(i)}" y2="${Y(j + 1)}"/>`;
  }
  for (let j = 0; j <= nj; j++) for (let i = 0; i < ni; i++) {
    const a = get(i, j - 1), b = get(i, j);
    if ((a !== undefined || b !== undefined) && a !== b) s += `<line class="ve" x1="${X(i)}" y1="${Y(j)}" x2="${X(i + 1)}" y2="${Y(j)}"/>`;
  }
  return D.svg(W, H, s, 'view');
};
/* Empat pilihan jawapan: [betul, pengganggu...] semuanya berbeza. */
D.viewOpts = function (cubes, which) {
  const views = ['plan', 'front', 'side'];
  const cand = [D.viewCells(cubes, which)];
  views.filter((v) => v !== which).forEach((v) => cand.push(D.viewCells(cubes, v)));
  cand.push(D.flip(cand[0], 0), D.flip(cand[0], 1));
  cubes.forEach((_, i) => { const c = cubes.filter((__, j) => j !== i); if (c.length > 1) cand.push(D.viewCells(c, which)); });
  const out = [], seen = new Set();
  for (const m of cand) {
    const svg = D.view(m);
    if (!seen.has(svg)) { seen.add(svg); out.push(svg); }
    if (out.length === 4) break;
  }
  return out;
};
