# Legacy NWN2 Model Tool Findings

These archives were extracted as reference material only. Do not run or embed the old executables in Forge. Use the findings to guide our own parser and viewer design.

## Extracted Archives

- `64b_model_viewer_32.7z`
  - `Model_Viewer_32.exe`
- `modelviewer.zip`
  - `Model Viewer.exe`
  - `Simple Model Viewer.doc`
- `packfileexplorer_156.rar`
  - `PackfileExplorer.exe`
  - `ImportX.ms`
  - `d3dx9_27.dll`

## Simple Model Viewer

The included document describes a simple C# DirectX model viewer for KotOR, KotOR2, and NWN2. For NWN2 it expects users to extract `.mdb` and `.dds` files, preferably keeping DDS files in a texture directory.

Useful behavior to recreate in Forge:

- Open `.mdb` files directly.
- Display a rotating model preview.
- Offer solid and wireframe render modes.
- Provide a texture lookup/retexture preview flow.
- Provide simple hex and readable data dumps for reverse engineering.
- Fall back gracefully when textures are missing.

Static .NET metadata shows concepts worth mirroring, not copying:

- `ModelNWN2`
- `Model3D`
- `PositionNormalTextured`
- `Vertices`
- `Indices`
- `Materials`
- `Textures`
- `Texturepath1`
- `Texturepath2`
- `UsedTextures`
- `TextureIndex`
- `ReadModelFile`
- `WriteModelFile`
- `ReplaceTexture`
- `ComputeNormals`

## Packfile Explorer

The archive does not include source code. Static strings show it is a native Direct3D-era tool, so it is less directly reusable for our web viewer.

`ImportX.ms` is a 3ds Max DirectX `.x` importer/exporter by Dave Gaunt, not an MDB parser. It is still useful as a reminder of the geometry concepts our preview exporter needs:

- vertices
- triangular faces
- normals
- UV coordinates
- material list
- render groups
- skin weights
- bone hierarchy

## Recommended Forge Direction

Build our own viewer with a modern browser renderer:

1. Extend the Python MDB parser to export preview geometry from `RIGD` and `SKIN` packets.
2. Return a compact JSON preview payload: positions, normals, UVs, indices, material slots, texture names, bounding box, and warnings.
3. Render that payload in the browser with Babylon.js or Three.js. Babylon.js is a strong fit because it can take custom vertex data directly, handles depth buffering/back-face culling/wireframe/materials in WebGL, and has a dedicated viewer package for polished model-viewing behavior.
4. Resolve sibling `.dds` files only for preview, without copying them or changing clone behavior.
5. Fall back to matcap gray shading when texture files are missing.
6. Add viewer controls: orbit, zoom, pan, solid/wireframe, back-face culling, reset camera, texture/matcap toggle, and missing-texture badges.

## Babylon.js Research Notes

Babylon.js maps well to Forge's MDB preview payload:

- Use `BABYLON.VertexData` with `positions`, `indices`, `normals`, and `uvs`, then apply it to a mesh.
- Use `StandardMaterial` for diffuse texture, specular color, specular power/gloss approximation, wireframe mode, and back-face culling.
- Use `ArcRotateCamera` for user-friendly orbit/pan/zoom.
- Let WebGL handle the depth buffer instead of doing painter sorting in a 2D canvas.
- Keep the MDB parser in Python and send preview data as JSON; the browser viewer should only render.
- The Babylon Viewer V2 is polished for glTF/glb-style model viewing, but our MDB files are custom. We likely want Babylon Engine plus custom `VertexData`, not the drop-in viewer component unless we later export temporary glTF.

## Licensing Boundary

Treat these old tools as research references. We can copy behavior patterns and file-format understanding, but we should not copy decompiled implementation code or bundle third-party executables without confirmed license permission.
