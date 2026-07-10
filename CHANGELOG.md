# Changelog

## 1.3.0B Release

### Added
- Added the Neverwinter Forge auto-updater framework with GitHub Releases version checks, update download progress, restart/update messaging, and a separate packaged updater helper.
- Added `version.json` release metadata so packaged builds can compare the installed Forge version against the latest GitHub release.
- Added Shield Back generation for creating a flat material-matched rear shield view from an approved front shield.
- Added a Vertical / Kite Shields section with 9 tall 2:3 shield silhouettes for Shield Emblem generation.

### Changed
- Tightened Shield Emblem selected-silhouette rules so the artwork must conform to the chosen shield boundary instead of stretching or changing the shield outline to fit the design.
- Improved Gemini shield-control routing so the selected shield shape remains the structural guide for the final output.
- Improved bas-relief emblem and shield ornament prompting so supporting filigree is derived from the source motif's symbolism rather than falling back to a stock fantasy motif.
- Tightened outfit back-view prompts so dresses, robes, coats, panels, and armor layers wrap coherently around the rear view.
- Updated packaged build configuration to include a standalone `ForgeUpdater.exe` that can safely replace the installed Forge files through a temporary runner copy.

### Tested
- Built the packaged PyInstaller release.
- Verified the updater replacement flow in a disposable install folder, including file replacement, backup creation, update-state notice writing, and preservation of local outputs, runtimes, depth config, and extra prompt data.

## 1.3.0A Release

### Added
- Added the ID Map Color Guide outfit preset for generating flat exact-palette tint/material region guides from front and back outfit renders.
- Added a paired back-source image upload panel so the approved front color guide can drive consistent rear-view color assignments.
- Added derived back color-guide generation that sends the back source, original front source, and approved front guide together for region continuity.
- Added the July 2026 Model Repository storefront with dark catalog browsing, outfit front/back previews, public Google Drive download links, and Substance Painter workflow flags.

### Changed
- Updated the outfit repository naming from placeholder `Ashen` IDs to descriptive catalog names such as Ivory Court Gown, Azure Ward Plate, and Bronzewood Outrider Armor.
- Renamed the July 2026 Google Drive outfit folders to match the published storefront IDs while preserving existing Drive folder links.

## 1.3.0 Release - Creature Forge Workflows

### Added
- Added a Preset References gallery in AI Forge for presets that provide example images, with image-to-image presets able to load a reference directly into the input panel.
- Added Armored Outfit male and female AI Forge presets that keep the locked modular silhouettes while allowing pauldrons, fur liners, belts, sashes, trench coats, and structured outer armor layers.
- Added Robe / Dress male and female AI Forge presets for ground-length robes, dresses, gowns, and skirted garments with hidden feet, capped flat bottoms, and contact-shadow guidance for image-to-3D.
- Added an outfit-family skin-surface option that preserves intentional exposed skin-like areas as smooth matte mannequin material instead of letting the model cover them with extra clothing or armor.
- Added an outfit-family Extreme Simplify option for stripping embroidery, floral designs, filigree, icons, and noisy decoration into clean PBR material zones for repainting later.
- Added a Shield Emblem image-to-image preset that adapts an uploaded motif into the inner face of a randomized medieval fantasy shield while keeping the rim, bevel, and construction details separate.
- Added an optional Shield Emblem shape picker with 50 extracted shield silhouette references; random shield generation remains the default unless a silhouette is selected.
- Added a visible Shield Emblem shape selection indicator with a selected-shape label and badge on the active silhouette tile.
- Added six bas-relief depth/style reference images for AI Forge bas-relief presets so generation can calibrate smooth sculptural height, rounded bevels, and layered relief depth without copying the reference subjects.
- Added a Creatures preset group with a Dog Leg Creature image-to-image workflow for fitting outfit sources onto attached-head dog-leg skeleton creatures such as gnolls, werewolves, catlike humanoids, and lizardlike bodies.
- Added a Devil Scale Creature image-to-image workflow for devilish skeleton bodies, with front/profile silhouette references, side/back derived views, and prompt rules that preserve the pose while letting Misc define the actual head, horns, face, and creature identity.
- Strengthened Devil Scale Creature silhouette enforcement so final front/profile/rear outputs must preserve the mannequin leg spacing, ankle placement, plantigrade foot stance, and overall rig silhouette.
- Added a Dog Leg Creature tail checkbox so tailed and no-tail variants are structured in the UI and prompt routing.
- Added a Dog Leg Creature Side View derived workflow so tailed creatures can document the full tail profile after the front view is generated.

