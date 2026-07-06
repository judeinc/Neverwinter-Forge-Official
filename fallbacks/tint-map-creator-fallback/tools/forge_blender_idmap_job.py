from __future__ import annotations

from pathlib import Path
import colorsys
import json
import math
import sys

import bpy
from mathutils import Vector


ID_COLORS = {
    "tunic": (0.50, 0.50, 0.50, 1.0),
    "sleeves": (0.00, 0.00, 1.00, 1.0),
    "gloves": (0.00, 0.63, 1.00, 1.0),
    "belt": (0.50, 0.00, 0.00, 1.0),
    "strap": (1.00, 0.50, 0.00, 1.0),
    "lower": (1.00, 1.00, 1.00, 1.0),
    "boots": (0.00, 0.00, 0.50, 1.0),
    "accent": (0.50, 0.00, 1.00, 1.0),
}

LABEL_ID_COLORS = {
    "tunic_top": (1.00, 0.00, 0.00, 1.0),
    "sleeves": (0.00, 0.00, 1.00, 1.0),
    "pants_or_robe_lower": (0.50, 0.50, 0.50, 1.0),
    "boots": (0.00, 0.00, 0.50, 1.0),
    "gloves_or_bracers": (0.00, 0.63, 1.00, 1.0),
    "belt_or_sash": (0.50, 0.00, 0.00, 1.0),
    "straps": (1.00, 0.50, 0.00, 1.0),
    "armor_or_metal": (1.00, 1.00, 1.00, 1.0),
    "leather_panels": (0.00, 0.50, 0.00, 1.0),
    "trim_or_accent": (0.50, 0.00, 1.00, 1.0),
    "skin_or_body": (1.00, 0.00, 0.50, 1.0),
    "uncertain": (0.00, 0.00, 0.00, 1.0),
    "ignore_tiny_detail": (0.00, 0.00, 0.00, 1.0),
}


