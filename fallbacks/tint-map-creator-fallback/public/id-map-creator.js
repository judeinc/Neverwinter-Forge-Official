const idMapDropzone = document.querySelector("#idMapDropzone");
const idMapMdbInput = document.querySelector("#idMapMdbInput");
const chooseIdMapMdbButton = document.querySelector("#chooseIdMapMdb");
const diffuseDropzone = document.querySelector("#diffuseDropzone");
const diffuseInput = document.querySelector("#diffuseInput");
const normalDropzone = document.querySelector("#normalDropzone");
const normalInput = document.querySelector("#normalInput");
const diffuseStatus = document.querySelector("#diffuseStatus");
const normalStatus = document.querySelector("#normalStatus");
const underlayMode = document.querySelector("#underlayMode");
const textureSize = document.querySelector("#textureSize");
const unusedPixels = document.querySelector("#unusedPixels");
const idMapPreviewView = document.querySelector("#idMapPreviewView");
const idMapNormalModeField = document.querySelector("#idMapNormalModeField");
const idMapNormalMode = document.querySelector("#idMapNormalMode");
const showUvWire = document.querySelector("#showUvWire");
const showIdOverlay = document.querySelector("#showIdOverlay");
const idMapSummary = document.querySelector("#idMapSummary");
const idMapCanvasWrap = document.querySelector("#idMapCanvasWrap");
const idMapCanvas = document.querySelector("#idMapCanvas");
const idMapEmpty = document.querySelector("#idMapEmpty");
const idMap3dWrap = document.querySelector("#idMap3dWrap");
const idMap3dCanvas = document.querySelector("#idMap3dCanvas");
const idMap3dEmpty = document.querySelector("#idMap3dEmpty");
const idPalette = document.querySelector("#idPalette");
const autoColorIslandsButton = document.querySelector("#autoColorIslands");
const clearSelectedIslandButton = document.querySelector("#clearSelectedIsland");
const clearIdMapButton = document.querySelector("#clearIdMap");
const undoIdMapButton = document.querySelector("#undoIdMap");
const redoIdMapButton = document.querySelector("#redoIdMap");
const exportIdMapButton = document.querySelector("#exportIdMap");
const selectedIslandInfo = document.querySelector("#selectedIslandInfo");
const idMapWorkflowMethod = document.querySelector("#idMapWorkflowMethod");
const idMapWorkflowNote = document.querySelector("#idMapWorkflowNote");
const tripoStagingPanel = document.querySelector("#tripoStagingPanel");
const tripoApiKey = document.querySelector("#tripoApiKey");
const checkTripoKeyButton = document.querySelector("#checkTripoKey");
const tripoModelTaskId = document.querySelector("#tripoModelTaskId");
const tripoSegmentModel = document.querySelector("#tripoSegmentModel");
const tripoTextureModel = document.querySelector("#tripoTextureModel");
const tripoTextureQuality = document.querySelector("#tripoTextureQuality");
const tripoPromptRecipe = document.querySelector("#tripoPromptRecipe");
const buildTripoPromptButton = document.querySelector("#buildTripoPrompt");
const tripoZoneChecklist = document.querySelector("#tripoZoneChecklist");
const tripoTexturePrompt = document.querySelector("#tripoTexturePrompt");
const tripoFrontReferenceDropzone = document.querySelector("#tripoFrontReferenceDropzone");
const tripoBackReferenceDropzone = document.querySelector("#tripoBackReferenceDropzone");
const tripoFrontReferenceInput = document.querySelector("#tripoFrontReferenceInput");
const tripoBackReferenceInput = document.querySelector("#tripoBackReferenceInput");
const tripoSegmentOverrides = document.querySelector("#tripoSegmentOverrides");
const tripoTextureOverrides = document.querySelector("#tripoTextureOverrides");
const importTripoModelButton = document.querySelector("#importTripoModel");
const segmentTripoModelButton = document.querySelector("#segmentTripoModel");
const textureTripoModelButton = document.querySelector("#textureTripoModel");
const refreshTripoTaskButton = document.querySelector("#refreshTripoTask");
const saveTripoResultButton = document.querySelector("#saveTripoResult");
const tripoStatus = document.querySelector("#tripoStatus");
const tripoTaskList = document.querySelector("#tripoTaskList");
const tripoAssetGallery = document.querySelector("#tripoAssetGallery");
const tripoResult = document.querySelector("#tripoResult");
const localAiPrepassPanel = document.querySelector("#localAiPrepassPanel");
const localBlenderPanel = document.querySelector("#localBlenderPanel");
const idMapOpenaiApiKey = document.querySelector("#idMapOpenaiApiKey");
const idMapOpenaiModel = document.querySelector("#idMapOpenaiModel");
const idMapOpenaiQuality = document.querySelector("#idMapOpenaiQuality");
const suggestIdMapButton = document.querySelector("#suggestIdMap");
const copyAiPromptButton = document.querySelector("#copyAiPrompt");
const aiPromptStatus = document.querySelector("#aiPromptStatus");
const blenderPathInput = document.querySelector("#blenderPath");
const chunkVisionModelInput = document.querySelector("#chunkVisionModel");
const blenderChunkStrategy = document.querySelector("#blenderChunkStrategy");
const checkBlenderButton = document.querySelector("#checkBlender");
const runBlenderBakeButton = document.querySelector("#runBlenderBake");
const analyzeBlenderChunksButton = document.querySelector("#analyzeBlenderChunks");
const applyChunkLabelsButton = document.querySelector("#applyChunkLabels");
const blenderStatus = document.querySelector("#blenderStatus");
const blenderResultGallery = document.querySelector("#blenderResultGallery");
const chunkAnalysisResults = document.querySelector("#chunkAnalysisResults");
const islandList = document.querySelector("#islandList");
const idMapStatus = document.querySelector("#idMapStatus");

const ctx = idMapCanvas.getContext("2d");
const ID_COLORS = [
  "#ff0000", "#00ff00", "#0000ff", "#ffff00",
  "#ff00ff", "#00ffff", "#ff8000", "#8000ff",
  "#00a0ff", "#80ff00", "#ff0080", "#ffffff",
  "#808080", "#800000", "#008000", "#000080"
];
const MODEL_FILE_PATTERN = /\.(mdb|obj|fbx|zip)$/i;
const OLD_TRIPO_TEXTURE_PROMPT = [
  "Create a clean experimental texture pass for material and tint-map segmentation.",
  "Use broad readable color/material zones for the visible garment parts: tunic/top, sleeves, robe or pants lower, boots, gloves/bracers, belts/sashes, straps, armor/metal, leather panels, trim/accent, and large accessories.",
  "Avoid tiny noisy details. Preserve seams, hems, cuffs, boot tops, belt borders, and major object boundaries so the result can help build a clean NWN2 ID/tint map."
].join(" ");
const TRIPO_ID_MAP_TEXTURE_PROMPT = [
  "Create a flat color segmentation mask on the 3D garment model.",
  "This is not a realistic clothing texture, not a material render, not PBR, and not concept art.",
  "Paint each large visible garment object with one uniform solid hex color from the requested color list.",
  "Use hard edges at real object boundaries: cuffs, hems, boot tops, glove ends, belts, straps, collar edges, armor plates, and trim borders.",
  "Do not add fabric weave, leather grain, metal shine, dirt, shadows, highlights, gradients, wrinkles, embroidery, decals, symbols, or decorative patterns.",
  "Do not split one object into many colors because of UV seams or small folds.",
  "Tiny details can stay black or merge into the nearest large object color.",
  "The result should look like a clean computer-vision part mask: bright flat colors, crisp boundaries, no blended colors.",
  "Use the exact requested hex values only; do not choose similar colors or invent a palette."
].join(" ");
const TRIPO_ZONE_OPTIONS = [
  { id: "upper_garment", label: "Upper garment", color: "red", hex: "#FF0000", description: "main torso tunic, shirt, vest, chest cloth" },
  { id: "sleeves", label: "Sleeves", color: "blue", hex: "#0000FF", description: "left and right sleeve cloth, same color on both arms" },
  { id: "lower_garment", label: "Lower garment", color: "gray", hex: "#808080", description: "robe skirt, pants, lower hanging cloth panels" },
  { id: "boots", label: "Boots", color: "navy blue", hex: "#000080", description: "both boots and boot cuffs" },
  { id: "gloves_bracers", label: "Gloves / bracers", color: "cyan", hex: "#00FFFF", description: "gloves, wrist wraps, bracers, forearm guards" },
  { id: "belt_sash", label: "Belt / sash", color: "maroon", hex: "#800000", description: "waist belt, sash, buckle base, large waist wrap" },
  { id: "straps", label: "Straps", color: "orange", hex: "#FF8000", description: "diagonal straps, hanging strips, narrow leather bands" },
  { id: "collar_neck", label: "Collar / neck trim", color: "purple", hex: "#8000FF", description: "collar ring, neckline trim, neck cloth border" },
  { id: "armor_metal", label: "Armor / metal", color: "white", hex: "#FFFFFF", description: "metal plates, buckles, clasps, hard armor pieces" },
  { id: "trim_accent", label: "Trim / accent", color: "yellow", hex: "#FFFF00", description: "large readable trim borders and accent bands" },
  { id: "skin_body", label: "Skin / body gaps", color: "magenta", hex: "#FF00FF", description: "visible mannequin body or skin-like exposed areas" }
];
const CHUNK_CONFIDENCE_CUTOFF = 0.45;
const CHUNK_LABEL_OPTIONS = [
  { value: "tunic_top", label: "Tunic / Top", color: "#ff0000" },
  { value: "sleeves", label: "Sleeves", color: "#0000ff" },
  { value: "pants_or_robe_lower", label: "Pants / Robe Lower", color: "#808080" },
  { value: "boots", label: "Boots", color: "#000080" },
  { value: "gloves_or_bracers", label: "Gloves / Bracers", color: "#00a0ff" },
  { value: "belt_or_sash", label: "Belt / Sash", color: "#800000" },
  { value: "straps", label: "Straps", color: "#ff8000" },
  { value: "armor_or_metal", label: "Armor / Metal", color: "#ffffff" },
  { value: "leather_panels", label: "Leather Panels", color: "#008000" },
  { value: "trim_or_accent", label: "Trim / Accent", color: "#8000ff" },
  { value: "skin_or_body", label: "Skin / Body", color: "#ff0080" },
  { value: "uncertain", label: "Uncertain / Black", color: "#000000" },
  { value: "ignore_tiny_detail", label: "Ignore Tiny Detail", color: "#000000" }
];
const CHUNK_LABEL_BY_VALUE = new Map(CHUNK_LABEL_OPTIONS.map((item) => [item.value, item]));

let layout = null;
let trianglesById = new Map();
let islandsById = new Map();
let islandColors = new Map();
let selectedColor = ID_COLORS[0];
let selectedIslandId = "";
let diffuseImage = null;
let normalImage = null;
let undoStack = [];
let redoStack = [];
let aiPrepassPrompt = "";
let aiSuggestionBusy = false;
let currentModelFile = null;
let diffuseTextureFile = null;
let normalTextureFile = null;
let blenderBusy = false;
let blenderAvailable = false;
let tripoCheckBusy = false;
let tripoBusyAction = "";
let tripoTasks = { model: "", segment: "", texture: "", latest: "" };
let tripoPollTimer = 0;
let lastTripoResult = null;
let tripoReferenceImages = { front: null, back: null };
let chunkAnalysisBusy = false;
let applyChunkLabelsBusy = false;
let lastBlenderResult = null;
let lastChunkAnalysis = null;
let idMap3dViewer = null;
let diffuseTextureUrl = "";

restoreAiSettings();
restoreWorkflowSettings();
restoreBlenderSettings();
restorePreviewSettings();
bindControls();
renderPalette();
renderTripoZoneChecklist();
loadAiPrepassPrompt();
drawCanvas();
renderState();

