from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from mdb_tools import clone_and_rename_models, collect_texture_names, inspect_mdb_file, scan_mdb_folder


SOURCE_ROOT = Path(r"E:\NWN2 Modding\Vanilla HHM")
OUTPUT_ROOT = ROOT / "outputs" / f"mdb-clone-qa-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
TEXTURE_FIELDS = ["baseTexture", "normalMap", "tintMask", "glowMap"]
TEXTURE_EXTENSIONS = {".dds", ".tga", ".png", ".jpg", ".jpeg", ".webp"}


def main() -> int:
    if not SOURCE_ROOT.exists():
        print(json.dumps({"error": f"Source folder does not exist: {SOURCE_ROOT}"}, indent=2))
        return 1

    scan = scan_mdb_folder(SOURCE_ROOT, recursive=False)
    models = scan["models"]
    source_hashes = {model["path"]: sha256(Path(model["path"])) for model in models}
    by_type = defaultdict(list)
    for model in models:
        job = build_job(model)
        if job:
            by_type[model["assetType"]].append(job)

    single_jobs = []
    for asset_type in sorted(by_type):
        single_jobs.append(by_type[asset_type][0])

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    single_result = run_clone_set("single-by-type", single_jobs)

    batch_results = []
    for asset_type in sorted(by_type):
        batch_results.append(run_clone_set(f"batch-{safe_folder_name(asset_type)}", by_type[asset_type]))

    source_mutations = []
    for model in models:
        current = sha256(Path(model["path"]))
        if current != source_hashes[model["path"]]:
            source_mutations.append(model["path"])

    report = {
        "sourceRoot": str(SOURCE_ROOT),
        "outputRoot": str(OUTPUT_ROOT),
        "sourceModelCount": len(models),
        "assetTypes": {asset_type: len(jobs) for asset_type, jobs in sorted(by_type.items())},
        "singleByType": single_result,
        "batchByType": batch_results,
        "sourceMutations": source_mutations,
    }
    (OUTPUT_ROOT / "qa-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if not failures(report) else 2


def run_clone_set(name: str, jobs: list[dict]) -> dict:
    output_dir = OUTPUT_ROOT / name
    output_dir.mkdir(parents=True, exist_ok=True)
    payload_jobs = [{"path": job["path"], "newName": job["newName"]} for job in jobs]
    result = clone_and_rename_models(payload_jobs, output_dir, conflict_mode="auto")
    validations = []
    result_by_source = {item["sourcePath"]: item for item in result.get("results", [])}
    for job in jobs:
        clone_result = result_by_source.get(job["path"])
        validations.append(validate_clone(job, clone_result, output_dir))
    return {
        "name": name,
        "outputDir": str(output_dir),
        "requested": len(jobs),
        "copied": result.get("copied", 0),
        "skipped": len(result.get("skipped", [])),
        "valid": sum(1 for item in validations if item["ok"]),
        "failed": sum(1 for item in validations if not item["ok"]),
        "validations": validations,
    }


def validate_clone(job: dict, clone_result: dict | None, output_dir: Path) -> dict:
    source_path = Path(job["path"])
    old_base = source_path.stem
    checks = []
    if not clone_result:
        return {
            "source": source_path.name,
            "target": job["newName"],
            "ok": False,
            "checks": [{"name": "clone result", "ok": False, "detail": "No result returned"}],
        }

    output_path = Path(clone_result["outputPath"])
    final_base = output_path.stem
    source_report = inspect_mdb_file(source_path, SOURCE_ROOT, collect_texture_names(SOURCE_ROOT, recursive=False))
    clone_report = inspect_mdb_file(output_path, output_dir, collect_texture_names(output_dir, recursive=True))

    source_packets = source_report.packets
    clone_packets = clone_report.packets
    checks.append(check("file exists", output_path.is_file(), str(output_path)))
    checks.append(check("packet count preserved", len(source_packets) == len(clone_packets), f"{len(source_packets)} -> {len(clone_packets)}"))
    checks.append(check("parseable clone", bool(clone_report.version and clone_packets), f"version {clone_report.version or 'unknown'}"))

    packet_failures = []
    texture_failures = []
    for source_packet, clone_packet in zip(source_packets, clone_packets):
        expected_name = renamed_value(source_packet.name, old_base, final_base)
        if expected_name != clone_packet.name:
            packet_failures.append({
                "packet": source_packet.index,
                "field": "name",
                "expected": expected_name,
                "actual": clone_packet.name,
            })

        for field in TEXTURE_FIELDS:
            source_value = (source_packet.material or {}).get(field, "")
            clone_value = (clone_packet.material or {}).get(field, "")
            expected_value = source_value
            if expected_value != clone_value:
                texture_failures.append({
                    "packet": source_packet.index,
                    "field": field,
                    "expected": expected_value,
                    "actual": clone_value,
                })

        if source_packet.signature == "SKIN":
            expected_skeleton = renamed_skeleton(source_packet.skeleton, old_base, final_base)
            if expected_skeleton != clone_packet.skeleton:
                packet_failures.append({
                    "packet": source_packet.index,
                    "field": "skeleton",
                    "expected": expected_skeleton,
                    "actual": clone_packet.skeleton,
                })

    checks.append(check("internal packet names", not packet_failures, packet_failures[:4]))
    checks.append(check("texture references reused", not texture_failures, texture_failures[:4]))
    checks.append(check("no old model base remains in packet names", not old_base_present_in_packet_names(clone_report, old_base), old_base))
    checks.append(check("final name usable", len(final_base.encode("utf-8")) <= 31, f"{final_base} ({len(final_base.encode('utf-8'))} bytes)"))
    copied_textures = [path.name for ext in TEXTURE_EXTENSIONS for path in output_dir.glob("*" + ext)]
    checks.append(check("no textures copied", not copied_textures, copied_textures[:4]))

    return {
        "assetType": job["assetType"],
        "source": source_path.name,
        "requestedTarget": f"{job['newName']}.mdb",
        "actualTarget": output_path.name,
        "ok": all(item["ok"] for item in checks),
        "checks": checks,
    }


def build_job(model: dict) -> dict | None:
    stem = Path(model["fileName"]).stem
    match = re.match(r"^(?P<prefix>[PA])_(?P<race>[A-Za-z0-9]{3})(?P<rest>_.*)$", stem)
    if not match:
        return None

    race = match.group("race").upper()
    gender = race[-1]
    if gender == "M":
        target = "EEM" if race != "EEM" else "HHM"
    elif gender == "F":
        target = "EEF" if race != "EEF" else "HHF"
    else:
        return None

    return {
        "path": model["path"],
        "assetType": model["assetType"],
        "newName": f"{match.group('prefix')}_{target}{match.group('rest')}",
    }


def renamed_value(value: str, old_base: str, final_base: str) -> str:
    if not value:
        return value
    if value.lower() == old_base.lower():
        return final_base
    if value.lower().startswith(old_base.lower()):
        return final_base + value[len(old_base):]
    return value


def race_code(value: str) -> str:
    match = re.match(r"^[A-Za-z]_([A-Za-z0-9]{3})(?:_|$)", value or "")
    return match.group(1).upper() if match else ""


def renamed_skeleton(value: str, old_base: str, final_base: str) -> str:
    old_race = race_code(old_base)
    new_race = race_code(final_base)
    if not value or not old_race or not new_race or old_race == new_race:
        return value
    old_skeleton_race = skeleton_race(old_race)
    new_skeleton_race = skeleton_race(new_race)
    if old_skeleton_race == new_skeleton_race:
        return value
    match = re.match(r"^(?P<prefix>[A-Za-z]_)(?P<race>[A-Za-z0-9]{3})(?P<suffix>_skel)$", value, re.IGNORECASE)
    if match and match.group("race").upper() == old_skeleton_race:
        return f"{match.group('prefix')}{new_skeleton_race}{match.group('suffix')}"
    return value


def skeleton_race(value: str) -> str:
    value = (value or "").upper()
    if len(value) == 3 and value[:2] == "OG":
        return f"OO{value[-1]}"
    return value


def old_base_present_in_packet_names(report, old_base: str) -> bool:
    old = old_base.lower()
    for packet in report.packets:
        if old in (packet.name or "").lower():
            return True
    return False


def check(name: str, ok: bool, detail) -> dict:
    return {"name": name, "ok": bool(ok), "detail": detail}


def failures(report: dict) -> list[dict]:
    failed = []
    if report["sourceMutations"]:
        failed.append({"sourceMutations": report["sourceMutations"]})
    for section in [report["singleByType"], *report["batchByType"]]:
        for validation in section["validations"]:
            if not validation["ok"]:
                failed.append(validation)
    return failed


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_folder_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").lower() or "models"


if __name__ == "__main__":
    raise SystemExit(main())
