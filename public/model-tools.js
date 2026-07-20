const mdbRootPathField = document.querySelector("#mdbRootPath");
const mdbRecursiveField = document.querySelector("#mdbRecursive");
const chooseMdbFolderButton = document.querySelector("#chooseMdbFolder");
const scanMdbFolderButton = document.querySelector("#scanMdbFolder");
const mdbDropzone = document.querySelector("#mdbDropzone");
const mdbFileInput = document.querySelector("#mdbFileInput");
const importMdbFilesButton = document.querySelector("#importMdbFiles");
const mdbSummary = document.querySelector("#mdbSummary");
const mdbModelRows = document.querySelector("#mdbModelRows");
const modelDetails = document.querySelector("#modelDetails");
const mdbOutputPathField = document.querySelector("#mdbOutputPath");
const chooseMdbOutputButton = document.querySelector("#chooseMdbOutput");
const cloneModeFields = [...document.querySelectorAll("input[name='mdbCloneMode']")];
const raceCloneOptions = document.querySelector("#raceCloneOptions");
const manualCloneOptions = document.querySelector("#manualCloneOptions");
const mdbRaceTargets = document.querySelector("#mdbRaceTargets");
const mdbCustomRaceField = document.querySelector("#mdbCustomRace");
const mdbPartPresetField = document.querySelector("#mdbPartPreset");
const mdbPartCodeField = document.querySelector("#mdbPartCode");
const mdbRaceStartNumberField = document.querySelector("#mdbRaceStartNumber");
const mdbUseNumberOverrideField = document.querySelector("#mdbUseNumberOverride");
const mdbNamePatternField = document.querySelector("#mdbNamePattern");
const mdbStartNumberField = document.querySelector("#mdbStartNumber");
const mdbConflictModeField = document.querySelector("#mdbConflictMode");
const selectAllModelsButton = document.querySelector("#selectAllModels");
const clearModelSelectionButton = document.querySelector("#clearModelSelection");
const removeSelectedModelsButton = document.querySelector("#removeSelectedModels");
const cloneSelectedModelsButton = document.querySelector("#cloneSelectedModels");
const selectionSummary = document.querySelector("#selectionSummary");
const renamePreview = document.querySelector("#renamePreview");
const batchResultSummary = document.querySelector("#batchResultSummary");
const modelSearchField = document.querySelector("#modelSearch");
const modelTypeFilter = document.querySelector("#modelTypeFilter");
const showSelectedOnlyField = document.querySelector("#showSelectedOnly");
const viewFocusedModelButton = document.querySelector("#viewFocusedModel");
const modelViewerOverlay = document.querySelector("#modelViewerOverlay");
const closeModelViewerButton = document.querySelector("#closeModelViewer");
const modelViewerTitle = document.querySelector("#modelViewerTitle");
const modelViewerType = document.querySelector("#modelViewerType");
const modelViewerStage = document.querySelector("#modelViewerStage");
const modelViewerTextureList = document.querySelector("#modelViewerTextureList");
const viewerRotateToggle = document.querySelector("#viewerRotateToggle");
const viewerTextureToggle = document.querySelector("#viewerTextureToggle");
const statusEl = document.querySelector("#status");
const MDB_SHARED = window.ForgeMdb || {};

let currentModels = [];
let selectedModelIndexes = new Set();
let focusedModelIndex = null;
let currentSourceMode = "folder";
let lastCreatedBatchPaths = [];
let conflictPreviewState = { key: "", loading: false, conflicts: [], duplicates: [], error: "" };
let conflictPreviewTimer = null;
let viewerCloseTimer = null;
let viewerFrame = null;
let viewerState = null;
let viewerTextureCache = new Map();
let babylonViewer = null;
let viewerRequestId = 0;
let modelContextMenu = null;
let contextMenuModelIndex = null;
let lastSeenMdbScanDirty = localStorage.getItem("neverwinterForge.mdbScanDirty") || "";

const RACE_BASES = [
  ["HH", "Human / Similar"],
  ["HA", "Aasimar"],
  ["DD", "Dwarf"],
  ["EE", "Elf / Moon Elf"],
  ["EH", "Half-Elf"],
  ["ER", "Half-Drow"],
  ["GG", "Gnome"],
  ["AA", "Halfling"],
  ["OO", "Half-Orc"],
  ["OG", "Gray Orc"],
  ["GY", "Githyanki"],
  ["ED", "Drow"],
  ["EL", "Wild Elf"],
  ["HT", "Tiefling"],
  ["HE", "Earth Genasi"],
  ["HI", "Air Genasi"],
  ["HW", "Water Genasi"],
  ["HF", "Fire Genasi"],
  ["EW", "Wood Elf"],
  ["ES", "Sun Elf"]
];

const STANDARD_WEAR_BASES = new Set(["HH", "EE", "DD", "GG", "OO", "OG"]);
const STANDARD_WEAR_TAILS = ["Body", "Boots", "Gloves", "Helm", "Belt", "Cloak"];
const MATERIAL_FLAG_DEFINITIONS = [
  ["cutoutAlpha", "Cutout Alpha"],
  ["smoothTransparency", "Smooth Transparency"],
  ["additiveFxBlend", "Additive FX Blend"],
  ["environmentReflection", "Environment Reflection"],
  ["facialAnimationHead", "Facial Animation Head"],
  ["useGlowMap", "Use Glow Map"],
  ["doNotCastShadows", "Do Not Cast Shadows"],
  ["receiveProjectedTextures", "Receive Projected Textures"]
];
const HAIR_FLAG_DEFINITIONS = [
  ["Low", "Low / Bald"],
  ["Short", "Short Hair"],
  ["Ponytail", "Ponytail"]
];
const HELMET_FLAG_DEFINITIONS = [
  ["None Hidden", "Shows Head + Hair"],
  ["Hair Hidden", "Hide Hair"],
  ["Partial Hair", "Partial Hair"],
  ["Head Hidden", "Hide Head"]
];
const TEXTURE_REFERENCE_FIELDS = [
  { key: "baseTexture", short: "D", label: "Diffuse" },
  { key: "normalMap", short: "N", label: "Normal" },
  { key: "tintMask", short: "T", label: "Tint" },
  { key: "glowMap", short: "G", label: "Glow" }
];

const RACE_OPTIONS = {
  M: raceOptionsForSex("M"),
  F: raceOptionsForSex("F")
};

restorePreferences();
bindControls();
renderSelectionState();

function restorePreferences() {
  mdbRootPathField.value = localStorage.getItem("neverwinterForge.mdbRootPath") || "";
  mdbOutputPathField.value = localStorage.getItem("neverwinterForge.mdbOutputPath") || "";
  mdbNamePatternField.value = localStorage.getItem("neverwinterForge.mdbNamePattern") || "";
  mdbPartCodeField.value = localStorage.getItem("neverwinterForge.mdbPartCode") || "";
  mdbCustomRaceField.value = localStorage.getItem("neverwinterForge.mdbCustomRace") || "";
  mdbRaceStartNumberField.value = "";
  mdbRaceStartNumberField.disabled = true;
  mdbUseNumberOverrideField.checked = false;
  mdbPartPresetField.value = localStorage.getItem("neverwinterForge.mdbPartPreset") || "";
  mdbConflictModeField.value = localStorage.getItem("neverwinterForge.mdbConflictMode") || "auto";
  mdbRecursiveField.checked = localStorage.getItem("neverwinterForge.mdbRecursive") !== "false";
  const savedMode = localStorage.getItem("neverwinterForge.mdbCloneMode") || "race";
  cloneModeFields.forEach((field) => {
    field.checked = field.value === savedMode;
  });
}

function bindControls() {
  mdbRootPathField.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.mdbRootPath", mdbRootPathField.value);
  });
  mdbOutputPathField.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.mdbOutputPath", mdbOutputPathField.value);
    renderSelectionState();
  });
  mdbNamePatternField.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.mdbNamePattern", mdbNamePatternField.value);
    renderSelectionState();
  });
  mdbPartCodeField.addEventListener("input", () => {
    mdbPartCodeField.value = cleanCode(mdbPartCodeField.value, 4);
    localStorage.setItem("neverwinterForge.mdbPartCode", mdbPartCodeField.value);
    mdbPartPresetField.value = mdbPartCodeField.value ? "custom" : "";
    localStorage.setItem("neverwinterForge.mdbPartPreset", mdbPartPresetField.value);
    renderSelectionState();
  });
  mdbPartPresetField.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.mdbPartPreset", mdbPartPresetField.value);
    if (mdbPartPresetField.value && mdbPartPresetField.value !== "custom") {
      mdbPartCodeField.value = mdbPartPresetField.value;
      localStorage.setItem("neverwinterForge.mdbPartCode", mdbPartCodeField.value);
    }
    if (!mdbPartPresetField.value) {
      mdbPartCodeField.value = "";
      localStorage.setItem("neverwinterForge.mdbPartCode", "");
    }
    renderSelectionState();
  });
  mdbCustomRaceField.addEventListener("input", () => {
    mdbCustomRaceField.value = cleanCode(mdbCustomRaceField.value, 3);
    localStorage.setItem("neverwinterForge.mdbCustomRace", mdbCustomRaceField.value);
    renderSelectionState();
  });
  mdbRaceStartNumberField.addEventListener("input", () => {
    renderSelectionState();
  });
  mdbUseNumberOverrideField.addEventListener("change", () => {
    mdbRaceStartNumberField.disabled = !mdbUseNumberOverrideField.checked;
    if (!mdbUseNumberOverrideField.checked) {
      mdbRaceStartNumberField.value = "";
    }
    renderSelectionState();
  });
  mdbStartNumberField.addEventListener("input", renderSelectionState);
  cloneModeFields.forEach((field) => {
    field.addEventListener("change", () => {
      localStorage.setItem("neverwinterForge.mdbCloneMode", cloneMode());
      updateCloneModeVisibility();
      renderSelectionState();
    });
  });
  mdbRecursiveField.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.mdbRecursive", String(mdbRecursiveField.checked));
  });
  mdbConflictModeField.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.mdbConflictMode", mdbConflictModeField.value);
    renderSelectionState();
  });
  [modelSearchField, modelTypeFilter, showSelectedOnlyField].forEach((field) => {
    field.addEventListener("input", () => {
      renderModelRows();
      renderSelectionState();
    });
    field.addEventListener("change", () => {
      renderModelRows();
      renderSelectionState();
    });
  });

  scanMdbFolderButton.addEventListener("click", scanMdbFolder);
  chooseMdbFolderButton.addEventListener("click", () => chooseFolder(mdbRootPathField, "Model folder selected. Scan when ready."));
  chooseMdbOutputButton.addEventListener("click", () => chooseFolder(mdbOutputPathField, "Output folder selected."));
  importMdbFilesButton.addEventListener("click", () => mdbFileInput.click());
  mdbFileInput.addEventListener("change", async () => {
    await importMdbFiles([...mdbFileInput.files].map((file) => ({ file, path: file.name })));
    mdbFileInput.value = "";
  });
  selectAllModelsButton.addEventListener("click", () => selectModels(filteredModelEntries().map(({ index }) => index)));
  clearModelSelectionButton.addEventListener("click", () => selectModels([]));
  removeSelectedModelsButton.addEventListener("click", removeSelectedModels);
  cloneSelectedModelsButton.addEventListener("click", cloneSelectedModels);
  viewFocusedModelButton.addEventListener("click", openModelViewer);
  closeModelViewerButton.addEventListener("click", closeModelViewer);
  document.addEventListener("click", hideModelContextMenu);
  document.addEventListener("scroll", hideModelContextMenu, true);
  modelViewerOverlay.addEventListener("click", (event) => {
    if (event.target === modelViewerOverlay) closeModelViewer();
  });
  viewerRotateToggle.addEventListener("click", () => {
    const active = viewerRotateToggle.dataset.active !== "true";
    viewerRotateToggle.dataset.active = String(active);
    modelViewerStage.classList.toggle("is-paused", !active);
  });
  viewerTextureToggle.addEventListener("click", () => {
    const active = viewerTextureToggle.dataset.active !== "true";
    viewerTextureToggle.dataset.active = String(active);
    updateBabylonViewerControls();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideModelContextMenu();
    if (event.key === "Escape" && modelViewerOverlay.classList.contains("is-open")) {
      closeModelViewer();
    }
  });
  window.addEventListener("focus", refreshAfterExternalMdbEdit);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshAfterExternalMdbEdit();
  });
  updateCloneModeVisibility();

  mdbDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    mdbDropzone.classList.add("is-dragging");
  });
  mdbDropzone.addEventListener("dragleave", () => mdbDropzone.classList.remove("is-dragging"));
  mdbDropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    mdbDropzone.classList.remove("is-dragging");
    await importMdbFiles(await collectDroppedFiles(event.dataTransfer));
  });
  mdbDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      mdbFileInput.click();
    }
  });
}

