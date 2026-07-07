from __future__ import annotations

import argparse
import csv
import html
import json
import math
import re
import shutil
import subprocess
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps, UnidentifiedImageError


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "model-repository" / "_working"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MODEL_EXTENSIONS = {".mdb", ".fbx", ".obj", ".glb", ".gltf"}
TEXTURE_EXTENSIONS = {".dds", ".png", ".jpg", ".jpeg", ".tga", ".tif", ".tiff", ".psd"}
SKIP_IMAGE_TOKENS = {
    "_metallic",
    "_roughness",
    "_normal",
    "_n.",
    "_orm",
    "upscaled",
    "upscale-source",
}
OUTFIT_BACK_VIEW_PREFIXES = (
    "modular-outfit-",
    "modular-armored-outfit-",
    "modular-robe-dress-",
    "creature-dog-leg-",
    "creature-devil-scale-",
)
OUTFIT_FRONT_PROMPT_TOKENS = (
    "image 1 is the outfit source",
    "image 1 is the dress, robe",
    "rebuild the source outfit",
    "dog leg creature body",
    "devil scale creature body",
)
NON_OUTFIT_PROMPT_TOKENS = (
    "id map",
    "flat color id",
    "bas-relief",
    "object to generate",
    "miniature",
)


@dataclass
class ImageRecord:
    path: str
    name: str
    thumb: str
    width: int
    height: int
    ahash: str
    mean_rgb: tuple[int, int, int]


@dataclass
class OutfitRecord:
    source_folder: str
    source_path: str
    zip_path: str
    suggested_id: str
    suggested_name: str
    category: str
    model_files: list[str]
    texture_files: list[str]
    candidate_images: list[ImageRecord]
    substance_ready: bool


@dataclass
class OutputRecord:
    path: str
    name: str
    thumb: str
    width: int
    height: int
    ahash: str
    mean_rgb: tuple[int, int, int]
    metadata: dict


@dataclass
class OutputPair:
    pair_key: str
    front: OutputRecord
    back: OutputRecord


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", value.strip()).strip("-")
    return slug.lower() or "outfit"


def relative_or_absolute(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def is_probable_preview_image(path: Path) -> bool:
    name = path.name.lower()
    if path.suffix.lower() not in IMAGE_EXTENSIONS:
        return False
    return not any(token in name for token in SKIP_IMAGE_TOKENS)


def image_record(path: Path, thumb_root: Path, label: str, base_root: Path) -> ImageRecord | None:
    try:
        with Image.open(path) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
            width, height = image.size
            thumb_path = make_thumbnail(image, path, thumb_root, label)
            return ImageRecord(
                path=relative_or_absolute(path, base_root),
                name=path.name,
                thumb=relative_or_absolute(thumb_path, base_root),
                width=width,
                height=height,
                ahash=average_hash(image),
                mean_rgb=mean_rgb(image),
            )
    except (OSError, UnidentifiedImageError):
        return None


def make_thumbnail(image: Image.Image, source_path: Path, thumb_root: Path, label: str) -> Path:
    thumb_root.mkdir(parents=True, exist_ok=True)
    safe_name = slugify(source_path.stem)[:90]
    suffix = source_path.suffix.lower()
    thumb_path = thumb_root / f"{label}-{safe_name}.jpg"
    if thumb_path.exists():
        return thumb_path
    thumbnail = image.copy()
    thumbnail.thumbnail((240, 240), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (240, 240), (18, 20, 23))
    x = (240 - thumbnail.width) // 2
    y = (240 - thumbnail.height) // 2
    canvas.paste(thumbnail, (x, y))
    canvas.save(thumb_path, "JPEG", quality=86)
    return thumb_path


def average_hash(image: Image.Image) -> str:
    small = ImageOps.grayscale(image).resize((16, 16), Image.Resampling.LANCZOS)
    pixels = list(small.tobytes())
    avg = sum(pixels) / len(pixels)
    return "".join("1" if pixel >= avg else "0" for pixel in pixels)


def mean_rgb(image: Image.Image) -> tuple[int, int, int]:
    small = image.resize((1, 1), Image.Resampling.BOX)
    return tuple(int(channel) for channel in small.getpixel((0, 0)))


def hash_distance(left: str, right: str) -> int:
    return sum(a != b for a, b in zip(left, right))


def color_distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right))) / 441.67295593


