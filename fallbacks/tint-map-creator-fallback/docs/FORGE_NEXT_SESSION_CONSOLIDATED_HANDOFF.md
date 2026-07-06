# Neverwinter Forge Consolidated Handoff Guide

Last updated: 2026-06-09

This document is the canonical pass-off guide for continuing Neverwinter Forge in another Codex session. It intentionally repeats important architecture, workflow, product, and safety context so the next session can begin work with minimal backtracking.

## Prime Directive

Neverwinter Forge is the primary project.

All future tools, add-ons, configurators, model utilities, AI workflows, and NWN2 modding helpers should be treated as parts of Neverwinter Forge unless the user explicitly asks for a separate standalone application. If another Codex chat creates an add-on, prototype, research artifact, tutorial kit, or configurator, bring it back into this Forge workspace as a module, page, endpoint, preset, runtime, or documentation section.

Do not split the project into multiple long-lived apps by default. The Forge should remain the central executable and user-facing hub.

## Canonical Workspace

Primary source workspace:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

Previous source snapshot folder:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-23\is-it-possible-to-create-a
```

MDBConfig/MDBCloner research and tutorial support material:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27
```

NWN2 graphics/shader research lives separately and is not runtime Forge code:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-29
C:\Users\Raymond Arellano\Documents\Codex\2026-05-30
```

The next session should open the primary source workspace first. Treat older Codex folders as snapshots/reference and the 2026-05-27 material as supporting MDB research/tutorial assets, not as the active app.

## Multi-Chat Workflow

Neverwinter Forge Official is intended to support many focused Codex chats.

Use the root/consolidation chat for project-wide decisions, handoff updates, final integration, packaging direction, and architecture questions. Use sub-chats for focused increments such as one feature, one bug, one UI pass, one prototype, one documentation task, or one packaging task.

Sub-chats may build temporary prototypes when isolation helps. Those prototypes are Forge-bound by default: the final useful work should migrate back into Neverwinter Forge Official unless Raymond explicitly requests a standalone app.

Read these files for the chat workflow:

```text
docs\FORGE_CHAT_SYSTEM.md
docs\FORGE_PROTOTYPE_TO_FORGE_WORKFLOW.md
docs\FORGE_SUBCHAT_STARTER_PROMPT.txt
```

## Current Product Identity

Name: Neverwinter Forge

Core audience: Neverwinter Nights 2 mod creators.

Secondary audience: artists, modders, tabletop creators, Blender users, image-to-3D users, and fantasy game asset creators who find the workflows useful outside NWN2.

The app should not be described as a generic game developer tool first. It is primarily for NWN2 mod creation, with broader utility as a secondary benefit.

## Current Latest Package

Latest package seen in this workspace:

```text
dist\NeverwinterForge-1.3.0-creature-forge.zip
```

Latest release folder:

```text
dist\NeverwinterForge-1.3.0-creature-forge
```

Important: the source changelog now documents the `1.2.x` Model Batch Tools / MDB Configurator work. Keep it current before each public release.

## Build And Run

Source run:

```text
Start Neverwinter Forge.bat
```

Packaged run:

```text
Neverwinter Forge.exe
```

Build command:

```text
python -m PyInstaller --noconfirm "Neverwinter Forge.spec"
```

The spec file bundles runtime folders next to the EXE. Do not distribute only the EXE.

Required release folder contents:

```text
Neverwinter Forge.exe
_internal\
public\
presets\
workflows\
runtimes\
models\
README.md
CHANGELOG.md
depth_paths.example.json
install_depth_models.bat
Start Neverwinter Forge.bat
outputs\
```

The `.spec` uses `contents_directory='.'` so the `_internal` files and data folders live beside the launcher in the built folder.

## High-Level App Structure

Neverwinter Forge is a local Python HTTP app with static HTML/CSS/JS pages.

Entry points:

```text
launch.py
app.py
public\
presets\
workflows\
mdb_tools.py
```

`launch.py` starts the local server, opens the browser, and chooses an available port starting at `127.0.0.1:8765`.

`app.py` is the main server, API, generation, upscaler, depth, and MDB routing layer.

`mdb_tools.py` is the binary MDB scanner/editor/cloner/preview engine.

`public\index.html` is the AI Forge workspace.

`public\model-tools.html` is the Model Batch Tools workspace.

`public\model-editor.html` is the Model Batch Editor workspace.

`public\model-edit-clone.html` is the Edit + Clone workspace.

`public\id-map-creator.html` is the ID Map Creator / Tint Map Maker workspace.

`public\app.js` powers AI Forge.

`public\model-tools.js` powers Model Batch Tools and MDB preview behavior.

`public\model-editor.js` powers both Model Batch Editor and Edit + Clone behavior.

`public\id-map-creator.js` powers MDB UV canvas drawing, UV island color assignment, diffuse/normal underlays, exact-color PNG export, and undo/redo for ID maps.

`public\styles.css` contains shared styling for the Forge UI and model pages.

`public\vendor\jquery-3.7.1.min.js` is bundled locally.

`public\vendor\babylon.js` is bundled locally for MDB preview rendering.

## Top-Level Routes

AI Forge:

```text
/
```

Model Batch Tools:

```text
/model-tools
/models
```

Model Batch Editor:

```text
/model-editor
/mdb-editor
```

Edit + Clone:

```text
/model-edit-clone
/model-clone-editor
```

ID Map Creator / Tint Map Maker:

```text
/id-map-creator
/tint-map-maker
```

These routes are served from `app.py` and should stay inside the one Forge app.

## API Routes

AI/image routes:

```text
GET  /api/presets
GET  /api/extra-prompt
POST /api/extra-prompt
GET  /api/pricing
POST /api/generate
GET  /api/outputs/status
POST /api/outputs/open
```

Upscaler routes:

```text
GET  /api/upscaler/status
POST /api/upscaler/download
POST /api/upscaler/upscale
```

Depth/normal routes:

```text
GET  /api/depth/status
POST /api/depth/process
```

MDB/model routes:

```text
POST /api/mdb/scan
POST /api/mdb/upload
POST /api/mdb/clone
POST /api/mdb/flags
POST /api/mdb/edit-clone
POST /api/mdb/edit-clone-upload
POST /api/mdb/conflicts
POST /api/mdb/preview
POST /api/mdb/delete-created
```

ID map routes:

```text
POST /api/idmap/extract
POST /api/idmap/texture-underlay
POST /api/idmap/suggest
POST /api/idmap/blender/status
POST /api/idmap/blender/run
POST /api/idmap/blender/analyze-chunks
POST /api/idmap/blender/apply-labels
```

System helper route:

```text
POST /api/dialog/folder
```

## AI Forge Workflows

Preset manifest:

```text
presets\presets.json
```

Current preset groups:

```text
miniature
modular-outfit-male
modular-outfit-female
modular-armored-outfit-male
modular-armored-outfit-female
modular-robe-dress-male
modular-robe-dress-female
creature-dog-leg
creature-devil-scale
object-concept
open-prompt
bas-relief-emblem
bas-relief-emblem-concept
shield-emblem
views
```

### D&D Miniature

Preset id:

```text
miniature
```

Prompt:

```text
presets\miniature\prompt.txt
```

Primary behavior:

- Image-to-image.
- Creates orthographic monochrome resin/clay miniature statue outputs.
- Designed for later image-to-3D or 3D modeling reference workflows.
- Has derived view buttons for back view and 3/4 view.

Derived view prompts:

```text
presets\views\back-view.txt
presets\views\three-quarter-view.txt
```

### Modular Outfit - Male

Preset id:

```text
modular-outfit-male
```

Prompt and profile:

```text
presets\modular-outfit-male\prompt.txt
presets\modular-outfit-male\profile.json
presets\modular-outfit-male\locked-silhouette.png
presets\modular-outfit-male\back-view.txt
```

Primary behavior:

- OpenAI provider by default.
- Image-to-image.
- Headless and handless outfit render.
- Uses locked NWN2-like silhouette reference.
- Intended for modular NWN2 outfit creation and later modeling/texturing.
- Derived back-view generation uses the approved front output plus the same silhouette reference.

Important prompt behavior:

- Should remove cloaks when the target is a modular outfit base, unless a cloak is specifically the intended item.
- Should avoid heraldic/faction insignias unless explicitly requested.
- Generic filigree and non-identifying armor engraving are acceptable.
- The silhouette must stay consistent.

### Modular Outfit - Female

Preset id:

```text
modular-outfit-female
```

Prompt and profile:

```text
presets\modular-outfit-female\prompt.txt
presets\modular-outfit-female\profile.json
presets\modular-outfit-female\locked-silhouette.png
presets\modular-outfit-female\back-view.txt
```

Behavior mirrors the male modular outfit workflow, but uses the female locked silhouette.

### Armored Outfit - Male

Preset id:

```text
modular-armored-outfit-male
```

Prompt and profile:

```text
presets\modular-armored-outfit-male\prompt.txt
presets\modular-armored-outfit-male\profile.json
presets\modular-armored-outfit-male\back-view.txt
```

Primary behavior:

- OpenAI provider by default.
- Image-to-image.
- Uses the male locked modular silhouette reference from `presets\modular-outfit-male\locked-silhouette.png`.
- Keeps the headless/handless T-pose modular outfit target.
- Allows pauldrons, shoulder guards, fur liners, belts, sashes, armor plates, trench coats, fitted long coats, and structured outer armor layers as long as the T-pose remains readable.
- Still forbids cloaks, capes, mantles, and free-hanging back physics cloth.
- Back view uses the generated front output as the source image plus the male silhouette reference.

### Armored Outfit - Female

Preset id:

```text
modular-armored-outfit-female
```

Prompt and profile:

```text
presets\modular-armored-outfit-female\prompt.txt
presets\modular-armored-outfit-female\profile.json
presets\modular-armored-outfit-female\back-view.txt
```

Primary behavior mirrors Armored Outfit - Male, but uses the female locked silhouette reference from:

```text
presets\modular-outfit-female\locked-silhouette.png
```

### Robe / Dress - Male

Preset id:

```text
modular-robe-dress-male
```

Prompt and profile:

```text
presets\modular-robe-dress-male\prompt.txt
presets\modular-robe-dress-male\profile.json
presets\modular-robe-dress-male\back-view.txt
```

Primary behavior:

- OpenAI provider by default.
- Image-to-image.
- Uses the male modular silhouette for upper-body width, T-pose, arm length, neck cutoff, and wrist cutoff.
- For ground-length robes, lower-body silhouette follows robe width and capped-bottom logic rather than leg separation.
- Feet are hidden for ground-length robes.
- Bottom hem should be capped/flattened with contact shadow so image-to-3D reads the garment as a closed volume, not a hollow interior.
- Cloaks and capes remain forbidden.

### Robe / Dress - Female

Preset id:

```text
modular-robe-dress-female
```

Prompt and profile:

```text
presets\modular-robe-dress-female\prompt.txt
presets\modular-robe-dress-female\profile.json
presets\modular-robe-dress-female\back-view.txt
```

Primary behavior:

- OpenAI provider by default.
- Image-to-image.
- Uses the female modular silhouette for upper-body width, T-pose, arm length, neck cutoff, and wrist cutoff.
- Ground-length dresses, gowns, and robes should hide feet and use a flat capped bottom with contact shadow.
- If source skirt length is knee-length or shorter, preserve skirt/legs according to the prompt rules.
- If source skirt goes significantly past the knees, convert toward full dress/gown behavior.
- Lower-body dress/robe coverage wins over the visible-skin option.

### Outfit Option Controls

AI Forge includes additional checkboxes for outfit-family presets:

```text
Source outfit has visible skin-like areas
Extreme Simplify
```

Visible skin-like areas:

- Preserves intentional exposed outfit areas instead of letting the model cover all skin with clothing or armor.
- Renders exposed areas as smooth matte skin-toned mannequin plastic/resin.
- Explicitly avoids realistic skin details such as pores, veins, sweat, scars, anatomy detail, and shine.
- Robe / Dress presets only preserve upper-body exposed areas; lower-body ground-length garments always close and cover.

Extreme Simplify:

- Strips embroidery, floral designs, filigree, icons, sigils, heraldry, logos, micro buckles, and noisy decorative detail.
- Keeps broad material categories and construction: leather, metal, cloth, padding, belts, seams, straps, armor plates, collars, cuffs, boots, and robe/dress hem rules.
- Intended as a clean-canvas workflow so the user can later repaint or redraw details onto a simplified PBR-readable model source.

### Creature Workflows

Current creature presets:

```text
creature-dog-leg
creature-devil-scale
```

Dog Leg Creature targets gnoll, werewolf, catlike, lizardlike, and other dog-leg skeleton bodies. It uses widened-arm front/back mannequin references, profile/three-quarter/tail-range references, Preset + Misc creature-type routing, OpenAI by default, Extreme Simplify by default, and strict straight-tail prompting for front/back/side views.

Devil Scale Creature targets devilish skeleton bodies. The front pass intentionally follows the mature modular outfit routing: image 1 is the outfit source and image 2 is the locked Devil Scale front silhouette. The profile reference is reserved for side/back derived views. Misc defines the actual creature head, horns, face, skin, scales, fur, and identity; the mannequin head/horns are placement only. Prompt rules require feet, claws, greaves, and armor to stay inside the rig footprint, and sashes, straps, tabards, loincloth strips, and hanging panels stop at mid-thigh for front, back, and side views.

Creature prompt work lives under:

```text
presets\creature-dog-leg\
presets\creature-devil-scale\
presets\presets.json
public\app.js
app.py
```

Creature presets require Preset + Misc mode so the uploaded image stays focused on outfit identity while Misc controls species and head/body surface intent.

### Derived Back/Side View Source Routing

Derived view buttons in `public\app.js` now call `loadGeneratedImageIntoInput()` before generation. This makes the generated front output become the main input image for the back/side request, matching Raymond's manual workaround.

The derived prompt is prepended with source-routing guidance:

- The uploaded image is the generated front-view output from the previous step.
- Treat that front output as the only source for outfit identity, materials, belts, straps, seams, silhouette, and proportions.
- Do not use, remember, restore, or reinterpret the original user input image.

This matters most for outfit back views, where belts/sashes/waistlines were sometimes drifting because the model appeared to reinterpret the original source image rather than the generated front output.

### Object Concept

Preset id:

```text
object-concept
```

Prompt:

```text
presets\object-concept\prompt.txt
```

Derived prompts:

```text
presets\object-concept\back-view.txt
presets\object-concept\side-view.txt
```

Primary behavior:

- Text-to-image.
- Asks the user what object they want generated.
- Produces orthographic object/prop render for AI-to-3D and Blender cleanup workflows.
- Supports front, back, and side view continuation.

### Open Prompt

Preset id:

```text
open-prompt
```

Prompt:

```text
presets\open-prompt\prompt.txt
```

Primary behavior:

- Freeform text-to-image or optional image-to-image generation.
- No fixed preset style except user prompt and provider controls.
- Useful for testing provider behavior, arbitrary prompt work, and one-off outputs.

### Bas-Relief Emblem

Preset id:

```text
bas-relief-emblem
```

Prompt:

```text
presets\bas-relief-emblem\prompt.txt
```

Primary behavior:

- Image-to-image.
- Fantasy bas-relief plate/emblem output.
- Designed for height-map, depth-map, sculpting, carving, and NWN2-style emblem workflows.
- Uses Gemini by default and recommends `gemini-3.1-flash-image-preview`.
- Has example images under `presets\bas-relief-emblem\examples`.
- Has Gemini output size and aspect ratio controls.

### Bas-Relief Concept

Preset id:

```text
bas-relief-emblem-concept
```

Prompt:

```text
presets\bas-relief-emblem\concept.txt
```

Primary behavior:

- Text-to-image.
- Same bas-relief family but driven from text instead of an input image.
- Uses Gemini by default and recommends `gemini-3.1-flash-image-preview`.

### Shield Emblem

Preset id:

```text
shield-emblem
```

Prompt:

```text
presets\shield-emblem\prompt.txt
```

Shape references:

```text
presets\shield-emblem\shape-references\shield-shape-1-01.png ... shield-shape-1-25.png
presets\shield-emblem\shape-references\shield-shape-2-01.png ... shield-shape-2-25.png
```

Reference images:

```text
bas-relief-emblem\depth-references\bas-relief-depth-1.png ... bas-relief-depth-6.png
```

Primary behavior:

- Image-to-image.
- Takes an uploaded motif/concept and adapts it into the inner face of a medieval/fantasy shield.
- Keeps the outer rim, bevel, rivets, construction, and central interior field separate.
- Uses Gemini by default and recommends `gemini-3.1-flash-image-preview`, but OpenAI is also supported.
- The UI exposes a shield shape picker below the input image.
- Random shield shape remains the default.
- Selecting a silhouette makes that shape the required outer contour.
- The picker shows selected state through label and badge.

Important assets:

- The current 50 shield shape references came from smoother silhouette-source PNG folders:
  - `C:\Users\Raymond Arellano\Downloads\shields\shields1_silhouette\6x`
  - `C:\Users\Raymond Arellano\Downloads\shields\shields2_silhouette\300ppi`
- Forge-normalized masks are 1024x1024, solid black interiors on white, with antialiased outer edges.
- Keep these as simple masks; do not replace them with stroked frame art unless the app logic changes.

Important prompt behavior:

- The uploaded motif should be redrawn as shield-native artwork, not stamped in the middle.
- If the source is a framed bas-relief/plaque/card, ignore its outer frame and recompose the useful subject/ornament across the shield interior.
- Interior artwork should primarily read as integrated shallow-to-medium bas-relief on the shield face.
- Color is allowed only as thin brushed paint, glaze, worn enamel, patina, or tint over sculpted forms.
- Avoid full-color sticker/decal behavior.
- Avoid picture-in-picture plaques, copied source borders, blank interiors, white source-image background, and generic heater shields when a selected silhouette is not a heater.

OpenAI selected-shape routing:

- `app.py` builds a Forge layout-control composite when a shield shape is selected.
- OpenAI receives:
  - image 1: muted grayscale Forge layout-control composite
  - image 2: original motif/source image
  - image 3: selected shield silhouette mask
  - preset reference images: six bas-relief depth/style references
- The grayscale composite is intentionally muted so it guides silhouette and motif placement without encouraging a pasted full-color decal.

Gemini selected-shape routing:

- Gemini receives the primary source image, selected silhouette mask, and preset references as inline data parts.
- The text before the selected silhouette says it is mandatory for the outer contour and only a shape/proportion guide.

Reference-image role:

- The six bas-relief references are for smooth sculptural height, rounded bevels, shallow-to-medium depth, contact-shadow quality, raised edge thickness, and molded relief transitions.
- Do not let future prompt edits allow copying their subjects, borders, cracks, symbols, or compositions.

## API Providers And Cost Display

Modes:

```text
mock
gemini
openai
```

Mock mode:

- No API key.
- Returns input image or placeholder text-to-image SVG.
- Useful for testing UI and output saving.

Gemini mode:

- Uses Google Generative Language API endpoint in `app.py`.
- Supports Gemini image models defined in pricing/config.
- Bas-relief workflows were tuned around Gemini 3.1 Flash Image Preview.

OpenAI mode:

- Uses OpenAI image generation/edit endpoint logic in `app.py`.
- Modular outfit tests were more consistent with OpenAI than Gemini.
- OpenAI Shield Emblem selected-shape edits use a three-image source order: control composite, motif/source, selected mask.

Costs:

- Pricing estimates are approximate.
- Session total is UI-side state.
- Do not treat cost estimate as billing truth.

## Outputs

All generated images and metadata should be auto-saved to:

```text
outputs\
```

The app also exposes browser download links, but those are not the primary save system. The autosaved local `outputs` folder is the important one.

Past issue:

- Browser Save Image actions could go to Downloads and confuse users.
- This was clarified with UI language and output panel behavior.

Rule:

- New generation features must call backend save helpers and write metadata.
- Do not rely only on browser downloads.

## Local Real-ESRGAN Upscaler

Runtime:

```text
runtimes\realesrgan
```

Model files:

```text
models\upscale\RealESRGAN_x2plus.pth
models\upscale\RealESRGAN_x4plus.pth
```

Current behavior:

- Upscaler is separate post-production UI below AI generation.
- User can load an image, upscale 2x or 4x, compare, clear input, and save.
- It does not require ComfyUI.

Past issue:

- Earlier comparison slider caused broken tiled-looking image display.
- The app moved toward side-by-side/controlled output rather than depending on the slider.

## Depth And Normal Maps

Workflow:

```text
workflows\Depthmaps_by_Jude_API.json
```

Important nodes:

```text
Input image node: 93
Depth output preview node: 96
Normal output preview node: 101
Source scale safety node: 104
```

Node 104 is important. It uses ComfyUI `ImageScaleToTotalPixels` to scale large input images to about 1 megapixel before Lotus processing. This was added because 4K inputs could balloon into huge RealESRGAN x4 outputs and make ComfyUI Desktop appear to hang.

ComfyUI support:

- Classic ComfyUI usually runs on `http://127.0.0.1:8188`.
- ComfyUI Desktop usually runs on `http://127.0.0.1:8000`.
- Forge auto-detects both.

