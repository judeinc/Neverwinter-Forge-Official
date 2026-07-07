from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    args = sys.argv
    if "--" in args:
        args = args[args.index("--") + 1 :]
    else:
        args = []
    parser = argparse.ArgumentParser(description="Render front/back outfit model previews in Blender.")
    parser.add_argument("--model", required=True)
    parser.add_argument("--texture", default="")
    parser.add_argument("--front", required=True)
    parser.add_argument("--back", required=True)
    parser.add_argument("--size", type=int, default=512)
    return parser.parse_args(args)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_model(model_path: Path) -> None:
    suffix = model_path.suffix.lower()
    if suffix == ".obj":
        bpy.ops.import_scene.obj(filepath=str(model_path))
        return
    if suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(model_path))
        return
    raise RuntimeError(f"Unsupported preview model type: {model_path.suffix}")


def mesh_objects() -> list[bpy.types.Object]:
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def apply_texture(texture_path: Path) -> None:
    if not texture_path or not texture_path.exists():
        return
    try:
        image = bpy.data.images.load(str(texture_path), check_existing=True)
    except RuntimeError:
        return

    material = bpy.data.materials.new("Preview BaseColor")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    principled = nodes.get("Principled BSDF")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    if principled:
        material.node_tree.links.new(texture.outputs["Color"], principled.inputs["Base Color"])
        principled.inputs["Roughness"].default_value = 0.74

    for obj in mesh_objects():
        obj.data.materials.clear()
        obj.data.materials.append(material)


def bounds_for_objects(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = []
    for obj in objects:
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))
    if not points:
        raise RuntimeError("No mesh bounds could be calculated.")
    min_point = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    max_point = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return min_point, max_point


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_scene(size: int) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 3
    scene.eevee.gtao_factor = 1.4
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("Preview World") if not scene.world else scene.world
    scene.world.color = (0.055, 0.06, 0.07)

    camera = bpy.data.cameras.new("Preview Camera")
    camera.type = "ORTHO"
    camera_obj = bpy.data.objects.new("Preview Camera", camera)
    scene.collection.objects.link(camera_obj)
    scene.camera = camera_obj

    light_data = bpy.data.lights.new("Preview Key", "AREA")
    light_data.energy = 420
    light_data.size = 5
    light = bpy.data.objects.new("Preview Key", light_data)
    scene.collection.objects.link(light)
    light.location = (3, -4, 5)

    fill_data = bpy.data.lights.new("Preview Fill", "AREA")
    fill_data.energy = 120
    fill_data.size = 8
    fill = bpy.data.objects.new("Preview Fill", fill_data)
    scene.collection.objects.link(fill)
    fill.location = (-4, 3, 4)


def render_view(path: Path, front: bool) -> None:
    objects = mesh_objects()
    min_point, max_point = bounds_for_objects(objects)
    center = (min_point + max_point) / 2
    size = max(max_point.x - min_point.x, max_point.y - min_point.y, max_point.z - min_point.z, 0.01)
    camera = bpy.context.scene.camera
    camera.data.ortho_scale = size * 1.18
    distance = size * 2.8
    y = -distance if front else distance
    camera.location = (center.x, center.y + y, center.z + size * 0.04)
    look_at(camera, center)
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main() -> int:
    args = parse_args()
    model_path = Path(args.model)
    texture_path = Path(args.texture) if args.texture else Path()
    clear_scene()
    import_model(model_path)
    if not mesh_objects():
        raise RuntimeError(f"No mesh objects were imported from {model_path}")
    apply_texture(texture_path)
    setup_scene(args.size)
    render_view(Path(args.front), front=True)
    render_view(Path(args.back), front=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