def similarity_score(left: ImageRecord, right: OutputRecord) -> float:
    hash_score = hash_distance(left.ahash, right.ahash) / max(len(left.ahash), 1)
    color_score = color_distance(left.mean_rgb, right.mean_rgb)
    return round((hash_score * 0.72) + (color_score * 0.28), 4)


def color_word(rgb: tuple[int, int, int]) -> str:
    red, green, blue = rgb
    brightness = (red + green + blue) / 3
    if brightness < 58:
        return "Obsidian"
    if brightness > 210:
        return "Ivory"
    if abs(red - green) < 22 and abs(red - blue) < 22:
        return "Ashen" if brightness < 145 else "Silver"
    if red > green * 1.25 and red > blue * 1.25:
        return "Crimson" if red > 135 else "Umber"
    if blue > red * 1.18 and blue > green * 1.08:
        return "Azure"
    if green > red * 1.12 and green > blue * 1.08:
        return "Verdant"
    if red > 145 and green > 112 and blue < 92:
        return "Gilded"
    if red > 120 and blue > 120 and green < 110:
        return "Violet"
    return "Duskwoven"


def category_for_folder(name: str) -> tuple[str, str]:
    lower = name.lower()
    if "armor" in lower:
        return "armor", "Plate"
    if "dress" in lower:
        return "dress", "Robe"
    if "tunic" in lower:
        return "tunic", "Tunic"
    if "outfit" in lower:
        return "outfit", "Outfit"
    return "outfit", "Raiment"


def suggested_name(folder_name: str, images: list[ImageRecord], used: set[str]) -> str:
    _, noun = category_for_folder(folder_name)
    color = color_word(images[0].mean_rgb) if images else "Wayfarer"
    base = f"{color} {noun}"
    if base not in used:
        used.add(base)
        return base
    index = 2
    while True:
        candidate = f"{base} {index}"
        if candidate not in used:
            used.add(candidate)
            return candidate
        index += 1


def select_primary_model(files: list[Path]) -> Path | None:
    models = [item for item in files if item.suffix.lower() in {".obj", ".fbx"}]
    if not models:
        return None
    return sorted(
        models,
        key=lambda item: (
            0 if item.suffix.lower() == ".obj" else 1,
            1 if "_high" in item.stem.lower() else 0,
            len(item.parts),
            item.stat().st_size,
        ),
    )[0]


def select_primary_texture(files: list[Path], model: Path | None) -> Path | None:
    images = [item for item in files if item.suffix.lower() in IMAGE_EXTENSIONS and is_probable_preview_image(item)]
    if not images:
        return None
    preferred_tokens = ("basecolor", "diffuse", "albedo", "_d.")
    preferred = [item for item in images if any(token in item.name.lower() for token in preferred_tokens)]
    if preferred:
        if model:
            same_folder = [item for item in preferred if item.parent == model.parent]
            if same_folder:
                return sorted(same_folder, key=lambda item: item.name.lower())[0]
        return sorted(preferred, key=lambda item: item.name.lower())[0]
    if model:
        same_branch = [item for item in images if model.parent in item.parents or item.parent == model.parent]
        if same_branch:
            return sorted(same_branch, key=lambda item: item.name.lower())[0]
    return sorted(images, key=lambda item: item.name.lower())[0]


def render_model_previews(blender_exe: Path, model: Path, texture: Path | None, render_root: Path, folder_name: str) -> list[Path]:
    front_path = render_root / folder_name / "model-front.png"
    back_path = render_root / folder_name / "model-back.png"
    if front_path.exists() and back_path.exists():
        return [front_path, back_path]

    script_path = REPO_ROOT / "tools" / "render_outfit_preview_blender.py"
    command = [
        str(blender_exe),
        "--background",
        "--python",
        str(script_path),
        "--",
        "--model",
        str(model),
        "--front",
        str(front_path),
        "--back",
        str(back_path),
        "--size",
        "512",
    ]
    if texture:
        command.extend(["--texture", str(texture)])
    render_root.mkdir(parents=True, exist_ok=True)
    completed = subprocess.run(command, capture_output=True, text=True, timeout=180)
    if completed.returncode != 0:
        log_path = render_root / folder_name / "render-error.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text((completed.stdout or "") + "\n" + (completed.stderr or ""), encoding="utf-8", errors="replace")
        return []
    return [path for path in [front_path, back_path] if path.exists()]