function bindControls() {
  chooseIdMapMdbButton.addEventListener("click", () => idMapMdbInput.click());
  idMapDropzone.addEventListener("click", (event) => {
    if (event.target === chooseIdMapMdbButton) return;
    idMapMdbInput.click();
  });
  idMapDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      idMapMdbInput.click();
    }
  });
  idMapMdbInput.addEventListener("change", () => {
    if (idMapMdbInput.files[0]) extractUvLayout(idMapMdbInput.files[0]);
  });
  bindModelDropTarget(idMapDropzone);
  bindModelDropTarget(idMapCanvasWrap);
  bindModelDropTarget(idMap3dWrap);
  document.addEventListener("dragover", preventBrowserFileOpen);
  document.addEventListener("drop", preventBrowserFileOpen);

  bindTextureDropzone(diffuseDropzone, diffuseInput, "diffuse");
  bindTextureDropzone(normalDropzone, normalInput, "normal");
  bindTripoReferenceDropzone("front", tripoFrontReferenceDropzone, tripoFrontReferenceInput);
  bindTripoReferenceDropzone("back", tripoBackReferenceDropzone, tripoBackReferenceInput);
  underlayMode.addEventListener("change", drawCanvas);
  textureSize.addEventListener("change", () => {
    resizeCanvas();
    drawCanvas();
  });
  unusedPixels.addEventListener("change", drawCanvas);
  idMapPreviewView.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.idMapPreviewView", idMapPreviewView.value);
    renderState();
    renderModelPreview3d();
  });
  idMapNormalMode.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.idMapNormalMode", idMapNormalMode.value);
    renderModelPreview3d();
  });
  showUvWire.addEventListener("change", drawCanvas);
  showIdOverlay.addEventListener("change", drawCanvas);
  idMapCanvas.addEventListener("click", handleCanvasClick);
  idMap3dCanvas.addEventListener("dblclick", resetIdMapPreviewCamera);
  idMap3dCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

  autoColorIslandsButton.addEventListener("click", autoColorIslands);
  clearSelectedIslandButton.addEventListener("click", clearSelectedIsland);
  clearIdMapButton.addEventListener("click", clearMap);
  undoIdMapButton.addEventListener("click", undoIdMap);
  redoIdMapButton.addEventListener("click", redoIdMap);
  exportIdMapButton.addEventListener("click", exportIdMap);
  idMapWorkflowMethod.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.idMapWorkflowMethod", idMapWorkflowMethod.value);
    renderState();
  });
  tripoApiKey.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.tripoApiKey", tripoApiKey.value);
    renderState();
  });
  tripoModelTaskId.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.tripoModelTaskId", tripoModelTaskId.value.trim());
    tripoTasks.model = tripoModelTaskId.value.trim();
    renderTripoTasks();
    renderState();
  });
  tripoSegmentModel.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.tripoSegmentModel", tripoSegmentModel.value);
  });
  tripoTextureModel.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.tripoTextureModel", tripoTextureModel.value);
  });
  tripoTextureQuality.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.tripoTextureQuality", tripoTextureQuality.value);
  });
  tripoPromptRecipe.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.tripoPromptRecipe", tripoPromptRecipe.value);
    buildTripoPromptFromControls();
  });
  buildTripoPromptButton.addEventListener("click", buildTripoPromptFromControls);
  tripoTexturePrompt.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.tripoTexturePrompt", tripoTexturePrompt.value);
  });
  tripoSegmentOverrides.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.tripoSegmentOverrides", tripoSegmentOverrides.value);
  });
  tripoTextureOverrides.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.tripoTextureOverrides", tripoTextureOverrides.value);
  });
  checkTripoKeyButton.addEventListener("click", checkTripoKey);
  importTripoModelButton.addEventListener("click", importTripoModel);
  segmentTripoModelButton.addEventListener("click", segmentTripoModel);
  textureTripoModelButton.addEventListener("click", textureTripoModel);
  refreshTripoTaskButton.addEventListener("click", refreshTripoTask);
  saveTripoResultButton.addEventListener("click", saveTripoResult);
  suggestIdMapButton.addEventListener("click", runAiRegionSuggestion);
  copyAiPromptButton.addEventListener("click", copyAiPrepassPrompt);
  checkBlenderButton.addEventListener("click", checkBlenderSetup);
  runBlenderBakeButton.addEventListener("click", runBlenderBake);
  analyzeBlenderChunksButton.addEventListener("click", analyzeBlenderChunks);
  applyChunkLabelsButton.addEventListener("click", applyChunkLabels);
  idMapOpenaiApiKey.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.openaiApiKey", idMapOpenaiApiKey.value);
    renderState();
  });
  idMapOpenaiModel.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.openaiModel", idMapOpenaiModel.value);
  });
  idMapOpenaiQuality.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.openaiQuality", idMapOpenaiQuality.value);
  });
  blenderPathInput.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.blenderPath", blenderPathInput.value);
    blenderAvailable = false;
    renderState();
  });
  chunkVisionModelInput.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.chunkVisionModel", chunkVisionModelInput.value);
  });
  blenderChunkStrategy.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.blenderChunkStrategy", blenderChunkStrategy.value);
  });
}

async function checkTripoKey() {
  if (!tripoApiKey.value.trim()) {
    setTripoStatus("Enter a Tripo API key first.", true);
    return;
  }
  tripoCheckBusy = true;
  renderState();
  setTripoStatus("Checking Tripo API key...");
  try {
    const response = await fetch("/api/idmap/tripo/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripoApiKey: tripoApiKey.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Tripo key check failed.");
    const balance = result.balance ?? "unknown";
    const frozen = result.frozen ?? "unknown";
    setTripoStatus(`Tripo key works. Balance: ${balance}. Frozen: ${frozen}.`);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    tripoCheckBusy = false;
    renderState();
  }
}

async function importTripoModel() {
  if (!tripoApiKey.value.trim()) {
    setTripoStatus("Enter a Tripo API key first.", true);
    return;
  }
  if (!currentModelFile) {
    setTripoStatus("Load an OBJ, FBX, GLB, or STL model before importing to Tripo.", true);
    return;
  }
  tripoBusyAction = "import";
  renderState();
  setTripoStatus("Uploading and importing model to Tripo...");
  try {
    const form = new FormData();
    form.append("tripoApiKey", tripoApiKey.value.trim());
    form.append("files", currentModelFile, currentModelFile.name);
    form.append("options", JSON.stringify({}));
    const response = await fetch("/api/idmap/tripo/import", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Tripo model import failed.");
    rememberTripoTask("model", result);
    showTripoResult(result);
    setTripoStatus(`Import submitted. Model task: ${tripoTasks.model || "unknown"}.`);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    tripoBusyAction = "";
    renderState();
  }
}

async function segmentTripoModel() {
  const modelTaskId = currentTripoModelTaskId();
  if (!modelTaskId) {
    setTripoStatus("Import a model or paste a Tripo model task id before segmenting.", true);
    return;
  }
  const payload = {
    type: "mesh_segmentation",
    original_model_task_id: modelTaskId
  };
  if (tripoSegmentModel.value) payload.model_version = tripoSegmentModel.value;
  await submitTripoTask("segment", payload, tripoSegmentOverrides.value, "Submitting mesh segmentation task...");
}

async function textureTripoModel() {
  const modelTaskId = currentTripoModelTaskId();
  if (!modelTaskId) {
    setTripoStatus("Import a model or paste a Tripo model task id before texturing.", true);
    return;
  }
  const prompt = tripoTexturePrompt.value.trim() || TRIPO_ID_MAP_TEXTURE_PROMPT;
  const flatMaskMode = (tripoPromptRecipe.value || "flat-id-mask") === "flat-id-mask";
  const textureReferenceImages = selectedTripoReferenceImages();
  const payload = {
    type: "texture_model",
    original_model_task_id: modelTaskId,
    texture_quality: tripoTextureQuality.value || "standard",
    texture: true,
    pbr: !flatMaskMode,
    texture_alignment: "geometry"
  };
  if (textureReferenceImages.length) {
    payload.texture_prompt = {};
  } else {
    payload.texture_prompt = { text: prompt };
  }
  if (tripoTextureModel.value) payload.model_version = tripoTextureModel.value;
  await submitTripoTask("texture", payload, tripoTextureOverrides.value, textureReferenceImages.length ? "Uploading front/back references and submitting texture task..." : "Submitting texture task...", textureReferenceImages);
}

function selectedTripoReferenceImages() {
  return [tripoReferenceImages.front, tripoReferenceImages.back].filter((image) => image?.imageData);
}

async function submitTripoTask(kind, basePayload, overridesText, busyMessage, textureReferenceImages = []) {
  if (!tripoApiKey.value.trim()) {
    setTripoStatus("Enter a Tripo API key first.", true);
    return;
  }
  tripoBusyAction = kind;
  renderState();
  setTripoStatus(busyMessage);
  try {
    const payload = mergeTripoOverrides(basePayload, overridesText);
    const response = await fetch("/api/idmap/tripo/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripoApiKey: tripoApiKey.value.trim(), payload, textureReferenceImages })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Tripo task failed.");
    rememberTripoTask(kind, result);
    showTripoResult(result);
    const taskId = tripoTasks[kind] || extractTripoTaskId(result);
    setTripoStatus(`${kind === "segment" ? "Segmentation" : "Texture"} task submitted: ${taskId || "unknown"}. Polling for result...`);
    if (taskId) scheduleTripoTaskPoll(taskId);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    tripoBusyAction = "";
    renderState();
  }
}

async function refreshTripoTask() {
  if (!tripoApiKey.value.trim()) {
    setTripoStatus("Enter a Tripo API key first.", true);
    return;
  }
  const taskId = tripoTasks.latest || tripoTasks.texture || tripoTasks.segment || currentTripoModelTaskId();
  if (!taskId) {
    setTripoStatus("No Tripo task id is available yet.", true);
    return;
  }
  tripoBusyAction = "refresh";
  renderState();
  setTripoStatus(`Refreshing Tripo task ${taskId}...`);
  try {
    const response = await fetch("/api/idmap/tripo/task-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripoApiKey: tripoApiKey.value.trim(), taskId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not refresh Tripo task.");
    rememberTripoTask("latest", result);
    showTripoResult(result);
    setTripoStatus(taskStatusMessage(result, taskId));
    const status = tripoTaskStatus(result);
    if (status && !["success", "failed", "cancelled", "canceled"].includes(status)) scheduleTripoTaskPoll(taskId);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    tripoBusyAction = "";
    renderState();
  }
}

async function saveTripoResult() {
  const result = currentTripoResult();
  if (!result) {
    setTripoStatus("No completed Tripo result is available to save yet.", true);
    return;
  }
  tripoBusyAction = "save";
  renderState();
  setTripoStatus("Saving Tripo result to local Forge outputs...");
  try {
    const response = await fetch("/api/idmap/tripo/save-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result })
    });
    const saved = await response.json();
    if (!response.ok) throw new Error(saved.error || "Could not save Tripo result.");
    renderSavedTripoAssets(saved);
    setTripoStatus(`Saved Tripo result to ${saved.outputDir}.`);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    tripoBusyAction = "";
    renderState();
  }
}

function currentTripoResult() {
  if (lastTripoResult) return lastTripoResult;
  const raw = tripoResult.textContent.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeTripoOverrides(basePayload, overridesText) {
  const overrides = parseTripoOverrides(overridesText);
  return deepMergeTripoPayload(structuredClone(basePayload), overrides);
}

function parseTripoOverrides(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tripo override JSON must be an object.");
  }
  return parsed;
}

