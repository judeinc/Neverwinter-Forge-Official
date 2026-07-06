const editorRootPathField = document.querySelector("#editorRootPath");
const editorRecursiveField = document.querySelector("#editorRecursive");
const chooseEditorFolderButton = document.querySelector("#chooseEditorFolder");
const scanEditorFolderButton = document.querySelector("#scanEditorFolder");
const editorDropzone = document.querySelector("#editorDropzone");
const editorFileInput = document.querySelector("#editorFileInput");
const importEditorFilesButton = document.querySelector("#importEditorFiles");
const editorSummary = document.querySelector("#editorSummary");
const editorModelRows = document.querySelector("#editorModelRows");
const editorSearchField = document.querySelector("#editorSearch");
const editorTypeFilter = document.querySelector("#editorTypeFilter");
const editorSelectedOnlyField = document.querySelector("#editorSelectedOnly");
const editorChangedOnlyField = document.querySelector("#editorChangedOnly");
const editorSelectAllButton = document.querySelector("#editorSelectAll");
const editorClearSelectionButton = document.querySelector("#editorClearSelection");
const editorSelectionSummary = document.querySelector("#editorSelectionSummary");
const flagEditorPanel = document.querySelector("#flagEditorPanel");
const savePreviewPanel = document.querySelector("#savePreviewPanel");
const editorResultSummary = document.querySelector("#editorResultSummary");
const editorStatusEl = document.querySelector("#editorStatus");
const cloneOutMode = document.body.dataset.editorMode === "clone-out";
const cloneOutputPathField = document.querySelector("#cloneOutputPath");
const chooseCloneOutputFolderButton = document.querySelector("#chooseCloneOutputFolder");
const cloneNewNameField = document.querySelector("#cloneNewName");
const cloneNameSlotFields = [...document.querySelectorAll("[data-clone-name-slot]")];
const cloneConflictModeField = document.querySelector("#cloneConflictMode");

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
const MATERIAL_VALUE_DEFINITIONS = [
  { key: "diffuseColor", label: "Diffuse color", type: "color", palette: "diffuse" },
  { key: "specularColor", label: "Specular color", type: "color", palette: "specular" },
  { key: "glossiness", label: "Specular power", type: "number", min: 0, max: 3, step: 0.05 },
  { key: "specularIntensity", label: "Specular value", type: "number", min: 0, max: 100, step: 0.1 }
];
const TEXTURE_REFERENCE_FIELDS = [
  { key: "baseTexture", short: "D", label: "Diffuse" },
  { key: "normalMap", short: "N", label: "Normal" },
  { key: "tintMask", short: "T", label: "Tint" },
  { key: "glowMap", short: "G", label: "Glow" }
];
const SPECULAR_COLOR_PRESETS = [0, 20, 40, 60, 80, 100];
const DIFFUSE_COLOR_PRESETS = [
  ["Soft Warm", [0.88, 0.82, 0.70]],
  ["Warm Linen", [0.78, 0.71, 0.58]],
  ["Candle Low", [0.64, 0.54, 0.38]],
  ["Dusty Gold", [0.70, 0.64, 0.43]],
  ["Parchment", [0.74, 0.72, 0.60]],
  ["Neutral Light", [0.72, 0.72, 0.68]],
  ["Soft Stone", [0.58, 0.59, 0.56]],
  ["Deep Stone", [0.40, 0.41, 0.39]],
  ["Cool Day", [0.68, 0.72, 0.76]],
  ["Moonlit", [0.54, 0.60, 0.68]],
  ["Blue Shade", [0.42, 0.48, 0.56]],
  ["Green Shade", [0.45, 0.52, 0.45]],
  ["Leather Tan", [0.56, 0.44, 0.32]],
  ["Ash Brown", [0.42, 0.36, 0.31]],
  ["Low Ambient", [0.28, 0.29, 0.28]]
];
const DIFFUSE_FAVORITE_SLOTS = 5;
const DIFFUSE_FAVORITES_KEY = "neverwinterForge.diffuseColorFavorites";
const CLONE_OUT_SELECTION_LIMIT = 3;

let editorModels = [];
let selectedModelIndexes = new Set();
let focusedModelIndex = null;
let editorSelectionAnchorIndex = null;
let editorSourceMode = "folder";
let pendingEdits = emptyPendingEdits();
let changedModelKeys = new Set();
let diffuseColorFavorites = loadDiffuseFavorites();
let editorContextMenu = null;
let editorContextModelIndex = null;
let uploadedEditorFileMap = new Map();
let cloneOutModelSettings = new Map();

restoreEditorPreferences();
bindEditorControls();
renderEditorState();

function restoreEditorPreferences() {
  editorRootPathField.value = localStorage.getItem("neverwinterForge.mdbRootPath") || "";
  editorRecursiveField.checked = localStorage.getItem("neverwinterForge.mdbRecursive") !== "false";
  if (cloneOutMode && cloneOutputPathField) {
    cloneOutputPathField.value = localStorage.getItem("neverwinterForge.mdbCloneOutPath") || "";
  }
}

function bindEditorControls() {
  editorRootPathField.addEventListener("input", () => {
    localStorage.setItem("neverwinterForge.mdbRootPath", editorRootPathField.value);
  });
  editorRecursiveField.addEventListener("change", () => {
    localStorage.setItem("neverwinterForge.mdbRecursive", String(editorRecursiveField.checked));
  });
  chooseEditorFolderButton.addEventListener("click", chooseEditorFolder);
  scanEditorFolderButton.addEventListener("click", scanEditorFolder);
  if (chooseCloneOutputFolderButton) chooseCloneOutputFolderButton.addEventListener("click", chooseCloneOutputFolder);
  if (cloneOutputPathField) {
    cloneOutputPathField.addEventListener("input", () => {
      localStorage.setItem("neverwinterForge.mdbCloneOutPath", cloneOutputPathField.value);
      renderSavePreview();
    });
  }
  if (cloneNewNameField) {
    cloneNewNameField.addEventListener("input", () => {
      cloneNewNameField.dataset.autoName = "false";
      renderSavePreview();
    });
  }
  cloneNameSlotFields.forEach((field) => {
    field.addEventListener("input", () => {
      const target = editingTargets()[Number(field.dataset.cloneNameSlot || 0)];
      if (!target) return;
      updateCloneOutModelSetting(modelKey(target), "newName", cleanFixedName(field.value));
      renderSavePreview();
      updateCloneOutCreateButtonState();
    });
  });
  if (cloneConflictModeField) cloneConflictModeField.addEventListener("change", renderSavePreview);
  importEditorFilesButton.addEventListener("click", () => editorFileInput.click());
  editorFileInput.addEventListener("change", async () => {
    await importEditorFiles([...editorFileInput.files].map((file) => ({ file, path: file.name })));
    editorFileInput.value = "";
  });
  [editorSearchField, editorTypeFilter, editorSelectedOnlyField, editorChangedOnlyField].forEach((field) => {
    field.addEventListener("input", renderEditorState);
    field.addEventListener("change", renderEditorState);
  });
  editorSelectAllButton.addEventListener("click", () => {
    const visibleIndexes = filteredEditorEntries().map(({ index }) => index);
    const limitedIndexes = cloneOutMode ? visibleIndexes.slice(0, CLONE_OUT_SELECTION_LIMIT) : visibleIndexes;
    selectedModelIndexes = new Set(limitedIndexes);
    editorSelectionAnchorIndex = limitedIndexes[0] ?? null;
    pendingEdits = emptyPendingEdits();
    refreshCloneOutName();
    renderEditorState();
    if (cloneOutMode && visibleIndexes.length > CLONE_OUT_SELECTION_LIMIT) {
      setEditorStatus(`Edit + Clone can prepare ${CLONE_OUT_SELECTION_LIMIT} MDBs at a time.`);
    }
  });
  editorClearSelectionButton.addEventListener("click", () => {
    selectedModelIndexes = new Set();
    editorSelectionAnchorIndex = null;
    pendingEdits = emptyPendingEdits();
    refreshCloneOutName();
    renderEditorState();
  });
  document.addEventListener("click", hideEditorContextMenu);
  document.addEventListener("scroll", hideEditorContextMenu, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideEditorContextMenu();
  });

  editorDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    editorDropzone.classList.add("is-dragging");
  });
  editorDropzone.addEventListener("dragleave", () => editorDropzone.classList.remove("is-dragging"));
  editorDropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    editorDropzone.classList.remove("is-dragging");
    await importEditorFiles([...event.dataTransfer.files].map((file) => ({ file, path: file.webkitRelativePath || file.name })));
  });
  editorDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      editorFileInput.click();
    }
  });
}

