# Model Repository

Model Repository is the source-controlled catalog for Neverwinter Forge outfit assets. It keeps each outfit's identity, original front/back images, generated views, model files, texture files, and package zip in one predictable place.

The goal is to make the repository work like a small storefront:

- each outfit has one catalog entry in `catalog.json`
- each outfit can have a tracked working folder under `outfits/<outfit-id>/`
- each outfit can produce one zip under `packages/<outfit-id>.zip`
- every package includes a package manifest with file sizes and SHA-256 hashes

## Folder Layout

```text
model-repository/
  catalog.json
  outfits/
    <outfit-id>/
      notes.md
      images/
      models/
      textures/
  packages/
    <outfit-id>.zip
```

Use `outfits/` for curated repository copies. Use `catalog.json` to point either to those curated files or to the original files in the folder structure you are consolidating from.

## Catalog Entries

Each outfit entry has a stable `id`, display `name`, source folder, asset paths, and tags. Paths may be absolute, relative to the repo root, or relative to the outfit's `sourceRoot`.

See `examples/example-outfit.catalog.json` for a copyable entry.

Required for a storefront-ready outfit:

- `assets.originalFront`
- `assets.originalBack`

Optional but supported:

- `assets.generatedFront`
- `assets.generatedBack`
- `assets.modelFiles`
- `assets.textureFiles`
- `assets.notes`

## Build Packages

Preview package contents without writing zips:

```powershell
python tools/build_model_repository.py --dry-run
```

Build package zips:

```powershell
python tools/build_model_repository.py
```

Build one outfit:

```powershell
python tools/build_model_repository.py --outfit outfit-id
```

The builder never edits originals. It only reads the catalog assets and writes zip files into `model-repository/packages/`.