async function refreshAfterExternalMdbEdit() {
  const dirty = localStorage.getItem("neverwinterForge.mdbScanDirty") || "";
  if (!dirty || dirty === lastSeenMdbScanDirty) return;
  lastSeenMdbScanDirty = dirty;
  if (currentSourceMode !== "folder" || !currentModels.length || !mdbRootPathField.value.trim()) return;

  try {
    const response = await fetch("/api/mdb/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rootPath: mdbRootPathField.value.trim(),
        recursive: mdbRecursiveField.checked,
        maxFiles: 2000
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not refresh edited models.");
    renderMdbScanResult(result);
    setStatus("Model list refreshed after editor changes.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function chooseFolder(targetField, successMessage) {
  const button = targetField === mdbRootPathField ? chooseMdbFolderButton : chooseMdbOutputButton;
  button.disabled = true;
  button.textContent = "Choosing...";
  setStatus("Opening folder chooser...");

  try {
    const response = await fetch("/api/dialog/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialDir: targetField.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not choose folder.");
    if (!result.folder) {
      setStatus("Folder choice cancelled.");
      return;
    }
    targetField.value = result.folder;
    const key = targetField === mdbRootPathField ? "neverwinterForge.mdbRootPath" : "neverwinterForge.mdbOutputPath";
    localStorage.setItem(key, result.folder);
    setStatus(successMessage);
    renderSelectionState();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = targetField === mdbRootPathField ? "Choose Folder" : "Choose Output";
  }
}

async function scanMdbFolder() {
  const rootPath = mdbRootPathField.value.trim();
  if (!rootPath) {
    setStatus("Choose a model folder to scan.", true);
    mdbRootPathField.focus();
    return;
  }

  scanMdbFolderButton.disabled = true;
  scanMdbFolderButton.textContent = "Scanning...";
  setStatus("Scanning model files...");

  try {
    const response = await fetch("/api/mdb/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rootPath,
        recursive: mdbRecursiveField.checked,
        maxFiles: 2000
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not scan model folder.");
    currentSourceMode = "folder";
    renderMdbScanResult(result, { resetFilters: true });
    const suffix = result.truncated ? ` Showing first ${result.maxFiles}.` : "";
    setStatus(`Loaded ${result.summary.total} scanned model files from this folder.${suffix}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    scanMdbFolderButton.disabled = false;
    scanMdbFolderButton.textContent = "Scan Models";
  }
}

async function importMdbFiles(files) {
  const mdbFiles = files.filter((item) => item.file.name.toLowerCase().endsWith(".mdb"));
  if (!mdbFiles.length) {
    setStatus("Drop or import MDB files to scan.", true);
    return;
  }

  setStatus(`Importing ${mdbFiles.length} model file${mdbFiles.length === 1 ? "" : "s"}...`);
  scanMdbFolderButton.disabled = true;
  importMdbFilesButton.disabled = true;

  try {
    const form = new FormData();
    mdbFiles.forEach((item) => form.append("files", item.file, item.path || item.file.name));
    const response = await fetch("/api/mdb/upload", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not import model files.");
    currentSourceMode = "import";
    appendMdbScanResult(result);
    setStatus(`Added ${result.summary.total} imported model file${result.summary.total === 1 ? "" : "s"}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    scanMdbFolderButton.disabled = false;
    importMdbFilesButton.disabled = false;
  }
}

function renderMdbScanResult(result, options = {}) {
  currentModels = result.models || [];
  resetMdbWorkingState(options);
  focusedModelIndex = currentModels.length ? 0 : null;

  renderSummary(summarizeModels(currentModels));
  renderTypeFilterOptions();
  renderModelRows();
  renderModelDetails();
  renderSelectionState();
}

function resetMdbWorkingState(options = {}) {
  selectedModelIndexes = new Set();
  focusedModelIndex = null;
  lastCreatedBatchPaths = [];
  conflictPreviewState = { key: "", loading: false, conflicts: [], duplicates: [], error: "" };
  clearTimeout(conflictPreviewTimer);
  if (options.resetFilters) resetMdbFilters();
  hideModelContextMenu();
  if (renamePreview) {
    renamePreview.textContent = "";
    renamePreview.classList.add("hidden");
  }
  if (batchResultSummary) {
    batchResultSummary.textContent = "";
    batchResultSummary.classList.add("hidden");
  }
}

function resetMdbFilters() {
  modelSearchField.value = "";
  modelTypeFilter.value = "";
  showSelectedOnlyField.checked = false;
}

function appendMdbScanResult(result) {
  const existing = new Set(currentModels.map((model) => modelKey(model)));
  const additions = (result.models || []).filter((model) => {
    const key = modelKey(model);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  currentModels.push(...additions);
  if (focusedModelIndex === null && currentModels.length) focusedModelIndex = 0;
  renderSummary(summarizeModels(currentModels));
  renderTypeFilterOptions();
  renderModelRows();
  renderModelDetails();
  renderSelectionState();
}

function renderSummary(summary) {
  mdbSummary.innerHTML = `
    <div class="mdb-summary-card"><strong>Total</strong><span data-summary="total"></span></div>
    <div class="mdb-summary-card"><strong>With Textures</strong><span data-summary="textures"></span></div>
    <div class="mdb-summary-card"><strong>Types</strong><span data-summary="types"></span></div>
    <div class="mdb-summary-card"><strong>Selected</strong><span data-summary="selected"></span></div>
  `;
  mdbSummary.querySelector('[data-summary="total"]').textContent = summary.total || 0;
  mdbSummary.querySelector('[data-summary="textures"]').textContent = summary.withTextures || 0;
  mdbSummary.querySelector('[data-summary="types"]').textContent = summary.types || 0;
  mdbSummary.querySelector('[data-summary="selected"]').textContent = selectedModelIndexes.size || 0;
  showElement(mdbSummary);
}

function renderModelRows() {
  mdbModelRows.textContent = "";
  if (!currentModels.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No MDB model files found.";
    row.appendChild(cell);
    mdbModelRows.appendChild(row);
    return;
  }

  const visibleModels = filteredModelEntries().slice(0, 200);
  if (!visibleModels.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No loaded models match the current filters.";
    row.appendChild(cell);
    mdbModelRows.appendChild(row);
    return;
  }

  visibleModels.forEach(({ model, index }) => {
    const row = document.createElement("tr");
    row.className = focusedModelIndex === index ? "is-focused" : "";
    row.addEventListener("click", (event) => {
      if (event.target.type !== "checkbox") {
        focusedModelIndex = index;
        hideModelContextMenu();
        renderModelRows();
        renderModelDetails();
        renderSelectionState();
      }
    });
    row.addEventListener("contextmenu", (event) => showModelContextMenu(event, index));

    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedModelIndexes.has(index);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedModelIndexes.add(index);
      else selectedModelIndexes.delete(index);
      focusedModelIndex = index;
      renderModelRows();
      renderModelDetails();
      renderSelectionState();
    });
    selectCell.appendChild(checkbox);

    const fileCell = document.createElement("td");
    const fileName = document.createElement("div");
    fileName.className = "model-file-name";
    fileName.textContent = model.fileName || "Unnamed model";
    const filePath = document.createElement("div");
    filePath.className = "model-file-path";
    filePath.textContent = model.relativePath || "";
    fileCell.append(fileName, filePath);

    const typeCell = textCell(model.assetType || "Model");
    const texturesCell = textCell(textureReferences(model).filter((item) => item.value).length);
    const textureFilesCell = document.createElement("td");
    textureFilesCell.className = "model-textures-cell";
    textureFilesCell.appendChild(textureChips(model));

    row.append(selectCell, fileCell, typeCell, texturesCell, textureFilesCell);
    mdbModelRows.appendChild(row);
  });
}

function focusModel(index) {
  focusedModelIndex = index;
  renderModelRows();
  renderModelDetails();
  renderSelectionState();
}

function ensureModelContextMenu() {
  if (modelContextMenu) return modelContextMenu;

  const menu = document.createElement("div");
  const viewButton = document.createElement("button");
  const title = document.createElement("strong");
  const subtitle = document.createElement("span");

  menu.className = "model-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-hidden", "true");
  viewButton.type = "button";
  viewButton.setAttribute("role", "menuitem");
  title.textContent = "View Model";
  subtitle.textContent = "Open 3D preview";
  viewButton.append(title, subtitle);
  viewButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (contextMenuModelIndex !== null && currentModels[contextMenuModelIndex]) {
      focusModel(contextMenuModelIndex);
      hideModelContextMenu();
      openModelViewer();
    }
  });

  menu.appendChild(viewButton);
  document.body.appendChild(menu);
  modelContextMenu = menu;
  return menu;
}

function showModelContextMenu(event, index) {
  event.preventDefault();
  event.stopPropagation();
  contextMenuModelIndex = index;
  focusModel(index);

  const menu = ensureModelContextMenu();
  menu.setAttribute("aria-hidden", "false");
  menu.classList.add("is-open");
  menu.style.left = "0px";
  menu.style.top = "0px";

  const rect = menu.getBoundingClientRect();
  const padding = 8;
  const left = Math.min(event.clientX, window.innerWidth - rect.width - padding);
  const top = Math.min(event.clientY, window.innerHeight - rect.height - padding);
  menu.style.left = `${Math.max(padding, left)}px`;
  menu.style.top = `${Math.max(padding, top)}px`;
}

function hideModelContextMenu() {
  contextMenuModelIndex = null;
  if (!modelContextMenu) return;
  modelContextMenu.classList.remove("is-open");
  modelContextMenu.setAttribute("aria-hidden", "true");
}

function renderModelDetails() {
  const model = focusedModelIndex === null ? null : currentModels[focusedModelIndex];
  if (!model) {
    modelDetails.innerHTML = "<h2>Model Details</h2><p>Select a model to inspect its editable game fields.</p>";
    return;
  }

  const primary = primaryPacket(model);
  const material = primary?.material || {};
  const skeleton = primary?.skeleton || "Not used";
  modelDetails.textContent = "";
  modelDetails.append(
    headingBlock(model.fileName),
    detailList([
      ["Parse Status", factualStatus(model.status)],
      ["Notes", model.issueCount ? String(model.issueCount) : "None"],
      ["Game Part Type", model.assetType],
      ["Internal Model Name", primary?.name || "Unknown"],
      ["Animation Skeleton", skeleton],
      ["Base Texture", material.baseTexture || "None"],
      ["Normal Map", material.normalMap || "None"],
      ["Tint Mask", material.tintMask || "None"],
      ["Glow Map", material.glowMap || "None"]
    ]),
    syncPanel(model),
    materialVisuals(material),
    flagsPanel(model),
    packetList(model),
    fileMessageList(model.warnings || [])
  );
}

function viewerModelCandidate() {
  if (focusedModelIndex !== null && currentModels[focusedModelIndex]) {
    return currentModels[focusedModelIndex];
  }
  const firstSelected = [...selectedModelIndexes][0];
  return firstSelected === undefined ? null : currentModels[firstSelected] || null;
}

function openModelViewer() {
  const model = viewerModelCandidate();
  if (!model) return;

  clearTimeout(viewerCloseTimer);
  renderModelViewer(model);
  modelViewerOverlay.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    modelViewerOverlay.classList.add("is-open");
    closeModelViewerButton.focus({ preventScroll: true });
  });
}