async function chooseEditorFolder() {
  chooseEditorFolderButton.disabled = true;
  chooseEditorFolderButton.textContent = "Choosing...";
  setEditorStatus("Opening folder chooser...");
  try {
    const response = await fetch("/api/dialog/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialDir: editorRootPathField.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not choose folder.");
    if (!result.folder) {
      setEditorStatus("Folder choice cancelled.");
      return;
    }
    editorRootPathField.value = result.folder;
    localStorage.setItem("neverwinterForge.mdbRootPath", result.folder);
    setEditorStatus("Model folder selected. Scan when ready.");
  } catch (error) {
    setEditorStatus(error.message, true);
  } finally {
    chooseEditorFolderButton.disabled = false;
    chooseEditorFolderButton.textContent = "Choose Folder";
  }
}

async function chooseCloneOutputFolder() {
  if (!chooseCloneOutputFolderButton || !cloneOutputPathField) return;
  chooseCloneOutputFolderButton.disabled = true;
  chooseCloneOutputFolderButton.textContent = "Choosing...";
  setEditorStatus("Opening output folder chooser...");
  try {
    const response = await fetch("/api/dialog/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialDir: cloneOutputPathField.value.trim() || editorRootPathField.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not choose output folder.");
    if (!result.folder) {
      setEditorStatus("Output folder choice cancelled.");
      return;
    }
    cloneOutputPathField.value = result.folder;
    localStorage.setItem("neverwinterForge.mdbCloneOutPath", result.folder);
    renderSavePreview();
    setEditorStatus("Output folder selected.");
  } catch (error) {
    setEditorStatus(error.message, true);
  } finally {
    chooseCloneOutputFolderButton.disabled = false;
    chooseCloneOutputFolderButton.textContent = "Choose Output";
  }
}

async function scanEditorFolder() {
  const rootPath = editorRootPathField.value.trim();
  if (!rootPath) {
    setEditorStatus("Choose a model folder to scan.", true);
    editorRootPathField.focus();
    return;
  }

  scanEditorFolderButton.disabled = true;
  scanEditorFolderButton.textContent = "Scanning...";
  setEditorStatus("Scanning model files...");
  try {
    const response = await fetch("/api/mdb/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootPath, recursive: editorRecursiveField.checked, maxFiles: 2000 })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not scan model folder.");
    editorSourceMode = "folder";
    appendEditorScanResult(result);
    setEditorStatus(`Added ${result.summary.total} scanned model file${result.summary.total === 1 ? "" : "s"}.`);
  } catch (error) {
    setEditorStatus(error.message, true);
  } finally {
    scanEditorFolderButton.disabled = false;
    scanEditorFolderButton.textContent = "Scan Models";
  }
}

async function importEditorFiles(files) {
  const mdbFiles = files.filter((item) => item.file.name.toLowerCase().endsWith(".mdb"));
  if (!mdbFiles.length) {
    setEditorStatus("Drop or import MDB files to inspect.", true);
    return;
  }

  scanEditorFolderButton.disabled = true;
  importEditorFilesButton.disabled = true;
  setEditorStatus(`Importing ${mdbFiles.length} model file${mdbFiles.length === 1 ? "" : "s"}...`);
  try {
    const form = new FormData();
    mdbFiles.forEach((item) => {
      const uploadName = item.path || item.file.name;
      uploadedEditorFileMap.set(normalizeUploadKey(uploadName), item.file);
      uploadedEditorFileMap.set(normalizeUploadKey(item.file.name), item.file);
      form.append("files", item.file, uploadName);
    });
    const response = await fetch("/api/mdb/upload", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not import model files.");
    editorSourceMode = "import";
    appendEditorScanResult(result);
    setEditorStatus(`Added ${result.summary.total} imported model file${result.summary.total === 1 ? "" : "s"} for inspection.`);
  } catch (error) {
    setEditorStatus(error.message, true);
  } finally {
    scanEditorFolderButton.disabled = false;
    importEditorFilesButton.disabled = false;
  }
}

function appendEditorScanResult(result) {
  const existing = new Set(editorModels.map((model) => modelKey(model)));
  const additions = (result.models || []).filter((model) => {
    const key = modelKey(model);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });
  editorModels.push(...additions);
  if (focusedModelIndex === null && editorModels.length) focusedModelIndex = 0;
  if (cloneOutMode && additions.length && cloneNewNameField && !cloneNewNameField.value.trim()) {
    cloneNewNameField.value = defaultCloneOutName(additions[0]);
    cloneNewNameField.dataset.autoName = "true";
  }
  refreshCloneOutName();
  selectedModelIndexes = new Set([...selectedModelIndexes].filter((index) => editorModels[index]));
  if (editorSelectionAnchorIndex !== null && !editorModels[editorSelectionAnchorIndex]) editorSelectionAnchorIndex = null;
  pendingEdits = emptyPendingEdits();
  renderEditorState();
}

function renderEditorState() {
  renderEditorSummary();
  renderEditorTypeOptions();
  renderEditorRows();
  renderFlagEditor();
  renderSavePreview();
}

function renderEditorSummary() {
  const types = new Set(editorModels.map((model) => model.assetType || "Model"));
  editorSummary.innerHTML = `
    <div class="mdb-summary-card"><strong>Total</strong><span>${editorModels.length}</span></div>
    <div class="mdb-summary-card"><strong>Selected</strong><span>${selectedModelIndexes.size}</span></div>
    <div class="mdb-summary-card"><strong>Types</strong><span>${types.size}</span></div>
    <div class="mdb-summary-card"><strong>Changed</strong><span>${changedModelKeys.size}</span></div>
  `;
  editorSummary.classList.toggle("hidden", !editorModels.length);
}

function renderEditorTypeOptions() {
  const current = editorTypeFilter.value;
  const types = [...new Set(editorModels.map((model) => model.assetType || "Model"))].sort();
  editorTypeFilter.textContent = "";
  editorTypeFilter.appendChild(new Option("All", ""));
  types.forEach((type) => editorTypeFilter.appendChild(new Option(type, type)));
  if (types.includes(current)) editorTypeFilter.value = current;
}

function renderEditorRows() {
  editorModelRows.textContent = "";
  const entries = filteredEditorEntries().slice(0, 250);
  if (!editorModels.length) {
    editorModelRows.appendChild(emptyEditorRow("Choose a model folder and scan to begin."));
  } else if (!entries.length) {
    editorModelRows.appendChild(emptyEditorRow("No loaded models match the current filters."));
  } else {
    entries.forEach(({ model, index }) => editorModelRows.appendChild(editorRow(model, index)));
  }

  const visibleCount = filteredEditorEntries().length;
  editorSelectAllButton.disabled = !visibleCount;
  editorClearSelectionButton.disabled = !selectedModelIndexes.size;
  const limitNote = cloneOutMode ? ` Max ${CLONE_OUT_SELECTION_LIMIT} at a time.` : "";
  editorSelectionSummary.textContent = selectedModelIndexes.size
    ? `${selectedModelIndexes.size} selected / ${visibleCount} shown.${limitNote}`
    : `No models selected. ${visibleCount} shown.${limitNote}`;
}

function editorRow(model, index) {
  const row = document.createElement("tr");
  row.className = [
    focusedModelIndex === index ? "is-focused" : "",
    selectedModelIndexes.has(index) ? "is-selected" : ""
  ].filter(Boolean).join(" ");
  row.setAttribute("aria-selected", selectedModelIndexes.has(index) ? "true" : "false");
  row.addEventListener("click", (event) => {
    if (event.target.type === "checkbox") return;
    handleEditorRowSelection(index, event, { checkboxClick: false });
  });
  row.addEventListener("contextmenu", (event) => showEditorContextMenu(event, index));

  const selectCell = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = selectedModelIndexes.has(index);
  checkbox.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleEditorRowSelection(index, event, { checkboxClick: true });
  });
  selectCell.appendChild(checkbox);

  const fileCell = document.createElement("td");
  const fileName = document.createElement("div");
  const filePath = document.createElement("div");
  fileName.className = "model-file-name";
  filePath.className = "model-file-path";
  fileName.textContent = model.fileName || "Unknown.mdb";
  filePath.textContent = model.relativePath || model.path || "";
  fileCell.append(fileName, filePath);

  const typeCell = document.createElement("td");
  typeCell.textContent = model.assetType || "Model";

  const flagsCell = document.createElement("td");
  flagsCell.className = "editor-textures-cell";
  flagsCell.appendChild(textureChips(model));

  row.append(selectCell, fileCell, typeCell, flagsCell);
  return row;
}

