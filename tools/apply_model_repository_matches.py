from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LEDGER = REPO_ROOT / "model-repository" / "_working" / "july-2026" / "name-ledger-draft.json"
DEFAULT_STOREFRONT_ROOT = REPO_ROOT / "model-repository" / "outfits"
IMAGE_KEYS = {
    "selectedFrontImage": "front",
    "selectedBackImage": "back",
}


def load_ledger(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Ledger not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Ledger must be a JSON array.")
    return data


def resolve_image_path(raw_path: str, workspace_root: Path) -> Path:
    if not raw_path:
        return Path()
    path = Path(raw_path).expanduser()
    if path.is_absolute():
        return path
    candidates = [
        workspace_root / path,
        REPO_ROOT / path,
        Path(raw_path),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return (workspace_root / path).resolve()


def copy_image(source: Path, target_dir: Path, stem: str) -> Path:
    if not source.exists() or not source.is_file():
        raise FileNotFoundError(f"Selected image not found: {source}")
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{stem}{source.suffix.lower()}"
    shutil.copy2(source, target)
    return target


def load_metadata(image_path: Path) -> dict:
    metadata_path = image_path.with_suffix(".json")
    if not metadata_path.exists():
        return {}
    try:
        return json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def image_pair_key(image_path: Path) -> str:
    metadata = load_metadata(image_path)
    created_at = str(metadata.get("createdAt") or "").strip()
    if created_at:
        return created_at
    match = re.match(r"^(\d{8}-\d{6})", image_path.name)
    if match:
        return match.group(1)
    return ""


def is_derived_back_from_front(front_path: Path, back_path: Path) -> bool:
    metadata = load_metadata(back_path)
    return str(metadata.get("sourceName") or "").strip() == front_path.name


def validate_selected_pair(entry: dict, selected: dict[str, Path], allow_mixed_pairs: bool) -> None:
    if allow_mixed_pairs or entry.get("allowMixedPair") is True:
        return
    front_key = image_pair_key(selected["front"])
    back_key = image_pair_key(selected["back"])
    if not front_key or not back_key:
        raise ValueError("Selected front/back images need metadata or timestamp keys. Use --allow-mixed-pairs only for a deliberate manual exception.")
    if front_key != back_key:
        if is_derived_back_from_front(selected["front"], selected["back"]):
            return
        raise ValueError(f"Selected front/back images are from different output batches and the back is not derived from the front: front={front_key}, back={back_key}.")


def write_outfit_json(path: Path, entry: dict, front_name: str, back_name: str) -> None:
    payload = {
        "id": entry["id"],
        "name": entry["name"],
        "collection": entry.get("collection", ""),
        "sourceFolder": entry.get("sourceFolder", ""),
        "status": entry.get("status", "matched"),
        "description": entry.get("description", ""),
        "tags": entry.get("tags", []),
        "frontImage": front_name,
        "backImage": back_name,
        "downloadUrl": entry.get("driveUrl", ""),
        "packageHost": "google-drive" if entry.get("driveUrl") else "",
        "localSourcePath": entry.get("sourcePath", ""),
        "localZipPath": entry.get("zipPath", ""),
        "notes": entry.get("notes", ""),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def apply_entry(entry: dict, workspace_root: Path, storefront_root: Path, dry_run: bool, allow_mixed_pairs: bool) -> dict:
    outfit_id = str(entry.get("id") or "").strip()
    if not outfit_id:
        raise ValueError("Ledger entry is missing id.")
    source_path = Path(str(entry.get("sourcePath") or "")).expanduser()
    if not source_path.exists():
        raise FileNotFoundError(f"Source folder not found for {outfit_id}: {source_path}")

    selected = {}
    for key, label in IMAGE_KEYS.items():
        selected[label] = resolve_image_path(str(entry.get(key) or ""), workspace_root)
        if not selected[label]:
            raise ValueError(f"{outfit_id} is missing {key}.")
    validate_selected_pair(entry, selected, allow_mixed_pairs)

    local_references = source_path / "references"
    storefront_dir = storefront_root / outfit_id
    result = {
        "id": outfit_id,
        "name": entry.get("name", outfit_id),
        "sourceFolder": str(source_path),
        "localReferences": str(local_references),
        "storefrontFolder": str(storefront_dir),
        "copied": [],
    }

    if dry_run:
        for label, source in selected.items():
            result["copied"].append({"label": label, "source": str(source), "target": "dry-run"})
        return result

    local_front = copy_image(selected["front"], local_references, f"{outfit_id}-front")
    local_back = copy_image(selected["back"], local_references, f"{outfit_id}-back")
    storefront_front = copy_image(selected["front"], storefront_dir, "front")
    storefront_back = copy_image(selected["back"], storefront_dir, "back")
    write_outfit_json(storefront_dir / "outfit.json", entry, storefront_front.name, storefront_back.name)

    result["copied"].extend([
        {"label": "front-local-reference", "source": str(selected["front"]), "target": str(local_front)},
        {"label": "back-local-reference", "source": str(selected["back"]), "target": str(local_back)},
        {"label": "front-storefront", "source": str(selected["front"]), "target": str(storefront_front)},
        {"label": "back-storefront", "source": str(selected["back"]), "target": str(storefront_back)},
        {"label": "storefront-metadata", "source": "ledger", "target": str(storefront_dir / "outfit.json")},
    ])
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply approved Model Repository outfit image matches.")
    parser.add_argument("--ledger", default=str(DEFAULT_LEDGER), help="Approved name ledger JSON.")
    parser.add_argument("--workspace-root", default="", help="Base path for relative selected image paths. Defaults to ledger folder.")
    parser.add_argument("--storefront-root", default=str(DEFAULT_STOREFRONT_ROOT), help="Git storefront outfit folder.")
    parser.add_argument("--outfit", action="append", help="Apply only the specified outfit id. May be used more than once.")
    parser.add_argument("--dry-run", action="store_true", help="Preview copies without writing files.")
    parser.add_argument("--allow-mixed-pairs", action="store_true", help="Allow front/back images from different output batches for deliberate manual exceptions.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ledger_path = Path(args.ledger).expanduser()
    if not ledger_path.is_absolute():
        ledger_path = REPO_ROOT / ledger_path
    workspace_root = Path(args.workspace_root).expanduser() if args.workspace_root else ledger_path.parent
    if not workspace_root.is_absolute():
        workspace_root = REPO_ROOT / workspace_root
    storefront_root = Path(args.storefront_root).expanduser()
    if not storefront_root.is_absolute():
        storefront_root = REPO_ROOT / storefront_root

    ledger = load_ledger(ledger_path)
    requested = set(args.outfit or [])
    if requested:
        ledger = [entry for entry in ledger if entry.get("id") in requested]
    if not ledger:
        print("No ledger entries selected.")
        return 1

    results = []
    failures = 0
    for entry in ledger:
        try:
            result = apply_entry(entry, workspace_root, storefront_root, args.dry_run, args.allow_mixed_pairs)
            results.append(result)
            print(f"{'DRY ' if args.dry_run else ''}OK {result['id']} - {result['name']}")
        except Exception as exc:
            failures += 1
            print(f"FAIL {entry.get('id', '<missing-id>')}: {exc}")

    report_path = ledger_path.parent / ("apply-dry-run-report.json" if args.dry_run else "apply-report.json")
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Report: {report_path}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