### Changed
- Generalized AI Forge Back View preset routing so new preset families can use their own `*-back` derived views without extra JavaScript special cases.
- Strengthened Object Concept front/back/side prompts with strict turnaround-sheet matching rules for mirrored orthographic consistency across generated views.
- Tightened Modular Outfit male and female back-view prompts so belts, sashes, waist straps, tabard edges, and armor bands preserve the generated front-view placement more consistently.
- Tightened Armored Outfit prompts to explicitly forbid cloaks, capes, mantles, and separate back-hanging physics cloth while still allowing fitted coats and structured armor layers.
- Strengthened Armored Outfit cloak handling so source cloaks/capes are discarded outright instead of being converted into coat panels, tabards, side fabric, or back-hanging garment pieces.
- Adjusted Robe / Dress skin handling so the skin-surface option only preserves upper-body exposed areas; ground-length lower-body dress and robe coverage always wins over exposed legs or lower-body skin.
- Strengthened Shield Emblem prompt depth/background handling so shields render suspended in neutral studio space with cast shadow, stronger rounded relief, and no white source-image background outside the shield.
- Strengthened Shield Emblem source-plaque handling so bordered bas-relief inputs are decomposed and redrawn across the shield interior instead of being stamped as a framed inset.
- Shield Emblem generation now sends a selected shield silhouette as a secondary reference image when chosen, overriding random shield-outline invention while preserving creative material and rim design.
- Strengthened Shield Emblem selected-shape enforcement with 1024px filled silhouette masks, stable source/shape image ordering, and hard prompt language against falling back to generic heater shields.
- For OpenAI Shield Emblem generations with a selected shape, the selected silhouette is now sent as image 1 and the motif/source image as image 2 so the model weights the silhouette as the structural control reference.
- OpenAI Shield Emblem selected-shape generations now build a Forge layout-control composite that clips the motif inside the chosen silhouette before sending it to the image edit model.
- Bas-relief presets now attach preset reference images during Gemini generation, matching the existing OpenAI image-edit reference workflow.
- Replaced the Shield Emblem picker silhouettes with 50 smoother high-resolution silhouette-source solid masks so selected shield shapes act as structural controls instead of stroked frame references.
- Strengthened Shield Emblem motif handling so uploaded concepts are redrawn as integrated shallow bas-relief with light brushed color or worn enamel instead of stamped full-color images.
- OpenAI Shield Emblem selected-shape control composites now use muted grayscale motif layout guidance so the source image informs composition without encouraging a pasted decal.
- Shield Emblem now attaches the bas-relief depth/style reference set so both Gemini and OpenAI can calibrate smooth relief height, rounded bevels, and molded sculptural depth inside the shield face.
- Back/side derived-view buttons now load the generated front output into the main input state before generation and prepend source-routing guidance so back views are generated from the approved front render instead of the original input image.
- Creature presets now require Preset + Misc prompt mode so the uploaded image can stay focused on outfit identity while Misc defines the creature type, head, surface treatment, and tail intent.
- Tightened Dog Leg Creature prompt wording to require orthographic front/profile/rear outputs and reject source-image camera angle inheritance.
- Rebuilt Dog Leg Creature prompt wording from the working modular/armored outfit pattern, with stronger default simplification and outfit-yields-to-rig silhouette rules.
- Strengthened Dog Leg Creature simplification language to reject photoreal fur, tiny scale fields, dense chainmail rings, scratches, grime, rust, and high-frequency creature texture noise.
- Replaced the active Dog Leg Creature front/profile/three-quarter references with widened-arm mannequin screenshots and added a direct rear mannequin reference for back-view pose enforcement.
- Dog Leg Creature now defaults to OpenAI with Extreme Simplify enabled and uses stricter straight-tail prompting to avoid left/right tail sway.
- Removed `A-pose` wording from Dog Leg Creature prompts so pose failures refer to a generic T-pose versus the required Dog Leg rig pose.
- Added the modular armored outfit cloak/cape rule set to Dog Leg Creature prompts, including the coat gate and hard failures for cloaks, capes, mantles, loose back-hanging cloth, and cloak colors reused as side/back panels.
- Completed a Dog Leg Creature prompt parity pass against modular outfit, armored outfit, robe/dress, and derived-view prompts, adding symbol replacement, clean PBR material checks, no-weathering rules, contact-shadow grounding, minimal-inference rules, and stronger back/side continuation guidance.
- Reworked the Devil Scale Creature front prompt to match the stable modular outfit source-plus-locked-silhouette routing, reserving the profile reference for derived side/back views so the front pass adheres more tightly to the rig silhouette.
- Tightened Devil Scale Creature lower-body prompt rules so feet, claws, greaves, and armor stay inside the rig footprint, and so sashes, straps, tabards, and hanging panels stop at mid-thigh in front, back, and side views.

### Maintenance
- Refreshed the source changelog so the 1.2.x Model Tools package history is documented before the next Forge handoff or release.

## 1.2.2 Release - Gray Orc Model Tools Patch