function ensureEditorContextMenu() {
  if (editorContextMenu) return editorContextMenu;

  const menu = document.createElement("div");
  const applyButton = document.createElement("button");
  const applyTitle = document.createElement("strong");
  const applySubtitle = document.createElement("span");
  const resetButton = document.createElement("button");
  const resetTitle = document.createElement("strong");
  const resetSubtitle = document.createElement("span");

  menu.className = "model-context-menu editor-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-hidden", "true");

  applyButton.type = "button";
  applyButton.setAttribute("role", "menuitem");
  applyButton.dataset.action = "apply";
  applyTitle.textContent = cloneOutMode ? "Create Changed Clone" : "Apply MDB Changes (All)";
  applySubtitle.textContent = cloneOutMode ? "Write a changed copy" : "Save queued edits to selected MDBs";
  applyButton.append(applyTitle, applySubtitle);
  applyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const targets = editingTargets();
    if (!canApplyEditorContextChanges(targets)) return;
    hideEditorContextMenu();
    saveFlagEdits(targets);
  });

  resetButton.type = "button";
  resetButton.setAttribute("role", "menuitem");
  resetButton.dataset.action = "reset-single";
  resetTitle.textContent = "Reset Changes (Single MDB)";
  resetSubtitle.textContent = "Remove this MDB from the pending batch";
  resetButton.append(resetTitle, resetSubtitle);
  resetButton.addEventListener("click", (event) => {
    event.stopPropagation();
    resetSingleContextModel();
    hideEditorContextMenu();
  });

  menu.append(applyButton, resetButton);
  document.body.appendChild(menu);
  editorContextMenu = menu;
  return menu;
}

function showEditorContextMenu(event, index) {
  event.preventDefault();
  event.stopPropagation();
  editorContextModelIndex = index;
  focusedModelIndex = index;
  renderEditorRows();
  renderFlagEditor();
  renderSavePreview();

  const menu = ensureEditorContextMenu();
  updateEditorContextMenuState(menu);
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

function updateEditorContextMenuState(menu) {
  const targets = editingTargets();
  const applyButton = menu.querySelector('[data-action="apply"]');
  const resetButton = menu.querySelector('[data-action="reset-single"]');
  const resetSubtitle = resetButton?.querySelector("span");
  const applySubtitle = applyButton?.querySelector("span");
  const canApply = canApplyEditorContextChanges(targets);
  const canReset = editorContextModelIndex !== null
    && (selectedModelIndexes.has(editorContextModelIndex) || targets.length === 1)
    && pendingChangeList().length > 0;

  if (applyButton) {
    applyButton.disabled = !canApply;
    if (applySubtitle) {
      applySubtitle.textContent = canApply
        ? cloneOutMode
          ? `Create ${targets.length} changed clone${targets.length === 1 ? "" : "s"}`
          : `Save queued edits to ${targets.length} MDB${targets.length === 1 ? "" : "s"}`
        : cloneOutMode ? "Check clone names and output folders" : "No queued MDB edits to save";
    }
  }
  if (resetButton) {
    resetButton.disabled = !canReset;
    if (resetSubtitle) {
      resetSubtitle.textContent = selectedModelIndexes.size > 1
        ? "Remove this MDB from the pending batch"
        : "Clear queued edits for this MDB";
    }
  }
}

function canApplyEditorContextChanges(targets) {
  if (cloneOutMode) {
    return canCloneOutTargets(targets);
  }
  return Boolean(
    targets.length
    && !selectionGuard(targets)
    && pendingChangeList().length
    && editorSourceMode === "folder"
    && targets.every((model) => isDiskPath(model.path))
  );
}

function resetSingleContextModel() {
  if (editorContextModelIndex === null) return;
  if (selectedModelIndexes.size > 1 && selectedModelIndexes.has(editorContextModelIndex)) {
    selectedModelIndexes.delete(editorContextModelIndex);
    if (focusedModelIndex === editorContextModelIndex) {
      focusedModelIndex = [...selectedModelIndexes][0] ?? editorContextModelIndex;
    }
    setEditorStatus("Removed one MDB from the pending batch.");
  } else {
    pendingEdits = emptyPendingEdits();
    setEditorStatus("Cleared queued changes for this MDB.");
  }
  renderEditorState();
}

function hideEditorContextMenu() {
  editorContextModelIndex = null;
  if (!editorContextMenu) return;
  editorContextMenu.classList.remove("is-open");
  editorContextMenu.setAttribute("aria-hidden", "true");
}

function handleEditorRowSelection(index, event, options = {}) {
  const hasRange = event.shiftKey && editorModels.length;
  const hasToggle = event.ctrlKey || event.metaKey;
  const nextSelection = new Set(selectedModelIndexes);

  if (hasRange) {
    const anchor = editorSelectionAnchorIndex ?? focusedModelIndex ?? index;
    const range = editorSelectionRange(anchor, index);
    if (!hasToggle) nextSelection.clear();
    range.forEach((entryIndex) => nextSelection.add(entryIndex));
  } else if (hasToggle || options.checkboxClick) {
    if (nextSelection.has(index)) nextSelection.delete(index);
    else nextSelection.add(index);
    editorSelectionAnchorIndex = index;
  } else {
    nextSelection.clear();
    nextSelection.add(index);
    editorSelectionAnchorIndex = index;
  }

  focusedModelIndex = index;
  selectedModelIndexes = limitCloneOutSelection(nextSelection, index);
  pendingEdits = emptyPendingEdits();
  refreshCloneOutName();
  renderEditorState();
}

function limitCloneOutSelection(selection, newestIndex = null) {
  if (!cloneOutMode || selection.size <= CLONE_OUT_SELECTION_LIMIT) return selection;
  const ordered = newestIndex !== null && selection.has(newestIndex)
    ? [newestIndex, ...[...selection].filter((index) => index !== newestIndex)]
    : [...selection];
  const limited = new Set(ordered.slice(0, CLONE_OUT_SELECTION_LIMIT));
  setEditorStatus(`Edit + Clone can prepare ${CLONE_OUT_SELECTION_LIMIT} MDBs at a time.`);
  return limited;
}

function editorSelectionRange(anchorIndex, targetIndex) {
  const visibleIndexes = filteredEditorEntries().map(({ index }) => index);
  const anchorPosition = visibleIndexes.indexOf(anchorIndex);
  const targetPosition = visibleIndexes.indexOf(targetIndex);
  if (anchorPosition >= 0 && targetPosition >= 0) {
    const start = Math.min(anchorPosition, targetPosition);
    const end = Math.max(anchorPosition, targetPosition);
    return visibleIndexes.slice(start, end + 1);
  }

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return editorModels
    .map((model, index) => (model && index >= start && index <= end ? index : null))
    .filter((index) => index !== null);
}

function emptyEditorRow(text) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 4;
  cell.textContent = text;
  row.appendChild(cell);
  return row;
}

