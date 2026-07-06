# Neverwinter Forge Handoff

Last updated: 2026-06-09

## Read This First

The canonical next-session consolidation guide is:

`docs/FORGE_NEXT_SESSION_CONSOLIDATED_HANDOFF.md`

For the multi-chat project workflow, also read:

- `docs/FORGE_CHAT_SYSTEM.md`
- `docs/FORGE_PROTOTYPE_TO_FORGE_WORKFLOW.md`
- `docs/FORGE_SUBCHAT_STARTER_PROMPT.txt`

Start there before editing code. Neverwinter Forge is the primary project and should remain the central executable/hub. The MDB configurator/model tooling work is now treated as a Forge module, not a separate long-lived app, unless Raymond explicitly asks otherwise.

## Current State

- App name is standardized as Neverwinter Forge.
- Canonical source workspace is now `C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official`.
- Local app runs at `http://127.0.0.1:8765/` through `Start Neverwinter Forge.bat`.
- Latest known built package is `dist/NeverwinterForge-1.3.0-creature-forge.zip`.
- The project is now one multi-tool Forge application, not separate apps.
- Focused sub-chats may create temporary Forge-bound prototypes, but final useful work should consolidate back into Neverwinter Forge Official unless Raymond explicitly requests a standalone app.
- AI Forge/image workflows and MDB model workflows should stay as separate main workspaces inside the same executable.
- Depth & Normal Maps status currently reports ready.

## Implemented Workflows

- D&D Miniature image-to-image with front, back, and 3/4 view.
- Modular Outfit - Male image-to-image with locked silhouette and back view.
- Modular Outfit - Female image-to-image with locked silhouette and back view.
- Armored Outfit - Male image-to-image with locked silhouette, allowed pauldrons/fur/belts/sashes/structured coats, and back view.
- Armored Outfit - Female image-to-image with locked silhouette, allowed pauldrons/fur/belts/sashes/structured coats, and back view.
- Robe / Dress - Male image-to-image for ground-length robes and capped-bottom garment shells with back view.
- Robe / Dress - Female image-to-image for dresses, gowns, robes, skirt rules, capped bottoms, and back view.
- Object Concept text-to-image with front, back, and side view.
- Bas-Relief Emblem image-to-image for fantasy carved rectangular plate designs.
- Bas-Relief Concept text-to-image for written emblem concepts.
- Shield Emblem image-to-image for adapting motifs into medieval/fantasy shields, with optional shield-shape picker.
- AI Forge outfit option controls: source outfit has visible skin-like areas, and Extreme Simplify.
- Local Real-ESRGAN post-production upscaler.
- Local ComfyUI Depth & Normal Maps workflow.
- Model Batch Tools at `/model-tools` for safe MDB clone/rename workflows.
- Model Batch Editor at `/model-editor` for save-over MDB flag/material/texture-reference edits.
- Edit + Clone at `/model-edit-clone` for editing one to three MDBs and writing edited clone copies.
- ID Map Creator / Tint Map Maker at `/id-map-creator` and `/tint-map-maker` for extracting MDB/OBJ/ASCII FBX UV layouts, assigning exact color regions, selecting Tripo AI Segmentation / Local Blender Helper Bake / UV Island Image Pass workflows, reviewing AI chunk labels, and exporting exact-palette tint/material ID map PNGs.
- Creatures AI Forge workflows now include Dog Leg Creature and Devil Scale Creature prompt families with creature-type Misc routing, silhouette references, side/back derived views, and rig-friendly simplification rules.

## Forge Multi-Tool Structure

- `public/index.html` is the AI Forge/image-generation workspace entry.
- `public/model-tools.html` is the MDB batch cloner workspace.
- `public/model-editor.html` is the MDB batch editor workspace.
- `public/model-edit-clone.html` is the edit-and-clone workspace.
- `public/id-map-creator.html` is the ID Map Creator / Tint Map Maker workspace.
- `public/model-tools.js` owns the batch cloner UI and 3D preview behavior.
- `public/model-editor.js` owns both the batch editor and edit-plus-clone UI behavior.
- `public/id-map-creator.js` owns UV canvas drawing, island color assignment, exact-color PNG export, optional diffuse/normal texture underlays, and the advanced Blender 3D Bake panel.
- `public/vendor/babylon.js` is bundled locally for MDB preview rendering.
- `mdb_tools.py` owns MDB scan, clone, edit, parser, texture-reference, and geometry-preview logic.
- `id_map_tools.py` owns MDB UV layout extraction and UV island grouping for tint/ID map workflows.
- `id_map_blender_bridge.py` owns Forge-to-Blender background job launching for ID Map Creator.
- `tools/forge_blender_idmap_job.py` runs inside Blender to import OBJ/FBX meshes, render reference views, and bake starter ID maps.
- `app.py` exposes the model pages, `/api/mdb/*`, and `/api/idmap/*` endpoints.

