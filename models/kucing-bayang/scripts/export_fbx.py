"""Export the cat model (CAT_Model only, no FX / camera / lights) to FBX for Roblox.

blender -b kucing_bayang.blend -P scripts/export_fbx.py -- export/kucing_bayang_roblox.fbx

The .blend is opened read-only: nothing is saved back.  Multi-material meshes are
split per material on the fly (Roblox MeshParts take one material each), so
Cat_Ears becomes Cat_Ears + Cat_EarsInner in the FBX.
"""
import os, sys
import bpy, bmesh

out = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
os.makedirs(os.path.dirname(out), exist_ok=True)

model = [o for o in bpy.data.collections["CAT_Model"].all_objects if o.type == "MESH"]
split_names = {"MAT_Cat_EarInner": "Cat_EarsInner"}

export = []
for o in model:
    if len(o.data.materials) <= 1:
        export.append(o)
        continue
    base = o.name
    o.name = base + "_multi"  # original stays out of the export and frees its name
    for mi, mat in enumerate(o.data.materials):
        part = o.copy()
        part.data = o.data.copy()
        bpy.context.scene.collection.objects.link(part)
        bm = bmesh.new()
        bm.from_mesh(part.data)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != mi], context="FACES")
        bm.to_mesh(part.data)
        bm.free()
        part.data.materials.clear()
        part.data.materials.append(mat)
        part.name = split_names.get(mat.name, base)
        export.append(part)
for o in export:
    o.data.name = o.name

bpy.ops.object.select_all(action="DESELECT")
for o in export:
    o.select_set(True)
bpy.context.view_layer.objects.active = export[0]

bpy.ops.export_scene.fbx(
    filepath=out,
    use_selection=True,
    object_types={"MESH"},
    apply_unit_scale=True,
    apply_scale_options="FBX_SCALE_UNITS",   # Roblox: Apply Scalings = FBX Units Scale
    axis_forward="-Z",
    axis_up="Y",
    bake_space_transform=True,               # bake the axis change into the meshes
    use_mesh_modifiers=True,
    mesh_smooth_type="FACE",
    add_leaf_bones=False,
    bake_anim=False,
    path_mode="COPY",
    embed_textures=True,
    use_custom_props=False,
)
print("EXPORTED", out, sorted(o.name for o in export))
