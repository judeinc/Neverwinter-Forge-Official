const imageInput = document.querySelector("#imageInput");
const inputPreview = document.querySelector("#inputPreview");
const inputTitle = document.querySelector("#inputTitle");
const textInputPanel = document.querySelector("#textInputPanel");
const objectPromptField = document.querySelector("#objectPrompt");
const objectPromptLabel = document.querySelector("#objectPromptLabel");
const colorGuidePairPanel = document.querySelector("#colorGuidePairPanel");
const colorGuideBackDropzone = document.querySelector("#colorGuideBackDropzone");
const colorGuideBackInput = document.querySelector("#colorGuideBackInput");
const colorGuideBackPreview = document.querySelector("#colorGuideBackPreview");
const clearColorGuideBackButton = document.querySelector("#clearColorGuideBack");
const outputPreview = document.querySelector("#outputPreview");
const outputEmpty = document.querySelector("#outputEmpty");
const downloadLink = document.querySelector("#downloadLink");
const autosavePanel = document.querySelector("#autosavePanel");
const autosaveFile = document.querySelector("#autosaveFile");
const openOutputsFolderButton = document.querySelector("#openOutputsFolder");
const outputShell = document.querySelector(".output-shell");
const viewActions = document.querySelector(".view-actions");
const generateBackViewButton = document.querySelector("#generateBackView");
const generateThreeQuarterViewButton = document.querySelector("#generateThreeQuarterView");
const downloadUpscalerButton = document.querySelector("#downloadUpscaler");
const upscalerStatusEl = document.querySelector("#upscalerStatus");
const upscalerProgress = document.querySelector("#upscalerProgress");
const upscalerProgressFill = document.querySelector("#upscalerProgressFill");
const upscalerProgressText = document.querySelector("#upscalerProgressText");
const upscale2xButton = document.querySelector("#upscale2x");
const upscale4xButton = document.querySelector("#upscale4x");
const upscaleDropzone = document.querySelector("#upscaleDropzone");
const upscaleImageInput = document.querySelector("#upscaleImageInput");
const upscaleInputPreview = document.querySelector("#upscaleInputPreview");
const useCurrentOutputButton = document.querySelector("#useCurrentOutput");
const clearUpscalerButton = document.querySelector("#clearUpscaler");
const comparePanel = document.querySelector("#comparePanel");
const compareOriginal = document.querySelector("#compareOriginal");
const compareUpscaled = document.querySelector("#compareUpscaled");
const saveUpscaledLink = document.querySelector("#saveUpscaledLink");
const depthStatusEl = document.querySelector("#depthStatus");
const refreshDepthStatusButton = document.querySelector("#refreshDepthStatus");
const depthDropzone = document.querySelector("#depthDropzone");
const depthImageInput = document.querySelector("#depthImageInput");
const depthInputPreview = document.querySelector("#depthInputPreview");
const useCurrentForDepthButton = document.querySelector("#useCurrentForDepth");
const depthModelList = document.querySelector("#depthModelList");
const depthDependencySummary = document.querySelector("#depthDependencySummary");
const depthSetupHint = document.querySelector("#depthSetupHint");
const dependencyDetails = document.querySelector(".dependency-details");
const generateDepthMapsButton = document.querySelector("#generateDepthMaps");
const depthResultPanel = document.querySelector("#depthResultPanel");
const depthPreview = document.querySelector("#depthPreview");
const normalPreview = document.querySelector("#normalPreview");
const saveDepthLink = document.querySelector("#saveDepthLink");
const saveNormalLink = document.querySelector("#saveNormalLink");
const scrollDepthToolButton = document.querySelector("#scrollDepthTool");
const openPromptModeButton = document.querySelector("#openPromptMode");
const localToolStatus = document.querySelector("#localToolStatus");
const presetButtons = document.querySelector("#presetButtons");
const presetDescription = document.querySelector("#presetDescription");
const presetReferences = document.querySelector("#presetReferences");
const presetReferenceGrid = document.querySelector("#presetReferenceGrid");
const shieldShapePicker = document.querySelector("#shieldShapePicker");
const shieldShapeStatus = document.querySelector("#shieldShapeStatus");
const shieldShapeGrid = document.querySelector("#shieldShapeGrid");
const clearShieldShapeButton = document.querySelector("#clearShieldShape");
const promptModeField = document.querySelector("#promptMode");
const skinSurfaceField = document.querySelector("#skinSurfaceField");
const preserveSkinSurfaceField = document.querySelector("#preserveSkinSurface");
const neckConnectorField = document.querySelector("#neckConnectorField");
const createNeckConnectorToggle = document.querySelector("#createNeckConnector");
const neckConnectorStyleField = document.querySelector("#neckConnectorStyleField");
const neckConnectorStyleSelect = document.querySelector("#neckConnectorStyle");
const extremeSimplifyField = document.querySelector("#extremeSimplifyField");
const extremeSimplifyToggle = document.querySelector("#extremeSimplify");
const extremeSimplifyLabel = document.querySelector("#extremeSimplifyLabel");
const creatureTailField = document.querySelector("#creatureTailField");
const creatureHasTailField = document.querySelector("#creatureHasTail");
const extraPromptField = document.querySelector("#extraPrompt");
const extraPromptLabel = document.querySelector("#extraPromptLabel");
const apiKeyField = document.querySelector("#apiKey");
const modelField = document.querySelector("#model");
const geminiOutputSizeField = document.querySelector("#geminiOutputSizeField");
const geminiOutputSizeLabel = document.querySelector("#geminiOutputSizeLabel");
const geminiOutputSize = document.querySelector("#geminiOutputSize");
const basReliefAspectRatioField = document.querySelector("#basReliefAspectRatioField");
const geminiAspectRatioLabel = document.querySelector("#geminiAspectRatioLabel");
const basReliefAspectRatio = document.querySelector("#basReliefAspectRatio");
const geminiSettings = document.querySelector("#geminiSettings");
const openaiSettings = document.querySelector("#openaiSettings");
const openaiApiKeyField = document.querySelector("#openaiApiKey");
const openaiModelField = document.querySelector("#openaiModel");
const openaiSizeField = document.querySelector("#openaiSize");
const openaiQualityField = document.querySelector("#openaiQuality");
const estimatedCostEl = document.querySelector("#estimatedCost");
const sessionCostEl = document.querySelector("#sessionCost");
const sessionCountEl = document.querySelector("#sessionCount");
const pricingNoteEl = document.querySelector("#pricingNote");
const generateButton = document.querySelector("#generate");
const saveExtraPromptButton = document.querySelector("#saveExtraPrompt");
const statusEl = document.querySelector("#status");
const dropzone = document.querySelector("#dropzone");
const splashScreen = document.querySelector("#splashScreen");
const splashStatus = document.querySelector("#splashStatus");
const updateBanner = document.querySelector("#updateBanner");
const updateTitle = document.querySelector("#updateTitle");
const updateMessage = document.querySelector("#updateMessage");
const updateProgress = document.querySelector("#updateProgress");
const updateProgressFill = document.querySelector("#updateProgressFill");
const updatePrimaryButton = document.querySelector("#updatePrimary");
const updateSecondaryButton = document.querySelector("#updateSecondary");

