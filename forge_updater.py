import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import zipfile
from datetime import datetime
from pathlib import Path


PRESERVE_NAMES = {"outputs", "updates", "runtimes", "ForgeUpdater.exe"}
PRESERVE_FILES = {"depth_paths.json", "presets/extra_prompt.txt"}


def log(message):
    print(f"[ForgeUpdater] {message}", flush=True)


def wait_for_pid_windows(pid, timeout):
    try:
        import ctypes

        synchronize = 0x00100000
        wait_timeout = 0x00000102
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(synchronize, False, int(pid))
        if not handle:
            return
        try:
            start = time.time()
            while time.time() - start < timeout:
                result = kernel32.WaitForSingleObject(handle, 500)
                if result != wait_timeout:
                    return
        finally:
            kernel32.CloseHandle(handle)
    except Exception:
        time.sleep(min(timeout, 5))


def wait_for_parent(pid, timeout=90):
    if not pid:
        return
    log(f"Waiting for Forge process {pid} to exit...")
    if os.name == "nt":
        wait_for_pid_windows(pid, timeout)
        return
    start = time.time()
    while time.time() - start < timeout:
        try:
            os.kill(pid, 0)
        except OSError:
            return
        time.sleep(0.5)


def copytree_filtered(src, dst, skip_root_names=None):
    skip_root_names = skip_root_names or set()
    src = Path(src)
    dst = Path(dst)
    for item in src.iterdir():
        if item.name in skip_root_names:
            continue
        target = dst / item.name
        if item.is_dir():
            shutil.copytree(item, target, dirs_exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)


def remove_existing_app_files(target, payload_root):
    for item in payload_root.iterdir():
        target_item = target / item.name
        if item.name in PRESERVE_NAMES:
            continue
        if target_item.is_dir():
            shutil.rmtree(target_item)
        elif target_item.exists():
            target_item.unlink()


def restore_backup(backup_root, target):
    if not backup_root.exists():
        return
    log("Restoring previous Forge files from backup...")
    copytree_filtered(backup_root, target)


def capture_preserved_files(target):
    preserved = {}
    for rel_path in PRESERVE_FILES:
        path = target / rel_path
        if path.is_file():
            preserved[rel_path] = path.read_bytes()
    return preserved


def restore_preserved_files(target, preserved):
    for rel_path, content in preserved.items():
        path = target / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def find_payload_root(staging_root):
    children = [child for child in staging_root.iterdir() if child.name != "__MACOSX"]
    dirs = [child for child in children if child.is_dir()]
    files = [child for child in children if child.is_file()]
    if len(dirs) == 1 and not files:
        return dirs[0]
    return staging_root


def write_state(target, state):
    updates = target / "updates"
    updates.mkdir(parents=True, exist_ok=True)
    (updates / "update_state.json").write_text(json.dumps(state, indent=2), encoding="utf-8")


def apply_update(package_path, target, launch_path, parent_pid, version):
    package_path = Path(package_path).resolve()
    target = Path(target).resolve()
    launch_path = Path(launch_path).resolve() if launch_path else None
    updates = target / "updates"
    work_root = updates / "staging"
    backup_root = updates / "backups" / datetime.now().strftime("forge-backup-%Y%m%d-%H%M%S")

    wait_for_parent(parent_pid)

    if not package_path.is_file():
        raise FileNotFoundError(f"Update package not found: {package_path}")

    if work_root.exists():
        shutil.rmtree(work_root)
    work_root.mkdir(parents=True, exist_ok=True)
    backup_root.mkdir(parents=True, exist_ok=True)

    log(f"Extracting update package: {package_path.name}")
    with zipfile.ZipFile(package_path, "r") as archive:
        archive.extractall(work_root)

    payload_root = find_payload_root(work_root)
    if not any((payload_root / name).exists() for name in ["Neverwinter Forge.exe", "public", "presets", "launch.py"]):
        raise RuntimeError("Update package does not look like a Neverwinter Forge release folder.")

    log("Creating backup of current Forge files...")
    copytree_filtered(target, backup_root, skip_root_names=PRESERVE_NAMES)
    preserved_files = capture_preserved_files(target)

    try:
        log("Replacing Forge files...")
        remove_existing_app_files(target, payload_root)
        copytree_filtered(payload_root, target, skip_root_names=PRESERVE_NAMES)
        restore_preserved_files(target, preserved_files)
        write_state(target, {
            "status": "installed",
            "version": version,
            "installedAt": datetime.now().isoformat(timespec="seconds"),
            "message": f"Neverwinter Forge has been updated to {version}.",
            "backupPath": str(backup_root)
        })
    except Exception as exc:
        restore_backup(backup_root, target)
        write_state(target, {
            "status": "error",
            "version": version,
            "installedAt": datetime.now().isoformat(timespec="seconds"),
            "message": "Neverwinter Forge update failed and the previous files were restored.",
            "error": str(exc),
            "backupPath": str(backup_root)
        })
        raise
    finally:
        if work_root.exists():
            shutil.rmtree(work_root, ignore_errors=True)

    if launch_path and launch_path.exists():
        log("Relaunching Neverwinter Forge...")
        subprocess.Popen([str(launch_path)], cwd=str(target), close_fds=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Apply a Neverwinter Forge update package.")
    parser.add_argument("--package", required=True, help="Downloaded release ZIP path.")
    parser.add_argument("--target", required=True, help="Neverwinter Forge installation folder.")
    parser.add_argument("--launch", default="", help="Forge executable to relaunch after update.")
    parser.add_argument("--parent-pid", type=int, default=0, help="Forge process ID to wait for.")
    parser.add_argument("--version", default="", help="Version being installed.")
    args = parser.parse_args(argv)

    try:
        apply_update(args.package, args.target, args.launch, args.parent_pid, args.version)
        return 0
    except Exception as exc:
        log(f"Update failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
