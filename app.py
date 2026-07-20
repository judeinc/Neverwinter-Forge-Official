from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from io import BytesIO
from urllib import request, error
from urllib.parse import parse_qs, quote, urlencode, urlparse
import base64
import cgi
import json
import mimetypes
import os
import shutil
import uuid
import socket
import subprocess
import sys
import threading
import zipfile
import time
from datetime import datetime

from PIL import Image, ImageChops, ImageFilter, ImageOps

from mdb_tools import clone_and_edit_models, clone_and_edit_uploaded_model, clone_and_rename_models, mdb_geometry_preview, save_mdb_flag_edits, scan_mdb_folder, scan_uploaded_mdb_files


if getattr(sys, "frozen", False):
    ROOT = Path(sys.executable).resolve().parent
else:
    ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
PRESETS = ROOT / "presets"
PRESETS_MANIFEST = PRESETS / "presets.json"
EXTRA_PROMPT = PRESETS / "extra_prompt.txt"
OUTPUTS = ROOT / "outputs"
RUNTIMES = ROOT / "runtimes"
UPSCALER_RUNTIME = RUNTIMES / "realesrgan"
UPSCALER_DOWNLOADS = RUNTIMES / "downloads"
UPDATES = ROOT / "updates"
UPDATE_DOWNLOADS = UPDATES / "downloads"
UPDATE_STATE_FILE = UPDATES / "update_state.json"
VERSION_FILE = ROOT / "version.json"
HOST = "127.0.0.1"
PORT = 8765
UPSCALER_PACKAGE_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
UPSCALER_PACKAGE_NAME = "realesrgan-ncnn-vulkan-20220424-windows.zip"
UPSCALER_PACKAGE_SIZE_MB = 43.4
DEFAULT_COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_URL_CANDIDATES = [
    "http://127.0.0.1:8188",
    "http://127.0.0.1:8000"
]
COMFYUI_DISCOVERY_PORTS = list(range(8000, 8021)) + list(range(8188, 8201))
DEPTH_WORKFLOW = ROOT / "workflows" / "Depthmaps_by_Jude_API.json"
DEPTH_PATH_CONFIG = ROOT / "depth_paths.json"
DEPTH_INPUT_NODE = "93"
DEPTH_PREVIEW_NODE = "96"
NORMAL_PREVIEW_NODE = "101"
DEPTH_REQUIRED_CUSTOM_NODES = {
    "ComfyUI-Lotus": "LoadLotusModel and LotusSampler",
    "ComfyUI_essentials": "ImageDesaturate+",
    "ComfyUI-WJNodes": "invert_channel_adv"
}
DEPTH_REQUIRED_MODELS = [
    {"folder": "diffusion_models", "name": "lotus-depth-g-v2-1-disparity-fp16.safetensors", "sizeGb": 1.62},
    {"folder": "diffusion_models", "name": "lotus-depth-g-v1-0.safetensors", "sizeGb": 3.23},
    {"folder": "diffusion_models", "name": "lotus-depth-g-v1-0-fp16.safetensors", "sizeGb": 1.62},
    {"folder": "diffusion_models", "name": "lotus-depth-d-v-1-1-fp16.safetensors", "sizeGb": 1.62},
    {"folder": "diffusion_models", "name": "lotus-normal-g-v1-1-fp16.safetensors", "sizeGb": 1.62},
    {"folder": "vae", "name": "vae-ft-mse-840000-ema-pruned.safetensors", "sizeGb": 0.31},
    {"folder": "upscale_models", "name": "RealESRGAN_x4plus.pth", "sizeGb": 0.06}
]
BAS_RELIEF_PRESETS = {"bas-relief-emblem", "bas-relief-emblem-concept"}
SHIELD_PRESETS = {"shield-emblem", "shield-emblem-back"}
OPEN_PROMPT_PRESET = "open-prompt"
IMAGE_PROMPT_KIND = "image-prompt"
SIMPLIFY_OBJECTS_PRESETS = {"simplify-objects", "simplify-objects-back"}
BAS_RELIEF_AND_OPEN_PROMPT_PRESETS = BAS_RELIEF_PRESETS | SHIELD_PRESETS | {OPEN_PROMPT_PRESET}
CREATURE_PRESET_PREFIX = "creature-"
SKIN_SURFACE_PROMPT = """Visible skin-like outfit areas:
The source outfit intentionally has exposed skin-like areas. Preserve those exposed areas instead of covering them with new cloth, armor, gloves, sleeves, leggings, collars, or panels.
Render exposed skin-like areas as smooth matte mannequin material: skin-toned plastic or resin, featureless, clean, non-realistic, low-shine, and PBR-readable.
No pores, veins, body hair, blemishes, sweat, scars, anatomy detail, or realistic skin texture. Keep it simple like a neutral material mask.
Only preserve exposed areas that are clearly part of the source outfit design. Do not add new exposed areas that are not in the source.
Skin cutoff guard:
Do not use mannequin skin as a cap, plug, filler, sleeve extension, glove extension, collar insert, neck stump, wrist stump, ankle stump, or artificial transition material.
At wrists, forearms, glove ends, bracer ends, sleeve cuffs, collars, gorgets, necklaces, neck rings, boot tops, and armor cutoffs, the outfit piece should terminate with its own material edge unless the source clearly shows exposed skin continuing beyond that exact edge.
If a bracer, glove, sleeve, collar, gorget, boot, or armor piece ends at a modular cutoff, finish it with a clean hard material rim, cuff, seam, bevel, shallow cap, or open dark interior. Do not add a gray or skin-toned body section beyond the edge just to complete the limb.
At the neck, terminate the body at the collar or neckline plane. Do not render a raised mannequin neck column, gray neck tube, exposed throat cylinder, or skin-colored plug above the collar.
Preserve skin only in intentional open regions such as bare torso, bare upper arm, open shoulder, exposed thigh, or deliberate neckline. Never infer extra skin just because the locked mannequin template has arms, neck, wrists, ankles, or gaps."""
ROBE_DRESS_SKIN_SURFACE_PROMPT = """Visible skin-like outfit areas for robe/dress:
The source outfit intentionally has exposed skin-like areas, but the robe/dress silhouette wins for the lower body.
Preserve exposed skin-like areas only above the waist, such as neckline, upper chest, shoulders, upper arms, or forearms, when they are clearly part of the source design.
Render any preserved upper-body skin-like areas as smooth matte mannequin material: skin-toned plastic or resin, featureless, clean, non-realistic, low-shine, and PBR-readable.
Do not preserve lower-body exposed skin. Do not show thighs, knees, calves, feet, or a full mannequin leg through robe/dress openings.
For ground-length dresses, gowns, and robes, close the lower garment, hide the lower body fully, cap the bottom, and keep the contact shadow. The dress/robe must always win below the waist.
Skin cutoff guard:
Do not use mannequin skin as a cap, plug, filler, sleeve extension, glove extension, collar insert, neck stump, wrist stump, ankle stump, or artificial transition material.
At wrists, forearms, glove ends, bracer ends, sleeve cuffs, collars, gorgets, necklaces, neck rings, boot tops, and armor cutoffs, the garment or armor piece should terminate with its own material edge unless the source clearly shows exposed skin continuing beyond that exact edge.
If a sleeve, bracer, glove, collar, gorget, boot, dress edge, or armor piece ends at a modular cutoff, finish it with a clean hard material rim, cuff, seam, bevel, hem, shallow cap, or open dark interior. Do not add a gray or skin-toned body section beyond the edge just to complete the limb.
At the neck, terminate the body at the collar or neckline plane. Do not render a raised mannequin neck column, gray neck tube, exposed throat cylinder, or skin-colored plug above the collar.
Preserve skin only in intentional open upper-body regions such as bare shoulder, exposed neckline, open upper chest, or deliberately bare upper arm. Never infer extra skin at neck, wrist, ankle, or lower-body gaps."""
EXTREME_SIMPLIFY_PROMPT = """Extreme Simplify:
Create a clean canvas version of the outfit for image-to-3D modeling. Preserve the silhouette, garment construction, large armor plates, major seams, major belts, large sashes, collars, cuffs, boots, robe or dress hem rules, and broad material zones.
Remove all embroidery, floral designs, damask patterns, tiny filigree, decorative scrollwork, brocade, lace patterning, decals, symbols, sigils, heraldry, logos, readable icons, tiny trim motifs, micro buckles, small studs, noisy engravings, ornamental surface art, busy texture detail, scratches, grime, dirt, rust, and photoreal material noise.
For creature presets, also remove individual fur strands, shaggy fur edges, tiny scale fields, dense chainmail rings, pores, wet highlights, and high-frequency creature texture noise.
Reduce materials to bare minimum PBR-readable textiles and surfaces: plain cloth, plain leather, smooth metal, padded fabric, simple chainmail zones, simple sculpted fur masses, broad grouped scale or hide zones, matte skin-like mannequin material when skin preservation is enabled, and clean boot or paw-wrap material.
Make the simplified PBR material separation stronger: clear roughness differences, broad smooth highlights on metal, subdued cloth sheen, controlled leather sheen, and clean color blocking.
Do not flatten the outfit into one material. Keep useful large material zones, but remove decorative surface art so the user can repaint details later."""
OBJECT_EXTREME_SIMPLIFY_PROMPT = """Extreme Simplify Objects:
Run a stronger cleanup pass for image-to-3D object extraction.
Preserve the requested object identity, silhouette, broad proportions, major functional parts, primary material zones, large handles, blades, rims, guards, hinges, buckles, panels, openings, bases, legs, and structural seams.
Remove tiny filigree, micro scrollwork, small decals, logos, readable text, busy etched patterns, tiny repeated ornament, tassels, loose cords, dangling strands, thin fringe, fragile spikes, stray ribbons, small straps that do not define the construction, excessive buckles, tiny bolts, tiny gems, scratches, grime, rust, chipped paint, high-frequency surface texture, and decorative clutter.
Collapse clusters of small straps, trims, wires, or filigree into one or two broader clean forms when their placement matters.
Keep only large functional straps, bands, rims, sockets, handles, or supports that are necessary for the object to read correctly.
Reduce materials to clean broad PBR-readable surfaces such as plain metal, wood, leather, cloth, stone, ceramic, bone, glass, painted surface, or gem.
Do not redesign the object, add new parts, or make it blocky. Make it cleaner, sturdier, and easier to convert into a mesh."""
NECK_CONNECTOR_PROMPT = """Create Neck Connector:
Add a fitted collar-level neck connector piece that acts as a clean wearable modular socket between this outfit body and a separately generated head.
Design it from the outfit's existing visual language: borrow broad shapes, materials, colors, trim logic, gems, metalwork, leatherwork, cloth bands, bracer shapes, boot shapes, belt motifs, or armor motifs already present in the source outfit.
Use creative variety. Do not default to the same simple choker every time. Choose one connector archetype that best fits the outfit's content, era, material, and silhouette.
When a specific Neck Connector Style is selected, that selected style is authoritative. When Auto Match Outfit is selected, choose the strongest connector type from the source outfit instead of falling back to a generic choker.
Possible connector archetypes include: broad choker, layered choker, pendant necklace, medallion necklace, torque collar, torc necklace, gorget plate, segmented armor collar, leather strap collar, cloth wrap collar, scarf-like short wrap, clasped mantle edge, decorative neck ring, crescent necklace, chain-and-plaque necklace, gem-set collar, high fabric collar, low collarbone collar, shoulder-linked collar, yoke-like collar, tabard-neck clasp, ribbon neck band, braided cord collar, bone or horn collar, ceremonial neck plate, mage amulet socket, and broad recessed socket collar.
Pendant or medallion variants are allowed when they make sense: the pendant, plaque, clasp, or amulet can visually cap the front neckline and create a clean modular break, while the actual collar-level cutoff/socket remains centered and usable for plugging in a head.
If using a necklace-style connector, make it broad and sculptural enough to read as mesh support, not a thin string. A chain, cord, ribbon, or pendant should become a simplified solid band, plaque, clasp, or amulet form suitable for image-to-3D conversion.
It must cover or replace any exposed mannequin neck stump. Do not leave gray or skin-toned neck filler visible above the outfit.
This overrides visible-skin preservation only at the modular neck cutoff: exposed shoulders, upper chest, or intentional open neckline skin may remain, but the plug-in head socket must not be a skin stump.
Collar-plane cutoff rule: the outfit should end at the collar, gorget, necklace, choker, scarf, or neckline plane. Do not render a vertical neck tube rising above it.
Scale the connector to the body, not like a small bottle cap: it should fit the full locked neck diameter and sit naturally on the shoulders, collarbone, upper chest, or gorget area with believable thickness and width.
Anatomy fit check: the connector must be at least as wide as the locked neck opening and visually integrated with the torso neckline. It should have enough front depth, side thickness, shoulder/collarbone coverage, or collar height to read as a wearable mesh piece, not a tiny plug.
Do not shrink the locked neck diameter to fit the connector. The connector must scale up to the template neck opening, not the neck opening scale down to the connector.
If the source character has an anime-thin neck, ignore that anatomy and build the connector for the locked modular body's neck opening diameter.
The socket may be a shallow concave cap, shallow convex cap, flat cap, clean rim, or hollow dark recessed opening at collar level. It can be open or capped; the later 3D generator can fill the interior.
Keep the top cutoff clean, centered, circular or oval enough for a head/neck mesh to plug into later, and flush with the collar plane rather than raised into a visible cylinder. The opening should be large enough for the body's modular neck scale, not a tiny hole.
Keep it rig-friendly, symmetrical enough for front/back generation, close to the neck cutoff, and not tall enough to become a head, mask, hood, helmet, face, throat, or neck column.
Avoid a thin coin rim, tiny cap, cork, button, bottle-cap plug, miniature ring perched on top of the torso, raised gray cylinder, exposed mannequin neck tube, or tall cup-shaped socket.
Do not add hair, chin, jaw, face, head, throat anatomy, realistic skin, a full mannequin neck, or a visible vertical neck cylinder.
In Auto Match Outfit mode, if the outfit already has a good collar, gorget, choker, necklace, or neck rim, strengthen and clean that existing piece instead of inventing a second competing neck piece. In a specific style mode, adapt the chosen style to the outfit while preserving the locked neck scale.
Use broad readable forms and avoid tiny filigree unless the outfit already relies on large matching ornament. Prefer one strong connector idea over many small decorations."""
NECK_CONNECTOR_STYLE_PROMPTS = {
    "auto": """Neck Connector Style: Auto Match Outfit.
Choose the neck connector archetype that best matches the source outfit's existing neckwear, armor language, cloth language, jewelry language, bracers, belts, boots, and material hierarchy.
If the source already has a necklace or pendant, prefer a broad necklace or pendant connector. If it has armor or hard bracers, prefer a gorget or plate collar. If it has soft cloth, prefer a cloth wrap or collar. If it is formal or magical, prefer a ceremonial connector.
Do not default to a choker unless a choker/collar is genuinely the best match. Keep the result body-scaled, broad enough for mesh generation, fitted to the locked neck opening, and flush at the collar plane.""",
    "choker-collar": """Neck Connector Style: Choker / Collar.
Force the connector toward a fitted choker, collar band, low collar, high collar, neck ring, or structured collar.
It should wrap fully around the neck opening as a broad wearable band with body-scale thickness, not a tiny rim.
Avoid pendant-dominant, scarf-dominant, or heavy armor gorget solutions unless the outfit clearly requires them.""",
    "necklace-pendant": """Neck Connector Style: Necklace / Pendant.
Force the connector toward a necklace, pendant, medallion, amulet, chain-and-plaque, crescent necklace, torque, torc, or broad decorative neck piece.
It must still function as a modular mesh connector: make the necklace broad, sculptural, and solid enough to create a clean neck break and hide the mannequin neck stump.
The pendant, medallion, clasp, or plaque may cap the front neckline visually, while the top neck cutoff remains centered, body-scale, collar-level, and usable for plugging in a head.
Do not turn it into a thin string, tiny charm, or fragile chain.""",
    "gorget-armor": """Neck Connector Style: Gorget / Armor.
Force the connector toward an armored gorget, segmented armor collar, metal socket collar, plate yoke, raised neck guard, or hard protective neck piece.
It should use the outfit's armor, bracer, boot, belt, or metal motifs and fit naturally over the upper chest, collarbone, shoulders, and full neck diameter.
Avoid delicate necklace-only or soft scarf solutions.""",
    "cloth-scarf": """Neck Connector Style: Cloth / Scarf.
Force the connector toward a cloth wrap, scarf-like short wrap, soft collar, mantle edge, folded fabric band, ribbon neck band, or padded textile connector.
It should be broad, clean, and sculptural enough for mesh generation, with a body-scale neck opening and no loose dangling strips.
Avoid hard armor gorgets or jewelry-dominant pendants unless the outfit clearly requires them.""",
    "ceremonial-fantasy": """Neck Connector Style: Ceremonial / Fantasy.
Force the connector toward a more expressive fantasy connector: ceremonial neck plate, gem-set collar, mage amulet socket, noble yoke, ritual collar, ornate clasp, bone or horn collar, or symbolic but non-logo neck piece.
Use the outfit's existing motifs and materials, but keep the forms broad, readable, mesh-friendly, and body-scaled.
Avoid tiny filigree, fragile chains, unreadable micro-ornament, or a small cap-like plug."""
}
CREATURE_TAIL_ENABLED_PROMPT = """Creature tail option:
Creature has tail is enabled. Keep one tail attached at the correct rear pelvis/tail-root area whenever that view can naturally show it. The tail must be straight on its view axis: centered and vertical/downward in front or back views, and a clean straight profile extension in side view. Do not curve, sway, curl, twist, wag, hook, arc, coil, or drift the tail left or right. Do not rotate or angle a front or back view just to show more tail. The dedicated creature side view should show the full tail profile. Follow any tail range or tail silhouette reference included by the selected creature preset, and never exceed that skeleton's allowed tail length or extension."""
CREATURE_TAIL_DISABLED_PROMPT = """Creature tail option:
Creature has tail is disabled. Do not include a tail, tail stump, tail shadow, tail strap, or tail-like cloth. If the creature species normally has a tail, create a no-tail variant for this output."""
BAS_RELIEF_ASPECT_LABELS = {
    "2:3": "vertical 2:3",
    "3:4": "vertical 3:4",
    "4:5": "vertical 4:5",
    "9:16": "tall vertical 9:16",
    "1:1": "square 1:1",
    "4:3": "landscape 4:3",
    "16:9": "wide landscape 16:9",
}
GEMINI_IMAGE_SIZES = {"1K", "2K", "4K"}
GEMINI_RESPONSE_ASPECT_ENUMS = {
    "1:1": "ASPECT_RATIO_ONE_BY_ONE",
    "2:3": "ASPECT_RATIO_TWO_BY_THREE",
    "3:4": "ASPECT_RATIO_THREE_BY_FOUR",
    "4:5": "ASPECT_RATIO_FOUR_BY_FIVE",
    "9:16": "ASPECT_RATIO_NINE_BY_SIXTEEN",
    "4:3": "ASPECT_RATIO_FOUR_BY_THREE",
    "16:9": "ASPECT_RATIO_SIXTEEN_BY_NINE",
}
GEMINI_RESPONSE_SIZE_ENUMS = {
    "1K": "IMAGE_SIZE_ONE_K",
    "2K": "IMAGE_SIZE_TWO_K",
    "4K": "IMAGE_SIZE_FOUR_K",
}
OUTPUTS_README = """Neverwinter Forge Outputs

Generated images and metadata are auto-saved in this folder when this copy of
Neverwinter Forge is the active running app.

If another Neverwinter Forge window/server is already using 127.0.0.1:8765,
this copy uses the next available local port so this folder remains the output
destination for this copy.
"""