function deepMergeTripoPayload(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
      target[key] = deepMergeTripoPayload({ ...target[key] }, value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

function renderTripoZoneChecklist() {
  if (!tripoZoneChecklist) return;
  tripoZoneChecklist.textContent = "";
  const selected = restoredTripoZones();
  TRIPO_ZONE_OPTIONS.forEach((zone) => {
    const label = document.createElement("label");
    label.className = "tripo-zone-item";
    label.innerHTML = `
      <input type="checkbox" value="${zone.id}" ${selected.has(zone.id) ? "checked" : ""}>
      <span class="tripo-zone-swatch" style="background:${zoneColorHex(zone.color)}"></span>
      <span>${zone.label}</span>
    `;
    label.querySelector("input").addEventListener("change", () => {
      localStorage.setItem("neverwinterForge.tripoZones", JSON.stringify(selectedTripoZoneIds()));
      buildTripoPromptFromControls();
    });
    tripoZoneChecklist.appendChild(label);
  });
}

function restoredTripoZones() {
  try {
    const stored = JSON.parse(localStorage.getItem("neverwinterForge.tripoZones") || "null");
    if (Array.isArray(stored) && stored.length) return new Set(stored);
  } catch {
    // Keep defaults when saved data is invalid.
  }
  return new Set(TRIPO_ZONE_OPTIONS.map((zone) => zone.id).filter((id) => id !== "skin_body"));
}

function selectedTripoZoneIds() {
  return Array.from(tripoZoneChecklist.querySelectorAll("input:checked")).map((input) => input.value);
}

function selectedTripoZones() {
  const selected = new Set(selectedTripoZoneIds());
  return TRIPO_ZONE_OPTIONS.filter((zone) => selected.has(zone.id));
}

function buildTripoPromptFromControls() {
  const zones = selectedTripoZones();
  const recipe = tripoPromptRecipe.value || "flat-id-mask";
  const prompt = buildTripoPromptText(recipe, zones);
  tripoTexturePrompt.value = prompt;
  localStorage.setItem("neverwinterForge.tripoPromptRecipe", recipe);
  localStorage.setItem("neverwinterForge.tripoTexturePrompt", prompt);
  localStorage.setItem("neverwinterForge.tripoZones", JSON.stringify(zones.map((zone) => zone.id)));
  setTripoStatus("Texture prompt rebuilt from selected zones.");
}

function buildTripoPromptText(recipe, zones) {
  const zoneLines = zones.map((zone) => `${zone.hex} ${zone.color}: ${zone.description}`).join("; ");
  if (recipe === "material-blockout") {
    return [
      "Create a simple material blockout texture on the 3D garment model.",
      "Use broad, readable color groups for major garment objects, with very little surface detail.",
      "Keep colors matte and mostly flat, but light natural shading is acceptable.",
      `Separate these target zones: ${zoneLines}.`,
      "Avoid ornate patterns, symbols, dirt, scratches, fabric weave, and tiny decorative details.",
      "Preserve clear boundaries at cuffs, hems, boot tops, glove ends, belts, straps, collars, armor plates, and trim borders."
    ].join(" ");
  }
  if (recipe === "review-texture") {
    return [
      "Create a clean readable preview texture on the 3D garment model.",
      "Use simple matte materials and strong color separation so the large clothing parts are easy to inspect.",
      `Make these areas visually distinct: ${zoneLines}.`,
      "Avoid noisy detail, ornate patterns, logos, dirt, scratches, and high-frequency texture.",
      "Keep seams, cuffs, hems, boot tops, belts, straps, collars, and trim borders easy to see."
    ].join(" ");
  }
  return [
    TRIPO_ID_MAP_TEXTURE_PROMPT,
    `Use only these flat color assignments: ${zoneLines}.`,
    "Every selected zone should be one clear solid color across the whole matching object.",
    "Use base color / albedo only. Do not create normal, roughness, metallic, specular, or lighting information.",
    "If exact hex colors are not possible, choose the nearest pure RGB value from the listed hex colors and keep every pixel in that region one color.",
    "Use black only for tiny uncertain details or areas that should be ignored."
  ].join(" ");
}

function zoneColorHex(color) {
  const colors = {
    red: "#ff0000",
    blue: "#0000ff",
    gray: "#808080",
    "navy blue": "#000080",
    cyan: "#00ffff",
    maroon: "#800000",
    orange: "#ff8000",
    purple: "#8000ff",
    white: "#ffffff",
    yellow: "#ffff00",
    magenta: "#ff00ff"
  };
  return colors[color] || "#808080";
}

function rememberTripoTask(kind, result) {
  const taskId = extractTripoTaskId(result);
  if (taskId) {
    tripoTasks[kind] = taskId;
    tripoTasks.latest = taskId;
    if (kind === "model") {
      tripoModelTaskId.value = taskId;
      localStorage.setItem("neverwinterForge.tripoModelTaskId", taskId);
    }
    localStorage.setItem("neverwinterForge.tripoTasks", JSON.stringify(tripoTasks));
  }
  renderTripoTasks();
}

function extractTripoTaskId(result) {
  const data = result?.data || result?.raw?.data || result?.raw || result || {};
  if (typeof data === "string") return data;
  return data.task_id || data.taskId || data.id || result?.task_id || result?.taskId || "";
}

function currentTripoModelTaskId() {
  return tripoModelTaskId.value.trim() || tripoTasks.model || "";
}

function taskStatusMessage(result, taskId) {
  const data = result?.data || result?.raw?.data || result?.raw || result || {};
  const status = tripoTaskStatus(result);
  const progress = data.progress ?? data.percent ?? "";
  const suffix = progress !== "" ? ` (${progress}%)` : "";
  if (status === "success") {
    const credits = data.consumed_credit ?? "";
    return `Task ${taskId}: success${suffix}.${credits !== "" ? ` Consumed ${credits} credits.` : ""}`;
  }
  return status ? `Task ${taskId}: ${status}${suffix}.` : `Task ${taskId} refreshed.`;
}

function tripoTaskStatus(result) {
  const data = result?.data || result?.raw?.data || result?.raw || result || {};
  return String(data.status || data.task_status || data.state || "").toLowerCase();
}

function showTripoResult(result) {
  lastTripoResult = result;
  tripoResult.hidden = false;
  tripoResult.textContent = JSON.stringify(result, null, 2);
  renderTripoAssets(result);
}

function renderTripoAssets(result) {
  if (!tripoAssetGallery) return;
  tripoAssetGallery.textContent = "";
  const assets = extractTripoAssets(result);
  assets.forEach((asset) => {
    const card = document.createElement("div");
    card.className = "tripo-asset-card";
    if (asset.kind === "image") {
      const image = document.createElement("img");
      image.src = asset.url;
      image.alt = asset.label;
      card.appendChild(image);
    }
    const label = document.createElement("span");
    label.textContent = asset.label;
    card.appendChild(label);
    const actions = document.createElement("div");
    actions.className = "tripo-asset-actions";
    actions.appendChild(tripoAssetLink("Open", asset.url));
    if (asset.kind === "model") {
      const preview = document.createElement("button");
      preview.type = "button";
      preview.textContent = /^https?:\/\/tripo-data\./i.test(asset.url) ? "Save + Preview" : "Preview";
      preview.addEventListener("click", () => previewTripoAsset(asset.url, asset.label));
      actions.appendChild(preview);
    }
    card.appendChild(actions);
    tripoAssetGallery.appendChild(card);
  });
}

function extractTripoAssets(result) {
  const data = result?.data || result?.raw?.data || result?.raw || result || {};
  const output = data.output || {};
  const nestedResult = data.result || {};
  const assets = [];
  const renderedUrl = output.rendered_image || data.thumbnail || nestedResult.rendered_image?.url;
  const modelUrl = output.model || nestedResult.model?.url || data.model_url;
  if (renderedUrl) assets.push({ label: "Rendered Preview", url: renderedUrl, kind: "image" });
  if (modelUrl) assets.push({ label: "Download GLB", url: modelUrl, kind: "model" });
  return assets;
}

function renderSavedTripoAssets(saved) {
  if (!tripoAssetGallery) return;
  tripoAssetGallery.textContent = "";
  (saved.assets || []).forEach((asset) => {
    const card = document.createElement("div");
    card.className = "tripo-asset-card";
    const isImage = /^image\//.test(asset.mimeType || "") || /\.(webp|png|jpe?g)$/i.test(asset.name || "");
    const isModel = /\.(glb|gltf)$/i.test(asset.name || "");
    if (isImage) {
      const image = document.createElement("img");
      image.src = asset.url;
      image.alt = asset.name || "Tripo preview";
      card.appendChild(image);
    }
    const label = document.createElement("span");
    label.textContent = asset.name || "Saved Asset";
    card.appendChild(label);
    const actions = document.createElement("div");
    actions.className = "tripo-asset-actions";
    actions.appendChild(tripoAssetLink("Open", asset.url));
    if (isModel) {
      const preview = document.createElement("button");
      preview.type = "button";
      preview.textContent = "Preview";
      preview.addEventListener("click", () => previewTripoAsset(asset.url, asset.name || "Saved GLB"));
      actions.appendChild(preview);
    }
    card.appendChild(actions);
    tripoAssetGallery.appendChild(card);
  });
}

function tripoAssetLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

async function previewTripoGlb(url, label) {
  idMapPreviewView.value = "3d";
  localStorage.setItem("neverwinterForge.idMapPreviewView", "3d");
  renderPreviewMode();
  if (!window.BABYLON?.SceneLoader?.ImportMeshAsync) {
    setModelPreviewMessage("GLB preview needs the Babylon GLTF loader. The file is saved; use Open for now.");
    setTripoStatus("GLB preview loader is not available in this Forge build. The saved GLB can still be opened externally.", true);
    return;
  }
  try {
    setModelPreviewMessage(`Loading ${label || "Tripo GLB"}...`);
    await renderBabylonGlbPreview(url);
    setModelPreviewMessage(`${label || "Tripo GLB"} loaded in 3D view.`);
  } catch (error) {
    setModelPreviewMessage(error.message || "Could not preview this GLB.");
    setTripoStatus(error.message || "Could not preview this GLB.", true);
  }
}

async function previewTripoAsset(url, label) {
  if (/^https?:\/\/tripo-data\./i.test(url)) {
    const result = currentTripoResult();
    if (!result) {
      setTripoStatus("Save Result first so Forge can preview the GLB from a local file.", true);
      return;
    }
    setTripoStatus("Saving Tripo result locally before preview...");
    try {
      const response = await fetch("/api/idmap/tripo/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result })
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Could not save Tripo result.");
      renderSavedTripoAssets(saved);
      const model = (saved.assets || []).find((asset) => /\.(glb|gltf)$/i.test(asset.name || ""));
      if (!model) throw new Error("Saved result did not include a GLB model.");
      await previewTripoGlb(model.url, model.name || label);
      setTripoStatus(`Saved and previewing ${model.name}.`);
    } catch (error) {
      setTripoStatus(error.message, true);
    }
    return;
  }
  await previewTripoGlb(url, label);
}

function scheduleTripoTaskPoll(taskId) {
  window.clearTimeout(tripoPollTimer);
  tripoPollTimer = window.setTimeout(() => pollTripoTask(taskId), 12000);
}

async function pollTripoTask(taskId) {
  if (!tripoApiKey.value.trim()) return;
  try {
    const response = await fetch("/api/idmap/tripo/task-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripoApiKey: tripoApiKey.value.trim(), taskId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not refresh Tripo task.");
    rememberTripoTask("latest", result);
    showTripoResult(result);
    setTripoStatus(taskStatusMessage(result, taskId));
    const status = tripoTaskStatus(result);
    if (status && !["success", "failed", "cancelled", "canceled"].includes(status)) scheduleTripoTaskPoll(taskId);
  } catch (error) {
    setTripoStatus(error.message, true);
  } finally {
    renderState();
  }
}

function renderTripoTasks() {
  if (!tripoTaskList) return;
  tripoTaskList.textContent = "";
  const rows = [
    ["Model", currentTripoModelTaskId()],
    ["Segment", tripoTasks.segment],
    ["Texture", tripoTasks.texture],
    ["Latest", tripoTasks.latest]
  ].filter(([, value]) => value);
  if (!rows.length) return;
  rows.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "tripo-task-chip";
    item.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
    tripoTaskList.appendChild(item);
  });
}

function preventBrowserFileOpen(event) {
  if (!event.dataTransfer?.types?.includes("Files")) return;
  event.preventDefault();
}

function bindModelDropTarget(target) {
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    target.classList.add("is-dragover");
  });
  target.addEventListener("dragleave", () => target.classList.remove("is-dragover"));
  target.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    target.classList.remove("is-dragover");
    const files = await collectDroppedFiles(event.dataTransfer);
    const modelPackage = files.map((item) => item.file).find(isModelFile);
    if (!modelPackage) {
      setStatus("Drop one MDB, OBJ, FBX, or ZIP package to extract a UV layout.", true);
      return;
    }
    extractUvLayout(modelPackage);
  });
}

