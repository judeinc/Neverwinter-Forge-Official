from __future__ import annotations

from collections import defaultdict, deque
from io import BytesIO
from pathlib import Path
import base64
import math
import re
import struct
import zipfile

from PIL import Image

from mdb_tools import (
    VISIBLE_PACKET_TYPES,
    classify_asset,
    decode_ascii,
    parse_packet,
    parse_preview_mesh,
)


UV_KEY_SCALE = 100000
MODEL_SUFFIXES = {".mdb", ".obj", ".fbx"}
TEXTURE_SUFFIXES = {".dds", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tga"}
MAX_CLIENT_TRIANGLES = 120000


def extract_uploaded_mdb_uv_layout(uploaded_file):
    name = uploaded_file.get("name") or "uploaded.mdb"
    data = uploaded_file.get("data", b"")
    return extract_mdb_uv_layout(data, name)


def extract_uploaded_model_uv_layout(uploaded_file):
    name = uploaded_file.get("name") or "uploaded.model"
    data = uploaded_file.get("data", b"")
    suffix = Path(name).suffix.lower()
    if suffix == ".mdb":
        return extract_mdb_uv_layout(data, name)
    if suffix == ".obj":
        return extract_obj_uv_layout(data, name)
    if suffix == ".fbx":
        return extract_fbx_uv_layout(data, name)
    raise ValueError("Drop or choose an MDB, OBJ, FBX, or ZIP package.")


def encode_uploaded_texture_underlay(uploaded_file, underlay_size=1024):
    return encode_texture_underlay(uploaded_file, underlay_size)


def extract_id_map_upload_package(uploaded_files, underlay_size=1024):
    files = flatten_uploaded_files(uploaded_files)
    model_file = next(
        (item for item in files if Path(item.get("name", "")).suffix.lower() in MODEL_SUFFIXES),
        None,
    )
    if not model_file:
        raise ValueError("Drop or choose an MDB, OBJ, FBX, or ZIP containing one model.")

    layout = reduce_layout_for_client(extract_uploaded_model_uv_layout(model_file))
    texture_files = [
        item for item in files
        if Path(item.get("name", "")).suffix.lower() in TEXTURE_SUFFIXES
    ]
    underlays = texture_underlays_for_layout(layout, texture_files, underlay_size=underlay_size)
    return {"layout": layout, "underlays": underlays}


def flatten_uploaded_files(uploaded_files):
    flattened = []
    for item in uploaded_files:
        name = item.get("name") or ""
        data = item.get("data", b"")
        if Path(name).suffix.lower() == ".zip":
            flattened.extend(files_from_zip(data, name))
        else:
            flattened.append({"name": Path(name).name, "data": data, "source": name})
    return flattened


def files_from_zip(data, source_name):
    extracted = []
    try:
        with zipfile.ZipFile(BytesIO(data)) as archive:
            for entry in archive.infolist():
                if entry.is_dir():
                    continue
                suffix = Path(entry.filename).suffix.lower()
                if suffix not in MODEL_SUFFIXES | TEXTURE_SUFFIXES:
                    continue
                extracted.append({
                    "name": Path(entry.filename).name,
                    "data": archive.read(entry),
                    "source": f"{source_name}:{entry.filename}",
                })
    except zipfile.BadZipFile as exc:
        raise ValueError(f"Could not read ZIP package: {exc}") from exc
    return extracted


def texture_underlays_for_layout(layout, texture_files, underlay_size=1024):
    by_stem = {Path(item.get("name", "")).stem.lower(): item for item in texture_files}
    diffuse_refs = ordered_texture_refs(layout, ["baseTexture"])
    normal_refs = ordered_texture_refs(layout, ["normalMap"])
    diffuse = texture_file_for_refs(by_stem, diffuse_refs, ["_d", "_diff", "_diffuse", "_albedo"])
    normal = texture_file_for_refs(by_stem, normal_refs, ["_n", "_normal", "_norm"])
    return {
        "diffuse": encode_texture_underlay(diffuse, underlay_size) if diffuse else None,
        "normal": encode_texture_underlay(normal, underlay_size) if normal else None,
    }


def ordered_texture_refs(layout, keys):
    refs = []
    for mesh in layout.get("meshes", []):
        for key in keys:
            value = mesh.get(key)
            if value and value not in refs:
                refs.append(value)
    return refs


def texture_file_for_refs(by_stem, refs, suffixes):
    for ref in refs:
        key = Path(ref).stem.lower()
        if key in by_stem:
            return by_stem[key]
    for stem, item in by_stem.items():
        if any(stem.endswith(suffix) for suffix in suffixes):
            return item
    return None


def reduce_layout_for_client(layout, max_triangles=MAX_CLIENT_TRIANGLES):
    triangles = layout.get("triangles") or []
    if len(triangles) <= max_triangles:
        layout["clientTriangleCount"] = len(triangles)
        return layout

    islands = layout.get("islands") or []
    if not islands:
        layout["triangles"] = triangles[:max_triangles]
        layout["clientTriangleCount"] = len(layout["triangles"])
        return layout

    counts = allocate_proxy_triangle_counts(islands, len(triangles), max_triangles)
    kept_ids = set()
    for island in islands:
        ids = island.get("triangleIds") or []
        sample_count = min(len(ids), counts.get(island["id"], 0))
        sampled_ids = sample_evenly(ids, sample_count)
        island["sourceTriangleCount"] = island.get("triangleCount", len(ids))
        island["proxyTriangleCount"] = len(sampled_ids)
        island["triangleIds"] = sampled_ids
        kept_ids.update(sampled_ids)

    layout["sourceTriangleCount"] = len(triangles)
    layout["triangles"] = [triangle for triangle in triangles if triangle["id"] in kept_ids]
    layout["clientTriangleCount"] = len(layout["triangles"])
    layout.setdefault("warnings", []).append(
        f"High-detail UV layout was reduced to {layout['clientTriangleCount']} browser proxy triangles "
        f"from {layout['sourceTriangleCount']} source triangles. Use an MDB or low-poly OBJ for exact final export."
    )
    return layout


def allocate_proxy_triangle_counts(islands, total_triangles, max_triangles):
    non_empty = [island for island in islands if island.get("triangleIds")]
    if len(non_empty) >= max_triangles:
        largest = sorted(non_empty, key=lambda item: item.get("triangleCount", 0), reverse=True)[:max_triangles]
        return {island["id"]: 1 for island in largest}

    remaining = max_triangles - len(non_empty)
    allocations = {island["id"]: 1 for island in non_empty}
    weights = []
    for island in non_empty:
        count = max(0, int(island.get("triangleCount", len(island.get("triangleIds", [])))) - 1)
        if count:
            share = (count / max(1, total_triangles)) * remaining
            weights.append((island, share))
            allocations[island["id"]] += int(share)

    used = sum(allocations.values())
    for island, share in sorted(weights, key=lambda item: item[1] - int(item[1]), reverse=True):
        if used >= max_triangles:
            break
        if allocations[island["id"]] < len(island.get("triangleIds", [])):
            allocations[island["id"]] += 1
            used += 1

    while sum(allocations.values()) > max_triangles:
        largest_id = max(allocations, key=lambda key: allocations[key])
        if allocations[largest_id] <= 1:
            break
        allocations[largest_id] -= 1

    return allocations


def sample_evenly(values, count):
    if count <= 0:
        return []
    if count >= len(values):
        return list(values)
    if count == 1:
        return [values[len(values) // 2]]
    step = (len(values) - 1) / (count - 1)
    return [values[round(index * step)] for index in range(count)]


def encode_texture_underlay(texture_file, underlay_size):
    try:
        image = Image.open(BytesIO(texture_file.get("data", b""))).convert("RGBA")
    except Exception:
        return None
    image.thumbnail((underlay_size, underlay_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (underlay_size, underlay_size), (0, 0, 0, 0))
    x = (underlay_size - image.width) // 2
    y = (underlay_size - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    buffer = BytesIO()
    canvas.save(buffer, format="PNG")
    return {
        "name": texture_file.get("name", "texture"),
        "mimeType": "image/png",
        "imageData": base64.b64encode(buffer.getvalue()).decode("ascii"),
        "size": [underlay_size, underlay_size],
    }


def extract_mdb_uv_layout(data, display_name="uploaded.mdb"):
    path = Path(display_name)
    warnings = []
    meshes = []
    all_triangles = []
    packet_count = 0
    version = ""

    if len(data) < 12 or data[:4] != b"NWN2":
        raise ValueError("This is not a valid NWN2 MDB file.")

    major, minor, packet_count = struct.unpack_from("<HHI", data, 4)
    version = f"{major}.{minor}"
    lookup_start = 12

    for packet_index in range(packet_count):
        entry = lookup_start + packet_index * 8
        if entry + 8 > len(data):
            warnings.append("Packet table ends unexpectedly.")
            break

        signature = decode_ascii(data[entry:entry + 4])
        offset = struct.unpack_from("<I", data, entry + 4)[0]
        if offset + 8 > len(data):
            warnings.append(f"Packet {packet_index} offset points outside the file.")
            continue

        actual_signature = decode_ascii(data[offset:offset + 4])
        if actual_signature:
            signature = actual_signature
        packet_size = struct.unpack_from("<I", data, offset + 4)[0]
        payload_start = offset + 8
        payload_end = min(payload_start + packet_size, len(data))
        payload = data[payload_start:payload_end]

        packet = parse_packet(data, packet_index, signature, offset)
        if packet.signature not in VISIBLE_PACKET_TYPES:
            continue

        try:
            preview = parse_preview_mesh(packet, payload)
        except Exception as exc:
            warnings.append(f"{packet.name or packet.signature} UVs could not be read: {exc}")
            continue
        if not preview:
            continue

        mesh_index = len(meshes)
        mesh_triangles = triangles_from_preview(preview, mesh_index)
        if not mesh_triangles:
            warnings.append(f"{packet.name or packet.signature} has no UV triangles.")
            continue

        all_triangles.extend(mesh_triangles)
        material = preview.get("material") or {}
        meshes.append({
            "index": mesh_index,
            "packetIndex": packet.index,
            "name": packet.name or f"{packet.signature}_{packet.index}",
            "type": packet.signature,
            "vertexCount": preview.get("vertexCount", 0),
            "faceCount": preview.get("faceCount", 0),
            "baseTexture": material.get("baseTexture", ""),
            "normalMap": material.get("normalMap", ""),
            "tintMask": material.get("tintMask", ""),
            "glowMap": material.get("glowMap", ""),
            "material": material,
        })

    if not all_triangles:
        raise ValueError("No previewable RIGD or SKIN UV triangles were found in this MDB.")

    uv_transform = normalize_uv_space(all_triangles)
    islands = build_uv_islands(all_triangles)
    uv_bounds = bounds_for_triangles(all_triangles)
    out_of_range = sum(
        1
        for triangle in all_triangles
        for u, v in triangle["uvs"]
        if u < 0 or u > 1 or v < 0 or v > 1
    )
    if out_of_range:
        warnings.append(f"{out_of_range} UV coordinate(s) are outside the 0-1 texture tile.")

    return {
        "fileName": path.name,
        "assetType": classify_asset(path.name),
        "sourceFormat": "MDB",
        "version": version,
        "packetCount": packet_count,
        "meshCount": len(meshes),
        "triangleCount": len(all_triangles),
        "islandCount": len(islands),
        "uvBounds": uv_bounds,
        "uvTransform": uv_transform,
        "meshes": meshes,
        "triangles": all_triangles,
        "islands": islands,
        "warnings": warnings,
    }


def extract_obj_uv_layout(data, display_name="uploaded.obj"):
    path = Path(display_name)
    warnings = []
    uv_coords = []
    all_triangles = []
    mesh_lookup = {}
    mesh_triangle_counts = defaultdict(int)
    current_mesh = "Object"
    current_material = ""

    text = decode_model_text(data, display_name)
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if not parts:
            continue
        tag = parts[0].lower()
        if tag == "vt":
            if len(parts) < 3:
                warnings.append(f"OBJ texture coordinate on line {line_number} is incomplete.")
                continue
            try:
                uv_coords.append([float(parts[1]), float(parts[2])])
            except ValueError:
                warnings.append(f"OBJ texture coordinate on line {line_number} could not be read.")
        elif tag in {"o", "g"}:
            current_mesh = " ".join(parts[1:]).strip() or "Object"
        elif tag == "usemtl":
            current_material = " ".join(parts[1:]).strip()
        elif tag == "f":
            polygon_uvs = []
            for token in parts[1:]:
                uv_index = obj_face_uv_index(token, len(uv_coords))
                if uv_index is None or uv_index < 0 or uv_index >= len(uv_coords):
                    continue
                polygon_uvs.append(uv_coords[uv_index])
            if len(polygon_uvs) < 3:
                warnings.append(f"OBJ face on line {line_number} has no usable UV coordinates.")
                continue
            mesh_index = mesh_index_for_obj(mesh_lookup, current_mesh, current_material)
            for fan_index in range(1, len(polygon_uvs) - 1):
                triangle_uvs = [
                    list(polygon_uvs[0]),
                    list(polygon_uvs[fan_index]),
                    list(polygon_uvs[fan_index + 1]),
                ]
                if triangle_area(triangle_uvs) <= 0.00000001:
                    continue
                triangle_index = mesh_triangle_counts[mesh_index]
                mesh_triangle_counts[mesh_index] += 1
                all_triangles.append({
                    "id": f"m{mesh_index}t{triangle_index}",
                    "meshIndex": mesh_index,
                    "meshName": current_mesh,
                    "materialName": current_material,
                    "uvs": triangle_uvs,
                })

    if not all_triangles:
        raise ValueError("No OBJ UV faces were found. Export the OBJ with texture coordinates enabled.")

    meshes = meshes_from_lookup(mesh_lookup, "OBJ", mesh_triangle_counts)
    return finalize_uv_layout(
        path.name,
        "OBJ Model",
        "OBJ",
        meshes,
        all_triangles,
        warnings,
        version="",
        packet_count=0,
    )


def extract_fbx_uv_layout(data, display_name="uploaded.fbx"):
    path = Path(display_name)
    if data.startswith(b"Kaydara FBX Binary"):
        raise ValueError(
            "Binary FBX files are accepted by the dropzone, but Forge cannot read their UVs yet. "
            "Export OBJ for this pass, or export FBX as ASCII if your tool supports it."
        )

    text = decode_model_text(data, display_name)
    uv_values = parse_fbx_float_array(text, "UV")
    uv_indices = parse_fbx_int_array(text, "UVIndex")
    polygon_vertex_indices = parse_fbx_int_array(text, "PolygonVertexIndex")
    if not uv_values or len(uv_values) < 6:
        raise ValueError("No FBX UV coordinate array was found. Binary FBX may need conversion to OBJ first.")
    if not polygon_vertex_indices:
        raise ValueError("No FBX polygon index array was found.")

    uv_coords = [[uv_values[index], uv_values[index + 1]] for index in range(0, len(uv_values) - 1, 2)]
    all_triangles = []
    polygon = []
    uv_cursor = 0
    for raw_index in polygon_vertex_indices:
        uv_index = uv_indices[uv_cursor] if uv_cursor < len(uv_indices) else abs(raw_index)
        uv_cursor += 1
        if 0 <= uv_index < len(uv_coords):
            polygon.append(uv_coords[uv_index])
        if raw_index < 0:
            if len(polygon) >= 3:
                for fan_index in range(1, len(polygon) - 1):
                    triangle_uvs = [
                        list(polygon[0]),
                        list(polygon[fan_index]),
                        list(polygon[fan_index + 1]),
                    ]
                    if triangle_area(triangle_uvs) <= 0.00000001:
                        continue
                    all_triangles.append({
                        "id": f"m0t{len(all_triangles)}",
                        "meshIndex": 0,
                        "meshName": path.stem,
                        "materialName": "",
                        "uvs": triangle_uvs,
                    })
            polygon = []

    if not all_triangles:
        raise ValueError("No FBX UV triangles could be built from the ASCII FBX data.")

    meshes = [{
        "index": 0,
        "packetIndex": 0,
        "name": path.stem,
        "type": "FBX",
        "vertexCount": 0,
        "faceCount": len(all_triangles),
        "baseTexture": "",
        "normalMap": "",
        "tintMask": "",
        "glowMap": "",
        "material": {},
    }]
    return finalize_uv_layout(
        path.name,
        "FBX Model",
        "FBX",
        meshes,
        all_triangles,
        ["ASCII FBX UV extraction is best-effort. OBJ remains the preferred interchange format for this tool."],
        version="ASCII",
        packet_count=0,
    )


def finalize_uv_layout(file_name, asset_type, source_format, meshes, all_triangles, warnings, version="", packet_count=0):
    uv_transform = normalize_uv_space(all_triangles)
    islands = build_uv_islands(all_triangles)
    uv_bounds = bounds_for_triangles(all_triangles)
    out_of_range = sum(
        1
        for triangle in all_triangles
        for u, v in triangle["uvs"]
        if u < 0 or u > 1 or v < 0 or v > 1
    )
    if out_of_range:
        warnings.append(f"{out_of_range} UV coordinate(s) are outside the 0-1 texture tile.")

    return {
        "fileName": file_name,
        "assetType": asset_type,
        "sourceFormat": source_format,
        "version": version,
        "packetCount": packet_count,
        "meshCount": len(meshes),
        "triangleCount": len(all_triangles),
        "islandCount": len(islands),
        "uvBounds": uv_bounds,
        "uvTransform": uv_transform,
        "meshes": meshes,
        "triangles": all_triangles,
        "islands": islands,
        "warnings": warnings,
    }


def decode_model_text(data, display_name):
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not read {display_name} as a text model file.")


def obj_face_uv_index(token, uv_count):
    pieces = token.split("/")
    if len(pieces) < 2 or not pieces[1]:
        return None
    try:
        raw_index = int(pieces[1])
    except ValueError:
        return None
    if raw_index > 0:
        return raw_index - 1
    if raw_index < 0:
        return uv_count + raw_index
    return None


def mesh_index_for_obj(mesh_lookup, mesh_name, material_name):
    key = (mesh_name or "Object", material_name or "")
    if key not in mesh_lookup:
        mesh_lookup[key] = len(mesh_lookup)
    return mesh_lookup[key]


def meshes_from_lookup(mesh_lookup, mesh_type, triangle_counts=None):
    triangle_counts = triangle_counts or {}
    if not mesh_lookup:
        mesh_lookup[("Object", "")] = 0
    meshes = []
    for (mesh_name, material_name), index in sorted(mesh_lookup.items(), key=lambda item: item[1]):
        meshes.append({
            "index": index,
            "packetIndex": 0,
            "name": mesh_name or f"Mesh {index + 1}",
            "type": mesh_type,
            "vertexCount": 0,
            "faceCount": triangle_counts.get(index, 0),
            "baseTexture": material_name,
            "normalMap": "",
            "tintMask": "",
            "glowMap": "",
            "material": {"baseTexture": material_name} if material_name else {},
        })
    return meshes


def parse_fbx_float_array(text, field_name):
    values = parse_fbx_array_values(text, field_name)
    floats = []
    for value in values:
        try:
            floats.append(float(value))
        except ValueError:
            continue
    return floats


def parse_fbx_int_array(text, field_name):
    values = parse_fbx_array_values(text, field_name)
    integers = []
    for value in values:
        try:
            integers.append(int(value))
        except ValueError:
            continue
    return integers


def parse_fbx_array_values(text, field_name):
    pattern = re.compile(rf"\b{re.escape(field_name)}\s*:\s*\*\d+\s*\{{(?P<body>.*?)\n\s*\}}", re.DOTALL)
    match = pattern.search(text)
    if not match:
        return []
    body = match.group("body")
    array_match = re.search(r"\ba\s*:\s*(?P<values>.*)", body, re.DOTALL)
    if not array_match:
        return []
    return re.findall(r"[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", array_match.group("values"))


def triangles_from_preview(preview, mesh_index):
    uvs = preview.get("uvs") or []
    indices = preview.get("indices") or []
    triangles = []
    for index in range(0, len(indices), 3):
        if index + 2 >= len(indices):
            break
        vertex_indices = indices[index:index + 3]
        triangle_uvs = []
        for vertex_index in vertex_indices:
            uv_index = vertex_index * 2
            if uv_index + 1 >= len(uvs):
                triangle_uvs = []
                break
            triangle_uvs.append([float(uvs[uv_index]), float(uvs[uv_index + 1])])
        if len(triangle_uvs) != 3:
            continue
        if triangle_area(triangle_uvs) <= 0.00000001:
            continue
        triangles.append({
            "id": f"m{mesh_index}t{len(triangles)}",
            "meshIndex": mesh_index,
            "meshName": preview.get("name") or f"Mesh {mesh_index + 1}",
            "materialName": (preview.get("material") or {}).get("baseTexture", ""),
            "uvs": triangle_uvs,
        })
    return triangles


def build_uv_islands(triangles):
    edge_to_triangles = defaultdict(list)
    for index, triangle in enumerate(triangles):
        keys = [uv_key(uv) for uv in triangle["uvs"]]
        for edge in [(keys[0], keys[1]), (keys[1], keys[2]), (keys[2], keys[0])]:
            edge_to_triangles[tuple(sorted(edge))].append(index)

    neighbors = defaultdict(set)
    for sharing in edge_to_triangles.values():
        if len(sharing) < 2:
            continue
        for left in sharing:
            for right in sharing:
                if left != right:
                    neighbors[left].add(right)

    visited = set()
    islands = []
    for start in range(len(triangles)):
        if start in visited:
            continue
        queue = deque([start])
        visited.add(start)
        component = []
        while queue:
            current = queue.popleft()
            component.append(current)
            for neighbor in neighbors[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        component_triangles = [triangles[index] for index in component]
        bounds = bounds_for_triangles(component_triangles)
        mesh_names = sorted({triangle["meshName"] for triangle in component_triangles if triangle.get("meshName")})
        materials = sorted({triangle["materialName"] for triangle in component_triangles if triangle.get("materialName")})
        island_id = f"uv-island-{len(islands) + 1}"
        for triangle in component_triangles:
            triangle["islandId"] = island_id
        islands.append({
            "id": island_id,
            "name": f"Island {len(islands) + 1}",
            "meshNames": mesh_names,
            "materialNames": materials,
            "triangleIds": [triangle["id"] for triangle in component_triangles],
            "triangleCount": len(component_triangles),
            "bounds": bounds,
            "area": sum(triangle_area(triangle["uvs"]) for triangle in component_triangles),
        })

    islands.sort(key=lambda item: item["area"], reverse=True)
    for index, island in enumerate(islands, start=1):
        island["name"] = f"Island {index}"
    return islands


def normalize_uv_space(triangles):
    raw_bounds = bounds_for_triangles(triangles)
    min_v = raw_bounds["minV"]
    max_v = raw_bounds["maxV"]
    if min_v >= -1.0001 and max_v <= 0.0001:
        for triangle in triangles:
            triangle["uvs"] = [[u, -v] for u, v in triangle["uvs"]]
        return {"v": "negated", "sourceBounds": raw_bounds}
    return {"v": "unchanged", "sourceBounds": raw_bounds}


def bounds_for_triangles(triangles):
    min_u = math.inf
    min_v = math.inf
    max_u = -math.inf
    max_v = -math.inf
    for triangle in triangles:
        for u, v in triangle["uvs"]:
            min_u = min(min_u, u)
            min_v = min(min_v, v)
            max_u = max(max_u, u)
            max_v = max(max_v, v)
    if not math.isfinite(min_u):
        return {"minU": 0, "minV": 0, "maxU": 1, "maxV": 1}
    return {"minU": min_u, "minV": min_v, "maxU": max_u, "maxV": max_v}


def uv_key(uv):
    return (round(uv[0] * UV_KEY_SCALE), round(uv[1] * UV_KEY_SCALE))


def triangle_area(uvs):
    (u1, v1), (u2, v2), (u3, v3) = uvs
    return abs(((u2 - u1) * (v3 - v1)) - ((u3 - u1) * (v2 - v1))) * 0.5
