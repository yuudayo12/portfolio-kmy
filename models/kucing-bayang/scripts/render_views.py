"""blender -b file.blend -P render_views.py -- outdir samples res views(comma)

views: hero (with FX), front, side, back34, top, wire (clay + wireframe), face
Renders are transparent PNGs (no background)."""
import sys, os, math
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
OUT, SAMPLES, RES = args[0], int(args[1]), int(args[2])
VIEWS = args[3].split(",")
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
sc.cycles.samples = SAMPLES
sc.render.resolution_x = sc.render.resolution_y = RES
cam = sc.camera
fx = bpy.data.collections["FX_Preview"]

SHOTS = {
    # name: (location, target, lens)
    "hero": ((-1.30, -2.05, 0.62), (-0.16, -0.02, 0.40), 40),
    "front": ((-0.12, -2.6, 0.45), (-0.16, 0.0, 0.36), 62),
    "side": ((2.9, 0.0, 0.42), (0.0, 0.0, 0.36), 50),
    "back34": ((-1.75, 2.0, 1.0), (-0.16, 0.08, 0.30), 48),
    "top": ((0.0, 0.0, 3.6), (-0.12, 0.02, 0.0), 50),
    "wire": ((1.75, -2.0, 0.95), (-0.12, 0.0, 0.33), 45),
    "checker": ((-1.75, -2.0, 0.95), (-0.16, 0.0, 0.33), 45),
    "face": ((0.45, -2.1, 0.66), (0.0, -0.5, 0.55), 85),
}


def wire_material():
    m = bpy.data.materials.get("MAT_Preview_ClayWire") or bpy.data.materials.new("MAT_Preview_ClayWire")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    clay = nt.nodes.new("ShaderNodeBsdfPrincipled")
    clay.inputs["Base Color"].default_value = (0.42, 0.38, 0.48, 1)
    clay.inputs["Roughness"].default_value = 0.7
    wire = nt.nodes.new("ShaderNodeWireframe")
    wire.use_pixel_size = True
    wire.inputs["Size"].default_value = 0.9
    line = nt.nodes.new("ShaderNodeEmission")
    line.inputs["Color"].default_value = (0.08, 0.02, 0.12, 1)
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(wire.outputs[0], mix.inputs[0])
    nt.links.new(clay.outputs[0], mix.inputs[1])
    nt.links.new(line.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def checker_material():
    m = bpy.data.materials.get("MAT_Preview_UVChecker") or bpy.data.materials.new("MAT_Preview_UVChecker")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    ck = nt.nodes.new("ShaderNodeTexChecker")
    ck.inputs["Scale"].default_value = 40.0
    ck.inputs["Color1"].default_value = (0.85, 0.85, 0.9, 1)
    ck.inputs["Color2"].default_value = (0.25, 0.1, 0.4, 1)
    uv = nt.nodes.new("ShaderNodeUVMap")
    nt.links.new(uv.outputs["UV"], ck.inputs["Vector"])
    nt.links.new(ck.outputs["Color"], b.inputs["Base Color"])
    return m


for v in VIEWS:
    loc, tgt, lens = SHOTS[v]
    cam.location = loc
    cam.data.lens = lens
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    fx.hide_render = v != "hero"
    for o in bpy.data.objects:  # checker: body only
        if o.name.startswith("Cat_"):
            o.hide_render = v == "checker" and o.name != "Cat_Body"
    sc.view_layers[0].material_override = wire_material() if v == "wire" else checker_material() if v == "checker" else None
    sc.render.filepath = os.path.join(OUT, f"{v}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", v)