function restoreAiSettings() {
  idMapOpenaiApiKey.value = localStorage.getItem("neverwinterForge.openaiApiKey") || "";
  idMapOpenaiModel.value = localStorage.getItem("neverwinterForge.openaiModel") || "gpt-image-2";
  idMapOpenaiQuality.value = localStorage.getItem("neverwinterForge.openaiQuality") || "medium";
}

function restoreWorkflowSettings() {
  idMapWorkflowMethod.value = localStorage.getItem("neverwinterForge.idMapWorkflowMethod") || "tripo";
  tripoApiKey.value = localStorage.getItem("neverwinterForge.tripoApiKey") || "";
  tripoModelTaskId.value = localStorage.getItem("neverwinterForge.tripoModelTaskId") || "";
  tripoSegmentModel.value = localStorage.getItem("neverwinterForge.tripoSegmentModel") || "v1.0-20250506";
  tripoTextureModel.value = localStorage.getItem("neverwinterForge.tripoTextureModel") || "v3.0-20250812";
  tripoTextureQuality.value = localStorage.getItem("neverwinterForge.tripoTextureQuality") || "standard";
  tripoPromptRecipe.value = localStorage.getItem("neverwinterForge.tripoPromptRecipe") || "flat-id-mask";
  const storedPrompt = localStorage.getItem("neverwinterForge.tripoTexturePrompt") || "";
  const restoredZones = TRIPO_ZONE_OPTIONS.filter((zone) => restoredTripoZones().has(zone.id));
  tripoTexturePrompt.value = !storedPrompt || storedPrompt === OLD_TRIPO_TEXTURE_PROMPT || /NWN2|tint-map|tint map/i.test(storedPrompt)
    ? buildTripoPromptText(tripoPromptRecipe.value, restoredZones)
    : storedPrompt;
  tripoSegmentOverrides.value = localStorage.getItem("neverwinterForge.tripoSegmentOverrides") || "";
  tripoTextureOverrides.value = localStorage.getItem("neverwinterForge.tripoTextureOverrides") || "";
  try {
    tripoTasks = JSON.parse(localStorage.getItem("neverwinterForge.tripoTasks") || "{}");
  } catch {
    tripoTasks = {};
  }
  tripoTasks = { model: tripoModelTaskId.value.trim() || tripoTasks.model || "", segment: tripoTasks.segment || "", texture: tripoTasks.texture || "", latest: tripoTasks.latest || "" };
  renderTripoTasks();
}

function restoreBlenderSettings() {
  blenderPathInput.value = localStorage.getItem("neverwinterForge.blenderPath") || "";
  chunkVisionModelInput.value = localStorage.getItem("neverwinterForge.chunkVisionModel") || "gpt-5.5";
  blenderChunkStrategy.value = localStorage.getItem("neverwinterForge.blenderChunkStrategy") || "spatial_grid";
}

function restorePreviewSettings() {
  idMapPreviewView.value = localStorage.getItem("neverwinterForge.idMapPreviewView") || "3d";
  idMapNormalMode.value = localStorage.getItem("neverwinterForge.idMapNormalMode") || "two-sided";
}

function bindTextureDropzone(dropzone, input, kind) {
  input.addEventListener("change", () => {
    if (input.files[0]) loadUnderlayImage(input.files[0], kind);
  });
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("is-dragover");
    const files = await collectDroppedFiles(event.dataTransfer);
    const texture = files.map((item) => item.file).find(isTextureFile);
    if (!texture) {
      setStatus(`Drop a DDS, TGA, PNG, JPG, WEBP, or BMP ${kind === "diffuse" ? "diffuse" : "normal"} texture.`, true);
      return;
    }
    loadUnderlayImage(texture, kind);
  });
}

function bindTripoReferenceDropzone(kind, dropzone, input) {
  input.addEventListener("change", () => {
    if (input.files[0]) loadTripoReferenceImage(kind, input.files[0]);
  });
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("is-dragover");
    const files = await collectDroppedFiles(event.dataTransfer);
    const image = files.map((item) => item.file).find(isTripoReferenceFile);
    if (!image) {
      setTripoStatus(`Drop a PNG, JPG, or WEBP ${kind} color-guide reference.`, true);
      return;
    }
    loadTripoReferenceImage(kind, image);
  });
}

async function loadTripoReferenceImage(kind, file) {
  if (!isTripoReferenceFile(file)) {
    setTripoStatus("Tripo references must be PNG, JPG, or WEBP images.", true);
    return;
  }
  try {
    const image = await fileToTripoReference(file, kind);
    tripoReferenceImages[kind] = image;
    renderTripoReferenceStatus(kind, file.name);
    setTripoStatus(`Loaded ${kind} Tripo reference: ${file.name}.`);
  } catch {
    setTripoStatus(`Could not read ${file.name}.`, true);
  }
}

function fileToTripoReference(file, kind) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const [, base64] = String(reader.result || "").split(",");
      resolve({ kind, name: file.name, mimeType: file.type || "image/png", imageData: base64 || "" });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isTripoReferenceFile(file) {
  return /\.(png|jpe?g|webp)$/i.test(file?.name || "") && /^image\//.test(file?.type || "image/png");
}

function renderTripoReferenceStatus(kind, name) {
  const dropzone = kind === "front" ? tripoFrontReferenceDropzone : tripoBackReferenceDropzone;
  const status = dropzone.querySelector("small");
  if (status) status.textContent = name || "No reference loaded";
  dropzone.classList.toggle("has-reference", Boolean(name));
}