let selectedImage = null;
let currentOutputImage = null;
let frontReferenceImage = null;
let frontReferencesByPreset = {};
let colorGuideBackImage = null;
let colorGuideFrontSourceImage = null;
let upscaleInputImage = null;
let depthInputImage = null;
let upscalerInstalled = false;
let depthReady = false;
let upscalerPollTimer = null;
let updatePollTimer = null;
let presets = [];
let pricing = {};
let openaiPricing = {};
let sessionCostUsd = Number(sessionStorage.getItem("neverwinterForge.sessionCostUsd") || "0");
let sessionPaidGenerations = Number(sessionStorage.getItem("neverwinterForge.sessionPaidGenerations") || "0");
let selectedPresetId = localStorage.getItem("neverwinterForge.presetId") || "miniature";
let selectedShieldShapePath = localStorage.getItem("neverwinterForge.shieldShapePath") || "";
let generateButtonBaseLabel = "Generate";
const COLOR_GUIDE_PRESET_ID = "id-map-color-guide";
const SIMPLIFY_OBJECTS_PRESET_ID = "simplify-objects";
const splashMessages = [
  "Warming the forge...",
  "Loading presets...",
  "Checking local tools...",
  "Preparing the workbench..."
];
const SKIN_SURFACE_PROMPT = `Visible skin-like outfit areas:
The source outfit intentionally has exposed skin-like areas. Preserve those exposed areas instead of covering them with new cloth, armor, gloves, sleeves, leggings, collars, or panels.
Render exposed skin-like areas as smooth matte mannequin material: skin-toned plastic or resin, featureless, clean, non-realistic, low-shine, and PBR-readable.
No pores, veins, body hair, blemishes, sweat, scars, anatomy detail, or realistic skin texture. Keep it simple like a neutral material mask.
Only preserve exposed areas that are clearly part of the source outfit design. Do not add new exposed areas that are not in the source.
Skin cutoff guard:
Do not use mannequin skin as a cap, plug, filler, sleeve extension, glove extension, collar insert, neck stump, wrist stump, ankle stump, or artificial transition material.
At wrists, forearms, glove ends, bracer ends, sleeve cuffs, collars, gorgets, necklaces, neck rings, boot tops, and armor cutoffs, the outfit piece should terminate with its own material edge unless the source clearly shows exposed skin continuing beyond that exact edge.
If a bracer, glove, sleeve, collar, gorget, boot, or armor piece ends at a modular cutoff, finish it with a clean hard material rim, cuff, seam, bevel, shallow cap, or open dark interior. Do not add a gray or skin-toned body section beyond the edge just to complete the limb.
At the neck, terminate the body at the collar or neckline plane. Do not render a raised mannequin neck column, gray neck tube, exposed throat cylinder, or skin-colored plug above the collar.
Preserve skin only in intentional open regions such as bare torso, bare upper arm, open shoulder, exposed thigh, or deliberate neckline. Never infer extra skin just because the locked mannequin template has arms, neck, wrists, ankles, or gaps.`;
const ROBE_DRESS_SKIN_SURFACE_PROMPT = `Visible skin-like outfit areas for robe/dress:
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
Preserve skin only in intentional open upper-body regions such as bare shoulder, exposed neckline, open upper chest, or deliberately bare upper arm. Never infer extra skin at neck, wrist, ankle, or lower-body gaps.`;
const EXTREME_SIMPLIFY_PROMPT = `Extreme Simplify:
Create a clean canvas version of the outfit for image-to-3D modeling. Preserve the silhouette, garment construction, large armor plates, major seams, major belts, large sashes, collars, cuffs, boots, robe or dress hem rules, and broad material zones.
Remove all embroidery, floral designs, damask patterns, tiny filigree, decorative scrollwork, brocade, lace patterning, decals, symbols, sigils, heraldry, logos, readable icons, tiny trim motifs, micro buckles, small studs, noisy engravings, ornamental surface art, busy texture detail, scratches, grime, dirt, rust, and photoreal material noise.
For creature presets, also remove individual fur strands, shaggy fur edges, tiny scale fields, dense chainmail rings, pores, wet highlights, and high-frequency creature texture noise.
Reduce materials to bare minimum PBR-readable textiles and surfaces: plain cloth, plain leather, smooth metal, padded fabric, simple chainmail zones, simple sculpted fur masses, broad grouped scale or hide zones, matte skin-like mannequin material when skin preservation is enabled, and clean boot or paw-wrap material.
Make the simplified PBR material separation stronger: clear roughness differences, broad smooth highlights on metal, subdued cloth sheen, controlled leather sheen, and clean color blocking.
Do not flatten the outfit into one material. Keep useful large material zones, but remove decorative surface art so the user can repaint details later.`;
const OBJECT_EXTREME_SIMPLIFY_PROMPT = `Extreme Simplify Objects:
Run a stronger cleanup pass for image-to-3D object extraction.
Preserve the requested object identity, silhouette, broad proportions, major functional parts, primary material zones, large handles, blades, rims, guards, hinges, buckles, panels, openings, bases, legs, and structural seams.
Remove tiny filigree, micro scrollwork, small decals, logos, readable text, busy etched patterns, tiny repeated ornament, tassels, loose cords, dangling strands, thin fringe, fragile spikes, stray ribbons, small straps that do not define the construction, excessive buckles, tiny bolts, tiny gems, scratches, grime, rust, chipped paint, high-frequency surface texture, and decorative clutter.
Collapse clusters of small straps, trims, wires, or filigree into one or two broader clean forms when their placement matters.
Keep only large functional straps, bands, rims, sockets, handles, or supports that are necessary for the object to read correctly.
Reduce materials to clean broad PBR-readable surfaces such as plain metal, wood, leather, cloth, stone, ceramic, bone, glass, painted surface, or gem.
Do not redesign the object, add new parts, or make it blocky. Make it cleaner, sturdier, and easier to convert into a mesh.`;
const NECK_CONNECTOR_PROMPT = `Create Neck Connector:
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
Use broad readable forms and avoid tiny filigree unless the outfit already relies on large matching ornament. Prefer one strong connector idea over many small decorations.`;
const NECK_CONNECTOR_STYLE_PROMPTS = {
  auto: `Neck Connector Style: Auto Match Outfit.
Choose the neck connector archetype that best matches the source outfit's existing neckwear, armor language, cloth language, jewelry language, bracers, belts, boots, and material hierarchy.
If the source already has a necklace or pendant, prefer a broad necklace or pendant connector. If it has armor or hard bracers, prefer a gorget or plate collar. If it has soft cloth, prefer a cloth wrap or collar. If it is formal or magical, prefer a ceremonial connector.
Do not default to a choker unless a choker/collar is genuinely the best match. Keep the result body-scaled, broad enough for mesh generation, fitted to the locked neck opening, and flush at the collar plane.`,
  "choker-collar": `Neck Connector Style: Choker / Collar.
Force the connector toward a fitted choker, collar band, low collar, high collar, neck ring, or structured collar.
It should wrap fully around the neck opening as a broad wearable band with body-scale thickness, not a tiny rim.
Avoid pendant-dominant, scarf-dominant, or heavy armor gorget solutions unless the outfit clearly requires them.`,
  "necklace-pendant": `Neck Connector Style: Necklace / Pendant.
Force the connector toward a necklace, pendant, medallion, amulet, chain-and-plaque, crescent necklace, torque, torc, or broad decorative neck piece.
It must still function as a modular mesh connector: make the necklace broad, sculptural, and solid enough to create a clean neck break and hide the mannequin neck stump.
The pendant, medallion, clasp, or plaque may cap the front neckline visually, while the top neck cutoff remains centered, body-scale, collar-level, and usable for plugging in a head.
Do not turn it into a thin string, tiny charm, or fragile chain.`,
  "gorget-armor": `Neck Connector Style: Gorget / Armor.
Force the connector toward an armored gorget, segmented armor collar, metal socket collar, plate yoke, raised neck guard, or hard protective neck piece.
It should use the outfit's armor, bracer, boot, belt, or metal motifs and fit naturally over the upper chest, collarbone, shoulders, and full neck diameter.
Avoid delicate necklace-only or soft scarf solutions.`,
  "cloth-scarf": `Neck Connector Style: Cloth / Scarf.
Force the connector toward a cloth wrap, scarf-like short wrap, soft collar, mantle edge, folded fabric band, ribbon neck band, or padded textile connector.
It should be broad, clean, and sculptural enough for mesh generation, with a body-scale neck opening and no loose dangling strips.
Avoid hard armor gorgets or jewelry-dominant pendants unless the outfit clearly requires them.`,
  "ceremonial-fantasy": `Neck Connector Style: Ceremonial / Fantasy.
Force the connector toward a more expressive fantasy connector: ceremonial neck plate, gem-set collar, mage amulet socket, noble yoke, ritual collar, ornate clasp, bone or horn collar, or symbolic but non-logo neck piece.
Use the outfit's existing motifs and materials, but keep the forms broad, readable, mesh-friendly, and body-scaled.
Avoid tiny filigree, fragile chains, unreadable micro-ornament, or a small cap-like plug.`
};
const CREATURE_TAIL_ENABLED_PROMPT = `Creature tail option:
Creature has tail is enabled. Keep one tail attached at the correct rear pelvis/tail-root area whenever that view can naturally show it. The tail must be straight on its view axis: centered and vertical/downward in front or back views, and a clean straight profile extension in side view. Do not curve, sway, curl, twist, wag, hook, arc, coil, or drift the tail left or right. Do not rotate or angle a front or back view just to show more tail. The dedicated creature side view should show the full tail profile. Follow any tail range or tail silhouette reference included by the selected creature preset, and never exceed that skeleton's allowed tail length or extension.`;
const CREATURE_TAIL_DISABLED_PROMPT = `Creature tail option:
Creature has tail is disabled. Do not include a tail, tail stump, tail shadow, tail strap, or tail-like cloth. If the creature species normally has a tail, create a no-tail variant for this output.`;
let splashMessageIndex = 0;
let splashMessageTimer = null;

document.body.classList.add("splash-active");
startSplashScreen();

extraPromptField.value = localStorage.getItem("neverwinterForge.extraPrompt") || "";
objectPromptField.value = localStorage.getItem("neverwinterForge.objectPrompt") || "";
promptModeField.value = localStorage.getItem("neverwinterForge.promptMode") || "preset-extra";
preserveSkinSurfaceField.checked = localStorage.getItem("neverwinterForge.preserveSkinSurface") === "true";
createNeckConnectorToggle.checked = localStorage.getItem("neverwinterForge.createNeckConnector") === "true";
neckConnectorStyleSelect.value = localStorage.getItem("neverwinterForge.neckConnectorStyle") || "auto";
extremeSimplifyToggle.checked = localStorage.getItem("neverwinterForge.extremeSimplify") === "true";
creatureHasTailField.checked = localStorage.getItem("neverwinterForge.creatureHasTail") === "true";
apiKeyField.value = localStorage.getItem("neverwinterForge.apiKey") || "";
modelField.value = localStorage.getItem("neverwinterForge.model") || "gemini-2.5-flash-image";
geminiOutputSize.value = localStorage.getItem("neverwinterForge.geminiOutputSize") || "2K";
basReliefAspectRatio.value = localStorage.getItem("neverwinterForge.basReliefAspectRatio") || "2:3";
openaiApiKeyField.value = localStorage.getItem("neverwinterForge.openaiApiKey") || "";
openaiModelField.value = localStorage.getItem("neverwinterForge.openaiModel") || "gpt-image-2";
openaiSizeField.value = localStorage.getItem("neverwinterForge.openaiSize") || "1024x1024";
openaiQualityField.value = localStorage.getItem("neverwinterForge.openaiQuality") || "medium";

loadPresets();
loadExtraPrompt();
loadPricing();
loadUpscalerStatus();
loadDepthStatus();
loadUpdateStatus();
window.setTimeout(checkForUpdatesQuietly, 1800);
renderSessionCost();
updateProviderSettings();
setupDependencyAccordion();
window.setTimeout(hideSplashScreen, 2600);

document.querySelectorAll("input[name='mode']").forEach((radio) => {
  radio.addEventListener("change", () => {
    updateProviderSettings();
    renderSessionCost();
  });
});

apiKeyField.addEventListener("input", () => {
  localStorage.setItem("neverwinterForge.apiKey", apiKeyField.value);
});

openaiApiKeyField.addEventListener("input", () => {
  localStorage.setItem("neverwinterForge.openaiApiKey", openaiApiKeyField.value);
});

modelField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.model", modelField.value);
  renderSessionCost();
});

geminiOutputSize.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.geminiOutputSize", geminiOutputSize.value);
  renderSessionCost();
});

basReliefAspectRatio.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.basReliefAspectRatio", basReliefAspectRatio.value);
});

openaiModelField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.openaiModel", openaiModelField.value);
  renderSessionCost();
});

openaiSizeField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.openaiSize", openaiSizeField.value);
  renderSessionCost();
});

openaiQualityField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.openaiQuality", openaiQualityField.value);
  renderSessionCost();
});

promptModeField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.promptMode", promptModeField.value);
});

preserveSkinSurfaceField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.preserveSkinSurface", String(preserveSkinSurfaceField.checked));
});

createNeckConnectorToggle.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.createNeckConnector", String(createNeckConnectorToggle.checked));
  renderInputMode();
});

neckConnectorStyleSelect.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.neckConnectorStyle", neckConnectorStyleSelect.value);
});

extremeSimplifyToggle.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.extremeSimplify", String(extremeSimplifyToggle.checked));
});

creatureHasTailField.addEventListener("change", () => {
  localStorage.setItem("neverwinterForge.creatureHasTail", String(creatureHasTailField.checked));
});

extraPromptField.addEventListener("input", () => {
  localStorage.setItem("neverwinterForge.extraPrompt", extraPromptField.value);
});

objectPromptField.addEventListener("input", () => {
  localStorage.setItem("neverwinterForge.objectPrompt", objectPromptField.value);
});

clearShieldShapeButton.addEventListener("click", () => {
  selectedShieldShapePath = "";
  localStorage.removeItem("neverwinterForge.shieldShapePath");
  renderShieldShapePicker(getSelectedPreset());
});

saveExtraPromptButton.addEventListener("click", async () => {
  setStatus("Saving misc prompt...");
  const response = await fetch("/api/extra-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: extraPromptField.value })
  });
  if (!response.ok) {
    setStatus("Could not save misc prompt.", true);
    return;
  }
  setStatus("Misc prompt saved.");
});

openOutputsFolderButton.addEventListener("click", async () => {
  await openOutputsFolder();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) setImage(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) setImage(file);
});

colorGuideBackInput.addEventListener("change", () => {
  const file = colorGuideBackInput.files[0];
  if (file) setColorGuideBackImage(file);
});

colorGuideBackDropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

colorGuideBackDropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) setColorGuideBackImage(file);
});

clearColorGuideBackButton.addEventListener("click", () => {
  clearColorGuideBackImage();
  setStatus("Back source cleared.");
});

generateButton.addEventListener("click", async () => {
  const selected = getSelectedPreset();
  if (isOpenPromptPreset(selected)) {
    const openPrompt = objectPromptField.value.trim();
    if (!openPrompt && !extraPromptField.value.trim()) {
      setStatus("Write an open prompt first.", true);
      return;
    }

    await runGeneration({
      image: selectedImage || undefined,
      prompt: buildPrompt(),
      textPrompt: openPrompt,
      viewId: selectedImage ? "open-image" : "open-text",
      busyLabel: "Running open prompt...",
      statusLabel: "Open prompt complete.",
      useResultAsFrontReference: true
    });
    return;
  }

  if (isImagePromptPreset(selected)) {
    const objectPrompt = objectPromptField.value.trim();
    if (!selectedImage) {
      setStatus("Choose a source image with the object you want to simplify.", true);
      return;
    }
    if (!objectPrompt) {
      setStatus("Describe which object or objects to extract and simplify first.", true);
      objectPromptField.focus();
      return;
    }

    await runGeneration({
      image: selectedImage,
      prompt: buildPrompt(),
      textPrompt: objectPrompt,
      viewId: "simplify-objects-front",
      busyLabel: "Simplifying object extraction...",
      statusLabel: "Simplified object extraction complete.",
      useResultAsFrontReference: true
    });
    return;
  }

  if (isTextToImagePreset(selected)) {
    const objectPrompt = objectPromptField.value.trim();
    if (!objectPrompt) {
      setStatus("Describe the object you want to generate first.", true);
      return;
    }

    await runGeneration({
      prompt: buildPrompt(),
      textPrompt: objectPrompt,
      viewId: "object-front",
      busyLabel: "Generating object concept...",
      statusLabel: "Object concept complete.",
      useResultAsFrontReference: true
    });
    return;
  }

  if (!selectedImage) {
    setStatus("Choose an input image first.", true);
    return;
  }

  if (!validateCreaturePrompt(selected)) {
    return;
  }

  const result = await runGeneration({
    image: selectedImage,
    additionalImages: getColorGuideFrontAdditionalImages(selected),
    prompt: buildPrompt(),
    viewId: isColorGuidePreset(selected) ? "color-guide-front" : "front",
    busyLabel: isColorGuidePreset(selected) ? "Generating front color guide..." : "Generating front view...",
    statusLabel: isColorGuidePreset(selected) ? "Front color guide complete." : "Front view complete.",
    useResultAsFrontReference: true
  });
  if (result && isColorGuidePreset(selected)) {
    colorGuideFrontSourceImage = cloneImageForPayload(selectedImage, "front-source");
  }
});

generateBackViewButton.addEventListener("click", async () => {
  if (isColorGuidePreset(getSelectedPreset())) {
    await runColorGuideBackView();
    return;
  }
  await runDerivedView(getBackViewPresetId(), "Generating back view...", "Back view complete.");
});

generateThreeQuarterViewButton.addEventListener("click", async () => {
  const secondViewPresetId = getSecondViewPresetId();
  if (!secondViewPresetId) {
    setStatus("No second view is configured for this preset.", true);
    return;
  }

  const isSideView = secondViewPresetId.endsWith("-side");
  await runDerivedView(
    secondViewPresetId,
    isSideView ? "Generating side view..." : "Generating 3/4 view...",
    isSideView ? "Side view complete." : "3/4 view complete."
  );
});

downloadUpscalerButton.addEventListener("click", async () => {
  setStatus("Starting upscaler download...");
  const response = await fetch("/api/upscaler/download", { method: "POST" });
  const result = await response.json();
  renderUpscalerStatus(result);
  startUpscalerPolling();
});

updatePrimaryButton.addEventListener("click", async () => {
  const action = updatePrimaryButton.dataset.action || "";
  if (action === "download") {
    await startUpdateDownload();
  } else if (action === "apply") {
    await applyDownloadedUpdate();
  } else if (action === "dismiss") {
    await dismissUpdateBanner();
  } else if (action === "open-release") {
    const url = updatePrimaryButton.dataset.url;
    if (url) window.open(url, "_blank", "noopener");
  }
});

updateSecondaryButton.addEventListener("click", async () => {
  const action = updateSecondaryButton.dataset.action || "";
  if (action === "open-release") {
    const url = updateSecondaryButton.dataset.url;
    if (url) window.open(url, "_blank", "noopener");
    return;
  }
  await dismissUpdateBanner();
});

upscale2xButton.addEventListener("click", async () => {
  await runUpscale(2);
});

upscale4xButton.addEventListener("click", async () => {
  await runUpscale(4);
});

upscaleImageInput.addEventListener("change", () => {
  const file = upscaleImageInput.files[0];
  if (file) setUpscaleInput(file);
});

upscaleDropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

upscaleDropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) setUpscaleInput(file);
});

useCurrentOutputButton.addEventListener("click", () => {
  if (!currentOutputImage) {
    setStatus("Generate an output first.", true);
    return;
  }

  const imageUrl = `data:${currentOutputImage.mimeType};base64,${currentOutputImage.base64}`;
  upscaleInputImage = {
    base64: currentOutputImage.base64,
    mimeType: currentOutputImage.mimeType,
    name: currentOutputImage.name
  };
  upscaleInputPreview.src = imageUrl;
  upscaleDropzone.classList.add("has-image");
  hideElement(comparePanel);
  updateUpscaleButtons();
  setStatus("Current output loaded into post-production.");
});

clearUpscalerButton.addEventListener("click", () => {
  clearUpscalerInput();
});

refreshDepthStatusButton.addEventListener("click", async () => {
  renderDepthChecking();
  await loadDepthStatus();
});

depthImageInput.addEventListener("change", () => {
  const file = depthImageInput.files[0];
  if (file) setDepthInput(file);
});

depthDropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

depthDropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) setDepthInput(file);
});

useCurrentForDepthButton.addEventListener("click", () => {
  if (!currentOutputImage) {
    setStatus("Generate an output first.", true);
    return;
  }

  const imageUrl = `data:${currentOutputImage.mimeType};base64,${currentOutputImage.base64}`;
  depthInputImage = {
    base64: currentOutputImage.base64,
    mimeType: currentOutputImage.mimeType,
    name: currentOutputImage.name
  };
  depthInputPreview.src = imageUrl;
  depthDropzone.classList.add("has-image");
  hideElement(depthResultPanel);
  updateDepthButtons();
  setStatus("Current output loaded for depth and normal maps.");
});

generateDepthMapsButton.addEventListener("click", async () => {
  await runDepthMaps();
});

scrollDepthToolButton.addEventListener("click", () => {
  depthDropzone.scrollIntoView({ behavior: "smooth", block: "center" });
});

openPromptModeButton.addEventListener("click", () => {
  activatePreset("open-prompt", { promptMode: "preset-extra", scrollToInput: true });
});

async function runGeneration({ image, additionalImages = [], prompt, textPrompt = "", generationPresetId = selectedPresetId, viewId, busyLabel, statusLabel, useResultAsFrontReference = false }) {
  const mode = document.querySelector("input[name='mode']:checked").value;
  if (mode === "gemini" && !apiKeyField.value.trim()) {
    setStatus("Paste a Gemini API key or switch to Mock mode.", true);
    return;
  }
  if (mode === "openai" && !openaiApiKeyField.value.trim()) {
    setStatus("Paste an OpenAI API key or switch to Mock mode.", true);
    return;
  }

  setGenerationDisabled(true);
  setGenerateBusy(true, mode === "mock" ? "Running Mock..." : "Generating...");
  setStatus(mode === "mock" ? "Running mock generation..." : busyLabel);

  try {
    const outfitOptionPreset = getOutfitOptionPreset(generationPresetId);
    const payload = {
      mode,
      prompt,
      presetId: generationPresetId,
      promptMode: promptModeField.value,
      extraPrompt: extraPromptField.value,
      apiKey: apiKeyField.value,
      model: modelField.value,
      openaiApiKey: openaiApiKeyField.value,
      openaiModel: openaiModelField.value,
      openaiSize: openaiSizeField.value,
      openaiQuality: openaiQualityField.value,
      geminiOutputSize: geminiOutputSize.value,
      basReliefAspectRatio: basReliefAspectRatio.value,
      openaiOutputFormat: "png",
      preserveSkinSurface: usesSkinSurfaceControl(outfitOptionPreset) && preserveSkinSurfaceField.checked,
      createNeckConnector: usesNeckConnectorControl(outfitOptionPreset) && createNeckConnectorToggle.checked,
      neckConnectorStyle: neckConnectorStyleSelect.value,
      extremeSimplify: usesOutfitOptionControls(outfitOptionPreset) && extremeSimplifyToggle.checked,
      creatureHasTail: isCreaturePreset(outfitOptionPreset) && creatureHasTailField.checked,
      viewId,
      textPrompt,
      sourceName: image?.name || objectPromptField.value.trim() || "text-object",
      imageData: image?.base64 || "",
      mimeType: image?.mimeType || "image/png",
      additionalImages,
      shieldShapeReference: getSelectedShieldShapeReference(generationPresetId)
    };
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Generation failed.");

    const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
    currentOutputImage = {
      base64: result.imageData,
      mimeType: result.mimeType,
      name: result.savedPath ? fileNameFromPath(result.savedPath) : "generated-output"
    };
    if (useResultAsFrontReference) {
      frontReferenceImage = currentOutputImage;
      frontReferencesByPreset[selectedPresetId] = currentOutputImage;
    }
    outputPreview.src = imageUrl;
    outputShell.classList.add("has-image");
    revealImageShell(outputShell);
    outputEmpty.style.display = "none";
    downloadLink.href = imageUrl;
    downloadLink.style.display = "inline-flex";
    renderAutosave(result.savedPath, result.metadataPath);
    updateDerivedButtons();
    updateUpscaleButtons();
    updateDepthButtons();
    if (mode === "gemini" || mode === "openai") {
      const cost = Number(result.estimatedCostUsd || getSelectedModelEstimate());
      sessionCostUsd += cost;
      sessionPaidGenerations += 1;
      sessionStorage.setItem("neverwinterForge.sessionCostUsd", String(sessionCostUsd));
      sessionStorage.setItem("neverwinterForge.sessionPaidGenerations", String(sessionPaidGenerations));
      renderSessionCost();
    }
    const promptDetail = result.promptLength ? ` Prompt: ${result.promptLength} characters.` : "";
    const saveDetail = result.savedPath ? ` Auto-saved to outputs: ${fileNameFromPath(result.savedPath)}.` : "";
    setStatus(`${result.note || statusLabel}${promptDetail}${saveDetail}`);
    return result;
  } catch (error) {
    setStatus(error.message, true);
    return null;
  } finally {
    setGenerateBusy(false);
    setGenerationDisabled(false);
  }
}