function renderFlagEditor() {
  const targets = editingTargets();
  flagEditorPanel.textContent = "";
  const title = document.createElement("h2");
  title.textContent = cloneOutMode ? "Clone Editor" : "MDB Editor";
  flagEditorPanel.appendChild(title);

  if (!targets.length) {
    flagEditorPanel.appendChild(editorNotice("Select one model, or select several models of the same type."));
    return;
  }

  const guard = selectionGuard(targets);
  if (guard) {
    flagEditorPanel.appendChild(editorNotice(guard, true));
    return;
  }

  const meta = document.createElement("div");
  meta.className = "editor-target-meta";
  meta.innerHTML = `<strong>${cloneOutMode ? "Changed Copy" : targets.length === 1 ? "Single Edit" : "Batch Edit"}</strong><span>${targets.length} ${targets[0].assetType || "Model"}${targets.length === 1 ? "" : "s"}</span>`;
  flagEditorPanel.appendChild(meta);

  const groups = editableGroups(targets);
  if (!groups.length) {
    flagEditorPanel.appendChild(editorNotice("No supported editable flags were found for this selection."));
    return;
  }

  groups.forEach((group) => flagEditorPanel.appendChild(renderEditableGroup(group)));

  if (targets.length > 1) {
    const actions = document.createElement("div");
    actions.className = "editor-quick-actions";
    const matchFirst = document.createElement("button");
    const clearFlags = document.createElement("button");
    matchFirst.type = "button";
    clearFlags.type = "button";
    matchFirst.textContent = "Match First Selected";
    clearFlags.textContent = "Clear Visible Flags";
    matchFirst.addEventListener("click", () => matchFirstSelected(targets));
    clearFlags.addEventListener("click", () => clearVisibleFlags(groups));
    actions.append(matchFirst, clearFlags);
    flagEditorPanel.appendChild(actions);
  }
}

function renderEditableGroup(group) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = group.title;
  section.className = "editable-flag-group";
  section.appendChild(heading);

  if (group.kind === "material") {
    const grid = document.createElement("div");
    grid.className = "flag-grid editable-flag-grid";
    group.flags.forEach((flag) => grid.appendChild(editableFlagCheckbox(flag)));
    section.appendChild(grid);
  } else if (group.kind === "textures") {
    const controls = document.createElement("div");
    controls.className = "texture-edit-controls";
    group.references.forEach((reference) => controls.appendChild(textureReferenceControl(reference)));
    section.appendChild(controls);
  } else if (group.kind === "material-values") {
    const controls = document.createElement("div");
    controls.className = "material-edit-controls";
    group.values.forEach((value) => controls.appendChild(materialValueControl(value)));
    section.appendChild(controls);
  } else {
    const options = document.createElement("div");
    options.className = "editor-choice-row";
    group.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = option.active ? "is-active" : "";
      button.textContent = option.label;
      button.addEventListener("click", () => {
        pendingEdits[group.key] = option.value;
        renderEditorState();
      });
      options.appendChild(button);
    });
    section.appendChild(options);
  }

  return section;
}

function textureReferenceControl(reference) {
  const wrap = document.createElement("label");
  const heading = document.createElement("span");
  const row = document.createElement("div");
  const badge = document.createElement("strong");
  const input = document.createElement("input");
  const clearButton = document.createElement("button");
  const changed = Object.prototype.hasOwnProperty.call(pendingEdits.textureReferences, reference.key);
  wrap.className = changed ? "texture-edit-control has-pending-change" : "texture-edit-control";
  heading.textContent = reference.label;
  if (changed) {
    const changeToken = document.createElement("em");
    changeToken.className = "texture-change-token";
    changeToken.textContent = "Change detected";
    heading.appendChild(changeToken);
  }
  row.className = "texture-edit-row";
  badge.textContent = reference.short;
  input.type = "text";
  input.value = reference.mixed ? "" : reference.value;
  input.className = changed ? "has-pending-change" : "";
  input.placeholder = reference.mixed ? "Mixed - type to replace selected" : "Leave unchanged";
  input.maxLength = 31;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.addEventListener("input", () => {
    const next = textureInputValue(input.value);
    if (next) pendingEdits.textureReferences[reference.key] = next;
    else delete pendingEdits.textureReferences[reference.key];
    renderSavePreview();
    renderEditorSummary();
  });
  clearButton.type = "button";
  clearButton.textContent = "Clear";
  clearButton.title = `Clear ${reference.label} for the selected MDB${editingTargets().length === 1 ? "" : "s"}.`;
  clearButton.addEventListener("click", () => {
    pendingEdits.textureReferences[reference.key] = "";
    renderEditorState();
  });
  row.append(badge, input, clearButton);
  wrap.append(heading, row);
  return wrap;
}

function materialValueControl(value) {
  const wrap = document.createElement("div");
  wrap.className = value.type === "color" ? "material-edit-control color-control" : "material-edit-control";
  const title = document.createElement("span");
  title.textContent = value.label;
  wrap.appendChild(title);

  if (value.type === "color") {
    const colorRow = document.createElement("div");
    const swatch = document.createElement("span");
    const picker = document.createElement("input");
    const rgb = document.createElement("span");
    colorRow.className = "material-color-row";
    swatch.className = "material-color-gradient";
    swatch.style.setProperty("--picked-color", rgbCss(value.value));
    picker.type = "color";
    picker.value = rgbToHex(value.value);
    rgb.className = "material-rgb-readout";
    rgb.textContent = value.mixed ? "RGB values: Mixed" : `RGB values: [${rgb255(value.value).join(", ")}]`;
    picker.addEventListener("input", () => {
      pendingEdits.materialValues[value.key] = hexToRgb(picker.value);
      renderEditorState();
    });
    colorRow.append(swatch, picker, rgb);
    wrap.appendChild(colorRow);
    if (value.key === "diffuseColor") {
      const favoriteActions = document.createElement("div");
      const favoriteButton = document.createElement("button");
      const clearFavoritesButton = document.createElement("button");
      favoriteActions.className = "material-favorite-actions";
      favoriteButton.type = "button";
      favoriteButton.className = "material-favorite-button";
      favoriteButton.textContent = "Add Favorite";
      favoriteButton.title = "Add the current diffuse color to the favorite slots.";
      favoriteButton.addEventListener("click", () => addDiffuseFavorite(currentMaterialEditValue(value)));
      clearFavoritesButton.type = "button";
      clearFavoritesButton.className = "material-favorite-button";
      clearFavoritesButton.textContent = "Clear";
      clearFavoritesButton.title = "Clear saved diffuse color favorites.";
      clearFavoritesButton.disabled = diffuseColorFavorites.length === 0;
      clearFavoritesButton.addEventListener("click", clearDiffuseFavorites);
      favoriteActions.append(favoriteButton, clearFavoritesButton);
      wrap.appendChild(favoriteActions);
    }
    if (value.palette === "diffuse") {
      wrap.appendChild(diffusePresetRow(value));
    }
    if (value.palette === "specular") {
      wrap.appendChild(specularPresetRow(value));
    }
    return wrap;
  }

  const row = document.createElement("div");
  const slider = document.createElement("input");
  const number = document.createElement("input");
  row.className = "material-number-row";
  slider.type = "range";
  slider.min = value.min;
  slider.max = value.max;
  slider.step = value.step;
  slider.value = value.mixed ? value.min : value.value;
  number.type = "number";
  number.min = value.min;
  number.max = value.max;
  number.step = value.step;
  number.placeholder = value.mixed ? "Mixed" : "";
  number.value = value.mixed ? "" : Number(value.value).toFixed(3);
  slider.addEventListener("input", () => {
    const next = Number(slider.value);
    pendingEdits.materialValues[value.key] = next;
    number.value = next.toFixed(3);
    renderSavePreview();
    renderEditorSummary();
  });
  number.addEventListener("change", () => {
    pendingEdits.materialValues[value.key] = clamp(Number(number.value || 0), Number(value.min), Number(value.max));
    renderEditorState();
  });
  row.append(slider, number);
  wrap.appendChild(row);

  return wrap;
}