function closeModelViewer() {
  viewerRequestId += 1;
  modelViewerOverlay.classList.remove("is-open");
  modelViewerOverlay.setAttribute("aria-hidden", "true");
  stopModelViewerRender();
  clearTimeout(viewerCloseTimer);
  viewerCloseTimer = setTimeout(() => {
    modelViewerStage.textContent = "";
  }, 220);
}

function renderModelViewer(model) {
  const requestId = ++viewerRequestId;
  stopModelViewerRender();
  const primary = primaryPacket(model);
  const material = primary?.material || {};
  const color = material.specularColor || [1, 1, 1];
  const glossiness = Number(material.glossiness || 0);
  const intensity = Number(material.specularIntensity || 0);
  const preview = shinePreview(color, glossiness, intensity);
  const scene = document.createElement("div");
  const floor = document.createElement("div");
  const orbit = document.createElement("div");
  const shadow = document.createElement("span");
  const nameplate = document.createElement("div");

  modelViewerTitle.textContent = stem(model.fileName) || "Model Preview";
  modelViewerType.textContent = model.assetType || "Model Preview";
  modelViewerStage.textContent = "";
  modelViewerStage.classList.remove("is-paused");
  modelViewerStage.dataset.viewerType = model.assetType || "Model";
  viewerRotateToggle.dataset.active = "true";
  viewerTextureToggle.dataset.active = "true";

  scene.className = "viewer-scene";
  floor.className = "viewer-floor";
  orbit.className = `viewer-orbit ${viewerModelShape(model)}`;
  shadow.className = "viewer-shadow";
  nameplate.className = "viewer-nameplate";
  preview.classList.add("model-viewer-matcap");
  nameplate.textContent = primary?.name || stem(model.fileName) || "Model";

  orbit.append(preview, shadow);
  scene.append(floor, orbit, nameplate);
  modelViewerStage.appendChild(scene);
  renderViewerTextureList(model, primary);
  loadModelGeometry(model, requestId);
}

async function loadModelGeometry(model, requestId) {
  if (!isDiskPath(model.path)) {
    showViewerMessage("Geometry preview needs a model scanned from a folder path.");
    return;
  }

  showViewerMessage("Loading model geometry...");
  try {
    const payload = { path: model.path };
    const rootPath = mdbRootPathField.value.trim();
    if (rootPath) payload.rootPath = rootPath;

    const response = await fetch("/api/mdb/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load model geometry.");
    if (requestId !== viewerRequestId || modelViewerOverlay.getAttribute("aria-hidden") === "true") return;
    renderGeometryViewer(result);
  } catch (error) {
    if (requestId !== viewerRequestId) return;
    showViewerMessage(error.message, true);
  }
}

function renderGeometryViewer(preview) {
  stopModelViewerRender();
  modelViewerStage.textContent = "";

  if (window.BABYLON) {
    renderBabylonViewer(preview);
    return;
  }

  const canvas = document.createElement("canvas");
  const nameplate = document.createElement("div");
  canvas.className = "viewer-canvas";
  nameplate.className = "viewer-nameplate";
  nameplate.textContent = `${preview.meshes?.length || 0} mesh${preview.meshes?.length === 1 ? "" : "es"} loaded`;
  modelViewerStage.append(canvas, nameplate);

  const warning = (preview.warnings || [])[0];
  if (warning) {
    const note = document.createElement("div");
    note.className = "viewer-warning";
    note.textContent = warning;
    modelViewerStage.appendChild(note);
  }

  viewerState = {
    canvas,
    preview,
    textures: new Map(),
    angle: 0,
    lastTime: 0,
    bounds: previewBounds(preview)
  };
  loadViewerTextures(preview, viewerState);
  viewerFrame = requestAnimationFrame(drawViewerFrame);
}

function loadViewerTextures(preview, state) {
  (preview.meshes || []).forEach((mesh, index) => {
    const dataUrl = mesh.texture?.dataUrl;
    if (!dataUrl) return;
    const cached = viewerTextureCache.get(dataUrl);
    if (cached) {
      state.textures.set(index, cached);
      return;
    }
    const image = new Image();
    image.onload = () => {
      viewerTextureCache.set(dataUrl, image);
      if (viewerState === state) state.textures.set(index, image);
    };
    image.src = dataUrl;
  });
}

function renderBabylonViewer(preview) {
  const canvas = document.createElement("canvas");
  const nameplate = document.createElement("div");
  canvas.className = "viewer-canvas babylon-viewer-canvas";
  nameplate.className = "viewer-nameplate";
  nameplate.textContent = `${preview.meshes?.length || 0} mesh${preview.meshes?.length === 1 ? "" : "es"} loaded in Babylon`;
  modelViewerStage.append(canvas, nameplate);

  const warning = (preview.warnings || [])[0];
  if (warning) {
    const note = document.createElement("div");
    note.className = "viewer-warning";
    note.textContent = warning;
    modelViewerStage.appendChild(note);
  }

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.055, 0.065, 0.078, 1);
  scene.ambientColor = new BABYLON.Color3(0.46, 0.46, 0.46);

  const camera = new BABYLON.ArcRotateCamera(
    "mdbPreviewCamera",
    Math.PI * 0.72,
    Math.PI * 0.42,
    3.2,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 0.35;
  camera.upperRadiusLimit = 25;
  camera.minZ = 0.01;
  camera.wheelDeltaPercentage = 0.015;
  camera.panningSensibility = 85;
  canvas.addEventListener("dblclick", resetBabylonCamera);

  const light = new BABYLON.HemisphericLight("viewerAmbient", new BABYLON.Vector3(0.35, 1, 0.55), scene);
  light.diffuse = new BABYLON.Color3(0.72, 0.72, 0.72);
  light.groundColor = new BABYLON.Color3(0.28, 0.28, 0.3);
  light.specular = new BABYLON.Color3(0.08, 0.08, 0.08);
  light.intensity = 0.72;
  const key = new BABYLON.DirectionalLight("viewerKey", new BABYLON.Vector3(-0.4, -0.9, -0.55), scene);
  key.diffuse = new BABYLON.Color3(0.62, 0.62, 0.6);
  key.specular = new BABYLON.Color3(0.05, 0.05, 0.05);
  key.intensity = 0.38;

  const root = new BABYLON.TransformNode("mdbPreviewRoot", scene);
  const previewCenter = babylonPreviewCenter(preview);
  const materials = [];
  const meshes = [];
  (preview.meshes || []).forEach((meshData, index) => {
    const mesh = buildBabylonMesh(meshData, index, scene, previewCenter);
    mesh.parent = root;
    meshes.push(mesh);
    if (mesh.material) materials.push(mesh.material);
  });

  const cameraHome = frameBabylonMeshes(meshes, camera);
  updateBabylonViewerControls();

  const resizeObserver = new ResizeObserver(() => engine.resize());
  resizeObserver.observe(modelViewerStage);
  engine.runRenderLoop(() => {
    if (viewerRotateToggle.dataset.active === "true") {
      root.rotation.y += scene.getEngine().getDeltaTime() * 0.00028;
    }
    scene.render();
  });

  babylonViewer = { engine, scene, camera, root, materials, meshes, resizeObserver, cameraHome };
}