def first_env_path(*names):
    for name in names:
        value = os.environ.get(name)
        if value:
            return Path(value).expanduser()
    return None


def depth_config_value(key):
    if not DEPTH_PATH_CONFIG.exists():
        return None
    try:
        data = json.loads(DEPTH_PATH_CONFIG.read_text(encoding="utf-8"))
    except Exception:
        return None
    value = data.get(key)
    if not value:
        return None
    return value


def depth_config_path(key):
    value = depth_config_value(key)
    if not value:
        return None
    return Path(value).expanduser()


def first_env_value(*names):
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return None


def first_existing_path(paths):
    for path in paths:
        if path and path.exists():
            return path
    return None


def depth_path_candidates():
    system_drive = Path(os.environ.get("SystemDrive", "C:") + "/")
    local_app_data = Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData" / "Local")))
    home = Path.home()
    app_comfy_roots = [
        ROOT / "ComfyUI",
        ROOT / "ComfyUI-Easy-Install" / "ComfyUI",
        ROOT / "ComfyUI_windows_portable" / "ComfyUI"
    ]
    common_comfy_roots = [
        system_drive / "ComfyUI" / "ComfyUI",
        system_drive / "ComfyUI",
        system_drive / "ComfyUI_windows_portable" / "ComfyUI",
        home / "ComfyUI" / "ComfyUI",
        home / "ComfyUI",
        home / "Documents" / "ComfyUI" / "ComfyUI",
        home / "Documents" / "ComfyUI",
        home / "Downloads" / "ComfyUI_windows_portable" / "ComfyUI",
        home / "Downloads" / "ComfyUI" / "ComfyUI",
        local_app_data / "Programs" / "ComfyUI" / "resources" / "ComfyUI",
        local_app_data / "Programs" / "@comfyorgcomfyui-electron" / "resources" / "ComfyUI"
    ]
    comfy_roots = app_comfy_roots + common_comfy_roots
    models_roots = [
        ROOT / "ComfyUI" / "models",
        ROOT / "ComfyUI-Easy-Install" / "ComfyUI" / "models",
        ROOT / "ComfyUI_windows_portable" / "ComfyUI" / "models",
        ROOT / "models" / "comfyui"
    ]
    models_roots.extend(path / "models" for path in common_comfy_roots)
    return comfy_roots, models_roots


def resolve_depth_paths():
    comfy_candidates, models_candidates = depth_path_candidates()
    comfy_root = depth_config_path("comfyRoot") or first_env_path("NEVERWINTER_COMFYUI_ROOT", "COMFYUI_ROOT")
    models_root = depth_config_path("modelsRoot") or first_env_path("NEVERWINTER_COMFYUI_MODELS_ROOT", "COMFYUI_MODELS_ROOT")
    if not comfy_root:
        comfy_root = first_existing_path(comfy_candidates) or comfy_candidates[0]
    if not models_root:
        if comfy_root and (comfy_root / "models").exists():
            models_root = comfy_root / "models"
        else:
            models_root = first_existing_path(models_candidates) or (ROOT / "models" / "comfyui")
    return comfy_root, models_root, comfy_candidates, models_candidates


def comfyui_url_candidates():
    configured_url = depth_config_value("comfyUrl") or first_env_value("NEVERWINTER_COMFYUI_URL", "COMFYUI_URL")
    candidates = []
    if configured_url:
        candidates.append(configured_url.rstrip("/"))
    candidates.extend(COMFYUI_URL_CANDIDATES)
    candidates.extend(discover_local_comfyui_urls())
    unique_candidates = []
    for candidate in candidates:
        if candidate not in unique_candidates:
            unique_candidates.append(candidate)
    return unique_candidates


def resolve_comfyui_url(candidates=None):
    candidates = candidates or comfyui_url_candidates()
    for candidate in candidates:
        if is_comfyui_server_reachable(candidate):
            return candidate
    return candidates[0] if candidates else DEFAULT_COMFYUI_URL


def discover_local_comfyui_urls():
    discovered = []
    for port in COMFYUI_DISCOVERY_PORTS:
        candidate = f"http://127.0.0.1:{port}"
        if candidate in COMFYUI_URL_CANDIDATES:
            continue
        if is_port_open("127.0.0.1", port) and is_comfyui_server_reachable(candidate, timeout=0.35):
            discovered.append(candidate)
    return discovered


def is_port_open(host, port):
    try:
        with socket.create_connection((host, port), timeout=0.03):
            return True
    except OSError:
        return False


PRICING_SOURCE = "https://ai.google.dev/gemini-api/docs/pricing"
OPENAI_PRICING_SOURCE = "https://developers.openai.com/api/docs/guides/image-generation"
PRICING_LAST_VERIFIED = "2026-05-24"
GEMINI_MODEL_PRICING = {
    "gemini-2.5-flash-image": {
        "label": "Gemini 2.5 Flash Image",
        "estimateUsd": 0.039,
        "basis": "Standard image output, up to 1024x1024px. Input tokens not included."
    },
    "gemini-3.1-flash-image-preview": {
        "label": "Gemini 3.1 Flash Image Preview",
        "estimateUsd": 0.101,
        "basis": "Standard 2K image output estimate. 1K is about $0.067; 4K is about $0.151. Input tokens not included.",
        "estimatesBySize": {
            "1K": 0.067,
            "2K": 0.101,
            "4K": 0.151
        }
    },
    "gemini-3-pro-image-preview": {
        "label": "Gemini 3 Pro Image Preview",
        "estimateUsd": 0.1351,
        "basis": "Standard 1K/2K image output plus approximate image input cost. Text tokens not included."
    }
}
OPENAI_MODEL_PRICING = {
    "gpt-image-2": {
        "label": "GPT Image 2",
        "inputTokenNote": "Edit requests also include text and image input tokens.",
        "estimates": {
            "1024x1024": {"low": 0.006, "medium": 0.053, "high": 0.211},
            "1024x1536": {"low": 0.005, "medium": 0.041, "high": 0.165},
            "1536x1024": {"low": 0.005, "medium": 0.041, "high": 0.165}
        }
    },
    "gpt-image-1.5": {
        "label": "GPT Image 1.5",
        "inputTokenNote": "Edit requests also include text and image input tokens.",
        "estimates": {
            "1024x1024": {"low": 0.009, "medium": 0.034, "high": 0.133},
            "1024x1536": {"low": 0.013, "medium": 0.050, "high": 0.200},
            "1536x1024": {"low": 0.013, "medium": 0.050, "high": 0.200}
        }
    },
    "gpt-image-1-mini": {
        "label": "GPT Image 1 Mini",
        "inputTokenNote": "Edit requests also include text and image input tokens.",
        "estimates": {
            "1024x1024": {"low": 0.005, "medium": 0.011, "high": 0.036},
            "1024x1536": {"low": 0.006, "medium": 0.015, "high": 0.052},
            "1536x1024": {"low": 0.006, "medium": 0.015, "high": 0.052}
        }
    }
}
UPSCALER_DOWNLOAD_STATE = {
    "active": False,
    "installed": False,
    "status": "idle",
    "downloadedBytes": 0,
    "totalBytes": 0,
    "percent": 0,
    "error": "",
    "message": ""
}
UPSCALER_LOCK = threading.Lock()
UPDATE_DOWNLOAD_STATE = {
    "active": False,
    "status": "idle",
    "downloadedBytes": 0,
    "totalBytes": 0,
    "percent": 0,
    "error": "",
    "message": "",
    "packagePath": "",
    "release": None
}
UPDATE_LOCK = threading.Lock()