def main():
    job_path = parse_job_path()
    job = json.loads(job_path.read_text(encoding="utf-8"))
    output_dir = Path(job["outputDir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    clear_scene()
    model_path = Path(job["modelPath"])
    import_model(model_path)
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not mesh_objects:
        raise RuntimeError("Blender imported no mesh objects.")

    bounds = scene_bounds(mesh_objects)
    ensure_uvs(mesh_objects)
    texture_paths = [Path(path) for path in job.get("texturePaths", [])]
    texture_note = apply_reference_texture(mesh_objects, texture_paths)
    reference_materials = remember_object_materials(mesh_objects)
    chunk_strategy = str(job.get("chunkStrategy", "spatial_grid")).strip().lower()
    if chunk_strategy == "surface_regions":
        chunk_lookup = build_surface_chunks(mesh_objects, bounds, texture_paths)
    else:
        chunk_lookup = build_spatial_chunks(mesh_objects, bounds)
    (output_dir / "chunk_lookup_internal.json").write_text(json.dumps(chunk_lookup, indent=2), encoding="utf-8")

    setup_scene(job.get("textureSize", 1024))
    if job.get("jobKind") == "forge-idmap-apply-labels":
        apply_label_job(job, output_dir, mesh_objects, bounds, chunk_lookup)
        return

    images = []
    for view_name in job.get("views") or ["front", "back", "left", "right", "three_quarter"]:
        texture_path = output_dir / f"texture_reference_{view_name}.png"
        render_view(view_name, bounds, texture_path)
        images.append({"kind": "texture_reference", "name": f"Texture {view_name}", "path": str(texture_path)})

    render_wire_reference_views(mesh_objects, bounds, output_dir, images, job.get("views"))
    render_normal_reference_views(mesh_objects, bounds, output_dir, images, job.get("views"), reference_materials)

    chunk_materials = create_chunk_materials(chunk_lookup)
    assign_chunk_regions(mesh_objects, chunk_lookup, chunk_materials)
    for view_name in job.get("views") or ["front", "back", "left", "right", "three_quarter"]:
        chunk_path = output_dir / f"chunk_id_{view_name}.png"
        render_view(view_name, bounds, chunk_path)
        images.append({"kind": "chunk_id", "name": f"Chunk ID {view_name}", "path": str(chunk_path)})

    materials = create_id_materials()
    assign_geometric_regions(mesh_objects, bounds, materials)

    for view_name in job.get("views") or ["front", "back", "left", "right", "three_quarter"]:
        path = output_dir / f"reference_{view_name}.png"
        render_view(view_name, bounds, path)
        images.append({"kind": "geometric_reference", "name": f"Geometric {view_name}", "path": str(path)})

    baked_path = output_dir / "blender_geometric_seed_id_map.png"
    warnings = []
    try:
        bake_id_map(mesh_objects, materials, int(job.get("textureSize", 1024)), baked_path)
        images.append({"kind": "baked_id_map", "name": "Geometric Seed ID Map", "path": str(baked_path)})
    except Exception as exc:
        warnings.append(f"ID map bake failed: {exc}")

    manifest = {
        "blenderVersion": bpy.app.version_string,
        "modelName": model_path.name,
        "meshCount": len(mesh_objects),
        "faceCount": sum(len(obj.data.polygons) for obj in mesh_objects),
        "uvLayerCount": sum(len(obj.data.uv_layers) for obj in mesh_objects),
        "bounds": {
            "min": list(bounds["min"]),
            "max": list(bounds["max"]),
            "center": list(bounds["center"]),
            "size": list(bounds["size"]),
        },
        "images": images,
        "chunkLookup": public_chunk_lookup(chunk_lookup),
        "warnings": warnings,
        "notes": [
            texture_note,
            "This is a deterministic Blender 3D seed pass, not final AI segmentation.",
            "Texture references show the material wrapped on the mesh when a diffuse/albedo texture can be loaded.",
            "Chunk ID references use exact flat colors that later AI passes can map back to mesh chunks.",
            "Geometric region colors are assigned from broad mesh-space heuristics and baked through the model UVs.",
        ],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def apply_label_job(job, output_dir, mesh_objects, bounds, chunk_lookup):
    labels = load_chunk_labels(job.get("labelPath"))
    materials = create_label_materials()
    assigned = assign_ai_label_regions(mesh_objects, chunk_lookup, labels, materials)
    images = []
    for view_name in job.get("views") or ["front", "back", "left", "right", "three_quarter"]:
        path = output_dir / f"ai_labeled_{view_name}.png"
        render_view(view_name, bounds, path)
        images.append({"kind": "ai_labeled_reference", "name": f"AI Labeled {view_name}", "path": str(path)})

    baked_path = output_dir / "ai_labeled_id_map.png"
    warnings = []
    try:
        bake_id_map(mesh_objects, materials, int(job.get("textureSize", 1024)), baked_path)
        images.append({"kind": "ai_labeled_id_map", "name": "AI Labeled ID Map", "path": str(baked_path)})
    except Exception as exc:
        warnings.append(f"AI label ID map bake failed: {exc}")

    manifest = {
        "blenderVersion": bpy.app.version_string,
        "modelName": Path(job["modelPath"]).name,
        "meshCount": len(mesh_objects),
        "faceCount": sum(len(obj.data.polygons) for obj in mesh_objects),
        "uvLayerCount": sum(len(obj.data.uv_layers) for obj in mesh_objects),
        "images": images,
        "appliedLabelCount": len(labels),
        "assignedChunkCount": assigned["assignedChunkCount"],
        "ignoredChunkCount": assigned["ignoredChunkCount"],
        "labelCounts": assigned["labelCounts"],
        "warnings": warnings + assigned["warnings"],
        "notes": [
            "AI labels were mapped onto Blender spatial chunks and baked through the model UVs.",
            "Black areas are uncertain, ignored tiny details, or unlabeled chunks.",
            "This is a reviewable AI-assisted bake, not a final locked export.",
        ],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def load_chunk_labels(label_path):
    if not label_path:
        return []
    path = Path(label_path)
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("chunkLabels", [])
    if not isinstance(data, list):
        return []
    labels = []
    for item in data:
        if not isinstance(item, dict):
            continue
        chunk_id = str(item.get("chunkId", "")).strip()
        label = normalize_region_label(item.get("label", "uncertain"))
        try:
            confidence = float(item.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0
        if chunk_id:
            labels.append({
                "chunkId": chunk_id,
                "label": label,
                "confidence": confidence,
                "reason": str(item.get("reason", ""))[:240],
            })
    return labels


def normalize_region_label(value):
    label = str(value or "uncertain").strip().lower()
    return label if label in LABEL_ID_COLORS else "uncertain"


def create_label_materials():
    materials = {}
    for label, color in LABEL_ID_COLORS.items():
        materials[label] = create_bakeable_flat_material(f"Forge AI {label}", color)
    return materials


def create_bakeable_flat_material(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 1.0
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.0
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = color
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = 0.8
    material.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = color
    return material


def assign_ai_label_regions(objects, chunk_lookup, labels, materials):
    best_by_chunk = {}
    warnings = []
    for item in labels:
        chunk_id = item["chunkId"]
        label = item["label"]
        confidence = item["confidence"]
        if confidence < 0.45:
            continue
        current = best_by_chunk.get(chunk_id)
        if not current or confidence > current["confidence"]:
            best_by_chunk[chunk_id] = item

    ignored_labels = {"uncertain", "ignore_tiny_detail"}
    material_ids = list(materials.keys())
    material_index_by_label = {label: index for index, label in enumerate(material_ids)}
    label_counts = {}
    assigned_chunks = set()
    ignored_chunks = set()

    for obj in objects:
        obj.data.materials.clear()
        for label in material_ids:
            obj.data.materials.append(materials[label])
        for polygon in obj.data.polygons:
            chunk_id = chunk_lookup["polygonToChunk"].get(f"{obj.name}:{polygon.index}")
            item = best_by_chunk.get(chunk_id)
            label = item["label"] if item else "uncertain"
            if label in ignored_labels:
                ignored_chunks.add(chunk_id)
            else:
                assigned_chunks.add(chunk_id)
                label_counts[label] = label_counts.get(label, 0) + 1
            polygon.material_index = material_index_by_label.get(label, material_index_by_label["uncertain"])

    if not assigned_chunks:
        warnings.append("No confident AI chunk labels were applied.")
    return {
        "assignedChunkCount": len(assigned_chunks),
        "ignoredChunkCount": len(ignored_chunks),
        "labelCounts": label_counts,
        "warnings": warnings,
    }


def parse_job_path():
    if "--" not in sys.argv:
        raise RuntimeError("Expected job path after --")
    args = sys.argv[sys.argv.index("--") + 1:]
    if not args:
        raise RuntimeError("No job path was provided.")
    return Path(args[0])


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_model(path):
    suffix = path.suffix.lower()
    if suffix == ".obj":
        if hasattr(bpy.ops.wm, "obj_import"):
            bpy.ops.wm.obj_import(filepath=str(path))
        else:
            bpy.ops.import_scene.obj(filepath=str(path))
        return
    if suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
        return
    raise RuntimeError(f"Unsupported Blender model format: {path.suffix}")


def scene_bounds(objects):
    points = []
    for obj in objects:
        matrix = obj.matrix_world
        points.extend(matrix @ Vector(corner) for corner in obj.bound_box)
    min_v = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_v = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    size = max_v - min_v
    center = (min_v + max_v) * 0.5
    return {"min": min_v, "max": max_v, "size": size, "center": center}


def ensure_uvs(objects):
    for obj in objects:
        if not obj.data.uv_layers:
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="SELECT")
            bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
            bpy.ops.object.mode_set(mode="OBJECT")
            obj.select_set(False)


def apply_reference_texture(objects, texture_paths):
    diffuse = choose_texture(texture_paths, ["_d", "_diff", "_diffuse", "_albedo", "basecolor", "base_color"])
    if not diffuse:
        return "No diffuse/albedo texture was supplied for the textured reference pass."
    try:
        image = bpy.data.images.load(str(diffuse), check_existing=True)
    except Exception as exc:
        return f"Diffuse/albedo texture could not be loaded by Blender: {diffuse.name} ({exc})"

    for obj in objects:
        material = ensure_reference_material(obj)
        nodes = material.node_tree.nodes
        links = material.node_tree.links
        bsdf = nodes.get("Principled BSDF")
        if not bsdf:
            continue
        image_node = nodes.new("ShaderNodeTexImage")
        image_node.name = "Forge Reference Diffuse"
        image_node.image = image
        links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
    return f"Textured reference pass loaded diffuse/albedo texture: {diffuse.name}"


def choose_texture(texture_paths, preferred_tokens):
    existing = [path for path in texture_paths if path.is_file()]
    if not existing:
        return None
    for path in existing:
        stem = path.stem.lower()
        if any(token in stem for token in preferred_tokens):
            return path
    for path in existing:
        stem = path.stem.lower()
        if "_n" not in stem and "normal" not in stem:
            return path
    return existing[0]


def ensure_reference_material(obj):
    if obj.data.materials:
        material = obj.data.materials[0]
    else:
        material = bpy.data.materials.new(f"{obj.name} Reference")
        obj.data.materials.append(material)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Roughness"].default_value = 0.86
    return material


def remember_object_materials(objects):
    return {obj.name: [material for material in obj.data.materials] for obj in objects}


def restore_object_materials(objects, saved_materials):
    for obj in objects:
        obj.data.materials.clear()
        for material in saved_materials.get(obj.name, []):
            obj.data.materials.append(material)


def create_id_materials():
    materials = {}
    for name, color in ID_COLORS.items():
        material = bpy.data.materials.new(f"Forge ID {name.title()}")
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
            bsdf.inputs["Roughness"].default_value = 0.9
        material.diffuse_color = color
        materials[name] = material
    return materials


def build_spatial_chunks(objects, bounds):
    min_v = bounds["min"]
    size = bounds["size"]
    divisions = (6, 4, 10)
    raw_chunks = {}
    polygon_to_chunk = {}
    for obj in objects:
        for polygon in obj.data.polygons:
            center = obj.matrix_world @ polygon.center
            key = spatial_key(center, min_v, size, divisions)
            chunk_id = f"chunk_{key[0]}_{key[1]}_{key[2]}"
            polygon_to_chunk[(obj.name, polygon.index)] = chunk_id
            chunk = raw_chunks.setdefault(chunk_id, {
                "id": chunk_id,
                "grid": list(key),
                "objectNames": set(),
                "faceCount": 0,
                "min": [float("inf"), float("inf"), float("inf")],
                "max": [float("-inf"), float("-inf"), float("-inf")],
            })
            chunk["objectNames"].add(obj.name)
            chunk["faceCount"] += 1
            for axis, value in enumerate((center.x, center.y, center.z)):
                chunk["min"][axis] = min(chunk["min"][axis], float(value))
                chunk["max"][axis] = max(chunk["max"][axis], float(value))

    chunks = []
    for index, chunk in enumerate(sorted(raw_chunks.values(), key=lambda item: item["id"]), start=1):
        color = encode_chunk_color(index)
        chunk["index"] = index
        chunk["colorHex"] = color_to_hex(color)
        chunk["colorRgb"] = [round(channel * 255) for channel in color[:3]]
        chunk["objectNames"] = sorted(chunk["objectNames"])
        chunks.append(chunk)
    color_by_id = {chunk["id"]: hex_to_rgba(chunk["colorHex"]) for chunk in chunks}
    return {
        "mode": "spatial_grid",
        "division": list(divisions),
        "chunks": chunks,
        "polygonToChunk": {f"{name}:{index}": chunk_id for (name, index), chunk_id in polygon_to_chunk.items()},
        "colorById": {chunk_id: color_to_hex(color) for chunk_id, color in color_by_id.items()},
    }


def build_surface_chunks(objects, bounds, texture_paths):
    face_infos, adjacency = build_face_adjacency(objects, texture_paths)
    if not face_infos:
        return build_spatial_chunks(objects, bounds)

    visited = set()
    components = []
    for face_key in sorted(face_infos):
        if face_key in visited:
            continue
        stack = [face_key]
        visited.add(face_key)
        component = []
        while stack:
            current = stack.pop()
            component.append(current)
            for neighbor in adjacency.get(current, []):
                if neighbor in visited:
                    continue
                visited.add(neighbor)
                stack.append(neighbor)
        components.append(component)

    if len(components) <= 1:
        return build_spatial_chunks(objects, bounds)

    chunks = []
    polygon_to_chunk = {}
    sorted_components = sorted(
        components,
        key=lambda component: (
            min(face_infos[key]["center"].z for key in component),
            min(face_infos[key]["center"].x for key in component),
            min(face_infos[key]["center"].y for key in component),
        ),
    )
    for index, component in enumerate(sorted_components, start=1):
        chunk_id = f"surface_{index:04d}"
        color = encode_chunk_color(index)
        min_v = [float("inf"), float("inf"), float("inf")]
        max_v = [float("-inf"), float("-inf"), float("-inf")]
        object_names = set()
        color_sum = [0.0, 0.0, 0.0]
        color_count = 0
        for face_key in component:
            info = face_infos[face_key]
            polygon_to_chunk[face_key] = chunk_id
            object_names.add(face_key[0])
            center = info["center"]
            for axis, value in enumerate((center.x, center.y, center.z)):
                min_v[axis] = min(min_v[axis], float(value))
                max_v[axis] = max(max_v[axis], float(value))
            if info.get("textureColor"):
                for channel in range(3):
                    color_sum[channel] += info["textureColor"][channel]
                color_count += 1
        avg_color = [round((value / max(color_count, 1)) * 255) for value in color_sum] if color_count else []
        chunks.append({
            "id": chunk_id,
            "mode": "surface_region",
            "objectNames": sorted(object_names),
            "faceCount": len(component),
            "min": min_v,
            "max": max_v,
            "index": index,
            "colorHex": color_to_hex(color),
            "colorRgb": [round(channel * 255) for channel in color[:3]],
            "averageTextureRgb": avg_color,
        })

    color_by_id = {chunk["id"]: hex_to_rgba(chunk["colorHex"]) for chunk in chunks}
    return {
        "mode": "surface_regions",
        "division": [],
        "chunks": chunks,
        "polygonToChunk": {f"{name}:{index}": chunk_id for (name, index), chunk_id in polygon_to_chunk.items()},
        "colorById": {chunk_id: color_to_hex(color) for chunk_id, color in color_by_id.items()},
    }


def build_face_adjacency(objects, texture_paths):
    sampler = load_texture_sampler(texture_paths)
    face_infos = {}
    adjacency = {}
    edge_faces = {}
    for obj in objects:
        mesh = obj.data
        uv_layer = mesh.uv_layers.active.data if mesh.uv_layers.active else None
        normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
        for polygon in mesh.polygons:
            face_key = (obj.name, polygon.index)
            uvs_by_vertex = {}
            uv_center = None
            if uv_layer:
                u_sum = 0.0
                v_sum = 0.0
                for loop_index in polygon.loop_indices:
                    loop = mesh.loops[loop_index]
                    uv = uv_layer[loop_index].uv.copy()
                    uvs_by_vertex[loop.vertex_index] = uv
                    u_sum += uv.x
                    v_sum += uv.y
                count = max(len(polygon.loop_indices), 1)
                uv_center = (u_sum / count, v_sum / count)
            center = obj.matrix_world @ polygon.center
            normal = (normal_matrix @ polygon.normal).normalized()
            texture_color = sampler(uv_center) if sampler and uv_center else None
            face_infos[face_key] = {
                "center": center,
                "normal": normal,
                "materialIndex": polygon.material_index,
                "uvsByVertex": uvs_by_vertex,
                "textureColor": texture_color,
            }
            vertices = list(polygon.vertices)
            for index, vertex in enumerate(vertices):
                edge = tuple(sorted((vertex, vertices[(index + 1) % len(vertices)])))
                edge_faces.setdefault((obj.name, edge), []).append(face_key)

    for faces in edge_faces.values():
        if len(faces) != 2:
            continue
        left, right = faces
        if should_connect_faces(face_infos[left], face_infos[right]):
            adjacency.setdefault(left, []).append(right)
            adjacency.setdefault(right, []).append(left)
    return face_infos, adjacency


def load_texture_sampler(texture_paths):
    diffuse = choose_texture(texture_paths, ["_d", "_diff", "_diffuse", "_albedo", "basecolor", "base_color"])
    if not diffuse:
        return None
    try:
        image = bpy.data.images.load(str(diffuse), check_existing=True)
    except Exception:
        return None
    width, height = image.size
    if width <= 0 or height <= 0:
        return None
    pixels = image.pixels

    def sample(uv):
        u = uv[0] % 1.0
        v = uv[1] % 1.0
        x = max(0, min(width - 1, int(u * (width - 1))))
        y = max(0, min(height - 1, int(v * (height - 1))))
        offset = (y * width + x) * 4
        return (float(pixels[offset]), float(pixels[offset + 1]), float(pixels[offset + 2]))

    return sample


def should_connect_faces(left, right):
    if left["materialIndex"] != right["materialIndex"]:
        return False
    normal_dot = max(-1.0, min(1.0, left["normal"].dot(right["normal"])))
    normal_angle = math.degrees(math.acos(normal_dot))
    if normal_angle > 42:
        return False
    if uv_seam_delta(left, right) > 0.08 and normal_angle > 12:
        return False
    left_color = left.get("textureColor")
    right_color = right.get("textureColor")
    if left_color and right_color:
        delta = math.sqrt(sum((left_color[index] - right_color[index]) ** 2 for index in range(3)))
        if delta > 0.44:
            return False
    return True


def uv_seam_delta(left, right):
    shared_vertices = set(left["uvsByVertex"]).intersection(right["uvsByVertex"])
    if not shared_vertices:
        return 0.0
    delta = 0.0
    for vertex in shared_vertices:
        left_uv = left["uvsByVertex"][vertex]
        right_uv = right["uvsByVertex"][vertex]
        delta += math.hypot(left_uv.x - right_uv.x, left_uv.y - right_uv.y)
    return delta / max(len(shared_vertices), 1)


def public_chunk_lookup(chunk_lookup):
    return {
        "mode": chunk_lookup.get("mode", "spatial_grid"),
        "division": chunk_lookup.get("division", []),
        "chunks": chunk_lookup.get("chunks", []),
        "colorById": chunk_lookup.get("colorById", {}),
    }


def spatial_key(center, min_v, size, divisions):
    values = []
    for value, minimum, span, division in zip((center.x, center.y, center.z), min_v, size, divisions):
        normalized = (value - minimum) / max(float(span), 0.0001)
        values.append(max(0, min(division - 1, int(normalized * division))))
    return tuple(values)


def encode_chunk_color(index):
    hue = ((index * 0.61803398875) % 1.0)
    saturation = 0.72
    value = 0.98 if index % 2 else 0.78
    r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
    return (r, g, b, 1.0)


def color_to_hex(color):
    return "#" + "".join(f"{max(0, min(255, round(channel * 255))):02x}" for channel in color[:3])


def hex_to_rgba(hex_color):
    clean = hex_color.lstrip("#")
    return (int(clean[0:2], 16) / 255, int(clean[2:4], 16) / 255, int(clean[4:6], 16) / 255, 1.0)


def create_chunk_materials(chunk_lookup):
    materials = {}
    for chunk in chunk_lookup["chunks"]:
        material = bpy.data.materials.new(f"Forge Chunk {chunk['index']:04d}")
        material.use_nodes = True
        nodes = material.node_tree.nodes
        nodes.clear()
        output = nodes.new("ShaderNodeOutputMaterial")
        emission = nodes.new("ShaderNodeEmission")
        emission.inputs["Color"].default_value = hex_to_rgba(chunk["colorHex"])
        emission.inputs["Strength"].default_value = 1.0
        material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
        material.diffuse_color = hex_to_rgba(chunk["colorHex"])
        materials[chunk["id"]] = material
    return materials


def render_wire_reference_views(objects, bounds, output_dir, images, views):
    wire_material = create_emission_material("Forge Mesh Wire Overlay", (0.0, 0.9, 1.0, 1.0))
    overlays = []
    thickness = max(bounds["size"].x, bounds["size"].y, bounds["size"].z, 0.1) * 0.0012
    for obj in objects:
        overlay = obj.copy()
        overlay.data = obj.data.copy()
        overlay.name = f"{obj.name}_ForgeWireOverlay"
        bpy.context.collection.objects.link(overlay)
        overlay.data.materials.clear()
        overlay.data.materials.append(wire_material)
        modifier = overlay.modifiers.new("Forge Wire Overlay", "WIREFRAME")
        modifier.thickness = thickness
        modifier.use_even_offset = True
        modifier.use_boundary = True
        modifier.use_replace = True
        overlays.append(overlay)

    try:
        for view_name in views or ["front", "back", "left", "right", "three_quarter"]:
            path = output_dir / f"mesh_wire_reference_{view_name}.png"
            render_view(view_name, bounds, path)
            images.append({"kind": "mesh_wire_reference", "name": f"Mesh Wire {view_name}", "path": str(path)})
    finally:
        for overlay in overlays:
            bpy.data.objects.remove(overlay, do_unlink=True)


def render_normal_reference_views(objects, bounds, output_dir, images, views, saved_materials):
    normal_material = create_normal_material()
    for obj in objects:
        obj.data.materials.clear()
        obj.data.materials.append(normal_material)
        for polygon in obj.data.polygons:
            polygon.material_index = 0

    try:
        for view_name in views or ["front", "back", "left", "right", "three_quarter"]:
            path = output_dir / f"normal_reference_{view_name}.png"
            render_view(view_name, bounds, path)
            images.append({"kind": "normal_reference", "name": f"Normals {view_name}", "path": str(path)})
    finally:
        restore_object_materials(objects, saved_materials)


def create_emission_material(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = 1.0
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    material.diffuse_color = color
    return material


def create_normal_material():
    material = bpy.data.materials.new("Forge Surface Normal Reference")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    geometry = nodes.new("ShaderNodeNewGeometry")
    multiply = nodes.new("ShaderNodeVectorMath")
    multiply.operation = "MULTIPLY"
    multiply.inputs[1].default_value = (0.5, 0.5, 0.5)
    add = nodes.new("ShaderNodeVectorMath")
    add.operation = "ADD"
    add.inputs[1].default_value = (0.5, 0.5, 0.5)
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1.0
    links = material.node_tree.links
    links.new(geometry.outputs["Normal"], multiply.inputs[0])
    links.new(multiply.outputs["Vector"], add.inputs[0])
    links.new(add.outputs["Vector"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    material.diffuse_color = (0.5, 0.5, 1.0, 1.0)
    return material


def assign_chunk_regions(objects, chunk_lookup, materials):
    for obj in objects:
        obj.data.materials.clear()
        material_ids = sorted(materials)
        for chunk_id in material_ids:
            obj.data.materials.append(materials[chunk_id])
        material_index_by_id = {chunk_id: index for index, chunk_id in enumerate(material_ids)}
        for polygon in obj.data.polygons:
            chunk_id = chunk_lookup["polygonToChunk"].get(f"{obj.name}:{polygon.index}")
            polygon.material_index = material_index_by_id.get(chunk_id, 0)


def assign_geometric_regions(objects, bounds, materials):
    min_z = bounds["min"].z
    size_z = max(bounds["size"].z, 0.0001)
    center_x = bounds["center"].x
    half_x = max(bounds["size"].x * 0.5, 0.0001)
    for obj in objects:
        obj.data.materials.clear()
        for material in materials.values():
            obj.data.materials.append(material)
        material_names = list(materials.keys())
        for polygon in obj.data.polygons:
            world_center = obj.matrix_world @ polygon.center
            z_norm = (world_center.z - min_z) / size_z
            x_norm = abs((world_center.x - center_x) / half_x)
            region = region_for_point(z_norm, x_norm)
            polygon.material_index = material_names.index(region)


def region_for_point(z_norm, x_norm):
    if z_norm < 0.17:
        return "boots"
    if z_norm < 0.38:
        return "lower"
    if 0.43 <= z_norm <= 0.53:
        if x_norm < 0.52:
            return "belt"
        return "strap"
    if x_norm > 0.56 and 0.33 <= z_norm <= 0.83:
        return "gloves" if z_norm < 0.48 else "sleeves"
    if z_norm > 0.82:
        return "accent"
    return "tunic"


def setup_scene(size):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.world = bpy.data.worlds.new("Forge World") if not scene.world else scene.world
    scene.world.color = (0.22, 0.22, 0.22)
    light_data = bpy.data.lights.new("Forge Key Light", "AREA")
    light_data.energy = 450
    light_data.size = 5
    light = bpy.data.objects.new("Forge Key Light", light_data)
    bpy.context.collection.objects.link(light)
    light.location = (0, -4, 5)


def render_view(view_name, bounds, output_path):
    camera = bpy.data.objects.new("Forge Camera", bpy.data.cameras.new(f"Forge Camera {view_name}"))
    bpy.context.collection.objects.link(camera)
    center = bounds["center"]
    radius = max(bounds["size"].x, bounds["size"].y, bounds["size"].z, 0.1)
    directions = {
        "front": Vector((0, -1, 0.22)),
        "back": Vector((0, 1, 0.22)),
        "left": Vector((-1, 0, 0.22)),
        "right": Vector((1, 0, 0.22)),
        "three_quarter": Vector((0.72, -0.72, 0.28)),
    }
    direction = directions.get(view_name, directions["front"]).normalized()
    camera.location = center + direction * (radius * 2.7)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = radius * 1.18
    look_at(camera, center)
    bpy.context.scene.camera = camera
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera, do_unlink=True)


def look_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def bake_id_map(objects, materials, size, output_path):
    image = bpy.data.images.new("Forge Baked ID Map", width=size, height=size, alpha=True)
    for obj in objects:
        obj.select_set(False)
    for obj in objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        for material in obj.data.materials:
            if not material.use_nodes:
                continue
            nodes = material.node_tree.nodes
            image_node = nodes.new("ShaderNodeTexImage")
            image_node.name = "Forge Bake Target"
            image_node.image = image
            nodes.active = image_node
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=2)
    image.filepath_raw = str(output_path)
    image.file_format = "PNG"
    image.save()


if __name__ == "__main__":
    main()