function diffusePresetRow(value) {
  const row = document.createElement("div");
  row.className = "material-preset-row diffuse-preset-row";
  DIFFUSE_COLOR_PRESETS.forEach(([name, color]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.title = name;
    button.setAttribute("aria-label", `Set diffuse color to ${name}`);
    button.style.setProperty("--preset-color", rgbCss(color));
    button.className = sameMaterialValue(value.value, color) && !value.mixed ? "is-active" : "";
    button.textContent = "";
    button.addEventListener("click", () => {
      pendingEdits.materialValues.diffuseColor = [...color];
      renderEditorState();
    });
    row.appendChild(button);
  });
  for (let index = 0; index < DIFFUSE_FAVORITE_SLOTS; index += 1) {
    const color = diffuseColorFavorites[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = color && sameMaterialValue(value.value, color) && !value.mixed ? "is-favorite is-active" : "is-favorite";
    button.title = color ? `Favorite ${index + 1}` : `Favorite slot ${index + 1}`;
    button.setAttribute("aria-label", color ? `Set diffuse color to favorite ${index + 1}` : `Empty diffuse favorite slot ${index + 1}`);
    button.style.setProperty("--preset-color", color ? rgbCss(color) : "transparent");
    button.textContent = color ? "" : "+";
    button.disabled = !color;
    button.addEventListener("click", () => {
      if (!color) return;
      pendingEdits.materialValues.diffuseColor = [...color];
      renderEditorState();
    });
    row.appendChild(button);
  }
  return row;
}

function specularPresetRow(value) {
  const row = document.createElement("div");
  row.className = "material-preset-row specular-preset-row";
  SPECULAR_COLOR_PRESETS.forEach((preset) => {
    const tone = Math.round((preset / 100) * 255);
    const color = [preset / 100, preset / 100, preset / 100];
    const button = document.createElement("button");
    button.type = "button";
    button.title = `${preset}% gray`;
    button.setAttribute("aria-label", `Set specular color to ${preset}% gray`);
    button.style.setProperty("--preset-color", `rgb(${tone}, ${tone}, ${tone})`);
    button.className = sameMaterialValue(value.value, color) && !value.mixed ? "is-active" : "";
    button.textContent = `${preset}`;
    button.addEventListener("click", () => {
      pendingEdits.materialValues.specularColor = [...color];
      renderEditorState();
    });
    row.appendChild(button);
  });
  return row;
}

function currentMaterialEditValue(value) {
  return Array.isArray(pendingEdits.materialValues[value.key])
    ? pendingEdits.materialValues[value.key]
    : value.value;
}

function addDiffuseFavorite(color) {
  if (!Array.isArray(color)) return;
  const next = color.map((channel) => clamp(Number(channel), 0, 1));
  const existingIndex = diffuseColorFavorites.findIndex((favorite) => sameMaterialValue(favorite, next));
  if (existingIndex >= 0) {
    diffuseColorFavorites.splice(existingIndex, 1);
  }
  diffuseColorFavorites.unshift(next);
  diffuseColorFavorites = diffuseColorFavorites.slice(0, DIFFUSE_FAVORITE_SLOTS);
  saveDiffuseFavorites();
  renderEditorState();
}

function clearDiffuseFavorites() {
  diffuseColorFavorites = [];
  saveDiffuseFavorites();
  renderEditorState();
}

function editableFlagCheckbox(flag) {
  const label = document.createElement("label");
  label.className = "flag-box editable-flag-box";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = flag.checked;
  input.indeterminate = flag.mixed;
  input.addEventListener("change", () => {
    pendingEdits.materialFlags[flag.key] = input.checked;
    renderEditorState();
  });
  const visual = document.createElement("span");
  visual.className = "flag-check";
  visual.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = flag.label;
  label.append(input, visual, text);
  return label;
}

function renderSavePreview() {
  savePreviewPanel.textContent = "";
  editorResultSummary.classList.add("hidden");
  if (cloneOutMode) {
    renderCloneOutPreview();
    return;
  }
  const targets = editingTargets();
  const guard = selectionGuard(targets);
  const changes = pendingChangeList();
  if (!targets.length || guard || !changes.length) {
    savePreviewPanel.classList.add("hidden");
    return;
  }

  const title = document.createElement("h2");
  const body = document.createElement("p");
  const list = document.createElement("ul");
  const saveButton = document.createElement("button");
  title.textContent = "Save Preview";
  body.textContent = `This will save over ${targets.length} MDB file${targets.length === 1 ? "" : "s"}.`;
  changes.forEach((change) => {
    const item = document.createElement("li");
    item.textContent = change;
    list.appendChild(item);
  });
  saveButton.type = "button";
  saveButton.textContent = "Save MDB Changes";
  saveButton.disabled = editorSourceMode !== "folder" || !targets.every((model) => isDiskPath(model.path));
  saveButton.addEventListener("click", () => saveFlagEdits(targets));

  savePreviewPanel.append(title, body, list);
  if (saveButton.disabled) {
    savePreviewPanel.appendChild(editorNotice("Imported files are inspect-only. Scan a folder to save changes.", true));
  }
  savePreviewPanel.appendChild(saveButton);
  savePreviewPanel.classList.remove("hidden");
}

function renderCloneOutPreview() {
  const targets = editingTargets();
  const guard = selectionGuard(targets);
  if (!targets.length || guard) {
    savePreviewPanel.classList.add("hidden");
    return;
  }

  const changes = pendingChangeList();
  const jobs = buildCloneOutJobs(targets);
  const uploadOnlyBlocked = editorSourceMode === "import" && targets.length !== 1;
  const hasUploadFile = editorSourceMode !== "import" || Boolean(uploadFileForModel(targets[0]));
  const missingNames = jobs.some((job) => !job.newName);
  const missingImportOutput = editorSourceMode === "import" && jobs.some((job) => !job.outputDir);
  const canClone = Boolean(jobs.length && !missingNames && !missingImportOutput && !uploadOnlyBlocked && hasUploadFile);

  const title = document.createElement("h2");
  const body = document.createElement("p");
  const list = document.createElement("ul");
  const createButton = document.createElement("button");
  const plan = document.createElement("div");

  title.textContent = "Clone Preview";
  body.textContent = `This will create ${targets.length} changed MDB cop${targets.length === 1 ? "y" : "ies"}. Originals stay untouched.`;
  plan.className = "preview-list";
  plan.appendChild(cloneOutPlanEditor(jobs));

  (changes.length ? changes : ["No material edits queued. The clone will still sync internal names to the new MDB name."]).forEach((change) => {
    const item = document.createElement("li");
    item.textContent = change;
    list.appendChild(item);
  });

  createButton.type = "button";
  createButton.textContent = "Create Changed Clone";
  createButton.className = "clone-out-create-button";
  createButton.disabled = !canClone;
  createButton.addEventListener("click", () => saveFlagEdits(targets));

  savePreviewPanel.append(title, body, plan, list);
  if (editorSourceMode !== "import") savePreviewPanel.appendChild(editorNotice("Output folders can be left blank to clone into each source folder."));
  if (missingImportOutput) savePreviewPanel.appendChild(editorNotice("Imported MDBs need an output folder because they do not have a source folder on disk.", true));
  if (missingNames) savePreviewPanel.appendChild(editorNotice("Choose a new MDB name.", true));
  if (uploadOnlyBlocked) savePreviewPanel.appendChild(editorNotice("Imported clone-out currently writes one source MDB at a time. Select one MDB, or scan a folder for batch clone-out.", true));
  if (!hasUploadFile) savePreviewPanel.appendChild(editorNotice("This imported MDB is no longer attached. Re-import it to create the clone.", true));
  savePreviewPanel.appendChild(createButton);
  savePreviewPanel.classList.remove("hidden");
}

function cloneOutPlanEditor(jobs) {
  const wrap = document.createElement("div");
  wrap.className = "clone-out-plan-editor";
  jobs.slice(0, CLONE_OUT_SELECTION_LIMIT).forEach((job) => {
    const key = modelKey(job.model);
    const row = document.createElement("div");
    const source = document.createElement("strong");
    const outputField = document.createElement("label");
    const outputInput = document.createElement("input");
    const nameField = document.createElement("label");
    const nameInput = document.createElement("input");
    const chooseButton = document.createElement("button");

    row.className = "clone-out-plan-row";
    source.textContent = stem(job.model.fileName);

    outputField.className = "field";
    outputField.appendChild(document.createElement("span"));
    outputField.firstChild.textContent = "Output";
    outputInput.type = "text";
    outputInput.spellcheck = false;
    outputInput.placeholder = editorSourceMode === "import" ? "Choose an output folder" : "Blank = same source folder";
    outputInput.value = job.outputDir;
    outputInput.addEventListener("input", () => {
      updateCloneOutModelSetting(key, "outputDir", outputInput.value);
      updateCloneOutCreateButtonState();
    });
    outputField.appendChild(outputInput);

    chooseButton.type = "button";
    chooseButton.textContent = "Choose";
    chooseButton.addEventListener("click", () => chooseCloneOutRowFolder(key, outputInput));

    nameField.className = "field";
    nameField.appendChild(document.createElement("span"));
    nameField.firstChild.textContent = "MDB Name";
    nameInput.type = "text";
    nameInput.maxLength = 31;
    nameInput.spellcheck = false;
    nameInput.value = job.newName;
    nameInput.addEventListener("input", () => {
      const nextName = cleanFixedName(nameInput.value);
      updateCloneOutModelSetting(key, "newName", nextName);
      syncCloneNameSlotForModel(key, nextName);
      updateCloneOutCreateButtonState();
    });
    nameField.appendChild(nameInput);

    row.append(source, outputField, chooseButton, nameField);
    wrap.appendChild(row);
  });
  return wrap;
}

async function chooseCloneOutRowFolder(key, input) {
  try {
    const response = await fetch("/api/dialog/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialDir: input.value.trim() || cloneOutputPathField?.value.trim() || editorRootPathField.value.trim() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not choose output folder.");
    if (!result.folder) return;
    input.value = result.folder;
    updateCloneOutModelSetting(key, "outputDir", result.folder);
    updateCloneOutCreateButtonState();
    setEditorStatus("Output folder selected for this clone.");
  } catch (error) {
    setEditorStatus(error.message, true);
  }
}

function updateCloneOutModelSetting(key, field, value) {
  const current = cloneOutModelSettings.get(key) || {};
  cloneOutModelSettings.set(key, { ...current, [field]: value });
}

function syncCloneNameSlotForModel(key, value) {
  const targets = editingTargets();
  const slot = targets.findIndex((model) => modelKey(model) === key);
  if (slot < 0 || !cloneNameSlotFields[slot]) return;
  cloneNameSlotFields[slot].value = value;
}

function updateCloneOutCreateButtonState() {
  const button = savePreviewPanel.querySelector(".clone-out-create-button");
  if (!button) return;
  button.disabled = !canCloneOutTargets(editingTargets());
}

function canCloneOutTargets(targets) {
  if (!targets.length || selectionGuard(targets)) return false;
  const jobs = buildCloneOutJobs(targets);
  if (jobs.some((job) => !job.newName)) return false;
  if (editorSourceMode === "import") return targets.length === 1 && Boolean(uploadFileForModel(targets[0])) && Boolean(jobs[0]?.outputDir);
  return true;
}

async function saveFlagEdits(targets) {
  if (cloneOutMode) {
    await saveCloneOutEdits(targets);
    return;
  }
  const jobs = targets.map((model) => ({
    path: model.path,
    materialFlags: { ...pendingEdits.materialFlags },
    materialValues: { ...pendingEdits.materialValues },
    textureReferences: { ...pendingEdits.textureReferences },
    ...(pendingEdits.hairShortening !== undefined ? { hairShortening: pendingEdits.hairShortening } : {}),
    ...(pendingEdits.helmetHairHiding !== undefined ? { helmetHairHiding: pendingEdits.helmetHairHiding } : {})
  }));

  setEditorStatus("Saving MDB flag changes...");
  try {
    const response = await fetch("/api/mdb/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rootPath: editorRootPathField.value.trim(),
        recursive: editorRecursiveField.checked,
        jobs
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save MDB changes.");
    replaceUpdatedModels(result.models || []);
    (result.results || []).forEach((item) => changedModelKeys.add(modelKey(item.model || item)));
    pendingEdits = emptyPendingEdits();
    localStorage.setItem("neverwinterForge.mdbScanDirty", String(Date.now()));
    renderEditorState();
    renderEditorReceipt(result);
    setEditorStatus(`Saved ${result.saved} MDB file${result.saved === 1 ? "" : "s"}.`);
  } catch (error) {
    setEditorStatus(error.message, true);
  }
}

async function saveCloneOutEdits(targets) {
  const outputDir = cloneOutputPathField?.value.trim() || "";
  const jobs = buildCloneOutJobs(targets).map((job) => ({
    path: job.model.path,
    newName: job.newName,
    outputDir: job.outputDir,
    materialFlags: { ...pendingEdits.materialFlags },
    materialValues: { ...pendingEdits.materialValues },
    textureReferences: { ...pendingEdits.textureReferences },
    ...(pendingEdits.hairShortening !== undefined ? { hairShortening: pendingEdits.hairShortening } : {}),
    ...(pendingEdits.helmetHairHiding !== undefined ? { helmetHairHiding: pendingEdits.helmetHairHiding } : {})
  }));

  setEditorStatus("Creating changed clone...");
  try {
    let response;
    if (editorSourceMode === "import") {
      const target = targets[0];
      const uploadFile = uploadFileForModel(target);
      const form = new FormData();
      form.append("files", uploadFile, target.relativePath || target.fileName);
      form.append("outputDir", jobs[0]?.outputDir || outputDir);
      form.append("newName", jobs[0]?.newName || "");
      form.append("conflictMode", cloneConflictModeField?.value || "auto");
      form.append("job", JSON.stringify(jobs[0] || {}));
      response = await fetch("/api/mdb/edit-clone-upload", { method: "POST", body: form });
    } else {
      response = await fetch("/api/mdb/edit-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputDir,
          conflictMode: cloneConflictModeField?.value || "auto",
          jobs
        })
      });
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not create changed clone.");
    pendingEdits = emptyPendingEdits();
    renderEditorState();
    renderCloneOutReceipt(result);
    if ((result.errors || []).length && !result.copied) {
      setEditorStatus("No changed clones were created. Check the result details.", true);
    } else if ((result.errors || []).length) {
      setEditorStatus(`Created ${result.copied} changed MDB clone${result.copied === 1 ? "" : "s"} with ${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}.`, true);
    } else {
      setEditorStatus(`Created ${result.copied} changed MDB clone${result.copied === 1 ? "" : "s"}.`);
    }
  } catch (error) {
    setEditorStatus(error.message, true);
  }
}

