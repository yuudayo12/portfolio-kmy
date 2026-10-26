"""Build compositions/captions.html from the Whisper transcript.

Edit map (source seconds -> film seconds):
  hook : src 7.45-13.45  -> film 0.00-6.00
  segA : src 0.00-52.30  -> film 6.00-58.30
  segB : src 54.40-100.05 -> film 58.30-103.95
"""
import json, re, sys, html

SRC, OUT = sys.argv[1], sys.argv[2]
SEGMENTS = [  # (src_in, src_out, film_in)
    (7.45, 13.45, 0.0),
    (0.0, 52.30, 6.0),
    (54.40, 100.05, 58.30),
]

words = []
for seg in json.load(open(SRC)):
    for w in seg["words"]:
        words.append({"t": w["w"].strip(), "s": w["s"], "e": w["e"], "br": False})
    words[-1]["br"] = True  # sentence/segment end

# --- transcript fixes (Whisper mis-hearings, checked against re-runs) ---
def join(i, text):
    words[i]["t"] = text
    words[i]["e"] = words[i + 1]["e"]
    words[i]["br"] = words[i + 1]["br"]
    del words[i + 1]

i = 0
while i < len(words):
    t = words[i]["t"]
    nxt = words[i + 1]["t"] if i + 1 < len(words) else ""
    if t == "web" and nxt == "-web":
        join(i, "vibe-vibe"); continue
    if nxt.startswith("-") and t.lower() in ("keliling", "rumit", "usb"):
        join(i, t + nxt); continue
    if t.lower() == "type" and nxt.startswith("C"):
        join(i, "Type-C" + nxt[1:]); continue
    words[i]["t"] = (t.replace("Mauno", "Maono").replace("SLA", "XLR")
                     .replace("USB-A", "USB-A"))
    i += 1

# Ending: "Aku sediakan beg kuning kat bawah untuk hampa."
k = next(j for j, w in enumerate(words) if w["t"].startswith("sediakan"))
end = next(j for j, w in enumerate(words) if w["t"].startswith("ampua"))
fixed = [("sediakan", 94.80, 95.06), ("beg", 95.06, 95.22), ("kuning", 95.22, 95.40),
         ("kat", 95.40, 95.52), ("bawah", 95.52, 95.66), ("untuk", 95.66, 96.12),
         ("hampa.", 96.12, 96.42)]
words[k:end + 1] = [{"t": t, "s": s, "e": e, "br": t.endswith(".")} for t, s, e in fixed]
for w in words:
    if w["t"] == "Mak.":
        w["t"] = "mak!"
    if w["t"] == "sediakan.":
        w["t"] = "sediakan"

KEY = re.compile(r"^(maono|pd100x|rm300|berbaloi|dynamic|mute|xlr|type-c|usb-a|usb|solid|soundcard)$", re.I)
UPPER = re.compile(r"^(maono|pd100x)$", re.I)

def clean(t):
    return re.sub(r"[.,?!]+$", "", t)

def group(seq):
    groups, cur = [], []
    for j, w in enumerate(seq):
        cur.append(w)
        nxt = seq[j + 1] if j + 1 < len(seq) else None
        if nxt is None:
            groups.append(cur); break
        chars = sum(len(clean(x["t"])) + 1 for x in cur) + len(clean(nxt["t"]))
        gap = nxt["s"] - w["e"]
        hard = w["t"].endswith((".", "?", "!")) or gap >= 0.35 or len(cur) >= 4 or chars > 19
        soft = (w["t"].endswith(",") or gap >= 0.15) and len(cur) >= 2
        if hard or soft:
            groups.append(cur); cur = []
    # fold a lone short word into its neighbour when it fits
    out = []
    for g in groups:
        if out:
            prev = out[-1]
            fits = sum(len(clean(x["t"])) + 1 for x in prev + g) <= 23 and len(prev + g) <= 4
            close = g[0]["s"] - prev[-1]["e"] < 0.6
            if fits and close and (len(g) == 1 or len(prev) == 1):
                out[-1] = prev + g; continue
        out.append(g)
    return out