### Fixed
- Gray orc body-wear race cloning now keeps the player model naming family as `OGM` / `OGF` while mapping skeleton references to the compatible orc skeleton family, `P_OOM_skel` / `P_OOF_skel`.
- Model Batch Tools clone receipts now surface skeleton-reference updates so users can confirm internal sync after race cloning.

## 1.2.1 Release - MDB Skeleton Sync Patch

### Fixed
- Race-cloned MDB copies now rewrite matching `SKIN` skeleton references when the race family changes.
- Internal skeleton sync preserves source texture references and only edits the known fixed-name fields needed for cloned copies.

## 1.2.0 Release - Model Batch Tools

### Added
- Added Model Batch Tools for scanning, previewing, cloning, and renaming NWN2 MDB files inside the main Neverwinter Forge app.
- Added Model Batch Editor for editing MDB material flags, material values, behavior values, and texture references.
- Added Edit + Clone for writing edited MDB copies without saving over source files.
- Added bundled Babylon-powered MDB geometry preview support for identifying models without opening Blender.
- Added conflict preview, clone receipts, and Undo Last Batch support for files created by the latest clone operation.

### Changed
- Consolidated MDB Configurator and MDB Cloner style workflows into Neverwinter Forge as app pages, server routes, and `mdb_tools.py` logic rather than a separate utility.
- Race cloning preserves existing model numbers by default; number overrides must be explicitly enabled.
- MDB cloning reuses existing texture references and does not copy texture files.

### Fixed
- Internal visible model names are synchronized with cloned MDB filenames during clone operations.
- Model scan reports now expose factual warnings for internal sync, material flags, texture references, and missing previewable geometry.

## 1.1.3 Release - ComfyUI Desktop Depth Workflow Patch

### Fixed
- Depth & Normal Maps now runs reliably through ComfyUI Desktop by scaling large source images to a controlled 1-megapixel workflow input before Lotus processing.
- Prevented 4K source images from ballooning into excessive RealESRGAN x4 depth/normal output sizes that could appear to hang ComfyUI Desktop.
- Depth workflow package now includes the ComfyUI Desktop custom-node Python requirement installer updates for Lotus and WJNodes dependencies.

## 1.1.2 Release - Standalone Output Folder Hotfix

### Fixed
- Packaged launcher no longer silently attaches to another running Neverwinter Forge instance on port `8765`.
- Each launched EXE now starts its own local server on the next available port when needed, keeping autosaves tied to that EXE folder's own `outputs` directory.

## 1.1.1 Release - Autosave Visibility Patch

### Fixed
- Output panel now shows the actual autosaved file name and adds an Open Outputs Folder action so users do not confuse browser downloads with the app's local autosave folder.
- Renamed the optional browser download action to Save Browser Copy to make clear it is separate from automatic saving to `outputs`.

## 1.1.0 Release - Open Prompt and Generation Reliability

### Fixed
- Bas-Relief Emblem and Bas-Relief Concept now send the selected Gemini aspect ratio and output size as image response-format settings instead of relying on prompt text alone.
- Bas-relief MISC override-only generations now keep the app-level size and aspect-ratio controls attached to the outgoing prompt.
- Bas-relief prompt wording no longer forces a vertical rectangle when the user selects square or alternate vertical aspect ratios.
- Packaged launcher startup now creates the `outputs` folder and marker file so autosave location is visible before generation.

### Added
- Added Open Prompt utility mode for direct text-to-image or optional image-to-image generation without a preset prompt.

## 1.0.0 Release - Initial Neverwinter Forge Release