function renderEditorReceipt(result) {
  editorResultSummary.textContent = "";
  const line = document.createElement("strong");
  line.textContent = `Saved ${result.saved} / ${(result.results || []).length} selected MDB file${(result.results || []).length === 1 ? "" : "s"}.`;
  editorResultSummary.appendChild(line);
  if (result.errors?.length) {
    result.errors.forEach((error) => {
      const item = document.createElement("div");
      item.textContent = `${error.path}: ${error.error}`;
      editorResultSummary.appendChild(item);
    });
  }
  editorResultSummary.classList.remove("hidden");
}

function renderCloneOutReceipt(result) {
  editorResultSummary.textContent = "";
  const line = document.createElement("strong");
  const skipped = (result.skipped || []).length;
  line.textContent = `Created ${result.copied || 0} changed clone${result.copied === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`;
  editorResultSummary.appendChild(line);
  const details = document.createElement("div");
  details.className = "batch-result-details";
  (result.results || []).slice(0, 5).forEach((item) => {
    const row = document.createElement("span");
    row.textContent = `Created: ${item.newName || stem(item.outputPath || "")}`;
    details.appendChild(row);
  });
  (result.errors || []).slice(0, 5).forEach((error) => {
    const row = document.createElement("span");
    row.textContent = `Error: ${error.error}`;
    details.appendChild(row);
  });
  if (details.children.length) editorResultSummary.appendChild(details);
  editorResultSummary.classList.remove("hidden");
}

