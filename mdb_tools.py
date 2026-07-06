from dataclasses import dataclass, field
from base64 import b64encode
from io import BytesIO
from pathlib import Path
import re
import struct

try:
    from PIL import Image
except Exception:
    Image = None


IMAGE_EXTENSIONS = {".dds", ".tga", ".png", ".jpg", ".jpeg", ".webp"}
MATERIAL_PACKET_TYPES = {"RIGD", "SKIN", "COL2", "COL3"}
VISIBLE_PACKET_TYPES = {"RIGD", "SKIN"}
TEXTURE_FIELD_KEYS = ["baseTexture", "normalMap", "tintMask", "glowMap"]
TEXTURE_FIELD_OFFSETS = {
    "baseTexture": 0,
    "normalMap": 32,
    "tintMask": 64,
    "glowMap": 96,
}


TEXTURE_FLAG_LABELS = {
    "cutoutAlpha": "Cutout Alpha",
    "smoothTransparency": "Smooth Transparency",
    "additiveFxBlend": "Additive FX Blend",
    "environmentReflection": "Environment Reflection",
    "facialAnimationHead": "Facial Animation Head",
    "useGlowMap": "Use Glow Map",
    "doNotCastShadows": "Do Not Cast Shadows",
    "receiveProjectedTextures": "Receive Projected Textures",
}

MATERIAL_FLAG_BITS = {
    "cutoutAlpha": 0,
    "smoothTransparency": 1,
    "additiveFxBlend": 2,
    "environmentReflection": 3,
    "facialAnimationHead": 4,
    "useGlowMap": 5,
    "doNotCastShadows": 6,
    "receiveProjectedTextures": 7,
}

HAIR_BEHAVIOR_VALUES = {
    "Low": 0,
    "Short": 1,
    "Ponytail": 2,
}

HELM_BEHAVIOR_VALUES = {
    "None Hidden": 0,
    "Hair Hidden": 1,
    "Partial Hair": 2,
    "Head Hidden": 3,
}


@dataclass
class MdbWarning:
    severity: str
    message: str


@dataclass
class MdbPacket:
    index: int
    signature: str
    offset: int
    size: int
    name: str = ""
    skeleton: str = ""
    material: dict = field(default_factory=dict)
    mesh: dict = field(default_factory=dict)
    behavior: dict = field(default_factory=dict)
    warnings: list[MdbWarning] = field(default_factory=list)


@dataclass
class MdbReport:
    path: Path
    root: Path
    status: str
    asset_type: str
    version: str = ""
    packet_count: int = 0
    packets: list[MdbPacket] = field(default_factory=list)
    warnings: list[MdbWarning] = field(default_factory=list)


def scan_mdb_folder(root_path, recursive=True, max_files=2000):
    root = Path(root_path).expanduser().resolve()
    if not root.exists():
        raise ValueError(f"Folder does not exist: {root}")
    if not root.is_dir():
        raise ValueError(f"Path is not a folder: {root}")

    candidate_paths = root.rglob("*") if recursive else root.glob("*")
    files = sorted(path for path in candidate_paths if path.is_file() and path.suffix.lower() == ".mdb")
    unique_files = []
    seen = set()
    for file_path in files:
        resolved = file_path.resolve()
        if resolved not in seen:
            unique_files.append(resolved)
            seen.add(resolved)

    found_count = len(unique_files)
    if found_count > max_files:
        unique_files = unique_files[:max_files]

    texture_names = collect_texture_names(root, recursive=recursive)
    reports = [inspect_mdb_file(path, root, texture_names) for path in unique_files]

    summary = {
        "total": len(reports),
        "ready": sum(1 for report in reports if report.status == "Ready"),
        "needsReview": sum(1 for report in reports if report.status == "Needs Review"),
        "willNotWork": sum(1 for report in reports if report.status == "Will Not Work In Game"),
        "byType": {},
    }
    for report in reports:
        summary["byType"][report.asset_type] = summary["byType"].get(report.asset_type, 0) + 1

    return {
        "rootPath": str(root),
        "recursive": recursive,
        "truncated": found_count > max_files,
        "maxFiles": max_files,
        "summary": summary,
        "models": [report_to_dict(report) for report in reports],
    }


def collect_texture_names(root, recursive=True):
    paths = root.rglob("*") if recursive else root.glob("*")
    texture_names = set()
    for path in paths:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            texture_names.add(path.stem.lower())
    return texture_names


def inspect_mdb_file(path, root=None, texture_names=None):
    path = Path(path).resolve()
    root = Path(root).resolve() if root else path.parent
    texture_names = texture_names or set()

    try:
        data = path.read_bytes()
    except Exception as exc:
        warnings = [MdbWarning("error", f"Could not read model file: {exc}")]
        return MdbReport(path, root, "Will Not Work In Game", classify_asset(path.name), warnings=warnings)

    return inspect_mdb_bytes(data, path, root, texture_names)