async function runDerivedView(presetId, busyLabel, statusLabel) {
  const referenceImage = getFrontReferenceForSelectedPreset();
  if (!referenceImage) {
    setStatus("Generate a front view first.", true);
    return;
  }

  const preset = presets.find((item) => item.id === presetId);
  if (!preset) {
    setStatus("View prompt could not be found.", true);
    return;
  }

  if (!validateCreaturePrompt(getSelectedPreset())) {
    return;
  }

  const derivedInputImage = loadGeneratedImageIntoInput(referenceImage);
  const sourceRoutingPrompt = [
    "Derived-view source routing:",
    "The uploaded image for this request is the generated front-view output from the previous step.",
    "Treat that uploaded front-view output as the only source image for outfit identity, materials, belts, straps, seams, silhouette, and proportions.",
    "Do not use, remember, restore, or reinterpret the original user input image that existed before the front-view generation."
  ].join("\n");
  await runGeneration({
    image: derivedInputImage,
    prompt: [sourceRoutingPrompt, preset.prompt.trim(), getSkinSurfacePrompt(getSelectedPreset()), getNeckConnectorPrompt(getSelectedPreset()), getExtremeSimplifyPrompt(getSelectedPreset()), getCreatureTailPrompt(getSelectedPreset()), extraPromptField.value.trim()].filter(Boolean).join("\n\n"),
    generationPresetId: presetId,
    viewId: presetId.replace("miniature-", ""),
    busyLabel,
    statusLabel
  });
}

async function runColorGuideBackView() {
  const frontGuide = getFrontReferenceForSelectedPreset();
  if (!frontGuide) {
    setStatus("Generate a front color guide first.", true);
    return;
  }
  if (!colorGuideBackImage) {
    setStatus("Choose a back source image first.", true);
    return;
  }

  const frontSource = colorGuideFrontSourceImage || selectedImage;
  if (!frontSource) {
    setStatus("Choose a front source image first.", true);
    return;
  }

  const preset = presets.find((item) => item.id === "id-map-color-guide-back") || getSelectedPreset();
  const sourceRoutingPrompt = [
    "Color guide back-view routing:",
    "Image 1 is the back source render to recolor.",
    "Image 2 is the original front source render for matching labels.",
    "Image 3 is the approved front flat color guide and is the color-label authority for continuing regions around the back.",
    "Generate only the matching back flat color guide."
  ].join("\n");

  await runGeneration({
    image: colorGuideBackImage,
    additionalImages: [
      cloneImageForPayload(frontSource, "front-source"),
      cloneImageForPayload(frontGuide, "front-color-guide")
    ],
    prompt: [sourceRoutingPrompt, preset.prompt.trim(), extraPromptField.value.trim()].filter(Boolean).join("\n\n"),
    generationPresetId: preset.id,
    viewId: "color-guide-back",
    busyLabel: "Generating back color guide...",
    statusLabel: "Back color guide complete."
  });
}

