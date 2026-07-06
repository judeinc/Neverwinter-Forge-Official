from __future__ import annotations

from pathlib import Path
from io import BytesIO
import base64
import json
import mimetypes
import shutil
import subprocess
import time
import uuid

from PIL import Image


MODEL_SUFFIXES = {".obj", ".fbx"}
TEXTURE_SUFFIXES = {".dds", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tga"}
DEFAULT_BLENDER_CANDIDATES = [
    Path(r"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 5.0\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 4.4\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"),
    Path(r"C:\Program Files\Blender Foundation\Blender 3.6\blender.exe"),
]
ID_MAP_EXACT_PALETTE = [
    "#000000", "#ff0000", "#00ff00", "#0000ff",
    "#ffff00", "#ff00ff", "#00ffff", "#ff8000",
    "#8000ff", "#00a0ff", "#80ff00", "#ff0080",
    "#ffffff", "#808080", "#800000", "#008000",
    "#000080",
]


def blender_bridge_status(root, blender_path=""):
    blender = resolve_blender_path(blender_path)
    script = blender_job_script(root)
    return {
        "available": bool(blender and script.is_file()),
        "blenderPath": str(blender) if blender else "",
        "scriptPath": str(script),
        "scriptAvailable": script.is_file(),
        "mode": "background-cli",
        "mcpAvailable": False,
        "message": "Blender bridge is available." if blender and script.is_file() else "Choose a Blender executable to enable 3D Bake Mode.",
    }


def run_blender_id_map_job(root, uploaded_files, options=None):
    options = options or {}
    blender = resolve_blender_path(options.get("blenderPath", ""))
    if not blender:
        raise ValueError("Blender was not found. Paste or choose blender.exe in Advanced 3D Bake settings.")

    script = blender_job_script(root)
    if not script.is_file():
        raise ValueError(f"Blender bridge script was not found: {script}")

    files = [item for item in uploaded_files if item.get("name")]
    model_file = next((item for item in files if Path(item["name"]).suffix.lower() in MODEL_SUFFIXES), None)
    if not model_file:
        raise ValueError("3D Bake Mode currently needs an OBJ or FBX model. Export MDBs to OBJ/FBX before using Blender.")

    job_root = Path(root) / "outputs" / "idmap_blender_jobs" / f"job-{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
    input_dir = job_root / "input"
    output_dir = job_root / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    model_path = write_uploaded_file(input_dir, model_file)
    texture_paths = []
    for item in files:
        if Path(item["name"]).suffix.lower() in TEXTURE_SUFFIXES:
            texture_paths.append(write_blender_texture_file(input_dir, item))

    job = {
        "modelPath": str(model_path),
        "texturePaths": [str(path) for path in texture_paths],
        "outputDir": str(output_dir),
        "textureSize": int(options.get("textureSize") or 1024),
        "chunkStrategy": options.get("chunkStrategy") or "spatial_grid",
        "views": options.get("views") or ["front", "back", "left", "right", "three_quarter"],
        "palette": options.get("palette") or [],
        "jobKind": "forge-idmap-blender-bake",
    }
    job_path = job_root / "job.json"
    job_path.write_text(json.dumps(job, indent=2), encoding="utf-8")

    cmd = [
        str(blender),
        "--background",
        "--factory-startup",
        "--python",
        str(script),
        "--",
        str(job_path),
    ]
    started = time.time()
    try:
        completed = subprocess.run(
            cmd,
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=int(options.get("timeoutSeconds") or 600),
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Blender ID map job timed out. Try a lower-poly model or increase the timeout.") from exc

    manifest_path = output_dir / "manifest.json"
    if completed.returncode != 0:
        log_excerpt = ((completed.stdout or "") + "\n" + (completed.stderr or ""))[-6000:]
        raise RuntimeError(f"Blender ID map job failed with exit code {completed.returncode}:\n{log_excerpt}")
    if not manifest_path.is_file():
        log_excerpt = ((completed.stdout or "") + "\n" + (completed.stderr or ""))[-6000:]
        raise RuntimeError(f"Blender did not produce an ID map manifest.\n{log_excerpt}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    quantize_manifest_id_maps(manifest)
    return {
        "jobDir": str(job_root),
        "elapsedSeconds": round(time.time() - started, 2),
        "blenderPath": str(blender),
        "manifest": embed_manifest_images(manifest),
        "stdoutTail": (completed.stdout or "")[-4000:],
        "stderrTail": (completed.stderr or "")[-4000:],
    }


def run_blender_apply_labels_job(root, job_dir, labels, options=None):
    options = options or {}
    blender = resolve_blender_path(options.get("blenderPath", ""))
    if not blender:
        raise ValueError("Blender was not found. Paste or choose blender.exe in Advanced 3D Bake settings.")

    script = blender_job_script(root)
    if not script.is_file():
        raise ValueError(f"Blender bridge script was not found: {script}")

    root_path = Path(root).resolve()
    job_path = Path(str(job_dir)).expanduser().resolve()
    allowed_root = (root_path / "outputs" / "idmap_blender_jobs").resolve()
    if allowed_root not in job_path.parents:
        raise ValueError("Blender job folder is outside the Forge output workspace.")

    original_job_path = job_path / "job.json"
    if not original_job_path.is_file():
        raise ValueError("Original Blender job was not found. Run 3D Bake again.")

    output_dir = job_path / "output" / f"ai-label-bake-{time.strftime('%Y%m%d-%H%M%S')}"
    output_dir.mkdir(parents=True, exist_ok=True)
    label_path = output_dir / "chunk_labels.json"
    label_path.write_text(json.dumps(labels, indent=2), encoding="utf-8")

    job = json.loads(original_job_path.read_text(encoding="utf-8"))
    job["outputDir"] = str(output_dir)
    job["jobKind"] = "forge-idmap-apply-labels"
    job["labelPath"] = str(label_path)
    job["textureSize"] = int(options.get("textureSize") or job.get("textureSize") or 1024)
    apply_job_path = output_dir / "apply_labels_job.json"
    apply_job_path.write_text(json.dumps(job, indent=2), encoding="utf-8")

    cmd = [
        str(blender),
        "--background",
        "--factory-startup",
        "--python",
        str(script),
        "--",
        str(apply_job_path),
    ]
    started = time.time()
    try:
        completed = subprocess.run(
            cmd,
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=int(options.get("timeoutSeconds") or 600),
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Blender label bake timed out. Try fewer chunks or a lower-poly model.") from exc

    manifest_path = output_dir / "manifest.json"
    if completed.returncode != 0:
        log_excerpt = ((completed.stdout or "") + "\n" + (completed.stderr or ""))[-6000:]
        raise RuntimeError(f"Blender label bake failed with exit code {completed.returncode}:\n{log_excerpt}")
    if not manifest_path.is_file():
        log_excerpt = ((completed.stdout or "") + "\n" + (completed.stderr or ""))[-6000:]
        raise RuntimeError(f"Blender label bake did not produce a manifest.\n{log_excerpt}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    quantize_manifest_id_maps(manifest)
    return {
        "jobDir": str(job_path),
        "elapsedSeconds": round(time.time() - started, 2),
        "blenderPath": str(blender),
        "manifest": embed_manifest_images(manifest),
        "stdoutTail": (completed.stdout or "")[-4000:],
        "stderrTail": (completed.stderr or "")[-4000:],
    }


def resolve_blender_path(raw_path=""):
    if raw_path:
        path = Path(str(raw_path).strip().strip('"')).expanduser()
        if path.is_file():
            return path.resolve()

    found = shutil.which("blender")
    if found:
        return Path(found).resolve()

    for path in DEFAULT_BLENDER_CANDIDATES:
        if path.is_file():
            return path.resolve()
    return None


def blender_job_script(root):
    return Path(root) / "tools" / "forge_blender_idmap_job.py"


def write_uploaded_file(folder, uploaded_file):
    name = Path(uploaded_file.get("name", "uploaded")).name
    path = unique_path(folder / name)
    path.write_bytes(uploaded_file.get("data", b""))
    return path


def write_blender_texture_file(folder, uploaded_file):
    name = Path(uploaded_file.get("name", "texture")).name
    data = uploaded_file.get("data", b"")
    try:
        image = Image.open(BytesIO(data)).convert("RGBA")
        path = unique_path(folder / f"{Path(name).stem}.png")
        image.save(path, format="PNG")
        return path
    except Exception:
        path = unique_path(folder / name)
        path.write_bytes(data)
        return path


def unique_path(path):
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    for index in range(1, 1000):
        candidate = path.with_name(f"{stem}-{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise ValueError(f"Could not create a unique path for {path.name}")


def embed_manifest_images(manifest):
    for item in manifest.get("images", []):
        path = Path(item.get("path", ""))
        if not path.is_file():
            continue
        mime_type, _ = mimetypes.guess_type(path)
        item["mimeType"] = mime_type or "image/png"
        item["imageData"] = base64.b64encode(path.read_bytes()).decode("ascii")
    return manifest


def quantize_manifest_id_maps(manifest):
    for item in manifest.get("images", []):
        if item.get("kind") not in {"baked_id_map", "ai_labeled_id_map"}:
            continue
        path = Path(item.get("path", ""))
        if not path.is_file():
            continue
        quantize_id_map_png(path)
        item["exactPalette"] = True


def quantize_id_map_png(path):
    palette = [hex_to_rgb(color) for color in ID_MAP_EXACT_PALETTE]
    image = Image.open(path).convert("RGBA")
    output_pixels = []
    for r, g, b, a in image.getdata():
        if a < 8:
            output_pixels.append((0, 0, 0, 0))
            continue
        nearest = min(palette, key=lambda color: color_distance((r, g, b), color))
        output_pixels.append((*nearest, 255))
    image.putdata(output_pixels)
    image.save(path, format="PNG")


def hex_to_rgb(hex_color):
    clean = hex_color.lstrip("#")
    return (int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))


def color_distance(left, right):
    return sum((left[index] - right[index]) ** 2 for index in range(3))