def inspect_mdb_bytes(data, display_path, root=None, texture_names=None):
    path = Path(display_path)
    root = Path(root) if root else path.parent
    texture_names = texture_names or set()
    warnings = []
    packets = []
    version = ""
    packet_count = 0

    try:
        if len(data) < 12 or data[:4] != b"NWN2":
            warnings.append(MdbWarning("error", "This is not a valid NWN2 model file."))
            return MdbReport(path, root, "Will Not Work In Game", classify_asset(path.name), warnings=warnings)

        major, minor, packet_count = struct.unpack_from("<HHI", data, 4)
        version = f"{major}.{minor}"
        lookup_start = 12

        for index in range(packet_count):
            entry = lookup_start + index * 8
            if entry + 8 > len(data):
                warnings.append(MdbWarning("error", "Packet table ends unexpectedly."))
                break

            signature = decode_ascii(data[entry:entry + 4])
            offset = struct.unpack_from("<I", data, entry + 4)[0]
            packets.append(parse_packet(data, index, signature, offset))

    except Exception as exc:
        warnings.append(MdbWarning("error", f"Could not read model file: {exc}"))

    validate_report(path, packets, warnings, texture_names)
    status = status_from_warnings(warnings, packets)
    return MdbReport(
        path=path,
        root=root,
        status=status,
        asset_type=classify_asset(path.name, packets),
        version=version,
        packet_count=packet_count,
        packets=packets,
        warnings=warnings,
    )


def scan_uploaded_mdb_files(uploaded_files, max_files=2000):
    mdb_files = [
        item for item in uploaded_files
        if Path(item.get("name", "")).suffix.lower() == ".mdb"
    ][:max_files]

    reports = [
        inspect_mdb_bytes(item.get("data", b""), item.get("name", "uploaded.mdb"), Path("."))
        for item in mdb_files
    ]

    summary = {
        "total": len(reports),
        "ready": sum(1 for report in reports if report.status == "Ready"),
        "needsReview": sum(1 for report in reports if report.status == "Needs Review"),
        "willNotWork": sum(1 for report in reports if report.status == "Will Not Work In Game"),
        "byType": {},
    }
    for report in reports:
        summary["byType"][report.asset_type] = summary["byType"].get(report.asset_type, 0) + 1

    return {
        "rootPath": "Imported files",
        "recursive": False,
        "truncated": len(uploaded_files) > max_files,
        "maxFiles": max_files,
        "summary": summary,
        "models": [report_to_dict(report) for report in reports],
    }


def clone_and_rename_models(jobs, output_dir, conflict_mode="auto"):
    output = Path(output_dir).expanduser().resolve()
    if not output:
        raise ValueError("Choose an output folder.")
    output.mkdir(parents=True, exist_ok=True)

    results = []
    skipped = []
    for job in jobs:
        source = Path(str(job.get("path", ""))).expanduser().resolve()
        new_name = sanitize_fixed_name(str(job.get("newName", "")).strip())
        if not source.exists() or not source.is_file():
            raise ValueError(f"Model file does not exist: {source}")
        if source.suffix.lower() != ".mdb":
            raise ValueError(f"Not an MDB model file: {source.name}")
        if not new_name:
            raise ValueError(f"Missing new name for {source.name}")

        cloned = clone_single_model(source, output, new_name, conflict_mode=conflict_mode)
        if cloned.get("skipped"):
            skipped.append(cloned)
        else:
            results.append(cloned)

    texture_names = collect_texture_names(output, recursive=True)
    reports = [inspect_mdb_file(item["outputPath"], output, texture_names) for item in results]
    return {
        "outputDir": str(output),
        "copied": len(results),
        "skipped": skipped,
        "results": results,
        "models": [report_to_dict(report) for report in reports],
    }


def clone_and_edit_models(jobs, output_dir="", conflict_mode="auto"):
    default_output = Path(output_dir).expanduser().resolve() if str(output_dir or "").strip() else None
    if default_output:
        default_output.mkdir(parents=True, exist_ok=True)
    if not isinstance(jobs, list) or not jobs:
        raise ValueError("Select at least one MDB to clone.")

    results = []
    skipped = []
    errors = []
    for job in jobs:
        try:
            source = Path(str(job.get("path", ""))).expanduser().resolve()
            new_name = sanitize_fixed_name(str(job.get("newName", "")).strip())
            if not source.exists() or not source.is_file():
                raise ValueError(f"Model file does not exist: {source}")
            if source.suffix.lower() != ".mdb":
                raise ValueError(f"Not an MDB model file: {source.name}")
            if not new_name:
                raise ValueError(f"Missing new name for {source.name}")

            output = Path(str(job.get("outputDir", "")).strip()).expanduser().resolve() if str(job.get("outputDir", "")).strip() else default_output or source.parent
            output.mkdir(parents=True, exist_ok=True)
            if conflict_mode == "overwrite" and (output / f"{new_name}.mdb").resolve() == source:
                raise ValueError(f"Clone name matches the source MDB: {source.name}. Choose a different name to protect the original.")
            cloned = clone_single_model_bytes(source.read_bytes(), source.stem, output, new_name, conflict_mode=conflict_mode)
            if cloned.get("skipped"):
                skipped.append({
                    "skipped": True,
                    "sourcePath": str(source),
                    "outputPath": str(cloned["outputPath"]),
                    "reason": cloned["reason"],
                })
                continue
            changed = apply_mdb_edit_to_buffer(cloned["data"], job)
            cloned["outputPath"].write_bytes(cloned["data"])
            results.append({
                "sourcePath": str(source),
                "outputPath": str(cloned["outputPath"]),
                "oldName": source.stem,
                "newName": cloned["outputPath"].stem,
                "changed": changed,
            })
        except Exception as exc:
            errors.append({"path": str(job.get("path", "")), "error": str(exc)})

    report_roots = {str(Path(item["outputPath"]).parent): Path(item["outputPath"]).parent for item in results}
    texture_names_by_root = {str(root): collect_texture_names(root, recursive=True) for root in report_roots.values()}
    reports = [
        inspect_mdb_file(item["outputPath"], Path(item["outputPath"]).parent, texture_names_by_root.get(str(Path(item["outputPath"]).parent), set()))
        for item in results
    ]
    return {
        "outputDir": str(default_output) if default_output else "",
        "copied": len(results),
        "skipped": skipped,
        "errors": errors,
        "results": results,
        "models": [report_to_dict(report) for report in reports],
    }