Installer:

```text
install_depth_models.bat
```

Installer responsibilities:

- Detect ComfyUI root.
- Detect models folder.
- Detect custom nodes folder.
- Install/check Lotus models.
- Install/check VAE.
- Install/check RealESRGAN x4 model.
- Clone/install required custom nodes.
- Install custom node Python requirements into ComfyUI Desktop `.venv` or portable Python when detected.

Required custom nodes:

```text
ComfyUI-Lotus
ComfyUI_essentials
ComfyUI-WJNodes
```

Required model files:

```text
diffusion_models\lotus-depth-g-v2-1-disparity-fp16.safetensors
diffusion_models\lotus-depth-g-v1-0.safetensors
diffusion_models\lotus-depth-g-v1-0-fp16.safetensors
diffusion_models\lotus-depth-d-v-1-1-fp16.safetensors
diffusion_models\lotus-normal-g-v1-1-fp16.safetensors
vae\vae-ft-mse-840000-ema-pruned.safetensors
upscale_models\RealESRGAN_x4plus.pth
```

Known detection behavior:

- Auto-detects app-local ComfyUI folders next to EXE.
- Auto-detects common user folders.
- Auto-detects ComfyUI Desktop AppData/resource-style installs.
- Can be overridden with `depth_paths.json`.
- Can be overridden with environment variables.