function buildBabylonMesh(meshData, index, scene, previewCenter) {
  const mesh = new BABYLON.Mesh(meshData.name || `mdbMesh${index}`, scene);
  const vertexData = new BABYLON.VertexData();
  vertexData.positions = babylonPositions(meshData.positions || [], previewCenter);
  vertexData.indices = babylonTriangleIndices(meshData.indices || [], meshData.type === "RIGD");
  vertexData.uvs = babylonUvs(meshData.uvs || []);
  vertexData.normals = outwardBabylonNormals(vertexData.positions, meshData.normals || []);
  if (vertexData.normals.length !== vertexData.positions.length) {
    vertexData.normals = [];
    BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
  }
  vertexData.applyToMesh(mesh, true);

  const material = new BABYLON.StandardMaterial(`${mesh.name}_mat`, scene);
  const baseColor = rgbValues(meshData.material?.baseColor || [0.76, 0.76, 0.74]).map((value) => value / 255);
  material.diffuseColor = new BABYLON.Color3(
    Math.min(baseColor[0] * 1.08, 1),
    Math.min(baseColor[1] * 1.08, 1),
    Math.min(baseColor[2] * 1.08, 1)
  );
  material.ambientColor = new BABYLON.Color3(0.48, 0.48, 0.48);
  material.specularColor = new BABYLON.Color3(0.035, 0.035, 0.035);
  material.specularPower = 10;
  material.backFaceCulling = true;
  material.wireframe = false;
  material.alpha = 1;
  material.useAlphaFromDiffuseTexture = false;
  material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
  material.forceDepthWrite = true;

  if (meshData.texture?.dataUrl) {
    const texture = new BABYLON.Texture(
      meshData.texture.dataUrl,
      scene,
      false,
      true,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        material.diffuseTexture = viewerTextureToggle.dataset.active === "true" ? texture : null;
      },
      (message) => {
        console.warn("Could not load MDB preview texture", meshData.texture?.name, message);
      }
    );
    texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    texture.hasAlpha = false;
    texture.name = meshData.texture.name || "Diffuse";
    material.metadata = { previewTexture: texture, textureName: texture.name };
    material.diffuseTexture = viewerTextureToggle.dataset.active === "true" ? texture : null;
  }

  mesh.material = material;
  return mesh;
}

function updateBabylonViewerControls() {
  if (!babylonViewer) return;
  babylonViewer.materials.forEach((material) => {
    material.wireframe = false;
    material.backFaceCulling = true;
    material.alpha = 1;
    material.useAlphaFromDiffuseTexture = false;
    material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    material.forceDepthWrite = true;
    material.specularColor = new BABYLON.Color3(0.035, 0.035, 0.035);
    material.specularPower = 10;
    material.diffuseTexture = viewerTextureToggle.dataset.active === "true"
      ? material.metadata?.previewTexture || null
      : null;
  });
}

function frameBabylonMeshes(meshes, camera) {
  if (!meshes.length) return null;
  const min = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  meshes.forEach((mesh) => {
    mesh.refreshBoundingInfo();
    const bounds = mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(bounds.minimumWorld);
    max.maximizeInPlace(bounds.maximumWorld);
  });
  const center = min.add(max).scale(0.5);
  const size = max.subtract(min);
  const radius = Math.max(size.x, size.y, size.z, 0.25);
  camera.alpha = Math.PI * 0.72;
  camera.beta = Math.PI * 0.42;
  camera.target = center;
  camera.radius = Math.max(radius * 2.35, 0.95);
  return {
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
    target: center.clone()
  };
}

function resetBabylonCamera() {
  if (!babylonViewer?.camera || !babylonViewer.cameraHome) return;
  const { camera, cameraHome } = babylonViewer;
  camera.alpha = cameraHome.alpha;
  camera.beta = cameraHome.beta;
  camera.radius = cameraHome.radius;
  camera.target = cameraHome.target.clone();
}

function babylonPositions(values, center = [0, 0, 0]) {
  const converted = [];
  for (let index = 0; index < values.length; index += 3) {
    converted.push(
      values[index] - center[0],
      values[index + 2] - center[1],
      values[index + 1] - center[2]
    );
  }
  return converted;
}

function babylonPreviewCenter(preview) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  (preview.meshes || []).forEach((mesh) => {
    const positions = mesh.positions || [];
    for (let index = 0; index < positions.length; index += 3) {
      const x = positions[index];
      const y = positions[index + 2];
      const z = positions[index + 1];
      min[0] = Math.min(min[0], x);
      min[1] = Math.min(min[1], y);
      min[2] = Math.min(min[2], z);
      max[0] = Math.max(max[0], x);
      max[1] = Math.max(max[1], y);
      max[2] = Math.max(max[2], z);
    }
  });
  if (min.some((value) => !Number.isFinite(value)) || max.some((value) => !Number.isFinite(value))) {
    return [0, 0, 0];
  }
  return [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2
  ];
}

function outwardBabylonNormals(positions, values) {
  const converted = [];
  for (let index = 0; index < values.length; index += 3) {
    converted.push(values[index], values[index + 2], values[index + 1]);
  }
  if (converted.length === positions.length && outwardNormalScore(positions, converted) < 0) {
    return converted.map((value) => -value);
  }
  return converted;
}

function babylonUvs(values) {
  const converted = [];
  for (let index = 0; index < values.length; index += 2) {
    converted.push(Number(values[index] || 0), Number(-(values[index + 1] || 0)));
  }
  return converted;
}

function babylonTriangleIndices(indices, reverse = false) {
  const converted = [];
  for (let index = 0; index < indices.length; index += 3) {
    if (reverse) {
      converted.push(indices[index], indices[index + 2], indices[index + 1]);
    } else {
      converted.push(indices[index], indices[index + 1], indices[index + 2]);
    }
  }
  return converted;
}

function outwardNormalScore(positions, normals) {
  const center = meshPositionCenter(positions);
  let score = 0;
  for (let index = 0; index < positions.length; index += 3) {
    const vertex = [positions[index], positions[index + 1], positions[index + 2]];
    const normal = [normals[index], normals[index + 1], normals[index + 2]];
    score += dot3(normal, subtract3(vertex, center));
  }
  return score;
}

function meshPositionCenter(positions) {
  const center = [0, 0, 0];
  const count = Math.max(1, positions.length / 3);
  for (let index = 0; index < positions.length; index += 3) {
    center[0] += positions[index];
    center[1] += positions[index + 1];
    center[2] += positions[index + 2];
  }
  return center.map((value) => value / count);
}

function subtract3(left, right) {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function showViewerMessage(message, isError = false) {
  const messageEl = document.createElement("div");
  messageEl.className = `viewer-loading${isError ? " error" : ""}`;
  messageEl.textContent = message;
  const scene = modelViewerStage.querySelector(".viewer-scene");
  if (scene) {
    const existing = modelViewerStage.querySelector(".viewer-loading");
    if (existing) existing.remove();
    modelViewerStage.appendChild(messageEl);
  } else {
    modelViewerStage.textContent = "";
    modelViewerStage.appendChild(messageEl);
  }
}

function stopModelViewerRender() {
  if (viewerFrame) cancelAnimationFrame(viewerFrame);
  viewerFrame = null;
  viewerState = null;
  if (babylonViewer) {
    babylonViewer.resizeObserver?.disconnect();
    babylonViewer.engine?.stopRenderLoop();
    babylonViewer.scene?.dispose();
    babylonViewer.engine?.dispose();
    babylonViewer = null;
  }
}

function drawViewerFrame(time) {
  if (!viewerState) return;
  const { canvas, preview, bounds } = viewerState;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  if (viewerRotateToggle.dataset.active === "true") {
    const delta = viewerState.lastTime ? Math.min(40, time - viewerState.lastTime) : 16;
    viewerState.angle += delta * 0.00055;
  }
  viewerState.lastTime = time;

  context.clearRect(0, 0, width, height);
  drawViewerBackground(context, width, height);
  drawPreviewMeshes(context, preview, bounds, width, height, viewerState.angle);
  viewerFrame = requestAnimationFrame(drawViewerFrame);
}

function drawViewerBackground(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#242932");
  gradient.addColorStop(0.58, "#15181d");
  gradient.addColorStop(1, "#101216");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.045)";
  context.lineWidth = 1;
  const floorY = height * 0.74;
  for (let x = -width; x < width * 2; x += 42) {
    context.beginPath();
    context.moveTo(x, floorY);
    context.lineTo(width / 2 + (x - width / 2) * 0.55, height * 0.93);
    context.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    const y = floorY + i * 22;
    context.beginPath();
    context.ellipse(width / 2, y, width * (0.18 + i * 0.045), 7 + i * 2.2, 0, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawPreviewMeshes(context, preview, bounds, width, height, angle) {
  const center = bounds.center;
  const extent = Math.max(bounds.size[0], bounds.size[1], bounds.size[2], 0.001);
  const scale = Math.min(width, height) * 0.68 / extent;
  const faces = [];
  const cosY = Math.cos(angle);
  const sinY = Math.sin(angle);
  const pitch = -0.18;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  (preview.meshes || []).forEach((mesh, meshIndex) => {
    const projected = [];
    const positions = mesh.positions || [];
    const indices = mesh.indices || [];
    const baseColor = rgbValues(mesh.material?.baseColor || [0.72, 0.74, 0.76]);
    const uvs = mesh.uvs || [];
    const texture = viewerTextureToggle.dataset.active === "true"
      ? viewerState?.textures?.get(meshIndex)
      : null;
    for (let i = 0; i < positions.length; i += 3) {
      const rawX = positions[i] - center[0];
      const rawDepth = positions[i + 1] - center[1];
      const rawY = positions[i + 2] - center[2];
      const x1 = rawX * cosY - rawDepth * sinY;
      const z1 = rawX * sinY + rawDepth * cosY;
      const y1 = rawY * cosP - z1 * sinP;
      const z2 = rawY * sinP + z1 * cosP;
      const perspective = 1 / (1 + z2 * 0.08);
      projected.push({
        x: width / 2 + x1 * scale * perspective,
        y: height / 2 - y1 * scale * perspective,
        z: z2,
        wx: x1,
        wy: y1,
        wz: z2,
        u: uvs[(i / 3) * 2] ?? 0,
        v: uvs[(i / 3) * 2 + 1] ?? 0
      });
    }

    for (let i = 0; i < indices.length; i += 3) {
      const a = projected[indices[i]];
      const b = projected[indices[i + 1]];
      const c = projected[indices[i + 2]];
      if (!a || !b || !c) continue;
      const normal = faceNormal(a, b, c);
      const screenArea = signedScreenArea(a, b, c);
      if (screenArea > -0.02 && screenArea < 0.02) continue;
      if (screenArea > 0) continue;
      const shade = clamp(0.36 + Math.max(0, dot3(normal, [0.35, 0.45, 0.82])) * 0.72, 0.26, 1.12);
      faces.push({
        a,
        b,
        c,
        meshIndex,
        texture,
        depth: Math.round(((a.z + b.z + c.z) / 3) * 10000) / 10000 + meshIndex * 0.00001 + i * 0.000000001,
        color: shadeColor(baseColor, shade),
        edge: shadeColor(baseColor, shade * 0.62),
        shade
      });
    }
  });

  faces.sort((left, right) => left.depth - right.depth);
  faces.forEach((face) => {
    context.beginPath();
    context.moveTo(face.a.x, face.a.y);
    context.lineTo(face.b.x, face.b.y);
    context.lineTo(face.c.x, face.c.y);
    context.closePath();
    if (face.texture) {
      drawTexturedTriangle(context, face.texture, face.a, face.b, face.c, face.shade);
    } else {
      context.fillStyle = face.color;
      context.fill();
    }
    context.strokeStyle = face.edge;
    context.lineWidth = 0.35;
    context.stroke();
  });
}

function previewBounds(preview) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  (preview.meshes || []).forEach((mesh) => {
    const meshMin = mesh.bounds?.min || [];
    const meshMax = mesh.bounds?.max || [];
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], Number(meshMin[axis] ?? 0));
      max[axis] = Math.max(max[axis], Number(meshMax[axis] ?? 0));
    }
  });
  for (let axis = 0; axis < 3; axis += 1) {
    if (!Number.isFinite(min[axis]) || !Number.isFinite(max[axis])) {
      min[axis] = -0.5;
      max[axis] = 0.5;
    }
  }
  return {
    min,
    max,
    center: min.map((value, index) => (value + max[index]) / 2),
    size: min.map((value, index) => Math.max(0.001, max[index] - value))
  };
}