def clone_and_edit_uploaded_model(uploaded_file, output_dir, new_name, edit_job=None, conflict_mode="auto"):
    output = Path(output_dir).expanduser().resolve()
    if not output:
        raise ValueError("Choose an output folder.")
    output.mkdir(parents=True, exist_ok=True)

    source_name = str(uploaded_file.get("name", "uploaded.mdb"))
    source_stem = sanitize_fixed_name(Path(source_name).stem)
    new_base_name = sanitize_fixed_name(str(new_name or "").strip())
    if not new_base_name:
        raise ValueError("Choose a new MDB name.")

    cloned = clone_single_model_bytes(uploaded_file.get("data", b""), source_stem, output, new_base_name, conflict_mode=conflict_mode)
    if cloned.get("skipped"):
        return {
            "outputDir": str(output),
            "copied": 0,
            "skipped": [{
                "skipped": True,
                "sourcePath": source_name,
                "outputPath": str(cloned["outputPath"]),
                "reason": cloned["reason"],
            }],
            "errors": [],
            "results": [],
            "models": [],
        }

    changed = apply_mdb_edit_to_buffer(cloned["data"], edit_job or {})
    cloned["outputPath"].write_bytes(cloned["data"])
    texture_names = collect_texture_names(output, recursive=True)
    report = inspect_mdb_file(cloned["outputPath"], output, texture_names)
    result = {
        "sourcePath": source_name,
        "outputPath": str(cloned["outputPath"]),
        "oldName": source_stem,
        "newName": cloned["outputPath"].stem,
        "changed": changed,
    }
    return {
        "outputDir": str(output),
        "copied": 1,
        "skipped": [],
        "errors": [],
        "results": [result],
        "models": [report_to_dict(report)],
    }


def save_mdb_flag_edits(jobs, root_path="", recursive=True):
    if not isinstance(jobs, list) or not jobs:
        raise ValueError("Select at least one MDB to edit.")

    paths = [Path(str(job.get("path", ""))).expanduser().resolve() for job in jobs]
    for path in paths:
        if not path.exists():
            raise ValueError(f"Model file does not exist: {path}")
        if path.suffix.lower() != ".mdb":
            raise ValueError(f"Only MDB files can be edited: {path}")

    root = Path(root_path).expanduser().resolve() if root_path else common_report_root(paths)
    texture_names = collect_texture_names(root, recursive=recursive) if root.exists() and root.is_dir() else set()
    reports = [inspect_mdb_file(path, root, texture_names) for path in paths]
    asset_types = {report.asset_type for report in reports}
    if len(asset_types) > 1:
        types = ", ".join(sorted(asset_types))
        raise ValueError(f"Batch edits must use one model type at a time. Selected types: {types}.")

    results = []
    errors = []
    for job, path in zip(jobs, paths):
        try:
            changed = apply_mdb_flag_edit(path, job)
            updated_report = inspect_mdb_file(path, root, texture_names)
            results.append({
                "path": str(path),
                "fileName": path.name,
                "changed": changed,
                "model": report_to_dict(updated_report),
            })
        except Exception as exc:
            errors.append({"path": str(path), "error": str(exc)})

    return {
        "saved": len([item for item in results if item.get("changed")]),
        "unchanged": len([item for item in results if not item.get("changed")]),
        "errors": errors,
        "assetType": next(iter(asset_types)) if asset_types else "",
        "models": [item["model"] for item in results],
        "results": results,
    }


def common_report_root(paths):
    try:
        return Path(paths[0]).parent
    except Exception:
        return paths[0].parent if paths else Path(".")


def apply_mdb_flag_edit(path, job):
    data = bytearray(path.read_bytes())
    changed = apply_mdb_edit_to_buffer(data, job)
    if changed:
        path.write_bytes(data)
    return changed