async function runUpscale(scale) {
  if (!upscaleInputImage) {
    setStatus("Choose an image in Post-Production first.", true);
    return;
  }
  if (!upscalerInstalled) {
    setStatus("Download the local upscaler first.", true);
    return;
  }

  setUpscaleDisabled(true);
  const originalForCompare = upscaleInputImage;
  setStatus(`Upscaling ${scale}x locally...`);
  try {
    const response = await fetch("/api/upscaler/upscale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scale,
        imageData: upscaleInputImage.base64,
        mimeType: upscaleInputImage.mimeType,
        sourceName: upscaleInputImage.name
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upscale failed.");

    const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
    const originalUrl = `data:${originalForCompare.mimeType};base64,${originalForCompare.base64}`;
    currentOutputImage = {
      base64: result.imageData,
      mimeType: result.mimeType,
      name: `generated-output-upscaled-${scale}x`
    };
    upscaleInputImage = currentOutputImage;
    upscaleInputPreview.src = imageUrl;
    upscaleDropzone.classList.add("has-image");
    outputPreview.src = imageUrl;
    outputShell.classList.add("has-image");
    revealImageShell(outputShell);
    outputEmpty.style.display = "none";
    downloadLink.href = imageUrl;
    downloadLink.style.display = "inline-flex";
    showComparison(originalUrl, imageUrl, scale);
    renderAutosave(result.savedPath, result.metadataPath);
    setStatus(`${result.note} Auto-saved to outputs: ${fileNameFromPath(result.savedPath)}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setUpscaleDisabled(false);
  }
}

function setImage(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const [, base64] = dataUrl.split(",");
    selectedImage = { base64, mimeType: file.type, name: file.name };
    currentOutputImage = null;
    frontReferenceImage = null;
    delete frontReferencesByPreset[selectedPresetId];
    if (isColorGuidePreset(getSelectedPreset())) {
      colorGuideFrontSourceImage = null;
    }
    inputPreview.src = dataUrl;
    dropzone.classList.add("has-image");
    revealImageShell(dropzone);
    dropzone.querySelector("span").style.display = "none";
    outputPreview.removeAttribute("src");
    outputShell.classList.remove("has-image");
    outputEmpty.style.display = "";
    downloadLink.style.display = "none";
    clearAutosavePanel();
    hideElement(comparePanel);
    useCurrentOutputButton.disabled = true;
    useCurrentForDepthButton.disabled = true;
    updateDerivedButtons();
    updateUpscaleButtons();
    updateDepthButtons();
    setStatus(`Loaded ${file.name}.`);
  };
  reader.readAsDataURL(file);
}

function setColorGuideBackImage(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const [, base64] = dataUrl.split(",");
    colorGuideBackImage = { base64, mimeType: file.type, name: file.name };
    colorGuideBackPreview.src = dataUrl;
    colorGuideBackDropzone.classList.add("has-image");
    revealImageShell(colorGuideBackDropzone);
    clearColorGuideBackButton.disabled = false;
    updateDerivedButtons();
    setStatus(`Loaded ${file.name} as back source.`);
  };
  reader.readAsDataURL(file);
}

function clearColorGuideBackImage() {
  colorGuideBackImage = null;
  colorGuideBackInput.value = "";
  colorGuideBackPreview.removeAttribute("src");
  colorGuideBackDropzone.classList.remove("has-image");
  colorGuideBackDropzone.querySelector("span").style.display = "";
  clearColorGuideBackButton.disabled = true;
  updateDerivedButtons();
}

function loadGeneratedImageIntoInput(image) {
  const inputImage = {
    base64: image.base64,
    mimeType: image.mimeType,
    name: image.name || "generated-front-reference"
  };
  selectedImage = inputImage;
  imageInput.value = "";
  inputPreview.src = `data:${inputImage.mimeType};base64,${inputImage.base64}`;
  dropzone.classList.add("has-image");
  revealImageShell(dropzone);
  dropzone.querySelector("span").style.display = "none";
  return inputImage;
}

function setUpscaleInput(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const [, base64] = dataUrl.split(",");
    upscaleInputImage = { base64, mimeType: file.type, name: file.name };
    upscaleInputPreview.src = dataUrl;
    upscaleDropzone.classList.add("has-image");
    revealImageShell(upscaleDropzone);
    hideElement(comparePanel);
    updateUpscaleButtons();
    setStatus(`Loaded ${file.name} for post-production.`);
  };
  reader.readAsDataURL(file);
}

function clearUpscalerInput() {
  upscaleInputImage = null;
  upscaleImageInput.value = "";
  upscaleInputPreview.removeAttribute("src");
  upscaleDropzone.classList.remove("has-image");
  hideElement(comparePanel);
  compareOriginal.removeAttribute("src");
  compareUpscaled.removeAttribute("src");
  saveUpscaledLink.removeAttribute("href");
  updateUpscaleButtons();
  setStatus("Upscaler input cleared.");
}

function setDepthInput(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const [, base64] = dataUrl.split(",");
    depthInputImage = { base64, mimeType: file.type, name: file.name };
    depthInputPreview.src = dataUrl;
    depthDropzone.classList.add("has-image");
    revealImageShell(depthDropzone);
    hideElement(depthResultPanel);
    updateDepthButtons();
    setStatus(`Loaded ${file.name} for depth and normal maps.`);
  };
  reader.readAsDataURL(file);
}

async function runDepthMaps() {
  if (!depthInputImage) {
    setStatus("Choose an image for depth and normal maps first.", true);
    return;
  }
  if (!depthReady) {
    setStatus("Depth workflow is not ready. Check ComfyUI and required models.", true);
    return;
  }

  setDepthDisabled(true);
  setStatus("Generating depth and normal maps locally...");
  try {
    const response = await fetch("/api/depth/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: depthInputImage.base64,
        mimeType: depthInputImage.mimeType,
        sourceName: depthInputImage.name
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Depth workflow failed.");

    const depthUrl = `data:${result.depthMimeType};base64,${result.depthImageData}`;
    const normalUrl = `data:${result.normalMimeType};base64,${result.normalImageData}`;
    depthPreview.src = depthUrl;
    normalPreview.src = normalUrl;
    saveDepthLink.href = depthUrl;
    saveNormalLink.href = normalUrl;
    saveDepthLink.download = "neverwinter-forge-depth-map.png";
    saveNormalLink.download = "neverwinter-forge-normal-map.png";
    showElement(depthResultPanel, "block");
    renderAutosave(result.depthSavedPath, result.metadataPath, result.normalSavedPath);
    setStatus(`${result.note} Auto-saved to outputs: ${fileNameFromPath(result.depthSavedPath)} and ${fileNameFromPath(result.normalSavedPath)}.`);
  } catch (error) {
    setStatus(error.message, true);
    await loadDepthStatus();
  } finally {
    setDepthDisabled(false);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function renderAutosave(primaryPath, metadataPath = "", secondaryPath = "") {
  if (!primaryPath) {
    clearAutosavePanel();
    return;
  }
  const names = [primaryPath, secondaryPath].filter(Boolean).map(fileNameFromPath).join(" + ");
  const metaName = metadataPath ? ` Metadata: ${fileNameFromPath(metadataPath)}.` : "";
  autosaveFile.textContent = `${names}.${metaName}`;
  autosaveFile.title = [primaryPath, secondaryPath, metadataPath].filter(Boolean).join("\n");
  autosavePanel.classList.remove("hidden");
}

function clearAutosavePanel() {
  autosaveFile.textContent = "No output saved yet.";
  autosaveFile.removeAttribute("title");
  autosavePanel.classList.add("hidden");
}

function fileNameFromPath(path) {
  return String(path || "").split(/[\\/]/).filter(Boolean).pop() || "output file";
}

async function openOutputsFolder() {
  try {
    const response = await fetch("/api/outputs/open", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not open outputs folder.");
    setStatus(`Opened outputs folder: ${result.outputDir}`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function startSplashScreen() {
  if (!splashScreen || !splashStatus) return;
  splashStatus.textContent = splashMessages[0];
  splashMessageTimer = window.setInterval(() => {
    splashMessageIndex = (splashMessageIndex + 1) % splashMessages.length;
    splashStatus.textContent = splashMessages[splashMessageIndex];
  }, 620);
}

function hideSplashScreen() {
  if (!splashScreen) return;
  if (splashMessageTimer) {
    window.clearInterval(splashMessageTimer);
    splashMessageTimer = null;
  }
  splashScreen.classList.add("is-hidden");
  document.body.classList.remove("splash-active");
  window.setTimeout(() => {
    splashScreen.remove();
  }, 720);
}

function revealImageShell(element) {
  element.classList.remove("fx-image-reveal");
  void element.offsetWidth;
  element.classList.add("fx-image-reveal");
  window.setTimeout(() => element.classList.remove("fx-image-reveal"), 320);
}

function showElement(element, displayValue = "") {
  if (!element) return;
  element.classList.remove("hidden");
  element.style.display = displayValue;
  element.style.opacity = "";
  element.style.transform = "";
  element.style.transition = "";
}

function hideElement(element) {
  if (!element) return;
  element.classList.add("hidden");
  element.style.display = "";
  element.style.opacity = "";
  element.style.transform = "";
  element.style.transition = "";
}

function setGenerateBusy(isBusy, label = "Generating...") {
  if (isBusy) {
    generateButtonBaseLabel = getGenerateButtonLabel();
    generateButton.textContent = label;
    generateButton.classList.add("is-busy");
    generateButton.setAttribute("aria-busy", "true");
    return;
  }

  generateButton.classList.remove("is-busy");
  generateButton.removeAttribute("aria-busy");
  generateButton.textContent = getGenerateButtonLabel() || generateButtonBaseLabel;
}

function setupDependencyAccordion() {
  if (!window.jQuery || !dependencyDetails) return;
  const summary = dependencyDetails.querySelector("summary");
  const list = dependencyDetails.querySelector(".dependency-list");
  if (!summary || !list) return;

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const $list = window.jQuery(list);
    $list.stop(true, true);

    if (dependencyDetails.open) {
      $list.slideUp(180, () => {
        dependencyDetails.open = false;
        list.style.display = "";
      });
      return;
    }

    dependencyDetails.open = true;
    $list.hide().slideDown(360, () => {
      list.style.display = "";
    });
  });
}

async function loadPresets() {
  try {
    const response = await fetch("/api/presets");
    const result = await response.json();
    presets = result.presets || [];
    if (!presets.some((preset) => preset.id === selectedPresetId) && presets[0]) {
      selectedPresetId = presets[0].id;
    }
    renderPresetButtons();
    const selected = presets.find((preset) => preset.id === selectedPresetId);
    if (selected) {
      applyPresetDefaults(selected);
      setProviderMode(getPresetProviderDefault(selected));
      applyRecommendedModel(selected, false);
    }
    updateDerivedButtons();
  } catch {
    setStatus("Preset prompts could not be loaded.", true);
  }
}

async function loadExtraPrompt() {
  try {
    const response = await fetch("/api/extra-prompt");
    const result = await response.json();
    if (result.prompt && !localStorage.getItem("neverwinterForge.extraPrompt")) {
      extraPromptField.value = result.prompt;
      localStorage.setItem("neverwinterForge.extraPrompt", result.prompt);
    }
  } catch {
    setStatus("Misc prompt file could not be loaded.", true);
  }
}

async function loadPricing() {
  try {
    const response = await fetch("/api/pricing");
    const result = await response.json();
    pricing = result.models || {};
    openaiPricing = result.openaiModels || {};
    pricingNoteEl.textContent = `Rough estimate from provider pricing, verified ${result.lastVerified}. Input/text/image tokens may add a small amount.`;
    renderSessionCost();
  } catch {
    pricingNoteEl.textContent = "Pricing estimate could not be loaded.";
  }
}

async function loadUpscalerStatus() {
  try {
    const response = await fetch("/api/upscaler/status");
    const result = await response.json();
    renderUpscalerStatus(result);
    if (result.active) startUpscalerPolling();
  } catch {
    upscalerStatusEl.textContent = "Upscaler status could not be loaded.";
  }
}

async function loadDepthStatus() {
  try {
    const response = await fetch(`/api/depth/status?t=${Date.now()}`);
    const result = await response.json();
    renderDepthStatus(result);
  } catch {
    depthReady = false;
    depthStatusEl.textContent = "Depth workflow status could not be loaded.";
    localToolStatus.textContent = "Depth workflow status unavailable.";
    depthDependencySummary.textContent = "Unavailable";
    dependencyDetails.dataset.state = "missing";
    depthSetupHint.textContent = "Could not check local dependencies. Make sure Neverwinter Forge is running correctly, then click Refresh.";
    depthSetupHint.classList.remove("hidden");
    refreshDepthStatusButton.disabled = false;
    refreshDepthStatusButton.textContent = "Refresh";
    updateDepthButtons();
  }
}

async function loadUpdateStatus() {
  try {
    const response = await fetch(`/api/update/status?t=${Date.now()}`);
    const result = await response.json();
    renderUpdateStatus(result);
    if (result.download?.active) startUpdatePolling();
  } catch {
    updateBanner.classList.add("hidden");
  }
}

async function checkForUpdatesQuietly() {
  try {
    const response = await fetch("/api/update/check", { method: "POST" });
    if (!response.ok) return;
    const result = await response.json();
    renderUpdateStatus(result);
  } catch {
    // Update checks are intentionally quiet unless there is a useful state to show.
  }
}

async function startUpdateDownload() {
  updatePrimaryButton.disabled = true;
  updatePrimaryButton.textContent = "Starting...";
  try {
    const response = await fetch("/api/update/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const result = await response.json();
    renderUpdateStatus(result);
    if (result.download?.active) startUpdatePolling();
  } catch {
    renderUpdateError("Could not start the update download.");
  }
}

async function applyDownloadedUpdate() {
  updatePrimaryButton.disabled = true;
  updatePrimaryButton.textContent = "Restarting...";
  try {
    const response = await fetch("/api/update/apply", { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      renderUpdateError(result.error || "Could not start the updater.");
      return;
    }
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "applying";
    updateTitle.textContent = "Updating Neverwinter Forge";
    updateMessage.textContent = result.message || "Forge is closing. The updater will install the latest version and relaunch Forge.";
    updateProgress.classList.add("hidden");
    updatePrimaryButton.classList.add("hidden");
    updateSecondaryButton.classList.add("hidden");
  } catch {
    renderUpdateError("Could not start the updater.");
  }
}

async function dismissUpdateBanner() {
  try {
    await fetch("/api/update/dismiss", { method: "POST" });
  } catch {
    // The banner can still be hidden locally if the dismiss call fails.
  }
  updateBanner.classList.add("hidden");
}

function startUpdatePolling() {
  if (updatePollTimer) return;
  updatePollTimer = window.setInterval(async () => {
    const response = await fetch(`/api/update/status?t=${Date.now()}`);
    const result = await response.json();
    renderUpdateStatus(result);
    if (!result.download?.active) {
      window.clearInterval(updatePollTimer);
      updatePollTimer = null;
    }
  }, 700);
}

function renderUpdateStatus(status) {
  const notice = status.notice;
  const latest = status.latest;
  const download = status.download || {};
  updateBanner.classList.add("hidden");
  updateBanner.dataset.state = "";
  updateProgress.classList.add("hidden");
  updatePrimaryButton.classList.remove("hidden");
  updateSecondaryButton.classList.remove("hidden");
  updatePrimaryButton.disabled = false;
  updateSecondaryButton.disabled = false;
  updatePrimaryButton.dataset.action = "";
  updateSecondaryButton.dataset.action = "dismiss";
  updatePrimaryButton.dataset.url = "";
  updateSecondaryButton.dataset.url = "";
  updateSecondaryButton.textContent = "Dismiss";

  if (notice?.status === "installed") {
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "installed";
    updateTitle.textContent = "Neverwinter Forge Updated";
    updateMessage.textContent = notice.message || `Forge has been updated to ${notice.version}.`;
    updatePrimaryButton.textContent = "OK";
    updatePrimaryButton.dataset.action = "dismiss";
    updateSecondaryButton.classList.add("hidden");
    return;
  }

  if (notice?.status === "error") {
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "error";
    updateTitle.textContent = "Update Failed";
    updateMessage.textContent = notice.message || "The previous Forge files were restored.";
    updatePrimaryButton.textContent = "OK";
    updatePrimaryButton.dataset.action = "dismiss";
    updateSecondaryButton.classList.add("hidden");
    return;
  }

  if (download.active) {
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "downloading";
    updateTitle.textContent = "Downloading Forge Update";
    updateMessage.textContent = download.message || "Downloading the latest Neverwinter Forge release...";
    updateProgress.classList.remove("hidden");
    updateProgressFill.style.width = `${download.percent || 0}%`;
    updatePrimaryButton.disabled = true;
    updatePrimaryButton.textContent = `${download.percent || 0}%`;
    updateSecondaryButton.textContent = "Hide";
    return;
  }

  if (download.status === "ready") {
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "ready";
    const version = download.release?.version || latest?.version || "latest";
    updateTitle.textContent = `Update Ready: ${version}`;
    updateMessage.textContent = status.canInstall
      ? "Please restart Forge to update to the latest version."
      : "Update downloaded. Install/restart is available in the packaged Forge app, not source mode.";
    updateProgress.classList.remove("hidden");
    updateProgressFill.style.width = "100%";
    updatePrimaryButton.textContent = status.canInstall ? "Restart and Update" : "Open Release";
    updatePrimaryButton.dataset.action = status.canInstall ? "apply" : "open-release";
    updatePrimaryButton.dataset.url = download.release?.htmlUrl || status.releasePageUrl || "";
    updateSecondaryButton.textContent = "Later";
    return;
  }

  if (download.status === "error") {
    renderUpdateError(download.error || "Update failed.");
    return;
  }

  if (latest?.available) {
    updateBanner.classList.remove("hidden");
    updateBanner.dataset.state = "available";
    updateTitle.textContent = `Update Available: ${latest.version}`;
    updateMessage.textContent = latest.assetUrl
      ? (latest.name || "A new Neverwinter Forge release is ready to download.")
      : "A newer release exists, but no Forge ZIP asset is attached yet.";
    updatePrimaryButton.textContent = latest.assetUrl ? "Download Update" : "Open Release";
    updatePrimaryButton.dataset.action = latest.assetUrl ? "download" : "open-release";
    updatePrimaryButton.dataset.url = latest.htmlUrl || status.releasePageUrl || "";
    updateSecondaryButton.textContent = "Release Notes";
    updateSecondaryButton.dataset.action = "open-release";
    updateSecondaryButton.dataset.url = latest.htmlUrl || status.releasePageUrl || "";
  }
}

function renderUpdateError(message) {
  updateBanner.classList.remove("hidden");
  updateBanner.dataset.state = "error";
  updateTitle.textContent = "Forge Update";
  updateMessage.textContent = message;
  updateProgress.classList.add("hidden");
  updatePrimaryButton.classList.add("hidden");
  updateSecondaryButton.classList.remove("hidden");
  updateSecondaryButton.textContent = "Dismiss";
  updateSecondaryButton.dataset.action = "dismiss";
}

function startUpscalerPolling() {
  if (upscalerPollTimer) return;
  upscalerPollTimer = window.setInterval(async () => {
    const response = await fetch("/api/upscaler/status");
    const result = await response.json();
    renderUpscalerStatus(result);
    if (!result.active) {
      window.clearInterval(upscalerPollTimer);
      upscalerPollTimer = null;
    }
  }, 500);
}

function renderUpscalerStatus(status) {
  upscalerInstalled = Boolean(status.installed);
  downloadUpscalerButton.disabled = status.active || status.installed;
  downloadUpscalerButton.textContent = status.installed ? "Installed" : "Download Upscaler";
  upscalerStatusEl.textContent = status.message || (status.installed ? "Ready." : `Not installed. Download is about ${status.sizeMb || 17} MB.`);
  upscalerProgress.classList.toggle("hidden", !(status.active || status.status === "error"));
  upscalerProgressFill.style.width = `${status.percent || 0}%`;
  upscalerProgressText.textContent = `${status.percent || 0}% - ${formatMb(status.downloadedBytes || 0)} / ${formatMb(status.totalBytes || 0)}`;
  if (status.status === "error") {
    upscalerProgressText.textContent = status.error || "Download failed.";
  }
  updateUpscaleButtons();
}

function renderDepthStatus(status) {
  depthReady = Boolean(status.ready);
  const missingModels = status.missingModels || [];
  const missingNodes = status.missingNodes || [];
  const missingCount = missingModels.length + missingNodes.length;
  const checkedAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  depthStatusEl.textContent = `${status.message || "Depth workflow status unavailable."} Last checked ${checkedAt}.`;
  localToolStatus.textContent = status.ready
    ? "Depth / Normal Maps ready."
    : status.message || "Depth / Normal Maps unavailable.";
  depthDependencySummary.textContent = status.ready
    ? "Ready"
    : missingCount
      ? `${missingCount} missing`
      : status.installed
        ? "ComfyUI offline"
        : "Needs setup";
  dependencyDetails.dataset.state = status.ready ? "ready" : status.serverReachable ? "missing" : "offline";
  renderDepthSetupHint(status, missingCount);
  refreshDepthStatusButton.disabled = false;
  refreshDepthStatusButton.textContent = "Refresh";

  depthModelList.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "dependency-item";
  summary.dataset.installed = String(Boolean(status.installed));
  summary.innerHTML = `<strong>Workflow</strong><span>${status.installed ? "Installed" : "Needs setup"}</span>`;
  depthModelList.appendChild(summary);

  (missingNodes || []).forEach((node) => {
    const item = document.createElement("div");
    item.className = "dependency-item";
    item.dataset.installed = "false";
    item.title = node.path || "";
    item.innerHTML = `<strong>${node.folder}</strong><span>Missing node pack</span>`;
    depthModelList.appendChild(item);
  });

  (status.models || []).forEach((model) => {
    const item = document.createElement("div");
    item.className = "dependency-item";
    item.dataset.installed = String(Boolean(model.installed));
    item.title = model.path || "";
    item.innerHTML = `<strong>${model.name}</strong><span>${model.installed ? "Found" : `Missing - ${model.sizeGb} GB`}</span>`;
    depthModelList.appendChild(item);
  });

  updateDepthButtons();
}

function renderDepthChecking() {
  depthReady = false;
  depthStatusEl.textContent = "Checking ComfyUI workflow...";
  localToolStatus.textContent = "Checking Depth / Normal Maps...";
  depthDependencySummary.textContent = "Checking...";
  dependencyDetails.dataset.state = "offline";
  depthSetupHint.classList.add("hidden");
  refreshDepthStatusButton.disabled = true;
  refreshDepthStatusButton.textContent = "Checking...";
  updateDepthButtons();
}

function renderDepthSetupHint(status, missingCount) {
  if (status.ready) {
    depthSetupHint.classList.add("hidden");
    depthSetupHint.textContent = "";
    return;
  }

  if (!status.serverReachable && status.installed) {
    depthSetupHint.textContent = "ComfyUI dependencies are found, but ComfyUI is not running. Start ComfyUI, then click Refresh.";
  } else if (missingCount) {
    const modelRoot = status.modelsRoot ? ` Detected model root: ${status.modelsRoot}.` : "";
    const localFallback = status.usingAppLocalModels
      ? " If using this app-local fallback, add it to ComfyUI's extra_model_paths.yaml so ComfyUI can load the models."
      : "";
    depthSetupHint.textContent = `Missing ${missingCount} dependency item(s). Run install_depth_models.bat from the app folder or place the files in your detected ComfyUI model folders, then click Refresh.${modelRoot}${localFallback}`;
  } else {
    depthSetupHint.textContent = status.pathHelp || "Depth workflow setup is incomplete. Expand Model dependencies to see what needs attention.";
  }
  depthSetupHint.classList.remove("hidden");
}

function renderPresetButtons() {
  presetButtons.innerHTML = "";
  const groupedPresets = new Map();
  presets.filter((preset) => preset.kind !== "derived" && preset.id !== "open-prompt").forEach((preset) => {
    const group = getPresetGroup(preset);
    if (!groupedPresets.has(group)) groupedPresets.set(group, []);
    groupedPresets.get(group).push(preset);
  });

  groupedPresets.forEach((items, group) => {
    const section = document.createElement("section");
    section.className = "preset-group";
    section.dataset.group = group.toLowerCase().replace(/\s+/g, "-");

    const heading = document.createElement("h3");
    heading.textContent = group;
    section.appendChild(heading);

    items.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset-button";
      button.textContent = preset.name;
      button.dataset.active = String(preset.id === selectedPresetId);
      button.addEventListener("click", () => {
        activatePreset(preset.id, { promptMode: "preset-extra" });
      });
      section.appendChild(button);
    });

    presetButtons.appendChild(section);
  });

  const selected = presets.find((preset) => preset.id === selectedPresetId);
  presetDescription.textContent = selected ? selected.description : "No preset selected.";
  renderPresetReferences(selected);
  renderShieldShapePicker(selected);
  renderInputMode();
}

function renderPresetReferences(preset) {
  const examples = preset?.exampleImages || [];
  presetReferenceGrid.innerHTML = "";
  presetReferences.classList.toggle("hidden", examples.length === 0);
  if (!examples.length) return;

  examples.forEach((imagePath, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-reference-tile";
    button.title = `Reference ${index + 1}`;
    button.setAttribute("aria-label", `Preset reference ${index + 1}`);
    const image = document.createElement("img");
    image.src = presetAssetUrl(imagePath);
    image.alt = "";
    image.loading = "lazy";
    button.appendChild(image);
    if (isTextToImagePreset(preset)) {
      button.disabled = true;
    } else {
      button.addEventListener("click", () => loadPresetReferenceImage(imagePath, index + 1));
    }
    presetReferenceGrid.appendChild(button);
  });
}

async function loadPresetReferenceImage(imagePath, index) {
  try {
    const response = await fetch(presetAssetUrl(imagePath));
    if (!response.ok) throw new Error("Preset reference could not be loaded.");
    const blob = await response.blob();
    const extension = imagePath.split(".").pop() || "png";
    const file = new File([blob], `preset-reference-${index}.${extension}`, { type: blob.type || "image/png" });
    setImage(file);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function getShieldShapeGroups(preset) {
  const shapes = preset?.shapeReferenceImages || [];
  const groups = (preset?.shapeReferenceGroups || [])
    .map((group) => ({
      ...group,
      images: (group.images || []).filter((imagePath) => shapes.includes(imagePath))
    }))
    .filter((group) => group.images.length > 0);
  if (groups.length > 0) return groups;
  return shapes.length > 0 ? [{ id: "shield-shapes", name: "Shield Shapes", images: shapes }] : [];
}

function renderShieldShapePicker(preset) {
  const groups = getShieldShapeGroups(preset);
  const shapes = groups.flatMap((group) => group.images);
  const showPicker = isShieldPreset(preset) && shapes.length > 0;
  shieldShapePicker.classList.toggle("hidden", !showPicker);
  shieldShapeGrid.innerHTML = "";
  if (!showPicker) return;

  if (selectedShieldShapePath && !shapes.includes(selectedShieldShapePath)) {
    selectedShieldShapePath = "";
    localStorage.removeItem("neverwinterForge.shieldShapePath");
  }

  clearShieldShapeButton.dataset.active = String(!selectedShieldShapePath);
  clearShieldShapeButton.setAttribute("aria-pressed", String(!selectedShieldShapePath));
  const selectedIndex = selectedShieldShapePath ? shapes.indexOf(selectedShieldShapePath) : -1;
  const selectedGroup = groups.find((group) => group.images.includes(selectedShieldShapePath));
  shieldShapeStatus.textContent = selectedIndex >= 0
    ? `Selected ${selectedGroup?.name || "shield shape"} ${(selectedGroup?.images.indexOf(selectedShieldShapePath) ?? selectedIndex) + 1}${selectedGroup?.aspectRatio ? ` (${selectedGroup.aspectRatio})` : ""}`
    : "Random shape";

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "shield-shape-section";

    const header = document.createElement("div");
    header.className = "shield-shape-section-header";
    const title = document.createElement("h4");
    title.textContent = group.name || "Shield Shapes";
    header.appendChild(title);
    if (group.aspectRatio) {
      const ratio = document.createElement("span");
      ratio.textContent = `${group.aspectRatio} output`;
      header.appendChild(ratio);
    }
    section.appendChild(header);

    const groupGrid = document.createElement("div");
    groupGrid.className = "shield-shape-section-grid";
    group.images.forEach((imagePath, index) => {
      const isSelected = imagePath === selectedShieldShapePath;
      const label = `${group.name || "Shield shape"} ${index + 1}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shield-shape-tile";
      button.title = group.aspectRatio ? `${label} (${group.aspectRatio})` : label;
      button.dataset.active = String(isSelected);
      button.dataset.aspect = group.aspectRatio || "1:1";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(isSelected));

      const image = document.createElement("img");
      image.src = presetAssetUrl(imagePath);
      image.alt = "";
      image.loading = "lazy";
      button.appendChild(image);
      if (isSelected) {
        const badge = document.createElement("span");
        badge.className = "shield-shape-check";
        badge.textContent = "Selected";
        button.appendChild(badge);
      }

      button.addEventListener("click", () => {
        selectedShieldShapePath = imagePath;
        localStorage.setItem("neverwinterForge.shieldShapePath", selectedShieldShapePath);
        if (group.aspectRatio && basReliefAspectRatio.value !== group.aspectRatio) {
          basReliefAspectRatio.value = group.aspectRatio;
          localStorage.setItem("neverwinterForge.basReliefAspectRatio", group.aspectRatio);
          renderSessionCost();
        }
        renderShieldShapePicker(preset);
      });
      groupGrid.appendChild(button);
    });
    section.appendChild(groupGrid);
    shieldShapeGrid.appendChild(section);
  });
}