Important rule:

If models are kept in Forge's local `models\comfyui` fallback folder, ComfyUI itself must also be configured to read that folder through `extra_model_paths.yaml`. Better default user path is installing the models into ComfyUI's own models folder through `install_depth_models.bat`.

## MDB Configurator / Model Tools Consolidation

The user refers to a rebuild/MDB configurator project. In the current file system, the implementation appears to have already been folded into this Forge app as the MDB model tools. The external `2026-05-27` material contains research, source examples, extracted MDBConfig/MDBCloner references, tutorial kits, and test MDB assets. It is supporting material, not the active app.

Canonical implementation files:

```text
mdb_tools.py
public\model-tools.html
public\model-tools.js
public\model-editor.html
public\model-edit-clone.html
public\model-editor.js
public\styles.css
app.py
```

Supporting/reference material:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\files-mentioned-by-the-user-mdbconfig
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Neverwinter Nights 2 MDB Conventions for a Modern Batch Editor.pdf
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Tutorial Demo MDBs
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Tools Tutorial Kit
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Editor Tutorial Kit
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Edit Clone Tutorial Kit
```

When continuing the configurator work:

- Do not start from the extracted old tools unless researching behavior.
- Start from `mdb_tools.py` and the Forge model pages.
- Use the old MDBConfig/MDBCloner material to verify field semantics and edge cases.
- Keep everything in the Forge executable.

## Current MDB Workspaces

### Model Batch Tools

Route:

```text
/model-tools
```

Files:

```text
public\model-tools.html
public\model-tools.js
```

Purpose:

- Scan a folder of NWN2 `.mdb` files.
- Classify model type.
- Display readiness/warnings.
- Clone/rename selected MDB files.
- Preserve source files.
- Preserve texture references unless explicitly edited in a different workflow.
- Preview MDB geometry through Babylon.

Server APIs used:

```text
/api/mdb/scan
/api/mdb/upload
/api/mdb/clone
/api/mdb/conflicts
/api/mdb/preview
/api/mdb/delete-created
/api/dialog/folder
```

### Model Batch Editor

Route:

```text
/model-editor
```

Files:

```text
public\model-editor.html
public\model-editor.js
```

Purpose:

- Scan/select MDB files.
- Edit flags, material values, behavior values, and texture references.
- Save edits over the selected MDB files.

Important safety behavior:

- This workflow is intentionally save-over.
- UI should make that clear.
- Batch editing should only apply shared edits across selected MDBs of the same model type.

### Edit + Clone

Route:

```text
/model-edit-clone
```

Files:

```text
public\model-edit-clone.html
public\model-editor.js
```

Purpose:

- Edit selected MDB settings.
- Write edited clone copies rather than overwriting source files.
- Limit active selected clone targets to one to three MDBs at a time.

Server APIs used:

```text
/api/mdb/edit-clone
/api/mdb/edit-clone-upload
```

## MDB Binary Engine

Core file:

```text
mdb_tools.py
```

Major public functions:

```text
scan_mdb_folder
scan_uploaded_mdb_files
clone_and_rename_models
clone_and_edit_models
clone_and_edit_uploaded_model
save_mdb_flag_edits
mdb_geometry_preview
```

Major internal responsibilities:

- Validate NWN2 MDB header.
- Parse packet table.
- Parse `RIGD`, `SKIN`, `COL2`, and `COL3` packets.
- Extract packet names.
- Extract skeleton references.
- Extract texture fields.
- Extract/edit material flags.
- Extract/edit behavior flags such as hair/helm behavior where applicable.
- Generate scan reports with warnings.
- Clone MDB bytes while preserving unedited packet data.
- Rewrite internal model names.
- Rewrite skeleton references.
- Preserve texture references unless edited.
- Provide geometry arrays for browser preview.

Important constants:

```text
TEXTURE_FIELD_KEYS = ["baseTexture", "normalMap", "tintMask", "glowMap"]
MATERIAL_PACKET_TYPES = {"RIGD", "SKIN", "COL2", "COL3"}
VISIBLE_PACKET_TYPES = {"RIGD", "SKIN"}
```

Material/texture flag labels:

```text
Cutout Alpha
Smooth Transparency
Additive FX Blend
Environment Reflection
Facial Animation Head
Use Glow Map
Do Not Cast Shadows
Receive Projected Textures
```

Behavior values:

```text
Hair: Low, Short, Ponytail
Helm: None Hidden, Hair Hidden, Partial Hair, Head Hidden
```

## Critical MDB Rules

These rules are more important than cosmetic UI decisions:

- Cloning writes MDB copies only.
- Cloning must not copy texture files such as DDS, TGA, PNG, JPG, or WEBP.
- Texture references remain the source MDB's references unless the user explicitly edits references.
- Race cloning replaces only the race/sex code by default and preserves the rest of the model name exactly, including the number.
- Number override must be explicit.
- Do not auto-increment file names during normal race clone behavior.
- Internal names must sync with the new external MDB file name.
- Skeleton references must sync when the race family changes.
- Preserve unknown packet bytes.
- Warn aggressively rather than silently corrupting a model.
- Do not alter geometry unless the feature is explicitly about geometry editing.
- Batch edits should only apply across compatible selected MDB types.
- Conflict handling must be visible before writing files.
- Generated files should be obvious and reversible where possible.

## NWN2 Race And Skeleton Rules

Common body race families:

```text
HH = human
EE = elf
DD = dwarf
GG = gnome
OO = orc / half-orc family
OG = gray orc body-wear naming
```

Gray orc special rule:

- Body-wear naming can use `OGM` / `OGF`.
- Skeleton family should map to orc skeleton family:

```text
P_OOM_skel
P_OOF_skel
```

This was a specific fix in the `1.2.2-gray-orc` package.

Heads and hair may use broader race/subrace families than standard body wear. Keep those broader options visible for head/hair tools, but do not let broad head/hair behavior accidentally change conservative body-wear cloning rules.

## Model Type Labels

User-facing model labels should remain understandable:

```text
body
boots
gloves
cloak
head
hair
armor part
weapon model
```

Typical name families:

```text
P_*_CL_Body##
P_*_CL_Boots##
P_*_CL_Gloves##
P_*_CL_Cloak##
P_*_Head##
P_*_Hair##
A_*_LShoulder##
A_*_RShoulder##
W_*
```

Do not overfit to only these examples; NWN2 content has variations.

## Browser MDB Preview

Preview stack:

```text
public\vendor\babylon.js
public\model-tools.js
mdb_geometry_preview in mdb_tools.py
```

Preview goal:

- Show enough geometry to help users identify files.
- Load local texture previews when possible.
- Avoid needing Blender just to inspect batch contents.

Preview is a helper, not the source of truth. Binary parsing and write safety matter more than viewer aesthetics.

## ID Map Creator / Tint Map Maker

Route:

```text
/id-map-creator
/tint-map-maker
```

Files:

```text
id_map_tools.py
public\id-map-creator.html
public\id-map-creator.js
public\styles.css
app.py
id_map_blender_bridge.py
tools\forge_blender_idmap_job.py
```

Purpose:

- Extract visible `RIGD` and `SKIN` UV triangles from an MDB, plus OBJ UV faces and best-effort ASCII FBX UV data.
- Normalize NWN2 negative-V UV coordinates into browser/image `0..1` texture space.
- Group connected UV triangles into islands.
- Let the user assign exact ID colors to UV islands on a 2D canvas.
- Optionally show diffuse/albedo and normal maps as underlays.
- Offer an AI Suggest Regions pre-pass that uses the MDB UV layout plus texture underlays to propose broad tintable chunks, then snaps the image result back to actual islands and exact palette colors.
- Offer workflow-method selection for ID Map Creator: staged Tripo AI Segmentation as the next primary path, Local Blender Helper Bake as fallback, and UV Island / Image Pass for simple/manual cases.
- Offer an advanced Blender 3D Bake path for OBJ/FBX that launches Blender in background mode, renders multi-view textured references, mesh-wire topology helpers, surface-normal helpers, matching chunk-ID helper views, geometric surface-color references, and a starter exact-palette ID map baked back to UV space.
- Offer an AI Analyze 3D Chunks pass that reviews Blender texture/chunk-ID helper views and returns structured broad-region labels for user inspection and manual correction.
- Offer an Apply AI Labels pass that maps reviewed labels and confidence values onto Blender chunks and bakes an AI-labeled ID map back through UV space.
- Export a hard-edged PNG ID/tint map using exact palette colors.

Important implementation rule:

- The deterministic Forge export is the source of truth. AI assistance, Blender MCP checks, and wrapped 3D previews should be later validation or suggestion layers, not the required path for creating a usable map.

## External MDBConfig/MDBCloner Research

Important research folder:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\files-mentioned-by-the-user-mdbconfig
```

