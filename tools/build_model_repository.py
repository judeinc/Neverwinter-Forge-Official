from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = REPO_ROOT / "model-repository" / "catalog.json"
DEFAULT_PACKAGE_ROOT = REPO_ROOT / "model-repository" / "packages"


ASSET_GROUPS = {
    "originalFront": ("images/original", "front"),
    "originalBack": ("images/original", "back"),
    "generatedFront": ("images/generated", "front"),
    "generatedBack": ("images/generated", "back"),
}


LIST_GROUPS = {
    "modelFiles": "models",
    "textureFiles": "textures",
}


@dataclass(frozen=True)
class PackageFile:
    source: Path
    archive_path: str


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip("-._")
    return slug.lower() or "outfit"


def load_catalog(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Catalog not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_asset_path(raw_path: str, source_root: Path | None) -> Path | None:
    if not raw_path:
        return None
    candidate = Path(raw_path).expanduser()
    if candidate.is_absolute():
        return candidate
    if source_root is not None:
        rooted = source_root / candidate
        if rooted.exists():
            return rooted
    return REPO_ROOT / candidate


def resolve_source_root(raw_path: str) -> Path | None:
    if not raw_path:
        return None
    source_root = Path(raw_path).expanduser()
    if not source_root.is_absolute():
        source_root = REPO_ROOT / source_root
    return source_root


def unique_archive_path(path: str, used_paths: set[str]) -> str:
    archive_path = path.replace("\\", "/")
    if archive_path not in used_paths:
        used_paths.add(archive_path)
        return archive_path

    base = Path(archive_path)
    stem = base.stem
    suffix = base.suffix
    parent = base.parent.as_posix()
    index = 2
    while True:
        candidate_name = f"{stem}-{index}{suffix}"
        candidate = candidate_name if parent == "." else f"{parent}/{candidate_name}"
        if candidate not in used_paths:
            used_paths.add(candidate)
            return candidate
        index += 1


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collect_files(outfit: dict) -> tuple[list[PackageFile], list[str]]:
    assets = outfit.get("assets", {})
    source_root = resolve_source_root(outfit.get("sourceRoot", ""))
    package_files: list[PackageFile] = []
    missing: list[str] = []
    used_paths: set[str] = set()

    for key, (folder, label) in ASSET_GROUPS.items():
        source = resolve_asset_path(str(assets.get(key, "")), source_root)
        if source is None:
            if key in {"originalFront", "originalBack"}:
                missing.append(key)
            continue
        if not source.exists() or not source.is_file():
            missing.append(f"{key}: {source}")
            continue
        archive_name = f"{folder}/{label}{source.suffix.lower()}"
        package_files.append(PackageFile(source, unique_archive_path(archive_name, used_paths)))

    for key, folder in LIST_GROUPS.items():
        for raw_path in assets.get(key, []):
            source = resolve_asset_path(str(raw_path), source_root)
            if source is None:
                continue
            if not source.exists() or not source.is_file():
                missing.append(f"{key}: {source}")
                continue
            archive_name = f"{folder}/{source.name}"
            package_files.append(PackageFile(source, unique_archive_path(archive_name, used_paths)))

    notes = resolve_asset_path(str(assets.get("notes", "")), source_root)
    if notes is not None:
        if notes.exists() and notes.is_file():
            package_files.append(PackageFile(notes, unique_archive_path(f"docs/{notes.name}", used_paths)))
        else:
            missing.append(f"notes: {notes}")

    return package_files, missing


def build_package_manifest(outfit: dict, package_files: Iterable[PackageFile]) -> dict:
    files = []
    for item in package_files:
        files.append(
            {
                "path": item.archive_path,
                "sourceName": item.source.name,
                "size": item.source.stat().st_size,
                "sha256": file_digest(item.source),
            }
        )
    return {
        "version": 1,
        "id": outfit["id"],
        "name": outfit.get("name", outfit["id"]),
        "status": outfit.get("status", ""),
        "description": outfit.get("description", ""),
        "tags": outfit.get("tags", []),
        "parts": outfit.get("parts", []),
        "files": files,
    }


def build_outfit(outfit: dict, package_root: Path, dry_run: bool) -> int:
    outfit_id = slugify(str(outfit.get("id", "")))
    if not outfit_id:
        print("Skipping outfit without an id.", file=sys.stderr)
        return 1

    package_files, missing = collect_files(outfit)
    package_path = package_root / f"{outfit_id}.zip"

    print(f"\n{outfit_id}")
    print(f"  package: {package_path.relative_to(REPO_ROOT)}")
    for item in package_files:
        print(f"  + {item.archive_path} <- {item.source}")
    for item in missing:
        print(f"  ! missing {item}")

    if missing:
        print("  skipped: missing required or declared assets")
        return 1
    if dry_run:
        print("  dry-run: package not written")
        return 0

    package_root.mkdir(parents=True, exist_ok=True)
    manifest = build_package_manifest(outfit, package_files)
    with zipfile.ZipFile(package_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, indent=2))
        for item in package_files:
            archive.write(item.source, item.archive_path)
    print("  written")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Model Repository outfit zip packages.")
    parser.add_argument("--catalog", default=str(CATALOG_PATH), help="Path to the model repository catalog JSON.")
    parser.add_argument("--outfit", help="Build only this outfit id.")
    parser.add_argument("--dry-run", action="store_true", help="Preview package contents without writing zips.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    catalog_path = Path(args.catalog).expanduser()
    if not catalog_path.is_absolute():
        catalog_path = REPO_ROOT / catalog_path

    catalog = load_catalog(catalog_path)
    package_root = Path(catalog.get("packageRoot") or DEFAULT_PACKAGE_ROOT).expanduser()
    if not package_root.is_absolute():
        package_root = REPO_ROOT / package_root

    outfits = catalog.get("outfits", [])
    if args.outfit:
        requested = slugify(args.outfit)
        outfits = [item for item in outfits if slugify(str(item.get("id", ""))) == requested]
        if not outfits:
            print(f"No outfit found with id: {args.outfit}", file=sys.stderr)
            return 1

    if not outfits:
        print("No outfits found in the Model Repository catalog.")
        return 0

    failures = 0
    for outfit in outfits:
        failures += build_outfit(outfit, package_root, args.dry_run)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