def apply_mdb_edit_to_buffer(data, job):
    material_flags = job.get("materialFlags") if isinstance(job.get("materialFlags"), dict) else {}
    material_values = job.get("materialValues") if isinstance(job.get("materialValues"), dict) else {}
    texture_references = job.get("textureReferences") if isinstance(job.get("textureReferences"), dict) else {}
    hair_value = job.get("hairShortening")
    helm_value = job.get("helmetHairHiding")
    if not material_flags and not material_values and not texture_references and hair_value is None and helm_value is None:
        return False

    changed = False
    if len(data) < 12 or data[:4] != b"NWN2":
        raise ValueError("This is not a valid NWN2 model file.")

    packet_count = struct.unpack_from("<I", data, 8)[0]
    lookup_start = 12
    material_written = False
    for index in range(packet_count):
        entry = lookup_start + index * 8
        if entry + 8 > len(data):
            break
        signature = decode_ascii(data[entry:entry + 4])
        offset = struct.unpack_from("<I", data, entry + 4)[0]
        if offset + 8 > len(data):
            continue
        actual_signature = decode_ascii(data[offset:offset + 4]) or signature
        packet_size = struct.unpack_from("<I", data, offset + 4)[0]
        payload_start = offset + 8
        payload_end = min(payload_start + packet_size, len(data))
        if payload_start >= payload_end:
            continue

        packet_name = ""
        if actual_signature != "COLS" and payload_start + 32 <= payload_end:
            packet_name = read_fixed_string(data[payload_start:payload_start + 32], 0)

        if is_lod_name(packet_name):
            continue

        if (material_flags or material_values or texture_references) and not material_written and actual_signature in MATERIAL_PACKET_TYPES:
            material_start = material_start_for_signature(actual_signature, payload_start)
            if material_start is not None:
                if texture_references:
                    changed = write_texture_references(data, material_start, texture_references) or changed

                if material_values:
                    changed = write_material_values(data, material_start, material_values) or changed

                if material_flags:
                    flags_offset = material_start + 160
                    if flags_offset + 4 > len(data):
                        material_written = True
                        continue
                    old_flags = struct.unpack_from("<I", data, flags_offset)[0]
                    new_flags = old_flags
                    for key, enabled in material_flags.items():
                        if key not in MATERIAL_FLAG_BITS:
                            continue
                        bit = 1 << MATERIAL_FLAG_BITS[key]
                        if bool(enabled):
                            new_flags |= bit
                        else:
                            new_flags &= ~bit
                    if new_flags != old_flags:
                        struct.pack_into("<I", data, flags_offset, new_flags)
                        changed = True
                material_written = True

        if hair_value is not None and actual_signature == "HAIR":
            changed = write_behavior_value(data, payload_start + 32, HAIR_BEHAVIOR_VALUES, hair_value) or changed

        if helm_value is not None and actual_signature == "HELM":
            changed = write_behavior_value(data, payload_start + 32, HELM_BEHAVIOR_VALUES, helm_value) or changed

    return changed


def write_texture_references(data, material_start, references):
    changed = False
    for key, value in references.items():
        if key not in TEXTURE_FIELD_OFFSETS:
            continue
        offset = material_start + TEXTURE_FIELD_OFFSETS[key]
        changed = write_texture_reference(data, offset, value, key) or changed
    return changed


def write_texture_reference(data, offset, value, label):
    if offset + 32 > len(data):
        return False
    next_value = sanitize_texture_reference(value)
    old_value = read_fixed_string(data, offset, 32)
    if old_value == next_value:
        return False
    write_fixed_string(data, offset, next_value)
    return True


def sanitize_texture_reference(value):
    cleaned = str(value or "").strip()
    cleaned = cleaned.rsplit(".", 1)[0] if Path(cleaned).suffix.lower() in IMAGE_EXTENSIONS else cleaned
    cleaned = "".join(char for char in cleaned if char not in '<>:"/\\|?*')
    encoded = cleaned.encode("utf-8")
    if len(encoded) > 31:
        encoded = encoded[:31]
        cleaned = encoded.decode("utf-8", errors="ignore")
    return cleaned.strip()


def write_behavior_value(data, offset, allowed, value):
    if value not in allowed:
        raise ValueError(f"Unsupported behavior value: {value}")
    if offset + 4 > len(data):
        return False
    old_value = struct.unpack_from("<I", data, offset)[0]
    new_value = allowed[value]
    if old_value == new_value:
        return False
    struct.pack_into("<I", data, offset, new_value)
    return True


def write_material_values(data, material_start, values):
    changed = False
    if "diffuseColor" in values:
        changed = write_float_triplet(data, material_start + 128, values["diffuseColor"], "Diffuse Color") or changed
    if "specularColor" in values:
        changed = write_float_triplet(data, material_start + 140, values["specularColor"], "Specular Color") or changed
    if "glossiness" in values:
        changed = write_float_value(data, material_start + 152, values["glossiness"], "Glossiness") or changed
    if "specularIntensity" in values:
        changed = write_float_value(data, material_start + 156, values["specularIntensity"], "Specular Intensity") or changed
    return changed


def write_float_triplet(data, offset, values, label):
    if not isinstance(values, list) or len(values) != 3:
        raise ValueError(f"{label} must use three RGB values.")
    changed = False
    for index, value in enumerate(values):
        changed = write_float_value(data, offset + index * 4, clamp_float(value, 0.0, 1.0), label) or changed
    return changed


def write_float_value(data, offset, value, label):
    if offset + 4 > len(data):
        return False
    try:
        new_value = float(value)
    except Exception as exc:
        raise ValueError(f"{label} must be a number.") from exc
    old_value = struct.unpack_from("<f", data, offset)[0]
    if abs(old_value - new_value) < 0.00001:
        return False
    struct.pack_into("<f", data, offset, new_value)
    return True


def clamp_float(value, lower, upper):
    try:
        number = float(value)
    except Exception as exc:
        raise ValueError("RGB values must be numbers.") from exc
    return max(lower, min(upper, number))