function drawTexturedTriangle(context, image, a, b, c, shade) {
  const ta = texturePoint(image, a);
  const tb = texturePoint(image, b);
  const tc = texturePoint(image, c);
  const denominator = ta.x * (tb.y - tc.y) + tb.x * (tc.y - ta.y) + tc.x * (ta.y - tb.y);
  if (Math.abs(denominator) < 0.0001) {
    context.fillStyle = `rgb(${Math.round(180 * shade)}, ${Math.round(180 * shade)}, ${Math.round(180 * shade)})`;
    context.fill();
    return;
  }

  const m11 = (a.x * (tb.y - tc.y) + b.x * (tc.y - ta.y) + c.x * (ta.y - tb.y)) / denominator;
  const m12 = (a.y * (tb.y - tc.y) + b.y * (tc.y - ta.y) + c.y * (ta.y - tb.y)) / denominator;
  const m21 = (a.x * (tc.x - tb.x) + b.x * (ta.x - tc.x) + c.x * (tb.x - ta.x)) / denominator;
  const m22 = (a.y * (tc.x - tb.x) + b.y * (ta.x - tc.x) + c.y * (tb.x - ta.x)) / denominator;
  const dx = (a.x * (tb.x * tc.y - tc.x * tb.y) + b.x * (tc.x * ta.y - ta.x * tc.y) + c.x * (ta.x * tb.y - tb.x * ta.y)) / denominator;
  const dy = (a.y * (tb.x * tc.y - tc.x * tb.y) + b.y * (tc.x * ta.y - ta.x * tc.y) + c.y * (ta.x * tb.y - tb.x * ta.y)) / denominator;

  context.save();
  context.clip();
  context.setTransform(m11, m12, m21, m22, dx, dy);
  context.drawImage(image, 0, 0);
  context.restore();

  if (shade < 0.96) {
    context.save();
    context.globalCompositeOperation = "multiply";
    context.fillStyle = `rgba(0, 0, 0, ${clamp(1 - shade, 0, 0.42)})`;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.lineTo(c.x, c.y);
    context.closePath();
    context.fill();
    context.restore();
  }
}

function texturePoint(image, point) {
  return {
    x: wrap01(point.u) * image.width,
    y: wrap01(1 - point.v) * image.height
  };
}

function wrap01(value) {
  const number = Number(value || 0);
  return number - Math.floor(number);
}

function faceNormal(a, b, c) {
  const ux = b.wx - a.wx;
  const uy = b.wy - a.wy;
  const uz = b.wz - a.wz;
  const vx = c.wx - a.wx;
  const vy = c.wy - a.wy;
  const vz = c.wz - a.wz;
  return normalize3([
    uy * vz - uz * vy,
    uz * vx - ux * vz,
    ux * vy - uy * vx
  ]);
}

function signedScreenArea(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function normalize3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function dot3(left, right) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function shadeColor(color, shade) {
  const [r, g, b] = color.map((channel) => Math.round(clamp(channel * shade, 0, 255)));
  return `rgb(${r}, ${g}, ${b})`;
}

function renderViewerTextureList(model, primary) {
  modelViewerTextureList.textContent = "";

  const details = document.createElement("dl");
  details.className = "viewer-detail-list";
  [
    ["File", model.fileName || "Unknown"],
    ["Internal", primary?.name || "Unknown"],
    ["Skeleton", primary?.skeleton || "Not used"]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    details.append(dt, dd);
  });

  const heading = document.createElement("h3");
  heading.textContent = "Textures";
  modelViewerTextureList.append(details, heading, textureChips(model));
}

function viewerModelShape(model) {
  const type = String(model.assetType || "").toLowerCase();
  if (type.includes("weapon")) return "is-weapon";
  if (type.includes("armor part")) return "is-armor-part";
  if (type.includes("cloak")) return "is-cloak";
  return "is-model";
}

function renderSelectionState() {
  const selected = selectedModels();
  const outputChosen = Boolean(mdbOutputPathField.value.trim());
  const diskBacked = selected.every((model) => isDiskPath(model.path));
  renderRaceTargets(selected);
  const jobs = buildRenameJobs(selected);
  const visibleCount = filteredModelEntries().length;
  selectionSummary.textContent = selected.length
    ? `${selected.length} selected / ${visibleCount} shown.`
    : `No models selected. ${visibleCount} shown.`;
  selectAllModelsButton.disabled = !currentModels.length;
  clearModelSelectionButton.disabled = !selected.length;
  removeSelectedModelsButton.disabled = !selected.length;
  viewFocusedModelButton.disabled = !viewerModelCandidate();
  cloneSelectedModelsButton.disabled = !selected.length || !outputChosen || !diskBacked || !jobs.length;
  if (document.activeElement !== showSelectedOnlyField && !mdbSummary.classList.contains("hidden")) {
    renderSummary(summarizeModels(currentModels));
  }
  renderRenamePreview(selected, diskBacked, jobs);
  requestConflictPreview(diskBacked, jobs);
}

function filteredModelEntries() {
  const query = modelSearchField.value.trim().toLowerCase();
  const type = modelTypeFilter.value;
  const selectedOnly = showSelectedOnlyField.checked;
  return currentModels
    .map((model, index) => ({ model, index }))
    .filter(({ model, index }) => {
      if (selectedOnly && !selectedModelIndexes.has(index)) return false;
      if (type && model.assetType !== type) return false;
      if (!query) return true;
      const haystack = [
        model.fileName,
        model.relativePath,
        model.assetType,
        ...textureReferences(model).map((item) => item.value),
        ...flatFlags(model).map((flag) => flag.label),
        ...(model.packets || []).map((packet) => `${packet.name || ""} ${packet.type || ""} ${packet.skeleton || ""}`)
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
}

function renderTypeFilterOptions() {
  const current = modelTypeFilter.value;
  const types = [...new Set(currentModels.map((model) => model.assetType).filter(Boolean))].sort();
  modelTypeFilter.textContent = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "All";
  modelTypeFilter.appendChild(all);
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    modelTypeFilter.appendChild(option);
  });
  modelTypeFilter.value = types.includes(current) ? current : "";
}

function safetyChecklist(selected, diskBacked, jobs) {
  return [
    { label: "Copies only", ok: true },
    { label: "Internal packet names", ok: Boolean(jobs.length) },
    { label: cloneMode() === "race" ? "Skeleton refs synced" : "Skeleton refs preserved", ok: true },
    { label: "Textures reused", ok: true },
    { label: `Conflicts: ${conflictLabel()}`, ok: mdbConflictModeField.value !== "overwrite" },
    { label: diskBacked ? "Disk paths ready" : "Needs folder scan", ok: diskBacked },
    { label: `${selected.length} selected`, ok: Boolean(selected.length) }
  ];
}

function conflictLabel() {
  return {
    auto: "Auto-number",
    skip: "Skip",
    overwrite: "Overwrite"
  }[mdbConflictModeField.value] || "Auto-number";
}

function renderRenamePreview(selected, diskBacked, preview = buildRenameJobs(selected)) {
  renamePreview.textContent = "";
  if (!selected.length) {
    renamePreview.classList.add("hidden");
    return;
  }

  const notice = document.createElement("p");
  if (!diskBacked) {
    notice.textContent = "Imported browser files can be inspected here, but batch cloning needs models scanned from a folder path.";
  } else if (!preview.length && cloneMode() === "race") {
    notice.textContent = "Choose at least one same-gender destination race to preview cloned names.";
  } else {
    notice.textContent = cloneMode() === "race"
      ? "Preview: race code changes, part code overrides, optional numbering, matching packet names, and SKIN skeleton reference strings will be written into copied model files."
      : "Preview: file name and matching internal packet names will be changed in the copies.";
  }
  renamePreview.appendChild(notice);

  const checks = safetyChecklist(selected, diskBacked, preview);
  const checklist = document.createElement("div");
  checklist.className = "safety-checklist";
  checks.forEach((check) => {
    const item = document.createElement("span");
    item.className = `safety-item ${check.ok ? "ok" : "warn"}`;
    item.textContent = check.label;
    checklist.appendChild(item);
  });
  renamePreview.appendChild(checklist);
  renamePreview.appendChild(conflictNotice(diskBacked, preview));

  const list = document.createElement("div");
  list.className = "preview-list";
  preview.forEach((job) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    const internalChanges = previewInternalNameChanges(job);
    const skeletonChanges = previewSkeletonRefChanges(job);
    item.textContent = `${stem(job.model.fileName)} -> ${job.newName}.mdb | Internal packets: ${internalChanges.length} | Skeleton refs: ${skeletonChanges.length}`;
    const detail = previewSyncDetail(internalChanges, skeletonChanges);
    if (detail) {
      const note = document.createElement("div");
      note.className = "preview-item-note";
      note.textContent = detail;
      item.appendChild(note);
    }
    list.appendChild(item);
  });
  renamePreview.appendChild(list);
  renamePreview.classList.remove("hidden");
}

function previewInternalNameChanges(job) {
  if (MDB_SHARED.internalNameSyncPlan) return MDB_SHARED.internalNameSyncPlan(job.model, job.newName);
  return [];
}

function previewSkeletonRefChanges(job) {
  if (MDB_SHARED.skeletonRefSyncPlan) return MDB_SHARED.skeletonRefSyncPlan(job.model, job.newName);
  const skeletonChange = previewSkeletonChange(job);
  return skeletonChange ? [skeletonChange] : [];
}

function previewSyncDetail(internalChanges, skeletonChanges) {
  const samples = [];
  internalChanges.slice(0, 2).forEach((change) => samples.push(`${change.oldName} -> ${change.newName}`));
  skeletonChanges.slice(0, 1).forEach((change) => {
    const oldName = change.oldSkeleton || change.from;
    const newName = change.newSkeleton || change.to;
    samples.push(`${oldName} -> ${newName}`);
  });
  const remaining = internalChanges.length + skeletonChanges.length - samples.length;
  if (remaining > 0) samples.push(`+${remaining} more`);
  return samples.join(" | ");
}

