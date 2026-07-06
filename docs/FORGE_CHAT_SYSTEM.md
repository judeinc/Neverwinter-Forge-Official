# Neverwinter Forge Chat System

Last updated: 2026-06-05

This document explains how Neverwinter Forge should be developed across many Codex chats while staying one coherent project.

## Canonical Project

Neverwinter Forge Official is the source hub:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

Neverwinter Forge is the primary project for Neverwinter Nights 2 mod creation. It is the central place for AI image workflows, ComfyUI workflows, MDB model tools, shader or graphics utilities, tutorial support, packaging, documentation, and future NWN2 modding utilities.

The Forge should remain one connected application unless Raymond explicitly asks for a separate standalone app.

## Chat Roles

### Root / Consolidation Chat

Use the root chat for project-wide decisions and consolidation:

- overall project direction
- deciding what belongs in Forge
- updating handoff files
- merging prototype work into the official source
- packaging and release decisions
- resolving architecture questions across modules
- keeping the single-app rule clear

### Sub-Chat

Use sub-chats for focused increments:

- one new module
- one feature improvement
- one bug investigation
- one UI pass
- one documentation task
- one packaging/release task
- one research/prototype task

Every sub-chat should understand that it is an extension of the root Neverwinter Forge project. Its work either happens directly in the official source folder or produces a temporary prototype that will later be consolidated into the official source.

## Table Of Contents For Future Work

Use these categories to label sub-chats and handoffs:

```text
01-ai-forge-workflows
02-comfyui-depth-normal
03-mdb-model-tools
04-mdb-editor-and-configurator
05-model-preview-and-geometry
06-nwn2-graphics-and-shaders
07-tutorials-and-documentation
08-packaging-and-release
09-ui-and-navigation-polish
10-future-forge-utilities
```

The category is only a routing label. It does not create a separate product identity.

## AI Forge Sub-Chat Notes

Recent AI Forge work added and tuned several prompt/preset families:

- Modular Outfit male/female back-view routing.
- Armored Outfit male/female presets.
- Robe / Dress male/female presets.
- Shield Emblem preset with selected shield-shape picker.
- Outfit option controls for visible skin-like areas and Extreme Simplify.
- Shield Emblem bas-relief depth/style reference routing.

Future `01-ai-forge-workflows` sub-chats should treat these as Forge-native preset work under:

```text
presets\
public\app.js
public\index.html
public\styles.css
app.py
```

Do not build a separate prompt app for these workflows unless Raymond explicitly asks. If isolated testing is useful, leave Forge Migration Notes and consolidate the prompt, UI control, manifest change, and backend request routing back into Neverwinter Forge Official.

Important AI Forge source-routing rule:

- Derived back/side views should use the generated approved front output as the new source image.
- Do not let derived back views silently reinterpret the original user input image.
- If this behavior regresses, inspect `runDerivedView()` and `loadGeneratedImageIntoInput()` in `public\app.js`.

## Direct Forge Work Versus Temporary Prototypes

Small, clear, low-risk features should usually be built directly in:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

Larger or experimental features may be built first as temporary prototypes when isolation helps. The MDB Configurator work is the model for this: it was explored separately, tested, and then folded into Forge as Model Batch Tools, Model Batch Editor, and Edit + Clone.

Temporary prototypes are allowed, but they are Forge-bound by default.

## Prototype Rules

If a sub-chat creates a temporary prototype:

- state that the prototype is Forge-bound
- keep its purpose narrow
- do not let it become a permanent competing app
- keep notes about what should migrate into Forge
- identify the final Forge module/page/route before handoff
- discard prototype-only scaffolding after useful parts are migrated

Unless Raymond explicitly asks otherwise, the destination is still:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

## Forge Migration Notes

Every prototype or substantial sub-chat should leave a short migration note:

```text
Forge Migration Notes
- Prototype or sub-task name:
- What was built:
- What should move into Forge:
- What should be discarded:
- Target Forge page/module/route:
- Backend files affected:
- Frontend files affected:
- Assets or dependencies to copy:
- Documentation/changelog updates needed:
- Verification completed:
- Remaining risks:
```

## Single-App Rule

Neverwinter Forge should absorb future tools as:

- routes in `app.py`
- focused Python modules imported by `app.py`
- pages under `public\`
- scripts under `public\`
- shared styling in `public\styles.css`
- presets under `presets\`
- workflows under `workflows\`
- runtime assets under `runtimes\`
- model assets under `models\`
- docs under `README.md`, `CHANGELOG.md`, and `docs\`

Do not create a second long-lived local server or separate executable unless Raymond explicitly requests it.

## Source And Reference Boundaries

Canonical source:

```text
C:\Users\Raymond Arellano\Documents\Neverwinter Forge Official
```

MDBConfig/MDBCloner research and tutorial support:

```text
C:\Users\Raymond Arellano\Documents\Codex\2026-05-27
```

The 2026-05-27 folder is reference material. Use it for behavior research, demo MDBs, tutorial assets, and historical MDBConfig/MDBCloner context. Do not treat it as the active app.

## Start Of Every New Sub-Chat

Paste the contents of:

```text
docs\FORGE_SUBCHAT_STARTER_PROMPT.txt
```

Then add one sentence naming the exact sub-task for that chat.

Example:

```text
For this sub-chat, focus on adding automated smoke tests for mdb_tools.py using the tutorial demo MDBs.
```