def clone_single_model(source, output_dir, new_base_name, conflict_mode="auto"):
    source = Path(source).expanduser().resolve()
    requested_path = Path(output_dir).expanduser().resolve() / f"{new_base_name}.mdb"
    if conflict_mode == "overwrite" and requested_path.resolve() == source:
        raise ValueError(f"Clone name matches the source MDB: {source.name}. Choose a different name to protect the original.")
    cloned = clone_single_model_bytes(source.read_bytes(), source.stem, output_dir, new_base_name, conflict_mode=conflict_mode)
    if cloned.get("skipped"):
        return {"skipped": True, "sourcePath": str(source), "outputPath": str(cloned["outputPath"]), "reason": cloned["reason"]}
    cloned["outputPath"].write_bytes(cloned["data"])
    return {
        "sourcePath": str(source),
        "outputPath": str(cloned["outputPath"]),
        "oldName": source.stem,
        "newName": cloned["outputPath"].stem,
        "skeletonChanges": cloned.get("skeletonChanges", []),
    }


def clone_single_model_bytes(raw_data, old_base_name, output_dir, new_base_name, conflict_mode="auto"):
    output_dir = Path(output_dir).expanduser().resolve()
    data = bytearray(raw_data)
    requested_path = output_dir / f"{new_base_name}.mdb"
    if requested_path.exists() and conflict_mode == "skip":
        return {"skipped": True, "outputPath": requested_path, "reason": "Already exists"}
    output_path = requested_path if conflict_mode == "overwrite" else unique_output_path(requested_path)
    final_base_name = output_path.stem

    if len(data) < 12 or data[:4] != b"NWN2":
        raise ValueError("This is not a valid NWN2 model file.")

    packet_count = struct.unpack_from("<I", data, 8)[0]
    skeleton_changes = []
    for index in range(packet_count):
        entry = 12 + index * 8
        if entry + 8 > len(data):
            break

        signature = decode_ascii(data[entry:entry + 4])
        offset = struct.unpack_from("<I", data, entry + 4)[0]
        if offset + 8 > len(data):
            continue

        actual_signature = decode_ascii(data[offset:offset + 4])
        if actual_signature:
            signature = actual_signature
        payload_start = offset + 8
        packet_name = read_fixed_string(data, payload_start)
        renamed_packet = rename_related_name(packet_name, old_base_name, final_base_name)
        if renamed_packet != packet_name:
            write_fixed_string(data, payload_start, renamed_packet)

        if signature == "SKIN":
            skeleton_start = payload_start + 32
            skeleton_name = read_fixed_string(data, skeleton_start)
            renamed_skeleton = rename_skeleton_name(skeleton_name, old_base_name, final_base_name)
            if renamed_skeleton != skeleton_name:
                write_fixed_string(data, skeleton_start, renamed_skeleton)
                skeleton_changes.append({
                    "packet": index,
                    "oldSkeleton": skeleton_name,
                    "newSkeleton": renamed_skeleton,
                })

    return {
        "data": data,
        "outputPath": output_path,
        "oldName": old_base_name,
        "newName": output_path.stem,
        "skeletonChanges": skeleton_changes,
    }


def parse_packet(data, index, signature, offset):
    warnings = []
    if offset + 8 > len(data):
        return MdbPacket(index, signature, offset, 0, warnings=[
            MdbWarning("error", "Packet offset points outside the file.")
        ])

    actual_signature = decode_ascii(data[offset:offset + 4])
    if actual_signature and actual_signature != signature:
        warnings.append(MdbWarning("warning", f"Packet table says {signature}, but packet data says {actual_signature}."))
        signature = actual_signature

    packet_size = struct.unpack_from("<I", data, offset + 4)[0]
    payload_start = offset + 8
    payload_end = min(payload_start + packet_size, len(data))
    payload = data[payload_start:payload_end]
    packet = MdbPacket(index, signature, offset, packet_size, warnings=warnings)

    if len(payload) < packet_size:
        packet.warnings.append(MdbWarning("error", "Packet data is shorter than its declared size."))

    if signature == "COLS":
        if len(payload) >= 4:
            packet.behavior["collisionSpheres"] = unpack_int(payload, 0)
        return packet

    packet.name = read_fixed_string(payload, 0)
    validate_fixed_field("Internal name", packet.name, packet.warnings)

    if signature == "SKIN":
        packet.skeleton = read_fixed_string(payload, 32)
        validate_fixed_field("Animation skeleton", packet.skeleton, packet.warnings)
        packet.material = parse_material(payload, 64)
        packet.mesh = parse_mesh_counts(payload, 224)
    elif signature in {"RIGD", "COL2", "COL3"}:
        packet.material = parse_material(payload, 32)
        packet.mesh = parse_mesh_counts(payload, 192)
    elif signature == "WALK":
        if len(payload) >= 44:
            packet.behavior["surfaceFlags"] = unpack_int(payload, 32)
        packet.mesh = parse_mesh_counts(payload, 36)
    elif signature == "HOOK":
        if len(payload) >= 40:
            packet.behavior["hookPointSize"] = unpack_int(payload, 32)
            packet.behavior["hookPointType"] = unpack_int(payload, 36)
    elif signature == "HAIR":
        if len(payload) >= 36:
            packet.behavior["hairShortening"] = hair_behavior(unpack_int(payload, 32))
    elif signature == "HELM":
        if len(payload) >= 36:
            packet.behavior["helmetHairHiding"] = helm_behavior(unpack_int(payload, 32))

    return packet