async function extractUvLayout(file) {
  if (!isModelFile(file)) {
    setStatus("Choose an MDB, OBJ, FBX, or ZIP package.", true);
    return;
  }
  const form = new FormData();
  form.append("files", file, file.name);
  currentModelFile = file;
  lastBlenderResult = null;
  lastChunkAnalysis = null;
  blenderResultGallery.textContent = "";
  chunkAnalysisResults.textContent = "";
  setStatus("Extracting UV layout...");
  chooseIdMapMdbButton.disabled = true;
  try {
    const response = await fetch("/api/idmap/extract", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not extract UV layout.");
    layout = result.layout;
    applyPackagedUnderlays(result.underlays || {});
    trianglesById = new Map((layout.triangles || []).map((triangle) => [triangle.id, triangle]));
    islandsById = new Map((layout.islands || []).map((island) => [island.id, island]));
    islandColors = new Map();
    selectedIslandId = "";
    undoStack = [];
    redoStack = [];
    resizeCanvas();
    renderState();
    drawCanvas();
    renderModelPreview3d();
    const underlayNote = packagedUnderlayNames(result.underlays || {});
    setStatus(`Loaded ${layout.fileName}: ${layout.islandCount} UV islands, ${layout.triangleCount} triangles.${underlayNote}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    chooseIdMapMdbButton.disabled = false;
  }
}

function applyPackagedUnderlays(underlays) {
  if (underlays.diffuse) {
    diffuseImage = imageFromUnderlay(underlays.diffuse);
    setDiffuseTextureDataUrl(`data:${underlays.diffuse.mimeType};base64,${underlays.diffuse.imageData}`);
    setTextureStatus("diffuse", underlays.diffuse.name || "Packaged diffuse");
  }
  if (underlays.normal) {
    normalImage = imageFromUnderlay(underlays.normal);
    setTextureStatus("normal", underlays.normal.name || "Packaged normal");
  }
}

function imageFromUnderlay(underlay) {
  const image = new Image();
  image.onload = drawCanvas;
  image.src = `data:${underlay.mimeType};base64,${underlay.imageData}`;
  return image;
}

function packagedUnderlayNames(underlays) {
  const names = [];
  if (underlays.diffuse?.name) names.push(`diffuse ${underlays.diffuse.name}`);
  if (underlays.normal?.name) names.push(`normal ${underlays.normal.name}`);
  return names.length ? ` Loaded packaged ${names.join(" and ")} underlay${names.length === 1 ? "" : "s"}.` : "";
}

async function loadAiPrepassPrompt() {
  try {
    const response = await fetch("/api/preset-asset?path=id-map-creator%2Fregion-prepass-prompt.txt");
    if (!response.ok) throw new Error("Prompt asset could not be loaded.");
    aiPrepassPrompt = await response.text();
    aiPromptStatus.textContent = "Prompt loaded for broad tintable regions: tunic, pants, boots, gloves, belts, armor, and large accessories.";
  } catch (error) {
    aiPromptStatus.textContent = error.message;
  }
}

async function copyAiPrepassPrompt() {
  const prompt = buildAiPrepassPrompt();
  try {
    await navigator.clipboard.writeText(prompt);
    setStatus("AI pre-pass prompt copied.");
  } catch {
    setStatus("Could not copy prompt to clipboard.", true);
  }
}

function buildAiPrepassPrompt() {
  const summary = layout ? [
    "Current MDB summary:",
    `- File: ${layout.fileName}`,
    `- Asset type: ${layout.assetType || "Model"}`,
    `- Meshes: ${layout.meshCount}`,
    `- UV islands: ${layout.islandCount}`,
    `- UV triangles: ${layout.triangleCount}`,
    `- Texture references: ${textureReferenceSummary()}`,
    "",
    "Use this model summary only as context. The visual inputs are the UV layout, diffuse/albedo map, normal map, and any wrapped model renders supplied with the request."
  ].join("\n") : [
    "No MDB has been loaded yet.",
    "When an MDB is loaded, Neverwinter Forge will append the model name, mesh count, UV island count, triangle count, and texture references."
  ].join("\n");
  return [aiPrepassPrompt || fallbackAiPrepassPrompt(), summary].join("\n\n");
}

async function runAiRegionSuggestion() {
  if (!layout) {
    setStatus("Load an MDB before running the AI pre-pass.", true);
    return;
  }
  if (!idMapOpenaiApiKey.value.trim()) {
    setStatus("Enter an OpenAI API key for the AI pre-pass.", true);
    return;
  }
  aiSuggestionBusy = true;
  renderState();
  setStatus("Building UV and texture reference for AI pre-pass...");
  try {
    const reference = buildAiReferenceImage();
    const prompt = [
      buildAiPrepassPrompt(),
      "",
      "Approved ID palette colors:",
      ID_COLORS.join(", "),
      "",
      "Return one flat 1024x1024 color ID map. Use only the approved colors. Large practical regions matter more than tiny details. Do not include labels, legends, UV wire lines, texture shading, or model renders in the final image."
    ].join("\n");
    setStatus("Asking OpenAI to suggest broad tintable regions...");
    const response = await fetch("/api/idmap/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openaiApiKey: idMapOpenaiApiKey.value.trim(),
        openaiModel: idMapOpenaiModel.value,
        openaiQuality: idMapOpenaiQuality.value,
        openaiSize: "1024x1024",
        prompt,
        imageData: reference.base64,
        mimeType: reference.mime
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not generate an ID map suggestion.");
    const applied = await applyAiSuggestionImage(result.imageData, result.mimeType || "image/png");
    setStatus(`AI pre-pass applied ${applied} island color${applied === 1 ? "" : "s"}. Review and correct before export.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    aiSuggestionBusy = false;
    renderState();
  }
}

async function checkBlenderSetup() {
  setBlenderStatus("Checking Blender setup...");
  checkBlenderButton.disabled = true;
  try {
    const response = await fetch("/api/idmap/blender/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blenderPath: blenderPathInput.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not check Blender.");
    blenderAvailable = Boolean(result.available);
    if (result.blenderPath && !blenderPathInput.value.trim()) {
      blenderPathInput.value = result.blenderPath;
      localStorage.setItem("neverwinterForge.blenderPath", result.blenderPath);
    }
    setBlenderStatus(result.message || (blenderAvailable ? "Blender bridge is available." : "Blender bridge is not available."), !blenderAvailable);
  } catch (error) {
    blenderAvailable = false;
    setBlenderStatus(error.message, true);
  } finally {
    checkBlenderButton.disabled = false;
    renderState();
  }
}

async function runBlenderBake() {
  if (!currentModelFile || !/\.(obj|fbx)$/i.test(currentModelFile.name)) {
    setBlenderStatus("Load an OBJ or FBX before running Blender 3D Bake.", true);
    return;
  }
  blenderBusy = true;
  renderState();
  setBlenderStatus("Running Blender in background. This can take a minute on high-detail meshes...");
  blenderResultGallery.textContent = "";
  const form = new FormData();
  form.append("files", currentModelFile, currentModelFile.name);
  if (diffuseTextureFile) form.append("files", diffuseTextureFile, diffuseTextureFile.name);
  if (normalTextureFile) form.append("files", normalTextureFile, normalTextureFile.name);
  form.append("options", JSON.stringify({
    blenderPath: blenderPathInput.value.trim(),
    textureSize: Number(textureSize.value || 1024),
    chunkStrategy: blenderChunkStrategy.value,
    palette: ID_COLORS
  }));
  try {
    const response = await fetch("/api/idmap/blender/run", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Blender 3D Bake failed.");
    lastBlenderResult = result;
    lastChunkAnalysis = null;
    chunkAnalysisResults.textContent = "";
    renderBlenderResults(result);
    setBlenderStatus(`Blender finished in ${result.elapsedSeconds}s. Review the references and baked ID map below.`);
  } catch (error) {
    setBlenderStatus(error.message, true);
  } finally {
    blenderBusy = false;
    renderState();
  }
}

async function analyzeBlenderChunks() {
  if (!lastBlenderResult?.manifest) {
    setBlenderStatus("Run Blender 3D Bake before chunk analysis.", true);
    return;
  }
  if (!idMapOpenaiApiKey.value.trim()) {
    setBlenderStatus("Enter an OpenAI API key before analyzing 3D chunks.", true);
    return;
  }
  chunkAnalysisBusy = true;
  renderState();
  setBlenderStatus("Asking AI to label visible 3D chunks from texture and chunk-ID views...");
  chunkAnalysisResults.textContent = "";
  try {
    const manifest = lastBlenderResult.manifest;
    const helperKinds = new Set(["texture_reference", "chunk_id", "mesh_wire_reference", "normal_reference"]);
    const images = (manifest.images || [])
      .filter((image) => image.imageData && helperKinds.has(image.kind))
      .slice(0, 20)
      .map((image) => ({
        kind: image.kind,
        name: image.name,
        mimeType: image.mimeType || "image/png",
        imageData: image.imageData
      }));
    const response = await fetch("/api/idmap/blender/analyze-chunks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openaiApiKey: idMapOpenaiApiKey.value.trim(),
        openaiVisionModel: chunkVisionModelInput.value.trim() || "gpt-5.5",
        images,
        chunkLookup: manifest.chunkLookup || {}
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "3D chunk analysis failed.");
    lastChunkAnalysis = result.analysis || {};
    renderChunkAnalysis(lastChunkAnalysis);
    setBlenderStatus("3D chunk analysis returned labels. Review them before applying to a bake.");
  } catch (error) {
    setBlenderStatus(error.message, true);
  } finally {
    chunkAnalysisBusy = false;
    renderState();
  }
}

async function applyChunkLabels() {
  if (!lastBlenderResult?.jobDir || !lastChunkAnalysis?.chunkLabels?.length) {
    setBlenderStatus("Run Blender 3D Bake and Analyze 3D Chunks before applying labels.", true);
    return;
  }
  const reviewedAnalysis = reviewedChunkAnalysis();
  const confidentCount = reviewedAnalysis.chunkLabels.filter((item) => Number(item.confidence) >= CHUNK_CONFIDENCE_CUTOFF).length;
  applyChunkLabelsBusy = true;
  renderState();
  setBlenderStatus(`Applying ${confidentCount} reviewed chunk label${confidentCount === 1 ? "" : "s"} in Blender and baking a new ID map...`);
  try {
    const response = await fetch("/api/idmap/blender/apply-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDir: lastBlenderResult.jobDir,
        blenderPath: blenderPathInput.value.trim(),
        textureSize: Number(textureSize.value || 1024),
        analysis: reviewedAnalysis
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not apply AI chunk labels.");
    renderBlenderResults(result, { append: true });
    setBlenderStatus(`AI labels baked in ${result.elapsedSeconds}s. Review the AI labeled views and ID map.`);
  } catch (error) {
    setBlenderStatus(error.message, true);
  } finally {
    applyChunkLabelsBusy = false;
    renderState();
  }
}

function renderChunkAnalysis(analysis) {
  chunkAnalysisResults.textContent = "";
  const summary = document.createElement("p");
  summary.className = "id-map-note";
  summary.textContent = analysis.summary || "No summary returned.";
  chunkAnalysisResults.appendChild(summary);

  const labels = normalizeChunkLabels(analysis);
  if (labels.length) {
    const controlsNote = document.createElement("p");
    controlsNote.className = "id-map-note";
    controlsNote.textContent = `Review labels before baking. Blender applies labels at ${Math.round(CHUNK_CONFIDENCE_CUTOFF * 100)}% confidence or higher; uncertain and tiny-detail labels bake as black.`;
    chunkAnalysisResults.appendChild(controlsNote);

    const list = document.createElement("div");
    list.className = "chunk-label-list";
    labels.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "chunk-label-row";
      row.dataset.lowConfidence = String(Number(item.confidence) < CHUNK_CONFIDENCE_CUTOFF);

      const swatch = document.createElement("span");
      swatch.className = "chunk-label-swatch";
      swatch.style.background = item.colorHex || "transparent";

      const text = document.createElement("span");
      text.className = "chunk-label-id";
      text.textContent = item.chunkId || item.colorHex || "chunk";

      const labelSelect = document.createElement("select");
      labelSelect.className = "chunk-label-select";
      CHUNK_LABEL_OPTIONS.forEach((option) => {
        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        labelSelect.appendChild(element);
      });
      labelSelect.value = CHUNK_LABEL_BY_VALUE.has(item.label) ? item.label : "uncertain";

      const outputSwatch = document.createElement("span");
      outputSwatch.className = "chunk-output-swatch";
      outputSwatch.style.background = labelColor(labelSelect.value);

      labelSelect.addEventListener("change", () => {
        item.label = labelSelect.value;
        if (Number(item.confidence) < CHUNK_CONFIDENCE_CUTOFF && !labelSelect.value.includes("ignore") && labelSelect.value !== "uncertain") {
          item.confidence = 0.9;
          confidenceInput.value = "0.90";
        }
        outputSwatch.style.background = labelColor(item.label);
        row.dataset.lowConfidence = String(Number(item.confidence) < CHUNK_CONFIDENCE_CUTOFF);
        renderState();
      });

      const confidenceInput = document.createElement("input");
      confidenceInput.className = "chunk-confidence-input";
      confidenceInput.type = "number";
      confidenceInput.min = "0";
      confidenceInput.max = "1";
      confidenceInput.step = "0.05";
      confidenceInput.value = Number.isFinite(Number(item.confidence)) ? Number(item.confidence).toFixed(2) : "0.00";
      confidenceInput.title = "Confidence used by Blender. Values below 0.45 are ignored.";
      confidenceInput.addEventListener("input", () => {
        item.confidence = clamp(Number(confidenceInput.value || 0), 0, 1);
        row.dataset.lowConfidence = String(Number(item.confidence) < CHUNK_CONFIDENCE_CUTOFF);
      });

      const reason = document.createElement("small");
      reason.textContent = item.reason || "";
      row.append(swatch, text, outputSwatch, labelSelect, confidenceInput, reason);
      list.appendChild(row);
    });
    chunkAnalysisResults.appendChild(list);
  }

  (analysis.regionNotes || []).slice(0, 12).forEach((item) => {
    const note = document.createElement("p");
    note.className = "id-map-note";
    note.textContent = `${item.label || "region"}: ${item.notes || ""}`;
    chunkAnalysisResults.appendChild(note);
  });
  (analysis.warnings || []).slice(0, 8).forEach((warning) => {
    const note = document.createElement("p");
    note.className = "id-map-note warning";
    note.textContent = warning;
    chunkAnalysisResults.appendChild(note);
  });
}

function normalizeChunkLabels(analysis) {
  if (!Array.isArray(analysis.chunkLabels)) return [];
  analysis.chunkLabels = analysis.chunkLabels.map((item) => ({
    chunkId: item.chunkId || item.id || "",
    colorHex: item.colorHex || "",
    label: CHUNK_LABEL_BY_VALUE.has(item.label) ? item.label : "uncertain",
    confidence: clamp(Number(item.confidence || 0), 0, 1),
    reason: item.reason || ""
  })).filter((item) => item.chunkId || item.colorHex);
  return analysis.chunkLabels;
}

function reviewedChunkAnalysis() {
  return {
    ...lastChunkAnalysis,
    chunkLabels: normalizeChunkLabels(lastChunkAnalysis).map((item) => ({ ...item }))
  };
}

function labelColor(label) {
  return CHUNK_LABEL_BY_VALUE.get(label)?.color || "#000000";
}

function renderBlenderResults(result, options = {}) {
  if (!options.append) blenderResultGallery.textContent = "";
  const manifest = result.manifest || {};
  (manifest.images || []).forEach((image) => {
    if (!image.imageData) return;
    const card = document.createElement("a");
    const href = `data:${image.mimeType || "image/png"};base64,${image.imageData}`;
    card.className = "id-map-result-card";
    card.href = href;
    card.download = image.kind === "baked_id_map" || image.kind === "ai_labeled_id_map" ? `${image.name || "id-map"}.png` : `${image.name || "blender-reference"}.png`;
    const preview = document.createElement("img");
    preview.src = href;
    preview.alt = image.name || image.kind || "Blender result";
    const label = document.createElement("span");
    label.textContent = image.kind === "baked_id_map" || image.kind === "ai_labeled_id_map" ? image.name : image.name;
    card.append(preview, label);
    blenderResultGallery.appendChild(card);
  });
  (manifest.warnings || []).forEach((warning) => {
    const note = document.createElement("p");
    note.className = "id-map-note warning";
    note.textContent = warning;
    blenderResultGallery.appendChild(note);
  });
}

function setBlenderStatus(message, isError = false) {
  blenderStatus.textContent = message;
  blenderStatus.dataset.error = String(isError);
}

function buildAiReferenceImage() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  if (diffuseImage) {
    context.globalAlpha = 0.82;
    context.drawImage(diffuseImage, 0, 0, size, size);
  }
  if (normalImage) {
    context.globalAlpha = diffuseImage ? 0.34 : 0.76;
    context.drawImage(normalImage, 0, 0, size, size);
  }
  context.globalAlpha = 1;
  context.lineWidth = 1.3;
  context.strokeStyle = "rgba(0, 0, 0, 0.9)";
  (layout.triangles || []).forEach((triangle) => strokeTrianglePath(context, triangle, size));
  context.lineWidth = 0.65;
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  (layout.triangles || []).forEach((triangle) => strokeTrianglePath(context, triangle, size));
  return dataUrlParts(canvas.toDataURL("image/png"));
}

function dataUrlParts(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/^data:(.+);base64$/)?.[1] || "image/png";
  return { mime, base64 };
}