Keep these as modules inside one app. Do not split them back into a second local server or second executable unless explicitly requested.

## MDB Model Tool Rules

- Cloning writes MDB copies only. It must not copy DDS, TGA, PNG, JPG, WEBP, or other texture files.
- Clone texture references are reused from the source MDB unless the user edits texture references in an editor workflow.
- Race cloning replaces only the race/sex code by default and preserves the rest of the name exactly, including the number.
- Race cloning also rewrites matching `SKIN` skeleton references, such as `P_HHM_skel` to `P_EEM_skel`.
- Gray orc body-wear naming uses `OGM`/`OGF`, but the skeleton reference should map to the orc skeleton family: `P_OOM_skel`/`P_OOF_skel`.
- Number override must be explicit. Never auto-increment names during normal race clone behavior.
- Standard body-related race targets use `HH`, `EE`, `DD`, `GG`, `OO`, and gray orc `OG`, preserving the original sex suffix.
- Heads and hair may use broader race families, including Aasimar, Tiefling, Genasi, gray orc, and elf/drow subrace families.
- Model type labels should stay user-facing: body, boots, gloves, cloak, head, hair, armor part for `A_`, weapon model for `W_`.
- Cloner shows flags as factual/read-only information; editor workflows change flags.
- Batch editor saves over existing MDBs by design.
- Edit + Clone creates edited MDB copies and limits active selected clone targets to three at a time.
- Batch editing should only apply shared edits across selected MDBs of the same model type.
- Keep conflict handling visible before writing files.
- Keep internal sync visible so users know file name, object name, skeleton, mesh data, and material references are aligned.

## Tutorial Assets

- Tutorial planning and Premiere helper files live outside the app source under `C:\Users\Raymond Arellano\Documents\Codex\2026-05-27`.
- Model Batch Tools tutorial kit: `C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Tools Tutorial Kit`.
- Voiceover-synced Model Batch Tools XML:
  `C:\Users\Raymond Arellano\Documents\Codex\2026-05-27\Model Batch Tools Tutorial Kit\premiere\model_batch_tools_voiceover_synced_highlight_sequence.xml`.
- These tutorial assets are production/support files, not runtime dependencies for the Forge EXE.

## Bas-Relief Notes

- Prompt files:
  - `presets/bas-relief-emblem/prompt.txt`
  - `presets/bas-relief-emblem/concept.txt`
- Example references are copied and renamed as `emblem-prompt-1.png` through `emblem-prompt-7.png`.
- Both bas-relief presets use Gemini and recommend `gemini-3.1-flash-image-preview`.
- Bas-relief presets expose a Gemini output size selector with `1K`, `2K`, and `4K`; this is added to the prompt and used for the session cost estimate.
- Bas-relief presets do not expose derived view buttons.
- The upscaler has a Clear button to unload the current upscaler input and hide comparison output.

## AI Forge Outfit Notes

- Prompt files:
  - `presets/modular-outfit-male/prompt.txt`
  - `presets/modular-outfit-female/prompt.txt`
  - `presets/modular-armored-outfit-male/prompt.txt`
  - `presets/modular-armored-outfit-female/prompt.txt`
  - `presets/modular-robe-dress-male/prompt.txt`
  - `presets/modular-robe-dress-female/prompt.txt`
- Back-view prompts live in the same preset folders as `back-view.txt`.
- Base Modular Outfit presets keep the stricter simple outfit silhouette.
- Armored Outfit presets use the same modular silhouette discipline but allow pauldrons, fur liners, belts, sashes, structured armor pieces, and fitted/trench-coat-like garments when they do not break the T-pose.
- Cloaks and capes remain forbidden for outfit and armored outfit presets because NWN2 cloaks use a separate skeleton/physics path.
- Robe / Dress presets hide feet for ground-length garments, cap/flatten the bottom hem, and use contact shadow guidance so image-to-3D does not create hollow interiors.
- Robe / Dress lower-body coverage overrides the visible-skin option. If the dress or robe goes to the ground, the garment wins over exposed legs.
- The visible skin-like areas checkbox preserves intentional exposed outfit areas as smooth matte skin-toned mannequin plastic/resin, not realistic skin.
- The Extreme Simplify checkbox removes embroidery, floral designs, filigree, icons, and noisy decoration while preserving broad PBR material zones such as leather, metal, cloth, padding, belts, seams, and armor plates.
- Back/side derived-view buttons now load the generated front output into the main input state before generation and prepend source-routing guidance. The back view should be generated from the approved front output, not from the original user input image.