Important research file:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\files-mentioned-by-the-user-mdbconfig\nwn2_mdb_research_extracted.txt
```

Important generated PDF:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Neverwinter Nights 2 MDB Conventions for a Modern Batch Editor.pdf
```

Use this material to understand:

- Why external filename and internal packet names must align.
- Why head/eye/FHair naming has special edge cases.
- Why simple file renaming is not safe.
- What MDBConfig exposed historically.
- What MDBCloner fixed historically.
- Why the Forge must warn about mismatches instead of pretending everything is fine.

Do not copy the old app UI directly unless the user asks. The Forge should provide a cleaner, consolidated workflow.

## Tutorial Assets

Tutorial support folders:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Tools Tutorial Kit
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Editor Tutorial Kit
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Edit Clone Tutorial Kit
```

Demo MDB files:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Tutorial Demo MDBs
```

Tutorial output:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Tutorial Demo Output
```

These are not runtime dependencies. Do not bundle tutorial kits into normal Forge release packages unless the user specifically wants a tutorial/sample package.

## UI And Design Language

The Forge visual style:

- Black/dark main background.
- Header logo asset: `public\assets\neverwinterforge-main-header.png`.
- Reflective thin gold trim around main panels.
- Dark utilitarian panels.
- Gold/silver hover sweeps on buttons.
- jQuery-assisted accordion/reveal effects where useful.
- No excessive decorative clutter.
- Tool-like interface, not a marketing landing page.

Primary user should feel:

- This is a focused modding forge.
- It is powerful but guided.
- It hides technical complexity without hiding important warnings.

Avoid:

- Generic SaaS/product marketing styling.
- Giant hero layouts inside tool pages.
- Excessive gradient effects that distract from output inspection.
- Ambiguous destructive controls.

## Packaging Rules

When building a release:

1. Run quick syntax checks:

```text
python -m py_compile app.py launch.py mdb_tools.py
python -m json.tool presets\presets.json
python -m json.tool workflows\Depthmaps_by_Jude_API.json
```

2. Build:

```text
python -m PyInstaller --noconfirm "Neverwinter Forge.spec"
```

3. Create a named version folder under `dist`.

4. Zip the whole named folder.

5. Confirm the zip contains:

```text
Neverwinter Forge.exe
public\
presets\
workflows\
runtimes\
models\
README.md
CHANGELOG.md
install_depth_models.bat
```

6. Do not ship only the EXE.

7. Do not include large tutorial videos in the runtime package.

8. Do not include private API keys.

9. Confirm `outputs\README.txt` exists in the package folder or is created at launch.

## Verification Checklist

Before giving the user a package, run as much of this as is practical:

```text
python -m py_compile app.py launch.py mdb_tools.py
python -m json.tool presets\presets.json
python -m json.tool workflows\Depthmaps_by_Jude_API.json
```

Manual UI checks:

- Open `/`.
- Confirm splash/header loads.
- Confirm preset buttons switch correctly.
- Confirm Mock generation saves to outputs.
- Confirm Open Outputs Folder works.
- Confirm upscaler status loads.
- Confirm Depth & Normal status loads and reports ready/missing/offline accurately.
- Open `/model-tools`.
- Scan a demo MDB folder.
- Confirm reports and warnings render.
- Preview at least one body/armor/weapon model.
- Clone one MDB to a test output directory.
- Confirm only MDB files are written.
- Confirm texture files are not copied.
- Confirm internal name changed.
- Confirm skeleton sync if race changed.
- Open `/model-editor`.
- Scan same demo folder.
- Confirm compatible batch selection behavior.
- Confirm editor shows flags/material/texture references.
- Use only test copies for save-over editing.
- Open `/model-edit-clone`.
- Confirm one-to-three target limit.
- Confirm edited clones are written without overwriting source.

Depth/normal checks:

- Start ComfyUI Desktop or classic ComfyUI.
- Click Refresh in Forge.
- Confirm status detects server and dependencies.
- Run a small image first.
- Run a 4K image only after confirming node 104 exists in the workflow.

## Known Historical Problems And Fixes

### Output Folder Confusion

Problem:

- Browser Save Image went to Downloads, while users expected Forge outputs.

Resolution:

- Backend autosaves outputs.
- UI explains autosaved path and browser copy separately.
- Packages include visible outputs folder/readme.

### Port Collision

Problem:

- Packaged launch could attach to another running Forge server and save into the wrong folder.

Resolution:

- `launch.py` starts a fresh server on the next available port instead of silently attaching.

### ComfyUI Desktop Missing Nodes

Problem:

- Custom nodes were copied but Desktop Python environment lacked requirements like `diffusers` and `librosa`.

Resolution:

- `install_depth_models.bat` now detects ComfyUI Python and installs custom node requirements.

### ComfyUI Desktop Hang On Depth Workflow

Problem:

- 4K source image plus Lotus plus RealESRGAN x4 could balloon output size and appear frozen.

Resolution:

- Workflow node 104 scales source to controlled 1-megapixel input before Lotus.

### Bas-Relief Aspect Ratio Ignored

Problem:

- Gemini bas-relief image-to-image preserved input image aspect ratio.

Resolution:

- App sends size/aspect settings through Gemini generation config and prompt text.

### Derived Back View Used Original Input Context

Problem:

- Back-view generation for outfits sometimes behaved as if it was deriving from the original user input image instead of the generated approved front output.
- Raymond confirmed that manually putting the generated front output back into the input panel and using a misc override produced better direct back views.

Resolution:

- `public\app.js` now loads the generated front output into the main input state before running derived back/side generation.
- Derived prompts also prepend explicit source-routing guidance that the uploaded image is the generated front output and the original input should not be used.

### Upscaler Tiling/Slider Display

Problem:

- Slider/comparison view made images look broken or tiled.

Resolution:

- Simplified comparison/output display and made upscaler a separate post-production section.

### Gray Orc Skeleton Sync

Problem:

- Gray orc body-wear uses `OGM`/`OGF` naming, but skeleton should use orc skeleton family.

Resolution:

- `1.2.2-gray-orc` package indicates this was patched. Confirm logic in `mdb_tools.py` before further edits.

## Current Gaps And Risks

### Codex Project Panel Cannot Be Programmatically Guaranteed

This document can define the canonical workspace and consolidation plan, but the Codex UI/project panel itself may need the user to pin/select the right workspace. If the next session starts elsewhere, the user should direct it back to:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

### External MDBConfig Material Is Research, Not Runtime

The extracted MDBConfig/MDBCloner material may include old tools, binaries, source snippets, test outputs, and PDFs. Do not mix it blindly into runtime. Use it to validate Forge behavior.

### Save-Over Editor Is Inherently Risky

Model Batch Editor intentionally saves over MDB files. New sessions must keep warnings and user confirmations clear. Prefer Edit + Clone when testing.

### Binary Editing Must Stay Conservative

`mdb_tools.py` must preserve unknown bytes and only edit known fixed fields. Do not rewrite the whole MDB format from scratch unless the user explicitly asks and you have strong tests.

## Preferred Next-Session Startup Routine

When a future Codex session resumes:

1. Open this file first:

```text
docs\FORGE_NEXT_SESSION_CONSOLIDATED_HANDOFF.md
```

2. Open:

```text
PROJECT_HANDOFF.md
README.md
CHANGELOG.md
docs\FORGE_CHAT_SYSTEM.md
docs\FORGE_PROTOTYPE_TO_FORGE_WORKFLOW.md
```

3. Inspect:

```text
app.py
mdb_tools.py
public\model-tools.js
public\model-editor.js
public\index.html
public\styles.css
```

4. If packaging is relevant, confirm latest package history:

```text
dist\NeverwinterForge-1.3.0-creature-forge.zip
```

5. Ask what the user wants next only after understanding whether the task is:

- AI Forge prompt/workflow work.
- ComfyUI/depth work.
- MDB cloning/configuration work.
- UI polish.
- packaging/release work.
- tutorial/documentation work.
- NWN2 graphics/shader research work.

## How To Add Future Forge Modules

Preferred integration pattern:

1. Add new backend logic to a focused Python module if it is substantial.

2. Import that module in `app.py`.

3. Add route(s) in `AppHandler.do_GET` and/or `do_POST`.

4. Add static page under `public`.

5. Add JS under `public`.

6. Extend `public\styles.css` using the existing model-page/tool styling.

7. Add docs to `README.md`.

8. Add release notes to `CHANGELOG.md`.

9. Update this handoff if the module changes product direction.

10. Rebuild with PyInstaller and create a named zip.

Do not make a second local server unless there is a compelling reason.

## Suggested Consolidated Project Folder Layout

If the user consolidates multiple Codex project folders manually, use this mental layout:

```text
Neverwinter Forge\
  source\                  -> canonical current Forge source
  handoff\                 -> PROJECT_HANDOFF and consolidated guide snapshots
  research\
    mdbconfig\             -> old MDBConfig/MDBCloner research/extractions
    nwn2-graphics\         -> shader/graphics research
  tutorial-assets\
    model-batch-tools\
    model-batch-editor\
    model-edit-clone\
  releases\
    NeverwinterForge-1.3.0-creature-forge.zip