function applyAiSuggestionImage(imageData, mimeType) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const nextColors = colorsFromSuggestionPixels(pixels, canvas.width, canvas.height);
        if (!nextColors.size) {
          resolve(0);
          return;
        }
        pushUndo();
        nextColors.forEach((color, islandId) => islandColors.set(islandId, color));
        redoStack = [];
        renderState();
        drawCanvas();
        resolve(nextColors.size);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not read the AI suggestion image."));
    image.src = `data:${mimeType};base64,${imageData}`;
  });
}

function colorsFromSuggestionPixels(pixels, width, height) {
  const result = new Map();
  (layout.islands || []).forEach((island) => {
    const counts = new Map();
    (island.triangleIds || []).forEach((triangleId) => {
      const triangle = trianglesById.get(triangleId);
      if (!triangle) return;
      sampleTriangleColorPoints(triangle).forEach((uv) => {
        const x = clamp(Math.round(uv[0] * (width - 1)), 0, width - 1);
        const y = clamp(Math.round((1 - uv[1]) * (height - 1)), 0, height - 1);
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] < 32) return;
        const nearest = nearestPaletteColor(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        counts.set(nearest, (counts.get(nearest) || 0) + 1);
      });
    });
    const best = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
    if (best && best[1] >= 2) result.set(island.id, best[0]);
  });
  return result;
}

function sampleTriangleColorPoints(triangle) {
  const [a, b, c] = triangle.uvs;
  return [
    [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3],
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
    [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]
  ];
}

function nearestPaletteColor(r, g, b) {
  let best = ID_COLORS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  ID_COLORS.forEach((color) => {
    const palette = hexToRgba(color);
    const distance = ((r - palette.r) ** 2) + ((g - palette.g) ** 2) + ((b - palette.b) ** 2);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  });
  return best;
}

function textureReferenceSummary() {
  if (!layout) return "None";
  const refs = new Set();
  (layout.meshes || []).forEach((mesh) => {
    ["baseTexture", "normalMap", "tintMask", "glowMap"].forEach((key) => {
      if (mesh[key]) refs.add(`${key}: ${mesh[key]}`);
    });
  });
  return refs.size ? [...refs].join("; ") : "None";
}

function fallbackAiPrepassPrompt() {
  return "Create a simple first-pass tint/ID map suggestion using only large practical regions such as tunic, pants, boots, gloves, belts, armor, leather, and large accessories. Use hard-edged flat palette colors only. Do not segment tiny details.";
}

function resizeCanvas() {
  const size = Number(textureSize.value || 1024);
  idMapCanvas.width = size;
  idMapCanvas.height = size;
}

function renderState() {
  renderWorkflowMethod();
  renderPreviewMode();
  renderSummary();
  renderIslandList();
  renderSelectedIsland();
  const hasLayout = Boolean(layout);
  autoColorIslandsButton.disabled = !hasLayout;
  clearIdMapButton.disabled = !hasLayout || islandColors.size === 0;
  exportIdMapButton.disabled = !hasLayout || islandColors.size === 0;
  suggestIdMapButton.disabled = !hasLayout || aiSuggestionBusy || !idMapOpenaiApiKey.value.trim();
  suggestIdMapButton.textContent = aiSuggestionBusy ? "Suggesting..." : "Suggest Regions";
  runBlenderBakeButton.disabled = blenderBusy || !currentModelFile || !/\.(obj|fbx)$/i.test(currentModelFile.name);
  runBlenderBakeButton.textContent = blenderBusy ? "Running..." : "Run 3D Bake";
  analyzeBlenderChunksButton.disabled = chunkAnalysisBusy || !lastBlenderResult?.manifest || !idMapOpenaiApiKey.value.trim();
  analyzeBlenderChunksButton.textContent = chunkAnalysisBusy ? "Analyzing..." : "Analyze 3D Chunks";
  applyChunkLabelsButton.disabled = applyChunkLabelsBusy || !lastBlenderResult?.jobDir || !lastChunkAnalysis?.chunkLabels?.length;
  applyChunkLabelsButton.textContent = applyChunkLabelsBusy ? "Baking..." : "Apply AI Labels";
  checkTripoKeyButton.disabled = tripoCheckBusy || !tripoApiKey.value.trim();
  checkTripoKeyButton.textContent = tripoCheckBusy ? "Checking..." : "Check Key";
  importTripoModelButton.disabled = Boolean(tripoBusyAction) || !tripoApiKey.value.trim() || !currentModelFile || !/\.(obj|fbx|glb|stl)$/i.test(currentModelFile.name);
  importTripoModelButton.textContent = tripoBusyAction === "import" ? "Importing..." : "Import Model";
  segmentTripoModelButton.disabled = Boolean(tripoBusyAction) || !tripoApiKey.value.trim() || !currentTripoModelTaskId();
  segmentTripoModelButton.textContent = tripoBusyAction === "segment" ? "Segmenting..." : "Segment Model";
  textureTripoModelButton.disabled = Boolean(tripoBusyAction) || !tripoApiKey.value.trim() || !currentTripoModelTaskId();
  textureTripoModelButton.textContent = tripoBusyAction === "texture" ? "Texturing..." : "Texture Model";
  refreshTripoTaskButton.disabled = Boolean(tripoBusyAction) || !tripoApiKey.value.trim() || !(tripoTasks.latest || tripoTasks.texture || tripoTasks.segment || currentTripoModelTaskId());
  refreshTripoTaskButton.textContent = tripoBusyAction === "refresh" ? "Refreshing..." : "Refresh Task";
  saveTripoResultButton.disabled = Boolean(tripoBusyAction) || extractTripoAssets(currentTripoResult()).length === 0;
  saveTripoResultButton.textContent = tripoBusyAction === "save" ? "Saving..." : "Save Result";
  clearSelectedIslandButton.disabled = !selectedIslandId || !islandColors.has(selectedIslandId);
  undoIdMapButton.disabled = undoStack.length === 0;
  redoIdMapButton.disabled = redoStack.length === 0;
}

function renderPreviewMode() {
  const show3d = idMapPreviewView.value === "3d";
  idMapCanvasWrap.hidden = show3d;
  idMap3dWrap.hidden = !show3d;
  idMapNormalModeField.hidden = !show3d;
}

function renderWorkflowMethod() {
  const method = idMapWorkflowMethod.value;
  tripoStagingPanel.hidden = method !== "tripo";
  localAiPrepassPanel.hidden = method === "tripo";
  localBlenderPanel.hidden = method !== "local-blender";
  const notes = {
    tripo: "Primary path staged for the next implementation pass.",
    "local-blender": "Fallback path using local Blender helper renders and exact-palette baking.",
    "uv-manual": "Simple path using UV islands, texture underlays, and the image pre-pass."
  };
  idMapWorkflowNote.textContent = notes[method] || "";
}

function renderSummary() {
  if (!layout) {
    idMapSummary.classList.add("hidden");
    idMapSummary.textContent = "";
    return;
  }
  idMapSummary.textContent = "";
  const items = [
    ["File", layout.fileName],
    ["Type", layout.assetType || "Model"],
    ["Meshes", layout.meshCount],
    ["UV Islands", layout.islandCount],
    ["Triangles", triangleSummary()],
    ["Version", layout.version || "Unknown"]
  ];
  items.forEach(([label, value]) => {
    const chip = document.createElement("span");
    chip.innerHTML = `<strong>${label}</strong> ${value}`;
    idMapSummary.appendChild(chip);
  });
  (layout.warnings || []).forEach((warning) => {
    const chip = document.createElement("span");
    chip.className = "warning";
    chip.textContent = warning;
    idMapSummary.appendChild(chip);
  });
  idMapSummary.classList.remove("hidden");
}

function triangleSummary() {
  if (!layout) return "";
  if (layout.sourceTriangleCount && layout.clientTriangleCount && layout.sourceTriangleCount !== layout.clientTriangleCount) {
    return `${layout.sourceTriangleCount} source / ${layout.clientTriangleCount} proxy`;
  }
  return layout.triangleCount;
}

function renderPalette() {
  idPalette.textContent = "";
  ID_COLORS.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "id-color-button";
    button.style.background = color;
    button.title = color;
    button.dataset.active = String(color === selectedColor);
    button.addEventListener("click", () => {
      selectedColor = color;
      renderPalette();
      if (selectedIslandId) setIslandColor(selectedIslandId, selectedColor);
    });
    idPalette.appendChild(button);
  });
}

function renderIslandList() {
  islandList.textContent = "";
  if (!layout) {
    islandList.innerHTML = "<p>UV islands will appear after extraction.</p>";
    return;
  }
  (layout.islands || []).slice(0, 220).forEach((island) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "id-island-row";
    button.dataset.active = String(island.id === selectedIslandId);
    const color = islandColors.get(island.id) || "";
    const swatch = document.createElement("span");
    swatch.className = "id-island-swatch";
    swatch.style.background = color || "transparent";
    const label = document.createElement("strong");
    label.textContent = island.name;
    const detail = document.createElement("small");
    detail.textContent = `${island.triangleCount} triangles${island.materialNames?.[0] ? ` | ${island.materialNames[0]}` : ""}`;
    button.append(swatch, label, detail);
    button.addEventListener("click", () => {
      selectedIslandId = island.id;
      renderState();
      drawCanvas();
    });
    islandList.appendChild(button);
  });
}

function renderSelectedIsland() {
  selectedIslandInfo.textContent = "";
  const island = islandsById.get(selectedIslandId);
  if (!island) {
    selectedIslandInfo.innerHTML = "<p>Select a UV island to assign a color.</p>";
    return;
  }
  const color = islandColors.get(island.id) || "Unassigned";
  const rows = [
    ["Name", island.name],
    ["Color", color],
    ["Triangles", island.triangleCount],
    ["Meshes", (island.meshNames || []).join(", ") || "Unknown"],
    ["Textures", (island.materialNames || []).join(", ") || "None"]
  ];
  const dl = document.createElement("dl");
  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    dl.append(dt, dd);
  });
  selectedIslandInfo.appendChild(dl);
}

function drawCanvas() {
  const size = idMapCanvas.width;
  ctx.clearRect(0, 0, size, size);
  drawChecker(ctx, size);
  drawUnderlay(ctx, size);
  if (showIdOverlay.checked) drawIslandColors(ctx, size, 0.72);
  if (layout && showUvWire.checked) drawUvWire(ctx, size);
  if (layout && selectedIslandId) drawSelectedIsland(ctx, size);
  idMapEmpty.classList.toggle("hidden", Boolean(layout));
}

function drawChecker(context, size) {
  const cell = Math.max(16, Math.floor(size / 32));
  context.save();
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      context.fillStyle = ((x / cell + y / cell) % 2 === 0) ? "#111417" : "#171b20";
      context.fillRect(x, y, cell, cell);
    }
  }
  context.restore();
}

function drawUnderlay(context, size) {
  const mode = underlayMode.value;
  context.save();
  context.imageSmoothingEnabled = true;
  if ((mode === "diffuse" || mode === "both") && diffuseImage) {
    context.globalAlpha = mode === "both" ? 0.72 : 0.9;
    context.drawImage(diffuseImage, 0, 0, size, size);
  }
  if ((mode === "normal" || mode === "both") && normalImage) {
    context.globalAlpha = mode === "both" ? 0.38 : 0.85;
    context.drawImage(normalImage, 0, 0, size, size);
  }
  context.restore();
}

function drawIslandColors(context, size, alpha) {
  if (!layout) return;
  context.save();
  context.globalAlpha = alpha;
  islandColors.forEach((color, islandId) => {
    const island = islandsById.get(islandId);
    if (!island) return;
    context.fillStyle = color;
    island.triangleIds.forEach((triangleId) => {
      const triangle = trianglesById.get(triangleId);
      if (triangle) fillTrianglePath(context, triangle, size);
    });
  });
  context.restore();
}

function drawUvWire(context, size) {
  context.save();
  context.lineWidth = Math.max(1, size / 1024);
  context.strokeStyle = "rgba(245, 220, 148, 0.82)";
  (layout.triangles || []).forEach((triangle) => strokeTrianglePath(context, triangle, size));
  context.restore();
}