function activatePreset(presetId, options = {}) {
  const preset = presets.find((item) => item.id === presetId);
  if (!preset) return;

  selectedPresetId = preset.id;
  localStorage.setItem("neverwinterForge.presetId", selectedPresetId);
  if (options.promptMode) {
    promptModeField.value = options.promptMode;
    localStorage.setItem("neverwinterForge.promptMode", promptModeField.value);
  }
  applyPresetDefaults(preset);
  setProviderMode(getPresetProviderDefault(preset));
  applyRecommendedModel(preset);
  renderPresetButtons();
  renderInputMode();
  updateDerivedButtons();
  if (options.scrollToInput) {
    document.querySelector(".grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderSessionCost() {
  estimatedCostEl.textContent = formatUsd(getSelectedModelEstimate());
  sessionCostEl.textContent = formatUsd(sessionCostUsd);
  sessionCountEl.textContent = String(sessionPaidGenerations);
}

function getSelectedModelEstimate() {
  const mode = document.querySelector("input[name='mode']:checked").value;
  if (mode === "openai") {
    return Number(openaiPricing[openaiModelField.value]?.estimates?.[openaiSizeField.value]?.[openaiQualityField.value] || 0);
  }
  if (mode === "gemini") {
    return getGeminiEstimate();
  }
  return 0;
}

function getGeminiEstimate() {
  const modelPrice = pricing[modelField.value] || {};
  const size = geminiOutputSize.value;
  if (usesGeminiCanvasControls(getSelectedPreset()) && modelPrice.estimatesBySize?.[size] !== undefined) {
    return Number(modelPrice.estimatesBySize[size] || 0);
  }
  return Number(modelPrice.estimateUsd || 0);
}

function updateProviderSettings() {
  const mode = document.querySelector("input[name='mode']:checked").value;
  geminiSettings.classList.toggle("hidden", mode !== "gemini");
  openaiSettings.classList.toggle("hidden", mode !== "openai");
}

function setProviderMode(provider) {
  if (!provider) return;
  const radio = document.querySelector(`input[name='mode'][value='${provider}']`);
  if (radio) {
    radio.checked = true;
    updateProviderSettings();
    renderSessionCost();
  }
}

function getPresetProviderDefault(preset) {
  return isCreaturePreset(preset) ? "openai" : preset?.provider;
}

function applyPresetDefaults(preset) {
  if (!isCreaturePreset(preset)) return;
  if (!extremeSimplifyToggle.checked) {
    extremeSimplifyToggle.checked = true;
    localStorage.setItem("neverwinterForge.extremeSimplify", "true");
  }
}

function applyRecommendedModel(preset, announce = true) {
  if (!preset?.recommendedModel) return;

  if (preset.provider === "gemini" && modelField.value !== preset.recommendedModel) {
    modelField.value = preset.recommendedModel;
    localStorage.setItem("neverwinterForge.model", modelField.value);
    if (announce) setStatus(`${preset.name} works best with ${preset.recommendedModel}.`);
  }

  if (preset.provider === "openai" && openaiModelField.value !== preset.recommendedModel) {
    openaiModelField.value = preset.recommendedModel;
    localStorage.setItem("neverwinterForge.openaiModel", openaiModelField.value);
    if (announce) setStatus(`${preset.name} works best with ${preset.recommendedModel}.`);
  }

  renderSessionCost();
}

function formatUsd(value) {
  if (value < 0.01 && value > 0) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(3)}`;
}

function setGenerationDisabled(isDisabled) {
  const selected = getSelectedPreset();
  generateButton.disabled = isDisabled;
  const referenceImage = getFrontReferenceForSelectedPreset();
  generateBackViewButton.disabled = isDisabled || !referenceImage || (isColorGuidePreset(selected) && !colorGuideBackImage);
  generateThreeQuarterViewButton.disabled = isDisabled || !referenceImage || !getSecondViewPresetId();
}

function updateDerivedButtons() {
  const selected = getSelectedPreset();
  const referenceImage = getFrontReferenceForSelectedPreset();
  const derivedViews = selected?.derivedViews || [];
  const hasBackView = selectedPresetId === "miniature" || derivedViews.some((viewId) => viewId.endsWith("-back"));
  const secondViewPresetId = getSecondViewPresetId();
  const hasSecondView = Boolean(secondViewPresetId);
  const colorGuideMode = isColorGuidePreset(selected);

  viewActions.classList.toggle("hidden", !hasBackView && !hasSecondView);
  generateBackViewButton.textContent = colorGuideMode ? "Back Color Guide" : "Back View";
  generateThreeQuarterViewButton.textContent = secondViewPresetId?.endsWith("-side") ? "Side View" : "3/4 View";
  generateBackViewButton.disabled = !referenceImage || !hasBackView || (colorGuideMode && !colorGuideBackImage);
  generateBackViewButton.style.display = hasBackView ? "" : "none";
  generateThreeQuarterViewButton.disabled = !referenceImage || !hasSecondView;
  generateThreeQuarterViewButton.style.display = hasSecondView ? "" : "none";
  viewActions.classList.toggle("single-view", !hasSecondView);
}

function updateUpscaleButtons() {
  useCurrentOutputButton.disabled = !currentOutputImage;
  clearUpscalerButton.disabled = !upscaleInputImage && comparePanel.classList.contains("hidden");
  const disabled = !upscalerInstalled || !upscaleInputImage;
  upscale2xButton.disabled = disabled;
  upscale4xButton.disabled = disabled;
  updateDepthButtons();
}

function setUpscaleDisabled(isDisabled) {
  upscale2xButton.disabled = isDisabled || !upscalerInstalled || !upscaleInputImage;
  upscale4xButton.disabled = isDisabled || !upscalerInstalled || !upscaleInputImage;
  clearUpscalerButton.disabled = isDisabled || (!upscaleInputImage && comparePanel.classList.contains("hidden"));
}

function updateDepthButtons() {
  useCurrentForDepthButton.disabled = !currentOutputImage;
  generateDepthMapsButton.disabled = !depthReady || !depthInputImage;
}

function setDepthDisabled(isDisabled) {
  generateDepthMapsButton.disabled = isDisabled || !depthReady || !depthInputImage;
}

function showComparison(originalUrl, upscaledUrl, scale) {
  compareOriginal.src = originalUrl;
  compareUpscaled.src = upscaledUrl;
  saveUpscaledLink.href = upscaledUrl;
  saveUpscaledLink.download = `neverwinter-forge-upscaled-${scale}x.png`;
  showElement(comparePanel, "block");
}

function formatMb(bytes) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function buildPrompt() {
  const selected = getSelectedPreset();
  const presetPrompt = selected ? selected.prompt.trim() : "";
  const extraPrompt = extraPromptField.value.trim();
  const objectPrompt = objectPromptField.value.trim();
  const skinSurfacePrompt = getSkinSurfacePrompt(selected);
  const neckConnectorPrompt = getNeckConnectorPrompt(selected);
  const extremeSimplifyPrompt = getExtremeSimplifyPrompt(selected);
  const creatureTailPrompt = getCreatureTailPrompt(selected);
  if (isOpenPromptPreset(selected)) {
    const sizeRequest = buildGeminiCanvasSizeRequest(selected);
    const aspectRequest = buildGeminiCanvasAspectRequest(selected);
    if (promptModeField.value === "extra-override") {
      return [extraPrompt || objectPrompt, sizeRequest, aspectRequest].filter(Boolean).join("\n\n");
    }
    if (promptModeField.value === "preset-only") {
      return [objectPrompt, sizeRequest, aspectRequest].filter(Boolean).join("\n\n");
    }
    return [objectPrompt, extraPrompt, sizeRequest, aspectRequest].filter(Boolean).join("\n\n");
  }

  const objectRequest = (isTextToImagePreset(selected) || isImagePromptPreset(selected)) && objectPrompt
    ? `${selectedPresetId === "bas-relief-emblem-concept" ? "Bas-relief subject to generate" : isImagePromptPreset(selected) ? "Objects to extract and simplify" : "Object to generate"}:\n${objectPrompt}`
    : "";
  const sizeRequest = buildGeminiCanvasSizeRequest(selected);
  const aspectRequest = buildGeminiCanvasAspectRequest(selected);

  if (isImagePromptPreset(selected)) {
    return [presetPrompt, objectRequest, extremeSimplifyPrompt, sizeRequest, aspectRequest, extraPrompt].filter(Boolean).join("\n\n");
  }

  if (promptModeField.value === "extra-override") return [extraPrompt, objectRequest, skinSurfacePrompt, neckConnectorPrompt, extremeSimplifyPrompt, creatureTailPrompt, sizeRequest, aspectRequest].filter(Boolean).join("\n\n");
  if (promptModeField.value === "preset-only") return [presetPrompt, objectRequest, skinSurfacePrompt, neckConnectorPrompt, extremeSimplifyPrompt, creatureTailPrompt, sizeRequest, aspectRequest].filter(Boolean).join("\n\n");
  return [presetPrompt, objectRequest, skinSurfacePrompt, neckConnectorPrompt, extremeSimplifyPrompt, creatureTailPrompt, sizeRequest, aspectRequest, extraPrompt].filter(Boolean).join("\n\n");
}

function getBackViewPresetId() {
  const selected = getSelectedPreset();
  const backView = selected?.derivedViews?.find((viewId) => viewId.endsWith("-back"));
  if (backView) return backView;
  return "miniature-back";
}

function getSecondViewPresetId() {
  const selected = getSelectedPreset();
  const sideView = selected?.derivedViews?.find((viewId) => viewId.endsWith("-side"));
  if (sideView) return sideView;
  const threeQuarterView = selected?.derivedViews?.find((viewId) => viewId.endsWith("-three-quarter"));
  if (threeQuarterView) return threeQuarterView;
  if (selectedPresetId === "miniature") return "miniature-three-quarter";
  return "";
}

function getSelectedPreset() {
  return presets.find((preset) => preset.id === selectedPresetId);
}

function getPresetGroup(preset) {
  if (preset?.group) return preset.group;
  if (isCreaturePreset(preset)) return "Creatures";
  if (preset?.id?.startsWith("modular-")) return "Outfits";
  if (preset?.id === "miniature") return "Core";
  if (preset?.id === "object-concept") return "Objects";
  if (isBasReliefPreset(preset) || isShieldPreset(preset)) return "Emblems";
  return "Other";
}

function presetAssetUrl(imagePath) {
  return `/api/preset-asset?path=${encodeURIComponent(imagePath)}`;
}

function isTextToImagePreset(preset) {
  return preset?.kind === "text-to-image";
}

function isImagePromptPreset(preset) {
  return preset?.kind === "image-prompt" || preset?.id === SIMPLIFY_OBJECTS_PRESET_ID;
}

function isOpenPromptPreset(preset) {
  return preset?.id === "open-prompt";
}

function isBasReliefPreset(preset) {
  return preset?.id === "bas-relief-emblem" || preset?.id === "bas-relief-emblem-concept";
}

function isShieldPreset(preset) {
  return preset?.id === "shield-emblem" || preset?.id === "shield-emblem-back";
}

function isColorGuidePreset(preset) {
  return preset?.id === COLOR_GUIDE_PRESET_ID;
}

function isCreaturePreset(preset) {
  return preset?.id?.startsWith("creature-");
}

function getColorGuideFrontAdditionalImages(preset) {
  if (!isColorGuidePreset(preset) || !colorGuideBackImage) return [];
  return [cloneImageForPayload(colorGuideBackImage, "back-source")];
}

function cloneImageForPayload(image, fallbackName) {
  return {
    base64: image?.base64 || "",
    mimeType: image?.mimeType || "image/png",
    name: image?.name || fallbackName
  };
}

function getSelectedShieldShapeReference(generationPresetId = selectedPresetId) {
  const preset = presets.find((item) => item.id === generationPresetId);
  if (!isShieldPreset(preset) || !selectedShieldShapePath) return {};
  const shapePreset = preset.shapeReferenceImages?.length
    ? preset
    : presets.find((item) => item.id === "shield-emblem");
  if (!shapePreset?.shapeReferenceImages?.includes(selectedShieldShapePath)) return {};
  return { path: selectedShieldShapePath };
}

function usesGeminiCanvasControls(preset) {
  return isBasReliefPreset(preset) || isShieldPreset(preset) || isOpenPromptPreset(preset);
}

function usesSkinSurfaceControl(preset) {
  if (!preset) return false;
  return preset.id.startsWith("modular-outfit-")
    || preset.id.startsWith("modular-armored-outfit-")
    || preset.id.startsWith("modular-robe-dress-");
}

function usesNeckConnectorControl(preset) {
  return usesSkinSurfaceControl(preset);
}

function usesOutfitOptionControls(preset) {
  return usesSkinSurfaceControl(preset) || isCreaturePreset(preset) || isImagePromptPreset(preset);
}

function getOutfitOptionPreset(generationPresetId = selectedPresetId) {
  const selected = getSelectedPreset();
  if (selected?.id === generationPresetId || selected?.derivedViews?.includes(generationPresetId)) {
    return selected;
  }
  return presets.find((preset) => preset.id === generationPresetId);
}

function getSkinSurfacePrompt(preset) {
  if (!usesSkinSurfaceControl(preset) || !preserveSkinSurfaceField.checked) return "";
  if (preset.id.startsWith("modular-robe-dress-")) return ROBE_DRESS_SKIN_SURFACE_PROMPT;
  return SKIN_SURFACE_PROMPT;
}

function getNeckConnectorPrompt(preset) {
  if (!usesNeckConnectorControl(preset) || !createNeckConnectorToggle.checked) return "";
  return [NECK_CONNECTOR_PROMPT, NECK_CONNECTOR_STYLE_PROMPTS[neckConnectorStyleSelect.value] || ""].filter(Boolean).join("\n\n");
}

function getExtremeSimplifyPrompt(preset) {
  if (!usesOutfitOptionControls(preset) || !extremeSimplifyToggle.checked) return "";
  if (isImagePromptPreset(preset)) return OBJECT_EXTREME_SIMPLIFY_PROMPT;
  return EXTREME_SIMPLIFY_PROMPT;
}

function getCreatureTailPrompt(preset) {
  if (!isCreaturePreset(preset)) return "";
  return creatureHasTailField.checked ? CREATURE_TAIL_ENABLED_PROMPT : CREATURE_TAIL_DISABLED_PROMPT;
}

function validateCreaturePrompt(preset) {
  if (!isCreaturePreset(preset)) return true;
  if (extraPromptField.value.trim()) return true;
  setStatus("Describe the creature type in Misc / Extra Prompt first, such as: gnoll with hyena head, no tail; devilish scaled humanoid with ram horns; or lizardlike dog-leg creature, tail enabled.", true);
  extraPromptField.focus();
  return false;
}

function buildGeminiCanvasSizeRequest(preset) {
  if (!usesGeminiCanvasControls(preset)) return "";
  if (isShieldPreset(preset)) {
    return `Requested output size: ${geminiOutputSize.value}. Keep the full medieval fantasy shield visible inside the frame with a clean margin.`;
  }
  if (isBasReliefPreset(preset)) {
    return `Requested output size: ${geminiOutputSize.value}. Keep the full bas-relief plate visible within the frame.`;
  }
  return `Requested output size: ${geminiOutputSize.value}.`;
}

function buildGeminiCanvasAspectRequest(preset) {
  if (!usesGeminiCanvasControls(preset)) return "";
  if (isShieldPreset(preset)) {
    return `Requested aspect ratio: ${basReliefAspectRatio.value}. The output canvas must use ${basReliefAspectRatio.value}; do not preserve the input image aspect ratio if it differs. Compose one complete front-facing shield within the ${basReliefAspectRatio.value} canvas, with the motif filling the shield's inner face and the rim/bevel remaining separate.`;
  }
  if (isBasReliefPreset(preset)) {
    return `Requested aspect ratio: ${basReliefAspectRatio.value}. The output canvas must use ${basReliefAspectRatio.value}; do not preserve the input image aspect ratio if it differs. Compose the bas-relief as one complete ${getBasReliefAspectLabel()} plate with the full border visible.`;
  }
  return `Requested aspect ratio: ${basReliefAspectRatio.value}. The output canvas must use ${basReliefAspectRatio.value}; do not preserve an input image aspect ratio if it differs.`;
}

