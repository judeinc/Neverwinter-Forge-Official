# Git Setup

Neverwinter Forge is initialized as a source repository on the `main` branch.

## Source-Control Policy

Track:

- app source files
- public UI files
- presets and prompt files
- workflows and manifests
- docs and reference images
- Model Repository catalogs, notes, and curated package metadata

Ignore:

- `build/` and `dist/`
- generated `outputs/`
- local `tmp/`
- root release archives and extracted release bundles
- local secrets such as `.env` and `depth_paths.json`
- downloaded model weights and runtime binaries

## Git LFS

Git LFS is enabled locally for future Model Repository payloads:

- `model-repository/packages/*.zip`
- `model-repository/outfits/**/*.mdb`
- `model-repository/outfits/**/*.MDB`
- `model-repository/outfits/**/*.dds`
- `model-repository/outfits/**/*.DDS`
- `model-repository/outfits/**/*.fbx`
- `model-repository/outfits/**/*.FBX`

This keeps large storefront packages and curated model assets out of normal Git object history while still letting them live in the repository.

## First Commit Checklist

Before the first commit:

1. Configure a Git author with `git config user.name "Your Name"` and `git config user.email "you@example.com"`.
2. Confirm the initial file list with `git status --short --untracked-files=all`.
3. Stage the source snapshot with `git add .`.
4. Commit with `git commit -m "Initial Neverwinter Forge source snapshot"`.
5. Add the GitHub remote with `git remote add origin <repo-url>`.
6. Push with `git push -u origin main`.