### Fixed
- Depth & Normal Maps now auto-detects ComfyUI Desktop on port `8000` as well as classic ComfyUI on port `8188`.
- Removed packaged beta dependence on developer-only drive-specific ComfyUI/model paths.
- Depth & Normal Maps now auto-detects ComfyUI/model folders from the app folder, common Windows locations, ComfyUI Desktop AppData locations, and optional environment-variable overrides.
- Added `depth_paths.example.json` so testers can configure custom ComfyUI/model locations without touching code.
- Added `models\comfyui\` fallback folders and placement notes for testers who do not have a detectable ComfyUI model directory.
- Added an example `extra_model_paths` snippet for users who keep depth models in the Neverwinter Forge fallback folder.
- `install_depth_models.bat` can now download the required Lotus/VAE/Real-ESRGAN model files and install required ComfyUI custom nodes into detected/user-configured ComfyUI folders.
- Model downloads in `install_depth_models.bat` now use `curl.exe` progress output and resumable `.part` files when available.
- `install_depth_models.bat` now stops when ComfyUI cannot be detected instead of installing into the Neverwinter Forge fallback folder by default.

## 0.1.2 Beta - Bas-Relief, Splash, UI Polish, and EXE Packaging

### Added
- Packaged Windows EXE support for a double-click Neverwinter Forge beta release.
- Launcher batch file now prefers the packaged EXE when present and falls back to the Python source launcher.
- Branded Neverwinter Forge Windows app icon generated from the bas-relief emblem artwork.
- Bas-Relief Emblem image-to-image preset for fantasy rectangular carved plate designs.
- Bas-Relief Concept text-to-image preset for written emblem concepts.
- Seven organized bas-relief example references stored as `emblem-prompt-1.png` through `emblem-prompt-7.png`.
- Bas-relief-only Gemini output size selector with 1K, 2K, and 4K options.
- Bas-relief-only aspect ratio selector for vertical, tall, and square plate layouts.
- Clear button for the upscaler input/comparison state.
- Local vendored jQuery Core 3.7.1 full build for upcoming UI transitions and interaction polish.
- Animated in-app splash screen using the Neverwinter Forge header art, gold shimmer, loading line, and cycling status copy.
- Refined the splash screen logo animation to use a soft glow pulse instead of a broad overlay sweep across the raster logo.

### Changed
- App file paths now resolve beside the bundled EXE when packaged, keeping presets, assets, workflows, outputs, and runtimes portable in the release folder.
- Bas-relief presets automatically select Gemini mode and `gemini-3.1-flash-image-preview`.
- Bas-relief output size selection updates the session cost estimate and is appended to the generated prompt.
- Bas-relief aspect ratio selection is appended to the generated prompt and saved with output metadata.
- Text prompt label adapts for the Bas-Relief Concept preset.
- Derived view buttons are hidden for presets that do not define back/side/3/4 views.
- Main panels now use a thin, evenly lit Neverwinter-style reflective gold trim, with the settings panel using a left-side gold rule.
- Buttons now use a restrained Neverwinter-style gold/silver hover sweep inspired by animated border-button interactions.
- Button hover sweeps now move more slowly with softer highlights for a less flashing, more fluid reflection.
- Added jQuery-assisted dependency accordion motion, Generate loading feedback, result reveal animations, and subtle output preview hover polish.
- Removed preset/provider fade transitions so mode changes respond instantly again.
- Slowed the button hover sweep to a very gentle reflection.

## 0.1.1 Beta - Local Workflow Tools & Branding Pass

### Added
- Depth & Normal Maps post-production workflow backed by a hidden local ComfyUI pipeline.
- Depth workflow dependency checker for required Lotus models, VAE, Real-ESRGAN model, and custom node packs.
- Collapsible `Model dependencies` panel with ready/missing/offline summary states.
- Clear missing-dependency setup hint pointing beta users to `install_depth_models.bat`.
- `install_depth_models.bat` helper for checking the expected local model files.

### Changed
- Standardized all app identity references as Neverwinter Forge.
- Updated browser storage keys, download filenames, server banner text, and user-agent naming to use Neverwinter Forge.
- Bypassed the workflow `ImageQuantize` node for cleaner depth-map output.
- Improved Depth & Normal Maps refresh feedback with visible last-checked timestamps.

### Fixed
- Fixed API route handling so cache-busted status URLs like `/api/depth/status?t=...` work correctly.
- Kept the technical model list hidden by default so the post-production UI is cleaner.

## 0.1.0 Beta - Initial Local Prototype

### Added
- Local browser-based desktop prototype served from `127.0.0.1:8765`.
- Preset prompt system with selectable workflows.
- D&D Miniature image-to-image workflow with front, back, and 3/4 view generation.
- Modular Outfit - Male image-to-image workflow with locked silhouette reference.
- Modular Outfit - Female image-to-image workflow with locked silhouette reference.
- Object Concept text-to-image workflow with front, back, and side view generation.
- Gemini and OpenAI provider modes.
- Mock mode for testing without API credits.
- Session cost estimate panel for paid image generation.
- Automatic local output saving with metadata JSON files.
- Post-production upscaler panel with image import, current-output handoff, 2x/4x upscale, and side-by-side preview.
- Local Real-ESRGAN NCNN Vulkan runtime downloader.
- Stable bundled upscaler path using `realesr-animevideov3`.
- Depth & Normal Maps post-production panel backed by a hidden ComfyUI workflow.
- Local dependency/status checker for Lotus depth/normal models and required custom nodes.
- `install_depth_models.bat` helper for beta dependency checks.
- High-DPI Neverwinter Forge header artwork.
- Windows double-click launcher: `Start Neverwinter Forge.bat`.

### Notes
- API keys are stored in the browser only for this prototype.
- Generated files are saved in `outputs/`.
- Local upscaler runtime files are stored in `runtimes/`.
- This beta is still a local prototype, not yet a packaged `.exe`.

### Planned
- Proper packaged Windows executable.
- Splash screen and app-like window shell.
- Additional workflow modules and in-app model download management.
- Improved release packaging and first-run setup experience.