function getBasReliefAspectLabel() {
  if (basReliefAspectRatio.value === "1:1") return "square 1:1";
  if (basReliefAspectRatio.value === "9:16") return "tall vertical 9:16";
  if (basReliefAspectRatio.value === "4:3") return "landscape 4:3";
  if (basReliefAspectRatio.value === "16:9") return "wide landscape 16:9";
  return `vertical ${basReliefAspectRatio.value}`;
}

function getGenerateButtonLabel() {
  const selected = getSelectedPreset();
  if (isOpenPromptPreset(selected)) return "Generate Open Prompt";
  if (isColorGuidePreset(selected)) return "Front Color Guide";
  if (isImagePromptPreset(selected)) return "Simplify Objects";
  const isTextMode = isTextToImagePreset(selected);
  const isBasReliefConcept = selectedPresetId === "bas-relief-emblem-concept";
  return isBasReliefConcept ? "Generate Emblem" : isTextMode ? "Generate Object" : "Generate";
}

function renderInputMode() {
  const selected = getSelectedPreset();
  const isTextMode = isTextToImagePreset(selected);
  const isImagePromptMode = isImagePromptPreset(selected);
  const isOpenMode = isOpenPromptPreset(selected);
  const isBasReliefConcept = selectedPresetId === "bas-relief-emblem-concept";
  const isCreatureMode = isCreaturePreset(selected);
  const isColorGuideMode = isColorGuidePreset(selected);
  const showGeminiCanvasControls = usesGeminiCanvasControls(selected);
  const showOutfitOptionControls = usesOutfitOptionControls(selected);
  geminiOutputSizeField.classList.toggle("hidden", !showGeminiCanvasControls);
  basReliefAspectRatioField.classList.toggle("hidden", !showGeminiCanvasControls);
  skinSurfaceField.classList.toggle("hidden", !usesSkinSurfaceControl(selected));
  neckConnectorField.classList.toggle("hidden", !usesNeckConnectorControl(selected));
  neckConnectorStyleField.classList.toggle("hidden", !usesNeckConnectorControl(selected) || !createNeckConnectorToggle.checked);
  extremeSimplifyField.classList.toggle("hidden", !showOutfitOptionControls);
  extremeSimplifyLabel.textContent = isImagePromptMode ? "Extreme Simplify Objects" : "Extreme Simplify";
  creatureTailField.classList.toggle("hidden", !isCreatureMode);
  if ((isCreatureMode || isImagePromptMode) && promptModeField.value !== "preset-extra") {
    promptModeField.value = "preset-extra";
    localStorage.setItem("neverwinterForge.promptMode", promptModeField.value);
  }
  promptModeField.disabled = isCreatureMode || isImagePromptMode;
  extraPromptLabel.textContent = isCreatureMode ? "Creature Type / Extra Prompt" : "Misc / Extra Prompt";
  extraPromptField.placeholder = isCreatureMode
    ? "Required. Example: gnoll with hyena head and broad mane; no tail. Devilish scaled humanoid with ram horns. Or: lizardlike dog-leg creature with scaled hide; tail enabled."
    : "Optional extra instructions, or full override when selected above.";
  geminiOutputSizeLabel.textContent = isShieldPreset(selected) ? "Shield Output Size" : isBasReliefPreset(selected) ? "Bas-Relief Output Size" : "Gemini Output Size";
  geminiAspectRatioLabel.textContent = isShieldPreset(selected) ? "Shield Aspect Ratio" : isBasReliefPreset(selected) ? "Bas-Relief Aspect Ratio" : "Gemini Aspect Ratio";
  inputTitle.textContent = isOpenMode ? "Open Prompt" : isImagePromptMode ? "Simplify Objects" : isBasReliefConcept ? "Emblem Prompt" : isTextMode ? "Object Prompt" : isColorGuideMode ? "Front Source" : "Input";
  objectPromptLabel.textContent = isOpenMode ? "What would you like to generate?" : isImagePromptMode ? "What should Forge extract and simplify?" : isBasReliefConcept ? "What bas-relief emblem would you like to generate?" : "What object would you like to generate?";
  objectPromptField.placeholder = isOpenMode
    ? "Describe the image you want. Add an optional input image above for image-to-image."
    : isImagePromptMode
    ? "Example: extract the three hats; extract only the shield and sword; simplify the helmet and remove tiny filigree"
    : isBasReliefConcept
    ? "Example: ancient oak spirit mask, knightly sword and roses, dragon skull altar, elven moon priestess plaque"
    : "Example: ornate dwarven hammer, ancient spellbook, gothic lantern, sci-fi healing device";
  dropzone.classList.toggle("hidden", isTextMode && !isOpenMode && !isImagePromptMode);
  colorGuidePairPanel.classList.toggle("hidden", !isColorGuideMode);
  textInputPanel.classList.toggle("hidden", !isTextMode && !isOpenMode && !isImagePromptMode);
  dropzone.querySelector("span").textContent = isOpenMode ? "Optional image reference" : isImagePromptMode ? "Source image with object(s)" : isColorGuideMode ? "Front source image" : "Choose or drop an image";
  openPromptModeButton.dataset.active = String(isOpenMode);
  if (!generateButton.classList.contains("is-busy")) {
    generateButton.textContent = getGenerateButtonLabel();
  }
  frontReferenceImage = getFrontReferenceForSelectedPreset();
  updateDerivedButtons();
}

function getFrontReferenceForSelectedPreset() {
  return frontReferencesByPreset[selectedPresetId] || null;
}