def read_version_metadata():
    fallback = {
        "version": "0.0.0",
        "releaseName": "Neverwinter Forge",
        "repository": "judeinc/Neverwinter-Forge-Official",
        "releaseApiUrl": "https://api.github.com/repos/judeinc/Neverwinter-Forge-Official/releases/latest",
        "releasePageUrl": "https://github.com/judeinc/Neverwinter-Forge-Official/releases/latest"
    }
    if not VERSION_FILE.exists():
        return fallback
    try:
        data = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
        return {**fallback, **data}
    except Exception:
        return fallback


def normalize_version(version):
    text = str(version or "").strip().lower()
    if text.startswith("v"):
        text = text[1:]
    parts = []
    suffix = ""
    current = ""
    for char in text:
        if char.isdigit() or char == ".":
            current += char
        else:
            suffix += char
    for item in current.split("."):
        if item:
            parts.append(int(item))
    while len(parts) < 3:
        parts.append(0)
    suffix_rank = 0
    if suffix:
        suffix_rank = sum((ord(char) - 96) for char in suffix if "a" <= char <= "z")
    return (*parts[:3], suffix_rank)


def is_newer_version(candidate, current):
    return normalize_version(candidate) > normalize_version(current)


def release_request(url):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Neverwinter-Forge-Updater"
    }
    req = request.Request(url, headers=headers)
    with request.urlopen(req, timeout=18) as response:
        return json.loads(response.read().decode("utf-8"))


def select_release_asset(release):
    assets = release.get("assets") or []
    zip_assets = [asset for asset in assets if str(asset.get("name", "")).lower().endswith(".zip")]
    preferred = [
        asset for asset in zip_assets
        if "neverwinterforge" in str(asset.get("name", "")).replace(" ", "").lower()
        or "neverwinter-forge" in str(asset.get("name", "")).lower()
    ]
    candidates = preferred or zip_assets
    return candidates[0] if candidates else None


def fetch_latest_release():
    version_info = read_version_metadata()
    release = release_request(version_info["releaseApiUrl"])
    asset = select_release_asset(release)
    tag = str(release.get("tag_name") or release.get("name") or "").strip()
    version = tag[1:] if tag.lower().startswith("v") else tag
    return {
        "version": version,
        "tag": tag,
        "name": release.get("name") or tag,
        "body": release.get("body") or "",
        "htmlUrl": release.get("html_url") or version_info["releasePageUrl"],
        "publishedAt": release.get("published_at") or "",
        "assetName": asset.get("name") if asset else "",
        "assetUrl": asset.get("browser_download_url") if asset else "",
        "assetSize": asset.get("size") if asset else 0
    }


def read_update_notice():
    if not UPDATE_STATE_FILE.exists():
        return None
    try:
        data = json.loads(UPDATE_STATE_FILE.read_text(encoding="utf-8"))
        if data.get("status") in {"installed", "error"}:
            return data
    except Exception:
        return None
    return None


def clear_update_notice():
    if UPDATE_STATE_FILE.exists():
        try:
            UPDATE_STATE_FILE.unlink()
        except OSError:
            pass


def can_install_updates():
    if os.environ.get("FORGE_ALLOW_SOURCE_UPDATE") == "1":
        return True
    return bool(getattr(sys, "frozen", False))


def updater_launch_command():
    if getattr(sys, "frozen", False):
        updater = ROOT / "ForgeUpdater.exe"
        if not updater.exists():
            return None
        runner = UPDATES / "ForgeUpdater-runner.exe"
        try:
            UPDATES.mkdir(parents=True, exist_ok=True)
            shutil.copy2(updater, runner)
        except Exception:
            return [str(updater)]
        return [str(runner)]
    updater = ROOT / "forge_updater.py"
    return [sys.executable, str(updater)] if updater.exists() else None


def update_status(latest=None):
    version_info = read_version_metadata()
    with UPDATE_LOCK:
        download = dict(UPDATE_DOWNLOAD_STATE)
    if latest is None:
        latest = download.get("release")
    return {
        "currentVersion": version_info["version"],
        "releaseName": version_info["releaseName"],
        "repository": version_info["repository"],
        "releasePageUrl": version_info["releasePageUrl"],
        "canInstall": can_install_updates() and updater_launch_command() is not None,
        "isPackaged": bool(getattr(sys, "frozen", False)),
        "latest": latest,
        "download": download,
        "notice": read_update_notice()
    }


def set_update_download_state(**updates):
    with UPDATE_LOCK:
        UPDATE_DOWNLOAD_STATE.update(updates)


def download_update_package(release):
    UPDATE_DOWNLOADS.mkdir(parents=True, exist_ok=True)
    safe_name = str(release.get("assetName") or f"NeverwinterForge-{release['version']}.zip").replace("/", "-").replace("\\", "-")
    package_path = UPDATE_DOWNLOADS / safe_name
    temp_path = package_path.with_suffix(package_path.suffix + ".part")
    headers = {"User-Agent": "Neverwinter-Forge-Updater"}
    req = request.Request(release["assetUrl"], headers=headers)

    try:
        set_update_download_state(status="downloading", message=f"Downloading Neverwinter Forge {release['version']}...")
        with request.urlopen(req, timeout=30) as response, temp_path.open("wb") as handle:
            total = int(response.headers.get("Content-Length") or release.get("assetSize") or 0)
            downloaded = 0
            while True:
                chunk = response.read(1024 * 512)
                if not chunk:
                    break
                handle.write(chunk)
                downloaded += len(chunk)
                percent = int((downloaded / total) * 100) if total else 0
                set_update_download_state(
                    downloadedBytes=downloaded,
                    totalBytes=total,
                    percent=percent,
                    message=f"Downloading Neverwinter Forge {release['version']}..."
                )
        temp_path.replace(package_path)
        set_update_download_state(
            active=False,
            status="ready",
            downloadedBytes=package_path.stat().st_size,
            totalBytes=package_path.stat().st_size,
            percent=100,
            error="",
            message=f"Update {release['version']} downloaded. Restart Forge to install.",
            packagePath=str(package_path),
            release=release
        )
    except Exception as exc:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)
        set_update_download_state(
            active=False,
            status="error",
            error=str(exc),
            message="Update download failed.",
            packagePath="",
            release=release
        )


def shutdown_server_soon(server):
    time.sleep(0.35)
    try:
        server.shutdown()
    finally:
        os._exit(0)