all_groups = []
for src_in, src_out, film_in in SEGMENTS:
    seq = [dict(w) for w in words if w["s"] >= src_in - 0.01 and w["e"] <= src_out + 0.05]
    off = film_in - src_in
    for w in seq:
        w["s"] = round(w["s"] + off, 3); w["e"] = round(min(w["e"], src_out) + off, 3)
    seg_end = src_out + off
    gs = group(seq)
    for gi, g in enumerate(gs):
        start = max(film_in + 0.0, g[0]["s"] - 0.06)
        nstart = gs[gi + 1][0]["s"] - 0.06 if gi + 1 < len(gs) else seg_end
        end = min(g[-1]["e"] + 0.45, nstart, seg_end)
        all_groups.append({"start": round(start, 3), "end": round(end, 3), "words": g})

# Keep the very first caption on screen from frame 0 (thumbnail = hook line).
all_groups[0]["start"] = 0.0

# Final line holds to the end of the film.
all_groups[-1]["end"] = 103.95

markup, script = [], []
for gi, g in enumerate(all_groups):
    spans = []
    for wi, w in enumerate(g["words"]):
        t = clean(w["t"])
        if UPPER.match(t):
            t = t.upper()
        cls = "w key" if KEY.match(t) else "w"
        spans.append(f'<span id="c{gi}w{wi}" class="{cls}">{html.escape(t)}</span>')
    markup.append(f'      <div id="cap{gi}" class="cap">{" ".join(spans)}</div>')
    s, e = g["start"], g["end"]
    din = round(min(0.16, (e - s) * 0.35), 3)
    dout = round(min(0.1, (e - s) * 0.25), 3)
    script.append(f'    tl.fromTo("#cap{gi}", {{ opacity: 0, y: 18, filter: "blur(6px)" }}, '
                  f'{{ opacity: 1, y: 0, filter: "blur(0px)", duration: {din}, ease: "power3.out" }}, {s});')
    for wi, w in enumerate(g["words"]):
        if KEY.match(clean(w["t"])):
            continue
        script.append(f'    tl.to("#c{gi}w{wi}", {{ color: Y, duration: 0.06, ease: "none" }}, {min(max(s, w["s"] - 0.03), e - 0.16):.3f});')
        script.append(f'    tl.to("#c{gi}w{wi}", {{ color: W, duration: 0.08, ease: "none" }}, {min(w["e"], e - 0.09):.3f});')
    script.append(f'    tl.to("#cap{gi}", {{ opacity: 0, duration: {dout}, ease: "power2.in" }}, {e - dout:.3f});')
    script.append(f'    tl.set("#cap{gi}", {{ visibility: "hidden" }}, {e:.3f});')

doc = f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    #captions .cap {{
      position: absolute; left: 0; right: 0; top: 1150px;
      padding: 0 90px; text-align: center; opacity: 0;
      font-family: "Montserrat", sans-serif; font-weight: 800;
      font-size: 74px; line-height: 1.12; letter-spacing: -0.01em;
      color: #ffffff; overflow: visible;
      text-shadow: 0 3px 10px rgba(0, 0, 0, 0.55), 0 10px 34px rgba(0, 0, 0, 0.45);
      -webkit-text-stroke: 2px rgba(10, 10, 12, 0.35); paint-order: stroke fill;
    }}
    #captions .w {{ color: #ffffff; }}
    #captions .w.key {{ color: #ffd23f; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920">
    <div id="captions" data-layout-allow-overlap>
{chr(10).join(markup)}
    </div>
  </div>
  <script>
    const Y = "#ffd23f", W = "#ffffff";
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(script)}
    window.__timelines["captions"] = tl;
  </script>
</template>
"""
open(OUT, "w").write(doc)
for gi, g in enumerate(all_groups):
    print(f'{gi:3d} {g["start"]:7.2f}-{g["end"]:7.2f}  ' + " ".join(clean(w["t"]) for w in g["words"]))
