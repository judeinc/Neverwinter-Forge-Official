# Neverwinter Forge

Standalone local multi-tool app for fixed-prompt AI image generation, view generation, post-production upscaling, ComfyUI-backed depth/normal map generation, and Neverwinter Nights 2 MDB model workflows.

## Run

For the packaged release, double-click:

```text
Neverwinter Forge.exe
```

For the source version, double-click:

```text
Start Neverwinter Forge.bat
```

The launcher starts the local app server and opens `http://127.0.0.1:8765/` automatically.

If the app is already running, the launcher opens the browser without starting a second server.

## Build a Distribution

From the source folder, run:

```text
python -m PyInstaller --noconfirm "Neverwinter Forge.spec"
```

The built app folder is created at:

```text
dist\Neverwinter Forge
```

To distribute the app, zip the whole built folder. Do not send only `Neverwinter Forge.exe`; the adjacent `public`, `presets`, `workflows`, `runtimes`, and `models` folders are part of the release.

## Requirements

### Packaged EXE Release

- Windows
- A Gemini API key or OpenAI API key for paid generation modes
- No API key is needed for Mock mode

Python is bundled into the packaged EXE release.

### Source Version

- Windows
- Python 3.10 or newer
- A Gemini API key or OpenAI API key for paid generation modes
- No API key is needed for Mock mode

The included local upscaler runtime does not require ComfyUI.

The Depth & Normal Maps tool uses a hidden ComfyUI workflow. Neverwinter Forge auto-detects common ComfyUI locations, including:

- `ComfyUI\` next to `Neverwinter Forge.exe`
- `ComfyUI-Easy-Install\ComfyUI\` next to `Neverwinter Forge.exe`
- `ComfyUI_windows_portable\ComfyUI\` next to `Neverwinter Forge.exe`
- Common `C:\ComfyUI...`, user-folder, and ComfyUI Desktop AppData installs
- ComfyUI server running. Neverwinter Forge auto-detects classic ComfyUI on `http://127.0.0.1:8188` and ComfyUI Desktop on `http://127.0.0.1:8000`.

If no ComfyUI install is found, Neverwinter Forge falls back to this app-local model folder:

```text
models\comfyui\
```

Depth models should be placed under that folder using normal ComfyUI subfolders, for example:

```text
models\comfyui\diffusion_models\
models\comfyui\vae\
models\comfyui\upscale_models\
```

Important: if models are kept in Neverwinter Forge's `models\comfyui\` fallback folder, ComfyUI must also be configured to read that folder through its `extra_model_paths.yaml`. Use `models\comfyui\extra_model_paths_neverwinter.example.yaml` as a starting point and replace the `base_path` with the full path to your extracted app folder.

For custom locations, set these environment variables before starting the app:

```text
NEVERWINTER_COMFYUI_ROOT=C:\Path\To\ComfyUI
NEVERWINTER_COMFYUI_MODELS_ROOT=C:\Path\To\ComfyUI\models
NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT=C:\Path\To\ComfyUI\custom_nodes
NEVERWINTER_COMFYUI_URL=http://127.0.0.1:8000
```

Or copy `depth_paths.example.json` to `depth_paths.json` and edit the paths:

```json
{
  "comfyUrl": "http://127.0.0.1:8000",
  "comfyRoot": "C:\\Path\\To\\ComfyUI",
  "modelsRoot": "C:\\Path\\To\\ComfyUI\\models",
  "customNodesRoot": "C:\\Path\\To\\ComfyUI\\custom_nodes"
}
```

Run `install_depth_models.bat` to install/check the expected Lotus/VAE/upscale model files and custom nodes. The installer is designed to place files directly into ComfyUI's own `models` and `custom_nodes` folders so users do not need to edit `extra_model_paths.yaml`.

The installer can also download the required Lotus/VAE files and clone the required custom nodes into the detected ComfyUI folders. Restart ComfyUI after running it.

If no ComfyUI install is detected, the installer stops and asks the user to install ComfyUI Desktop or configure `depth_paths.json`. The `models\comfyui\` folder is only an advanced/manual fallback.

## First Use

1. Extract the zip.
2. Double-click `Neverwinter Forge.exe` in the packaged release, or `Start Neverwinter Forge.bat` in the source version.
3. Use `Mock` mode to test the interface for free.
4. Paste your own Gemini or OpenAI API key for real image generation.
5. Generated outputs are saved automatically in `outputs/`.

## Current Workflows

- D&D Miniature: image-to-image front, back, and 3/4 view workflow.
- Modular Outfit - Male: image-to-image locked-silhouette outfit workflow.
- Modular Outfit - Female: image-to-image locked-silhouette outfit workflow.
- Dog Leg Creature: image-to-image creature outfit workflow for gnoll, werewolf, catlike, lizardlike, and other dog-leg skeleton bodies with widened-arm front/back mannequin references and side-view tail/profile handling.
- Devil Scale Creature: image-to-image creature outfit workflow for devilish skeleton bodies using the Devil Scale front/profile silhouette while letting Misc define the actual head, horns, face, and creature identity.
- Object Concept: text-to-image object workflow with front, back, and side views.
- Post-Production: local 2x/4x upscaling.
- Depth & Normal Maps: local ComfyUI workflow outputting depth and normal maps from an image.
- Model Batch Tools: clone and rename MDB files while preserving source files and texture references.
- Model Batch Editor: edit MDB flags, material values, and texture references in place.
- Edit + Clone: edit selected MDB settings and write edited clone copies.

## Files

- `outputs/`: generated images and metadata.
- `presets/`: workflow prompts and reference images.
- `public/`: app interface.
- `mdb_tools.py`: Neverwinter Nights 2 MDB scan, clone, edit, and preview logic.
- `runtimes/`: bundled local upscaler runtime.

## Notes

API keys are stored in the browser for this local release. This is intended for private local use, not public hosted use.
