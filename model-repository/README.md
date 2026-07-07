# Neverwinter Forge Model Repository

This folder is the public storefront catalog for Neverwinter Forge outfit previews.
Git tracks the lightweight preview images and metadata. The heavier outfit folders, zips, meshes, and texture work are hosted in Google Drive and linked from the storefront.

## Current Collection

```text
model-repository/
  index.html
  catalog.json
  collections/
    July 2026/
      collection.json
      <outfit-id>/
        front.png
        back.png
        outfit.json
```

Open `index.html` to browse the storefront locally. Each outfit card has front/back images, an information pane, a `Download outfit here` link, and a Substance Painter workflow flag.

## Metadata

Each `outfit.json` is public-safe and should not contain local machine paths. The important fields are:

- `id`
- `name`
- `collection`
- `frontImage`
- `backImage`
- `downloadUrl`
- `substancePainterWorkflow`
- `substancePainterWorkflowFolders`

## Hosting Pattern

- GitHub: preview images, catalog metadata, and storefront page.
- Google Drive: full model folders, zips, high/low poly files, extra maps, and Substance Painter workflow folders.

For July 2026, the shared Drive folder is:
https://drive.google.com/drive/folders/1Lu78j1oOc8_AZ879FXNBZtdTo-MY05Cx