function previewSkeletonChange(job) {
  const sourceSkeleton = firstSkinPacket(job.model)?.skeleton || "";
  if (!sourceSkeleton) return null;

  const oldRace = modelRaceCode(stem(job.model.fileName));
  const newRace = modelRaceCode(job.newName);
  if (!oldRace || !newRace || oldRace === newRace) return null;
  const oldSkeletonRace = skeletonRaceForModelRace(oldRace);
  const newSkeletonRace = skeletonRaceForModelRace(newRace);
  if (oldSkeletonRace === newSkeletonRace) return null;

  const match = sourceSkeleton.match(/^([A-Za-z]_)([A-Za-z0-9]{3})(_skel)$/i);
  if (!match || match[2].toUpperCase() !== oldSkeletonRace) return null;
  return { from: sourceSkeleton, to: `${match[1]}${newSkeletonRace}${match[3]}` };
}

function firstSkinPacket(model) {
  return (model?.packets || []).find((packet) => packet.type === "SKIN" && packet.skeleton);
}

function modelRaceCode(value) {
  const match = String(value || "").match(/^[A-Za-z]_([A-Za-z0-9]{3})(?:_|$)/);
  return match ? match[1].toUpperCase() : "";
}

function skeletonRaceForModelRace(raceCode) {
  const code = String(raceCode || "").toUpperCase();
  if (code.length !== 3) return code;
  if (code.slice(0, 2) === "OG") return `OO${code.slice(-1)}`;
  return code;
}

function conflictNotice(diskBacked, jobs) {
  const wrap = document.createElement("div");
  wrap.className = "conflict-notice";
  if (!diskBacked || !jobs.length || !mdbOutputPathField.value.trim()) return wrap;

  if (conflictPreviewState.loading) {
    wrap.textContent = "Checking output folder for existing files...";
    return wrap;
  }

  if (conflictPreviewState.error) {
    wrap.classList.add("warn");
    wrap.textContent = `Could not check output conflicts: ${conflictPreviewState.error}`;
    return wrap;
  }

  const conflicts = conflictPreviewState.conflicts || [];
  const duplicates = conflictPreviewState.duplicates || [];
  if (!conflicts.length && !duplicates.length) {
    wrap.classList.add("ok");
    wrap.textContent = "No target name conflicts found in the output folder.";
    return wrap;
  }

  wrap.classList.add("warn");
  const mode = conflictLabel().toLowerCase();
  const line = document.createElement("p");
  line.textContent = `${conflicts.length} existing target${conflicts.length === 1 ? "" : "s"} and ${duplicates.length} repeated planned name${duplicates.length === 1 ? "" : "s"} found. Conflict mode: ${mode}.`;
  wrap.appendChild(line);

  const list = document.createElement("div");
  list.className = "conflict-list";
  conflicts.slice(0, 5).forEach((item) => {
    const row = document.createElement("span");
    row.textContent = `Exists: ${item.name}`;
    list.appendChild(row);
  });
  duplicates.slice(0, 5).forEach((item) => {
    const row = document.createElement("span");
    row.textContent = `Repeated: ${item.name}`;
    list.appendChild(row);
  });
  const hidden = conflicts.length + duplicates.length - list.children.length;
  if (hidden > 0) {
    const more = document.createElement("span");
    more.textContent = `+${hidden} more`;
    list.appendChild(more);
  }
  wrap.appendChild(list);
  return wrap;
}