## Shield Emblem Notes

- Prompt file: `presets/shield-emblem/prompt.txt`.
- Shape references: `presets/shield-emblem/shape-references/shield-shape-*.png`.
- Current picker contains 50 smooth silhouette-source masks, normalized to 1024x1024 with solid black interiors and antialiased outer edges.
- Random shield generation remains the default; selecting a shield silhouette overrides random outline invention.
- The selected shape is visible in the UI with a selected label/badge.
- OpenAI selected-shape generation sends a Forge-built layout-control composite, the original motif/source image, and the selected shield mask.
- The OpenAI layout-control composite is muted grayscale so it guides placement and silhouette without encouraging the model to stamp the source picture onto the shield.
- Shield Emblem attaches the same six bas-relief depth references used by Bas-Relief presets. These references are for relief height, smoothness, rounded bevels, and sculptural depth only, not subject copying.
- The intended Shield Emblem look is a complete 3D medieval/fantasy shield with separate rim/bevel and an interior motif redrawn as integrated shallow-to-medium bas-relief with light brushed paint, glaze, patina, or worn enamel over sculpted forms.
- Avoid stamped source images, picture-in-picture plaques, preserved source borders, flat decals, white source backgrounds, generic heater shields when a different shape is selected, and full-color sticker-like interior artwork.

## Depth & Normal Notes

- ComfyUI root: `E:\QWEN_IMAGE_MODEL\ComfyUI-Easy-Install\ComfyUI`
- Models root: `E:\ComfyUI_Models_Repository\models`
- Workflow copy: `workflows/Depthmaps_by_Jude_API.json`
- Input node: `93`
- Depth output preview node: `96`
- Normal output preview node: `101`
- `ImageQuantize` node is bypassed; `AdjustContrast` node `89` now receives node `91` directly.
- `install_depth_models.bat` checks the expected local model files.

## Verification Done

- Python compile passed for app and launcher.
- Preset and workflow JSON validated.
- Core API endpoints responded.
- Browser UI loaded with no console errors.
- AI Forge preset JSON validates with 50 Shield Emblem shape references and six relief references.
- `public/app.js` validates after derived-view source-routing updates.
- Packaged zip contains the bundled Real-ESRGAN runtime.
- Model Batch Tools, Model Batch Editor, and Edit + Clone received UI and functional QA during development.
- MDB clone QA confirmed internal names update and texture files are not copied.
- Babylon MDB preview renders geometry and local textures without requiring Blender.

## Next Likely Tasks

- Beta-test the depth/normal generation output quality on several images.
- Continue testing Shield Emblem with OpenAI and Gemini for bas-relief-like motif integration inside shields.
- Continue testing derived outfit back views; expected behavior is that the generated front output becomes the new input source before the back view call.
- If shield adherence still fails, inspect the OpenAI control composite and selected silhouette prompt routing before changing the UI again.
- Consider turning `install_depth_models.bat` into a real downloader once model source URLs are finalized.
- Improve local workflow settings so users can choose or browse their ComfyUI path instead of using hardcoded defaults.
- Decide the final top-level navigation wording for a single multi-tool Forge release.
- Add any missing user guide sections for Model Batch Tools, Model Batch Editor, and Edit + Clone.
- Rebuild the packaged EXE/zip after final docs and UI naming are approved.
- Continue ID Map Creator testing with a wider set of MDB types, especially mirrored/overlapping UVs, tiny trim islands, and models with multiple materials.
- Next ID Map Creator priority: implement the staged Tripo AI path and keep the current Blender/helper-bake work as the fallback path.
- Add an applied 3D preview pass so generated ID maps can be wrapped back onto the model before export.
- Later: add optional Blender cleanup validation after the deterministic UV workflow is stable.
- Later: explore WinUI/native shell and code-signing/security best practices to reduce Windows trust friction.

## Distribution Build Notes

- Build command from the project root:
  `python -m PyInstaller --noconfirm "Neverwinter Forge.spec"`
- The `.spec` uses `contents_directory='.'` so runtime folders live beside `Neverwinter Forge.exe`.
- Required bundled folders include `public`, `presets`, `workflows`, `runtimes`, and `models`.
- After building, the distributable folder is `dist\Neverwinter Forge`.
- The current release copy is `dist\NeverwinterForge-1.3.0-creature-forge`.
- The current shareable zip is `dist\NeverwinterForge-1.3.0-creature-forge.zip`.