```

However, in this current workspace, do not move source files casually. The app expects its folders beside `app.py` and the spec expects the current layout.

## What To Tell A Fresh Session In One Paragraph

Neverwinter Forge is a local Windows Python/PyInstaller app for Neverwinter Nights 2 mod creation. It combines AI image workflows, local upscaling, ComfyUI depth/normal generation, and MDB model tooling in one executable. The canonical source is `C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official`; do not fork into a permanent separate app unless asked. Focused sub-chats may create temporary Forge-bound prototypes, but useful work should consolidate back into the official source. The MDB configurator work is already integrated through `mdb_tools.py`, `/model-tools`, `/model-editor`, and `/model-edit-clone`; external MDBConfig/MDBCloner folders under `2026-05-27` are research/tutorial references. Preserve output autosaving, conservative MDB byte editing, race/skeleton synchronization, no texture copying during clone, and Forge's dark/gold UI identity.

## Immediate Recommended Maintenance Tasks

1. Use `docs\FORGE_SUBCHAT_STARTER_PROMPT.txt` when starting focused sub-chats.

2. Decide whether `Neverwinter Forge Handoff` should be refreshed from the canonical source after every package.

3. Add a short `docs\MDB_CONFIGURATOR_REFERENCE_MAP.md` if future MDBConfig research grows.

4. Add automated smoke tests for `mdb_tools.py` using the tutorial demo MDBs.

5. Add a package script so release folder creation is repeatable and less manual.

6. Confirm whether the next Forge module is AI, MDB, ComfyUI, UI, packaging, or documentation before editing.