function requestConflictPreview(diskBacked, jobs) {
  const outputDir = mdbOutputPathField.value.trim();
  const key = diskBacked && outputDir && jobs.length
    ? `${outputDir}|${jobs.map((job) => `${job.model.path}->${job.newName}`).join("|")}`
    : "";

  if (!key) {
    conflictPreviewState = { key: "", loading: false, conflicts: [], duplicates: [], error: "" };
    clearTimeout(conflictPreviewTimer);
    return;
  }
  if (conflictPreviewState.key === key && !conflictPreviewState.loading) return;

  conflictPreviewState = { key, loading: true, conflicts: [], duplicates: [], error: "" };
  clearTimeout(conflictPreviewTimer);
  conflictPreviewTimer = setTimeout(async () => {
    try {
      const response = await fetch("/api/mdb/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputDir,
          jobs: jobs.map((job) => ({ path: job.model.path, newName: job.newName }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Conflict check failed.");
      if (conflictPreviewState.key !== key) return;
      conflictPreviewState = {
        key,
        loading: false,
        conflicts: result.conflicts || [],
        duplicates: result.duplicates || [],
        error: ""
      };
    } catch (error) {
      if (conflictPreviewState.key !== key) return;
      conflictPreviewState = { key, loading: false, conflicts: [], duplicates: [], error: error.message };
    }
    const selected = selectedModels();
    renderRenamePreview(selected, selected.every((model) => isDiskPath(model.path)), buildRenameJobs(selected));
  }, 250);
}

async function cloneSelectedModels() {
  const selected = selectedModels();
  const jobs = buildRenameJobs(selected).map((job) => ({
    path: job.model.path,
    newName: job.newName
  }));

  cloneSelectedModelsButton.disabled = true;
  cloneSelectedModelsButton.textContent = "Cloning...";
  setStatus("Writing cloned model copies...");

  try {
    const response = await fetch("/api/mdb/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outputDir: mdbOutputPathField.value.trim(),
        conflictMode: mdbConflictModeField.value,
        jobs
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not clone selected models.");
    currentSourceMode = "folder";
    const createdPaths = createdPathsFromResult(result);
    renderMdbScanResult({ summary: summarizeModels(result.models), models: result.models });
    lastCreatedBatchPaths = createdPaths;
    renderBatchResult(result);
    setStatus(`Created ${result.copied} cloned model${result.copied === 1 ? "" : "s"} in ${result.outputDir}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    cloneSelectedModelsButton.disabled = false;
    cloneSelectedModelsButton.textContent = "Clone Selected";
    renderSelectionState();
  }
}

function buildRenameJobs(models) {
  if (cloneMode() === "race") {
    return buildRaceCloneJobs(models);
  }

  const start = Number(mdbStartNumberField.value || 1);
  const pattern = mdbNamePatternField.value.trim();
  return models.map((model, offset) => {
    const original = stem(model.fileName);
    return {
      model,
      newName: formatPattern(pattern || `${original}_Copy{##}`, original, start + offset)
    };
  });
}

function buildRaceCloneJobs(models) {
  const targets = selectedRaceTargets();
  const partOverride = cleanCode(mdbPartCodeField.value, 4);
  const startText = mdbUseNumberOverrideField.checked ? mdbRaceStartNumberField.value.trim() : "";
  const start = startText === "" ? null : Number(startText);
  const jobs = [];

  models.forEach((model, modelIndex) => {
    const parsed = parsePartName(stem(model.fileName));
    if (!parsed) return;
    targets
      .filter((target) => target.endsWith(parsed.gender))
      .forEach((target) => {
        const number = start === null ? null : String(start + modelIndex).padStart(parsed.numberLength || 2, "0");
        const targetRace = applyCaseStyle(parsed.raceCodeText, target);
        const partCode = parsed.hasArmorCode ? (partOverride || parsed.partCodeText || parsed.partCode) : "";
        jobs.push({
          model,
          newName: joinModelName(parsed.prefixText || parsed.prefix, targetRace, partCode, number === null ? parsed.tail : replaceTailNumber(parsed.tail, number))
        });
      });
  });

  return jobs;
}

function selectedRaceTargets() {
  const checked = [...mdbRaceTargets.querySelectorAll("input[type='checkbox']:checked")].map((field) => field.value);
  const custom = cleanCode(mdbCustomRaceField.value, 3);
  if (custom.length === 3) checked.push(custom);
  return [...new Set(checked)];
}

function formatPattern(pattern, original, number) {
  return pattern
    .replace(/\{name\}/gi, original)
    .replace(/\{index\}/gi, String(number))
    .replace(/\{(#+)\}/g, (_, hashes) => String(number).padStart(hashes.length, "0"))
    .replace(/[<>:"/\\|?*]/g, "")
    .slice(0, 31);
}

function selectModels(indexes) {
  selectedModelIndexes = new Set(indexes);
  focusedModelIndex = indexes[0] ?? focusedModelIndex;
  renderModelRows();
  renderModelDetails();
  renderSelectionState();
}

function removeSelectedModels() {
  if (!selectedModelIndexes.size) return;
  const removed = selectedModelIndexes.size;
  currentModels = currentModels.filter((_, index) => !selectedModelIndexes.has(index));
  selectedModelIndexes = new Set();
  focusedModelIndex = currentModels.length ? Math.min(focusedModelIndex || 0, currentModels.length - 1) : null;
  renderSummary(summarizeModels(currentModels));
  renderModelRows();
  renderModelDetails();
  renderSelectionState();
  setStatus(`Removed ${removed} model${removed === 1 ? "" : "s"} from the list. Files were not changed.`);
}

function renderBatchResult(result) {
  batchResultSummary.textContent = "";
  const skipped = (result.skipped || []).length;
  const internalChanges = (result.results || []).reduce((total, item) => total + (item.internalNameChanges || []).length, 0);
  const skeletonChanges = (result.results || []).reduce((total, item) => total + (item.skeletonChanges || []).length, 0);
  const line = document.createElement("p");
  const syncParts = [];
  if (internalChanges) syncParts.push(`Synced ${internalChanges} internal packet name${internalChanges === 1 ? "" : "s"}.`);
  if (skeletonChanges) syncParts.push(`Synced ${skeletonChanges} skeleton reference${skeletonChanges === 1 ? "" : "s"}.`);
  line.textContent = `Created ${result.copied || 0} MDBs${skipped ? `, skipped ${skipped} conflicts` : ""}. ${syncParts.join(" ")} Textures were reused, not copied.`;
  batchResultSummary.appendChild(line);
  const details = document.createElement("div");
  details.className = "batch-result-details";
  (result.results || []).slice(0, 5).forEach((item) => {
    const row = document.createElement("span");
    const internalCount = (item.internalNameChanges || []).length;
    const skeletonCount = (item.skeletonChanges || []).length;
    row.textContent = `Created: ${item.newName || stem(item.outputPath || "")} | Internal ${internalCount} | Skeleton ${skeletonCount}`;
    details.appendChild(row);
  });
  (result.skipped || []).slice(0, 5).forEach((item) => {
    const row = document.createElement("span");
    row.textContent = `Skipped: ${stem(item.outputPath || "")}`;
    details.appendChild(row);
  });
  if (details.children.length) batchResultSummary.appendChild(details);
  if (lastCreatedBatchPaths.length) {
    const undo = document.createElement("button");
    undo.type = "button";
    undo.textContent = "Undo Last Batch";
    undo.addEventListener("click", undoLastBatch);
    batchResultSummary.appendChild(undo);
  }
  batchResultSummary.classList.remove("hidden");
}

function createdPathsFromResult(result) {
  const paths = [];
  (result.results || []).forEach((item) => {
    if (item.outputPath) paths.push(item.outputPath);
  });
  return paths;
}

async function undoLastBatch() {
  if (!lastCreatedBatchPaths.length) return;
  setStatus("Removing files created by the last batch...");
  try {
    const response = await fetch("/api/mdb/delete-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: lastCreatedBatchPaths })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not undo last batch.");
    const deleted = new Set(result.deleted || []);
    currentModels = currentModels.filter((model) => !deleted.has(model.path));
    selectedModelIndexes = new Set();
    focusedModelIndex = currentModels.length ? 0 : null;
    lastCreatedBatchPaths = [];
    renderSummary(summarizeModels(currentModels));
    renderTypeFilterOptions();
    renderModelRows();
    renderModelDetails();
    renderSelectionState();
    batchResultSummary.classList.add("hidden");
    setStatus(`Removed ${result.deleted.length} file${result.deleted.length === 1 ? "" : "s"} from the last batch.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function selectedModels() {
  return [...selectedModelIndexes].sort((a, b) => a - b).map((index) => currentModels[index]).filter(Boolean);
}

function renderRaceTargets(selected) {
  if (cloneMode() !== "race") return;

  const parsedModels = selected.map((model) => parsePartName(stem(model.fileName))).filter(Boolean);
  const genders = [...new Set(parsedModels.map((model) => model.gender))];
  const gender = genders.length === 1 ? genders[0] : null;
  const wearOnly = parsedModels.length ? parsedModels.every(isStandardWearModel) : false;
  const previous = selectedRaceTargets();
  mdbRaceTargets.textContent = "";

  if (!selected.length) {
    const empty = document.createElement("p");
    empty.textContent = "Select a model to see matching race destinations.";
    mdbRaceTargets.appendChild(empty);
    return;
  }

  if (!gender) {
    const empty = document.createElement("p");
    empty.textContent = "Select models from one gender at a time for race copying.";
    mdbRaceTargets.appendChild(empty);
    return;
  }

  const options = wearOnly
    ? raceOptionsForSex(gender).filter(([code]) => STANDARD_WEAR_BASES.has(code.slice(0, 2)))
    : (RACE_OPTIONS[gender] || []);

  options.forEach(([code, label]) => {
    const item = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    const codeText = document.createElement("strong");
    const labelText = document.createElement("small");
    input.type = "checkbox";
    input.value = code;
    input.checked = previous.includes(code);
    input.addEventListener("change", renderSelectionState);
    codeText.textContent = code;
    labelText.textContent = label;
    text.append(codeText, labelText);
    item.append(input, text);
    mdbRaceTargets.appendChild(item);
  });
}

function parsePartName(name) {
  const match = String(name || "").match(/^([PA])_([A-Za-z]{3})_(.+)$/i);
  if (!match) return null;
  const prefix = match[1].toUpperCase();
  const raceCode = match[2].toUpperCase();
  const remainder = match[3];
  const parts = remainder.split("_");
  const hasArmorCode = prefix === "P" && parts.length >= 2 && /^[A-Za-z0-9]{1,4}$/.test(parts[0]) && !/^(Head|Hair)$/i.test(parts[0]);
  const partCode = hasArmorCode ? parts[0].toUpperCase() : "";
  const tail = hasArmorCode ? parts.slice(1).join("_") : remainder;
  const numberMatch = tail.match(/(\d+)(?!.*\d)/);
  return {
    prefix,
    prefixText: match[1],
    raceCode,
    raceCodeText: match[2],
    gender: raceCode.slice(-1),
    partCode,
    partCodeText: hasArmorCode ? parts[0] : "",
    tail,
    hasArmorCode,
    numberLength: numberMatch ? numberMatch[1].length : 2
  };
}

function applyCaseStyle(template, value) {
  const text = String(template || "");
  const next = String(value || "");
  if (text && text === text.toLowerCase()) return next.toLowerCase();
  if (text && text === text.toUpperCase()) return next.toUpperCase();
  return next;
}

function isStandardWearModel(parsed) {
  const tail = parsed.tail.toLowerCase();
  return parsed.prefix === "P" && STANDARD_WEAR_TAILS.some((slot) => tail.startsWith(slot.toLowerCase()));
}

function replaceTailNumber(tail, number) {
  if (/\d+(?!.*\d)/.test(tail)) {
    return tail.replace(/\d+(?!.*\d)/, number);
  }
  return `${tail}${number}`;
}

function joinModelName(prefix, raceCode, partCode, tail) {
  return [prefix, raceCode, partCode, tail].filter(Boolean).join("_");
}

function raceOptionsForSex(sex) {
  return RACE_BASES.map(([code, label]) => [`${code}${sex}`, label]);
}

function cloneMode() {
  return cloneModeFields.find((field) => field.checked)?.value || "race";
}

function updateCloneModeVisibility() {
  const raceMode = cloneMode() === "race";
  raceCloneOptions.classList.toggle("hidden", !raceMode);
  manualCloneOptions.classList.toggle("hidden", raceMode);
}

function summarizeModels(models) {
  const types = new Set(models.map((model) => model.assetType).filter(Boolean));
  return {
    total: models.length,
    withTextures: models.filter((model) => textureReferences(model).some((item) => item.value)).length,
    types: types.size
  };
}

function modelKey(model) {
  return `${model.path || ""}|${model.fileName || ""}`;
}

function factualStatus(status) {
  if (MDB_SHARED.factualStatus) return MDB_SHARED.factualStatus(status);
  return status || "Parsed";
}

function headingBlock(fileName) {
  const wrap = document.createElement("div");
  const heading = document.createElement("h2");
  heading.textContent = fileName;
  wrap.appendChild(heading);
  return wrap;
}

function detailList(items) {
  const dl = document.createElement("dl");
  dl.className = "details-list";
  items.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value || "None";
    dl.append(dt, dd);
  });
  return dl;
}

function materialVisuals(material) {
  const section = document.createElement("section");
  const title = document.createElement("h2");
  const grid = document.createElement("div");
  const numbers = document.createElement("dl");
  const color = material.specularColor || [1, 1, 1];
  const glossiness = Number(material.glossiness || 0);
  const intensity = Number(material.specularIntensity || 0);

  title.textContent = "Material Shine";
  grid.className = "material-visuals";
  numbers.className = "material-numbers";
  grid.append(
    visualTile("Specular Color", specularSwatch(color), formatValue(color)),
    visualTile("Shine Preview", shinePreview(color, glossiness, intensity), `Glossiness ${formatValue(glossiness)} / Intensity ${formatValue(intensity)}`)
  );
  [
    ["Specular Color", formatValue(color)],
    ["Glossiness", formatValue(glossiness)],
    ["Specular Intensity", formatValue(intensity)],
    ["Visual Shine", shineTier(glossiness, intensity).label]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    numbers.append(dt, dd);
  });
  section.append(title, grid, numbers);
  return section;
}

function textureChips(model) {
  const wrap = document.createElement("div");
  wrap.className = "texture-chip-row";
  const refs = textureReferences(model);
  const available = refs.filter((item) => item.value);
  if (!available.length) {
    const empty = document.createElement("span");
    empty.className = "texture-chip muted";
    empty.textContent = "None";
    wrap.appendChild(empty);
    return wrap;
  }

  available.slice(0, 4).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "texture-chip";
    const kind = document.createElement("strong");
    const value = document.createElement("span");
    kind.textContent = item.short;
    value.textContent = item.value;
    chip.title = `${item.label}: ${item.value}`;
    chip.append(kind, value);
    wrap.appendChild(chip);
  });
  return wrap;
}

function textureReferences(model) {
  const packets = materialPackets(model);
  const byKey = new Map();
  packets.forEach((packet) => {
    TEXTURE_REFERENCE_FIELDS.forEach((field) => {
      const value = packet.material?.[field.key];
      if (value && !byKey.has(field.key)) byKey.set(field.key, value);
    });
  });
  return TEXTURE_REFERENCE_FIELDS.map((field) => ({ ...field, value: byKey.get(field.key) || "" }));
}

function syncPanel(model) {
  const section = document.createElement("section");
  const title = document.createElement("h2");
  const grid = document.createElement("div");
  const fileStem = stem(model.fileName);
  const visiblePackets = visibleModelPackets(model);
  const primary = primaryPacket(model);
  const internalNames = [...new Set(visiblePackets.map((packet) => packet.name).filter(Boolean))];
  const textureRefs = materialReferenceNames(model);
  const primaryMatches = sameName(fileStem, primary?.name);

  title.textContent = "Internal Sync";
  grid.className = "sync-grid";
  grid.append(
    syncCard("File", fileStem || "Unknown", "Source name"),
    syncCard("Primary", primary?.name || "Unknown", primaryMatches ? "Same as file" : "Different"),
    syncCard("Sections", `${internalNames.length || visiblePackets.length}`, "Main model only"),
    syncCard("Textures", `${textureRefs.length}`, "Reused from source")
  );
  section.append(title, grid);
  return section;
}

function syncCard(label, value, state) {
  const card = document.createElement("div");
  const name = document.createElement("span");
  const main = document.createElement("strong");
  const note = document.createElement("small");
  card.className = "sync-card";
  name.textContent = label;
  main.textContent = value;
  note.textContent = state;
  card.append(name, main, note);
  return card;
}

function materialReferenceNames(model) {
  const refs = new Set();
  materialPackets(model).forEach((packet) => {
    TEXTURE_REFERENCE_FIELDS.map((field) => field.key).forEach((key) => {
      const value = packet.material?.[key];
      if (value) refs.add(value);
    });
  });
  return [...refs];
}

function visualTile(label, visual, title) {
  const tile = document.createElement("div");
  const caption = document.createElement("span");
  tile.className = "material-tile";
  tile.title = title;
  caption.textContent = label;
  tile.append(visual, caption);
  return tile;
}

function specularSwatch(color) {
  const swatch = document.createElement("span");
  swatch.className = "specular-swatch";
  swatch.style.background = rgbCss(color);
  return swatch;
}

function shinePreview(color, glossiness, intensity) {
  const preview = document.createElement("span");
  const tier = shineTier(glossiness, intensity);
  const highlightSize = tier.highlightSize;
  const highlightCore = tier.highlightCore;
  const highlightSoftness = tier.highlightSoftness;
  const alpha = tier.alpha;
  const tint = rgbValues(color).join(", ");
  preview.className = "shine-preview";
  preview.dataset.tier = String(tier.level);
  preview.style.setProperty("--shine-size", `${highlightSize}%`);
  preview.style.setProperty("--shine-core", `${highlightCore}%`);
  preview.style.setProperty("--shine-softness", `${highlightSoftness}%`);
  preview.style.setProperty("--shine-alpha", alpha.toFixed(3));
  preview.style.setProperty("--shine-glow-alpha", clamp(alpha * 0.42, 0.08, 0.42).toFixed(3));
  preview.style.setProperty("--shine-tint", tint);
  preview.style.setProperty("--sphere-light", tier.light);
  preview.style.setProperty("--sphere-mid", tier.mid);
  preview.style.setProperty("--sphere-dark", tier.dark);
  preview.style.setProperty("--sphere-contrast", tier.contrast.toFixed(3));
  preview.title = `${tier.label}: glossiness ${formatValue(glossiness)}, specular intensity ${formatValue(intensity)}`;
  return preview;
}

function shineTier(glossiness, intensity) {
  const glossScore = clamp(glossiness / 3, 0, 1);
  const intensityScore = clamp(intensity / 80, 0, 1);
  const score = clamp((glossScore * 0.6) + (intensityScore * 0.4), 0, 1);
  const level = clamp(Math.round(score * 19) + 1, 1, 20);
  const names = [
    "Very Matte",
    "Matte",
    "Dry Cloth",
    "Soft Cloth",
    "Soft Leather",
    "Leather",
    "Waxed Leather",
    "Low Satin",
    "Satin",
    "Clean Satin",
    "Low Metal",
    "Soft Metal",
    "Medium Metal",
    "Bright Metal",
    "Polished Metal",
    "Hard Polish",
    "Sharp Polish",
    "Mirror Edge",
    "High Mirror",
    "Blinding Metal"
  ];
  const normalized = (level - 1) / 19;
  return {
    level,
    label: `${level}/20 ${names[level - 1]}`,
    highlightCore: 16 - normalized * 12,
    highlightSize: 62 - normalized * 52,
    highlightSoftness: 84 - normalized * 66,
    alpha: 0.12 + normalized * 0.86,
    light: String(Math.round(168 + normalized * 86)),
    mid: String(Math.round(112 + normalized * 72)),
    dark: String(Math.round(72 - normalized * 54)),
    contrast: 0.14 + normalized * 0.66
  };
}

function packetList(model) {
  const section = document.createElement("section");
  const title = document.createElement("h2");
  const list = document.createElement("div");
  title.textContent = "Model Sections";
  list.className = "packet-list";
  nonLodPackets(model).forEach((packet) => {
    const hasMaterial = Boolean(packet.material && Object.keys(packet.material).length);
    const item = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("span");
    item.className = "packet-item";
    name.textContent = packet.name || packet.type;
    meta.textContent = hasMaterial
      ? `${materialPacketLabel(model, packet)} / ${packet.type} / ${textureCountForPacket(packet)} texture slot${textureCountForPacket(packet) === 1 ? "" : "s"}`
      : packetKindLabel(packet);
    item.append(name, meta);
    list.appendChild(item);
  });
  section.append(title, list);
  return section;
}

function flagsPanel(model) {
  const section = document.createElement("section");
  const title = document.createElement("h2");
  const groups = flagGroups(model);
  title.textContent = "Material Flags";
  section.appendChild(title);

  if (!groups.length) {
    const empty = document.createElement("p");
    empty.textContent = "No editable flags found.";
    section.appendChild(empty);
    return section;
  }

  const wrap = document.createElement("div");
  wrap.className = "flag-groups";
  groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "flag-group";
    const heading = document.createElement("h3");
    heading.textContent = group.title;
    const grid = document.createElement("div");
    grid.className = "flag-grid";
    group.flags.forEach((flag) => grid.appendChild(flagBox(flag)));
    groupEl.append(heading, grid);
    wrap.appendChild(groupEl);
  });
  section.appendChild(wrap);
  return section;
}

function flagBox(flag) {
  const label = document.createElement("label");
  label.className = "flag-box";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(flag.checked);
  input.disabled = true;
  const visual = document.createElement("span");
  visual.className = "flag-check";
  visual.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = flag.label;
  label.append(input, visual, text);
  return label;
}

function flagGroups(model) {
  const groups = [];
  const packets = nonLodPackets(model);
  const hairPacket = packets.find((packet) => packet.type === "HAIR");
  const helmPacket = packets.find((packet) => packet.type === "HELM");
  const hookPackets = packets.filter((packet) => packet.type === "HOOK");
  const walkPacket = packets.find((packet) => packet.type === "WALK");

  if (hairPacket?.behavior?.hairShortening) {
    groups.push({
      title: "Hair Shape",
      flags: HAIR_FLAG_DEFINITIONS.map(([value, label]) => ({
        label,
        checked: hairPacket.behavior.hairShortening === value
      }))
    });
  }

  if (helmPacket?.behavior?.helmetHairHiding) {
    groups.push({
      title: "Helmet Visibility",
      flags: HELMET_FLAG_DEFINITIONS.map(([value, label]) => ({
        label,
        checked: helmPacket.behavior.helmetHairHiding === value
      }))
    });
  }

  hookPackets.forEach((packet, index) => {
    const size = packet.behavior?.hookPointSize;
    const type = packet.behavior?.hookPointType;
    groups.push({
      title: `Hook ${index + 1}`,
      flags: [
        { label: `Size ${formatRawFlagValue(size)}`, checked: size !== undefined },
        { label: `Type ${formatRawFlagValue(type)}`, checked: type !== undefined }
      ]
    });
  });

  if (walkPacket?.behavior?.surfaceFlags !== undefined) {
    groups.push({
      title: "Walk Surface",
      flags: [{ label: `Surface ${formatRawFlagValue(walkPacket.behavior.surfaceFlags)}`, checked: true }]
    });
  }

  materialPackets(model).forEach((packet) => {
    groups.push({
      title: packet.name ? `Material: ${packet.name}` : `Material: ${packet.type}`,
      flags: MATERIAL_FLAG_DEFINITIONS.map(([key, label]) => ({
        label,
        checked: Boolean(packet.material?.renderingOptions?.[key])
      }))
    });
  });

  return groups;
}

function flatFlags(model) {
  return flagGroups(model).flatMap((group) => group.flags);
}

function materialPackets(model) {
  if (MDB_SHARED.allMaterialPackets) return MDB_SHARED.allMaterialPackets(model);
  return nonLodPackets(model).filter((packet) => packet.material && Object.keys(packet.material).length);
}

function textureCountForPacket(packet) {
  return TEXTURE_REFERENCE_FIELDS.filter((field) => packet.material?.[field.key]).length;
}

function formatRawFlagValue(value) {
  return value === undefined || value === null ? "Unknown" : value;
}

function fileMessageList(warnings) {
  if (!warnings.length) return document.createDocumentFragment();
  const section = document.createElement("section");
  const title = document.createElement("h2");
  title.textContent = "File Messages";
  section.appendChild(title);
  const list = document.createElement("ul");
  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning.message;
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

function primaryPacket(model) {
  if (MDB_SHARED.selectPrimaryMaterialPacket) {
    const primaryMaterial = MDB_SHARED.selectPrimaryMaterialPacket(model);
    if (primaryMaterial) return primaryMaterial;
  }
  const visible = visibleModelPackets(model);
  return visible.find((packet) => materialPacketRole(model, packet) === "primary")
    || visible.find((packet) => !["eyes", "facialHair", "lod"].includes(materialPacketRole(model, packet)))
    || visible[0]
    || nonLodPackets(model)[0]
    || (model.packets || [])[0];
}

function visibleModelPackets(model) {
  return nonLodPackets(model).filter((packet) => packet.type === "SKIN" || packet.type === "RIGD");
}

function materialPacketRole(model, packet) {
  if (MDB_SHARED.packetRole) return MDB_SHARED.packetRole(model, packet);
  return packet?.materialRole || "other";
}

function materialPacketLabel(model, packet) {
  if (MDB_SHARED.packetLabel) return MDB_SHARED.packetLabel(model, packet);
  return packet?.materialLabel || "Material Packet";
}

function packetKindLabel(packet) {
  if (MDB_SHARED.packetKindLabel) return MDB_SHARED.packetKindLabel(packet);
  return packet?.type || "Packet";
}

function nonLodPackets(model) {
  if (MDB_SHARED.nonLodPackets) return MDB_SHARED.nonLodPackets(model);
  return (model.packets || []).filter((packet) => !isLodName(packet.name));
}

function isLodName(name) {
  return /(?:_L\d+|_LO\d+|_LOD\d+)$/i.test(String(name || ""));
}

function formatValue(value) {
  if (Array.isArray(value)) return value.map((number) => Number(number).toFixed(3)).join(", ");
  if (typeof value === "number") return Number(value).toFixed(3);
  return value || "None";
}

function rgbCss(color) {
  const [r, g, b] = rgbValues(color);
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbValues(color) {
  return color.map((value) => Math.round(clamp(Number(value || 0), 0, 1) * 255));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function textCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function stem(fileName) {
  return String(fileName || "").replace(/\.[^.]+$/, "");
}

function sameName(left, right) {
  return String(left || "").toLowerCase() === String(right || "").toLowerCase();
}

function includesName(value, name) {
  return Boolean(value && name && String(value).toLowerCase().includes(String(name).toLowerCase()));
}

function cleanCode(value, maxLength) {
  return String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, maxLength);
}

function isDiskPath(path) {
  return /^([a-zA-Z]:[\\/]|\\\\)/.test(path || "");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function showElement(element) {
  element.classList.remove("hidden");
  element.style.display = "";
}

async function collectDroppedFiles(dataTransfer) {
  const items = [...(dataTransfer.items || [])];
  if (!items.length) return [...(dataTransfer.files || [])].map((file) => ({ file, path: file.name }));

  const entries = items.map((item) => item.webkitGetAsEntry ? item.webkitGetAsEntry() : null).filter(Boolean);
  if (!entries.length) return [...(dataTransfer.files || [])].map((file) => ({ file, path: file.name }));

  const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
  return nested.flat();
}

function readEntry(entry) {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file((file) => resolve([{ file, path: entry.fullPath.replace(/^\/+/, "") || file.name }]), reject);
    });
  }
  if (!entry.isDirectory) return Promise.resolve([]);

  const reader = entry.createReader();
  return new Promise((resolve, reject) => {
    const entries = [];
    const readBatch = () => {
      reader.readEntries(async (batch) => {
        if (!batch.length) {
          try {
            const nested = await Promise.all(entries.map((child) => readEntry(child)));
            resolve(nested.flat());
          } catch (error) {
            reject(error);
          }
          return;
        }
        entries.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });
}