def scan_outfits(models_root: Path, collection_id: str, thumb_root: Path, base_root: Path, blender_exe: Path | None, render_models: bool) -> list[OutfitRecord]:
    outfits = []
    used_names: set[str] = set()
    folders = sorted([item for item in models_root.iterdir() if item.is_dir()], key=lambda item: natural_sort_key(item.name))
    for index, folder in enumerate(folders, start=1):
        all_files = [item for item in folder.rglob("*") if item.is_file()]
        primary_model = select_primary_model(all_files)
        primary_texture = select_primary_texture(all_files, primary_model)
        rendered_images: list[ImageRecord] = []
        if render_models and blender_exe and primary_model:
            for render_path in render_model_previews(blender_exe, primary_model, primary_texture, base_root / "renders", folder.name):
                record = image_record(render_path, thumb_root / "renders", folder.name, base_root)
                if record:
                    rendered_images.append(record)
        candidate_images = [
            record for record in (
                image_record(path, thumb_root / "outfits", folder.name, base_root)
                for path in all_files
                if is_probable_preview_image(path)
            )
            if record is not None
        ]
        candidate_images = rendered_images + candidate_images
        category, _ = category_for_folder(folder.name)
        name = suggested_name(folder.name, candidate_images, used_names)
        zip_path = models_root / f"{folder.name}.zip"
        outfit_id = f"{collection_id}-{index:03d}-{slugify(name)}"
        outfits.append(
            OutfitRecord(
                source_folder=folder.name,
                source_path=str(folder),
                zip_path=str(zip_path) if zip_path.exists() else "",
                suggested_id=outfit_id,
                suggested_name=name,
                category=category,
                model_files=[str(item) for item in all_files if item.suffix.lower() in MODEL_EXTENSIONS],
                texture_files=[str(item) for item in all_files if item.suffix.lower() in TEXTURE_EXTENSIONS],
                candidate_images=candidate_images,
                substance_ready=any(part.lower() == "substance ready" for path in all_files for part in path.parts),
            )
        )
    return outfits


def natural_sort_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def load_metadata(image_path: Path) -> dict:
    metadata_path = image_path.with_suffix(".json")
    if not metadata_path.exists():
        return {}
    try:
        return json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def is_outfit_front_back_output(metadata: dict) -> bool:
    view_id = str(metadata.get("viewId") or "").lower()
    prompt = str(metadata.get("prompt") or "").lower()
    if any(token in prompt for token in NON_OUTFIT_PROMPT_TOKENS):
        return False
    if view_id == "front":
        return True
    if view_id.endswith("-back"):
        return any(view_id.startswith(prefix) for prefix in OUTFIT_BACK_VIEW_PREFIXES)
    return False


def should_scan_output(path: Path, metadata: dict) -> bool:
    if not is_probable_preview_image(path):
        return False
    lower = path.name.lower()
    return "qa" not in lower and "check" not in lower and is_outfit_front_back_output(metadata)


def scan_outputs(outputs_root: Path, thumb_root: Path, base_root: Path) -> list[OutputRecord]:
    records = []
    for path in sorted(outputs_root.rglob("*"), key=lambda item: item.name):
        if not path.is_file():
            continue
        metadata = load_metadata(path)
        if not should_scan_output(path, metadata):
            continue
        if metadata.get("mode") == "upscale":
            continue
        record = image_record(path, thumb_root / "outputs", "output", base_root)
        if record is None:
            continue
        records.append(
            OutputRecord(
                path=record.path,
                name=record.name,
                thumb=record.thumb,
                width=record.width,
                height=record.height,
                ahash=record.ahash,
                mean_rgb=record.mean_rgb,
                metadata=metadata,
            )
        )
    return records


