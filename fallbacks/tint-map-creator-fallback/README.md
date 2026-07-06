# Tint Map Creator Fallback

This folder preserves the shelved ID Map Creator / Tint Map Maker experiment that was developed after the `NeverwinterForge-1.3.0-creature-forge.zip` distributable.

It is intentionally not active in the main app baseline. The experiment is saved here so the code, prompts, UI, Blender bridge, Tripo testing path, and handoff notes can be revisited later without shipping them in the current Creature Forge release line.

## Preserved Files

- `app.py`: active app source before the tint-map rollback, including `/id-map-creator`, `/tint-map-maker`, and `/api/idmap/*` endpoints.
- `id_map_tools.py`: MDB/OBJ/ASCII FBX UV extraction and texture-underlay helpers.
- `id_map_blender_bridge.py`: local Blender background bridge for helper renders and starter ID-map bakes.
- `public/id-map-creator.html`
- `public/id-map-creator.js`
- `presets/id-map-color-guide/`
- `presets/id-map-creator/`
- `tools/forge_blender_idmap_job.py`
- `README.md`, `CHANGELOG.md`, `PROJECT_HANDOFF.md`, and `docs/FORGE_NEXT_SESSION_CONSOLIDATED_HANDOFF.md` from the experimental state.

## Active Baseline

The active repository root is being restored toward the latest known workable distributable:

```text
dist/NeverwinterForge-1.3.0-creature-forge.zip
```

Do not wire these fallback files back into the active app unless the tint-map workflow is deliberately resumed.