def parse_material(payload, start):
    if len(payload) < start + 164:
        return {}

    flags = unpack_int(payload, start + 160)
    diffuse_color = unpack_float_triplet(payload, start + 128)
    return {
        "baseTexture": read_fixed_string(payload, start),
        "normalMap": read_fixed_string(payload, start + 32),
        "tintMask": read_fixed_string(payload, start + 64),
        "glowMap": read_fixed_string(payload, start + 96),
        "baseColor": diffuse_color,
        "diffuseColor": diffuse_color,
        "specularColor": unpack_float_triplet(payload, start + 140),
        "glossiness": unpack_float(payload, start + 152),
        "specularIntensity": unpack_float(payload, start + 156),
        "rawFlags": flags,
        "renderingOptions": {
            "cutoutAlpha": bool(flags & (1 << 0)),
            "smoothTransparency": bool(flags & (1 << 1)),
            "additiveFxBlend": bool(flags & (1 << 2)),
            "environmentReflection": bool(flags & (1 << 3)),
            "facialAnimationHead": bool(flags & (1 << 4)),
            "useGlowMap": bool(flags & (1 << 5)),
            "doNotCastShadows": bool(flags & (1 << 6)),
            "receiveProjectedTextures": bool(flags & (1 << 7)),
        },
    }


def parse_mesh_counts(payload, start):
    if len(payload) < start + 12:
        return {}
    return {
        "vertices": unpack_int(payload, start + 4),
        "faces": unpack_int(payload, start + 8),
    }


def mdb_geometry_preview(path, texture_roots=None):
    path = Path(path).expanduser().resolve()
    if not path.is_file() or path.suffix.lower() != ".mdb":
        raise ValueError(f"Not an MDB model file: {path}")

    preview_texture_roots = preview_texture_search_roots(path.parent, texture_roots)
    data = path.read_bytes()
    report = inspect_mdb_bytes(data, path, path.parent, collect_preview_texture_names(preview_texture_roots))
    meshes = []
    warnings = []

    for packet in report.packets:
        if packet.signature not in VISIBLE_PACKET_TYPES:
            continue
        if is_lod_name(packet.name):
            continue
        payload_start = packet.offset + 8
        payload = data[payload_start:payload_start + packet.size]
        try:
            mesh = parse_preview_mesh(packet, payload, preview_texture_roots)
            if mesh:
                meshes.append(mesh)
        except Exception as exc:
            warnings.append(f"{packet.name or packet.signature}: {exc}")

    if not meshes:
        warnings.append("No previewable RIGD or SKIN geometry was found.")

    return {
        "fileName": path.name,
        "assetType": report.asset_type,
        "meshes": meshes,
        "warnings": warnings,
    }


def parse_preview_mesh(packet, payload, texture_roots=None):
    if packet.signature == "SKIN":
        mesh_start = 224
        vertex_stride = 84
        uv_offset = 68
    elif packet.signature == "RIGD":
        mesh_start = 192
        vertex_stride = 60
        uv_offset = 48
    else:
        return None

    if len(payload) < mesh_start + 12:
        raise ValueError("mesh header is incomplete")

    vertex_count = unpack_int(payload, mesh_start + 4)
    face_count = unpack_int(payload, mesh_start + 8)
    geometry_start = mesh_start + 12
    index_start = geometry_start + vertex_count * vertex_stride
    index_end = index_start + face_count * 6

    if vertex_count <= 0 or face_count <= 0:
        raise ValueError("mesh has no vertices or faces")
    if index_end > len(payload):
        raise ValueError("mesh geometry is shorter than expected")

    positions = []
    normals = []
    uvs = []
    bounds_min = [float("inf"), float("inf"), float("inf")]
    bounds_max = [float("-inf"), float("-inf"), float("-inf")]

    for vertex_index in range(vertex_count):
        base = geometry_start + vertex_index * vertex_stride
        x, y, z = struct.unpack_from("<fff", payload, base)
        nx, ny, nz = struct.unpack_from("<fff", payload, base + 12)
        u, v = struct.unpack_from("<ff", payload, base + uv_offset)
        positions.extend([x, y, z])
        normals.extend([nx, ny, nz])
        uvs.extend([u, v])
        for axis, value in enumerate([x, y, z]):
            bounds_min[axis] = min(bounds_min[axis], value)
            bounds_max[axis] = max(bounds_max[axis], value)

    indices = list(struct.unpack_from(f"<{face_count * 3}H", payload, index_start))
    valid_indices = [index for index in indices if index < vertex_count]
    if len(valid_indices) != len(indices):
        raise ValueError("mesh indices reference vertices outside the preview buffer")

    return {
        "name": packet.name,
        "type": packet.signature,
        "vertexCount": vertex_count,
        "faceCount": face_count,
        "positions": positions,
        "normals": normals,
        "uvs": uvs,
        "indices": indices,
        "bounds": {"min": bounds_min, "max": bounds_max},
        "material": packet.material,
        "texture": preview_texture(packet.material.get("baseTexture", ""), texture_roots) if packet.material else None,
    }


def preview_texture(texture_name, roots):
    if not texture_name or not roots or Image is None:
        return None

    path = find_texture_file(roots, texture_name)
    if not path:
        return None

    try:
        with Image.open(path) as image:
            image = image.convert("RGBA")
            image.thumbnail((512, 512))
            buffer = BytesIO()
            image.save(buffer, format="PNG")
    except Exception:
        return None

    return {
        "name": texture_name,
        "path": str(path),
        "mimeType": "image/png",
        "dataUrl": f"data:image/png;base64,{b64encode(buffer.getvalue()).decode('ascii')}",
    }