function editableGroups(targets) {
  const groups = [];
  if (targets.some((model) => primaryMaterialPacket(model))) {
    const materialFlags = MATERIAL_FLAG_DEFINITIONS.map(([key, label]) => flagState(targets, key, label));
    groups.push({ kind: "material", title: "Material Flags", flags: materialFlags });
    groups.push({
      kind: "textures",
      title: "Textures",
      references: TEXTURE_REFERENCE_FIELDS.map((field) => textureReferenceState(targets, field))
    });
    groups.push({
      kind: "material-values",
      title: "Color & Shine",
      values: MATERIAL_VALUE_DEFINITIONS.map((definition) => materialValueState(targets, definition))
    });
  }

  if (targets.some((model) => hairPacket(model))) {
    groups.push(choiceGroup(targets, "hairShortening", "Hair Shape", HAIR_FLAG_DEFINITIONS, (model) => hairPacket(model)?.behavior?.hairShortening));
  }

  if (targets.some((model) => helmPacket(model))) {
    groups.push(choiceGroup(targets, "helmetHairHiding", "Helmet Visibility", HELMET_FLAG_DEFINITIONS, (model) => helmPacket(model)?.behavior?.helmetHairHiding));
  }

  return groups;
}

function textureReferenceState(targets, field) {
  const override = pendingEdits.textureReferences[field.key];
  if (override !== undefined) {
    return { ...field, value: override, mixed: false };
  }

  const values = targets.map((model) => primaryMaterialPacket(model)?.material?.[field.key] || "");
  const first = values[0] || "";
  const mixed = values.some((value) => value !== first);
  return { ...field, value: mixed ? "" : first, mixed };
}

function materialValueState(targets, definition) {
  const override = pendingEdits.materialValues[definition.key];
  if (override !== undefined) {
    return { ...definition, value: override, mixed: false };
  }

  const values = targets
    .map((model) => primaryMaterialPacket(model)?.material?.[definition.key])
    .filter((value) => value !== undefined && value !== null);
  if (!values.length) return { ...definition, value: definition.type === "color" ? [1, 1, 1] : 0, mixed: false };
  const first = values[0];
  const mixed = values.some((value) => !sameMaterialValue(value, first));
  return {
    ...definition,
    value: mixed ? defaultMixedValue(definition) : first,
    mixed
  };
}

function flagState(targets, key, label) {
  const values = targets.map((model) => Boolean(primaryMaterialPacket(model)?.material?.renderingOptions?.[key]));
  const override = pendingEdits.materialFlags[key];
  if (override !== undefined) return { key, label, checked: Boolean(override), mixed: false };
  const allOn = values.every(Boolean);
  const allOff = values.every((value) => !value);
  return { key, label, checked: allOn, mixed: !allOn && !allOff };
}

function choiceGroup(targets, key, title, definitions, reader) {
  const override = pendingEdits[key];
  const values = targets.map(reader).filter(Boolean);
  const same = values.length && values.every((value) => value === values[0]) ? values[0] : null;
  return {
    kind: "choice",
    key,
    title,
    options: definitions.map(([value, label]) => ({
      value,
      label,
      active: override !== undefined ? override === value : same === value
    }))
  };
}

function pendingChangeList() {
  const changes = [];
  Object.entries(pendingEdits.materialFlags).forEach(([key, enabled]) => {
    const label = MATERIAL_FLAG_DEFINITIONS.find(([flagKey]) => flagKey === key)?.[1] || key;
    changes.push(`${enabled ? "Enable" : "Disable"} ${label}`);
  });
  Object.entries(pendingEdits.materialValues).forEach(([key, value]) => {
    const label = MATERIAL_VALUE_DEFINITIONS.find((definition) => definition.key === key)?.label || key;
    const formatted = Array.isArray(value)
      ? `[${rgb255(value).join(", ")}]`
      : Number(value).toFixed(3);
    changes.push(`Set ${label} to ${formatted}`);
  });
  Object.entries(pendingEdits.textureReferences).forEach(([key, value]) => {
    const label = TEXTURE_REFERENCE_FIELDS.find((field) => field.key === key)?.label || key;
    changes.push(value ? `Set ${label} texture to ${value}` : `Clear ${label} texture`);
  });
  if (pendingEdits.hairShortening !== undefined) changes.push(`Set Hair Shape to ${pendingEdits.hairShortening}`);
  if (pendingEdits.helmetHairHiding !== undefined) changes.push(`Set Helmet Visibility to ${pendingEdits.helmetHairHiding}`);
  return changes;
}

function matchFirstSelected(targets) {
  const first = targets[0];
  const material = primaryMaterialPacket(first)?.material || {};
  MATERIAL_FLAG_DEFINITIONS.forEach(([key]) => {
    pendingEdits.materialFlags[key] = Boolean(material.renderingOptions?.[key]);
  });
  MATERIAL_VALUE_DEFINITIONS.forEach((definition) => {
    if (material[definition.key] !== undefined) {
      pendingEdits.materialValues[definition.key] = Array.isArray(material[definition.key])
        ? [...material[definition.key]]
        : material[definition.key];
    }
  });
  TEXTURE_REFERENCE_FIELDS.forEach((field) => {
    pendingEdits.textureReferences[field.key] = material[field.key] || "";
  });
  const hair = hairPacket(first)?.behavior?.hairShortening;
  const helm = helmPacket(first)?.behavior?.helmetHairHiding;
  if (hair) pendingEdits.hairShortening = hair;
  if (helm) pendingEdits.helmetHairHiding = helm;
  renderEditorState();
}

function clearVisibleFlags(groups) {
  groups.filter((group) => group.kind === "material").forEach((group) => {
    group.flags.forEach((flag) => {
      pendingEdits.materialFlags[flag.key] = false;
    });
  });
  renderEditorState();
}

function editingTargets() {
  const selected = [...selectedModelIndexes].map((index) => editorModels[index]).filter(Boolean);
  if (selected.length) return selected;
  return focusedModelIndex !== null && editorModels[focusedModelIndex] ? [editorModels[focusedModelIndex]] : [];
}

function selectionGuard(targets) {
  if (!targets.length) return "";
  if (cloneOutMode && targets.length > CLONE_OUT_SELECTION_LIMIT) return `Edit + Clone supports up to ${CLONE_OUT_SELECTION_LIMIT} MDBs at a time.`;
  const types = new Set(targets.map((model) => model.assetType || "Model"));
  if (types.size > 1) return "Batch editing is locked until selected models are the same type.";
  return "";
}

function filteredEditorEntries() {
  const search = editorSearchField.value.trim().toLowerCase();
  const type = editorTypeFilter.value;
  return editorModels
    .map((model, index) => ({ model, index }))
    .filter(({ model, index }) => {
      if (type && model.assetType !== type) return false;
      if (editorSelectedOnlyField.checked && !selectedModelIndexes.has(index)) return false;
      if (editorChangedOnlyField.checked && !changedModelKeys.has(modelKey(model))) return false;
      if (!search) return true;
      return [
        model.fileName,
        model.relativePath,
        model.assetType,
        flagSummaryText(model),
        textureReferences(model).map((item) => item.value).join(" ")
      ].join(" ").toLowerCase().includes(search);
    });
}