function drawSelectedIsland(context, size) {
  const island = islandsById.get(selectedIslandId);
  if (!island) return;
  context.save();
  context.lineWidth = Math.max(2, size / 420);
  context.strokeStyle = "#ffffff";
  context.shadowColor = "rgba(0, 0, 0, 0.85)";
  context.shadowBlur = 4;
  island.triangleIds.forEach((triangleId) => {
    const triangle = trianglesById.get(triangleId);
    if (triangle) strokeTrianglePath(context, triangle, size);
  });
  context.restore();
}

function fillTrianglePath(context, triangle, size) {
  const points = triangle.uvs.map((uv) => uvToCanvas(uv, size));
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  context.lineTo(points[1].x, points[1].y);
  context.lineTo(points[2].x, points[2].y);
  context.closePath();
  context.fill();
}

function strokeTrianglePath(context, triangle, size) {
  const points = triangle.uvs.map((uv) => uvToCanvas(uv, size));
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  context.lineTo(points[1].x, points[1].y);
  context.lineTo(points[2].x, points[2].y);
  context.closePath();
  context.stroke();
}

function handleCanvasClick(event) {
  if (!layout) return;
  const rect = idMapCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * idMapCanvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * idMapCanvas.height;
  const triangle = findTriangleAtPoint(x, y);
  if (!triangle) {
    selectedIslandId = "";
    renderState();
    drawCanvas();
    return;
  }
  selectedIslandId = triangle.islandId;
  setIslandColor(selectedIslandId, selectedColor);
}

function findTriangleAtPoint(x, y) {
  const triangles = layout.triangles || [];
  for (let index = triangles.length - 1; index >= 0; index -= 1) {
    const triangle = triangles[index];
    const points = triangle.uvs.map((uv) => uvToCanvas(uv, idMapCanvas.width));
    if (pointInTriangle(x, y, points[0], points[1], points[2])) return triangle;
  }
  return null;
}

function setIslandColor(islandId, color) {
  if (!islandsById.has(islandId)) return;
  pushUndo();
  islandColors.set(islandId, color);
  redoStack = [];
  renderState();
  drawCanvas();
}

function autoColorIslands() {
  if (!layout) return;
  pushUndo();
  islandColors = new Map();
  (layout.islands || []).forEach((island, index) => {
    islandColors.set(island.id, ID_COLORS[index % ID_COLORS.length]);
  });
  redoStack = [];
  renderState();
  drawCanvas();
}

function clearSelectedIsland() {
  if (!selectedIslandId || !islandColors.has(selectedIslandId)) return;
  pushUndo();
  islandColors.delete(selectedIslandId);
  redoStack = [];
  renderState();
  drawCanvas();
}

function clearMap() {
  if (!islandColors.size) return;
  pushUndo();
  islandColors = new Map();
  redoStack = [];
  renderState();
  drawCanvas();
}

function pushUndo() {
  undoStack.push(serializeColors());
  if (undoStack.length > 60) undoStack.shift();
}

function undoIdMap() {
  if (!undoStack.length) return;
  redoStack.push(serializeColors());
  restoreColors(undoStack.pop());
  renderState();
  drawCanvas();
}

function redoIdMap() {
  if (!redoStack.length) return;
  undoStack.push(serializeColors());
  restoreColors(redoStack.pop());
  renderState();
  drawCanvas();
}

function serializeColors() {
  return JSON.stringify([...islandColors.entries()]);
}

function restoreColors(serialized) {
  try {
    islandColors = new Map(JSON.parse(serialized || "[]"));
  } catch {
    islandColors = new Map();
  }
}