def find_texture_file(root, texture_name):
    roots = root if isinstance(root, (list, tuple)) else [root]
    wanted = str(texture_name).lower()
    roots = [Path(item) for item in roots if item]

    for root in roots:
        if not root.is_dir():
            continue
        for extension in [".dds", ".tga", ".png", ".jpg", ".jpeg", ".webp"]:
            candidate = root / f"{texture_name}{extension}"
            if candidate.is_file():
                return candidate

    for root in roots:
        if not root.is_dir():
            continue
        for path in root.iterdir():
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and path.stem.lower() == wanted:
                return path

    for root in roots:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and path.stem.lower() == wanted:
                return path
    return None


def preview_texture_search_roots(primary_root, extra_roots=None):
    roots = []
    for raw_root in [primary_root, *(extra_roots or [])]:
        try:
            root = Path(raw_root).expanduser().resolve()
        except Exception:
            continue
        if root.is_dir() and root not in roots:
            roots.append(root)
    return roots


def collect_preview_texture_names(roots):
    texture_names = set()
    for root in roots:
        recursive = len(roots) > 1 and root != roots[0]
        texture_names.update(collect_texture_names(root, recursive=recursive))
    return texture_names


def is_lod_name(name):
    text = str(name or "").lower()
    return bool(
        text.endswith("_l01")
        or text.endswith("_l02")
        or text.endswith("_lod1")
        or text.endswith("_lod2")
        or text.endswith("_lo1")
        or text.endswith("_lo2")
    )


def validate_report(path, packets, warnings, texture_names):
    basename = path.stem
    visible_packets = [packet for packet in packets if packet.signature in VISIBLE_PACKET_TYPES]
    head_asset = "head" in basename.lower()

    for packet in packets:
        warnings.extend(packet.warnings)

        if packet.signature in MATERIAL_PACKET_TYPES and packet.material:
            validate_material(packet, warnings, texture_names)

        if packet.signature == "WALK" and packet.name and not packet.name.lower().endswith("_w"):
            warnings.append(MdbWarning("error", f"Walkable surface '{packet.name}' should end in _W."))

    if visible_packets:
        primary = visible_packets[0]
        if head_asset and primary.name and primary.name.lower() != basename.lower():
            warnings.append(MdbWarning("error", "Head model filename and main internal name do not match."))
        elif primary.name and primary.name.lower() != basename.lower():
            warnings.append(MdbWarning("warning", "Filename and main internal name differ."))

    if head_asset:
        names = [packet.name for packet in visible_packets if packet.name]
        has_eye = any("eye" in name.lower() for name in names)
        if not has_eye:
            warnings.append(MdbWarning("warning", "No eye mesh was detected for this head model."))
        if any("_l01" in name.lower() or "_l02" in name.lower() for name in names):
            base_lower = basename.lower()
            mismatched_lod = [
                name for name in names
                if ("_l01" in name.lower() or "_l02" in name.lower())
                and not name.lower().startswith(base_lower)
            ]
            if mismatched_lod:
                warnings.append(MdbWarning("error", "One or more far-distance versions do not match the head name."))


def validate_material(packet, warnings, texture_names):
    material = packet.material
    base_texture = material.get("baseTexture", "")
    glow_map = material.get("glowMap", "")
    options = material.get("renderingOptions", {})

    if packet.signature in VISIBLE_PACKET_TYPES and not base_texture:
        warnings.append(MdbWarning("error", f"{packet.name or packet.signature} has no base texture."))

    for label, key in [("base texture", "baseTexture"), ("normal map", "normalMap"), ("tint mask", "tintMask"), ("glow map", "glowMap")]:
        value = material.get(key, "")
        if value and texture_names and value.lower() not in texture_names:
            warnings.append(MdbWarning("warning", f"{packet.name or packet.signature} references missing {label}: {value}."))

    if options.get("useGlowMap") and not glow_map:
        warnings.append(MdbWarning("warning", f"{packet.name or packet.signature} has glow enabled but no glow map."))
    if options.get("smoothTransparency"):
        warnings.append(MdbWarning("warning", "Smooth Transparency is a legacy option; use Cutout Alpha for most assets."))
    if options.get("additiveFxBlend"):
        warnings.append(MdbWarning("warning", "Additive FX Blend is a legacy option; use only for deliberate effects."))
    if options.get("environmentReflection"):
        warnings.append(MdbWarning("warning", "Environment Reflection support is uncertain in NWN2."))


def validate_fixed_field(label, value, warnings):
    if len(value.encode("utf-8")) >= 32:
        warnings.append(MdbWarning("warning", f"{label} uses all 32 bytes; test carefully because some tools expect a terminator."))


def status_from_warnings(warnings, packets):
    severities = [warning.severity for warning in warnings]
    for packet in packets:
        severities.extend(warning.severity for warning in packet.warnings)
    if "error" in severities:
        return "Will Not Work In Game"
    if "warning" in severities:
        return "Needs Review"
    return "Ready"