function replaceUpdatedModels(models) {
  const byKey = new Map(models.map((model) => [modelKey(model), model]));
  editorModels = editorModels.map((model) => byKey.get(modelKey(model)) || model);
}

function flagSummaryChips(model) {
  const wrap = document.createElement("div");
  wrap.className = "texture-chip-row";
  const flags = flagSummaryText(model).split(", ").filter(Boolean).slice(0, 5);
  if (!flags.length) {
    const muted = document.createElement("span");
    muted.className = "muted-chip";
    muted.textContent = "None";
    wrap.appendChild(muted);
    return wrap;
  }
  flags.forEach((flag) => {
    const chip = document.createElement("span");
    chip.className = "texture-chip";
    chip.textContent = flag;
    wrap.appendChild(chip);
  });
  return wrap;
}

function textureChips(model) {
  const wrap = document.createElement("div");
  wrap.className = "texture-chip-row editor-texture-chip-row";
  const refs = textureReferences(model).filter((item) => item.value);
  if (!refs.length) {
    const muted = document.createElement("span");
    muted.className = "muted-chip";
    muted.textContent = "None";
    wrap.appendChild(muted);
    return wrap;
  }

  refs.slice(0, 4).forEach((item) => {
    const chip = document.createElement("span");
    const kind = document.createElement("strong");
    const text = document.createElement("span");
    chip.className = "texture-chip";
    kind.textContent = item.short;
    text.textContent = item.value;
    chip.title = `${item.label}: ${item.value}`;
    chip.append(kind, text);
    wrap.appendChild(chip);
  });
  return wrap;
}

function textureReferences(model) {
  const material = primaryMaterialPacket(model)?.material || {};
  return TEXTURE_REFERENCE_FIELDS.map((field) => ({
    ...field,
    value: material[field.key] || ""
  }));
}

function flagSummaryText(model) {
  const packet = primaryMaterialPacket(model);
  const active = MATERIAL_FLAG_DEFINITIONS
    .filter(([key]) => packet?.material?.renderingOptions?.[key])
    .map(([, label]) => label);
  const hair = hairPacket(model)?.behavior?.hairShortening;
  const helm = helmPacket(model)?.behavior?.helmetHairHiding;
  if (hair) active.push(`Hair: ${hair}`);
  if (helm) active.push(`Helmet: ${helm}`);
  return active.join(", ");
}

function primaryMaterialPacket(model) {
  const packets = nonLodPackets(model);
  return packets.find((packet) => ["SKIN", "RIGD"].includes(packet.type) && packet.material && Object.keys(packet.material).length)
    || packets.find((packet) => packet.material && Object.keys(packet.material).length);
}

function hairPacket(model) {
  return nonLodPackets(model).find((packet) => packet.type === "HAIR");
}

function helmPacket(model) {
  return nonLodPackets(model).find((packet) => packet.type === "HELM");
}

function nonLodPackets(model) {
  return (model.packets || []).filter((packet) => !/(?:_L\d+|_LO\d+|_LOD\d+)$/i.test(String(packet.name || "")));
}

function editorNotice(text, isWarning = false) {
  const notice = document.createElement("p");
  notice.className = isWarning ? "editor-notice is-warning" : "editor-notice";
  notice.textContent = text;
  return notice;
}

function emptyPendingEdits() {
  return { materialFlags: {}, materialValues: {}, textureReferences: {} };
}

function buildCloneOutJobs(targets) {
  return targets.map((model, index) => ({
    model,
    newName: cleanFixedName(cloneOutModelSettings.get(modelKey(model))?.newName || cloneNameSlotFields[index]?.value.trim() || defaultCloneOutName(model)),
    outputDir: cloneOutModelSettings.get(modelKey(model))?.outputDir || cloneOutputPathField?.value.trim() || ""
  }));
}

function defaultCloneOutName(model) {
  return `${stem(model?.fileName || "Model")}_Edited`.slice(0, 31);
}

function refreshCloneOutName() {
  if (!cloneOutMode) return;
  const targets = editingTargets();
  cloneNameSlotFields.forEach((field, index) => {
    const target = targets[index];
    const label = field.closest("label")?.querySelector("[data-clone-name-label]");
    field.disabled = !target;
    if (target) {
      const defaultName = defaultCloneOutName(target);
      field.placeholder = defaultName;
      field.value = cloneOutModelSettings.get(modelKey(target))?.newName || defaultName;
      if (label) label.textContent = `Name ${index + 1}`;
    } else {
      field.value = "";
      field.placeholder = "Select a model";
      if (label) label.textContent = `Name ${index + 1}`;
    }
  });
}

function uploadFileForModel(model) {
  if (!model) return null;
  return uploadedEditorFileMap.get(normalizeUploadKey(model.relativePath))
    || uploadedEditorFileMap.get(normalizeUploadKey(model.path))
    || uploadedEditorFileMap.get(normalizeUploadKey(model.fileName))
    || null;
}

function normalizeUploadKey(value) {
  return String(value || "").replace(/\\/g, "/").toLowerCase();
}

function cleanFixedName(value) {
  return String(value || "")
    .replace(/\.[^.]+$/i, "")
    .replace(/[<>:"/\\|?*]/g, "")
    .trim()
    .slice(0, 31);
}

function stem(fileName) {
  return String(fileName || "").split(/[\\/]/).pop().replace(/\.[^.]+$/i, "");
}

function sameMaterialValue(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => Math.abs(Number(value) - Number(right[index])) < 0.0001);
  }
  return Math.abs(Number(left) - Number(right)) < 0.0001;
}

function defaultMixedValue(definition) {
  return definition.type === "color" ? [0.5, 0.5, 0.5] : 0;
}

function rgbToHex(value) {
  const parts = (Array.isArray(value) ? value : [1, 1, 1]).map((channel) => {
    const number = Math.round(clamp(Number(channel), 0, 1) * 255);
    return number.toString(16).padStart(2, "0");
  });
  return `#${parts.join("")}`;
}

function rgb255(value) {
  return (Array.isArray(value) ? value : [1, 1, 1]).map((channel) => Math.round(clamp(Number(channel), 0, 1) * 255));
}

function loadDiffuseFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DIFFUSE_FAVORITES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value) => Array.isArray(value) && value.length >= 3)
      .map((value) => value.slice(0, 3).map((channel) => clamp(Number(channel), 0, 1)))
      .slice(0, DIFFUSE_FAVORITE_SLOTS);
  } catch {
    return [];
  }
}

function saveDiffuseFavorites() {
  localStorage.setItem(DIFFUSE_FAVORITES_KEY, JSON.stringify(diffuseColorFavorites));
}

function hexToRgb(value) {
  const clean = String(value || "#ffffff").replace("#", "");
  return [0, 2, 4].map((start) => parseInt(clean.slice(start, start + 2), 16) / 255);
}

function rgbCss(value) {
  const channels = (Array.isArray(value) ? value : [1, 1, 1]).map((channel) => Math.round(clamp(Number(channel), 0, 1) * 255));
  return `rgb(${channels.join(", ")})`;
}

function textureInputValue(value) {
  const trimmed = String(value || "").trim();
  const withoutExtension = trimmed.replace(/\.(dds|tga|png|jpe?g|webp)$/i, "");
  return withoutExtension.replace(/[<>:"/\\|?*]/g, "").slice(0, 31);
}

function clamp(value, lower, upper) {
  return Math.max(lower, Math.min(upper, value));
}

function modelKey(model) {
  return String(model?.path || model?.fileName || "").toLowerCase();
}

function isDiskPath(path) {
  const value = String(path || "");
  return /^[a-z]:\\/i.test(value) || value.startsWith("/") || value.startsWith("\\\\");
}

function setEditorStatus(message, isError = false) {
  editorStatusEl.textContent = message;
  editorStatusEl.classList.toggle("is-error", Boolean(isError));
}
