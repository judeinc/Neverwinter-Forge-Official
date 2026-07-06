# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path


ROOT = Path.cwd()
DATA_DIRS = [
    "public",
    "presets",
    "workflows",
    "runtimes",
    "models",
    "tools",
]
DATA_FILES = [
    "README.md",
    "CHANGELOG.md",
    "depth_paths.example.json",
    "install_depth_models.bat",
    "Start Neverwinter Forge.bat",
]

datas = []
for folder in DATA_DIRS:
    path = ROOT / folder
    if path.exists():
        datas.append((str(path), folder))

for file_name in DATA_FILES:
    path = ROOT / file_name
    if path.exists():
        datas.append((str(path), "."))


a = Analysis(
    ['launch.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Neverwinter Forge',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['public\\assets\\neverwinter-forge-icon.ico'],
    contents_directory='.',
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Neverwinter Forge',
)