class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        route_path = urlparse(self.path).path

        if route_path == "/api/presets":
            self._send_json({"presets": load_presets()})
            return

        if route_path == "/api/extra-prompt":
            self._send_json({"prompt": read_extra_prompt()})
            return

        if route_path == "/api/pricing":
            self._send_json({
                "geminiSource": PRICING_SOURCE,
                "openaiSource": OPENAI_PRICING_SOURCE,
                "lastVerified": PRICING_LAST_VERIFIED,
                "geminiModels": GEMINI_MODEL_PRICING,
                "openaiModels": OPENAI_MODEL_PRICING,
                "models": GEMINI_MODEL_PRICING
            })
            return

        if route_path == "/api/preset-asset":
            self._send_preset_asset()
            return

        if route_path == "/api/upscaler/status":
            self._send_json(upscaler_status())
            return

        if route_path == "/api/update/status":
            self._send_json(update_status())
            return

        if route_path == "/api/depth/status":
            self._send_json(depth_workflow_status())
            return

        if route_path == "/api/outputs/status":
            initialize_app_storage()
            self._send_json({
                "outputDir": str(OUTPUTS),
                "exists": OUTPUTS.exists()
            })
            return

        if route_path.startswith("/outputs/"):
            requested_output = (OUTPUTS / route_path[len("/outputs/"):]).resolve()
            outputs_root = OUTPUTS.resolve()
            if requested_output != outputs_root and outputs_root not in requested_output.parents:
                self._send_json({"error": "Invalid output path"}, status=403)
                return
            if requested_output.is_file():
                self._send_file(requested_output)
                return
            self._send_json({"error": "Output not found"}, status=404)
            return

        if route_path == "/api/prompt":
            self._send_json({"prompt": read_extra_prompt()})
            return

        if route_path == "/":
            self._send_file(PUBLIC / "index.html")
            return

        if route_path in {"/model-tools", "/models"}:
            self._send_file(PUBLIC / "model-tools.html")
            return
        if route_path in {"/model-editor", "/mdb-editor"}:
            self._send_file(PUBLIC / "model-editor.html")
            return
        if route_path in {"/model-edit-clone", "/model-clone-editor"}:
            self._send_file(PUBLIC / "model-edit-clone.html")
            return

        requested = (PUBLIC / route_path.lstrip("/")).resolve()
        if PUBLIC.resolve() not in requested.parents and requested != PUBLIC.resolve():
            self._send_json({"error": "Invalid path"}, status=403)
            return

        if requested.is_file():
            self._send_file(requested)
            return

        self._send_json({"error": "Not found"}, status=404)

    def do_POST(self):
        if self.path == "/api/extra-prompt":
            self._save_extra_prompt()
            return

        if self.path == "/api/prompt":
            self._save_extra_prompt()
            return

        if self.path == "/api/generate":
            self._generate()
            return

        if self.path == "/api/upscaler/download":
            self._start_upscaler_download()
            return

        if self.path == "/api/update/check":
            self._check_for_update()
            return

        if self.path == "/api/update/download":
            self._start_update_download()
            return

        if self.path == "/api/update/apply":
            self._apply_update()
            return

        if self.path == "/api/update/dismiss":
            self._dismiss_update_notice()
            return

        if self.path == "/api/upscaler/upscale":
            self._upscale()
            return

        if self.path == "/api/depth/process":
            self._process_depth_maps()
            return

        if self.path == "/api/mdb/scan":
            self._scan_mdb_folder()
            return

        if self.path == "/api/mdb/upload":
            self._scan_uploaded_mdb_files()
            return

        if self.path == "/api/mdb/clone":
            self._clone_mdb_models()
            return

        if self.path == "/api/mdb/flags":
            self._save_mdb_flags()
            return

        if self.path == "/api/mdb/edit-clone":
            self._clone_edited_mdb_models()
            return

        if self.path == "/api/mdb/edit-clone-upload":
            self._clone_edited_uploaded_mdb()
            return

        if self.path == "/api/mdb/conflicts":
            self._check_mdb_conflicts()
            return

        if self.path == "/api/mdb/preview":
            self._preview_mdb_model()
            return

        if self.path == "/api/mdb/delete-created":
            self._delete_created_files()
            return

        if self.path == "/api/dialog/folder":
            self._choose_folder()
            return

        if self.path == "/api/outputs/open":
            self._open_outputs_folder()
            return

        self._send_json({"error": "Not found"}, status=404)

    def _save_extra_prompt(self):
        payload = self._read_json()
        prompt = str(payload.get("prompt", "")).strip()
        EXTRA_PROMPT.parent.mkdir(parents=True, exist_ok=True)
        EXTRA_PROMPT.write_text(prompt, encoding="utf-8")
        self._send_json({"ok": True, "prompt": prompt})

    def _generate(self):
        payload = self._read_json(max_bytes=80 * 1024 * 1024)
        mode = payload.get("mode", "mock")
        image_data = payload.get("imageData", "")
        mime_type = payload.get("mimeType", "image/png")
        prompt = payload.get("prompt") or build_prompt(payload)
        preset = get_preset(str(payload.get("presetId", "")))
        is_open_prompt = preset and preset.get("kind") == "open"
        is_text_to_image = preset and (preset.get("kind") == "text-to-image" or (is_open_prompt and not image_data))

        if not image_data and not is_text_to_image:
            self._send_json({"error": "Missing image data"}, status=400)
            return

        if mode == "mock":
            if is_text_to_image:
                image_data = mock_text_image(prompt, str(payload.get("textPrompt", "object concept")))
                mime_type = "image/svg+xml"
            saved = save_generation_output(image_data, mime_type, prompt, payload, mode)
            self._send_json({
                "mode": "mock",
                "imageData": image_data,
                "mimeType": mime_type,
                "savedPath": saved["imagePath"],
                "metadataPath": saved["metadataPath"],
                "estimatedCostUsd": 0,
                "promptLength": len(prompt),
                "note": "Mock mode generated a placeholder image without using API credits." if is_text_to_image else "Mock mode returned the input image without using API credits."
            })
            return

        if mode not in ["gemini", "openai"]:
            self._send_json({"error": f"Unsupported mode: {mode}"}, status=400)
            return

        api_key = str(payload.get("apiKey", "")).strip()
        if mode == "openai":
            api_key = str(payload.get("openaiApiKey", api_key)).strip()

        model = str(payload.get("model", "gemini-2.5-flash-image")).strip()
        if mode == "openai":
            model = str(payload.get("openaiModel", "gpt-image-2")).strip()

        if not api_key:
            provider_name = "OpenAI" if mode == "openai" else "Gemini"
            self._send_json({"error": f"Missing {provider_name} API key"}, status=400)
            return

        try:
            if mode == "openai":
                if is_text_to_image:
                    result = call_openai_image_generation(api_key, model, prompt, payload)
                else:
                    result = call_openai_image_edit(api_key, model, prompt, image_data, mime_type, payload)
            else:
                result = call_gemini(api_key, model, prompt, image_data, mime_type, payload)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=502)
            return

        saved = save_generation_output(result["imageData"], result["mimeType"], prompt, payload, mode)
        result["savedPath"] = saved["imagePath"]
        result["metadataPath"] = saved["metadataPath"]
        result["promptLength"] = len(prompt)
        result["estimatedCostUsd"] = estimate_generation_cost(mode, model, payload)
        self._send_json(result)

    def _check_for_update(self):
        try:
            latest = fetch_latest_release()
            current = read_version_metadata()
            latest["available"] = is_newer_version(latest["version"], current["version"])
            with UPDATE_LOCK:
                UPDATE_DOWNLOAD_STATE["release"] = latest
                if latest["available"]:
                    UPDATE_DOWNLOAD_STATE["message"] = f"Update {latest['version']} is available."
                elif UPDATE_DOWNLOAD_STATE["status"] in {"idle", "checked"}:
                    UPDATE_DOWNLOAD_STATE["status"] = "checked"
                    UPDATE_DOWNLOAD_STATE["message"] = "Neverwinter Forge is up to date."
            self._send_json(update_status(latest))
        except Exception as exc:
            with UPDATE_LOCK:
                UPDATE_DOWNLOAD_STATE.update({
                    "active": False,
                    "status": "error",
                    "error": str(exc),
                    "message": "Could not check for updates."
                })
            self._send_json(update_status(), status=502)

    def _start_update_download(self):
        payload = self._read_json(max_bytes=1024 * 1024)
        with UPDATE_LOCK:
            if UPDATE_DOWNLOAD_STATE["active"]:
                self._send_json(update_status())
                return
            release = UPDATE_DOWNLOAD_STATE.get("release")

        try:
            if not release or payload.get("refresh"):
                release = fetch_latest_release()
                current = read_version_metadata()
                release["available"] = is_newer_version(release["version"], current["version"])
            if not release.get("available"):
                self._send_json({"error": "No newer Forge release is available.", **update_status(release)}, status=400)
                return
            if not release.get("assetUrl"):
                self._send_json({"error": "Latest release does not include a downloadable Forge ZIP asset.", **update_status(release)}, status=404)
                return
        except Exception as exc:
            self._send_json({"error": str(exc), **update_status()}, status=502)
            return

        with UPDATE_LOCK:
            UPDATE_DOWNLOAD_STATE.update({
                "active": True,
                "status": "starting",
                "downloadedBytes": 0,
                "totalBytes": int(release.get("assetSize") or 0),
                "percent": 0,
                "error": "",
                "message": f"Starting download for Neverwinter Forge {release['version']}...",
                "packagePath": "",
                "release": release
            })

        thread = threading.Thread(target=download_update_package, args=(release,), daemon=True)
        thread.start()
        self._send_json(update_status(release))

    def _apply_update(self):
        status = update_status()
        if not status["canInstall"]:
            self._send_json({
                "error": "Automatic install is disabled in source mode. Build the packaged Forge release to test install/restart.",
                **status
            }, status=400)
            return
        download = status["download"]
        package_path = Path(download.get("packagePath", ""))
        if download.get("status") != "ready" or not package_path.is_file():
            self._send_json({"error": "No downloaded update package is ready to install.", **status}, status=400)
            return

        updater_command = updater_launch_command()
        if not updater_command:
            self._send_json({"error": "ForgeUpdater.exe was not found beside the Forge app.", **status}, status=500)
            return

        release = download.get("release") or {}
        version = str(release.get("version") or "")
        launch_path = Path(sys.executable).resolve() if getattr(sys, "frozen", False) else ROOT / "launch.py"
        command = updater_command + [
            "--package", str(package_path),
            "--target", str(ROOT),
            "--launch", str(launch_path),
            "--parent-pid", str(os.getpid()),
            "--version", version
        ]

        try:
            subprocess.Popen(command, cwd=str(ROOT), close_fds=True)
        except Exception as exc:
            self._send_json({"error": f"Could not start Forge updater: {exc}", **status}, status=500)
            return

        self._send_json({
            **status,
            "message": "Forge is closing. The updater will install the latest version and relaunch Forge."
        })
        threading.Thread(target=shutdown_server_soon, args=(self.server,), daemon=True).start()

    def _dismiss_update_notice(self):
        clear_update_notice()
        self._send_json(update_status())

    def _start_upscaler_download(self):
        status = upscaler_status()
        if status["installed"]:
            self._send_json(status)
            return

        with UPSCALER_LOCK:
            if UPSCALER_DOWNLOAD_STATE["active"]:
                self._send_json(upscaler_status())
                return
            UPSCALER_DOWNLOAD_STATE.update({
                "active": True,
                "status": "starting",
                "downloadedBytes": 0,
                "totalBytes": 0,
                "percent": 0,
                "error": "",
                "message": "Starting upscaler download..."
            })

        thread = threading.Thread(target=download_upscaler_runtime, daemon=True)
        thread.start()
        self._send_json(upscaler_status())

    def _upscale(self):
        payload = self._read_json(max_bytes=60 * 1024 * 1024)
        image_data = payload.get("imageData", "")
        mime_type = payload.get("mimeType", "image/png")
        scale = int(payload.get("scale", 2))
        source_name = str(payload.get("sourceName", "generated-output"))

        if scale not in [2, 4]:
            self._send_json({"error": "Upscale scale must be 2 or 4"}, status=400)
            return
        if not image_data:
            self._send_json({"error": "Missing image data"}, status=400)
            return

        status = upscaler_status()
        if not status["installed"]:
            self._send_json({"error": "Upscaler runtime is not installed"}, status=400)
            return

        try:
            result = upscale_image(image_data, mime_type, scale, source_name)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=502)
            return

        self._send_json(result)

    def _process_depth_maps(self):
        payload = self._read_json(max_bytes=60 * 1024 * 1024)
        image_data = payload.get("imageData", "")
        mime_type = payload.get("mimeType", "image/png")
        source_name = str(payload.get("sourceName", "depth-source"))

        if not image_data:
            self._send_json({"error": "Missing image data"}, status=400)
            return

        status = depth_workflow_status()
        if not status["installed"]:
            self._send_json({"error": "Depth workflow dependencies are missing", "status": status}, status=400)
            return
        if not status["serverReachable"]:
            self._send_json({"error": f"ComfyUI is not reachable at {status['comfyUrl']}", "status": status}, status=400)
            return

        try:
            result = process_depth_maps(image_data, mime_type, source_name)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=502)
            return

        self._send_json(result)

    def _scan_mdb_folder(self):
        payload = self._read_json(max_bytes=1024 * 1024)
        root_path = str(payload.get("rootPath", "")).strip()
        recursive = bool(payload.get("recursive", True))
        max_files = int(payload.get("maxFiles", 2000) or 2000)

        if not root_path:
            self._send_json({"error": "Choose a model folder to scan."}, status=400)
            return

        try:
            result = scan_mdb_folder(root_path, recursive=recursive, max_files=max_files)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _clone_mdb_models(self):
        payload = self._read_json(max_bytes=5 * 1024 * 1024)
        output_dir = str(payload.get("outputDir", "")).strip()
        jobs = payload.get("jobs", [])
        conflict_mode = str(payload.get("conflictMode", "auto"))

        if not output_dir:
            self._send_json({"error": "Choose an output folder."}, status=400)
            return
        if not jobs:
            self._send_json({"error": "Select at least one model to clone."}, status=400)
            return

        try:
            result = clone_and_rename_models(jobs, output_dir, conflict_mode=conflict_mode)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _save_mdb_flags(self):
        payload = self._read_json(max_bytes=5 * 1024 * 1024)
        jobs = payload.get("jobs", [])
        root_path = str(payload.get("rootPath", "")).strip()
        recursive = bool(payload.get("recursive", True))

        if not jobs:
            self._send_json({"error": "Select at least one MDB to edit."}, status=400)
            return

        try:
            result = save_mdb_flag_edits(jobs, root_path=root_path, recursive=recursive)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _clone_edited_mdb_models(self):
        payload = self._read_json(max_bytes=5 * 1024 * 1024)
        output_dir = str(payload.get("outputDir", "")).strip()
        jobs = payload.get("jobs", [])
        conflict_mode = str(payload.get("conflictMode", "auto"))

        if not jobs:
            self._send_json({"error": "Select at least one MDB to clone."}, status=400)
            return

        try:
            result = clone_and_edit_models(jobs, output_dir, conflict_mode=conflict_mode)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _clone_edited_uploaded_mdb(self):
        try:
            form = self._read_multipart_form(max_bytes=250 * 1024 * 1024)
            files = form["files"]
            fields = form["fields"]
            if not files:
                raise ValueError("Choose an MDB file to clone.")
            edit_job = json.loads(fields.get("job", "{}") or "{}")
            result = clone_and_edit_uploaded_model(
                files[0],
                fields.get("outputDir", ""),
                fields.get("newName", ""),
                edit_job=edit_job,
                conflict_mode=fields.get("conflictMode", "auto"),
            )
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _check_mdb_conflicts(self):
        payload = self._read_json(max_bytes=5 * 1024 * 1024)
        output_dir = str(payload.get("outputDir", "")).strip()
        jobs = payload.get("jobs", [])

        if not jobs:
            self._send_json({"conflicts": [], "duplicates": [], "outputDirExists": bool(output_dir and Path(output_dir).expanduser().exists())})
            return

        try:
            default_output = Path(output_dir).expanduser().resolve() if output_dir else None
            seen = {}
            duplicates = []
            conflicts = []
            output_exists = False
            for job in jobs:
                name = str(job.get("newName", "")).strip()
                if not name:
                    continue
                job_output = str(job.get("outputDir", "")).strip()
                output = Path(job_output).expanduser().resolve() if job_output else default_output
                if output is None:
                    continue
                output_exists = output_exists or output.exists()
                file_name = f"{Path(name).stem}.mdb"
                key = f"{str(output).lower()}|{file_name.lower()}"
                if key in seen:
                    duplicates.append({"name": file_name, "outputDir": str(output), "first": seen[key], "duplicate": str(job.get("path", ""))})
                else:
                    seen[key] = str(job.get("path", ""))
                target = output / file_name
                if target.exists():
                    conflicts.append({"name": file_name, "path": str(target), "outputDir": str(output)})
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json({
            "outputDir": str(default_output) if default_output else "",
            "outputDirExists": output_exists,
            "conflicts": conflicts,
            "duplicates": duplicates,
        })

    def _preview_mdb_model(self):
        payload = self._read_json(max_bytes=1024 * 1024)
        model_path = str(payload.get("path", "")).strip()
        texture_roots = []
        root_path = str(payload.get("rootPath", "")).strip()
        if root_path:
            texture_roots.append(root_path)
        extra_texture_roots = payload.get("textureRoots", [])
        if isinstance(extra_texture_roots, list):
            for item in extra_texture_roots:
                value = str(item).strip()
                if value:
                    texture_roots.append(value)

        if not model_path:
            self._send_json({"error": "Choose a model to preview."}, status=400)
            return

        try:
            result = mdb_geometry_preview(model_path, texture_roots=texture_roots)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _delete_created_files(self):
        payload = self._read_json(max_bytes=5 * 1024 * 1024)
        paths = payload.get("paths", [])
        deleted = []
        errors = []
        allowed_suffixes = {".mdb", ".dds", ".tga", ".png", ".jpg", ".jpeg", ".webp"}

        for raw_path in paths:
            path = Path(str(raw_path)).expanduser().resolve()
            if not path.is_file() or path.suffix.lower() not in allowed_suffixes:
                continue
            try:
                path.unlink()
                deleted.append(str(path))
            except Exception as exc:
                errors.append({"path": str(path), "error": str(exc)})

        self._send_json({"deleted": deleted, "errors": errors})

    def _scan_uploaded_mdb_files(self):
        try:
            uploaded_files = self._read_multipart_files(max_bytes=250 * 1024 * 1024)
            result = scan_uploaded_mdb_files(uploaded_files, max_files=2000)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)
            return

        self._send_json(result)

    def _choose_folder(self):
        payload = self._read_json(max_bytes=1024 * 1024)
        initial_dir = str(payload.get("initialDir", "")).strip()
        try:
            folder = choose_folder_dialog(initial_dir)
        except Exception as exc:
            self._send_json({"error": f"Could not open folder chooser: {exc}"}, status=500)
            return

        self._send_json({"ok": bool(folder), "folder": folder})

    def _open_outputs_folder(self):
        initialize_app_storage()
        try:
            os.startfile(str(OUTPUTS))
        except Exception as exc:
            self._send_json({"error": f"Could not open outputs folder: {exc}", "outputDir": str(OUTPUTS)}, status=500)
            return
        self._send_json({"ok": True, "outputDir": str(OUTPUTS)})

    def _read_json(self, max_bytes=1024 * 1024):
        length = int(self.headers.get("Content-Length", "0"))
        if length > max_bytes:
            raise ValueError("Request body is too large")
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def _read_multipart_files(self, max_bytes=250 * 1024 * 1024):
        return self._read_multipart_form(max_bytes=max_bytes)["files"]

    def _read_multipart_form(self, max_bytes=250 * 1024 * 1024):
        length = int(self.headers.get("Content-Length", "0"))
        if length > max_bytes:
            raise ValueError("Import is too large. Try a smaller batch or use Choose Folder.")

        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            raise ValueError("Expected a file import.")

        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": content_type,
                "CONTENT_LENGTH": str(length),
            },
        )
        file_fields = form["files"] if "files" in form else []
        if not isinstance(file_fields, list):
            file_fields = [file_fields]

        uploaded_files = []
        for field in file_fields:
            if not getattr(field, "filename", ""):
                continue
            uploaded_files.append({
                "name": field.filename.replace("\\", "/"),
                "data": field.file.read(),
            })

        if not uploaded_files:
            raise ValueError("No MDB files were imported.")
        regular_fields = {}
        for key in form.keys():
            if key == "files":
                continue
            value = form[key]
            if isinstance(value, list):
                regular_fields[key] = value[0].value if value else ""
            else:
                regular_fields[key] = value.value
        return {"files": uploaded_files, "fields": regular_fields}

    def _send_file(self, path):
        mime_type, _ = mimetypes.guess_type(path)
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_preset_asset(self):
        query = parse_qs(urlparse(self.path).query)
        asset_name = query.get("path", [""])[0]
        asset_path = (PRESETS / asset_name).resolve()
        if (
            PRESETS.resolve() not in asset_path.parents
            or not asset_path.is_file()
            or asset_path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".txt"}
        ):
            self._send_json({"error": "Preset asset not found."}, status=404)
            return

        self._send_file(asset_path)

    def _send_json(self, payload, status=200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} - {fmt % args}")