def output_match_kind(output: OutputRecord) -> str:
    view_id = str(output.metadata.get("viewId", "")).lower()
    return "back" if view_id.endswith("-back") else "front"


def output_pair_key(output: OutputRecord) -> str:
    created_at = str(output.metadata.get("createdAt") or "").strip()
    if created_at:
        return created_at
    match = re.match(r"^(\d{8}-\d{6})", output.name)
    if match:
        return match.group(1)
    return output.name


def output_pairs(outputs: list[OutputRecord]) -> list[OutputPair]:
    fronts_by_name = {output.name: output for output in outputs if output_match_kind(output) == "front"}
    pairs_by_identity: dict[tuple[str, str], OutputPair] = {}
    for back in outputs:
        if output_match_kind(back) != "back":
            continue
        source_name = str(back.metadata.get("sourceName") or "").strip()
        front = fronts_by_name.get(source_name)
        if front:
            identity = (front.name, back.name)
            pairs_by_identity[identity] = OutputPair(pair_key=front.name, front=front, back=back)

    grouped: dict[str, dict[str, list[OutputRecord]]] = {}
    for output in outputs:
        grouped.setdefault(output_pair_key(output), {"front": [], "back": []})[output_match_kind(output)].append(output)

    for key, group in grouped.items():
        fronts = sorted(group["front"], key=lambda item: item.name)
        backs = sorted(group["back"], key=lambda item: item.name)
        for front in fronts:
            for back in backs:
                identity = (front.name, back.name)
                pairs_by_identity.setdefault(identity, OutputPair(pair_key=key, front=front, back=back))
    pairs = list(pairs_by_identity.values())
    return sorted(pairs, key=lambda item: (item.pair_key, item.front.name, item.back.name))


def best_image_score(outfit: OutfitRecord, output: OutputRecord) -> tuple[float, ImageRecord]:
    best_candidate = min(
        outfit.candidate_images,
        key=lambda image: similarity_score(image, output),
    )
    return similarity_score(best_candidate, output), best_candidate


def best_matches(outfit: OutfitRecord, outputs: list[OutputRecord], limit: int) -> list[dict]:
    if not outfit.candidate_images:
        return []
    ranked = []
    for output in outputs:
        score, best_candidate = best_image_score(outfit, output)
        ranked.append({
            "score": score,
            "matchKind": output_match_kind(output),
            "pairKey": output_pair_key(output),
            "sourceFolder": outfit.source_folder,
            "suggestedId": outfit.suggested_id,
            "suggestedName": outfit.suggested_name,
            "outfitImage": best_candidate.path,
            "outfitThumb": best_candidate.thumb,
            "outputImage": output.path,
            "outputThumb": output.thumb,
            "viewId": output.metadata.get("viewId", ""),
            "createdAt": output.metadata.get("createdAt", ""),
            "model": output.metadata.get("model", ""),
        })
    front = [item for item in ranked if item["matchKind"] == "front"]
    back = [item for item in ranked if item["matchKind"] == "back"]
    half = max(1, limit // 2)
    return sorted(front, key=lambda item: item["score"])[:half] + sorted(back, key=lambda item: item["score"])[:half]


def best_pair_matches(outfit: OutfitRecord, pairs: list[OutputPair], limit: int) -> list[dict]:
    if not outfit.candidate_images:
        return []
    ranked = []
    for pair in pairs:
        front_score, front_candidate = best_image_score(outfit, pair.front)
        back_score, back_candidate = best_image_score(outfit, pair.back)
        score = round((front_score + back_score) / 2, 4)
        ranked.append({
            "score": score,
            "frontScore": front_score,
            "backScore": back_score,
            "matchKind": "pair",
            "pairKey": pair.pair_key,
            "sourceFolder": outfit.source_folder,
            "suggestedId": outfit.suggested_id,
            "suggestedName": outfit.suggested_name,
            "frontOutfitImage": front_candidate.path,
            "frontOutfitThumb": front_candidate.thumb,
            "backOutfitImage": back_candidate.path,
            "backOutfitThumb": back_candidate.thumb,
            "frontOutputImage": pair.front.path,
            "frontOutputThumb": pair.front.thumb,
            "backOutputImage": pair.back.path,
            "backOutputThumb": pair.back.thumb,
            "frontViewId": pair.front.metadata.get("viewId", ""),
            "backViewId": pair.back.metadata.get("viewId", ""),
            "createdAt": pair.pair_key,
            "frontModel": pair.front.metadata.get("model", ""),
            "backModel": pair.back.metadata.get("model", ""),
        })
    return sorted(ranked, key=lambda item: item["score"])[:limit]


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: Iterable[dict]) -> None:
    rows = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def ledger_from_outfits(collection: str, outfits: list[OutfitRecord]) -> list[dict]:
    return [
        {
            "id": outfit.suggested_id,
            "name": outfit.suggested_name,
            "collection": collection,
            "sourceFolder": outfit.source_folder,
            "sourcePath": outfit.source_path,
            "zipPath": outfit.zip_path,
            "status": "needs-match-review",
            "driveUrl": "",
            "selectedFrontImage": "",
            "selectedBackImage": "",
            "notes": "",
            "tags": [outfit.category, "outfit"],
        }
        for outfit in outfits
    ]


