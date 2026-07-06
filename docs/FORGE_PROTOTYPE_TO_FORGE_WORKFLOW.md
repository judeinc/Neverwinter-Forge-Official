# Prototype To Forge Workflow

Last updated: 2026-06-05

This document defines how temporary prototypes should be created, tested, and migrated into Neverwinter Forge.

## Purpose

Some Forge modules benefit from isolated exploration before they are integrated. This is valid when the feature is uncertain, risky, large, or needs focused testing.

The MDB Configurator path is the reference pattern: research and prototype first, then migrate the useful behavior into Neverwinter Forge as official app modules.

## When To Prototype Separately

Prototype separately when:

- the workflow is experimental
- external tools or file formats need research
- the UI needs fast iteration before fitting the Forge style
- binary parsing or destructive edits need isolated tests
- the feature may be discarded or simplified
- dependencies are unclear

Build directly in Forge when:

- the feature is small
- the final location is obvious
- the work mostly extends existing routes/pages
- the risk is low
- the prototype would only duplicate existing Forge scaffolding

For AI Forge prompt/button work, usually build directly in Forge. The app already has preset manifests, provider routing, output autosave, reference-image handling, selected-shape handling, and option controls. Temporary prompt experiments are fine, but final behavior should become:

- a preset entry in `presets\presets.json`
- prompt/reference files under `presets\`
- UI controls in `public\index.html` and `public\app.js`
- styling in `public\styles.css`
- provider/image routing in `app.py` when needed
- release notes in `CHANGELOG.md`
- handoff notes when the workflow changes future session behavior

## Prototype Requirements

Every temporary prototype should have:

- a clear name
- a short purpose statement
- a final Forge destination
- a list of files/features to migrate
- a list of prototype scaffolding to discard
- verification notes
- risks or unanswered questions

## Migration Steps

1. Identify the final Forge module or page.
2. Copy only the useful implementation into `Neverwinter Forge Official`.
3. Convert prototype UI to match the Forge dark/gold tool style.
4. Route backend behavior through `app.py` or a focused imported module.
5. Put frontend code under `public\`.
6. Put presets/workflows/assets in the correct Forge folders.
7. Update `README.md` when the feature is user-facing.
8. Update `CHANGELOG.md` when the feature is release-relevant.
9. Update `PROJECT_HANDOFF.md` or `docs\FORGE_NEXT_SESSION_CONSOLIDATED_HANDOFF.md` if the feature changes project direction.
10. Run verification from the official source folder.

For AI Forge prompt/preset prototypes, also verify:

1. The preset appears in `/api/presets`.
2. Any derived-view button sends the intended source image.
3. Reference images are attached in the intended order for Gemini and OpenAI.
4. New checkboxes or controls are saved/restored from localStorage only when appropriate.
5. Generated outputs autosave to `outputs\` with metadata.
6. The prompt does not accidentally preserve old source frames, watermarks, unwanted cloaks/capes, or other forbidden elements from the test source.

## Verification Defaults

Use the checks that match the change:

```powershell
python -m py_compile app.py launch.py mdb_tools.py
python -m json.tool presets\presets.json
python -m json.tool workflows\Depthmaps_by_Jude_API.json
```

For frontend JavaScript:

```powershell
& 'C:\Users\Raymond Arellano\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check public\app.js
& 'C:\Users\Raymond Arellano\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check public\model-tools.js
& 'C:\Users\Raymond Arellano\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check public\model-editor.js
```

For UI work, run the app and inspect the relevant route.

## Migration Note Template

```text
Forge Migration Notes

Prototype or sub-task name:
Source/prototype folder:
Target Forge folder:

What was built:

What should move into Forge:

What should be discarded:

Target Forge page/module/route:

Backend files affected:

Frontend files affected:

Assets, presets, workflows, or dependencies:

Docs/changelog updates:

Verification completed:

Remaining risks:
```

## Recent AI Forge Migration Pattern

The Shield Emblem and outfit-family work are current examples of prompt/UI migration:

- Prompt files live under `presets\...`.
- `presets\presets.json` declares provider, kind, derived views, reference images, shape references, and profile where needed.
- `app.py` owns provider payload assembly, preset reference attachment, selected shield shape asset lookup, and OpenAI control composites.
- `public\app.js` owns preset selection, option checkboxes, selected shield-shape state, derived-view source routing, and generation payloads.
- `public\styles.css` owns picker/control display.
- `CHANGELOG.md`, `PROJECT_HANDOFF.md`, and `docs\FORGE_NEXT_SESSION_CONSOLIDATED_HANDOFF.md` should be updated when a workflow becomes a durable Forge feature.

Special caution:

- Derived view buttons must use the generated front output as the active input image before calling the backend.
- Shield shape references should remain simple mask assets, not decorative frame art.
- Bas-relief depth references are calibration references only; do not let providers copy their subjects or borders.