function exportIdMap() {
  if (!layout || !islandColors.size) return;
  setStatus("Rasterizing exact-color ID map...");
  const size = Number(textureSize.value || 1024);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const exportCtx = canvas.getContext("2d");
  const imageData = exportCtx.createImageData(size, size);
  const data = imageData.data;
  if (unusedPixels.value === "black") {
    for (let index = 0; index < data.length; index += 4) {
      data[index + 3] = 255;
    }
  }

  islandColors.forEach((color, islandId) => {
    const island = islandsById.get(islandId);
    if (!island) return;
    const rgba = hexToRgba(color);
    island.triangleIds.forEach((triangleId) => {
      const triangle = trianglesById.get(triangleId);
      if (triangle) rasterTriangle(data, size, triangle, rgba);
    });
  });

  exportCtx.putImageData(imageData, 0, 0);
  const link = document.createElement("a");
  const baseName = (layout.fileName || "id-map").replace(/\.(mdb|obj|fbx)$/i, "");
  link.download = `${baseName}_id_map_${size}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  setStatus(`Exported ${link.download}.`);
}

function rasterTriangle(data, size, triangle, rgba) {
  const points = triangle.uvs.map((uv) => uvToPixel(uv, size));
  const minX = clamp(Math.floor(Math.min(points[0].x, points[1].x, points[2].x)), 0, size - 1);
  const maxX = clamp(Math.ceil(Math.max(points[0].x, points[1].x, points[2].x)), 0, size - 1);
  const minY = clamp(Math.floor(Math.min(points[0].y, points[1].y, points[2].y)), 0, size - 1);
  const maxY = clamp(Math.ceil(Math.max(points[0].y, points[1].y, points[2].y)), 0, size - 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!pointInTriangle(x + 0.5, y + 0.5, points[0], points[1], points[2])) continue;
      const offset = (y * size + x) * 4;
      data[offset] = rgba.r;
      data[offset + 1] = rgba.g;
      data[offset + 2] = rgba.b;
      data[offset + 3] = 255;
    }
  }
}

async function loadUnderlayImage(file, kind) {
  if (!file) return;
  if (!isTextureFile(file)) {
    setStatus("Choose a DDS, TGA, PNG, JPG, WEBP, or BMP texture.", true);
    return;
  }
  setTextureStatus(kind, `Loading ${file.name}...`);
  if (kind === "diffuse") {
    diffuseTextureFile = file;
    setDiffuseTextureDataUrl(URL.createObjectURL(file));
  } else {
    normalTextureFile = file;
  }
  const form = new FormData();
  form.append("files", file, file.name);
  try {
    const response = await fetch("/api/idmap/texture-underlay", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load that texture.");
    const image = imageFromUnderlay(result.underlay);
    if (kind === "diffuse") {
      diffuseImage = image;
      updateModelPreviewTexture();
    } else {
      normalImage = image;
    }
    setTextureStatus(kind, result.underlay.name || file.name);
    setStatus(`${kind === "diffuse" ? "Diffuse / albedo" : "Normal map"} underlay loaded: ${result.underlay.name || file.name}.`);
  } catch (error) {
    setTextureStatus(kind, "No texture loaded");
    setStatus(error.message, true);
  }
}

function setTextureStatus(kind, message) {
  if (kind === "diffuse") diffuseStatus.textContent = message;
  else normalStatus.textContent = message;
}

function setDiffuseTextureDataUrl(url) {
  if (diffuseTextureUrl && diffuseTextureUrl.startsWith("blob:")) {
    URL.revokeObjectURL(diffuseTextureUrl);
  }
  diffuseTextureUrl = url || "";
  updateModelPreviewTexture();
}

async function renderModelPreview3d() {
  renderPreviewMode();
  if (idMapPreviewView.value !== "3d") return;
  if (!currentModelFile) {
    disposeIdMap3dViewer();
    setModelPreviewMessage("Drop an OBJ to preview the model in 3D space.");
    return;
  }
  if (!window.BABYLON) {
    disposeIdMap3dViewer();
    setModelPreviewMessage("3D preview library is not loaded.");
    return;
  }
  if (!/\.obj$/i.test(currentModelFile.name)) {
    disposeIdMap3dViewer();
    setModelPreviewMessage("3D preview currently supports OBJ. UV view still supports MDB, FBX, and ZIP inputs.");
    return;
  }
  try {
    setModelPreviewMessage("Loading 3D preview...");
    const objText = await currentModelFile.text();
    const meshData = parseObjForPreview(objText);
    if (!meshData.positions.length || !meshData.indices.length) {
      throw new Error("OBJ did not contain previewable triangle geometry.");
    }
    renderBabylonIdMapPreview(meshData);
    setModelPreviewMessage(`${currentModelFile.name} loaded in 3D view.`);
  } catch (error) {
    disposeIdMap3dViewer();
    setModelPreviewMessage(error.message || "Could not preview this OBJ.");
  }
}

function renderBabylonIdMapPreview(meshData) {
  disposeIdMap3dViewer();
  const engine = new BABYLON.Engine(idMap3dCanvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  });
  const scene = new BABYLON.Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new BABYLON.Color4(0.055, 0.065, 0.078, 1);
  scene.ambientColor = new BABYLON.Color3(0.48, 0.48, 0.48);

  const camera = new BABYLON.ArcRotateCamera("idMap3dCamera", Math.PI * 1.72, Math.PI * 0.42, 3, BABYLON.Vector3.Zero(), scene);
  configureIdMapPreviewCamera(camera);

  const ambient = new BABYLON.HemisphericLight("idMap3dAmbient", new BABYLON.Vector3(0.35, 1, 0.55), scene);
  ambient.diffuse = new BABYLON.Color3(0.76, 0.76, 0.74);
  ambient.groundColor = new BABYLON.Color3(0.24, 0.24, 0.26);
  ambient.intensity = 0.82;
  const key = new BABYLON.DirectionalLight("idMap3dKey", new BABYLON.Vector3(-0.4, -0.9, -0.55), scene);
  key.diffuse = new BABYLON.Color3(0.68, 0.66, 0.62);
  key.intensity = 0.42;

  const mesh = new BABYLON.Mesh("idMapObjPreview", scene);
  const vertexData = new BABYLON.VertexData();
  vertexData.positions = centerPreviewPositions(meshData.positions);
  vertexData.indices = previewIndicesForNormalMode(vertexData.positions, meshData.indices, meshData.normals);
  vertexData.uvs = meshData.uvs;
  vertexData.normals = previewNormalsForNormalMode(vertexData.positions, vertexData.indices, meshData.normals);
  vertexData.applyToMesh(mesh, true);

  const material = new BABYLON.StandardMaterial("idMapObjPreviewMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(0.72, 0.72, 0.7);
  material.ambientColor = new BABYLON.Color3(0.46, 0.46, 0.46);
  material.specularColor = new BABYLON.Color3(0.035, 0.035, 0.035);
  material.specularPower = 10;
  material.backFaceCulling = idMapNormalMode.value !== "two-sided";
  material.twoSidedLighting = idMapNormalMode.value === "two-sided";
  mesh.material = material;

  const cameraHome = frameIdMapPreviewMesh(mesh, camera);
  const resizeObserver = new ResizeObserver(() => engine.resize());
  resizeObserver.observe(idMap3dWrap);
  engine.runRenderLoop(() => scene.render());
  idMap3dViewer = { engine, scene, camera, cameraHome, mesh, material, resizeObserver, texture: null };
  updateModelPreviewTexture();
}

async function renderBabylonGlbPreview(url) {
  disposeIdMap3dViewer();
  const engine = new BABYLON.Engine(idMap3dCanvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.055, 0.065, 0.078, 1);
  scene.ambientColor = new BABYLON.Color3(0.48, 0.48, 0.48);

  const camera = new BABYLON.ArcRotateCamera("idMap3dCamera", Math.PI * 1.72, Math.PI * 0.42, 3, BABYLON.Vector3.Zero(), scene);
  configureIdMapPreviewCamera(camera);

  const ambient = new BABYLON.HemisphericLight("idMap3dAmbient", new BABYLON.Vector3(0.35, 1, 0.55), scene);
  ambient.diffuse = new BABYLON.Color3(0.76, 0.76, 0.74);
  ambient.groundColor = new BABYLON.Color3(0.24, 0.24, 0.26);
  ambient.intensity = 0.95;
  const key = new BABYLON.DirectionalLight("idMap3dKey", new BABYLON.Vector3(-0.4, -0.9, -0.55), scene);
  key.diffuse = new BABYLON.Color3(0.8, 0.78, 0.74);
  key.intensity = 0.55;

  const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", url, scene, undefined, ".glb");
  const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices?.() > 0);
  if (!meshes.length) throw new Error("The GLB did not contain previewable mesh geometry.");
  const cameraHome = frameIdMapPreviewMeshes(meshes, camera);
  const resizeObserver = new ResizeObserver(() => engine.resize());
  resizeObserver.observe(idMap3dWrap);
  engine.runRenderLoop(() => scene.render());
  idMap3dViewer = { engine, scene, camera, cameraHome, mesh: meshes[0], meshes, material: null, resizeObserver, texture: null };
}

function parseObjForPreview(text) {
  const sourcePositions = [];
  const sourceUvs = [];
  const sourceNormals = [];
  const positions = [];
  const uvs = [];
  const normals = [];
  const indices = [];
  const lines = String(text || "").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split(/\s+/);
    if (parts[0] === "v" && parts.length >= 4) {
      sourcePositions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
      return;
    }
    if (parts[0] === "vt" && parts.length >= 3) {
      sourceUvs.push([Number(parts[1]), 1 - Number(parts[2])]);
      return;
    }
    if (parts[0] === "vn" && parts.length >= 4) {
      sourceNormals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
      return;
    }
    if (parts[0] !== "f" || parts.length < 4) return;
    const faceVertices = parts.slice(1).map((token) => createObjPreviewVertex(token, sourcePositions, sourceUvs, sourceNormals, positions, uvs, normals));
    for (let index = 1; index < faceVertices.length - 1; index += 1) {
      indices.push(faceVertices[0], faceVertices[index], faceVertices[index + 1]);
    }
  });
  return { positions, uvs, normals, indices };
}

function createObjPreviewVertex(token, sourcePositions, sourceUvs, sourceNormals, positions, uvs, normals) {
  const [positionRaw, uvRaw, normalRaw] = token.split("/");
  const position = sourcePositions[objIndex(positionRaw, sourcePositions.length)] || [0, 0, 0];
  const uv = sourceUvs[objIndex(uvRaw, sourceUvs.length)] || [0, 0];
  const normal = sourceNormals[objIndex(normalRaw, sourceNormals.length)] || [0, 0, 0];
  const index = positions.length / 3;
  positions.push(position[0], position[1], position[2]);
  uvs.push(uv[0], uv[1]);
  normals.push(normal[0], normal[1], normal[2]);
  return index;
}

function objIndex(raw, length) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value === 0) return -1;
  return value > 0 ? value - 1 : length + value;
}

function centerPreviewPositions(positions) {
  if (!positions.length) return positions;
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let index = 0; index < positions.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[index + axis]);
      max[axis] = Math.max(max[axis], positions[index + axis]);
    }
  }
  const center = min.map((value, axis) => (value + max[axis]) * 0.5);
  return positions.map((value, index) => value - center[index % 3]);
}

function previewIndicesForNormalMode(positions, indices, normals) {
  if (idMapNormalMode.value === "flip") return flipPreviewIndices(indices);
  if (idMapNormalMode.value === "auto") return orientPreviewIndicesOutward(positions, indices);
  return orientPreviewIndicesToSourceNormals(positions, indices, normals);
}

function previewNormalsForNormalMode(positions, indices, normals) {
  if ((idMapNormalMode.value === "source" || idMapNormalMode.value === "two-sided") && normals?.length === positions.length) {
    return normalizePreviewNormals(normals);
  }
  const computed = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, computed);
  return computed;
}

function orientPreviewIndicesToSourceNormals(positions, indices, normals) {
  if (!normals?.length || normals.length !== positions.length) return orientPreviewIndicesOutward(positions, indices);
  const oriented = [];
  for (let index = 0; index < indices.length; index += 3) {
    const aIndex = indices[index];
    const bIndex = indices[index + 1];
    const cIndex = indices[index + 2];
    const a = previewVectorAt(positions, aIndex);
    const b = previewVectorAt(positions, bIndex);
    const c = previewVectorAt(positions, cIndex);
    const ab = subtractPreviewVector(b, a);
    const ac = subtractPreviewVector(c, a);
    const faceNormal = crossPreviewVector(ab, ac);
    const sourceNormal = averagePreviewNormals(normals, aIndex, bIndex, cIndex);
    if (dotPreviewVector(faceNormal, sourceNormal) < 0) {
      oriented.push(aIndex, cIndex, bIndex);
    } else {
      oriented.push(aIndex, bIndex, cIndex);
    }
  }
  return oriented;
}

function flipPreviewIndices(indices) {
  const flipped = [];
  for (let index = 0; index < indices.length; index += 3) {
    flipped.push(indices[index], indices[index + 2], indices[index + 1]);
  }
  return flipped;
}

function orientPreviewIndicesOutward(positions, indices) {
  let outwardScore = 0;
  for (let index = 0; index < indices.length; index += 3) {
    const a = previewVectorAt(positions, indices[index]);
    const b = previewVectorAt(positions, indices[index + 1]);
    const c = previewVectorAt(positions, indices[index + 2]);
    const ab = subtractPreviewVector(b, a);
    const ac = subtractPreviewVector(c, a);
    const normal = crossPreviewVector(ab, ac);
    const center = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3
    ];
    outwardScore += dotPreviewVector(normal, center);
  }
  if (outwardScore >= 0) return indices;
  return flipPreviewIndices(indices);
}

function averagePreviewNormals(normals, aIndex, bIndex, cIndex) {
  const a = previewVectorAt(normals, aIndex);
  const b = previewVectorAt(normals, bIndex);
  const c = previewVectorAt(normals, cIndex);
  return [
    (a[0] + b[0] + c[0]) / 3,
    (a[1] + b[1] + c[1]) / 3,
    (a[2] + b[2] + c[2]) / 3
  ];
}

function normalizePreviewNormals(normals) {
  const normalized = [];
  for (let index = 0; index < normals.length; index += 3) {
    const x = normals[index] || 0;
    const y = normals[index + 1] || 0;
    const z = normals[index + 2] || 0;
    const length = Math.hypot(x, y, z) || 1;
    normalized.push(x / length, y / length, z / length);
  }
  return normalized;
}

function previewVectorAt(positions, vertexIndex) {
  const offset = vertexIndex * 3;
  return [positions[offset] || 0, positions[offset + 1] || 0, positions[offset + 2] || 0];
}

function subtractPreviewVector(left, right) {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function crossPreviewVector(left, right) {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}

function dotPreviewVector(left, right) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function configureIdMapPreviewCamera(camera) {
  camera.attachControl(idMap3dCanvas, true);
  camera.lowerRadiusLimit = 0.2;
  camera.upperRadiusLimit = 30;
  camera.minZ = 0.01;
  camera.wheelDeltaPercentage = 0.015;
  camera.panningSensibility = 0;
  camera.inertia = 0.62;
  camera.angularSensibilityX = 720;
  camera.angularSensibilityY = 720;
  const pointerInput = camera.inputs?.attached?.pointers;
  if (pointerInput) {
    pointerInput.buttons = [0, 1, 2];
    pointerInput.panningSensibility = 0;
  }
}

function captureIdMapPreviewCameraHome(camera) {
  return {
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
    target: camera.target.clone()
  };
}

function resetIdMapPreviewCamera() {
  if (!idMap3dViewer?.camera || !idMap3dViewer.cameraHome) return;
  const { camera, cameraHome } = idMap3dViewer;
  camera.alpha = cameraHome.alpha;
  camera.beta = cameraHome.beta;
  camera.radius = cameraHome.radius;
  camera.target = cameraHome.target.clone();
  camera.inertialAlphaOffset = 0;
  camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0;
  camera.inertialPanningX = 0;
  camera.inertialPanningY = 0;
  idMap3dViewer.engine?.resize();
  setModelPreviewMessage("3D preview reset.");
}

function frameIdMapPreviewMesh(mesh, camera) {
  mesh.refreshBoundingInfo();
  const bounds = mesh.getBoundingInfo().boundingBox;
  const size = bounds.maximumWorld.subtract(bounds.minimumWorld);
  const radius = Math.max(size.x, size.y, size.z, 0.25);
  camera.target = bounds.minimumWorld.add(bounds.maximumWorld).scale(0.5);
  camera.radius = Math.max(radius * 2.35, 0.85);
  return captureIdMapPreviewCameraHome(camera);
}

function frameIdMapPreviewMeshes(meshes, camera) {
  meshes.forEach((mesh) => mesh.refreshBoundingInfo());
  const min = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  meshes.forEach((mesh) => {
    const bounds = mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);
    max.maximizeInPlace(bounds.maximumWorld);
  });
  const size = max.subtract(min);
  const radius = Math.max(size.x, size.y, size.z, 0.25);
  camera.target = min.add(max).scale(0.5);
  camera.radius = Math.max(radius * 2.35, 0.85);
  return captureIdMapPreviewCameraHome(camera);
}

function updateModelPreviewTexture() {
  if (!idMap3dViewer?.material) return;
  if (idMap3dViewer.texture) {
    idMap3dViewer.texture.dispose();
    idMap3dViewer.texture = null;
  }
  if (!diffuseTextureUrl) {
    idMap3dViewer.material.diffuseTexture = null;
    return;
  }
  const texture = new BABYLON.Texture(diffuseTextureUrl, idMap3dViewer.scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.hasAlpha = false;
  idMap3dViewer.texture = texture;
  idMap3dViewer.material.diffuseTexture = texture;
}

function disposeIdMap3dViewer() {
  if (!idMap3dViewer) return;
  idMap3dViewer.resizeObserver?.disconnect();
  idMap3dViewer.texture?.dispose();
  idMap3dViewer.engine?.dispose();
  idMap3dViewer = null;
}

function setModelPreviewMessage(message) {
  idMap3dEmpty.textContent = message;
  idMap3dEmpty.hidden = !message;
}

function isTextureFile(file) {
  return /\.(dds|tga|png|jpe?g|webp|bmp)$/i.test(file?.name || "");
}

function isModelFile(file) {
  return MODEL_FILE_PATTERN.test(file?.name || "");
}

function uvToCanvas(uv, size) {
  return { x: uv[0] * size, y: (1 - uv[1]) * size };
}

function uvToPixel(uv, size) {
  return { x: uv[0] * (size - 1), y: (1 - uv[1]) * (size - 1) };
}

function pointInTriangle(px, py, a, b, c) {
  const d1 = sign(px, py, a, b);
  const d2 = sign(px, py, b, c);
  const d3 = sign(px, py, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(px, py, left, right) {
  return (px - right.x) * (left.y - right.y) - (left.x - right.x) * (py - right.y);
}

function hexToRgba(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: 255
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setStatus(message, isError = false) {
  idMapStatus.textContent = message;
  idMapStatus.dataset.error = String(isError);
}

function setTripoStatus(message, isError = false) {
  tripoStatus.textContent = message;
  tripoStatus.dataset.error = String(isError);
}

async function collectDroppedFiles(dataTransfer) {
  const items = [...(dataTransfer.items || [])];
  const entries = items.map((item) => item.webkitGetAsEntry ? item.webkitGetAsEntry() : null).filter(Boolean);
  if (!entries.length) return [...(dataTransfer.files || [])].map((file) => ({ file, path: file.name }));
  const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
  return nested.flat();
}

function readEntry(entry) {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => resolve([{ file, path: entry.fullPath.replace(/^\/+/, "") }]));
    });
  }
  if (!entry.isDirectory) return Promise.resolve([]);
  const reader = entry.createReader();
  return new Promise((resolve) => {
    const entries = [];
    const readBatch = () => {
      reader.readEntries(async (batch) => {
        if (!batch.length) {
          const nested = await Promise.all(entries.map((child) => readEntry(child)));
          resolve(nested.flat());
          return;
        }
        entries.push(...batch);
        readBatch();
      });
    };
    readBatch();
  });
}