def write_review_html(path: Path, collection: str, outfits: list[OutfitRecord], match_rows: list[dict], thumb_base: Path) -> None:
    matches_by_folder: dict[str, list[dict]] = {}
    for row in match_rows:
        matches_by_folder.setdefault(row["sourceFolder"], []).append(row)

    sections = []
    for outfit in outfits:
        previews = "".join(
            f'<figure><img src="{html.escape(image.thumb)}"><figcaption>{html.escape(image.name)}</figcaption></figure>'
            for image in outfit.candidate_images[:6]
        )
        front_matches = "".join(
            "<figure>"
            f'<img src="{html.escape(row["outputThumb"])}">'
            f'<figcaption>{html.escape(str(row["score"]))} · {html.escape(row["viewId"] or "front")}<br>{html.escape(Path(row["outputImage"]).name)}</figcaption>'
            "</figure>"
            for row in matches_by_folder.get(outfit.source_folder, [])
            if row.get("matchKind") == "front"
        )
        back_matches = "".join(
            "<figure>"
            f'<img src="{html.escape(row["outputThumb"])}">'
            f'<figcaption>{html.escape(str(row["score"]))} · {html.escape(row["viewId"] or "back")}<br>{html.escape(Path(row["outputImage"]).name)}</figcaption>'
            "</figure>"
            for row in matches_by_folder.get(outfit.source_folder, [])
            if row.get("matchKind") == "back"
        )
        sections.append(
            f"""
            <section class="outfit">
              <header>
                <div>
                  <h2>{html.escape(outfit.suggested_name)}</h2>
                  <p><code>{html.escape(outfit.suggested_id)}</code></p>
                </div>
                <p class="source">{html.escape(outfit.source_folder)} · {len(outfit.model_files)} model · {len(outfit.texture_files)} texture/image files</p>
              </header>
              <h3>Folder Images</h3>
              <div class="grid">{previews or '<p>No preview images found.</p>'}</div>
              <h3>Likely Front Matches</h3>
              <div class="grid">{front_matches or '<p>No likely front matches generated.</p>'}</div>
              <h3>Likely Back Matches</h3>
              <div class="grid">{back_matches or '<p>No likely back matches generated.</p>'}</div>
            </section>
            """
        )

    content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{html.escape(collection)} Repository Review</title>
  <style>
    body {{ margin: 0; font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; color: #e8edf2; background: #101316; }}
    main {{ max-width: 1280px; margin: 0 auto; padding: 28px; }}
    h1 {{ margin: 0 0 6px; font-size: 28px; }}
    h2 {{ margin: 0; font-size: 20px; }}
    h3 {{ margin: 18px 0 8px; color: #ffd76b; font-size: 13px; text-transform: uppercase; letter-spacing: 0; }}
    code {{ color: #f4d78d; }}
    .outfit {{ margin: 22px 0; padding: 18px; background: #1b2025; border: 1px solid #303942; border-radius: 8px; }}
    header {{ display: flex; justify-content: space-between; gap: 16px; align-items: start; border-bottom: 1px solid #303942; padding-bottom: 12px; }}
    .source {{ margin: 0; color: #a9b4bf; text-align: right; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }}
    figure {{ margin: 0; padding: 8px; background: #111417; border: 1px solid #2a323a; border-radius: 6px; }}
    img {{ display: block; width: 100%; aspect-ratio: 1; object-fit: contain; background: #0a0c0e; border-radius: 4px; }}
    figcaption {{ margin-top: 6px; color: #a9b4bf; font-size: 11px; overflow-wrap: anywhere; }}
  </style>
</head>
<body>
  <main>
    <h1>{html.escape(collection)} Repository Review</h1>
    <p>Use this sheet to approve names and front/back source matches before anything is copied into the public storefront.</p>
    {''.join(sections)}
  </main>
</body>
</html>
"""
    path.write_text(content, encoding="utf-8")


def write_pair_review_html(path: Path, collection: str, outfits: list[OutfitRecord], match_rows: list[dict], thumb_base: Path) -> None:
    matches_by_folder: dict[str, list[dict]] = {}
    for row in match_rows:
        matches_by_folder.setdefault(row["sourceFolder"], []).append(row)

    sections = []
    for outfit in outfits:
        previews = "".join(
            f'<figure><img src="{html.escape(image.thumb)}"><figcaption>{html.escape(image.name)}</figcaption></figure>'
            for image in outfit.candidate_images[:6]
        )
        pair_matches = "".join(
            "<figure class=\"pair\">"
            "<div class=\"pair-images\">"
            f'<img src="{html.escape(row["frontOutputThumb"])}" alt="front candidate">'
            f'<img src="{html.escape(row["backOutputThumb"])}" alt="back candidate">'
            "</div>"
            f'<figcaption>pair {html.escape(str(row["score"]))} | front {html.escape(str(row["frontScore"]))} | back {html.escape(str(row["backScore"]))}<br>'
            f'{html.escape(row["pairKey"])}<br>'
            f'F: {html.escape(Path(row["frontOutputImage"]).name)}<br>'
            f'B: {html.escape(Path(row["backOutputImage"]).name)}</figcaption>'
            "</figure>"
            for row in matches_by_folder.get(outfit.source_folder, [])
        )
        sections.append(
            f"""
            <section class="outfit">
              <header>
                <div>
                  <h2>{html.escape(outfit.suggested_name)}</h2>
                  <p><code>{html.escape(outfit.suggested_id)}</code></p>
                </div>
                <p class="source">{html.escape(outfit.source_folder)} | {len(outfit.model_files)} model | {len(outfit.texture_files)} texture/image files</p>
              </header>
              <h3>Folder Images</h3>
              <div class="grid">{previews or '<p>No preview images found.</p>'}</div>
              <h3>Likely Paired Front/Back Matches</h3>
              <div class="grid pairs">{pair_matches or '<p>No paired front/back matches generated.</p>'}</div>
            </section>
            """
        )

    content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{html.escape(collection)} Repository Review</title>
  <style>
    body {{ margin: 0; font: 14px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; color: #e8edf2; background: #101316; }}
    main {{ max-width: 1280px; margin: 0 auto; padding: 28px; }}
    h1 {{ margin: 0 0 6px; font-size: 28px; }}
    h2 {{ margin: 0; font-size: 20px; }}
    h3 {{ margin: 18px 0 8px; color: #ffd76b; font-size: 13px; text-transform: uppercase; letter-spacing: 0; }}
    code {{ color: #f4d78d; }}
    .outfit {{ margin: 22px 0; padding: 18px; background: #1b2025; border: 1px solid #303942; border-radius: 8px; }}
    header {{ display: flex; justify-content: space-between; gap: 16px; align-items: start; border-bottom: 1px solid #303942; padding-bottom: 12px; }}
    .source {{ margin: 0; color: #a9b4bf; text-align: right; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }}
    .pairs {{ grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); }}
    figure {{ margin: 0; padding: 8px; background: #111417; border: 1px solid #2a323a; border-radius: 6px; }}
    .pair-images {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
    img {{ display: block; width: 100%; aspect-ratio: 1; object-fit: contain; background: #0a0c0e; border-radius: 4px; }}
    figcaption {{ margin-top: 6px; color: #a9b4bf; font-size: 11px; overflow-wrap: anywhere; }}
  </style>
</head>
<body>
  <main>
    <h1>{html.escape(collection)} Repository Review</h1>
    <p>Use this sheet to approve paired front/back source matches before anything is copied into the public storefront.</p>
    {''.join(sections)}
  </main>
</body>
</html>
"""
    path.write_text(content, encoding="utf-8")


def prepare_out_dir(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for file_name in [
        "inventory.json",
        "name-ledger-draft.json",
        "output-images.json",
        "candidate-matches.csv",
        "review.html",
    ]:
        target = out_dir / file_name
        if target.exists():
            target.unlink()
    thumbnails = out_dir / "thumbnails"
    if thumbnails.exists():
        shutil.rmtree(thumbnails)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare a safe Model Repository review workspace.")
    parser.add_argument("--models-root", required=True, help="Folder containing outfit working folders and zips.")
    parser.add_argument("--outputs-root", required=True, help="Neverwinter Forge outputs folder.")
    parser.add_argument("--collection", default="July 2026", help="Human-readable collection name.")
    parser.add_argument("--collection-id", default="july-2026", help="Stable slug used for proposed outfit ids.")
    parser.add_argument("--out-dir", default="", help="Review output folder. Defaults to model-repository/_working/<collection-id>.")
    parser.add_argument("--top-matches", type=int, default=6, help="Likely Forge output matches to list for each outfit.")
    parser.add_argument("--render-models", action="store_true", help="Use Blender to render front/back previews from each outfit model.")
    parser.add_argument("--blender-exe", default="", help="Path to blender.exe. Required when --render-models if blender is not on PATH.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    models_root = Path(args.models_root).expanduser().resolve()
    outputs_root = Path(args.outputs_root).expanduser().resolve()
    if not models_root.exists():
        raise FileNotFoundError(f"Models root does not exist: {models_root}")
    if not outputs_root.exists():
        raise FileNotFoundError(f"Outputs root does not exist: {outputs_root}")
    blender_exe = None
    if args.render_models:
        blender_exe = Path(args.blender_exe).expanduser() if args.blender_exe else Path("blender")
        if args.blender_exe and not blender_exe.exists():
            raise FileNotFoundError(f"Blender executable does not exist: {blender_exe}")

    out_dir = Path(args.out_dir).expanduser() if args.out_dir else DEFAULT_OUT_DIR / args.collection_id
    if not out_dir.is_absolute():
        out_dir = REPO_ROOT / out_dir
    prepare_out_dir(out_dir)

    thumb_root = out_dir / "thumbnails"
    outfits = scan_outfits(models_root, args.collection_id, thumb_root, out_dir, blender_exe, args.render_models)
    outputs = scan_outputs(outputs_root, thumb_root, out_dir)
    pairs = output_pairs(outputs)

    match_rows: list[dict] = []
    for outfit in outfits:
        match_rows.extend(best_pair_matches(outfit, pairs, args.top_matches))

    inventory = {
        "collection": args.collection,
        "collectionId": args.collection_id,
        "modelsRoot": str(models_root),
        "outputsRoot": str(outputs_root),
        "outfitCount": len(outfits),
        "outputImageCount": len(outputs),
        "pairedOutputCount": len(pairs),
        "outfits": [asdict(outfit) for outfit in outfits],
    }
    write_json(out_dir / "inventory.json", inventory)
    write_json(out_dir / "name-ledger-draft.json", ledger_from_outfits(args.collection, outfits))
    write_json(out_dir / "output-images.json", [asdict(output) for output in outputs])
    write_csv(out_dir / "candidate-matches.csv", match_rows)
    write_pair_review_html(out_dir / "review.html", args.collection, outfits, match_rows, thumb_root.parent)

    print(f"Review workspace: {out_dir}")
    print(f"Outfits scanned: {len(outfits)}")
    print(f"Forge output images scanned: {len(outputs)}")
    print(f"Paired front/back output sets: {len(pairs)}")
    print(f"Candidate rows: {len(match_rows)}")
    print(f"Open review: {out_dir / 'review.html'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