def classify_asset(filename, packets=None):
    name = filename.lower()
    if name.startswith("a_"):
        return "Armor Part"
    if name.startswith("w_") or name.startswith("aw_"):
        return "Weapon"
    if "head" in name:
        return "Head Model"
    if "hair" in name:
        return "Hair Model"
    if "helm" in name:
        return "Helmet"
    if "body" in name:
        return "Body Model"
    if "boots" in name:
        return "Boots"
    if "gloves" in name:
        return "Gloves"
    if "cloak" in name:
        return "Cloak"
    if "belt" in name:
        return "Belt"
    if name.startswith("c_"):
        return "Creature"
    if name.startswith("plc_"):
        return "Placeable"
    if name.startswith("tl_"):
        return "Tile"
    if packets and any(packet.signature == "HELM" for packet in packets):
        return "Helmet Behavior"
    if packets and any(packet.signature == "HAIR" for packet in packets):
        return "Hair Behavior"
    return "Model"


def report_to_dict(report):
    return {
        "path": str(report.path),
        "relativePath": safe_relative(report.path, report.root),
        "fileName": report.path.name,
        "status": report.status,
        "assetType": report.asset_type,
        "version": report.version,
        "packetCount": report.packet_count,
        "textureCount": texture_count(report.packets),
        "warnings": [warning.__dict__ for warning in report.warnings],
        "packets": [packet_to_dict(packet) for packet in report.packets],
    }


def packet_to_dict(packet):
    return {
        "index": packet.index,
        "type": packet.signature,
        "offset": packet.offset,
        "size": packet.size,
        "name": packet.name,
        "skeleton": packet.skeleton,
        "material": packet.material,
        "mesh": packet.mesh,
        "behavior": packet.behavior,
        "warnings": [warning.__dict__ for warning in packet.warnings],
    }


def safe_relative(path, root):
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def texture_count(packets):
    names = set()
    for packet in packets:
        material = packet.material or {}
        for key in ["baseTexture", "normalMap", "tintMask", "glowMap"]:
            value = material.get(key, "")
            if value:
                names.add(value.lower())
    return len(names)


def material_start_for_signature(signature, payload_start):
    if signature == "SKIN":
        return payload_start + 64
    if signature in {"RIGD", "COL2", "COL3"}:
        return payload_start + 32
    return None


def sanitize_fixed_name(value):
    cleaned = "".join(char for char in value.strip() if char not in '<>:"/\\|?*')
    cleaned = cleaned.rsplit(".", 1)[0] if cleaned.lower().endswith(".mdb") else cleaned
    encoded = cleaned.encode("utf-8")
    if len(encoded) > 31:
        encoded = encoded[:31]
        cleaned = encoded.decode("utf-8", errors="ignore")
    return cleaned.strip()


def rename_related_name(value, old_base, new_base):
    if not value or not old_base:
        return value

    old_lower = old_base.lower()
    value_lower = value.lower()
    if value_lower == old_lower:
        return new_base
    if value_lower.startswith(old_lower):
        return sanitize_fixed_name(new_base + value[len(old_base):])
    return value


def race_code_from_model_name(value):
    match = re.match(r"^[A-Za-z]_([A-Za-z0-9]{3})(?:_|$)", value or "")
    return match.group(1).upper() if match else ""


def skeleton_race_for_model_race(race_code):
    race_code = (race_code or "").upper()
    if len(race_code) != 3:
        return race_code
    if race_code[:2] == "OG":
        return f"OO{race_code[-1]}"
    return race_code


def rename_skeleton_name(value, old_base, new_base):
    if not value:
        return value

    old_race = race_code_from_model_name(old_base)
    new_race = race_code_from_model_name(new_base)
    if not old_race or not new_race or old_race == new_race:
        return value
    old_skeleton_race = skeleton_race_for_model_race(old_race)
    new_skeleton_race = skeleton_race_for_model_race(new_race)
    if old_skeleton_race == new_skeleton_race:
        return value

    match = re.match(r"^(?P<prefix>[A-Za-z]_)(?P<race>[A-Za-z0-9]{3})(?P<suffix>_skel)$", value, re.IGNORECASE)
    if not match or match.group("race").upper() != old_skeleton_race:
        return value

    return sanitize_fixed_name(f"{match.group('prefix')}{new_skeleton_race}{match.group('suffix')}")


def write_fixed_string(buffer, start, value, size=32):
    if start + size > len(buffer):
        return
    encoded = value.encode("utf-8")[:size - 1]
    buffer[start:start + size] = encoded + b"\x00" * (size - len(encoded))


def unique_output_path(path):
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    counter = 2
    while True:
        candidate = parent / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def read_fixed_string(payload, start, size=32):
    if len(payload) <= start:
        return ""
    raw = payload[start:start + size]
    raw = raw.split(b"\x00", 1)[0]
    return raw.decode("utf-8", errors="replace").strip()


def decode_ascii(raw):
    return raw.decode("ascii", errors="ignore").strip("\x00")


def unpack_int(payload, start):
    return struct.unpack_from("<I", payload, start)[0]


def unpack_float(payload, start):
    return struct.unpack_from("<f", payload, start)[0]


def unpack_float_triplet(payload, start):
    return [unpack_float(payload, start), unpack_float(payload, start + 4), unpack_float(payload, start + 8)]


def hair_behavior(value):
    return {
        0: "Low",
        1: "Short",
        2: "Ponytail",
    }.get(value, f"Unknown ({value})")


def helm_behavior(value):
    return {
        0: "None Hidden",
        1: "Hair Hidden",
        2: "Partial Hair",
        3: "Head Hidden",
    }.get(value, f"Unknown ({value})")