def choose_folder_dialog(initial_dir=""):
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    kwargs = {"title": "Choose a NWN2 model folder"}
    if initial_dir and Path(initial_dir).exists():
        kwargs["initialdir"] = initial_dir
    try:
        folder = filedialog.askdirectory(**kwargs)
    finally:
        root.destroy()
    return folder or ""


def load_presets():
    if not PRESETS_MANIFEST.exists():
        return []

    manifest = json.loads(PRESETS_MANIFEST.read_text(encoding="utf-8"))
    presets = []
    for item in manifest.get("presets", []):
        prompt_path = PRESETS / item["prompt"]
        prompt = prompt_path.read_text(encoding="utf-8").strip() if prompt_path.exists() else ""
        presets.append({
            "id": item["id"],
            "name": item["name"],
            "description": item.get("description", ""),
            "prompt": prompt,
            "kind": item.get("kind", "main"),
            "provider": item.get("provider", ""),
            "recommendedModel": item.get("recommendedModel", ""),
            "referenceImages": item.get("referenceImages", []),
            "shapeReferenceImages": item.get("shapeReferenceImages", []),
            "exampleImages": item.get("exampleImages", []),
            "derivedViews": item.get("derivedViews", []),
            "group": item.get("group", ""),
            "profile": item.get("profile", "")
        })
    return presets


def get_preset(preset_id):
    for preset in load_presets():
        if preset["id"] == preset_id:
            return preset
    return None


def preset_reference_assets(preset):
    if not preset:
        return []

    preset_root = PRESETS.resolve()
    assets = []
    for reference_path in preset.get("referenceImages", []):
        asset_path = (PRESETS / reference_path).resolve()
        if preset_root in asset_path.parents and asset_path.is_file():
            ref_mime_type, _ = mimetypes.guess_type(asset_path)
            assets.append({
                "path": asset_path,
                "manifestPath": reference_path,
                "mimeType": ref_mime_type or "image/png"
            })
    return assets


def manifest_image_asset(preset, manifest_key, image_path):
    if not preset or not image_path:
        return None
    if image_path not in preset.get(manifest_key, []):
        return None

    preset_root = PRESETS.resolve()
    asset_path = (PRESETS / image_path).resolve()
    if preset_root not in asset_path.parents or not asset_path.is_file():
        return None

    ref_mime_type, _ = mimetypes.guess_type(asset_path)
    return {
        "path": asset_path,
        "manifestPath": image_path,
        "mimeType": ref_mime_type or "image/png"
    }


def selected_shield_shape_asset(preset, payload):
    if not preset or not is_shield_preset(preset.get("id", "")):
        return None

    shape_reference = payload.get("shieldShapeReference") or {}
    if not isinstance(shape_reference, dict):
        return None

    image_path = str(shape_reference.get("path", "")).strip()
    shape_preset = shield_shape_manifest_preset(preset)
    return manifest_image_asset(shape_preset, "shapeReferenceImages", image_path)


def shield_shape_manifest_preset(preset):
    if not preset or not is_shield_preset(preset.get("id", "")):
        return None
    if preset.get("shapeReferenceImages"):
        return preset
    if preset.get("id") == "shield-emblem-back":
        return get_preset("shield-emblem")
    return preset


def parse_pixel_size(value, default=(1024, 1024)):
    parts = str(value or "").lower().split("x")
    if len(parts) != 2:
        return default
    try:
        width = int(parts[0])
        height = int(parts[1])
    except ValueError:
        return default
    if width < 64 or height < 64:
        return default
    return width, height


def gemini_control_pixel_size(payload):
    long_side = {
        "1K": 1024,
        "2K": 1536,
        "4K": 2048,
    }.get(get_gemini_output_size(payload), 1536)
    aspect_ratio = get_bas_relief_aspect_ratio(payload)
    width_ratio, height_ratio = (int(part) for part in aspect_ratio.split(":"))
    if width_ratio >= height_ratio:
        return long_side, max(512, round(long_side * height_ratio / width_ratio))
    return max(512, round(long_side * width_ratio / height_ratio)), long_side


def cover_resize(image, target_size):
    target_width, target_height = target_size
    scale = max(target_width / image.width, target_height / image.height)
    next_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(next_size, Image.Resampling.LANCZOS)
    left = max(0, (resized.width - target_width) // 2)
    top = max(0, (resized.height - target_height) // 2)
    return resized.crop((left, top, left + target_width, top + target_height))


def contain_resize(image, max_size):
    max_width, max_height = max_size
    scale = min(max_width / image.width, max_height / image.height)
    next_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(next_size, Image.Resampling.LANCZOS)


def build_shield_layout_control_image(source_bytes, shield_shape_asset, output_size):
    source_image = Image.open(BytesIO(source_bytes)).convert("RGB")
    shape_image = Image.open(shield_shape_asset["path"]).convert("RGB")
    width, height = output_size

    shape_gray = ImageOps.grayscale(shape_image)
    raw_mask = shape_gray.point(lambda p: 255 if p < 128 else 0)
    bbox = raw_mask.getbbox()
    if not bbox:
        raise ValueError("Selected shield shape reference has no usable silhouette.")

    raw_mask = raw_mask.crop(bbox)
    max_shape_size = (round(width * 0.78), round(height * 0.86))
    mask = contain_resize(raw_mask, max_shape_size)
    mask = mask.filter(ImageFilter.GaussianBlur(0.6)).point(lambda p: 255 if p > 64 else 0)

    x = (width - mask.width) // 2
    y = (height - mask.height) // 2
    full_mask = Image.new("L", (width, height), 0)
    full_mask.paste(mask, (x, y))

    motif_fill = cover_resize(source_image, (mask.width, mask.height))
    motif_gray = ImageOps.grayscale(motif_fill).convert("RGB")
    neutral_plate = Image.new("RGB", (mask.width, mask.height), (218, 214, 204))
    relief_layout = Image.blend(neutral_plate, motif_gray, 0.28)
    clipped_motif = Image.new("RGB", (width, height), (238, 238, 238))
    clipped_motif.paste(neutral_plate, (x, y), mask)
    clipped_motif.paste(relief_layout, (x, y), mask)

    outer = full_mask.filter(ImageFilter.MaxFilter(17))
    inner = full_mask.filter(ImageFilter.MinFilter(11))
    outline = ImageChops.subtract(outer, inner)
    outline_layer = Image.new("RGB", (width, height), (0, 0, 0))
    clipped_motif.paste(outline_layer, (0, 0), outline)

    # A thin white inset keeps OpenAI from reading the black mask as final material.
    inset = ImageChops.subtract(full_mask.filter(ImageFilter.MaxFilter(3)), full_mask.filter(ImageFilter.MinFilter(3)))
    white_layer = Image.new("RGB", (width, height), (255, 255, 255))
    clipped_motif.paste(white_layer, (0, 0), inset)

    out = BytesIO()
    clipped_motif.save(out, format="PNG")
    return out.getvalue(), "image/png"


def read_extra_prompt():
    if EXTRA_PROMPT.exists():
        return EXTRA_PROMPT.read_text(encoding="utf-8").strip()
    return ""


def build_prompt(payload):
    preset_id = str(payload.get("presetId", "miniature"))
    prompt_mode = str(payload.get("promptMode", "preset-extra"))
    extra_prompt = str(payload.get("extraPrompt", read_extra_prompt())).strip()
    text_prompt = str(payload.get("textPrompt", "")).strip()
    preset_prompt = ""
    preset_kind = ""

    for preset in load_presets():
        if preset["id"] == preset_id:
            preset_prompt = preset["prompt"]
            preset_kind = preset.get("kind", "")
            break

    if preset_id == OPEN_PROMPT_PRESET:
        size_request = build_output_size_request(preset_id, payload)
        aspect_request = build_aspect_ratio_request(preset_id, payload)
        if prompt_mode == "extra-override":
            return "\n\n".join(part for part in [extra_prompt or text_prompt, size_request, aspect_request] if part)
        if prompt_mode == "preset-only":
            return "\n\n".join(part for part in [text_prompt, size_request, aspect_request] if part)
        return "\n\n".join(part for part in [text_prompt, extra_prompt, size_request, aspect_request] if part)

    image_prompt_preset = is_image_prompt_preset(preset_id)
    if preset_id == "bas-relief-emblem-concept":
        text_prompt_label = "Bas-relief subject to generate"
    elif preset_kind == IMAGE_PROMPT_KIND or image_prompt_preset:
        text_prompt_label = "Objects to extract and simplify"
    else:
        text_prompt_label = "Object to generate"
    object_request = f"{text_prompt_label}:\n{text_prompt}" if (preset_kind in {"text-to-image", IMAGE_PROMPT_KIND} or image_prompt_preset) and text_prompt else ""
    skin_surface_request = build_skin_surface_request(preset_id, payload)
    neck_connector_request = build_neck_connector_request(preset_id, payload)
    extreme_simplify_request = build_extreme_simplify_request(preset_id, payload)
    creature_tail_request = build_creature_tail_request(preset_id, payload)
    shield_shape_request = build_shield_shape_request(preset_id, payload)
    size_request = build_output_size_request(preset_id, payload)
    aspect_request = build_aspect_ratio_request(preset_id, payload)

    if preset_kind == IMAGE_PROMPT_KIND or image_prompt_preset:
        return "\n\n".join(part for part in [preset_prompt, object_request, extreme_simplify_request, size_request, aspect_request, extra_prompt] if part)

    if prompt_mode == "extra-override":
        return "\n\n".join(part for part in [extra_prompt, object_request, skin_surface_request, neck_connector_request, extreme_simplify_request, creature_tail_request, shield_shape_request, size_request, aspect_request] if part)
    if prompt_mode == "preset-only":
        return "\n\n".join(part for part in [preset_prompt, object_request, skin_surface_request, neck_connector_request, extreme_simplify_request, creature_tail_request, shield_shape_request, size_request, aspect_request] if part)
    return "\n\n".join(part for part in [preset_prompt, object_request, skin_surface_request, neck_connector_request, extreme_simplify_request, creature_tail_request, shield_shape_request, size_request, aspect_request, extra_prompt] if part)


def build_skin_surface_request(preset_id, payload):
    if not truthy(payload.get("preserveSkinSurface")):
        return ""
    if not uses_skin_surface_control(preset_id):
        return ""
    if str(preset_id).startswith("modular-robe-dress-"):
        return ROBE_DRESS_SKIN_SURFACE_PROMPT
    return SKIN_SURFACE_PROMPT


def build_neck_connector_request(preset_id, payload):
    if not truthy(payload.get("createNeckConnector")):
        return ""
    if not uses_neck_connector_control(preset_id):
        return ""
    style_prompt = NECK_CONNECTOR_STYLE_PROMPTS.get(get_neck_connector_style(payload), "")
    return "\n\n".join(part for part in [NECK_CONNECTOR_PROMPT, style_prompt] if part)


def build_extreme_simplify_request(preset_id, payload):
    if not truthy(payload.get("extremeSimplify")):
        return ""
    if not uses_outfit_option_controls(preset_id):
        return ""
    if is_image_prompt_preset(preset_id):
        return OBJECT_EXTREME_SIMPLIFY_PROMPT
    return EXTREME_SIMPLIFY_PROMPT


def build_creature_tail_request(preset_id, payload):
    if not is_creature_preset(preset_id):
        return ""
    return CREATURE_TAIL_ENABLED_PROMPT if truthy(payload.get("creatureHasTail")) else CREATURE_TAIL_DISABLED_PROMPT


def build_shield_shape_request(preset_id, payload):
    if not is_shield_preset(preset_id):
        return ""
    preset = get_preset(str(preset_id))
    asset = selected_shield_shape_asset(preset, payload)
    if not asset:
        return "No shield silhouette reference was selected. Choose a believable medieval or fantasy shield outline creatively."
    return (
        "Selected shield silhouette reference:\n"
        "For selected shield-shape generations, the uploaded image set is ordered deliberately when the provider supports multiple images: "
        "image 1 is a Forge-built shield layout control composite, image 2 is the original motif/source image, "
        "and image 3 is the clean selected shield silhouette mask. The layout control composite and mask control the final shield's "
        "outer outline. Image 2 controls the interior artwork, symbolic motif, and decorative subject matter.\n"
        "Use image 1 as the main structural guide. It is a muted grayscale layout-control composite only: it shows "
        "the chosen shield silhouette and approximate motif placement, not final color, not a decal, and not a pasted "
        "image to preserve. Redraw it into a polished 3D medieval fantasy shield, keep the same outer shield contour, "
        "and convert the interior motif into integrated shallow bas-relief with light brushed color or worn enamel on "
        "top of the sculpted forms. The selected shield silhouette is the mold: fit the artwork to that mold, never "
        "stretch, widen, round, sharpen, or otherwise alter the shield outline to fit the artwork.\n"
        "The selected shield-shape reference is a high-contrast black silhouette mask on white. "
        "Use this selected mask as a non-negotiable outer contour constraint for the finished shield. The final "
        "shield's outside edge must visibly match the selected silhouette's top edge, shoulder corners, side curves, "
        "waist insets or bulges, bottom point or rounded base, total width-to-height proportion, and overall profile. "
        "Do not add lobes, wings, points, flares, extra metalwork, cloth, glow, ornaments, or rim extensions outside "
        "that selected silhouette. Anything outside the silhouette must remain neutral background only. "
        "The selected silhouette overrides random shield-shape invention. Do not fall back to a generic heater shield "
        "unless the selected silhouette itself is a heater shield. Treat the black fill as a shape mask only; do not "
        "make the final shield flat black unless the motif or material design calls for it. Build a new rim, bevel, "
        "rivets, material construction, thickness, and inner shield art around this exact chosen outline. The inner "
        "art should be sculpted into the shield face as shallow-to-medium bas-relief rather than stamped as an image. "
        "Clip, crop, simplify, compress, mirror, rearrange, or redesign the motif and ornament as needed so every "
        "design element stays within the selected shield boundary. It is a hard failure if the output uses a different "
        "outer shield silhouette than the selected reference, or if the silhouette is distorted to fit the motif."
    )


def build_output_size_request(preset_id, payload):
    if not uses_gemini_canvas_controls(preset_id):
        return ""
    size = get_gemini_output_size(payload)
    if is_open_prompt_preset(preset_id):
        return f"Requested output size: {size}."
    if is_shield_preset(preset_id):
        return f"Requested output size: {size}. Keep the full medieval fantasy shield visible inside the frame with a clean margin."
    return f"Requested output size: {size}. Keep the full bas-relief plate visible within the frame."


def build_aspect_ratio_request(preset_id, payload):
    if not uses_gemini_canvas_controls(preset_id):
        return ""
    aspect_ratio = get_bas_relief_aspect_ratio(payload)
    if is_open_prompt_preset(preset_id):
        return (
            f"Requested aspect ratio: {aspect_ratio}. The output canvas must use {aspect_ratio}; "
            "do not preserve an input image aspect ratio if it differs."
        )
    if is_shield_preset(preset_id):
        return (
            f"Requested aspect ratio: {aspect_ratio}. The output canvas must use {aspect_ratio}; "
            "do not preserve the input image aspect ratio if it differs. Compose one complete "
            f"front-facing shield within the {aspect_ratio} canvas, with the motif filling the "
            "shield's inner face and the rim/bevel remaining separate."
        )
    return (
        f"Requested aspect ratio: {aspect_ratio}. The output canvas must use {aspect_ratio}; "
        "do not preserve the input image aspect ratio if it differs. Compose the bas-relief "
        f"as one complete {BAS_RELIEF_ASPECT_LABELS[aspect_ratio]} plate with the full border visible."
    )


def is_bas_relief_preset(preset_id):
    return str(preset_id) in BAS_RELIEF_PRESETS


def is_shield_preset(preset_id):
    return str(preset_id) in SHIELD_PRESETS


def is_open_prompt_preset(preset_id):
    return str(preset_id) == OPEN_PROMPT_PRESET


def is_image_prompt_preset(preset_id):
    if str(preset_id) in SIMPLIFY_OBJECTS_PRESETS:
        return True
    preset = get_preset(str(preset_id))
    return bool(preset and preset.get("kind") == IMAGE_PROMPT_KIND)


def is_creature_preset(preset_id):
    return str(preset_id).startswith(CREATURE_PRESET_PREFIX)


def uses_gemini_canvas_controls(preset_id):
    return str(preset_id) in BAS_RELIEF_AND_OPEN_PROMPT_PRESETS


def uses_skin_surface_control(preset_id):
    preset_id = str(preset_id)
    return (
        preset_id.startswith("modular-outfit-")
        or preset_id.startswith("modular-armored-outfit-")
        or preset_id.startswith("modular-robe-dress-")
    )


def uses_neck_connector_control(preset_id):
    return uses_skin_surface_control(preset_id)


def get_neck_connector_style(payload):
    style = str(payload.get("neckConnectorStyle", "auto")).strip()
    if style not in NECK_CONNECTOR_STYLE_PROMPTS:
        return "auto"
    return style


def uses_outfit_option_controls(preset_id):
    preset_id = str(preset_id)
    return (
        preset_id.startswith("modular-outfit-")
        or preset_id.startswith("modular-armored-outfit-")
        or preset_id.startswith("modular-robe-dress-")
        or is_creature_preset(preset_id)
        or is_image_prompt_preset(preset_id)
    )


def truthy(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def get_bas_relief_aspect_ratio(payload):
    aspect_ratio = str(payload.get("basReliefAspectRatio", "2:3")).strip()
    if aspect_ratio not in BAS_RELIEF_ASPECT_LABELS:
        return "2:3"
    return aspect_ratio


def get_gemini_output_size(payload):
    size = str(payload.get("geminiOutputSize", "2K")).upper()
    if size not in GEMINI_IMAGE_SIZES:
        return "2K"
    return size


def save_generation_output(image_data, mime_type, prompt, payload, mode):
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    now = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    view_id = safe_slug(str(payload.get("viewId", "output")))
    model_value = payload.get("openaiModel") if mode == "openai" else payload.get("model", "local")
    model = safe_slug(str(model_value))
    ext = extension_for_mime(mime_type)
    stem = f"{now}-{view_id}-{model}"
    image_path = OUTPUTS / f"{stem}.{ext}"
    metadata_path = OUTPUTS / f"{stem}.json"

    image_path.write_bytes(base64.b64decode(image_data))
    preset_id = str(payload.get("presetId", ""))
    preset = get_preset(preset_id)
    shield_shape_asset = selected_shield_shape_asset(preset, payload)
    extra_source_images = additional_source_images(payload)
    preserve_skin_surface = uses_skin_surface_control(preset_id) and truthy(payload.get("preserveSkinSurface"))
    create_neck_connector = uses_neck_connector_control(preset_id) and truthy(payload.get("createNeckConnector"))
    neck_connector_style = get_neck_connector_style(payload) if create_neck_connector else ""
    extreme_simplify = uses_outfit_option_controls(preset_id) and truthy(payload.get("extremeSimplify"))
    creature_has_tail = is_creature_preset(preset_id) and truthy(payload.get("creatureHasTail"))
    metadata = {
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "mode": mode,
        "viewId": payload.get("viewId"),
        "sourceName": payload.get("sourceName"),
        "model": payload.get("openaiModel") if mode == "openai" else payload.get("model"),
        "openaiSize": payload.get("openaiSize"),
        "openaiQuality": payload.get("openaiQuality"),
        "geminiOutputSize": payload.get("geminiOutputSize"),
        "basReliefAspectRatio": payload.get("basReliefAspectRatio"),
        "preserveSkinSurface": preserve_skin_surface,
        "createNeckConnector": create_neck_connector,
        "neckConnectorStyle": neck_connector_style,
        "extremeSimplify": extreme_simplify,
        "creatureHasTail": creature_has_tail,
        "referenceImages": [asset["manifestPath"] for asset in preset_reference_assets(preset)],
        "shieldShapeReference": shield_shape_asset["manifestPath"] if shield_shape_asset else "",
        "shieldShapeControlComposite": mode in {"openai", "gemini"} and bool(shield_shape_asset),
        "estimatedCostUsd": estimate_generation_cost(mode, str(payload.get("openaiModel") if mode == "openai" else payload.get("model", "")), payload),
        "mimeType": mime_type,
        "promptLength": len(prompt),
        "prompt": prompt,
        "imageFile": image_path.name,
        "additionalSourceImages": [image["name"] for image in extra_source_images]
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {
        "imagePath": str(image_path),
        "metadataPath": str(metadata_path)
    }


def extension_for_mime(mime_type):
    if mime_type == "image/jpeg":
        return "jpg"
    if mime_type == "image/webp":
        return "webp"
    if mime_type == "image/svg+xml":
        return "svg"
    return "png"


def additional_source_images(payload):
    images = payload.get("additionalImages", [])
    if not isinstance(images, list):
        return []

    normalized = []
    for index, item in enumerate(images[:3], start=2):
        if not isinstance(item, dict):
            continue
        image_data = str(item.get("base64") or item.get("imageData") or "").strip()
        mime_type = str(item.get("mimeType", "image/png")).strip() or "image/png"
        if not image_data or not mime_type.startswith("image/"):
            continue
        normalized.append({
            "data": image_data,
            "mimeType": mime_type,
            "name": str(item.get("name") or f"source-view-{index}")
        })
    return normalized


def safe_slug(value):
    cleaned = "".join(char.lower() if char.isalnum() else "-" for char in value)
    cleaned = "-".join(part for part in cleaned.split("-") if part)
    return cleaned[:80] or "output"


def estimate_generation_cost(mode, model, payload):
    if mode == "openai":
        model_price = OPENAI_MODEL_PRICING.get(model, {})
        size = str(payload.get("openaiSize", "1024x1024"))
        quality = str(payload.get("openaiQuality", "medium"))
        return model_price.get("estimates", {}).get(size, {}).get(quality, 0)

    price = GEMINI_MODEL_PRICING.get(model, {})
    size = str(payload.get("geminiOutputSize", "")).upper()
    if size and price.get("estimatesBySize", {}).get(size) is not None:
        return price["estimatesBySize"][size]
    return price.get("estimateUsd", 0)


def call_openai_image_edit(api_key, model, prompt, image_data, mime_type, payload):
    image_bytes = base64.b64decode(image_data)
    output_format = str(payload.get("openaiOutputFormat", "png"))
    size = str(payload.get("openaiSize", "1024x1024"))
    quality = str(payload.get("openaiQuality", "medium"))
    fields = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "output_format": output_format
    }
    preset_id = str(payload.get("presetId", ""))
    preset = get_preset(preset_id)
    shield_shape_asset = selected_shield_shape_asset(preset, payload)
    reference_assets = preset_reference_assets(preset)
    extra_source_images = additional_source_images(payload)
    files = []
    if shield_shape_asset:
        control_bytes, control_mime_type = build_shield_layout_control_image(
            image_bytes,
            shield_shape_asset,
            parse_pixel_size(size)
        )
        files.append((
            "image[]",
            "image-1-shield-layout-control.png",
            control_mime_type,
            control_bytes
        ))
        files.append(("image[]", "image-2-source-motif" + extension_for_upload(mime_type), mime_type, image_bytes))
        asset_path = shield_shape_asset["path"]
        files.append((
            "image[]",
            f"image-3-selected-shield-mask{asset_path.suffix}",
            shield_shape_asset["mimeType"],
            asset_path.read_bytes()
        ))
    else:
        files.append(("image[]", "source-image" + extension_for_upload(mime_type), mime_type, image_bytes))
        for index, source_image in enumerate(extra_source_images, start=2):
            files.append((
                "image[]",
                f"source-view-{index}" + extension_for_upload(source_image["mimeType"]),
                source_image["mimeType"],
                base64.b64decode(source_image["data"])
            ))
        for index, asset in enumerate(reference_assets, start=1):
            asset_path = asset["path"]
            files.append((
                "image[]",
                f"preset-reference-{index}{asset_path.suffix}",
                asset["mimeType"],
                asset_path.read_bytes()
            ))

    body, content_type = build_multipart_body(fields, files)
    req = request.Request(
        "https://api.openai.com/v1/images/edits",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": content_type
        }
    )

    try:
        with request.urlopen(req, timeout=240) as response:
            response_body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc

    image_result = response_body.get("data", [{}])[0]
    image_b64 = image_result.get("b64_json")
    if not image_b64:
        raise RuntimeError(f"OpenAI did not return an image. Response: {json.dumps(response_body)[:1200]}")

    return {
        "mode": "openai",
        "imageData": image_b64,
        "mimeType": "image/" + output_format,
        "rawText": ""
    }


def call_openai_image_generation(api_key, model, prompt, payload):
    output_format = str(payload.get("openaiOutputFormat", "png"))
    body = {
        "model": model,
        "prompt": prompt,
        "size": str(payload.get("openaiSize", "1024x1024")),
        "quality": str(payload.get("openaiQuality", "medium")),
        "output_format": output_format
    }
    encoded = json.dumps(body).encode("utf-8")
    req = request.Request(
        "https://api.openai.com/v1/images/generations",
        data=encoded,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    try:
        with request.urlopen(req, timeout=240) as response:
            response_body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc

    image_result = response_body.get("data", [{}])[0]
    image_b64 = image_result.get("b64_json")
    if not image_b64:
        raise RuntimeError(f"OpenAI did not return an image. Response: {json.dumps(response_body)[:1200]}")

    return {
        "mode": "openai",
        "imageData": image_b64,
        "mimeType": "image/" + output_format,
        "rawText": ""
    }


def safe_slug(value):
    cleaned = []
    for char in str(value or ""):
        if char.isalnum() or char in {"-", "_"}:
            cleaned.append(char)
        elif char in {" ", ".", "/"}:
            cleaned.append("-")
    slug = "".join(cleaned).strip("-_")
    return slug[:120]


def build_multipart_body(fields, files):
    boundary = "----NeverwinterForge" + uuid.uuid4().hex
    chunks = []

    for name, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode("utf-8"),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
            str(value).encode("utf-8"),
            b"\r\n"
        ])

    for name, filename, mime_type, content in files:
        chunks.extend([
            f"--{boundary}\r\n".encode("utf-8"),
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8"),
            f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"),
            content,
            b"\r\n"
        ])

    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def extension_for_upload(mime_type):
    if mime_type == "image/jpeg":
        return ".jpg"
    if mime_type == "image/webp":
        return ".webp"
    return ".png"


def call_gemini(api_key, model, prompt, image_data, mime_type, payload):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    parts = [{"text": prompt}]
    preset = get_preset(str(payload.get("presetId", "")))
    preset_id = str(payload.get("presetId", ""))
    extra_source_images = additional_source_images(payload)
    shield_shape_asset = selected_shield_shape_asset(preset, payload)

    if image_data and shield_shape_asset:
        image_bytes = base64.b64decode(image_data)
        control_bytes, control_mime_type = build_shield_layout_control_image(
            image_bytes,
            shield_shape_asset,
            gemini_control_pixel_size(payload)
        )
        parts.append({"text": "Image 1: Forge-built shield layout control composite. This is the strongest shape-control image. Use its outer silhouette, centered scale, margin, and broad motif placement as the structural guide. Redraw it into a finished shield; do not copy it as a flat pasted image. Fit the motif and ornament inside this silhouette; do not stretch or alter the silhouette to fit the motif."})
        parts.append({"inline_data": {
            "mime_type": control_mime_type,
            "data": base64.b64encode(control_bytes).decode("utf-8")
        }})
        parts.append({"text": "Image 2: original source motif or approved front shield. Use this for the subject, material identity, color language, and visual style. Do not let it override Image 1's selected shield outline."})
        parts.append({"inline_data": {"mime_type": mime_type, "data": image_data}})
        parts.append({"text": "Image 3: clean selected shield silhouette mask. This high-contrast mask is mandatory for the finished shield's outer contour. Match its top edge, shoulder corners, side curves, waist, bottom point or rounding, width-to-height proportion, and overall profile. Anything outside this mask must remain background only; keep rim, bevel, relief, ornament, and material construction inside or exactly on the mask edge."})
        parts.append({"inline_data": {
            "mime_type": shield_shape_asset["mimeType"],
            "data": base64.b64encode(shield_shape_asset["path"].read_bytes()).decode("utf-8")
        }})
    else:
        if image_data:
            parts.append({"text": "Primary source image. Follow this for the subject, motif, silhouette, and visual identity unless the preset prompt says otherwise."})
            parts.append({"inline_data": {"mime_type": mime_type, "data": image_data}})
        for index, source_image in enumerate(extra_source_images, start=2):
            parts.append({"text": f"Additional source image {index}. Treat this as another view of the same subject only when the preset prompt assigns that role. Use it to keep object labels, colors, and material regions consistent; do not replace the primary source image."})
            parts.append({"inline_data": {
                "mime_type": source_image["mimeType"],
                "data": source_image["data"]
            }})
    for index, asset in enumerate(preset_reference_assets(preset), start=1):
        parts.append({"text": f"Preset reference image {index}. Use only for the role described in the preset prompt; do not replace the primary source image or written concept with this reference."})
        parts.append({"inline_data": {
            "mime_type": asset["mimeType"],
            "data": base64.b64encode(asset["path"].read_bytes()).decode("utf-8")
        }})
    body = {
        "contents": [{
            "parts": parts
        }],
        "generationConfig": build_gemini_generation_config(model, payload)
    }
    encoded = json.dumps(body).encode("utf-8")
    req = request.Request(
        url,
        data=encoded,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
    )

    try:
        with request.urlopen(req, timeout=180) as response:
            response_body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API error {exc.code}: {detail}") from exc

    parts = response_body.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            return {
                "mode": "gemini",
                "imageData": inline["data"],
                "mimeType": inline.get("mimeType") or inline.get("mime_type") or "image/png",
                "rawText": collect_text(parts),
                "generationConfig": body["generationConfig"]
            }

    raise RuntimeError(f"Gemini did not return an image. Response: {json.dumps(response_body)[:1200]}")


def build_gemini_generation_config(model, payload):
    config = {
        "responseModalities": ["IMAGE"]
    }
    if uses_gemini_canvas_controls(payload.get("presetId", "")):
        aspect_ratio = get_bas_relief_aspect_ratio(payload)
        image_size = get_gemini_output_size(payload)
        config["imageConfig"] = {
            "aspectRatio": aspect_ratio,
            "imageSize": image_size,
        }
        config["responseFormat"] = {
            "image": {
                "aspectRatio": GEMINI_RESPONSE_ASPECT_ENUMS[aspect_ratio],
                "imageSize": GEMINI_RESPONSE_SIZE_ENUMS[image_size],
            }
        }
    return config


def collect_text(parts):
    return "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()


def mock_text_image(prompt, text_prompt):
    title = escape_svg_text(text_prompt.strip()[:80] or "Object Concept")
    detail = escape_svg_text(f"Mock text-to-image output. Prompt: {len(prompt)} characters.")
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#17191b"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect x="232" y="214" width="560" height="596" rx="42" fill="#252a2f" stroke="#d5a84c" stroke-width="6"/>
  <path d="M512 284 L642 360 L642 512 L512 588 L382 512 L382 360 Z" fill="#8f9499" stroke="#f0c96b" stroke-width="8"/>
  <path d="M512 284 L512 588 M382 360 L512 436 L642 360 M382 512 L512 436 L642 512" fill="none" stroke="#343b43" stroke-width="6"/>
  <text x="512" y="694" text-anchor="middle" fill="#f3f0e8" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">{title}</text>
  <text x="512" y="746" text-anchor="middle" fill="#a9b0b6" font-family="Segoe UI, Arial, sans-serif" font-size="24">{detail}</text>
</svg>"""
    return base64.b64encode(svg.encode("utf-8")).decode("utf-8")


def escape_svg_text(value):
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def upscaler_status():
    exe = find_upscaler_exe()
    installed = exe is not None
    with UPSCALER_LOCK:
        state = dict(UPSCALER_DOWNLOAD_STATE)
    state.update({
        "installed": installed,
        "runtime": "Real-ESRGAN NCNN Vulkan",
        "packageUrl": UPSCALER_PACKAGE_URL,
        "packageName": UPSCALER_PACKAGE_NAME,
        "sizeMb": UPSCALER_PACKAGE_SIZE_MB,
        "exePath": str(exe) if exe else ""
    })
    if installed and not state["active"]:
        state["status"] = "ready"
        state["message"] = "Upscaler runtime is installed."
        state["percent"] = 100
    return state


def find_upscaler_exe():
    if not UPSCALER_RUNTIME.exists():
        return None
    matches = list(UPSCALER_RUNTIME.rglob("realesrgan-ncnn-vulkan.exe"))
    return matches[0] if matches else None


def set_upscaler_state(**updates):
    with UPSCALER_LOCK:
        UPSCALER_DOWNLOAD_STATE.update(updates)


def download_upscaler_runtime():
    try:
        UPSCALER_DOWNLOADS.mkdir(parents=True, exist_ok=True)
        UPSCALER_RUNTIME.mkdir(parents=True, exist_ok=True)
        package_path = UPSCALER_DOWNLOADS / UPSCALER_PACKAGE_NAME
        set_upscaler_state(status="downloading", message="Downloading Real-ESRGAN runtime...")

        req = request.Request(UPSCALER_PACKAGE_URL, headers={"User-Agent": "NeverwinterForge/0.1"})
        with request.urlopen(req, timeout=60) as response:
            total = int(response.headers.get("Content-Length", "0"))
            downloaded = 0
            with package_path.open("wb") as file:
                while True:
                    chunk = response.read(1024 * 256)
                    if not chunk:
                        break
                    file.write(chunk)
                    downloaded += len(chunk)
                    percent = int((downloaded / total) * 100) if total else 0
                    set_upscaler_state(
                        downloadedBytes=downloaded,
                        totalBytes=total,
                        percent=percent,
                        message=f"Downloading Real-ESRGAN runtime: {percent}%"
                    )

        set_upscaler_state(status="extracting", percent=100, message="Extracting upscaler runtime...")
        with zipfile.ZipFile(package_path, "r") as archive:
            archive.extractall(UPSCALER_RUNTIME)

        if not find_upscaler_exe():
            raise RuntimeError("Downloaded package did not contain realesrgan-ncnn-vulkan.exe")

        set_upscaler_state(
            active=False,
            installed=True,
            status="ready",
            message="Upscaler runtime is installed.",
            percent=100
        )
    except Exception as exc:
        set_upscaler_state(
            active=False,
            status="error",
            error=str(exc),
            message="Upscaler download failed."
        )


def upscale_image(image_data, mime_type, scale, source_name):
    exe = find_upscaler_exe()
    if not exe:
        raise RuntimeError("Upscaler executable was not found")

    OUTPUTS.mkdir(parents=True, exist_ok=True)
    now = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    input_ext = extension_for_mime(mime_type)
    source_slug = safe_slug(source_name.rsplit(".", 1)[0])
    input_path = OUTPUTS / f"{now}-{source_slug}-upscale-source.{input_ext}"
    output_path = OUTPUTS / f"{now}-{source_slug}-upscaled-{scale}x.png"
    metadata_path = OUTPUTS / f"{now}-{source_slug}-upscaled-{scale}x.json"

    input_path.write_bytes(base64.b64decode(image_data))
    command = [
        str(exe),
        "-i", str(input_path),
        "-o", str(output_path),
        "-n", "realesr-animevideov3",
        "-s", str(scale),
        "-g", "0",
        "-f", "png"
    ]
    completed = subprocess.run(
        command,
        cwd=str(exe.parent),
        capture_output=True,
        text=True,
        timeout=300
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "Upscaler failed").strip())
    if not output_path.exists():
        raise RuntimeError("Upscaler did not produce an output image")

    output_b64 = base64.b64encode(output_path.read_bytes()).decode("utf-8")
    metadata = {
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "mode": "upscale",
        "upscaler": "realesrgan-ncnn-vulkan",
        "model": "realesr-animevideov3",
        "scale": scale,
        "gpuId": 0,
        "sourceName": source_name,
        "sourceFile": input_path.name,
        "imageFile": output_path.name,
        "mimeType": "image/png",
        "estimatedCostUsd": 0
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {
        "mode": "upscale",
        "imageData": output_b64,
        "mimeType": "image/png",
        "savedPath": str(output_path),
        "metadataPath": str(metadata_path),
        "estimatedCostUsd": 0,
        "note": f"Upscaled {scale}x locally."
    }


def depth_workflow_status():
    comfy_root, models_root, comfy_candidates, models_candidates = resolve_depth_paths()
    comfy_url_candidates_list = comfyui_url_candidates()
    comfy_url = resolve_comfyui_url(comfy_url_candidates_list)
    custom_nodes_root = (
        depth_config_path("customNodesRoot")
        or first_env_path("NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT", "COMFYUI_CUSTOM_NODES_ROOT")
        or comfy_root / "custom_nodes"
    )
    missing_nodes = []
    for folder, purpose in DEPTH_REQUIRED_CUSTOM_NODES.items():
        path = custom_nodes_root / folder
        if not path.exists():
            missing_nodes.append({"folder": folder, "purpose": purpose, "path": str(path)})

    models = []
    total_size_gb = 0
    missing_models = []
    for item in DEPTH_REQUIRED_MODELS:
        expected_root = models_root / item["folder"]
        matches = list(expected_root.rglob(item["name"])) if expected_root.exists() else []
        found_path = matches[0] if matches else None
        total_size_gb += item["sizeGb"]
        model_info = {
            "folder": item["folder"],
            "name": item["name"],
            "sizeGb": item["sizeGb"],
            "installed": found_path is not None,
            "path": str(found_path) if found_path else str(expected_root / item["name"])
        }
        models.append(model_info)
        if not found_path:
            missing_models.append(model_info)

    server_reachable = is_comfyui_server_reachable(comfy_url)
    app_local_models_root = ROOT / "models" / "comfyui"
    installed = (
        comfy_root.exists()
        and DEPTH_WORKFLOW.exists()
        and not missing_nodes
        and not missing_models
    )

    if not comfy_root.exists():
        message = "ComfyUI folder was not found."
    elif not DEPTH_WORKFLOW.exists():
        message = "Depth workflow file is missing."
    elif missing_nodes:
        message = f"{len(missing_nodes)} required custom node pack(s) are missing."
    elif missing_models:
        message = f"{len(missing_models)} required model file(s) are missing."
    elif not server_reachable:
        message = "Dependencies found. Start ComfyUI Desktop or classic ComfyUI to run depth maps."
    else:
        message = "Depth workflow is ready."

    return {
        "installed": installed,
        "serverReachable": server_reachable,
        "ready": installed and server_reachable,
        "message": message,
        "comfyUrl": comfy_url,
        "comfyUrlCandidates": comfy_url_candidates_list,
        "comfyRoot": str(comfy_root),
        "modelsRoot": str(models_root),
        "customNodesRoot": str(custom_nodes_root),
        "workflowPath": str(DEPTH_WORKFLOW),
        "inputNode": DEPTH_INPUT_NODE,
        "depthPreviewNode": DEPTH_PREVIEW_NODE,
        "normalPreviewNode": NORMAL_PREVIEW_NODE,
        "totalSizeGb": round(total_size_gb, 2),
        "missingNodes": missing_nodes,
        "missingModels": missing_models,
        "models": models,
        "usingAppLocalModels": models_root == app_local_models_root,
        "comfyCandidates": [str(path) for path in comfy_candidates],
        "modelsCandidates": [str(path) for path in models_candidates],
        "pathHelp": "Copy depth_paths.example.json to depth_paths.json and edit it, or set NEVERWINTER_COMFYUI_ROOT, NEVERWINTER_COMFYUI_MODELS_ROOT, and NEVERWINTER_COMFYUI_CUSTOM_NODES_ROOT to override auto-detection."
    }


def is_comfyui_server_reachable(comfy_url, timeout=0.6):
    try:
        with request.urlopen(f"{comfy_url}/system_stats", timeout=timeout):
            return True
    except Exception:
        return False


def process_depth_maps(image_data, mime_type, source_name):
    comfy_url = resolve_comfyui_url()
    image_bytes = base64.b64decode(image_data)
    source_slug = safe_slug(source_name.rsplit(".", 1)[0])
    upload_filename = f"neverwinter-forge-{uuid.uuid4().hex}-{source_slug}.{extension_for_mime(mime_type)}"
    uploaded = upload_comfy_image(comfy_url, upload_filename, image_bytes, mime_type)
    prompt = build_depth_prompt(uploaded)
    prompt_id = queue_comfy_prompt(comfy_url, prompt)
    history = wait_for_comfy_history(comfy_url, prompt_id)

    depth_image = fetch_comfy_output_image(comfy_url, history, DEPTH_PREVIEW_NODE, "depth")
    normal_image = fetch_comfy_output_image(comfy_url, history, NORMAL_PREVIEW_NODE, "normal")
    saved = save_depth_outputs(comfy_url, depth_image, normal_image, source_name, prompt_id)
    return {
        "mode": "depth-normal",
        "promptId": prompt_id,
        "depthImageData": depth_image["imageData"],
        "depthMimeType": depth_image["mimeType"],
        "normalImageData": normal_image["imageData"],
        "normalMimeType": normal_image["mimeType"],
        "depthSavedPath": saved["depthPath"],
        "normalSavedPath": saved["normalPath"],
        "metadataPath": saved["metadataPath"],
        "estimatedCostUsd": 0,
        "note": "Depth and normal maps generated locally through ComfyUI."
    }


def read_http_error_detail(exc):
    try:
        detail = exc.read().decode("utf-8", errors="replace")
    except Exception:
        detail = ""
    return detail.strip()


def upload_comfy_image(comfy_url, filename, image_bytes, mime_type):
    fields = {"type": "input", "overwrite": "true"}
    files = [("image", filename, mime_type, image_bytes)]
    body, content_type = build_multipart_body(fields, files)
    req = request.Request(
        f"{comfy_url}/upload/image",
        data=body,
        method="POST",
        headers={"Content-Type": content_type}
    )
    try:
        with request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = read_http_error_detail(exc)
        raise RuntimeError(f"ComfyUI upload failed ({exc.code}): {detail or exc.reason}") from exc
    return {
        "filename": result.get("name") or result.get("filename") or filename,
        "subfolder": result.get("subfolder", ""),
        "type": result.get("type", "input")
    }


def build_depth_prompt(uploaded):
    workflow = json.loads(DEPTH_WORKFLOW.read_text(encoding="utf-8"))
    if DEPTH_INPUT_NODE not in workflow:
        raise RuntimeError(f"Workflow does not contain input node {DEPTH_INPUT_NODE}")

    filename = uploaded["filename"]
    if uploaded.get("subfolder"):
        filename = f"{uploaded['subfolder']}/{filename}"
    workflow[DEPTH_INPUT_NODE]["inputs"]["image"] = filename
    return workflow


def queue_comfy_prompt(comfy_url, prompt):
    body = json.dumps({
        "client_id": "neverwinter-forge-" + uuid.uuid4().hex,
        "prompt": prompt
    }).encode("utf-8")
    req = request.Request(
        f"{comfy_url}/prompt",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"}
    )
    try:
        with request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = read_http_error_detail(exc)
        raise RuntimeError(f"ComfyUI prompt rejected ({exc.code}): {detail or exc.reason}") from exc
    prompt_id = result.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI did not return a prompt id. Response: {json.dumps(result)[:1200]}")
    return prompt_id


def wait_for_comfy_history(comfy_url, prompt_id, timeout_seconds=900):
    deadline = time.time() + timeout_seconds
    last_error = None
    while time.time() < deadline:
        try:
            encoded_id = quote(prompt_id, safe="")
            with request.urlopen(f"{comfy_url}/history/{encoded_id}", timeout=10) as response:
                history = json.loads(response.read().decode("utf-8"))
            if prompt_id in history:
                item = history[prompt_id]
                status = item.get("status", {})
                if status.get("status_str") == "error":
                    messages = status.get("messages", [])
                    raise RuntimeError(f"ComfyUI workflow failed: {json.dumps(messages)[:1200]}")
                outputs = item.get("outputs", {})
                if DEPTH_PREVIEW_NODE in outputs and NORMAL_PREVIEW_NODE in outputs:
                    return item
        except RuntimeError:
            raise
        except Exception as exc:
            last_error = exc
        time.sleep(1)

    if last_error:
        raise RuntimeError(f"Timed out waiting for ComfyUI output. Last error: {last_error}") from last_error
    raise RuntimeError("Timed out waiting for ComfyUI output")


def fetch_comfy_output_image(comfy_url, history_item, node_id, label):
    outputs = history_item.get("outputs", {})
    node_output = outputs.get(node_id, {})
    images = node_output.get("images", [])
    if not images:
        raise RuntimeError(f"ComfyUI did not return a {label} image for node {node_id}")

    image = images[0]
    query = urlencode({
        "filename": image["filename"],
        "subfolder": image.get("subfolder", ""),
        "type": image.get("type", "temp")
    })
    with request.urlopen(f"{comfy_url}/view?{query}", timeout=120) as response:
        data = response.read()
        mime_type = response.headers.get("Content-Type", "image/png").split(";")[0]
    return {
        "imageData": base64.b64encode(data).decode("utf-8"),
        "mimeType": mime_type or "image/png",
        "filename": image["filename"],
        "subfolder": image.get("subfolder", ""),
        "type": image.get("type", "temp")
    }


def save_depth_outputs(comfy_url, depth_image, normal_image, source_name, prompt_id):
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    now = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    source_slug = safe_slug(source_name.rsplit(".", 1)[0])
    depth_path = OUTPUTS / f"{now}-{source_slug}-depth-map.{extension_for_mime(depth_image['mimeType'])}"
    normal_path = OUTPUTS / f"{now}-{source_slug}-normal-map.{extension_for_mime(normal_image['mimeType'])}"
    metadata_path = OUTPUTS / f"{now}-{source_slug}-depth-normal.json"

    depth_path.write_bytes(base64.b64decode(depth_image["imageData"]))
    normal_path.write_bytes(base64.b64decode(normal_image["imageData"]))
    metadata = {
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "mode": "depth-normal",
        "engine": "ComfyUI",
        "comfyUrl": comfy_url,
        "workflow": str(DEPTH_WORKFLOW),
        "promptId": prompt_id,
        "sourceName": source_name,
        "depthNode": DEPTH_PREVIEW_NODE,
        "normalNode": NORMAL_PREVIEW_NODE,
        "depthFile": depth_path.name,
        "normalFile": normal_path.name,
        "estimatedCostUsd": 0
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {
        "depthPath": str(depth_path),
        "normalPath": str(normal_path),
        "metadataPath": str(metadata_path)
    }


def initialize_app_storage():
    PRESETS.mkdir(parents=True, exist_ok=True)
    OUTPUTS.mkdir(parents=True, exist_ok=True)
    RUNTIMES.mkdir(parents=True, exist_ok=True)
    UPDATES.mkdir(parents=True, exist_ok=True)
    UPDATE_DOWNLOADS.mkdir(parents=True, exist_ok=True)
    readme_path = OUTPUTS / "README.txt"
    if not readme_path.exists():
        readme_path.write_text(OUTPUTS_README, encoding="utf-8")
    if not EXTRA_PROMPT.exists():
        EXTRA_PROMPT.parent.mkdir(parents=True, exist_ok=True)
        EXTRA_PROMPT.write_text("", encoding="utf-8")


def main():
    initialize_app_storage()

    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Neverwinter Forge running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
